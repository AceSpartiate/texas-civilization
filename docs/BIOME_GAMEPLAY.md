# What the country of 1836 changes in play: the hunt, the logs and the fence

**Status: researched, designed and built 2026-09-19.** The third session of the owner's biome work: [BIOMES.md](BIOMES.md) is
the research and the map (§13 there is what the second session built); this is what the new biomes change in the game, why,
and what it did to the balance, measured before and after. Read it with [WOODS_AND_BUILDING.md](WOODS_AND_BUILDING.md)
(hunting, felling, the house), [LAND_GRANTS.md](LAND_GRANTS.md) §5 (clearing and fencing) and the claims it registers in
[HISTORY.md](../HISTORY.md): `HIST-TEX-109` to `HIST-TEX-112` and `FIC-GONZ-065` to `FIC-GONZ-067`.

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
  open ground, javelina in brush), in their months (ducks and geese and buffalo November to March) - the patch's own hashed
  share picks one by weight: deer 3 (1 out on open ground away from any timber's edge), turkey and javelina 2, ducks and geese
  3, the rest 1. A deer is what comes where nothing else fits: deer were "found in every part of Texas". No die: the same place
  holds the same quarry in the same season, and a student who looks about the land learns where the turkeys roost.
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
| Neighbours buying powder | **Left** (found, not changed) | Families nobody plays never buy powder, fire two or three shots a class and are short of food most of it (§5); a change to every class's economy, for its own session. |

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
one class in six. That change came before this branch and is **found, not investigated** here.

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
- For the owner: a stock economy (cattle on the prairie, hogs on the mast, `HIST-TEX-112`); the families nobody plays buying
  powder, which would let them hunt; and why the stay-home family no longer sells its cotton in `npm run balance` (§5.2).
