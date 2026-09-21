# What the country of 1836 changes in play: the hunt, the logs and the fence

**Status: researched, designed and built 2026-09-19.** The third session of the owner's biome work: [BIOMES.md](BIOMES.md) is
the research and the map (§13 there is what the second session built); this is what the new biomes change in the game, why,
and what it did to the balance, measured before and after. Read it with [WOODS_AND_BUILDING.md](WOODS_AND_BUILDING.md)
(hunting, felling, the house), [LAND_GRANTS.md](LAND_GRANTS.md) §5 (clearing and fencing) and the claims it registers in
[HISTORY.md](../HISTORY.md): `HIST-TEX-109` to `HIST-TEX-112`, `HIST-TEX-260` to `-265`, `FIC-GONZ-065` to `FIC-GONZ-067`
and `FIC-GONZ-170` to `-172`.

**Amended 2026-09-20 (§9): the bestiary checked animal by animal.** The owner asked whether the animals a hunt can bring
were really in Texas then. The antelope was not, anywhere a family lives, and is out; the buffalo is rare; the mustang is
back inside the settlements but thin; the deer is the commonest thing on the open prairie. §9 is the authority on the
weights in §3.1.

Same computer only (Windows, node, headless Chrome for the browser proofs); nothing here is LAN or district acceptance.

---

## 1. What the owner asked for

> "once the new biomes are added, have another sub agent research changes to the game that should occur based on the updated
> biomes and make those changes." Then: "balance and gameplay".
>
> — 2026-09-19

And from the biome work the same day: *"some families are going to have a harder time hunting because there's no woods. thats
okay"*. Hardship is intended; it must stay playable and fair enough - no family's game unwinnable or dull because of where it
was dealt. The aim is **regions that differ in character, not in whether a family can do well.**

---

## 2. What the research found

Read 2026-09-19 (web pages only; nothing downloaded). Sources: David Woodman, *Guide to Texas Emigrants* (Boston, 1835); Mary
Austin Holley, *Texas* (Lexington, 1836); Noah Smithwick, *The Evolution of a State* (1900); J. H. Kuykendall's
*Reminiscences* (*Quarterly* 6-7, 1903); W. B. Dewees, *Letters from an Early Settler* (compiled 1852); Dilue Rose Harris
(*Quarterly* 4); Almonte's 1834 report; Olmsted (1857, later); TSHA Handbook entries *Lumber Industry*, *Cumings, John*,
*Manufacturing Industries*, *Ranching*, *Cattle Trailing*, *Sugar Production*, *Texas-Mexican Vernacular Architecture*,
*Barbed Wire*. **Page numbers:** Holley's are this registry's printed pages (archive.org's search numbering less 22, checked on
two passages); the others are the search's own numbering, a page or two either way.

| Topic | Found | Claim |
| --- | --- | --- |
| Game by country | Deer everywhere, turkey and bear in the timber and cane, bison on the interior grass and "seldom seen near the sea coast", mustangs, pronghorn, javelina, wild cattle (already `HIST-TEX-103`, `-104`). New: on the coast in winter "the waters ... are literally covered with wild fowl, such as ducks, geese, brant, and swan" (Woodman); the deer on the early Brazos so poor some settlers "preferred the meat of the wild horse" (Kuykendall); wild cattle shot on the Colorado (Dewees); mustangs eaten in the spring of 1836 (Holley). | `HIST-TEX-109` |
| Building without timber | Log houses were the norm, raised by neighbours; the country "a prairie country, having all the streams skirted by timber" (Woodman). Sawn lumber "very scarce" (Holley), dear "from a scarcity of saw-mills" (Woodman), $40 a thousand at Brazoria; imports barred but house-frames. Mills: Cumings's on Mill Creek north of San Felipe (running by 1832), a steam mill at Harrisburg (TSHA dates it both 1829-33 and 1836), San Augustine about 1825; Bastrop only in 1838. Timber was fetched from the river bottom to a prairie house (Smithwick, 1840s). **Not found:** a rule giving each grant timber, timber lots, sod houses, lumber shipped to the coast towns. Jacales and picket houses are documented for the Tejano towns and the later South and West (TSHA). | `HIST-TEX-110` |
| Fencing | Rails from oak, cedar and ash (Holley); mesquite "valuable materials for fencing", as durable as cedar (Holley); worm fences ordinary; a brush fence at Béxar in December 1835 (`HIST-TEX-037`). **Not found before 1836:** ditch-and-bank or hedge fences, or what a fence cost. | `HIST-TEX-111` |
| Stock | Cattle need no winter feeding (Holley; Woodman); hogs fatten on the mast; a cow and calf ten dollars (Woodman; Almonte); 25,000 cattle and 50,000 swine in the Brazos department (Almonte). | `HIST-TEX-112` |
| What each region grew | The prairie "will yield crops nearly equal to the best alluvions" (Holley), its clearing a third of the work (`HIST-GONZ-039`); bottom crops 3,000 pounds of seed cotton or 75 bushels of corn an acre (Holley). The blackland's "hog-wallow" clay is Olmsted's (1857); that it could not be broken until steel ploughs is from an unsourced modern page and **not claimed**. | `HIST-TEX-112` |
| Firewood | Mesquite "excellent fire-wood" (Holley); in the 1850s Indianola's wood came fifty miles (Olmsted). **Not found:** cow or buffalo chips burned in the colonies, mesquite roots dug for fuel before 1836, bear oil in the texts searched. | `HIST-TEX-112` |

---

## 3. The changes

Each is said on the control before anybody is sent, as the codebase requires, and each applies only on a class whose woods are
the biomes of 1836 (`map.woods: 'biomes-1836'`). A class of the 2016 grid, a class saved before the woods, and the invented
Gonzales country hunt, build and fence exactly as they did. **No save version moved**: the new stored field
(`chore.ground.quarry` on a hunt in progress) is optional, and absent reads as the old hunt.

### 3.1 The hunt brings the country's quarry (`FIC-GONZ-065`)

- **Rule.** Every place a family can hunt holds one quarry, from the list its stand holds (`STANDS[...].quarry`,
  `sim/woods.mjs`), fixed by its patch of ground (a sixteenth of a mile), the patch's cover and the month (`quarryAt`,
  `sim/hunting.mjs`). Of the quarry the ground could hold - the right cover (bear and turkey in timber or brush, buffalo only on
  open ground, javelina in brush), in their months (ducks and geese November to March, buffalo September to April) - the
  patch's own hashed share picks one by weight: deer 3 (**2** out on open ground away from any timber's edge), turkey and
  javelina 2, ducks and geese 3, the **buffalo 0.1**, the rest 1, each **multiplied by the share its country leaves it**
  (`rangeShare`: 1 at home, 0 outside, 0.15 for a mustang inside the settlements). A deer is what comes where nothing else
  fits: deer were "found in every part of Texas". No die: the same place holds the same quarry in the same season, and a
  student who looks about the land learns where the turkeys roost. **The weights in this paragraph were corrected against
  the record on 2026-09-20 — see §9**; as first built the open-prairie deer was 1 and the buffalo 1, which made a buffalo
  the other half of every open prairie hunt at Gonzales.
- **What it gives** (`GAME`): the kill's food by the hunter's hand, of which one person on foot carries five and the rest is
  left where it fell, and its hide for the tanner:

  | Quarry | Food made | Comes home on foot | Hide |
  | --- | --- | --- | --- |
  | deer | 10 | 5 | 1 |
  | bear | 12 | 5 | the skin |
  | buffalo (winter) | 20 | 5 | the robe |
  | wild cow, mustang | 12, 10 | 5 | 1 |
  | antelope | 6 | 5 | 1 |
  | turkey | 4 | 4 (5 for the best hand) | none |
  | javelina | 4 | 4 (5 for the best hand) | 1 |
  | ducks and geese (winter) | 4 | 4 (5 for the best hand), and **a short wait** | none |

- **Ducks and geese sit on the water in numbers**: the wait for them is the wait on the best ground, one tick, whatever the
  ground (`quarryGame`). This is what the coast gets in winter for its open prairie.
- **The words.** Tapping a place: *"Coastal prairie half a mile north of the house. Ducks and geese sit on the water in numbers:
  the wait is short. Deer, ducks and geese, wild cattle and mustangs keep to it. Waiting here, ducks and geese: four food, and
  they come in quickly."* Out of season: *"Ducks and geese come in the winter."* The shot: *"Thomas is downwind of a bear, with a
  shot to take."* The record: *"Thomas brought down a buffalo: 5 food came home, and the robe. The rest, 15 food, was more than
  Thomas could carry and was left where it fell."*
- **Drawn.** Only a deer (stand-in: [ART_REQUESTS](ART_REQUESTS.md), 2026-09-19 - the game of 1836): any other quarry is given
  no place to be drawn at, so no deer stands where the words say a bear. The swap, when the art lands, is one condition in
  `sim/chores.mjs` and the sheet chosen by `quarry.kind` in `miniDeer`.

### 3.2 Logs fetched from the nearest timber (`FIC-GONZ-066`)

- **Rule.** *Fetch logs from the timber* (`fetch-logs`): the felling axe and the ox and wagon at home; the person drives to the
  edge of the nearest timber - found as the hunting ground is, timber only, out to eight miles, off the family's land if need
  be (`logwoodGround`) - fells and loads for six ticks at their pace and strength, and brings **six sound logs** home to the
  log pile. It always goes with the wagon, however it was asked for. Offered only where the trees are counted, once the class
  has begun and the house site is chosen; refused, in words, without the axe, without the ox and wagon at home, or with no
  timber within reach.
- **The words.** *"Costs the ox and wagon for about 4 hours, to the timber on Peach Creek, 2.1 miles off."* On the way:
  *"on the way to the timber on Peach Creek with the ox and wagon"*, *"felling and loading logs at ..."*, *"hauling logs home
  from ..."*; the record: *"Elias brought 6 logs home in the wagon from the timber on Little Boggy Creek."*
- **Families nobody plays** with fewer than a cabin's fifty sound logs standing on their land within a mile fetch their logs
  when that timber is within two miles (`FETCH_LOGS_MILES`), and build a jacal when it is not (`fetchesLogs`).
- **A team left at the timber** (2026-09-19). Somebody called away while fetching - the call to turn out reaches them at the
  timber - rides off and leaves the ox and wagon standing there. Found when a family's team stood at the timber the rest of
  the class and its house wanted logs. *Fetch logs* is offered then too (`teamLeft` in `fetchLogsFacts`): whoever goes walks
  out to the team, loads it and drives it home - *"About 2 hours, on foot to the ox and wagon left at the timber on Copperas
  Creek, beside the house, and home with them."* The home leg names its own way of going (`mode: 'wagon'` on the step). The
  director sends one hand for a team left out before the house and the field, logs wanted or not.
- **Why not bought in town.** Sawn lumber existed but was scarce, dear and made at a few mills, none in most of the dealt towns,
  and it builds a frame house the house plot does not have; logs were not a shop's goods. Time and the wagon, not coin, is the
  documented price of timber for a prairie family.
- `ceiling:` the timber fetched from is nobody's in particular (much of the colonies was ungranted in 1835) and its trees are
  not taken off the map; the logs are all sound, the family choosing its trees. Asking what a trip would cost never writes the
  timber's place into the map (so no browser is told a homestead changed); going there does.

### 3.3 A fence as long as its rails are far (`FIC-GONZ-067`)

- **Rule** (`fenceWork`, `sim/fields.mjs`): ten acres' rails split where timber stands within a quarter mile of the plot, or
  mesquite posts and brush where the plot is in mesquite prairie or chaparral: **eight ticks**, as before. Out on the open
  prairie the rails are carried from the nearest timber: **four ticks more a mile**, three miles at most (twenty ticks).
- **The words**, on the plot when it is tapped: *"Rails carried from the timber 1.4 miles off: about 5 hours."*, *"Rails split
  from the timber at hand: about 3 hours."*, *"Mesquite posts and brush from where it stands: about 3 hours."*, *"No timber
  within 3 miles: the rails come from far off, about 7 hours."* The person is *"carrying rails from the timber"* or *"cutting
  mesquite posts and brush"* while at it.
- **Why.** The prairie clears at a third of the timber's work (ten spells to thirty, `HIST-GONZ-039`); its fence is where the
  want of timber shows on the farm. It is kept small (§5) so the documented advantage stands.

---

## 4. Considered and decided against

| Candidate | Decided | Why |
| --- | --- | --- |
| Field yields by soil (bottom and blackland rich, sand poor) | **Not built** | Holley: the prairie "will yield crops nearly equal to the best alluvions"; what differed was the clearing, already three to one. The blackland's hard breaking rests on an unsourced page. |
| Stock grazing better on the prairie | **Not built** | Well documented (`HIST-TEX-112`), but stock is only the grant's size today and yields nothing anywhere; no family nobody plays brings stock (0 of 180 in the study). A stock economy is a new system for the owner to decide. |
| Firewood by country | **Not built** | No fuel is modelled for anyone; cow chips and mesquite roots were not found before 1836. |
| Logs or lumber bought in town | **Not built** | §3.2. TOWNS.md's shops stay as they are. |
| Bear oil as extra food | **Not built** | Not found in the texts searched. |
| The ox bringing in a kill too big to carry | **Not built** (`ceiling:`) | It would double every hunt's food where the ox is home, a change to the whole economy rather than to the regions. |
| Retuning the game values (0.1 in the fields, 0.15 on the salt prairie) | **Left** | The wait is already capped at five ticks, the same as 0.2; the salt prairie and marsh now have ducks and geese in winter with a one-tick wait. |
| Thinning the hill savanna's 25-37% timber near Boerne | **Left** | No family is dealt to the Hill Country, and changing a stand's shares moves its patches, and so the trees a class made today has felled. |
| Neighbours buying powder | **Fixed 2026-09-19** (§5.3) | Families nobody plays never bought powder, fired two or three shots a class and were short of food most of it (§5.2). The owner chose it as the next item; the cause was wider than powder (§5.3). |

---

## 5. Balance, measured before and after

`scripts/biome-balance-study.mjs` (`node scripts/biome-balance-study.mjs 6 30 3 <label>` and `... hunt 6 30 <label>`), six
classes of thirty families on the real land (`biomes-0` to `-5`), every family run by the neighbours' director. "Before" is
this branch's base (commit `0a842e5`) and "after" these changes, on the same seeds. A family's country is the stand its house
stands in: **prairie** (tallgrass, coastal, salt and mixed-grass prairie, marsh, fields), **savanna** (post oak, hill savanna,
cross timbers, live oak mottes, longleaf, the dry creeks' trees) and **timber** (bottomland, cane, creek, pine and the rest).
Records: [before](evidence/biome-balance-before.json), [after](evidence/biome-balance-after.json),
[hunting before](evidence/biome-hunt-before.json), [hunting after](evidence/biome-hunt-after.json).

### 5.1 Hunting (the bench)

In every family one grown hand hunts the best ground within a mile of the house (`huntPlaces`), six times, with powder enough,
taking the shot when steady and waiting when not; once as the class opens (late September) and once as the winter opens (late
January). 1,080 hunts a season.

| Country | Families | Ticks a hunt | Food a hunt | Food an hour (mean) | Hides a hunt | Quarry after |
| --- | ---: | --- | --- | --- | --- | --- |
| **Autumn** | | | | | | |
| prairie | 76 | 11.75 → 11.62 | 5.11 → 5.07 | 1.65 → 1.67 | 1.03 → 0.91 | deer 219, wild cow 108, mustang 62, turkey 36, bear 25, ducks 18 |
| savanna | 23 | 11.41 → 11.41 | 5.00 → 5.01 | 1.67 → 1.68 | 1.01 → 0.80 | deer 86, turkey 29, bear 19, mustang 6 |
| timber | 81 | 11.90 → 11.90 | 4.98 → 4.88 | 1.84 → 1.81 | 1.01 → 0.75 | deer 287, turkey 123, bear 48, mustang 19 |
| **Winter** | | | | | | |
| prairie | 76 | 8.20 → 7.29 | 5.00 → 4.78 | 2.09 → 2.23 | 1.00 → 0.63 | deer 186, ducks and geese 132, mustang 36, wild cow 36, turkey 36, bear 24, buffalo 6 |
| savanna | 23 | 7.70 → 7.70 | 5.00 → 4.94 | 2.18 → 2.16 | 1.00 → 0.78 | deer 84, turkey 30, bear 18, mustang 6 |
| timber | 81 | 6.95 → 6.95 | 4.94 → 4.79 | 2.30 → 2.24 | 0.99 → 0.74 | deer 288, turkey 120, bear 48, mustang 12, wild cow 6 |

The regions now differ in what comes - wild cattle and mustangs on the prairie, turkey and bear in the timber, ducks and geese
on the coast in winter, a buffalo on the Gonzales grass - and not in whether hunting feeds a family: food an hour stays within
about a tenth between them in either season, the winter coast now level with the timber. Hides fall by a fifth to a third
(birds give none); the tanner stands only at Gonzales, San Felipe and Columbia.

### 5.2 Houses, food and the ending (the class study, three periods)

| Country | Families | Jacal / log house | Fetched logs | House lived in (median tick) | Ticks short of food (median of 829) | Final number (median, mean) |
| --- | ---: | --- | ---: | --- | --- | --- |
| prairie | 76 | 26 / 50 → 2 / 74 | 22 | 81.5 → 100.5 | 563.5 → 565.5 | 65 → 63.5, 66.1 → 63.8 |
| savanna | 23 | 0 / 23 → 0 / 23 | 0 | 102 → 102 | 586 → 586 | 43 → 43, 54.6 → 54.6 |
| timber | 80 | 2 / 78 → 0 / 80 | 2 | 88 → 88.5 | 564 → 565.5 | 61.5 → 61.5, 64.7 → 64.7 |

By settlement, jacales before → after: Columbia 9 → 2, Liberty 7 → 0, Matagorda 6 → 0, San Felipe 5 → 0, Victoria 1 → 0;
a Liberty family's house is lived in at a median of tick 106.5 (75.5 before), Matagorda's 103 (82). The prairie family now
works for its log house - about nineteen ticks, some six hours, later under a roof - or, with no timber within two miles, still
raises a jacal. Food and the ending are unchanged in character: every family nobody plays is short of food about two ticks in
three, before and after, because it never buys powder (§4); the final number is glory's, and moved by under a tenth.

Fencing, what each family's staked and cleared plots would cost at the end of the first period: prairie plots a mean of 8.8
ticks (55 of 200 more than eight, the most seventeen), timber 8.1 (8 of 218), savanna 8.0. Clearing a prairie plot saves sixty
ticks against timber; its fence gives back up to nine.

`npm run balance` (the money-and-glory study, fifteen families) gave the same numbers on the base and on this branch. On both
the stay-home family finished last or near it (1-2), having sold no cotton; the committed record of 2026-09-17 has it winning
one class in six. That change came before this branch and is **found, not investigated** here (explained and fixed in §5.3).

### 5.3 The families nobody plays go to town again (2026-09-19)

Owner, by multiple choice: the unplayed families' food next. **The cause was wider than powder.** On 2026-09-17 the five town
errands - fetch seed, buy powder, sell food, take the cotton, buy a hoe - became the store's own trades for a student and were
kept as errands for the families nobody plays (`directorOnly`, sim/chores.mjs). But the list that hid them from a student is
the list the neighbours' director reads, so it lost them too: from 2026-09-17 no family nobody played bought seed or sold its
cotton. And the director had never gone for powder at all. Two changes:

- The errands are listed for a family the director runs (`directed` in sim/chores.mjs, the same test as `automatic` in
  sim/neighbours.mjs) and for nobody else.
- The director sends one hand to town for powder and lead when the house has fewer than two shots (`POWDER_KEPT`,
  `FIC-GONZ-028`), paying in food or coin while there is still food to pay with.

Families going to town again moved the class's timing enough to show a fault in `fetch-logs` (§3.2): a team left at the
timber by somebody called to the war was never fetched. That is mended in the same change, and the numbers below include it.

The same six classes of thirty, before ([errands-before](evidence/biome-balance-errands-before.json), main at `731e725`) and
after ([errands-after](evidence/biome-balance-errands-after.json)):

| | Before | After |
| --- | ---: | ---: |
| Ticks short of food (under half a unit), median of 829 | 566 | 67 |
| Families ever short | 179 of 180 | 138 of 180 |
| Food in the house, median family's mean | 5.1 | 39.3 |
| Shots fired a class, mean | 2.2 | 9.2 |
| House lived in, median tick | 93 | 99 |
| Glory, median | 52.5 | 49 |
| Final number, median | 60.5 | 59.5 |

One family in ten is still short for more than 227 ticks: its grown hands are away with the army or helping a neighbour, or
it has spent its food and powder together with no coin, and powder costs two food. Putting its idle hands to work about the
place (a food a day each, sim/routines.mjs) was tried and measured: the same numbers to a tenth, so it was not
kept. `ceiling:` a family with no food, no powder and no coin sells nothing it holds for them - hides,
seed - because the director does not visit the shops; that is the way out if it matters.

`npm run balance` marks its stay-home family played, so the class's director leaves it to the study's own policy; the study
now lets that family see the errands while its policy thinks (a student reaches the same counters through the shops at the
same prices). It sells its cotton again: finals 25, 56, 26, 74, 67 and 1, ranks 12, 11, 12, 6, 9 and 11 of 15, no class won
(docs/MONEY_AND_GLORY.md §8.1).

---

## 6. Tests and proof

- `tests/biome-game.test.mjs` (9): the quarry fixed by ground and season (and never bear on the open or buffalo in the timber);
  the control's words; a hunt of a turkey, a deer and a bear - its food, its hide, the record, and no deer drawn but for the
  deer; ducks and geese in December with a one-tick wait; a class of the 2016 grid keeping its deer, and a stored hunt without
  a quarry still valid while one naming no known quarry is refused; fetching logs (its cost, the wagon whatever was asked, six
  logs on the pile, its refusals); the families nobody plays fetching near timber and building a jacal without; the fence by
  distance, in words and in the ticks it takes; asking the cost not writing into the map.
- Amended: `tests/chores.test.mjs` (fetching logs is not offered where the trees are not counted), `tests/improvements.test.mjs`
  (the fence's work is the country's), `tests/house-plot.test.mjs` (a family with no timber of its own fetches its logs).
- **Injections**: `scripts/biome-game-injections.mjs` replaces one exact piece of the rules at a time, runs the six test files
  that read them, and puts the file back ([record](evidence/biome-game-injections.json)). Sixteen injected, sixteen caught,
  each by its own test in `tests/biome-game.test.mjs`; two (the logs never reaching the pile, and every family with no timber
  of its own building a jacal) also fail the amended `tests/house-plot.test.mjs` test, which reads the same thing. One was
  missed at first - the fence chore ignoring the country passed a test that only asked for six tenths of the ticks - and the
  test was made to compare a fence at hand with one out on the prairie, fenced by the same hand, before it was caught.
- `npm test`: 754 tests, all passing (same computer).
- **Browser** (same computer, headless Chrome; not LAN): `npm run test:biome-game` (`scripts/biome-game-browser-proof.mjs`,
  [record](evidence/biome-game-browser.json), [the shot asked](evidence/biome-game/hunt-asked.png)): on a real-land class
  the page's own request for a place on the land said *"Mesquite prairie a quarter mile west of the house. Poor ground: a long
  wait for anything to come. Deer, mustangs, antelope, javelina and turkey keep to it. Waiting here, a mustang: five food, all
  one can carry, and the hide."*; the hunt sent the page's way asked *"Alvin Proofwright is downwind of a mustang, with a shot
  to take."* on his card and drew no deer; the kill was told *"Alvin Proofwright brought down a mustang: 5 food came home, and
  the hide. The rest, 9 food, was more than Alvin Proofwright could carry and was left where it fell."*; the panel offered
  *Fetch logs from the timber* with its glyph painted and *"Costs the ox and wagon for about 2 hours, to the timber on Dry
  Fork, beside the house."*; a plot the family surveyed and cleared said *"Rails split from the timber at hand: about 3
  hours."*; no page errors. `npm run test:farm` and `npm run test:solo-game` pass. `npm run test:hunt` fails at *"the hunter
  was never drawn reading (blue-search)"* - the hunter's poses not drawn, the marker regression another session is fixing;
  the deer's idle and alert and the musket smoke were drawn, and that proof hunts on the invented country, which these changes
  leave as it was.

---

## 7. Ceilings and what is left

- `ceiling:` a kill bigger than one person carries leaves the rest where it fell; the ox brought out to it is the way out, and
  it would change every family's food, not the regions'.
- `ceiling:` the timber logs are fetched from is nobody's and loses no trees; the logs are all sound.
- `ceiling:` a fence's rails are carried without the ox; a family's holding is a labor or a league, and inside a labor the
  timber's distance barely changes (8 to 10 ticks), so the fence tells most on a league on the open prairie.
- Art: the quarry other than the deer, and the fetch-logs icon ([ART_REQUESTS](ART_REQUESTS.md), 2026-09-19).
- For the owner: a stock economy (cattle on the prairie, hogs on the mast, `HIST-TEX-112`). The families nobody plays buying
  powder and the stay-home family's cotton were fixed the same day (§5.3).

---

## 8. Criticised and corrected, 2026-09-19

Owner: *"dedicate a sub agent to brutally criticize the various biomes and improve them."* The whole criticism, including what
was not mended, is [BIOMES §14](BIOMES.md#14-criticised-and-corrected-2026-09-19). Two things changed in play, both because
`docs/BIOMES.md` §7.1's own table said one thing and the build did another.

### 8.1 The quarry's country (`HIST-TEX-200` to `-202`, `FIC-GONZ-120`)

§7.1 wrote geography into its quarry column — "wild cattle and mustangs **west of the Lavaca**", "bison **north and west of
the Colorado**, seasonal, rare", "turkey **near water**", "live oak motte **on sand**" — and every one of those qualifiers was
lost when the column became a flat array of quarry ids. The result: **170 of 447 autumn prairie kills in six classes of thirty
were a wild cow or a mustang**, at San Felipe, Columbia, Matagorda and Liberty, and every coastal-prairie place in the box
held a one-tick duck hunt in winter whether or not there was any water within forty miles.

The sources, read again for this (a full pass of Woodman, and Almonte's report verbatim):

- Woodman, *Guide to Texas Emigrants* (1835), p. 60, of the wild horses — the sentence after the one §2 took: **"Within the
  organized settlements they are not numerous, and are rapidly diminishing."** And of the buffalo: **"Buffalo are seldom seen
  near the coast."**
- Berlandier, through Hornaday (1889, pp. 381-82): the buffalo gone from the colonists' country **"from whence they have
  disappeared since 1828"**, while bands **"remain stationary throughout the whole year"** on the Guadalupe and the Colorado;
  north **"in April or May"**, south again **"in September and October"**.
- Woodman, p. 59: **"In the winter season, the waters near the coast are literally covered with wild fowl"**, and p. 60,
  **"Geese and ducks resort in great numbers to the interior waters."** Every wildfowl passage read is about water.

So a quarry may now carry a **range** as well as a cover and a season (`GAME[...].range`, `inRange`, `sim/hunting.mjs`):

| Range | Which | What it means |
| --- | --- | --- |
| `west-of-the-lavaca` | buffalo, mustang, wild cow, antelope, javelina | west of the Lavaca as the map draws it (`westOfTheLavaca`: a ray due east crosses the river an odd number of times, the river run on due north from its head and due south from its mouth). Béxar, Goliad, Refugio, Victoria and the two frontier settlements, Gonzales and Mina, are west of it; San Felipe, Columbia, Brazoria, Washington, Matagorda, Harrisburg, Liberty and Nacogdoches are east. |
| `by-water` | ducks and geese | water running within a quarter mile (`WATERFOWL_MILES`), or marsh, salt prairie or cypress swamp, which are water themselves. |

The buffalo's months are its own now, October to April (`BISON_MONTHS`), not the ducks' November to March.

**The hunting bench, six classes of thirty, the same seeds** (`node scripts/biome-balance-study.mjs hunt 6 30 <label>`;
[before](evidence/biome-hunt-crit-before.json), [after](evidence/biome-hunt-crit-after.json)). 1,080 hunts a season:

| | Before | After |
| --- | ---: | ---: |
| Wild cows killed (autumn + winter) | 42 | 6 |
| Mustangs | 54 | 6 |
| Buffalo | 6 | 6 |
| Ducks and geese (winter) | 132 | 72 |
| Deer | 564 | 696 |
| Turkey / bear | 180 / 90 | 198 / 84 |
| Food a hunt, autumn / winter | 4.99 / 4.81 | 4.99 / 4.83 |
| Food an hour, autumn / winter | 1.69 / 2.22 | 1.70 / 2.23 |

Every wild cow and mustang left is at Gonzales or Victoria, west of the line. **Food did not move**, and that is worth
knowing: a wild cow makes twelve food and a deer ten, but one person on foot carries five either way, so the wild herds were
never worth more at the house than a deer — they were a story told in the wrong country, not a ration.

### 8.2 The belt on a bayou (`FIC-GONZ-121`)

§4.6 gave every running creek one narrow fringe, 0.045 mile either side, and measured Harrisburg as the test it had to pass:
*"with no strip at all its timber within three miles falls from 14 in 100 to none, so the strip must not simply be removed"*.
The width it chose took Harrisburg to **5 in 100** — although Buffalo, Brays, Sims, Berry, Hunting and Vince bayous all run
there all year, and the town sawed lumber by steam (`HIST-TEX-110`). Almonte, 1834, verbatim: *"The plains in Brazos are
intercepted every fifteen or twenty miles by strips of thick forest containing good wood for the construction of houses"*
(p. 202). A running creek now carries a belt as wide as the creek is big: **0.14 mile either side on a creek big enough to
carry a name on the map**, the old fringe on an unnamed branch, nothing on an intermittent prairie creek, and never a belt in
the Hill Country, whose creeks run in limestone and keep "a thin belt of wood" (Olmsted p. 445).

Timber within three miles, before → after: **Harrisburg 5 → 12** (the 2016 grid had 13), Lynchburg 3 → 6, Béxar 7 → 9,
Refugio 14 → 16, Anahuac 23 → 26, San Felipe 32 → 34, Liberty 31 → 32, Columbia 42 → 44, Washington 43 → 44, Gonzales 46 → 47,
Brazoria 67 → 68; Victoria, Matagorda, Mina, Goliad, Velasco and Nacogdoches unchanged. By ecoregion the coastal prairie
(34a) goes 6 → 9 in 100 and the post oak (33b) 27 → 29, both inside §6.2's own expectations.

Looked at: [before](evidence/biomes/crit-before-buffalo-bayou-harrisburg.png) and
[after](evidence/biomes/crit-after-buffalo-bayou-harrisburg.png) — Buffalo Bayou east of Harrisburg is bare prairie in the
first and a closed belt of timber in the second, with Brays and Sims the same, and the rest of the country unchanged.

### 8.3 What it did to a class

**The class study, six classes of thirty over three periods, the same seeds** (`node scripts/biome-balance-study.mjs 6 30 3
<label>`; [before](evidence/biome-balance-crit-before.json), [after](evidence/biome-balance-crit-after.json)). The houses are
the check that matters: **177 log houses, 2 jacales and 1 family still choosing, before and after alike** — nobody was left
unable to build, and nobody who had to build a jacal before now escapes it.

| | Before | After |
| --- | ---: | ---: |
| Sound logs standing within a mile of the house, median | 1,574 | 2,116 |
| Families under a cabin's fifty logs | 29 | 21 |
| Families that had to fetch logs with the ox and wagon | 24 | 17 |
| Houses: log / jacal / none | 177 / 2 / 1 | 177 / 2 / 1 |
| House lived in, median tick | 99 | 98 |
| Ticks short of food, median of 829 | 66.5 | 67 |
| Food in the house, median family's mean | 39.3 | 36.1 |
| Final number, median / mean | 60 / 65.1 | 53.5 / 64.1 |

By settlement, the median sound logs within a mile: Victoria 529 → 2,109, San Felipe 1,403 → 2,285, Liberty 1,119 → 1,668,
Matagorda 609 → 1,110, Columbia 2,282 → 2,402, Gonzales 1,879 → 2,001, Mina 2,675 → 2,715. The timber-poorest coast gained
most, which is where the bayous are. Victoria's median ticks short of food fall 141 → 71 and Matagorda's 101 → 96; Mina's
171 does not move, and is still the worst family in the class.

**The country a family's house stands in shifts** with the belt: 31 of 180 families move from *prairie* to *timber* in the
study's own three-way split, because a house is built near water and the water's timber is now wider than a house lot. That
is the change working, not a bug, but it is why the prairie and timber rows of §5.2 cannot be read straight against these.

---

## 9. The bestiary checked against the record (2026-09-20)

Owner: *"do a check on what animals live in Texas, back then of course. Because I've never heard of Antelope in Texas."*
The research, animal by animal, with the quotations and the page numbers, is
[BIOMES §17](BIOMES.md#17-the-bestiary-checked-against-the-record-owner-2026-09-20). This section is what changed in play,
what it measured, and what was deliberately left. Claims `HIST-TEX-260` to `-265` and `FIC-GONZ-170` to `-172`.

### 9.1 What changed

| | Before | After | Why |
|---|---|---|---|
| **antelope** | quarry on `mesquite-savanna` and `hill-savanna`, held west of the Lavaca | quarry on `chaparral` and `mixedgrass-prairie` only, no `range` at all | Neither Woodman (1835) nor Holley (1836) names the animal in their chapters on Texas game; every dated sighting is west of the Frio (`HIST-TEX-260`). The two stands it keeps stop at 97.4°W and no settled place in the box holds either |
| **buffalo** | `weight: 1`, months October–April | `weight: 0.1`, months **September**–April | Berlandier has the herds gone from the colonized districts "since 1828" and returning south "in September and October"; Kuykendall killed one near Independence in 1822 and "found no more during our residence there" (`HIST-TEX-262`) |
| **mustang** | stopped dead at the Lavaca | full weight west, **0.15 east** (`THIN`) | Woodman's sentence is "not numerous", not "none", and Dilue Harris had wild horses feeding near the house at Stafford's Point in 1834 (`HIST-TEX-261`) |
| **deer on open ground** | `OPEN_DEER_WEIGHT` 1 | **2** | Holley: "even in the settlements, they are so plentiful and tame, that they often come upon the plantations of farmers, and feed in company with the cattle" (`HIST-TEX-261`) |
| **a quarry's country** | a gate: in or out (`inRange`) | a **share** of its weight (`rangeShare`) | so "not numerous" can be said at all (`FIC-GONZ-170`) |

Nothing else moved. The bear, the turkey, the javelina, the wild cow, the waterfowl and every yield in `GAME` were checked
and left, each for a reason given in BIOMES §16.2.

### 9.2 What a family meets now, by settlement

Every place within a mile of each town, on a patch grid, asked what a hunt there would bring in October and in January
(`huntingPlace().comes`, the game's own path). Only the rows that moved are shown; Washington, Brazoria and Nacogdoches did
not move at all.

| Town | Autumn, before | Autumn, after |
|---|---|---|
| **Goliad** | deer 328, mustang 165, **antelope 122**, turkey 53, cattle 49, bear 14, bison 8, javelina 7 | deer 459, mustang 171, turkey 53, cattle 41, bear 14, javelina 7, bison 1 |
| **Refugio** | deer 328, mustang 117, turkey 100, cattle 70, **antelope 63**, bear 34, javelina 5 | deer 425, mustang 106, turkey 100, cattle 47, bear 34, javelina 5 |
| **Béxar** | deer 284, **bison 160**, turkey 54, **antelope 7**, bear 5 | deer 433, turkey 54, **bison 14**, bear 5, antelope 4 |
| **Gonzales** | deer 392, **bison 217**, turkey 82, bear 50 | deer 592, turkey 82, bear 50, **bison 17** |
| **Mina** | deer 470, turkey 173, bear 65, bison 9 | deer 478, turkey 173, bear 65, bison 1 |
| **Victoria** | deer 272, mustang 194, cattle 186, turkey 58, bear 31 | deer 377, mustang 152, cattle 123, turkey 58, bear 31 |
| **San Felipe** | deer 720, turkey 18, bear 9 | deer 677, **mustang 43**, turkey 18, bear 9 |
| **Columbia** | deer 524, turkey 153, bear 64 | deer 502, turkey 153, bear 64, **mustang 22** |
| **Liberty** | deer 706, turkey 36, bear 7 | deer 663, **mustang 43**, turkey 36, bear 7 |
| **Harrisburg** | deer 652, turkey 44 | deer 622, turkey 44, **mustang 30** |
| **Matagorda** | deer 484, turkey 62, bear 37 | deer 482, turkey 62, bear 37, **mustang 2** |

**The antelope is gone from every family's country.** The four remaining at Béxar are on nineteen cells of genuine
mixed-grass prairie within a mile of the town — north-west of it, which is the direction Olmsted's herd lay — and no class
settles a family at Béxar. Gonzales's buffalo falls from 27 in 100 places to 2; Béxar's from 20 in 100 to 2.

### 9.3 Balance, measured before and after

`scripts/biome-balance-study.mjs`, six classes of thirty on the real land, the same seeds on the base commit and on this
branch. Records: [hunting before](evidence/biome-hunt-bestiary-before.json),
[hunting after](evidence/biome-hunt-bestiary-after.json), [class before](evidence/biome-balance-bestiary-before.json),
[class after](evidence/biome-balance-bestiary-after.json).

**The hunting bench** (1,080 hunts a season, one grown hand on the best ground within a mile, six times):

| Country | Ticks a hunt | Food a hunt | Food an hour (mean) | Hides a hunt |
|---|---|---|---|---|
| **Autumn**, all | 12.19 → 12.19 | 5.03 → 5.03 | **1.67 → 1.67** | 0.84 → 0.84 |
| prairie | 13.07 → 13.07 | 5.11 → 5.11 | 1.57 → 1.57 | 0.96 → 0.96 |
| savanna | 13.48 → 13.48 | 5.05 → 5.05 | 1.51 → 1.51 | 0.80 → 0.80 |
| timber | 11.57 → 11.57 | 4.99 → 4.99 | 1.75 → 1.75 | 0.80 → 0.80 |
| **Winter**, all | 7.23 → 7.31 | 4.86 → 4.87 | **2.25 → 2.23** | 0.75 → 0.78 |
| prairie | 7.31 → 7.64 | 4.83 → 4.88 | 2.26 → 2.19 | 0.69 → 0.80 |
| savanna | 7.52 → 7.52 | 4.94 → 4.94 | 2.22 → 2.22 | 0.78 → 0.78 |
| timber | 7.13 → 7.13 | 4.85 → 4.85 | 2.25 → 2.25 | 0.77 → 0.77 |

What comes home, over both seasons: **deer 1,481 → 1,480, turkey 399 → 399, bear 195 → 195, waterfowl 72 → 42, mustang
18 → 43, cattle 6 → 18, buffalo 6 → 0.** The only real shift is on the **winter coastal prairie**, where a heavier deer
takes some patches from the ducks and geese — the ducks come in one tick and a deer does not, so food an hour there falls
**2.26 → 2.19, three per cent**, while food a *hunt* rises 4.83 → 4.88 and hides rise 0.69 → 0.80. That is the trade the
record asks for and it is small.

**The class study**, six classes of thirty over three periods, every family run by the neighbours' director:

| | Before | After |
|---|---|---|
| Ticks short of food (median of 180) | 65.5 | **65.5** |
| Families ever short of food | 137 | **137** |
| House lived in (median tick) | 98 | **98** |
| Mean food held (median) | 37.405 | **37.405** |
| Final number (median, mean) | 62, 66.16 | **62, 66.16** |
| Hunter's ticks (mean) | 57.42 | 57.59 |
| Shots, missed (mean) | 10.31, 4.93 | 10.32, 4.91 |

Unchanged to the digit in every country and at every settlement — Columbia 117.5 ticks short both ways, Matagorda 103.5,
Gonzales 80, Mina 49, San Felipe 5, Liberty 4.5 — with only the hunter's time moving by three tenths of a tick.
**Nobody is left unable to feed themselves. What changed is what comes home, not how much.**

### 9.4 Proposed and not built, on purpose — then built the same evening (2026-09-20)

**Read §10 for what was built.** This section was written earlier on 2026-09-20 and put to the owner, who answered
*"all three"*: the small game, the fish, the oysters, the honey and the winter turkey were built that evening
(`FIC-GONZ-173` to `-177`, `sim/gathering.mjs`, §10 below). It is left here as written because the reasoning in it is
**why they were built the way they were** — four short works of their own rather than new quarry in `GAME`, so that the
squirrel never enters the deer's draw and the long hunt is exactly what it was. Two of its entries are still unbuilt and
still on purpose: the **feral hogs** and the **predators**, marked below.

The record for each of these is good — `HIST-TEX-264`, `-265` — and better than the antelope's ever was. None was built
at the time, because each is a new **kind** of work rather than a correction to the quarry, and the hunt this game has is
a still-hunt: walk out, work in, wait downwind for hours, take or hold one shot. `FIC-GONZ-172`.

- **Small game — squirrel, rabbit, raccoon, opossum. BUILT (`FIC-GONZ-173`), as its own work and not as a quarry.** The biggest gap. Holley has them "in great abundance"; Smithwick
  shot squirrels in the pecans at San Felipe; Dilue Harris's family ate "venison, and small game". *Would be:* a
  `smallgame` quarry, `a squirrel or two`, meat 2, no hide, covers timber and brush, weight 2, all year, everywhere the
  deer is. *Why not:* a squirrel makes two food where a deer makes ten, so simply adding it makes hunting **worse** and
  moves the first period's food, which is another session's balance. It also wants its own shorter work, not a three-hour
  wait downwind. **Measure first:** ticks short of food by country, and Mina and Matagorda in particular.
- **Feral hogs. STILL NOT BUILT.** Holley p. 96; Almonte's 110,000 head on the mast. *Would be:* the stock economy of `HIST-TEX-112`, which
  is already recorded and unbuilt, rather than a quarry — a hog in the woods is somebody's, or was.
- **Fish, oysters, honey. BUILT (`FIC-GONZ-174` to `-176`).** Three different day's works with three different tools, seasons and refusals: a line in a creek
  (Kuykendall's "innumerable perch, trout"), an oyster bed at low water on the coast (Woodman, "may be conveniently
  gathered"), a bee tree felled (Kuykendall, bee-hunting "richly rewarded the pioneer"). Each would give the coast and the
  bottoms something the prairie has not, which is the right shape; none is a change to `GAME`.
- **The turkey fat and the deer lean in winter. BUILT (`FIC-GONZ-177`): `killYield` takes the month now.** Kuykendall, near Independence in 1822: "The deer were lean but the
  turkies were fat and fine and constituted, for several months, the most valuable part of our subsistence." *Would be:* a
  month-dependent yield. *Why not:* `killYield` has no month, so it is a signature change through `sim/chores.mjs`, and it
  is a **new rule** rather than a corrected number. It is the best single unbuilt idea in this list.
- **Panther, wolf, coyote, alligator, rattlesnake. STILL NOT BUILT, and the owner agreed on 2026-09-20.** The game has no risk to a person out on the land, by design
  (`FIC-GONZ-008`: no hidden punitive RNG). A wolf that can hurt somebody is a change to *that* rule, not to a bestiary.

### 9.5 Tests and proof

- `tests/biome-game.test.mjs` gains **"the antelope keeps to its own country, and that country is nowhere a family lives"**
  — the two stands that hold it, that no settled stand does, that every cell of either is west of the Lavaca and west of
  97.4°W read off the grid itself, and that no town stands in one — and three new assertions inside the two tests that
  already existed: the buffalo under an eighth of the deer on the open winter tallgrass; the mustang held but thin east of
  the Lavaca, against the same ground at full weight; and the deer half again commoner than a mustang on the open coastal
  prairie. 773 tests pass (772 before).
- **Injections** (`scripts/biome-game-injections.mjs`, [record](evidence/biome-game-injections.json)): **30 injected, 30
  caught.** Seven are this session's — the antelope back on the mesquite prairie, the antelope back on the hill country
  tops, *the antelope taken out of its own country too*, the buffalo as common on the grass as the deer, the mustang
  stopped dead at the Lavaca again, the mustang east of the Lavaca at its full weight, and the deer on the open prairie
  worth no more than a wild herd. Five older injections had **gone stale** when `inRange` became `rangeShare` and would
  have stopped the harness; each was rewritten against the line as it now stands and still catches its own test.
- **Browser** (same computer, headless Chrome; not LAN): `npm run test:biome-game` passes its six checks
  ([record](evidence/biome-game-browser.json)); the page's own request for a place now reads *"Creek timber, at the edge of
  the timber, a quarter mile south-west of the house. Good ground for deer: the wait should not be long. Deer and turkey
  keep to it. Waiting here, a turkey: four food."* where on 2026-09-19 the same seed read *"Deer, mustangs, antelope,
  javelina and turkey keep to it."* `npm run test:hunt` passes all fifteen checks, including the `blue-search` pose that
  §6 recorded as failing on 2026-09-19.

---

## 10. What a family ate between deer, built 2026-09-20

Owner, asked which of §9.4's list to build: **"all three"** — the gathering, the small game and the winter turkey. This is
what was built, what it measured, and the one thing it did not reach. `FIC-GONZ-173` to `-177`, `sim/gathering.mjs`,
`tests/gathering.test.mjs`, [injections](evidence/gathering-injections.json) (22 of 22 caught).

### 10.1 The four works

| Work | Where it is offered | Hours | Food | Costs | Wants the knack? |
|---|---|---|---|---|---|
| **Take small game** (`take-small-game`) | Timber or brush within reach of the house | 1 | 2 | one shot | **No** |
| **Fish the creek** (`fish-the-water`) | Perennial water within 3 miles | 2 | 3 | nothing | **No** |
| **Gather oysters** (`gather-oysters`) | Salt ground within 3 miles — `salt-prairie` or `dunes` | 2 | 3 | nothing | **No** |
| **Cut a bee tree** (`cut-bee-tree`) | Timber within reach, and the axe | 2 | 4 | the axe, and a tree | **No** |

Four rules hold them together, and each is the point of them:

1. **The country decides.** Measured over six classes of thirty families on the real land: small game and the line are open
   to every family (a colony grant was riverfront land almost by definition, which is the record's own doing and not the
   game's), the bee tree to **95%** — a family standing on open prairie with no timber in reach is refused it — and the
   oyster beds to **6%**, the families at Matagorda and no one else. **No family inland is ever shown a bed.**
2. **Nothing can go wrong.** The hunt can miss; these cannot. That is what makes them the food a family falls back on
   rather than a second hunt, and it is why the balance below moves the way it does.
3. **Three of the four want no powder, and none wants the knack.** `steadyHand` is what the long shot wants; a person the
   hunt would refuse still brings home perch. That is who the record has bringing it home.
4. **They are walks, not journeys.** Each finds its own place from the house and strolls out to it overland, as the hunt on
   the family's own land does. Asking the map for a road to a creek bank is how they first failed.

Small game is deliberately **not** a quarry in `GAME`: §9.4 was right that putting a squirrel in the draw would take
places away from the deer and make the long hunt worse. The deer's draw is untouched, and `tests/biome-game.test.mjs`
passes unchanged.

### 10.2 The winter turkey and the lean deer

`killYield` takes the month now. In December, January and February a turkey is worth **×1.5** and a deer **×0.75**
(`winterShare`, sim/hunting.mjs). Nothing else in `GAME` moves, and a kill that does not know the date is the kill it
always was. §9.4 called this "the best single unbuilt idea in this list"; the signature change it was waiting for is four
characters long.

### 10.3 What it did to a class, measured

The families nobody plays now fall back on these works when the house is short of food — one person at a time, as with the
hunt. Six classes of thirty families, three periods, against the same study run before the change
([before](evidence/biome-balance-bestiary-after.json), [after](evidence/biome-balance-gathering-after.json)):

| | Before | After |
|---|---|---|
| Ticks short of food, median family | **65.5** | **8.5** |
| Families short at all | 137 of 180 | 110 of 180 |
| Food in hand, median | 37.4 | 40.6 |
| Food at the end of period 1, median | 22.9 | 28.4 |
| Shots fired, mean | 10.3 | 6.5 |
| Shots missed, mean | 4.9 | 2.8 |
| Ticks spent hunting, mean | 57.6 | 33.8 |
| Final number, median / mean | 62 / 66.16 | 60.5 / **66.34** |
| Houses lived in | 180/180 | 180/180 |

**The hunger is gone and the score is not.** The median family is short of food for an eighth as long, and the final
number moves by less than a fifth of a point either way — so this fed people rather than inflating the game. The hunt is
used a third less, which is the real change in character and is worth watching: the still-hunt is now a choice rather than
the only way to eat. By country: the timber 65.5 → 5.5 hungry ticks, the prairie 89 → 40, the savanna 41 → 36.

### 10.4 What it did not reach, and why

**Built the same evening; this section is what asked for it.** `fish-road` (`FIC-GONZ-178`, sim/road.mjs,
docs/ROAD_EAST.md): at a crossing or a refuge, two hours with a line for two food, no powder and no coin, and refused
while the river is over its banks. Measured the same way: **Columbia 109 → 31 hungry ticks, Matagorda 100.5 → 33**,
Gonzales 52.5 → 6, the median family 8.5 → 4 — and the final number, the glory and the hunting do not move at all
([study](evidence/biome-balance-road-fish-after.json)). What is left is the days between the crossings and the days the
river is in flood.

The finding that asked for it, as it was written:

**Columbia (117.5 → 109) and Matagorda (103.5 → 100.5) barely moved**, and the reason is worth writing down rather than
averaging away: those families end the class with no food at all after a period 1 that was fine — hh-14 at Matagorda ended
period 1 with 166 food and was still short on 101 ticks. **The hunger is the flight east, not the farm.** All four works
are `where: 'home'`, and a family camped on the road to the Sabine is nowhere near its own creek. The road has its own
chores already (`hunt-road`, sim/road.mjs, docs/ROAD_EAST.md), so **a line in the water on the road east** was the obvious
next thing, and was built that evening.

Still unbuilt from §9.4 and still on purpose: the **feral hogs** (the stock economy of `HIST-TEX-112`) and the
**predators** (`FIC-GONZ-008`: the game has no hidden risk to a person out on the land).

### 10.5 Tests and proof

- `tests/gathering.test.mjs`, 7 tests: the country deciding (four classes of thirty, every refusal reasoned), the beds on
  salt ground, somebody sent to the water coming home with food and the class replaying it exactly, small game costing a
  shot and not the knack, the bee tree wanting an axe, the walk being a walk and carrying no numbers the channel does not
  need, and the winter turkey.
- **Injections** (`scripts/gathering-injections.mjs`, [record](evidence/gathering-injections.json)): **22 injected, 22
  caught.** One of them is not hypothetical: the first version of the test only checked that the fishing trip set out for
  *somewhere*, and the injection that sent a fisher to a stand of post oaks was not caught until the test was made to
  check it set out for **the water**.
- 807 tests pass (800 before). `npm run test:hunt` passes all fifteen of its checks on the same computer.
