# Art requests for Astra

## Standard practice for missing art

Owner's direction, 2026-09-12, and a standing rule in `CLAUDE.md`. When the game needs art the library
does not have:

1. **Request it here**, in the format below — why, exactly what, how it plugs in, how it is checked.
2. **Ship a stand-in** from art that already exists: the nearest figure, scaled, reused or recoloured
   by the renderer. Never block the feature on the art, and never leave it drawn wrongly without saying so.
3. **Mark it in code** with a `stand-in:` comment that names the request, the way `ceiling:` marks a
   deliberate simplification. Grep `stand-in:` to find every one.
4. **List it under *Stand-ins in use*** below, with what replaces it.
5. **On delivery**, swap the stand-in for the real art, delete its row, and keep any rule the stand-in
   established that the real art still needs.

## Stand-ins in use

| Stand-in | Where | Standing in for | Replace with |
| --- | --- | --- | --- |
| The six drawn towns' documented buildings the library cannot draw (frame buildings, the Whiteside Hotel, the Round Top House, jacales, Mina's stockade, Liberty's court room) | `sim/town-layouts.mjs`, drawn by `public/town-art.js` | Request 2026-09-16 — the buildings the towns' research found | the requested buildings |
| A new town's shops are the nearest buildings the library has, two trades sharing a sprite | `SHOP_SPRITES` in `sim/shops.mjs`, drawn in `drawWorld` in `public/app.js` | Request 2026-09-16 — the shops of the towns | `shop-*` buildings, one per trade |
| Whole jacal stage sprites; `lean-to` shed frame; procedural double chimney; no separate interior floor/loft display | `drawHousePlot` in `public/house-plot.js` | Request 2026-09-15 — the house plot's pieces | Jacal modules, shed frame, double chimney, and separately registered floor and loft overlays |
| Generic `chapel` and `adobe-flat` silhouettes represent San Fernando and the Governor's Palace | `public/bexar-layout.js` | Request 2026-09-14 — Béxar civic architecture | Researched 1836 civic façades in the existing illustrated style |
| A person is drawn as the nearest figure by sex and age: a woman or girl as `teal`, a boy as `blue`, a man as `elder`; the principal in `rust` whoever they are, including a mother | `castVariant` in `public/motion.js` | Request 2026-09-12, priority 2 — the second cast | `rust-woman` for a mother who is principal, `indigo` and `teal` for women, `ochre` and `elder` for men, `blue-girl` and `blue` for adolescents |
| A child in an unavailable action pose is a grown figure drawn smaller (90% at 10–17, 70% at 5–9, 55% at 2–4, 45% an infant). Idle, cardinal walking, rest and injured-rest use delivered `girl`, `boy`, `smallchild` and `infant` art | `CHILD_POSES` and `entityClip` in `public/motion.js` | Request 2026-09-12, priority 1 — children | Any later child-specific action poses. **Keep the scaling**: the delivered sheets fill their cells and need it |
| A person's appearance - a parent's chosen, a child's taken after the parents - is shown only in words in the family book ("olive skin, black hair, rust clothes, a beard"); the figure on the map is still chosen by sex and age | `public/appearance.js`, `sim/appearance.mjs` | Request below — layered people art | Layered or palette-swappable sheets for the whole cast |
| A saddlebag house's interior is drawn on the dog-run's picture (`interior-dog-run`, drawn wide), with its own ten spots measured there — by each hearth at the outer ends where that picture draws them, each back wall, window, pen and door — and nothing set in the passage the picture shows | `INTERIORS.saddlebag` in `sim/interior-data.mjs`, drawn by `public/interior.js` | Request 2026-09-12 (second) — interiors and furnishings: a saddlebag interior | `interior-saddlebag`; re-measure the spots on it, the hearths at the central chimney |
| Five priority tree kinds use delivered size-specific art: pine, cedar, mesquite, live oak and elm. Shortleaf temporarily shares loblolly art; post oak, blackjack and the remaining hardwoods still use their nearest original broadleaf tree | `KINDS` picture in `sim/woods.mjs`, drawn by `drawGroundDetail` in `public/app.js` | Request 2026-09-15 — the trees of the colonies | `post-oak` and `blackjack` at three sizes; remaining species-specific hardwoods are later breadth |
| Anybody of a family riding the family horse is their own figure's idle pose (`seatedClip`), facing the way they go, cut off below the waist and drawn over the back of the family's walking horse (`horse-walk`, `-n`, `-s`); the horse is not drawn again. It replaced the courier rider on 2026-09-16, which read as a stranger on the horse | `seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`; `drawSeated` in `public/app.js` | Request 2026-09-14 — family members on horseback | Each cast figure mounted on the family's chestnut, walking in four directions |
| Whoever drives the ox and wagon is their own figure's idle pose, cut off below the waist, sitting at the front of the side-view wagon (`wagon-travel`) with the ox (`ox-walk`, `-n`, `-s`) ahead; the ox and wagon are not drawn again. Going north or south the wagon stays side-on and the ox is above or below it | `wagonDriverId`, `seatOf`, `seatLayout` in `public/motion.js`; `drawSeated` in `public/app.js` | Request 2026-09-16 — driving the ox wagon | An ox team hitched to the wagon with a seated driver, in four directions, for every cast figure |
| A rider never gets down to talk: they speak from the saddle, turned east, west, north or south toward the listener (the vertical dialogue delivered 2026-09-14 is in use) | `carrierClip` in `public/motion.js` | Request 2026-09-12, priority 3 | `courier-dismount` (delivered 2026-09-14, registered, not yet bound: it needs the encounter to know when a rider has got down and where the horse stands) |
| The road's three panel icons are glyphs drawn in canvas strokes: a rifle over a campfire (`hunt-road`), a figure under a blanket with a cup beside (`tend-sick`), a coin passed over a ferry's rail (`trade-crossing`) | `drawGlyph` in `public/family-panel.js`; `PANEL_ICONS` carries `glyph` and no sprite, and `drawIcon` takes `icon-<key>` the moment it is registered | Request 2026-09-16 — the road's icons | `icon-hunt-road`, `icon-tend-sick`, `icon-trade-crossing` |

## Claude-drawn stand-ins (replace with Astra's)

Owner's instruction, 2026-09-16: complete the outstanding requests with Claude-drawn art, marked so Astra can replace any of
it at a glance. Everything in this table was **drawn by Claude, not by Astra**, and is kept apart from her library so that it
can never be mistaken for hers:

- **Where:** `public/assets/claude-standins/` — its own folder, its own sheets (every file prefixed `claude-`), its own
  `atlas.json` with `madeBy: "claude"` on every sheet and frame, and the hand-written SVG sources under `svg/`
  (`claude-<frame>.svg`; the portraits are generated by `scripts/draw-claude-portraits.mjs`). Built by `npm run build:standins`
  (`scripts/build-claude-standins.mjs`, the same Playwright/Chrome the browser proofs use). Nothing is added to
  `frontier-v1/atlases/` or `atlas.json`.
- **How it is drawn:** `public/art.js` reads the second manifest after hers and lets **her frame of the same name win**, so
  registering a delivery through `npm run build:art` replaces the stand-in with no change to the page. `tests/claude-standins.test.mjs`
  then fails, naming the frame, until the SVG, its entry in `SHEETS` in `scripts/build-claude-standins.mjs` and its row here are
  deleted and the stand-ins rebuilt.
- **In code:** every place that draws one keeps a `stand-in:` comment pointing at this section. Grep `stand-in:`.
- **What she delivers:** each request's contract below is unchanged; the frame name in the table is the name to deliver, at
  the size in the contract, and it will take over on registration.

| Request | Claude-drawn file (frame names) | Where it plugs in | What Astra should deliver to replace it |
| --- | --- | --- | --- |
| Request 2026-09-16 — the family panel's marks | `claude-marks.png`: `mark-need`, `mark-need-rider`, `mark-main`, `mark-idle`, `mark-auto-off`, `mark-auto-on` | `panelMark`/`paintMark` in `public/app.js` (a canvas in `.panel-attention`, `.panel-star`, `.panel-idle-mark`, `.panel-focus` and `.panel-auto`; the type shows only while no frame is drawn, `data-drawn`), `drawMark` in `public/family-panel.js` | The five marks at 96 by 96, transparent, no text; `mark-auto` in its two states as `mark-auto-off` and `mark-auto-on` (dim brown; green `#4f7a3a`) |
| Request 2026-09-16 — the winter's icons | `claude-icons-winter.png`: `icon-enlist-regular`, `icon-enlist-auxiliary`, `icon-join-garrison`, `icon-join-matamoros`, `icon-go-vote`, `icon-winter-recall`, `icon-join-relief`, `icon-join-houston` | `PANEL_ICONS` in `public/family-panel.js` (every key names `icon-<key>`) | The eight icons at 128 by 128 in the action-icon contract, reading at 38 pixels and dimmed to 40 per cent |
| Request 2026-09-15 — action icons for the family panel | `claude-icons-actions.png`: `icon-<key>` for `survey-plot`, `cut-lane`, `dig-well`, `plant-field`, `harvest-field`, `clear-plot`, `fence-plot`, `build-house`, `help-raise`, `hunt-timber`, `hunt-land`, `practise-shooting`, `sell-cotton`, `fetch-powder`, `fetch-seed`, `sell-food`, `mend-hoe`, `replace-hoe`, `fell-trees`, `haul-logs`, `travel-gonzales`, `travel-home`, `visit`, `work`, `rest`, `stop-chore`, and three the contract did not list but the panel has, `visit-shop`, `make-furniture`, `buy-furniture` | `PANEL_ICONS` and `drawIcon` in `public/family-panel.js`; the four drawn glyphs and the fitted scene sprites are gone (a dot remains for a sheet that has not arrived) | All twenty-nine at 128 by 128, one silhouette each, per the contract; the three extra keys need icons too |
| Request 2026-09-15 — face portraits for the family panel | `claude-portraits.png`: `portrait-rust`, `portrait-teal`, `portrait-elder`, `portrait-blue`, `portrait-rust-woman`, `portrait-indigo`, `portrait-ochre`, `portrait-blue-girl`, `portrait-girl`, `portrait-boy`, `portrait-smallchild`, `portrait-infant` | `drawPortrait` in `public/family-panel.js` (draws `portrait-<figure>` for the figure `castVariant`/`childFigure` choose; without one it still crops the idle clip, the older stand-in) | Twelve head-and-shoulders portraits at 192 by 192 matching the sheet figures exactly; Claude's are one parameterised drawing dressed after each figure and are the first to replace |
| Request 2026-09-12 (second) — interiors and furnishings: the wagon's tools | `claude-home-tools.png`: `home-hoe`, `home-felling-axe`, `home-broadaxe`, `home-froe`, `home-auger` | `INTERIOR_ART` `tool:*` in `sim/interior-data.mjs`, drawn by `public/interior.js` (the long-handled tools still drawn larger) | The five tools in the `home-furnishings` style and scale, standing or leaning as in a cabin |

**Not attempted, still on the nearest library art** (each needs animation sheets or whole buildings in Astra's painted
style, which a hand-written SVG cannot match without jarring beside her work; their rows stay under *Stand-ins in use*):
the shops of the towns, the buildings the towns' research found, the house plot's remaining pieces, the remaining trees,
Béxar's civic façades, family members on horseback, driving the ox wagon, the rider who gets down, the saddlebag interior,
the second cast's remaining sheets and layered people.

---

Open requests, newest first. Each one says why it is needed, what exactly to deliver, how it plugs
into the existing pipeline, and how it will be checked. When a request is delivered, mark it
**Delivered** with the date and move the details into [ART_MANIFEST.md](ART_MANIFEST.md) by running
`npm run build:art`; do not delete it from here.

---

## Request 2026-09-16 — the road's icons

**Status: open; glyphs drawn in canvas strokes in use since 2026-09-17 (see *Stand-ins in use* above).** The road east
([ROAD_EAST.md](ROAD_EAST.md)) gives a family three things to do while it flees: a hunt from the camp, a day's nursing of the
sick, and buying food among the families camped at a crossing. Each is an order on the family panel with no icon art.

- **Why.** Three stroke-drawn glyphs sit beside thirty-eight illustrated icons and read as placeholders; the hunt's glyph in
  particular must be told from the two hunts at home.
- **What.** Three icons in the action-icon contract (request 2026-09-15 — action icons, 128 by 128, one silhouette each,
  reading at 38 pixels and dimmed to 40 per cent): `icon-hunt-road` (a rifle leaning over a small campfire beside a halted
  wagon wheel), `icon-tend-sick` (a figure lying under a blanket with a cup or bowl set beside them), `icon-trade-crossing`
  (a coin passed hand to hand over a ferry's rail, water below).
- **How it plugs in.** Registered through `npm run build:art`; `drawIcon` in `public/family-panel.js` takes `icon-<key>` for
  a key whose `PANEL_ICONS` entry has only a glyph, with no change to the page; the glyph stays as the fallback for a sheet
  that has not arrived.
- **Check.** At 38 CSS pixels on the panel's dark row each is told apart from the others and from `icon-hunt-timber` and
  `icon-hunt-land`.

## Request 2026-09-16 — the shops of the towns

**Status: open; the nearest buildings stand in.** The owner asked for towns that feel alive, with a shop per keeper and, in the towns
not already drawn, each keeper's own building ([TOWNS.md](TOWNS.md) §5a). In Gonzales each keeper uses a building already drawn;
elsewhere each trade is the nearest building the library has: store `trading-house`, carpenter and wheelwright `timber-shop`,
blacksmith `shed-open`, gunsmith `cabin-small`, doctor `house-hewn-log`, tavern `house-dog-run`, tanner and mill `storehouse`,
weaver `cabin-weathered`.

- **Why.** A student in town should be able to tell the smithy from the tavern without reading a label; two trades share a
  sprite today and the mill is a storehouse.
- **What.** At homestead scale, in the frontier-v1 style and the projection and footprint of `cabin-small`, anchored at the base
  centre: `shop-blacksmith` (an open forge shed, anvil, bellows, smoke), `shop-gunsmith` (a log shop with a rifle-shaped sign
  and a bench under the eave), `shop-doctor` (a small frame or hewn-log office with a shingle), `shop-tavern` (a double log
  house with a gallery and benches), `shop-tanner` (a shed with hides stretched on frames and a bark pit), `shop-wheelwright`
  (a shed with wheels leaning against it), `shop-mill` (a small log gristmill with a millstone by the door; horse-powered, not a
  water wheel, unless a town's research documents one), `shop-weaver` (a cabin with a loom visible through the open door and
  cloth on a line), `shop-carpenter` (a shed with planks and a sawhorse). No lettering; a sign may be a picture.
- **How it plugs in.** `SHOP_SPRITES` in `sim/shops.mjs` names the sprite a new town's shop is drawn as; replace each with its
  `shop-*` frame once registered through `npm run build:art`. Gonzales keeps its own drawn buildings.
- **Check.** At the zoom a town's labels appear, each trade is told apart without its label.

## Request 2026-09-16 — the winter's icons

**Status: open; Claude-drawn stand-ins in use since 2026-09-16 (see *Claude-drawn stand-ins* above).** The second class period's choices ([COLONIES.md](COLONIES.md) §6n) are orders on the
family panel with no icon art: enlisting (two orders), joining the garrison at Béxar, going south to the Matamoros men, voting,
and sending for somebody who serves.

- **Why.** A flag, a box and an arrow drawn in canvas strokes read as placeholders beside the illustrated icons, and two
  enlistment orders share one glyph.
- **What.** Six icons in the action-icon contract (request 2026-09-15 — action icons): `icon-enlist-regular` (a recruiting
  table with a roll and a quill), `icon-enlist-auxiliary` (the same with a folded land certificate), `icon-join-garrison`
  (the Alamo church's front or a walled mission gate), `icon-join-matamoros` (a mounted volunteer riding off to the south),
  `icon-go-vote` (a hand putting a folded paper into a wooden box), `icon-winter-recall` (a rider turning back toward a cabin), `icon-join-relief` (riders crossing open ground toward a far church front), `icon-join-houston` (a column of men on the march with a flag). The flight itself has no icon: it is the main person's card, opened by the "!".
- **How it plugs in.** Registered through `npm run build:art`; `PANEL_ICONS` in `public/family-panel.js` names the sprite in
  place of the glyph for each key.
- **Check.** At 38 CSS pixels on the panel's dark row each is told apart from the others and from the farm icons; the two
  enlistments are distinguishable.

## Request 2026-09-16 — the family panel's marks

**Status: open; Claude-drawn stand-ins in use since 2026-09-16 (see *Claude-drawn stand-ins* above); before that, type and CSS.** The owner asked for "an exclamation point there for me to click on" when a person
needs the student, and for one person to be chosen as the main one ([FAMILY_PANEL.md](FAMILY_PANEL.md) §11). Rows now also
show who is idle. None of the three has art; each is a character or a word styled by the page.

- **Why.** The marks are what a student scans the column for. A system-font "!" and "★" look like the web page they are, not
  the illustrated game around them, and "idle" in small capitals is easy to miss on a portrait.
- **What.** Four small marks, transparent, in the illustrated palette with the thin dark outline the icons will have, drawn to
  read at 24 CSS pixels (deliver at 96 by 96): `mark-need` (an exclamation point on a round orange token, the colour of the
  map's own mark over a person, `#c2582c`), `mark-need-rider` (the same token in slate, `#41556b`, for a rider waiting to speak),
  `mark-main` (a gold star or a small brass badge, marking the student's main person), `mark-idle` (a small resting sign, such as
  a hat hung on a peg, laid on the corner of a portrait), and `mark-auto` (a small sign that the person runs by themself —
  a wound clockwork key, say — in two states, off in the panel's dim brown and on in its green `#4f7a3a`; added 2026-09-16
  with the auto switch, [FAMILY_PANEL.md](FAMILY_PANEL.md) §11.7). No text in any of them.
- **How it plugs in.** Registered through `npm run build:art`; `panelRow` in `public/app.js` draws them in place of the
  characters in `.panel-attention`, `.panel-star` and `.panel-idle-mark`. The buttons keep their accessible names, which carry
  the words.
- **Check.** At 24 pixels on the panel's dark row and on a portrait, each is told apart from the others and from the action
  icons; the "!" still reads while it bobs.

## Request 2026-09-15 — face portraits for the family panel

**Status: open; Claude-drawn stand-ins in use since 2026-09-16 (see *Claude-drawn stand-ins* above); before that, the figure's own head and shoulders.** The owner asked for a panel down the left of the screen with "a
small picture of the character's face" for every person in the family ([FAMILY_PANEL.md](FAMILY_PANEL.md) §6). There are no
portraits, so each is the top of the person's map figure drawn large, which is legible but low and soft at 56 pixels.

- **Why.** The portrait is how a student tells their people apart at a glance and the button that takes the camera to them. A
  cropped walking figure is blurred, cut off at the chest, and identical for every small child.
- **What.** A head-and-shoulders portrait, facing the viewer, on a transparent ground, one per figure the renderer draws a
  family member as, **matching the existing cast and children exactly** (same clothes, hat, bonnet, hair and colours as the
  sheet): first cast `rust` (the principal's coat, a man), `teal` (a woman), `elder` (an older man), `blue` (an adolescent boy);
  second cast `rust-woman` (the principal's coat, a woman), `indigo` (a woman), `ochre` (a man), `blue-girl` (an adolescent
  girl); children `girl` and `boy` (5–9), `smallchild` (2–4) and `infant` (under 2, in or out of the basket). Named
  `portrait-<figure>`, square, drawn to read at 44 and 56 CSS pixels (deliver at 192 by 192), the head centred a little above
  the middle with the shoulders to the bottom edge. No background scene; a flat ground is added by the page. One neutral
  expression each; nothing about a person may be inferred from how they look (`VISION.md` §15).
- **How it plugs in.** `drawPortrait` in `public/family-panel.js` receives the figure name `castVariant`/`childFigure` already
  choose; with the frame registered through `npm run build:art` it draws `portrait-<figure>` fitted to the square instead of
  cropping the idle clip. When layered people art lands (the request below), portraits follow the same layers.
- **Check.** Beside the map figure at the same moment the portrait is recognisably the same person; the principal's rust is
  visible; the four children's portraits are told apart at 44 pixels; alpha edges clean, no painted transparency.

## Request 2026-09-15 — action icons for the family panel

**Status: open; Claude-drawn stand-ins in use since 2026-09-16 (see *Claude-drawn stand-ins* above); before that, the nearest library pictures and drawn glyphs.** Every action a student can give a person is now an
icon on that person's row ([FAMILY_PANEL.md](FAMILY_PANEL.md) §4, §6). The stand-ins are scene sprites shrunk into a square,
so several read poorly at 38 pixels (a barrel, a crate and sacks look alike) and four are plain drawn glyphs.

- **Why.** The owner asked that "each icon will have a picture of an action". A picture of a *thing* (a bucket) is not a
  picture of the *action* (digging a well), and a row of twelve small props is hard to scan.
- **What.** One icon per action, square, transparent, a single strong silhouette in the illustrated palette with a thin dark
  outline so it reads on the panel's light tile and at 34 and 38 CSS pixels (deliver at 128 by 128), and a version that still
  reads dimmed to 40 per cent (a refused action). Named `icon-<key>`:
  `survey-plot` (a stake being driven), `cut-lane` (an axe in brush beside a track), `dig-well` (a spade at a well mouth),
  `plant-field` (a hand dropping seed in a furrow), `harvest-field` (a sickle and a sheaf), `clear-plot` (a grubbing hoe and a
  stump), `fence-plot` (a maul splitting a rail), `build-house` (a log being notched), `help-raise` (two hands lifting a log),
  `hunt-timber` (a rifle among trees), `hunt-land` (a deer's head), `practise-shooting` (a mark with a hole in it),
  `sell-cotton` (a cotton bale and a coin), `fetch-powder` (a powder horn and lead), `fetch-seed` (a seed sack),
  `sell-food` (a barrel of meal and a coin), `mend-hoe` (a hoe blade and a file), `replace-hoe` (a new hoe and a coin),
  `fell-trees` (an axe in a trunk), `haul-logs` (a log on a chain behind an ox yoke), `travel-gonzales` (a signpost, town
  side), `travel-home` (a cabin doorway), `visit` (two cabins and a path), `work` (a hoe and a basket), `rest` (a bedroll),
  `stop-chore` (a hand raised, stop). Period-appropriate tools only (`HIST-GONZ-027`/`028`); no weapon pointed at a person.
- **How it plugs in.** `PANEL_ICONS` in `public/family-panel.js` maps each key to a sprite; registering the frames and naming
  `icon-<key>` there is the whole swap. `tests/family-panel.test.mjs` fails if an icon names a frame the atlas does not have.
- **Check.** All twenty-six side by side at 38 pixels are told apart without their popups by somebody who has not seen them;
  each still reads at 40 per cent opacity and under the yellow glow the panel draws round an action in progress.

## Request 2026-09-15 — the house plot's pieces

**Status: partially delivered 2026-09-15.** `house-modules.png` supplies registered round/hewn sills, low and full walls, partial and finished roofs, passage floor/roof, porch, finished shed room, building/finished stick-and-mud chimneys and a stone chimney. The live plot uses those pieces without changing server stages. Jacal modules, a shed frame, a two-sided double chimney, and separate floor and loft overlays remain open; the combined floor/loft plate is library-only.

- **Why:** a pen currently repeats a whole-house silhouette, so additions cannot read as one coherent building.
- **What:** round/hewn 16-foot pen sills and ten stackable wall courses, door/window faces, separate rafters/clapboard roof and chinking overlays; jacal post/wattle/thatch stages; an eight-foot passage roof; stick-and-mud, stone and double chimneys; 16-by-8-foot shed and porch; floor and loft overlays. Match existing illustrated art. Supply grounded anchors, footprints and occlusion masks, with transparent PNGs and manifest entries. Roof and wall layers must support cutaways; construction stages must be independently addressable rather than baked into a single image.
- **Integration:** `public/house-plot.js` consumes the server's piece type, grid position and stage. Art must never decide construction completion, collision, logs or shelter. Keep unstarted pieces as plan presentation only.
- **Acceptance:** five presets and a free-built arrangement join without seams or duplicate roofs; course progression stays anchored; interior additions remain legible; missing/final stages and alpha/cell boundaries pass the art checks. These are construction state layers; no autonomous construction animation should advance authoritative progress.

## Request 2026-09-15 — the trees of the colonies

**Status: partially delivered 2026-09-15.** `trees-colonies-1.png` supplies loblolly pine, cedar, mesquite, live oak and elm
at pole, log and large sizes, plus a pine stump. The owner asked for realistic woods (docs/WOODS_AND_BUILDING.md §4). The map now
draws every tree where it stands on the real land, of its kind: loblolly pine round Bastrop and in the east, live oak in the
coastal bottoms, post oak and blackjack on the savanna, pecan, elm and hackberry by the water, cedar in the hills, mesquite
west of the Guadalupe. Post oak and blackjack size variants, additional species-specific hardwoods and the general felled log remain open. Shortleaf uses the delivered loblolly silhouette until its own atlas exists.

- **Why.** A student standing in the Lost Pines sees broadleaf trees; one in the thornscrub sees bushes where the mesquite is
  a small tree. The kind of tree is what tells a family what its timber is good for (felling, step 4).
- **What.** Transparent, anchored at the foot of the trunk, seen from the game's three-quarter view, in the style of
  `oak-broad` and `cottonwood`, each at three sizes (`-pole`, `-log`, `-large`: a young straight tree, a
  mature one, an old wide one): `pine-loblolly` (tall, straight, a high crown of long needles), `cedar` (Ashe juniper,
  a dark bushy cone, often many-stemmed), `mesquite` (low, open, crooked, feathery), `live-oak` (low and very wide,
  dark evergreen), `post-oak` (a rounded crown of lobed leaves, stout crooked limbs), `blackjack` (smaller, darker,
  rougher than post oak), `elm` (vase-shaped). Stumps for pine and pecan to go with `stump-post-oak` and
  `stump-cottonwood`, and a felled log lying on the ground, for step 4.
- **How it plugs in.** `KINDS` in `sim/woods.mjs` names each kind's picture; the page draws `picture` at the tree's size
  (`TREE_SIZES` in `public/app.js`). Registering the frames and changing the names is the whole swap.
- **Check.** Beside `oak-broad` at the same size the crowns are comparable in width, so a closed stand still reads closed and
  savanna still reads open; a pine is plainly a pine at the size the map draws a tree close up.

## Request 2026-09-14 — game

**Status: delivered and in use 2026-09-15.** Found in play: "when hunting i don't see an animal". A hunt now places a deer
(`HIST-TEX-015`) ahead of the hunter in the timber, nearer if they wait for it.

- **Why.** The hunt's one decision - take the long shot or wait - means little when nothing is there to shoot at.
- **What.** A white-tailed deer, `deer-idle` (four frames, grazing and lifting the head), `deer-alert` (head up, ears
  forward, still) and `deer-bound` (four frames, running away), east-facing (mirrored for west), transparent, anchored at the
  hooves, sized to stand about as tall at the shoulder as a person's waist beside the existing people. No blood, no carcass.
- **How it plugs in.** `miniDeer` in `public/app.js` draws the clip for `chore.quarry`; `alert` while the hunter waits on the
  family's word, `bound` for the tick of a missed shot if that state is ever projected.
- **Check.** Scale against `rust-idle-s` and `horse-chestnut`, alternating legs in the run, no painted transparency.

Delivered in `wildlife-deer`: four-frame idle, alert, bound and drinking cycles. The live quarry uses idle and switches to alert while the hunter awaits the family's answer; the server still supplies the only position and visibility. Bound and drinking are registered for later projected states and never invent behavior.

## Request 2026-09-16 — the buildings the towns' research found

**Status: open; each is the nearest building the library has.** The six towns drawn from `docs/town-research/` (docs/TOWNS.md
§9) name buildings the library cannot draw. In the frontier-v1 style and the scale of `house-hewn-log` and `trading-house`,
south-facing like the other buildings, with a ground-contact shadow and no painted transparency:

1. **A frame building** — clapboard siding on sawn studs, a shingle roof, glazed sash windows, a plank door; one storey, and a
   storey-and-a-half variant. San Felipe's Cooper & Chieves saloon, the only frame building there in 1828; Columbia's Kelsey
   store; Matagorda's frame town of imported lumber. Stand-in: `trading-house`.
2. **A two-storey frame house**, two rooms below and two above — Columbia's Brown house, where the Senate sat. Stand-in:
   `frame-hall`.
3. **A storey-and-a-half log house with a central passage and a stick-and-mud chimney at each end** — San Felipe's Whiteside
   Hotel. Stand-in: `house-dog-run` drawn taller.
4. **The Round Top House** — a round fortified house with gun slits at first-floor level and a heavy door; Victoria's own
   landmark. Stand-in: `storehouse` drawn taller.
5. **Jacales in variety** — two or three jacal silhouettes and one with a brush ramada, for a town whose houses were mostly
   jacales (Victoria). Stand-in: the one `house-jacal` at varied heights.
6. **A frontier log stockade** — a free-standing square of set vertical logs with a gate, enclosing a cabin (Mina). Stand-in:
   `palisade` pieces run in a square with a `gate` and `house-hewn-log` inside.
7. **A small hewn-log court room, 22 feet square** — Liberty's Casa Consistorial. Stand-in: `cabin-small`.
8. **A circular log-and-sand fort**, ninety feet across, two rows of posts with sand between, a mound with a gun in the middle,
   gapped and derelict — Fort Velasco. Stand-in: `palisade` and `alamo-palisade-broken` pieces in a ring, `cannon-iron-e`.
9. **A steam sawmill on a bayou** — a long plank shed, a boiler house with a stack and smoke, a log deck and stacks of sawn
   pine — the Harrisburg Steam Mills. Stand-in: `timber-hall` and `storehouse`.
10. **A two-storey stone house with a gallery and an outside stair** — the Stone House at Nacogdoches, 70 × 23 ft. Stand-in:
    `stone-tile-house`.

- **How it plugs in.** Each building's `sprite` in `sim/town-layouts.mjs`; the stockade replaces the palisade pieces with one
  building. **Check** in `npm run test:towns`, whose close screenshots show each town.

## Request 2026-09-16 — driving the ox wagon

**Status: open; the person's own figure sits on the side-view wagon.** Owner's playtest, 2026-09-16: "characters don't actually
sit on the horse when using it ... Same thing for the Ox and Wagon." Whoever takes the ox and wagon was drawn walking in front
of it; they are now their own standing figure cut off at the waist and put on the front of the wagon, with the ox drawn
separately ahead. Nothing hitches the ox to the wagon, and going north or south the wagon is still side-on.

- **Why.** The person driving should read as driving: on the seat, reins or a goad in hand, the ox yoked to the tongue.
- **What.** In the frontier-v1 style and the scale of `wagon-covered` and `ox-walk`: (1) the covered wagon with one ox yoked to
  its tongue as one rolling rig, facing east (mirrored for west), north (away) and south (toward the camera), four frames each,
  with the wheels turning; loaded and empty covers as the existing `wagon-*-travel` cycles have; (2) a seated driver layer for
  each first- and second-cast figure (`rust`, `teal`, `blue`, `elder`, `rust-woman`, `indigo`, `ochre`, `blue-girl`) that sits
  on the rig's seat in each direction, holding the lines or a goad, anchored to the rig's seat point. A period ox driver often
  walked beside the team with a goad; this request is for the seated driver the owner asked for, and a walking-driver pose is
  welcome beside it.
- **How it plugs in.** `seatLayout('wagon', direction)` in `public/motion.js` returns the parts `drawSeated` draws; with the rig
  and driver layers registered through `npm run build:art`, it returns one `wagon-ox-<direction>` part and a
  `<figure>-drive-<direction>` layer in place of the separate ox, wagon and cut-off figure. `carriedWithRider` keeps the ox and
  wagon from being drawn a second time.
- **Check.** At the portrait's zoom, the driver is recognisably the same person as their walk cycle, the principal's rust coat
  visible; the ox stays hitched through a turn; ground contact matches `wagon-covered`; no painted transparency.

## Request 2026-09-14 — family members on horseback

**Status: open; the person's own figure sits on the family horse** (since 2026-09-16; before that the courier rider stood in,
and the owner saw a stranger riding). Found in play: a person sent on the horse was drawn walking with the horse beside them.
They are now drawn in the saddle as themselves, cut off at the waist over the horse's back, which reads as sitting but has no
legs astride and no hands on the reins.

- **Why.** A mother riding to the store, a son riding to hunt and the principal riding to Gonzales should each be seen as
  themselves on the family's horse, and the principal's rust coat must stay the student's mark even mounted.
- **What.** For each first- and second-cast adult figure (`rust`, `teal`, `blue`, `elder`, `rust-woman`, `indigo`,
  `ochre`) and the adolescent `blue-girl`: mounted on the same chestnut horse as `courier-mounted`, a walk cycle facing east
  (mirrored for west), north (away) and south (toward the camera), four frames each, same cell size and ground anchor as
  `mounted-courier-e`/`-n`/`-s`. Women ride astride or sidesaddle as the period evidence for Texas settlers supports; say which.
- **How it plugs in.** `seatLayout('horse', direction)` in `public/motion.js` returns one `${variant}-ride-${direction}` part in
  place of the horse and the cut-off figure, registered through `npm run build:art`; `carriedWithRider` keeps the horse from
  being drawn twice.
- **Check.** Each figure recognisably the same person as their walk cycle, horse scale identical to the courier's, feet
  alternating, no painted transparency, and the principal's rust coat visible from all three sides.

## Request 2026-09-14 — Béxar civic architecture

**Status: open; premade stand-ins in use.** The owner's San Antonio panorama guides the town composition; it does not establish detailed architectural elevations.

- **Why.** Named San Fernando and Governor's Palace landmarks should become recognizable without borrowing later façades or changing the game's art style.
- **What.** Research the 1836 appearance before production, then deliver `bexar-san-fernando-1836` and `bexar-governors-palace-1836`: warm outlined elevated three-quarter illustrated façades, transparent background, matched to existing `chapel`/`adobe-flat` scale and ground anchors. Preserve uncertainty explicitly where evidence is insufficient. Supply roofs separately if interiors are later required; the initial exterior is intentionally static.
- **How it plugs in.** Replace the two named sprite IDs in `public/bexar-layout.js`, preserve stable placement IDs and the Alamo coordinate transform, and register source, prompt, alpha bounds and anchors through the normal art build. No new scene or world entities are implied.
- **Check.** Compare the researched period reference and rendered town close-up; reject later architectural additions, painted transparency, mismatched perspective and doorways too small for the established person scale.

---

## Request 2026-09-14 — cleared ground

**Status: delivered and in use 2026-09-14.** `land-clearing` supplies four stump variants, cut-brush and ash states, four survey/corner markers and a four-pose smoulder cycle. Own timber plots now keep stumps; worked brush/timber plots show dry brush within the cleared portion. Smoke is catalogued but not inferred from work. See [delivery and checks](ART_DELIVERY_2026-09-14-FIELDS.md). Specified in [LAND_GRANTS.md](LAND_GRANTS.md) §5 and §7 step 4.

- **Why.** A family now clears ten-acre plots out of prairie, brush or timber (`HIST-GONZ-039`: timber three times the work).
  Ground cleared from timber was full of stumps for years; drawn as the same turned earth as prairie, the harder clearing
  leaves no mark on the land.
- **What.** In the frontier-v1 style, at the scale of `scrub` and `rocks`: `stump` (two or three variants, a felled post oak
  and a cottonwood stump), and `clearing-brush` (a pile of cut brush and a smouldering brush pile), for ground being cleared.
- **How it plugs in.** Single sprites on a transparent sheet, anchored at the base, listed in `ART_MANIFEST.md` by
  `npm run build:art`. `drawPlots` scatters stumps over a cleared plot whose `ground` is `timber`, keyed to its position like the
  ground scatter, and brush piles over the part of a staked plot already worked (`plot.work`).
- **Check.** A cleared timber plot and a cleared prairie plot side by side read differently at the closest zoom; the crop rows
  still read over the stumps; nothing is drawn on a neighbour's field.

---

## Request 2026-09-13 — stock and the grant

**Status: delivered and in use 2026-09-14.** The corrected `animal-stock` sheet passes alpha and spacing review with zero overlap trimmed. Three longhorn coats and a rooting hog replace the ox stand-ins, preserving own-land visibility and depth sorting. Survey stakes and corner markers are delivered in `land-clearing`; plot corners use the new stone marker and stake. Original request: [LAND_GRANTS.md](LAND_GRANTS.md) §3.

- **Why.** A family now chooses in the lobby whether it drives cattle and hogs in behind the wagon, which decides how
  much land it holds (`HIST-GONZ-036`). The herd is drawn with oxen until it has figures of its own.
- **What.** In the frontier-v1 style and projection of `ox-brown`: `cattle-longhorn` (idle, grazing; two or three
  coat variants) and `hog` (idle, rooting), at the scale the ox is drawn. Later, with Survey: a surveyor's stake and a
  corner marker (a blazed post or a stone mound), for staked plots and grant corners.
- **How it plugs in.** The same sheet contract as the ox: frames on a transparent sheet, anchored at the feet, listed in
  `ART_MANIFEST.md` by `npm run build:art`. The renderer draws them where it draws the two stand-in oxen now.
- **Check.** A stock family's yard shows cattle and hogs, a family without stock shows none, and they sort in front of
  and behind the house correctly.

---

## Request 2026-09-12 (second) — settling in: houses, interiors, furnishings, and people whose looks can be chosen

**Status: houses delivered and in use 2026-09-14** (`houses-settling`: the four houses and their `-site`, `-walls` and `-roofing` stages, drawn by the stage the server reports). **Interiors and furnishings delivered 2026-09-14** (`home-interiors`, `home-furnishings`), in use in the interior view since 2026-09-16; a saddlebag interior still open (below); the wagon's tools are Claude-drawn stand-ins since 2026-09-16 (see *Claude-drawn stand-ins* above). Layered people still open. Specified in [SETTLING_IN.md](SETTLING_IN.md); the exact sheets are to be written
into this request when that chapter's build reaches them, in the contract format of the request below.

- **Layered people.** Students now choose what parents look like (skin tone, hair colour, clothing colour,
  hat, beard, bonnet or pinned hair), and children take after their parents. Baked-colour figures cannot
  show that. Needed: the cast — adults, adolescents and the requested children — drawn as aligned layers
  (body and skin, hair, facial hair or head covering, clothing), or with clean flat colour regions a
  renderer can swap, across idle, walk, vertical and task sheets.

  **Written out 2026-09-16 for step 8, which is built and drawing the stand-in** (`sim/appearance.mjs`, `public/appearance.js`).
  What a student can now choose, and so what the art must be able to show:

  | Part | Choices (the server's words, `SKIN`, `HAIR`, `CLOTHING`, `HEAD` in `sim/appearance.mjs`) |
  | --- | --- |
  | Skin | fair, light, olive, tan, brown, dark brown, deep brown |
  | Hair | black, dark brown, brown, auburn, red, fair, grey |
  | Clothes | rust, indigo, ochre, teal, butternut, grey, cream |
  | A man | a hat, or a beard (bareheaded) |
  | A woman | a bonnet, or hair pinned up |

  Children take a skin, hair and clothes colour after their parents and wear nothing on their heads.

  - **Format:** for every people sheet that exists now — `civilians`, `people-walk`, `people-vertical`, `people-work`,
    `people-carry`, `people-tasks`, `people-care`, `people-search-trade`, the three `people-children-*` sheets and the
    mounted rider — deliver the same grid, same cells and same frames as **aligned layer PNGs** named
    `<sheet>--<layer>.png`, every layer registered pixel for pixel with the others:
    `--line` (contours, and all shading as greyscale darkening, no hue), `--skin`, `--hair`, `--clothes` (each a
    greyscale value mask of only that region, light where lit, which the renderer tints), and the head items
    `--hat`, `--beard`, `--bonnet`, `--pinned` (each fully coloured and drawn over the hair where it covers it).
    Transparent RGBA; no painted checkerboard, text, borders or shadows. A woman's row carries `--bonnet` and
    `--pinned`, a man's `--hat` and `--beard`, a child's none.
  - **One figure per sex and age band, not one per identity:** a man, a woman, an adolescent girl, an adolescent
    boy, and the girl, boy and small child already drawn. The identities in the second-cast request become
    unnecessary once layers exist; identity comes from the chosen colours.
  - **Style and scale** exactly as the second-cast request above (same preamble, line weight, camera, and every
    figure filling its cell the way an adult does).
  - **Tints are the renderer's**, from the words above; the art carries no colour in `--skin`, `--hair` or
    `--clothes`. Draw the masks so that a mid-grey tint reads as a believable mid tone and the lightest and darkest
    choices both keep their shading.
  - **What Claude wires on delivery:** a tinting pass in `public/art.js` that composites line over tinted masks per
    person, cached per appearance so a class of thirty is not recoloured every frame; `castVariant` in
    `public/motion.js` chooses the figure by sex and age band only; the words in the family book stay.
- **Houses — exteriors, written out 2026-09-13 for step 4, which is built and drawing stand-ins.** Needed for
  the map, at homestead scale, in the frontier-v1 style and the same projection and footprint as `cabin-small`
  (the renderer draws them at the size it draws a cabin now, anchored at the base centre):
  - `house-round-log`: one pen of unhewn logs with the bark on, saddle-notched corners, gaps chinked, a
    clapboard roof held by weight poles, a stick-and-mud chimney at one gable end (`HIST-GONZ-025`, `029`, `030`).
  - `house-hewn-log`: the same single pen with logs hewn flat and tight, squared corners.
  - `house-dog-run`: two log pens under one roof with an open passage between them and a chimney at each end —
    Austin's house at San Felipe is the documented model (`HIST-GONZ-035`).
  - `house-jacal`: posts set upright in the ground, walls of sticks daubed with mud, a thatched roof, one small
    room, eight to ten feet by twenty (`HIST-GONZ-026`).
  - For each, three construction stages drawn over the family's camp: `-site` (felled logs or cut posts
    stacked, a cleared footprint), `-walls` (walls half raised), `-roofing` (walls up, roof frame part-covered).
    The game picks them at 0–40%, 40–80% and 80–100% of the house's work.
  - **Not needed yet:** method variants (stone chimney, thatch on a log house, puncheon floor). Those wait for
    the construction-method choices, which are not built.
  - **Replaces:** the stand-ins listed above. Check: every house and stage draws, and the family figures stand
    in front of and behind it correctly in the back-to-front sort.
- **Interiors.** A single-pen interior, a dog-run's two pens and breezeway, and a jacal interior, drawn as
  rooms a student can place furniture in. **Delivered 2026-09-14 and in use since the interior view was built 2026-09-16**
  (`SETTLING_IN.md` §7.2). **Still open, written out 2026-09-16 — a saddlebag interior and the wagon's tools; stand-ins are
  drawing both (listed above):**
  - **Why.** A saddlebag house (two pens either side of one big central chimney, a fireplace in each, `sim/houseplot.mjs`)
    has its own rooms but is drawn on the dog-run's picture, so a student sees a passage and end chimneys their house does
    not have. The five tools that came in the wagon can be set out, but all five are one picture of a hatchet, axe and spade.
  - **What.** `interior-saddlebag`: in the `home-interiors` style, camera, scale and cutaway exactly as `interior-dog-run`
    (two round-log pens, front walls cut low, back walls with a window each), but the pens stand wall to wall around one
    stone chimney at the centre with a fireplace opening into each pen, a door in each pen's front wall, and no passage.
    Transparent, anchored at the base centre, a wide frame like the dog-run's. And, in the `home-furnishings` style and
    scale, each standing or leaning on the floor as it would in a cabin: `home-hoe` (a broad-bladed grubbing hoe),
    `home-felling-axe` (a long-handled axe), `home-broadaxe` (the wide, short-handled hewing axe), `home-froe` (the L-shaped
    riving blade with its club), `home-auger` (a T-handled auger). Period tools only (`HIST-GONZ-027`/`028`).
  - **How it plugs in.** Registered through `npm run build:art`; `INTERIORS.saddlebag.sprite` and the `tool:*` rows of
    `INTERIOR_ART` in `sim/interior-data.mjs` name the frames. The saddlebag's spots are re-measured on the new picture
    (fractions of its own box, at a thing's feet), the hearths moved to the central chimney; the spot ids stay, so saved rooms
    still open.
  - **Check.** `tests/interior.test.mjs` fails if a sprite named there is not in the atlas; in `npm run test:interior` a pot
    set by each saddlebag hearth stands at a fireplace, and each tool is told apart from the others without its label.
- **Furniture and brought goods.** Table, benches, bedstead, shelves, cradle; bedding, iron pot, chest,
  spinning wheel, clock, looking glass, crockery, rocking chair; a wagon camp.

---

## Request 2026-09-12 — families that look like who they are, and a rider who gets down

**Status: partly delivered.** 2026-09-14: children's idle, east walk, rest and injured-rest (`people-children-idle`, `-walk`, `-care`), in use; the rider's vertical dialogue (`courier-encounters-vertical`), in use; the dismount, remount, on-foot and waiting-horse sheet (`courier-dismount`), registered and not yet bound; speaking and listening poses for the first cast (`people-dialogue`), registered and not yet bound. 2026-09-15: children's north/south walk sheet is delivered and in use. The second cast now has idle, east/west walk, work, carry, care and search/trade. Sowing/repair, north/south walking and dialogue remain before the whole appearance stand-in can change. See [delivery details](ART_DELIVERY_2026-09-15-ART-BATCH.md).

### Why

Two things the game now does are drawn wrongly because the art does not exist.

1. **Rolled families** ([FAMILY_CREATION.md](FAMILY_CREATION.md)). A family is one to ten people (one to six before the twenty-sided die, 2026-09-14), with
   a sex and an age each, and a lone parent may be a mother. The library has one cast of four —
   `rust` (a man in a frontier hat), `teal` (a woman in a blouse and apron), `elder` (a grey-bearded
   man) and `blue` (an adolescent) — and **no children at all**. So a four-year-old and a baby are
   drawn as grown figures, and a lone mother who is her family's principal has to wear `rust`, the
   principal's mark, which is a man's outfit.
2. **News carried by people** ([LIVING_INFORMATION.md](LIVING_INFORMATION.md)). Riders now carry both
   reports in the slice and stop to talk. A rider can only be drawn mounted and facing east or west,
   so a conversation with somebody north or south of the road is drawn sideways, and "never hide a
   teleport with a conversation panel" means a rider cannot get down to talk at all.

### The delivery contract — the same as every existing people sheet

- **Format:** square **1254 × 1254** transparent RGBA PNG, **4 columns × 4 rows**, one full figure per
  cell, generous empty gutters, real alpha (no painted checkerboard), no text, borders, ground
  patches or shadows. A sheet may leave its last row empty; say so in the delivery note.
- **Style:** match `civilians`, `people-walk` and `people-vertical` exactly — the preamble in
  [art-prompts.json](art-prompts.json) for those sheets ("warm outlined storybook farm-game art,
  hand-drawn dark brown contour, moss/rust/cream/ochre palette, simple flat shading, slight elevated
  north-up view"). Same line weight, same camera, same proportions. Texas 1835 everyday clothes; not
  soldiers; no weapons.
- **Identity:** the same person keeps the same face, colours and clothing in every cell of every
  sheet they appear on. Identity drift between sheets is the most common failure in this library.
- **Feet:** constant foot baseline within a row; the figure centred in its cell.
- **Scale:** **draw every figure to fill its cell the way an adult does**, children included. The
  builder normalises each people row to one logical height, so a child drawn small on the sheet
  would still come out adult-sized; the renderer will shrink children by age instead. Keep a
  child's *proportions* a child's — larger head to body, shorter limbs.
- **Pipeline:** put the PNG in `public/assets/frontier-v1/atlases/`, add the sheet and its frame ids
  to `SHEETS` in `scripts/build-atlas-manifest.mjs` (use the `people-` or `courier-` prefix so row
  heights are measured), define the clips in the builder next to the existing ones, record the
  prompt in [art-prompts.json](art-prompts.json) and the source in
  [art-provenance.json](art-provenance.json), then run `npm run build:art` and `npm test`.
  `npm run test:art` checks real browser pixels if Playwright is installed.
- **Clip names** follow the existing pattern `<variant>-<action>[-<facing>]`: `idle-s/-e/-w/-n`,
  `walk` (east, mirrored for west), `walk-s`, `walk-n`, `work`, `carry`, `sow`, `repair`,
  `search`, `trade`, `care`, `rest`, `injured-rest`. New variant names are given below.

### What to draw, in priority order

Deliver in this order; each group is useful on its own.

#### Priority 1 — children (three sheets)

Three new identities. Period detail: in the 1830s small children of either sex commonly wore a
simple gown, so the smallest child is not dressed as a boy or a girl.

| Variant | Who | Clothing |
| --- | --- | --- |
| `girl` | a girl of about 5–9 | faded rose calico dress, cream pinafore, bare feet or small brown shoes, dark braid |
| `boy` | a boy of about 5–9 | undyed linen shirt, brown trousers held by one suspender, bare feet, straw-coloured hair, no hat |
| `smallchild` | a child of about 2–4 | plain cream gown to the shins, bare feet, short hair |

| Sheet | Rows | Columns |
| --- | --- | --- |
| `people-children-idle` | 1 `girl`, 2 `boy`, 3 `smallchild`, 4 the infant (below) | idle facing south, west, east, north. Row 4: a swaddled infant lying in a small woven basket — awake, asleep, basket seen from the west, basket from the east |
| `people-children-walk` | 1 `girl`, 2 `boy`, 3 `smallchild`, 4 empty | a four-frame walk loop facing screen-right, walking in place: left foot forward; passing; right foot forward; passing with the other leg raised. The small child toddles — shorter steps, arms out a little |
| `people-children-vertical` | 1 `girl`, 2 `boy`, 3 `smallchild`, 4 empty | walking toward the camera left leg forward; toward the camera right leg forward; away left leg forward; away right leg forward. Clear front and back views, not side views |

Also, on `people-children-idle` or a fourth sheet if it will not fit: `girl`, `boy` and `smallchild`
**sitting at rest** and **lying hurt** (the equivalents of `rest` and `injured-rest`). Children under
ten are never sent to work, so no work, carry, sow or repair poses are needed.

#### Priority 2 — a second cast, so men and women look like themselves (three sheets first, then five)

Four new identities that sit beside the existing four.

| Variant | Who | Clothing |
| --- | --- | --- |
| `rust-woman` | an adult woman who is her family's principal | **the principal's rust colour** as a rust-red short gown or blouse, tan skirt, cream apron, brown shoes, tan sunbonnet. It must read as the same mark as `rust` at a glance |
| `indigo` | an adult woman | indigo-blue dress, cream kerchief at the neck, brown shoes, dark hair pinned up, no hat |
| `ochre` | an adult man, younger than `elder`, clean-shaven | ochre shirt, dark brown waistcoat, grey trousers, brown boots, no hat, short dark hair |
| `blue-girl` | an adolescent girl of about 10–17 | muted blue dress to the ankle, cream apron, brown shoes, hair in one braid |

First deliver the three sheets that every person on the map uses, laid out exactly like the
existing ones with these four identities as rows 1–4:

| Sheet | Matches |
| --- | --- |
| `people-cast2-idle` | `civilians` — idle south, west, east, north |
| `people-cast2-walk` | `people-walk` — four-frame walk facing screen-right |
| `people-cast2-vertical` | `people-vertical` — toward-camera left/right, away left/right |

Then the task sheets, again row for row as the existing ones: `people-cast2-work` (as
`people-work`), `people-cast2-carry` (as `people-carry`), `people-cast2-tasks` (as `people-tasks`:
sow and repair), `people-cast2-care` (as `people-care`), `people-cast2-search-trade` (as
`people-search-trade`). Each identity also needs `rest` and `injured-rest` wherever the existing
cast has them.

#### Priority 3 — the rider gets down (one sheet)

Same rider and same chestnut horse as `courier-mounted` and `courier-encounters`: brown broad-brim
hat, ochre shirt, dark teal waistcoat, tan trousers, brown boots, brown shoulder dispatch bag; the
horse with black mane and tail and a small white forehead mark. Fixed east-facing elevated
side/three-quarter view in all cells.

| Sheet | Row | Four frames |
| --- | --- | --- |
| `courier-dismount` | 1 Dismount | reins gathered, weight shifts left; right leg swings over; stepping down, left foot still in the stirrup; standing beside the horse, reins in hand |
| | 2 Remount | foot to the stirrup, hand on the saddle; rising; leg swinging over; seated, reins gathered |
| | 3 On foot beside the horse, talking | listening, reins loose in the left hand; small nod; speaking, right palm open; small gesture outward |
| | 4 The horse waiting, no rider | standing tethered at rest; head lowered; head raised, ears forward; tail swish |

#### Priority 4 — talking toward and away from the viewer (two sheets)

Riders stop beside people on every side of a road, so a conversation needs to face south and north
as well as east.

| Sheet | Rows (four frames each) |
| --- | --- |
| `courier-encounters-vertical` | 1 mounted rider **listening, facing the camera** (south): neutral, head tilt, nod, neutral. 2 mounted rider **speaking, facing south**: relaxed, open palm, small outward gesture, near neutral. 3 **listening, facing away** (north): neutral, head turn, nod, neutral. 4 **speaking, facing north**: relaxed, raised hand, gesture, lowering |
| `people-dialogue` | the **existing** cast `rust`, `teal`, `elder`, `blue` as rows 1–4, each: speaking east frame 1 (hand raised a little); speaking east frame 2 (open palm); listening facing south (hands together, head slightly forward); listening facing north (seen from behind, head slightly tilted) |

When the second cast exists, a matching `people-cast2-dialogue` follows the same layout.

### What Claude will do on delivery

The stand-ins above are already in place, so delivery means replacing them:


- Bind children by age: `smallchild` under 5, `girl`/`boy` 5–9, the adolescents 10–17; an infant
  under 2 is drawn as the basket beside whoever of the family is at home.
- Draw children smaller by age: a small child at about 55% of adult height, a child of 5–9 at about
  70%, an adolescent at about 90%.
- Choose each person's figure from their sex and age instead of a hash of their id, keeping the
  principal in rust — `rust` or `rust-woman`. The founding four, who have no stated sex or age,
  keep today's choice.
- Use `courier-dismount` and the vertical dialogue sheets in encounters, so a rider halts, gets down,
  turns to face the listener, and remounts with the same horse.
- Add clip-binding tests that every new clip name a binding can produce exists in the shipped
  library, as `tests/motion-binding.test.mjs` does for the current cast.

### How it will be checked

- `npm test`: measured bounds, alpha and anchors, every sheet's inventory entry, reproducible
  manifest generation, and the clip-binding tests above.
- The art catalog (`/art-catalog.html`): every new frame on light and dark backgrounds, animation
  played and scrubbed.
- In the running class: a rolled family of six at household scale and on a narrow phone — a mother,
  a father, children of different ages and a baby, each readable as who they are; a lone mother
  picked out as the principal at a glance; a rider stopping north and south of a road.
- Identity: the same person looks like the same person across idle, walk, vertical and task sheets.
