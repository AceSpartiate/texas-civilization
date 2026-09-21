# Land grants, Survey, and clearing your own ground

**Status: decided 2026-09-13; step 1 (the grant) built 2026-09-13** ([evidence](evidence/grants.json)). **Terrain, water and the house site were decided the same evening and specified 2026-09-14 (§8); they come before Survey. Movement by ground, the house site, the lane and wells were built 2026-09-14 (§8.4, [evidence](evidence/ground-and-site.json)). Survey (§4.1) and clearing and the field (§5.1, [evidence](evidence/clearing.json)) were built 2026-09-14.** Read this in full before changing a family's land, the field,
clearing, fencing, the stock a family brings, or the lobby choices that decide any of them. It replaces the
"break new ground up to four times" rule of `sim/improvements.mjs` (`FIC-GONZ-015`).

---

## 1. What the owner asked for

> "i see that the farm can be expanded. but it looks gimmicky. players should be able to clear any piece of
> land on their land (their land should come in pre-determined land grants) and create more plots through an
> action called Survey. they should be appropriately sized per family as different families got different
> amounts."
>
> — 2026-09-13

| Question | Owner's answer, 2026-09-13 |
| --- | --- |
| What decides how much land a family gets? | **Stock.** A family that brings cattle and hogs holds grazing land as well as cropland. |
| How do families come to differ in stock? | **Chosen in the lobby**, like the wagon load. |
| The families are late settlers without a DeWitt title (`FIC-GONZ-024`). How do they hold a grant? | **Marked out, title pending.** The land was located for them on the 1825 law's quantities; no title has been issued. |

---

## 2. History

Registered 2026-09-13 in `HISTORY.md`:

| Claim | What it supports here |
| --- | --- |
| `HIST-GONZ-036` The 1825 Coahuila y Texas colonization law: a family that only farmed received a labor (177.1 acres); one that also raised stock had grazing added to make a sitio, or league (4,428.4 acres); families settling within six years received a labor more; a single man a fourth part, the rest on marrying. | Every grant size. **The law did not scale land by the number of children**, so this game does not either. |
| `HIST-GONZ-037` DeWitt's colony: Navarro land commissioner from January 1831; surveying mostly 1831–32 by Byrd Lockhart; 189 titles; no arrivals recorded after April 1, 1831. | Why a grant marked out for an 1835 family is invented (`FIC-GONZ-025`). |
| `HIST-GONZ-038` The Constitution of 1836 granted heads of families living in Texas on March 4, 1836 a first-class headright of a league and labor, and single men of seventeen or more a third of a league. | The title a pending grant could later become. Not built; noted for the chapter after Gonzales. |
| `HIST-GONZ-039` Holley (1833): the labour of clearing twenty acres of timbered bottom would prepare sixty acres of prairie, and a hand can cultivate two-thirds more prairie than bottom; one planter had ninety-three acres under cultivation with seven hands. | **Clearing timber is three times the work of breaking prairie.** The only clearing ratio in this design that is sourced. |
| `HIST-GONZ-040` Bryan: settlers built the cabin first, then "commenced the clearing, or ploughing up of prairie near the timber, for a field to raise corn"; the splitting of rails and fencing followed; the field "grew larger and larger". | The order: house, then clearing, then fence. The field grows plot by plot. |

**Invented, `FIC-GONZ-025`:** that the party's grants were located before they arrived and their titles are
pending; where on the map each grant lies and its shape; the plot size; how long surveying a plot takes; every
clearing time except the timber-to-prairie ratio; what bringing stock costs.

---

## 3. The grant

- **Two sizes, from the law** (`HIST-GONZ-036`):
  - **A labor** — 177.1 acres, about 0.53 miles a side — for a family that brings no stock.
  - **A league and a labor** — 4,605.5 acres, about 2.68 miles a side — for a family that brings cattle and hogs.
  - The labor more for early settlers does not apply: these families came in 1835. A single man's quarter is not
    modelled because no family rolls as a single man.
- **Chosen in the lobby.** The wagon-load panel has two choices, *No stock* and *Drive cattle and hogs in*, each
  stating the acres it brings and the wagon space it costs (`bring-stock`). **Amended 2026-09-21**: each also states
  **the herd it brings** — `stockChoice.herd`, the server's `OPENING_HERD` — because since 2026-09-20 the choice brings
  a real herd and the panel went on naming only the land (`FIC-GONZ-241`, `docs/FAMILY_CREATION.md`, amendment
  2026-09-21). A family whose load was packed before there was any choosing (an old save, or a family auto-rolled at
  Start) brings none. **A Play Solo game never offers this panel at all** — it opens `running`, and both
  `wagonProjection` and `grantProjection` are lobby-only — so a Solo family always holds a labor. Open, and written up
  in `HANDOFF.md`.
- **What stock costs** (`FIC-GONZ-025`): a family driving stock arrives with fewer provisions — the wagon has
  two spaces fewer — because the herd is fed on the road. ~~Stock do nothing else yet.~~ **Since 2026-09-20 the herd is
  a herd**: it feeds itself on the range and the mast, calves in the spring, is killed for meat, strays if nobody rides
  after it, and is left behind in the Runaway Scrape — [STOCK.md](STOCK.md), `FIC-GONZ-180` to `-185`. `ceiling:` no
  sale and no cattle drive; the wandering-stock loss in an unfenced field stays as it is for everyone.
- **Fixed from the start.** *As built:* every family's grant is laid out when the world is made, at the size a
  stock-raising family holds, and never moves (`household.grant` is its bounds). A family without stock holds a
  labor round its house inside it. So the stock choice changes how much a family holds and never where anybody's
  land is, grants can be drawn in the lobby, and no hook in the Start transition is needed. The layout reads only
  the map and takes no draw from the world's random stream.
- **Placement.** Colonists took river frontage and ran their land back from it; the map already places homes
  that way. A grant is a rectangle of its true area containing the home. *As built*, grants are laid out in household order, each taking the place nearest centred on its house - a square or a 1:2 long lot
  either way, the house anywhere from a tenth to half way across - that overlaps no grant already laid out and comes
  within 0.35 miles of no other house (so every family keeps at least a labor). Measured on this map, homes in
  a class of 30 can be as close as 2.25 miles, less than a league's side, so this matters.
  `ceiling:` if nothing fits, the grant is the largest square centred on the home that overlaps nothing, and the
  family's book states its true acres. Measured: no grant was squeezed among 2,000 families in 100 worlds of 5 to 30. Proper metes-and-bounds survey along the river is the way out.
- **Seen.** The family's own map draws its grant boundary. Its book says: *"A labor of land, 177 acres, marked out
  for the family. No title has been issued."* (or *a league and a labor of land, 4,606 acres*). A neighbour's grant is not
  shown — land another family holds is theirs to know, and `seenLand` already covers what can be seen by going there.

## 4. Survey

- **Survey a plot** is a chore for a working member of the family standing at home, once the class has begun.
- The player chooses **where**: the client enters placement mode, draws a plot-sized square under the pointer on
  the family's own grant, and sends its centre. **The server decides.** Refusals, each a plain sentence:
  outside the grant; overlapping another plot; on the house yard; in water; out of the class not yet begun.
- **A plot is ten acres** (`FIC-GONZ-025`), about 0.125 miles a side. The person walks there, paces and stakes it
  (a short piece of work), and walks home. The plot now exists, staked and uncleared, and the story says so, naming
  its ground: *"Hannah staked out ten acres of prairie a mile north of the house."*
- **Ground is what the map already knows** (`coverAt` in `sim/terrain.mjs`): timber along the water, prairie
  between, brush on steep ground. The placement ghost names the ground before the player commits.
- There is no limit on plots but the grant. `ceiling:` a staked plot can't be abandoned or moved; add *Pull up the
  stakes* if players need it.

### 4.1 As built (2026-09-14)

Built on both maps, in `sim/survey.mjs`; tests `tests/survey.test.mjs`, evidence [survey.json](evidence/survey.json).

- **Choosing the place.** A person's work list offers *Survey ten acres*; choosing it opens a panel ("Where Hollis surveys"),
  and a tap on the map asks the server (`GET /api/plot`) what ten acres there would be: *"Ten acres of timber a quarter
  mile south-west of the house."*, or why not. *Survey it* sends `survey-plot { entityId, x, y }`; the server checks again.
- **Refusals**, each a sentence: not your land; would run over the line of your land; runs over ground already staked;
  somebody is already surveying there; would take in the house yard (within 0.04 miles of the house); ground the field
  already has (the old forty-acre field block, until §5 turns the field into plots); runs into a river or creek, **named, and
  only water the class's own map draws** — the first version used every branch in the USGS data and refused ground that
  looked dry on the map; before the class has begun; before the house site is chosen. Survey is never sent without a place.
- **The walk.** The person walks out over the family's own land a tick at a time at walking pace, slower through timber
  and brush on the real land, never leaving home; paces and stakes the ground (two ticks); walks back to the yard. If the
  ground was taken while they walked, the story says so and nothing is staked.
- **The plot** is `household.plots[]` `{ id, x, y, ground, state: 'staked' }`, ten acres centred on the place, projected on the
  family's land line and drawn on its own map as a survey-chain square with a post at each corner (`stand-in:` for the
  surveyor's stake and corner marker requested 2026-09-13). The story: *"Hollis staked out ten acres of timber a quarter mile
  south-west of the house."* No limit but the land. A class saved before Survey has no `plots` and validates.
- **Found in the browser proof** and fixed: setting the house exactly on the surveyor's mark made a journey of no length the
  server refused (the family now simply stays); the person's panel covered the land to tap (it is put away when survey
  starts); water refusals for creeks the map does not draw.
- *Superseded by §5.1:* staked plots do nothing yet — §5 clears them into the field. `ceiling:` the ground named for a plot on the real land counts
  timber along creeks the map does not draw, so ten acres can be called timber where the map shows grass; neighbours did not
  survey until §5.1; the stake art is a stand-in.

## 5. Clearing, and the field

- **Clear this plot** replaces *Break new ground*. It is offered for a staked plot, walks to it, works it in
  spells like the house (`SPELL_TICKS`), and finishes when the plot is cleared. A person can be called home and
  the work already done stays on the plot.
- **Work by ground:** prairie 10 spells; brush 20; timber 30 (`HIST-GONZ-039` gives timber three times prairie;
  every absolute number and brush are `FIC-GONZ-025`). Timber needs the **axe**; prairie and brush the hoe.
- **The field is the cleared plots.** Planting puts seed in every cleared plot (the existing seed per clearing
  becomes seed per plot); a harvest yields per plot; the ox and wagon are needed from three plots, as now. Plots
  far from the house cost the walk there and back — the decision the old rule never had.
  `ceiling:` one crop state for the whole field, not per plot; per-plot planting when crops differ.
- **Fencing is per plot.** *Fence this plot* rails one plot; a harvest loses the unfenced share only on unfenced
  plots. A plot cleared after the fence went up is unfenced.
- **Ruin** (`HIST-GONZ-019`, nothing in Gonzales calls it) returns every plot to staked-and-uncleared and takes the
  rails, as the old field returned to its first patch.

### 5.1 As built (2026-09-14)

Built on both maps, in `sim/fields.mjs` (the plots as the field), `sim/improvements.mjs` (clearing, rails, ruin) and
`sim/survey.mjs` (choosing the plot); tests `tests/clearing.test.mjs` and `tests/improvements.test.mjs`.

- **Clear a staked plot** (`clear-plot`) and **Fence a cleared plot** (`fence-plot`) replace *Break new ground* and *Fence the
  field*. Both are chosen like Survey: the person's work list opens the same panel ("Which plot Feliciano clears"), a tap on
  one of the family's plots asks the server (`GET /api/plot?x&y&job=`) and gets its words — *"Ten acres of timber a quarter
  mile south-west of the house, staked. 30 spells of clearing, felling timber with the axe."* — or why not, and *Clear it* /
  *Fence it* sends `clear-plot` / `fence-plot { entityId, x, y }`; the server finds the plot under the point and checks again.
  Each is on the work list only when there is something to do it to (a staked plot; a cleared plot without rails), as the
  well and the lane are, and neither is in the lobby.
- **Clearing** walks out to the plot, works it in spells of `SPELL_TICKS` — prairie 10, brush 20, timber 30 — by as many of the
  family as are set to it, and when the last spell goes in everybody on that plot leaves off and walks in. Called home, the
  spells done stay on the plot (`plot.work`) and whoever is sent back finishes the rest. Timber wants the felling axe and
  wears nothing (as the house and lane); prairie and brush want a sound hoe and wear it once, when the plot is cleared.
  Refused: not one of the family's plots; already cleared; no axe for timber; no hoe, or a worn one; the lobby; before the
  house site. *"Temperance finished clearing ten acres of timber a quarter mile south-west of the house. The field is 20 acres now."*
- **Fencing** walks out and splits rails for eight ticks round one cleared plot. Refused on staked ground, on a fenced plot,
  and while somebody else is already fencing it. **Amended 2026-09-19** ([BIOME_GAMEPLAY](BIOME_GAMEPLAY.md) §3.3,
  `FIC-GONZ-067`): on a class of the biomes the rails come from the nearest timber - eight ticks where timber stands within a
  quarter mile of the plot or the plot is in mesquite prairie or chaparral (mesquite posts and brush), four more for every mile
  to the nearest timber, at most three - and the plot's words say it: *"Rails carried from the timber 1.4 miles off: about 5
  hours."* Every other class fences in eight.
- **The field is the cleared plots.** Planting costs two seed a cleared plot, walks out to each cleared plot in turn (nearest
  first) and back, and marks each one sown; harvest walks the round again and brings in five a sown plot, the wagon wanted
  from three. **A plot cleared while the crop grows is not in it** (`plot.sown`): found while designing, because one crop state
  for the whole field would otherwise harvest ground nobody planted. The stock take a third of what grows on each unfenced
  plot only (`harvestShare` is 1 − ⅓ × unfenced share of what is sown). A family with more cleared ground than seed for all
  of it cannot plant until it has the seed, and is told so (`ceiling:` below).
- **Drawn** on the family's own map plot by plot: a cleared plot as field — turned earth, or the crop in rows where it was
  sown — with the rail fence round it only if it was fenced; a staked plot as the square with corner posts, the spells done
  shown as turned earth growing from its middle; no wild scrub or oak scattered in cleared ground. A neighbour's field is still
  drawn as the first patch of the old block, fenced. The land line: *"20 acres cleared in 2 plots, 1 fenced; one more plot
  staked out to clear."* `stand-in:` cleared timber is drawn as the same turned earth as prairie until the stump art lands.
- **Ruin** returns every plot to staked, takes the clearing done, the seed and the rails; *fence* alone turns every standing
  fence to `ruined`, which *Fence a cleared plot* sets back up (*"set the rails back up"*).
- **Families nobody plays** (`sim/neighbours.mjs`, `FIC-GONZ-028`) fence an unfenced plot while a crop stands, clear the nearest
  staked plot, and stake ten acres near the house (a fifth to half a mile out, eight ways round) while they have fewer than
  three plots; they fetch seed for the whole field.
- **Old saves** (§6): a class whose plots were never written reads its old `field.cleared` patches as that many cleared plots
  in the corner of its field block nearest the house, fenced if its old fence was, sown if its crop is in; nothing is stored
  until a plot changes (staking, clearing, fencing, ruin), so every class saved before opens as it was and no save version
  moved. Somebody saved in the middle of *Break new ground* or *Fence the field* leaves off the work, and the story says so.
  `CLEARING_MAX` survives only as `OLD_PATCHES`, the bound on an old save's `field.cleared`.
- `ceiling:` one crop for the whole field and planting all-or-nothing — per-plot planting (and a partial planting when seed is
  short) when crops differ; a neighbour's cleared plots are not drawn (what they have cleared is known only by going to look);
  the rails want no axe or maul; plots cannot be pulled up or moved; automatic families keep three plots.

## 6. Old saves

No `saveVersion` bump: every missing field has a correct value.
- No `grant` → a labor, a square centred on the home (the field the old map drew was a labor).
- No `plots` and `field.cleared` N → N ten-acre plots in a block beside the house, cleared, fenced if the old fence
  was sound. Their ground is read from the map like any other.
- No stock choice → no stock.

## 7. Build order

*Superseded by §8's order: terrain and the house site come between steps 1 and 2.*

1. ~~**The grant.**~~ **Done 2026-09-13.** The lobby stock choice and its wagon cost; placement at Start; `household.grant`; the boundary
   on the family map; the book line; old-save default; claims `HIST-GONZ-036`–`040` and `FIC-GONZ-025`.
2. ~~**Survey.**~~ **Done 2026-09-14** (§4.1). Placement mode, the `survey-plot` action with its refusals, the chore, plots drawn staked.
3. ~~**Clearing and the field.**~~ **Done 2026-09-14** (§5.1). `clear-plot` by ground, the field as cleared plots, per-plot fences, ruin, old-save
   plots; `clear-ground` and `build-fence` retired, `CLEARING_MAX` kept only as the old-save bound.
4. **Art.** Staked plot, cleared plot on prairie and on timber (stumps), grant boundary markers — requested in
   `docs/ART_REQUESTS.md` (2026-09-13 for the stake, 2026-09-14 for cleared ground), with stand-ins from the field and fence art until they land.

---

## 8. Terrain, water and the house site — decided 2026-09-13, specified 2026-09-14

> "there should be realistic topography so where a player puts their house and fields matters. realistic rivers,
> lakes ponds, if none, then they should need to dig a well. topography should speed or slow movement too."
>
> "it'll also play a natural role in the runaway scrape"
>
> "if they choose to put their house further back in their property, that might influence communication because
> it'd mean a longer way towards the road from their farm."
>
> — 2026-09-13

| Question | Owner's answer, 2026-09-13 |
| --- | --- |
| Real Gonzales country, or invented but true to its kind? | **Real elevation and water**, from USGS elevation and stream data for the Gonzales area, reduced to a small grid shipped with the game. The download is asked for first. |
| When does a family choose where its house stands? | **On arrival.** The wagon stops at the grant and the family's first act is choosing the site. |
| What is built next? | **Terrain first**: terrain, water, wells, movement and the house site, then Survey and clearing on top. |

What these commit the design to:

- **The land is the real land.** The invented relief of `sim/terrain.mjs` (`FIC-GONZ-002`) is replaced by real
  elevation, and the rivers and creeks follow their real courses. The fords, the battle site and Gonzales itself are
  re-placed onto the real rivers, and every claim that places them (`HIST-GONZ-007`, `008`, `015`) is re-checked
  against the real geography rather than kept as coordinates.
- **Where the house stands matters.** Near water is less carrying and nearer the floods; up on higher ground is drier
  and a longer walk for water; near timber is near logs and fuel. A site with no river, creek, spring or pond close
  enough means **digging a well**.
- **Movement follows the ground.** Slope, timber, brush and creek crossings slow people, horses and the wagon.
- **The lane to the road.** A house set back on the grant has a longer track to the road, and riders with news and
  neighbours coming to call take longer to reach it (owner's point); the courier model already follows the track, so
  the delay should come from the geography rather than a rule.
- **The Runaway Scrape.** Terrain and water are where that chapter's hardships will come from (`HIST-GONZ-019`).
  Nothing is built for it now; the terrain must not make it harder to add.

### 8.1 What the research found (2026-09-14)

**The data, downloaded with the owner's approval** (public domain, U.S. Geological Survey, The National Map):

| File | What | Size |
| --- | --- | --- |
| `USGS_1_n30w098.tif` | 3DEP elevation, 1 arc-second (about 30 m), 29–30°N 97–98°W: a 3612×3612 grid of 32-bit floats, LZW-compressed with the floating-point predictor, in 512-pixel tiles | 56.75 MB |
| `NHD_H_12100202_HU8_Shape.zip` | National Hydrography Dataset, Middle Guadalupe: flowlines, waterbodies, points | 17.67 MB |
| `NHD_H_12100203_HU8_Shape.zip` | The same, San Marcos | 11.60 MB |

The raw files are kept out of the repository. The game ships a derived grid and stream lines made from them by a
build script that uses only Node's standard library, with the source, date and every transformation recorded.

**The game area — decided 2026-09-14.** The owner: *"we're going to need data like this for the whole game area. players are not all starting in the gonzales area."* Chosen: **the settled colonies of 1835, 94–99°W and 28–32°N** (Bexar and Goliad east to Nacogdoches), **at the same fine detail everywhere**. Downloaded with approval: 19 elevation tiles (973 MB; the twentieth is open Gulf and not published) and nine NHD basins (1.23 GB). **Built 2026-09-14** ([evidence](evidence/terrain-data.json)): an eighth-of-a-mile grid 303 by 276 miles and 162,177 watercourse lines, 13.7 MB compressed. **Where families start across that area, and how the news of Gonzales reaches families who do not live near it, is a game-design change of its own: decided 2026-09-14 in [COLONIES.md](COLONIES.md), which now sets the build order from here.**

*Superseded by the paragraph above:* **the tile is about 60 miles by 69 around Gonzales** (the town is about 33 miles from its west edge, 27 from its
east, 34 from its north and 35 from its south). The generated home country today reaches about 55 miles either side,
so new classes' families live inside the tile. That still covers the Guadalupe from above the confluence to below
Cuero, which is the DeWitt colony country.

**Water within 25 miles of Gonzales, in the data:** the Guadalupe and the San Marcos; more than a hundred named creeks
and branches (Kerr, Tinsley, Peach, Sandies, Plum, Five Mile among them) and sloughs along the river bottoms; **one**
mapped spring; and about 13,000 small "lakes and ponds" plus 320 reservoirs. The reservoirs are dams — Lake Wood and
Lake Gonzales on the Guadalupe date from 1931 — and nearly all of the small ponds are stock tanks and farm dams. **None of
those were 1835 water**, and the data cannot tell a natural pond from a dug one, so every waterbody is left out except
river channels. `ceiling:` natural oxbow lakes along the bottoms go with them; a study of the river's old channels
would put them back.

**Wells.** Holley (1833, p. 56), of the level country of Austin's colony between the San Jacinto and the Guadalupe:
it is "entirely clear of all marsh, lakes, and overflow"; water is abundant in the rivers and creeks, "while
excellent water for domestic purposes may be obtained from wells, at a moderate depth, in every part of this
territory". A promoter's account of the country just below Gonzales, not a measurement, and it names no depth. No
first-hand account of a DeWitt colonist digging a well was found. Register as `HIST-GONZ-041`.

**The Runaway Scrape.** TSHA's entry records cold, rain, hunger and disease on the retreat that began when Houston
ordered Gonzales abandoned (`HIST-GONZ-019`); secondary accounts describe the Colorado and Brazos in flood and knee-deep
mud, which is east of this map. Nothing is built for it now.

**Not found yet:** how fast people, horses and ox wagons crossed this country off the roads, and whether the 1835
creeks ran all year. Both stay invented (`FIC-GONZ-026`) until sourced.

### 8.2 Design

- **One real country for every new class.** Elevation, the rivers and the creeks come from the data; homesteads are
  still scattered by the seed along the real watercourses, and grants are laid out round them as now. **A class saved
  before keeps the invented country it was played on**, because its families' houses stand in it — no save version
  moves. Which one a world uses is on its map (`map.terrain`).
- **Places re-placed on the real rivers.** Gonzales, the ford opposite it (`HIST-GONZ-007`), the forks of the rivers
  (`HIST-GONZ-015`), the camp at the battle site upriver (`HIST-GONZ-008`) and the roads. Each claim is re-read against
  the real ground; a distance that no longer holds is corrected in `HISTORY.md`, not bent to fit.
- **Ground cover as the 1835 rule, on the real land.** Timber along the real watercourses and in the bottoms, post
  oak savannah on the uplands, brush on steep broken ground (`HIST-GONZ-012`). Modern land cover is not used.
- **Movement follows the ground** (`FIC-GONZ-026` for every number): going is slower uphill, in timber and brush, and
  across a creek; the river is crossed only at the ford, as now. Roads are the easy going. A trip's time comes from the
  ground along its path, so a route that climbs out of a creek valley takes longer than a flat one of the same length.
- **The house site, on arrival.** The wagon stops where the track meets the family's grant, and the first thing the
  family does is choose where the house stands, anywhere on its own holding. Before choosing, the site shows its
  ground, its height above the nearest water, how far it is to water that runs all year, how far to timber, and how
  long the lane to the road will be. The server refuses water, the grant's edge and too-steep ground. Then the lane is
  laid from the road to the house along the easiest ground, and everything that comes to the family — riders with news,
  neighbours, a trader — comes up that lane.
- **Water at the house.** A family fetches water from the nearest running water. Too far (`FIC-GONZ-026`) and the
  family's work suffers until it digs a well: a long chore whose length rises with the site's height above the water
  (`HIST-GONZ-041` for wells at a moderate depth; the depths and times invented).
- **Floods are information, not yet an event.** A site low in the river bottom is marked as the ground that floods.
  `ceiling:` no flood happens in the Gonzales chapter; the Runaway Scrape is where high water belongs.

### 8.3 Build order

1. ~~**The data.**~~ **Done 2026-09-14.** `scripts/build-terrain.mjs` reads the GeoTIFF and the shapefiles and writes the game's terrain asset:
   an elevation grid, the named watercourses with whether they run all year, and nothing that is a dam or a pond.
   Provenance in `docs/evidence/`. Tested against known points (the confluence, the town, the river's fall).
2. **The real country in new classes.** `sim/geography.mjs` builds from the asset: rivers, creeks, relief, cover, the
   re-placed sites and roads, homesteads and grants. Old saves untouched. Browser proof of the map.
3. ~~**Movement by ground.**~~ **Done 2026-09-14** (§8.4). Path costs from slope, cover and crossings; lanes routed by them.
4. ~~**The house site and water.**~~ **Done 2026-09-14** (§8.4). Choosing the site on arrival, the lane, water distance and the well.
5. Then §7's Survey, clearing and art.

### 8.4 As built: the going, the house site and water (2026-09-14)

Built as `docs/COLONIES.md` §6 item 3; tests `tests/ground.test.mjs` and `tests/homesite.test.mjs`.

- **One change from §8.2, made while building:** the wagon stops at the **surveyor's mark** — the point the grant was laid out
  round, where the track from the road already ended — rather than where the track meets the edge of the holding. The edge of a
  family's holding depends on the stock it chooses in the lobby, after the class and its tracks are made, so a gate on it would
  have moved each time the stock choice did. The family still chooses on arrival and anywhere on what it holds.
- **Amended 2026-09-15** ([docs/WOODS_AND_BUILDING.md](WOODS_AND_BUILDING.md) §4): a class made since reads timber and mesquite brush from the woods, patch by patch; the rule below is kept for classes made before.
- **The going** (`sim/ground.mjs`, `FIC-GONZ-026`). Cover on the real land by §8.2's rule: timber within 0.9 miles of a river
  and 0.2 of a creek, brush on ground steeper than 8 in 100, open prairie and savannah between. A mile of timber is 1.3 on foot,
  1.5 on the horse, 2 with the wagon; brush 1.6, 1.8, 2.5; a creek costs a tenth of a mile on foot, a twentieth on the horse and
  0.4 with the wagon, a lesser river 0.3, 0.2 and a mile. Slope by Tobler's hiking function (1993), borrowed as a modern rule,
  not an 1835 one; the wagon's is squared and never below level. Stored per stretch of every lane and track
  (`route.ground`), turned into a journey's `travel.pace`; a journey without it moves exactly as before.
- **The site** (`sim/homesite.mjs`). Refused: off the holding (*"That is not your land."*), within 0.05 miles of its line, in the
  water, steeper than 8 in 100, or where no wagon can be brought. Its facts are said before choosing and again in the story.
  A labor stays round the surveyor's mark (`household.mark`), so moving the house never moves the land held.
- **Water.** Running water further than a quarter mile: heavy work at home takes 1 + 0.6 × (miles − ¼) as long, at most 1.5.
  *Dig a well*: 6 ticks and 2 a metre, the depth the height above the nearest water and 3 metres more (`HIST-GONZ-041` for a
  moderate depth; every number `FIC-GONZ-026`). Offered only where one is wanted.
- **Old saves and the invented map**: no `choosingSite`, no `ground`, no `pace` — unchanged; no save version moved.

### 8.5 The land at its true size, and the lane cut by the family — decided 2026-09-14

> "The player's land seems too small. The icons are taking up a lot of space. It's not communicating how large the land
> tracts were. Players should have a lot of space to choose from. This would open up choosing where to put their various
> fields (they don't all have to be next to one another), building a path to the closest road from their land, clearing
> spaces, digging wells, etc."
>
> — the owner, 2026-09-14, on seeing the house site built

| Question | Owner's answer, 2026-09-14 |
| --- | --- |
| How should the map show how big the land is? | **Much smaller figures**, and a camera that zooms far enough in to keep them readable. |
| Should every family get more land? | **No — keep the stock rule** (a labor without stock, a league and a labor with). |
| Who makes the lane to the road? | **The family cuts it as work.** The route is marked when the site is chosen; until it is cut, going over it is as slow as the country it crosses. |

**Found:** a person was drawn 0.115 miles tall — about six hundred feet — against a labor 0.53 miles a side, so every holding
read as five people wide at every zoom; the yard put the ox a fifth of a mile from the house and the field was a whole labor.
**Built the same day:**

- **Drawing** (`public/app.js`): a person 0.019 miles, the closest zoom reaching a person 90 pixels tall; the grass, brush and
  trees scattered a few rods apart close up and thinned in doublings as the view widens; a cart road a few rods wide.
- **The yard** (`sim/world.mjs`, `sim/chores.mjs`): family, ox, horse and wagon within a few rods of the house; a hunter's
  steps in the timber a tenth of a mile or so. Classes saved before keep where their people stood.
- **The field** (`sim/geography.mjs`, `sim/colonies-region.mjs`): forty acres beside the house, the first patch ten — the
  plot size §4 already gives Survey. It is still one block at a fixed place (`ceiling:` it can lie across a creek); §4–5's
  plots anywhere on the holding are what the owner's "they don't all have to be next to one another" asks for, and remain
  the next land step.
- **Cutting the lane** (`sim/homesite.mjs` `cut-lane`): a marked lane is cut from the house outward, a spell at a time, by as
  many of the family as are set to it; six ticks of one person's work a mile of open ground, thirty of brush, sixty of timber,
  a felling axe wanted where it runs through timber (every number `FIC-GONZ-026`). A cut stretch loses its timber and brush
  from the going; its climbs and creeks stay. The uncut stretch is drawn as a line of stakes, the cut one as track. Neighbours
  cut theirs. `ceiling:` whoever is cutting is drawn no further than a third of a mile down the lane from the house, however far
  the cutting has got; the lane's route is chosen for the family, and a student drawing their own is the way out if wanted.
