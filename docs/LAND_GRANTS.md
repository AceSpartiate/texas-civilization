# Land grants, Survey, and clearing your own ground

**Status: decided 2026-09-13; step 1 (the grant) built 2026-09-13** ([evidence](evidence/grants.json)). **Terrain, water and the house site were decided the same evening (§8) and come before Survey.** Read this in full before changing a family's land, the field,
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
  stating the acres it brings and the wagon space it costs (`bring-stock`). A family whose load was packed before
  there was any choosing (an old save, or a family auto-rolled at Start) brings none.
- **What stock costs** (`FIC-GONZ-025`): a family driving stock arrives with fewer provisions — the wagon has
  two spaces fewer — because the herd is fed on the road. Stock do nothing else yet. `ceiling:` no herding,
  increase, sale or slaughter; the wandering-stock loss in an unfenced field stays as it is for everyone.
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
2. **Survey.** Placement mode, the `survey-plot` action with its refusals, the chore, plots drawn staked.
3. **Clearing and the field.** `clear-plot` by ground, the field as cleared plots, per-plot fences, ruin, old-save
   plots; retire `clear-ground` and `CLEARING_MAX`.
4. **Art.** Staked plot, cleared plot on prairie and on timber (stumps), grant boundary markers — requested in
   `docs/ART_REQUESTS.md`, with stand-ins from the field and fence art until they land.

---

## 8. Terrain, water and the house site — decided 2026-09-13, to be specified

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

What these commit the design to, before the detailed specification is written:

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

**Research before the specification:** the data (USGS elevation and hydrography for the Gonzales area: which
products, what resolution, their licence and size); springs, ponds and oxbow lakes near Gonzales in the 1830s, since
reservoirs built later are not 1835 water; how settlers there got water and dug wells; how fast people, horses and ox
wagons crossed that country; river conditions in the Runaway Scrape.
