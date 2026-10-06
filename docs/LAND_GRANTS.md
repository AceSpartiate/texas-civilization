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
  Start) brings none. **Play Solo offers this panel too, since 2026-09-21.** It used not to: a solo
  game opened `running`, and both `wagonProjection` and `grantProjection` are lobby-only, so a Solo family always held a
  labor of land that nobody had chosen — the owner had been playtesting the small grant without it being anyone's
  decision. By multiple choice (owner, 2026-09-21: *"Ask, the way a class does"*) a solo game now opens in a lobby of
  its own, is asked both questions, and is started by the player's own **Done packing** (`begin-solo`), because there is
  no teacher to press Start.
- **What stock costs** (`FIC-GONZ-025`): a family driving stock arrives with fewer provisions — the wagon has
  two spaces fewer — because the herd is fed on the road. *(2026-09-25, owner: a family of nine or more comes with more than
  one wagon, docs/SETTLING_IN.md §4a. The herd's two spaces come out of its wagons together - 30 of 32 with two - and it brings
  the same stock as any family: the herd is dealt by the grant, not by the wagons.)* ~~Stock do nothing else yet.~~ **Since 2026-09-20 the herd is
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
  somebody is already surveying there; would take in the house yard (within 0.04 miles of the house, or, since 2026-09-23,
  over any house of the land as the map draws it: `WOODS_AND_BUILDING.md` §6.5); ground the field already has (the old
  forty-acre field block, until §5 turns the field into plots); runs into a river or creek, **named, and only water the
  class's own map draws** — the first version used every branch in the USGS data and refused ground that looked dry on
  the map; before the class has begun; before the house site is chosen. Survey is never sent without a place.
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
  ~~`ceiling:` one crop state for the whole field, not per plot; per-plot planting when crops differ.~~ Lifted 2026-09-30 (§5.2).
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
  **Since 2026-09-28 a crop stands real minutes** (owner: "i want 4 minutes for corn and 6 minutes for cotton in real life";
  `sim/crops.mjs`): corn four minutes of the running class, cotton six, in any month, measured from the real time each tick took; a third as fast in December to February (corn twelve, cotton eighteen). A plot of corn brings in ten food, of cotton five bales.
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
- `ceiling:` ~~one crop for the whole field and planting all-or-nothing — per-plot planting (and a partial planting when seed is
  short) when crops differ~~ (lifted 2026-09-30, §5.2); a neighbour's cleared plots are not drawn (what they have cleared is known only by going to look);
  the rails want no axe or maul; plots cannot be pulled up or moved; automatic families keep three plots.

### 5.2 Each plot its own crop — owner-decided 2026-09-30

> "players can still plow new and extra fields right? so i as a player could have corn growing for food as well as cotton to sell?"
>
> — the owner, 2026-09-30

They could clear and fence extra plots, but the whole field held one crop (§5.1's `ceiling:`). Lifted: **every cleared plot has its
own crop**. Built in `sim/crops.mjs` (the crop in each plot, its growth, the summary), `sim/fields.mjs` (`cropState`, `cropOf`, the
bare, sown and ripe plots), `sim/chores.mjs` (planting and the harvest), `sim/auto.mjs` (`fieldTask`), `sim/neighbours.mjs`
(`directorCrops`), the page (`public/app.js`, `public/field-surface.js`, `public/family-panel.js`); tests
`tests/per-plot-crops.test.mjs`, proof `npm run test:mixed-field` ([record](evidence/mixed-field-browser.json)). `FIC-GONZ-1000`.

- **A plot is bare, or sown with corn or cotton**, and a sown plot stands its own real minutes from the tick it went in (corn four,
  cotton six, a third as fast December to February; `FIC-GONZ-721`) and is ripe by itself. Stored on the plot: `sown`, `crop`,
  `grownMs`, `ripe`; a plot brought in keeps `crop`, the crop it last grew. `household.field` stays as the family's summary: `crop`
  the crop it last chose, `state` ripe while any plot is ripe, planted while any stands, bare otherwise.
- **Planting, for the student**: the *Plant the field* icon opens the plot chooser (as clearing and fencing do) titled *What Ann
  plants*: *"Every bare plot: 3 plots, corn to eat or cotton to sell. Or tap one plot on the map to plant only that one."* and two
  buttons, **Plant corn** (gold) and **Plant cotton** (white). Nothing tapped plants every bare plot; a plot tapped plants that one
  (*"Ten acres of prairie a quarter mile east of the house, cleared, with no fence (the stock take a third of what grows). Bare."*),
  and *Every bare plot instead* goes back. The bare plots are offered as buttons too, for a keyboard (sim/suggest.mjs). The crop the
  student chooses becomes the family's own. The order is `plant-field { entityId, crop, x?, y? }`; the old `chore` order still plants
  every bare plot and asks the crop at the field. Refused in the plot's words: *"Clear that ground before it is planted."*, *"That
  plot is already in corn, ready in about 2 minutes."*, *"The cotton on that plot is ripe: bring it in first."*
- **Seed a plot**, two for corn and three for cotton, spent at the field **a plot at a time, nearest the house first**, as far as
  the seed goes; the plots it will not pay for wait, and the story says so: *"There was seed for 2 plots of the 3: Ann planted the
  nearest, and one plot waits for seed."* Seed for one plot of corn is enough to begin; a crop the seed will not pay for one plot of
  is refused before anybody goes (*"Cotton wants 3 seed a plot, and there is not that much in the house."*). The walk goes only to
  the plots being planted.
- **Two sent to plant**: the second takes the bare plots the first is not planting; sent to a plot somebody is already planting, they
  work alongside them (their crop). As before, the work is joined and done once.
- **The harvest brings in every ripe plot** and nothing else, each with its own yield (corn ten food, cotton five bales) and its own
  fence (a third less off an unfenced plot): *"Ann brought in 10 food and 3.33 cotton. The rest had gone to stock in an unfenced
  field. The cotton nobody can eat; it has to go to the store."* A plot that ripens while the harvest is out waits for the next. The
  ox and wagon from **three plots brought in at once**; the icon says what stands (*"About 10 food and 3 cotton standing"*), and
  while nothing is ripe, when the first will be (*"The corn is not ready: it will be in about 2 minutes."*).
- **Unchanged**: fencing per plot, clearing, the prices and yields a plot, and *a plot cleared while a crop grows is not in it* - it
  is simply bare.
- **Auto** (sim/auto.mjs `fieldTask`): planting and the harvest are one task. A person on auto given either **brings in any ripe
  plot first, then plants the bare plots, each with the crop it last grew**, a plot never sown with the family's own crop (the one
  the student last chose). Nothing is planted the student has not grown on that plot or chosen for the family. Neither can be done:
  they work about the place, and the row says why in the refusal's words.
- **Families nobody plays** (sim/neighbours.mjs `directorCrops`) plant each bare plot its own crop, and **keep the nearest bare
  plot in corn** when none of their field stands or is going into corn and they have two plots or more, or are short of food. Seed
  is fetched for what the plan wants.
- **Drawn**: each plot with its own crop and stage in Astra's crop art (`corn-young`, `corn-mature`, `cotton-young`,
  `cotton-mature`), a ripe plot washed in its colour (corn gold, cotton white) so a mixed field reads plot by plot. The Host's map
  the same, every family's. **The field line** is its own element under the supplies (`#field-summary`): a chip for each crop
  growing (its ripe plant, faded) and each crop ripe (lit, with a tick), and one for the bare plots (turned earth), each with a
  count; the words are its label and each chip's title. The supplies line no longer says "field bare".
- **Old saves**: a class saved with one crop for the whole field reads that crop, state and minutes for every sown plot, and each is
  written down as its own the first tick it grows or the first time the field changes (`keepCrops`). No save version.
- **Balance** (docs/BALANCE.md §18, 14 classes): a cotton family with a corn plot ends with about a quarter less than one all in
  cotton, and goes hungry about half as often in the winter (13 of 84 families a day without food, against 22).
- `ceiling:` the crop is chosen for the plots of one planting together (one crop for every bare plot, or one plot); a planting of
  several plots in several crops is auto's and the director's only. A student who wants two plots of corn and two of cotton taps
  and plants twice. `ceiling:` a harvest brings in every ripe plot; which to bring in is not chosen.

- **Seed kept at the harvest** (owner-decided 2026-10-02: *"didn't farmers back then get seeds from their crops? Can we incorporate
  something that maybe reduces yield, but gives us enough seed for the next planting?"*; sim/crops.mjs `seedKept`, `FIC-GONZ-1071`,
  `HIST-TEX-1070`). **Automatic**, not a choice: every plot brought in keeps back the seed to plant it again, out of what it gave -
  **corn two of its ten** (eight to eat; the seed ears, as farmers kept the best ears), **cotton three seed for one of its five
  bales** (the seed comes out at the gin with the lint - Austin's colony had four or five gins by 1828 - so the cost is a bale's worth
  of seed cotton held back unginned for planting, not three bales). Never more than came in: a plot the stock ate down below its seed
  keeps what there was. **Said in the harvest's own line**: *"Ann brought in 8 food and 4 cotton. 5 seed kept back for the next
  planting: 2 of the corn, and 1 bale of the cotton left unginned for it."*; the seed shows on the supplies line's *Seed* and is what
  the next planting spends, so a family that farms no longer has to buy seed. The harvest's control still says what stands (*"About 10
  food standing"*). Tests `tests/food-sources.test.mjs` (*seed kept*), proved by `npm run test:food-sources-injections`.

### 5.3 Click a field to choose its crop — owner-decided 2026-09-30 (not released)

> "when i was playing earlier, there was no mechanism for choosing what crop is planted on each field. let me click on the fields so
> i can select what is grown there."
>
> — the owner, 2026-09-30, after playing the release v2026.09.29.3 (which had one crop for the whole field; §5.2 is on
> integration and unreleased)

§5.2 made each plot its own crop, but a plot was only chosen after pressing *Plant the field*. Now **a plot of the family's own
field clicked or tapped on the map, with no work chosen first, opens the plot chooser right there on that plot**:

- **Bare** - *What Ann plants*, the plot's own words (*"Ten acres of prairie beside the house, cleared, with no fence (the stock
  take a third of what grows). Bare."*), **Plant corn** and **Plant cotton** each with **its seed on the button** (*2 seed*,
  *3 seed*; amber when the house has less - the server still plants what the seed pays for, §5.2), and *Every bare plot instead*.
- **Growing** - titled *Corn growing* (*Cotton growing*), eyebrow FIELD, the plot's words ending *"Corn growing, ready in about
  3 minutes."*; nothing to send.
- **Ripe** - titled *Corn ripe*, *"... Ripe corn, ready to bring in."*, and **Bring it in**, the harvest order (every ripe plot,
  §5.2's `ceiling:`).
- **Staked** - the clearing chooser on that plot (*Which plot Ann clears*, **Clear it**), as the clearing icon opens it.
- **Who goes** (`public/family-panel.js` `plotHand`): the person whose bar is shown, then the main person, then the panel's order
  (father, mother, children oldest first) - the first the server would send on that work now; a **Who** list in the chooser
  changes it to anybody else who may. Nobody may: the bar's person, and the server's refusal in their name.
- **Visual cue, not words** (the owner's standing preference): under the mouse the plot is lit (a gold edge and wash) and the
  pointer is a hand; tapped, it is outlined as the chooser looks at it.
- **Touch** (triage D17, "tap, then send"): a tap only opens the chooser; nothing is sent until a crop, *Bring it in* or *Clear it*
  is pressed. **Keyboard**: the field line's chips (`#field-summary`) are buttons now - Enter on *bare*, a crop *growing* or a crop
  *ripe* opens the chooser on the first such plot with the focus on its first button; the bare plots stay offered as suggested
  places (§9).
- **Unchanged**: *Plant the field* and its chooser, choosing a person by clicking them on the map (a person standing on a plot is
  still chosen first), the house opened by clicking it, and every refusal, which is the server's.
- Page only, with one catalogue field: the chore catalogue carries each crop's seed a plot (`seeds` on `plant-field`, fetched once).
  No save, action or tick change. Proof `npm run test:field-click` ([record](evidence/field-click-browser.json)); tests
  `tests/field-click-hunt.test.mjs`.
- **Fence it** (owner, 2026-09-30, *"Add 'Fence it'"*, the same day): a cleared plot with no sound fence - bare, growing or ripe -
  also offers **Fence it** in the same chooser, sent as *Fence a cleared plot* sends it (`fence-plot` with the plot's point) to the
  person chosen when the server would send them on fencing, else the next who may (`plotHand`). A fenced plot offers none.
- `ceiling:` the hover highlight is for a mouse; a touch screen sees the outline only once tapped.

### 5.4 The first ten acres laid where they can be worked — owner, 2026-10-05 (not released)

> "When starting the game, if I put my house somewhere, the starting plot that we can plant is frequently straddling a river, or
> outside of the borders of my property line. We should add something to dynamically take care of this."
>
> — the owner, 2026-10-05, playing solo

**Found.** Every family begins with ten acres broken (`plot-1`). They were the corner of the forty-acre block of §8.5, fixed south-east
of the house and carried over with it when the family chose its site (sim/homesite.mjs), never looked at (§8.5 had it as a
`ceiling:`, "it can lie across a creek"). Measured on 718 sites a family could choose on four classes: the first ten acres lay partly or
wholly **off the family's land 405 times**, over the house's ground 172 times and in a drawn river or creek 21 times. And they began
"cleared" with their trees still standing in the woods: the map draws no tree in cleared ground, but people walking went round them -
round nothing anybody could see (about 115 standing trees in the first ten acres on average).

**Built** (`sim/starting-plot.mjs`, `FIC-GONZ-1164`, `-1165`):

- **Laid by the rules a staked plot is held to** (§4.1, sim/survey.mjs `plotRefusal`): wholly inside the family's line; off the ground
  kept round the site - the yard and the play spot, the woodpile, where the stock comes in at night, room for a yard's rails
  (`KEEP_CLEAR`); off every house of the land as the map draws it, its pictures and its yard, and off the widest house the family could
  still plan at the site; over no other plot or ground being surveyed; and in no river or creek the map draws (the water a student is
  refused a survey for, sim/fields.mjs `plotWater`).
- **Where**: the nearest such place to the door of the house (or the site, before there is a house), on a grid a quarter of a plot
  apart out to three quarters of a mile, south-east first among places as near, where the field always lay. Ten acres of timber only
  where open ground is more than 0.15 mile further (`TIMBER_PENALTY`): a settler broke the open or thinnest ground first, and ten acres
  of timber taken as broken would take a hundred trees off the map. 0.6 ms on average to find, 3.6 at worst (351 sites, 2026-10-05).
- **When**: as the site is chosen, and **again when the first house is placed** (sim/houses.mjs `planHouse`), round the house where
  it will stand - so the field follows the house the student puts down. A house may now be set on the first ten acres **while nobody
  has worked them**: they are laid again round it, as long as they have somewhere to go (sim/house-placement.mjs); otherwise *"That would
  stand on your field."* as before. Nobody has worked them while nothing is sown, no rail stands, no crop was ever in them, the family's
  old field is one patch, and nobody is at work on them or on the way to them (`startingPlotOpen`).
- **Shown before choosing**: the site chooser draws the ten acres where they would be laid, a dashed square under the stake
  (public/app.js `drawSitePick`, from the server's `field` on `/api/site`) - a picture, not words. The place looked at is rounded to the
  hundredth of a mile the house is set to, so what is shown is what is laid.
- **Their trees come down with them, no log onto the pile** (`clearStartingTrees`): the ground was broken before the class began, and
  the owner refused free logs for the yard (2026-10-03, §10.3a). Marked felled with `field: 'plot-1'` and `logs: 0`, so they stand
  again where they were if the ten acres are laid elsewhere. Drawn as stumps, as every cleared plot's are.
- **Clearing a plot** (§5.1) now also takes down its trees that give no log - a mesquite, a live oak pole - with none for the pile
  (sim/felling.mjs `fellStanding`): they stood unseen in the field for everybody walking there to go round.
- **People sent out "to the field"** (practise at the mark, a beef up from the range, out after a hog, looking to the stock) go to the
  edge of the cleared plot nearest the door, where its trodden way ends (sim/chores.mjs `fieldPoint`); it was the middle of the old
  block, which could now lie off the field.
- **A class already in play** (server/storage.mjs `readSave`, `settleStartingPlots`): its first ten acres **stay where they are unless
  they cannot be** - off the land, over the yard or a house, in a drawn river or creek - **and nobody has worked them**; then they are
  laid again round the house. Ten acres sown, fenced, ever cropped or being worked stay where they are, wherever that is. Every cleared
  plot's standing trees come down, no log for them (a plot cleared before had its timber felled onto the pile already). **No save
  version moved**: nothing new is stored but felled trees with a mark old code ignores, and `fellingInvalid` accepts a tree of no use
  felled with no log.
- `ceiling:` one size of plot. A family whose land has no dry ten acres clear of the yard keeps them where they lay; none was found in
  718 sites, and a smaller first patch is the way out if a class ever shows one.
- `ceiling:` a family placing its first house far from its site keeps the yard, the woodpile and the stock's ground round the site
  (they always were the site's); the ten acres keep off both.

Tests `tests/starting-plot.test.mjs` (4, each watched failing, `node scripts/map-fixes-injections.mjs`,
[record](evidence/map-fixes-injections.json)); the chooser's square in `npm run test:keyboard-farm`.

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
  plot size §4 already gives Survey. It is still one block at a fixed place (`ceiling:` it can lie across a creek; **lifted 2026-10-05, §5.4**: the first ten acres are laid where they can be worked); §4–5's
  plots anywhere on the holding are what the owner's "they don't all have to be next to one another" asks for, and remain
  the next land step.
- **Cutting the lane** (`sim/homesite.mjs` `cut-lane`): a marked lane is cut from the house outward, a spell at a time, by as
  many of the family as are set to it; six ticks of one person's work a mile of open ground, thirty of brush, sixty of timber,
  a felling axe wanted where it runs through timber (every number `FIC-GONZ-026`). A cut stretch loses its timber and brush
  from the going; its climbs and creeks stay. The uncut stretch is drawn as a line of stakes, the cut one as track. Neighbours
  cut theirs. `ceiling:` whoever is cutting is drawn no further than a third of a mile down the lane from the house, however far
  the cutting has got; the lane's route is chosen for the family, and a student drawing their own is the way out if wanted.

## 9. Suggested places, and the map by the keyboard (2026-09-29)

From the classroom audit (S8) and the triage's item 2.13: choosing the house site (§8.2), ten acres to survey (§4) and the plot
to clear or fence (§5) each wanted a tap on the map and nothing else, so a student who can use only the keyboard could not farm
at all, and a touch screen or a slow reader had to hunt the map for a place the server would take.

- **Suggested places, from the server** (`sim/suggest.mjs`, `GET /api/suggest?job=site|survey-plot|clear-plot|fence-plot`, the
  family's own land only). Up to three buttons under the panel's words, each labelled in a few plain words - *"North-west of the
  wagon: open ground, water close by"*, *"Prairie, a quarter mile north-east of the house"* - with the server's full words as the
  button's title. A house site is judged at a seven-by-seven grid of spots on the holding: water that runs all year close by
  first, then out of the river bottom, open ground, timber near, nearest the wagon; the best three spread apart are each checked
  in full, lane and all (`siteFactsFor`), so a suggestion is never refused when it is looked at. Ten acres to survey: a grid half
  a plot apart within a mile and a quarter of the house, at most 120 spots, the least clearing first, three that do not overlap.
  A plot to clear or fence: the family's own plots the work can go to now (`plotFacts`), nearest the house first.
- **Pressing one does what a tap there does**: the map goes there, the page looks at the place (`/api/site`, `/api/plot`), and
  the panel's own button (*Set the house here*, *Survey it*, *Clear it*, *Fence it*) still sends it. The server decides both
  times, as for a tap. The suggestions are asked for once as the choice opens, never on a tick. Opening a choice from a work
  button, or the house site's panel coming up with nothing else focused, puts the keyboard on the first suggestion.
- **The map by the keyboard.** Tab reaches the map (it always has); the arrow keys move it and + and - zoom (they always have);
  and now, while a place is being chosen, **Enter** (or the space bar) picks the spot in the map's middle, as a tap there would,
  and a ring and cross mark that spot while the map has the focus (`drawKeyTarget`). The same Enter holds the house's own
  placement (`house-placement`) where the ring is (not in the proof below).
- `ceiling:` the grids are coarse - a spot they miss is tapped, or reached with the arrows and Enter. Finer grids cost the
  server's one thread for every student who opens a choice. Hunting ground and felling are not suggested: felling is one press,
  and a hunt's ground is the student's call.

Proof: `tests/suggest.test.mjs` (every suggestion accepted when looked at and when sent, none before the choice is open, the
route the family's own) and `npm run test:keyboard-farm` (the real land's first hour with Tab, Enter and the arrow keys alone:
a suggested house site set, the map moved and Enter looking at its middle, ten acres surveyed from a suggestion, and the plot
it staked cleared from a suggestion, with the small child who stops the surveyor given something to do from the panel,
also by the keyboard). Each was seen failing under an injected regression (`npm run
test:tier2-classroom-injections`). Same computer, headless Chrome: no Chromebook, and no screen reader was tried.

## 10. Paths, the way across the land, and the yard — owner-decided 2026-10-02 (not released)

The owner, verbatim, 2026-10-02: *"it's weird seeing characters walk over trees. paths should be cut to facilitate quick, reasonable
movement on a families land. there should be an option to fence in a yard too. if there's a fenced in yard then kids on auto play
will not be disobedient as often."* Built in `sim/land-paths.mjs`; claims `FIC-GONZ-1100` to `-1104` (HISTORY.md). The trees and
the felling are docs/WOODS_AND_BUILDING.md §6.12; the yard's effect on the little ones is docs/CHILDREN.md §14.

### 10.1 The way across the family's land (`FIC-GONZ-1100`)

Somebody sent about the family's own land - out to survey, clear, fence, plant, fell or hunt, and back to the yard - was
moved in a straight line a tick at a time, over whatever stood between; the woods are drawn tree by tree from the very grid the
server counts (sim/woods.mjs), so a student watched people walk through trunks and over crowns. Now:

- **The server finds a way** (`landRoute`) on the woods' own grid of tree cells (a 256th of a mile, about 21 feet), round every
  standing tree, the rivers and the houses as the map draws them, wading a creek where it must, and cheaper on a path. A cell with a
  standing tree costs twenty times its ground (`TREE_COST`), a cell beside one two and a half times (`NEAR_TREE`): never a wall, so
  a way out to fell a tree or hunt in the timber still gets there, between the trunks. The ground's own pace is the going's
  (`COVER_PACE.foot`: open 1, timber 1.3, brush 1.6). A long way across a league is found on a grid of two or four tree cells
  (`MOST_CELLS`), which steps round a stand rather than between its trunks. On a map whose trees are not counted (the invented
  Gonzales country) the way is straight, as it always was, and only a path changes the pace.
- **The person walks it** (`walkLand`, behind sim/survey.mjs `stroll`): the way is kept until they arrive and found again only when
  where they are going changes. Each tick spends a mile of open going, piece by piece of the way at the pace of the ground under
  each piece - quicker on a path, slower in timber and brush (until now the whole tick went at the pace of the ground they set out
  from). A step across the yard in one tick (`walk`, the hunt's stalk) is still made in its tick, and drawn walking the way round.
- **The page draws them along the very points walked** (`walked`, sent for the tick it was walked in; public/motion.js `walkedFrom`),
  never the straight line between two ticks, and eases their separation from the others and their place at the work in over the
  last quarter of the walk, so they are not drawn beside their way and over a tree they went round. **A tree in front of somebody is
  drawn again over them** (public/app.js `treesInFront`): the woods are drawn into the kept ground under everybody, and a person
  walking behind a tree was drawn over its crown.
- `ceiling:` a person is drawn about a hundred feet tall and a tree's crown three of its cells across (sim/house-footprint.mjs
  `PERSON_MILES`), so in open woods a figure still brushes the crowns beside it; the trees drawn in front of them are what make it
  read as among and not over. A grid as fine as the drawing is the way out, if that is ever not enough.
- `ceiling:` a way is found once for each place a person sets out for, on the server's one thread: 1.5 to 7 milliseconds on
  average and about 45 at worst, measured on three families of one class (2026-10-02). Re-measured 2026-10-03 with the paths
  automatic, three families of class `smoke-paths` on this machine: a walk set out about the land 1.3 ms on average, 6.9 at worst
  (150 walks, with and without a fenced yard); a trodden way 0.8 ms on average and 3.2 at worst found first (patches cold), 0.3 and
  0.8 after, 0.5 and 1.3 out of a fenced yard; a whole tick of `advanceLandPaths` 1.5 ms at worst. A cache of ways by place is the way
  out if a class of thirty shows it.
- `ceiling:` the Host's map and a neighbour's people are drawn as before, between their ticks in a straight line.

### 10.2 Paths, all trodden on their own (`FIC-GONZ-1101`, amended 2026-10-03) — owner-decided 2026-10-03

The owner, verbatim, 2026-10-03: *"i don't want players to have to micromanage the paths that we added earlier. this should be an
automated thing based on where they put things."* Offered three ways by multiple choice, the owner chose **"All automatic"**:
*Remove the Cut a path button. Paths appear on their own from the house to everything the family places: water, each field, the
yard gate, the woodpile and the stock pens. They wind round trees, and no one is sent to fell anything.*

- **What gets a way** (`troddenTo`, `advanceLandPaths`): once the house stands (sim/houses.mjs `houseSettled`), a way from the
  door (sim/house-placement.mjs `houseFront`) to
  - **running water** near enough to carry, a few rods short of the bank (only a house that needs no well has it; a well is dug by
    the door, sim/chores.mjs `dig-well`, and wants no way of its own);
  - **every cleared plot**, at the side nearest the door a step inside its rails;
  - **the yard's gate**, once rails stand round the yard (`yardGate`, below);
  - **the woodpile**, where the page draws the family's logs, left of the house and a little before it (`woodpileAt`, `PILE_AT`), in
    every class that keeps a pile of logs (the classes that count their trees, sim/woodpile.mjs `keepsPile`);
  - **where the stock is brought in at night**, one way for the cattle and one for the hogs, each while the family has any
    (`stockGround`): the family has no pen - an open range, docs/STOCK.md - so the stock's place is the ground near the house
    where public/herd-view.js draws each kind standing from eight in the evening to six (`nightGround`; the test holds the two to
    the same point).
  Not the tent: it stands only until the house has a roof (sim/shelter.mjs), and the ways begin at the house once it stands.
- **When**: a new way appears on the tick after the thing is placed - a plot cleared, the yard's rails up, stock bought - laid
  round the trees. A way is **laid again** when where it begins changes: the door of the house that stands now, or the yard's rails
  going up or coming down (a way records `gate: true` when it was laid with the rails standing). A way to **something that is gone
  goes with it**: the hogs all sold or lost, the yard's rails pulled down by the Scrape (its gate with them). `ceiling:` a way goes
  at once, not grown over through a season; the grass taking it back is the way out if a class ever misses one. At most three ways
  are found a tick across the class (`TRODDEN_A_TICK`), so a class opened with every house standing treads them over its first
  ticks. Not said in the journal: they are seen.
- **Round the trees, nothing felled**: a trodden way counts a cell with a standing tree as `WAY_TREE_COST` (100) times its ground,
  against `TREE_COST` (20) for somebody walking about, so a way is worn round the trunks and squeezes past one only where going
  round would be some two fifths of a mile further. (At 20 a way out of a fenced yard into thick timber was laid through a tree's
  cell, found 2026-10-03.) Nobody is sent and no tree comes down for a way.
- **The yard's gate, and the rails a wall**: the gate is an opening `GATE_HALF` (0.006 mile) either side of its middle in the front
  rail, straight out before the door, slid along the rail to where no standing tree is in the opening (`gateAlong`); hung when the
  rails go up and kept on the yard (`yard.gate`), so it never moves. While the rails stand **the way-finding does not cross them**
  but at the gate (`onRails`): every way out of the yard, and everybody walking in or out of it, goes through the gate. The page
  leaves the gate open in the drawn rails (public/app.js `drawYardFence`, `land.yard.gate`). A yard fenced in a class saved before has
  no kept gate; it is where it would be hung now.
- **Cut a path is gone.** The bar's *Cut a path* (2026-10-02: a straight line from the house felled clear, at felling's time) is
  removed from the action bar and the map's place chooser. A page loaded before, or a command saved before, sending it is refused in
  words, *"Nobody needs to cut paths now: the family treads its own ways from the house to the water, each field, the yard gate, the
  woodpile and the stock, round the trees."* (`pathOrderRefusal` in sim/world.mjs `applyAction`, and `/api/plot?job=cut-path` in
  server/app.mjs).
- **Walking a path is quicker**: `PATH_PACE` 0.8 of open ground's time, against 1.3 through timber and 1.6 through brush, and the
  way across the land prefers it. The lane, as far as it is cut, counts as a path, and so does a path cut in a class saved before.
- **Drawn** (public/app.js `drawLandPaths`): a soft trodden-earth verge with a packed line down the middle, under the woods and the
  grass. `stand-in:` docs/ART_REQUESTS.md, request 2026-10-02 "paths and the yard" (the trodden-path tile).

### 10.3 The yard (`FIC-GONZ-1103`)

- **Fence a yard** (sim/chores.mjs `fence-yard`, on the bar once the house stands and until a sound fence stands round the yard):
  rails round the house's own ground and the dooryard before it, where the little ones play - the houses' drawn footprints with
  `YARD_MARGIN` (0.02 mile) at the sides and back and `YARD_FRONT` (0.035) before the door, and the play spot, cut back from any plot
  of the field and kept inside the family's line (`yardBox`). Refused where the field comes too close to leave room.
- **Cost and time, in the plot fence's model** (`yardFenceBy`): the rails a plot's fence would take at the yard's middle - from the
  timber at hand, mesquite, logs off the pile where the timber is far, or carried from far off (sim/fields.mjs `fenceWork`,
  sim/woodpile.mjs `fenceBy`) - at **half** a plot's work and half its logs (`YARD_SHARE`), never under two ticks. It wants an axe for
  the splitting (greyed with it on the bar without one). `ceiling:` a plot's fence still asks for none (its own ceiling, sim/chores.mjs).
- **The trees standing inside the yard are felled first** (owner-decided 2026-10-03, below): one at a time at felling's own time
  (sim/felling.mjs `fellAndCarryTicks`, at the family's pace), their logs onto the pile, then the rails are split (`fellYard`, the
  trees from sim/land-paths.mjs `treesInBox`). The icon and the yard's words say it before anybody goes, after the rails' time:
  *"22 trees inside: about 13.5 hours more, 39 logs for the pile."* (`yardTreesWords`; nothing is said where no tree stands). Several
  sent fell different trees. The felling is paid: the house in the timber that took twenty-two trees and thirty-nine logs with four
  ticks of rail-splitting when the first version felled them with the rails (2026-10-02) now takes fifty-nine ticks of one hand for
  the same logs.
- Drawn as a swept-earth dooryard inside a rail fence (public/app.js `drawYardFence`), its rails pulled down by the Scrape's burning
  with the field's (sim/improvements.mjs `ruin`, `fence`).

### 10.3a The owner's answers — owner-decided 2026-10-03

The owner answered the four questions of 2026-10-02:

1. *How much a fenced yard calms a child on auto:* **half as often disobedient, as built** (docs/CHILDREN.md §14).
2. and 4. together, **"Auto kids; fell trees"**: the yard calms **children on their own automation**, as built; and **fencing the yard
   fells the trees standing inside it**, at felling's own time per tree, their logs onto the pile, as *Cut a path* then did - the
   felling paid, never the free logs of the first version, and the added work said on the yard's line (§10.3).
3. *A path cut through thick timber:* **felling's own time, and felling's logs, as built** - since withdrawn with *Cut a path* itself
   (2026-10-03, "All automatic", §10.2): no path is cut now, and no tree is felled for one.

### 10.4 Old saves and the lesson

No save version moved: a class saved before has no paths, no yard and nobody part way along a way, and those are the correct empty
values (`landPathsInvalid`, `walkRouteInvalid`); a family whose house stands has its ways trodden on the first ticks after the class
opens, as a family whose house has just gone up does. Fencing the yard is held back while a family is walked through its first farm
work (sim/lesson.mjs `LATER_WORK`).

**Since paths went automatic (2026-10-03), still no save version moved.** A class saved before opens as it was: its trodden ways are
kept and laid again only where the rule now lays them differently, and the ways it never had (the woodpile, the stock, the gate) are
trodden on its first ticks; a path it cut stays a path. **A class saved with somebody part way through cutting a path opens** - the
chore is work that no longer exists, so on the first tick they leave off and it is said (*"... left off cutting the path
unfinished."*, sim/chores.mjs `RETIRED`, the same way retired field work was left off in §5), the tree they were felling still
stands, and the path keeps what was cut while the stakes of the rest come up (`leaveOffCutting`). It is dropped rather than finished
because finishing it would keep the felling-along-a-line machinery alive for one old chore, against the owner's decision; nothing is
lost that the family had - the cut part stays and no log moves. A yard with no kept gate, and a way with no `gate` mark, are the
correct empty values (`yardGate` hangs it where it would go; the way is laid again).

Proof: `tests/land-paths.test.mjs` (9 tests, every one watched failing under its own injection, `node scripts/land-paths-injections.mjs`)
and `npm run test:land-paths` (docs/evidence/land-paths-*.png, docs/evidence/land-paths-browser.json).

### 10.5 Walking about the homestead — owner, 2026-10-05 (not released)

> "Paths don't seem natural around the house."
>
> — the owner, 2026-10-05, playing solo

**Found** (the family's land drawn from the server's own ways of §10.1-10.2, a dog-run and a round-log cabin on
`land-paths-10`): the search's box reached 0.08 mile past the two ends of a way, and a dog-run is drawn a fifth of a mile long - with
no room in the box to go round the house, the way was laid **straight through it**, and so was a way to anything under it (where the
stock is brought in at night can lie under a big house); the ways crossed the field, which the page draws over them, so a way vanished
under the crop and came out the other side; the ways out of a fenced yard hugged its rails a cell out; each way ran its own line from
the door and people walking cut across them; people came home to a spot in the yard beside the house, not the door where every way
begins; somebody working beside another, going in out of the weather and out again was slid there in a straight line, over whatever
stood between; every corner of a way was a point, the staircases round a trunk included; and every walk took the whole tick, so a step
across the yard crept and a walk to the far field hurried.

**Built** (`FIC-GONZ-1166`; sim/land-paths.mjs unless named):

- **Round the house, in and out by its front**: the search's box takes in every house it touches with 0.03 mile round it
  (`HOUSE_ROOM`); a way to or from a place inside a house as the map draws it goes in or out at the house's front (`frontOf`), where
  its door is. A cell against a house's wall or the yard's rails counts 1.6 times (`NEAR_WALL`), so a way keeps a little off them.
- **Keeping to the ways** (`viaWay`): somebody setting out from one end of a made way - the door, where every trodden way begins, or
  the place it goes to - walks along it to where it comes nearest where they are going, and on from there round whatever stands between,
  when that is no more than **1.5 times** the straight line (`WAY_DETOUR`; within `WAY_END`, 0.012 mile, of the way's end). So people walk
  out to the field, the water and the woodpile by the family's own ways and home along them, and a way trodden to something new runs along
  one already worn as far as it serves and branches off it - the ways share a trunk from the door. Elsewhere a cell of a made way counts
  **0.6** of open ground to the way-finding (`PATH_ROUTE`; still walked at `PATH_PACE` 0.8).
- **Round the field**: a cell of cleared ground counts **3** to the way-finding (`FIELD_ROUTE`; walked at open ground's pace), so a way
  goes round the field, not across the crop, and into a plot it goes to from the nearest side.
- **From and to the door**: people walking home walk to the door of the house (sim/survey.mjs `strollTarget`), where the ways begin,
  once there is a house; the yard spot beside it before.
- **No more straight slides**: somebody working beside another walks the very way that one walked, a step to the side (`walkBeside`,
  sim/chores.mjs `standBeside`); going in out of the weather and out again, and to the tent, is walked round what stands between
  (sim/shelter.mjs `walkOver`, `stepTo`). A step under 0.06 mile whose line is open ground all the way is taken straight with no search
  (`SHORT_HOP`, `clearLine`). `ceiling:` the little ones' play about the yard still steps straight, a few rods inside the yard.
- **On the page** (public/motion.js): every way is drawn, and every walk about the land drawn along, **with its corners rounded** - a
  curve from up to 0.006 mile before each corner to as far after, never past the middle of a stretch (`roundCorners`), within half that of
  the server's line; and **a walk is drawn at a walking pace**, 1.2 of a person's drawn height a second (`LAND_WALK_MILES_A_SECOND`, the
  travel cycles' own gait), done before the tick is when it is short; a walk longer than the tick at that pace still takes the tick
  (`ceiling:` the server has them there at its end).
- **Cost**, measured 2026-10-05 on 20 families of two ten-family classes (`node scripts/land-ways-measure.mjs`, the same 600 walks and 600 yard
  steps on the code before, a copy of 3f0ef6c7, and after; two runs each, this machine): a walk about the land 1.17-1.18 ms on average before
  and 1.26-1.28 after (p95 4.5-4.8 and 4.8-5.0, worst 8.3-8.8 and 7.5-8.1); a step about the yard 0.07 and 0.07-0.08; a tick of treading ways
  1.01-1.05 and 0.76-0.78 on average, 9.0-9.2 and 4.5-5.0 at worst. The search runs as often as it did, plus once for each going in or out
  of the weather (a short step over open ground needs none) and each first step beside somebody; a walk along a way finds only the part off
  it. Counting a way's cells cheap enough in the search's own estimate to keep people on them was tried first and made a walk five times
  dearer (6.3 ms); walking the way itself (`viaWay`) costs nothing to find.
- `ceiling:` the wagon, the kitchen garden and the woodpile are not walked round: they are places people go to, not ground a way keeps
  off. `ceiling:` where the stock is brought in at night can lie under a big house (public/herd-view.js `nightGround`); its way now goes
  in at the house's front, and the herd is still drawn there.

Tests `tests/land-ways.test.mjs` (5) and the rain test of `tests/shelter.test.mjs`, each watched failing (`node
scripts/map-fixes-injections.mjs`, [record](evidence/map-fixes-injections.json)); `npm run test:land-paths` re-run.
