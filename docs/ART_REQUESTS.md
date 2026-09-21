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
| Six glyph icons drawn in code (a stick horse, crossed sticks and chips, birds off an ear of corn, eggs in a nest, a pail of water, a bigger child with a smaller one on the hip) | `drawGlyph` in `public/family-panel.js` | Request 2026-09-21 — the children's icons | `icon-child-play`, `icon-child-kindling`, `icon-child-birds`, `icon-child-eggs`, `icon-child-water`, `icon-child-mind` |
| A trash can drawn in code with a pen — a lid with a handle, a tapering body, two lines down it | `DrawBin` in `launcher/SoloGameDialog.cs` | Request 2026-09-21 — the Play Solo menu's trash can | `icon-delete-save` |
| Four glyph icons drawn in code (a squirrel on a branch, a fish over the water, two shells on the sand, a bee tree) | `drawGlyph` in `public/family-panel.js` | Request 2026-09-20 — the gathering icons | `icon-take-small-game`, `icon-fish-the-water`, `icon-gather-oysters`, `icon-cut-bee-tree` |
| Three glyph icons drawn in code (a long-horned cow, a hog with its snout in the mast, a rider's hat over the grass) | `drawGlyph` in `public/family-panel.js` | Request 2026-09-20 — the stock icons | `icon-butcher-beef`, `icon-butcher-hog`, `icon-look-to-stock` |
| A new town's shops are the nearest buildings the library has, two trades sharing a sprite | `SHOP_SPRITES` in `sim/shops.mjs`, drawn in `drawWorld` in `public/app.js` | Request 2026-09-16 — the shops of the towns | `shop-*` buildings, one per trade |
| Whole jacal stage sprites; `lean-to` shed frame; procedural double chimney; no separate interior floor/loft display | `drawHousePlot` in `public/house-plot.js` | Request 2026-09-15 — the house plot's pieces | Jacal modules, shed frame, double chimney, and separately registered floor and loft overlays |
| Generic `chapel` and `adobe-flat` silhouettes represent San Fernando and the Governor's Palace | `public/bexar-layout.js` | Request 2026-09-14 — Béxar civic architecture | Researched 1836 civic façades in the existing illustrated style |
| A child in an unavailable action pose is a grown figure drawn smaller (90% at 10–17, 70% at 5–9, 55% at 2–4, 45% an infant). Idle, cardinal walking, rest and injured-rest use delivered `girl`, `boy`, `smallchild` and `infant` art | `CHILD_POSES` and `entityClip` in `public/motion.js` | Request 2026-09-12, priority 1 — children | Any later child-specific action poses. **Keep the scaling**: the delivered sheets fill their cells and need it |
| A person's appearance - a parent's chosen, a child's taken after the parents - is shown only in words in the family book ("olive skin, black hair, rust clothes, a beard"); the figure on the map is still chosen by sex and age | `public/appearance.js`, `sim/appearance.mjs` | Request below — layered people art | Layered or palette-swappable sheets for the whole cast |
| A saddlebag house's interior is drawn on the dog-run's picture (`interior-dog-run`, drawn wide), with its own ten spots measured there — by each hearth at the outer ends where that picture draws them, each back wall, window, pen and door — and nothing set in the passage the picture shows | `INTERIORS.saddlebag` in `sim/interior-data.mjs`, drawn by `public/interior.js` | Request 2026-09-12 (second) — interiors and furnishings: a saddlebag interior | `interior-saddlebag`; re-measure the spots on it, the hearths at the central chimney |
| Ten tree kinds use delivered size-specific art: pine, cedar, mesquite, live oak, elm, and (2026-09-21) post oak, blackjack, pecan, hackberry and sweetgum. Shortleaf and longleaf share loblolly art; the other oaks (water, bur, white, Texas) take the post oak's, hickory, walnut and ash the pecan's; beech and magnolia are still the generic broad oak | `KINDS` picture in `sim/woods.mjs`, drawn by `drawGroundDetail` in `public/app.js` | Request 2026-09-15 — the trees of the colonies | Shortleaf and longleaf pine, beech and magnolia, and species-specific later breadth |
| **A child** riding the family horse is their own figure's idle pose (`seatedClip`), facing the way they go, cut off below the waist and drawn over the back of the family's walking horse (`horse-walk`, `-n`, `-s`); the horse is not drawn again. Everybody grown or adolescent came off this row on 2026-09-21: all eight identities are Astra's own painted horse-and-rider now (`RIDING_FIGURES`), drawn as one frame at the rider's height with no horse under it | `seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`; `drawSeated` in `public/app.js` | Request 2026-09-14 — family members on horseback | `girl`, `boy`, `smallchild` and `infant` mounted on the family's chestnut, east/south/north as the eight have |
| **A second-cast driver (`rust-woman`, `indigo`, `ochre`, `blue-girl`) or a child** driving the ox and wagon is their own figure's idle pose, cut off below the waist, sitting at the front of the side-view wagon (`wagon-travel`) with the ox (`ox-walk`, `-n`, `-s`) ahead; the ox and wagon are not drawn again. The four original-cast identities came off this row on 2026-09-21: `rust`, `teal`, `elder` and `blue` are Astra's whole seated driver layers with their reins and goad, in all four headings (`DRIVING_FIGURES`). Going north or south the wagon still stays side-on and the ox is above or below it | `wagonDriverId`, `seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`; `drawSeated` in `public/app.js` | Request 2026-09-16 — driving the ox wagon | Seated driver layers for `rust-woman`, `indigo`, `ochre`, `blue-girl` and the four children, on the same four headings as the delivered sixteen |
| A rider never gets down to talk: they speak from the saddle, turned east, west, north or south toward the listener (the vertical dialogue delivered 2026-09-14 is in use). The person he stopped now answers him in their own delivered speaking and listening poses (2026-09-21), on their own feet | `carrierClip` and `grownClip` in `public/motion.js`, from `facingOf` and `listeningOf` in `sim/encounters.mjs` | Request 2026-09-12, priority 3 | `courier-dismount` (delivered 2026-09-14, registered, not yet bound: it needs the encounter to know when a rider has got down and where the horse stands) |
| The road's three panel icons are glyphs drawn in canvas strokes: a rifle over a campfire (`hunt-road`), a figure under a blanket with a cup beside (`tend-sick`), a coin passed over a ferry's rail (`trade-crossing`) | `drawGlyph` in `public/family-panel.js`; `PANEL_ICONS` carries `glyph` and no sprite, and `drawIcon` takes `icon-<key>` the moment it is registered | Request 2026-09-16 — the road's icons | `icon-hunt-road`, `icon-tend-sick`, `icon-trade-crossing` |
| The camp's four icons - drill, beef and corn, the guard, the scouts - are canvas glyphs (a musket at the shoulder; horns over a corn ear; a bayonet and a crescent moon; a horseshoe and a spyglass) in the panel's brown | `PANEL_ICONS` (`glyph`) and `drawGlyph` in `public/family-panel.js` | Request 2026-09-16 — the camp's icons | `icon-camp-drill`, `icon-camp-forage`, `icon-camp-guard`, `icon-camp-scout` |
| The trees of the biomes of 1836: longleaf is the loblolly drawn a quarter taller; bald cypress the cedar a third taller; the Texas palm the `sapling` drawn twice as tall; beech and magnolia the `oak-broad`; anacua and Texas ebony the `oak-spreading`; tupelo and cedar elm the `elm`; willow the `cottonwood`. Sweetgum, white oak, bur oak and Texas oak came off this list on 2026-09-21 | `KINDS` (`picture`, `sized`, `scale`) in `sim/woods.mjs`, sent in the woods catalogue and drawn by `drawGroundDetail` in `public/app.js` | Request 2026-09-19 — the country of 1836: trees and ground cover | `pine-longleaf-*`, `cypress-bald-*`, `palm-sabal-*`, `magnolia-*`, `beech-*` |
| The ground of the biomes of 1836: **tall grass, river cane, palmetto, the thorn thicket, Spanish dagger, marsh cordgrass, dune grass and cypress knees are Astra's own since 2026-09-21**. Still standing in: a palm grove's palms are the `sapling` drawn tall, and a town's fields are `crop-stubble` and fallow tufts | `GROUND_CLASSES` marks in `public/ground-classes.js` | Request 2026-09-19 — the country of 1836: trees and ground cover | `palm-sabal-*`, `field-irrigated`, `field-fallow` |
| Béxar's fields are the `fields` wash with stubble and fallow scattered on it; **the acequias are still not drawn** and no brush fence stands. The art for them landed 2026-09-21 (`acequia-straight`, `-bend`, `-crossing`, `fence-brush`, all registered and unused) and what is missing is now the LAYOUT: where each ditch ran, which is a researched course and a claim ID, not a sprite | `fields` in `public/ground-classes.js`; the envelope in `scripts/terrain/biomes.mjs` `BEXAR_FIELDS`; nothing yet in `public/bexar-layout.js` | Request 2026-09-19 — Béxar's fields and acequias | The acequia courses themselves, laid by `public/bexar-layout.js` from the delivered pieces |
| **Words only for everything but the deer, the turkey and the mustang.** Since 2026-09-19 (docs/BIOME_GAMEPLAY.md §3.1) a hunt on a class of the biomes brings the quarry its place holds - turkey, bear, buffalo, antelope, mustang, javelina, ducks and geese, a wild cow, or a deer - and says so before it goes ("Waiting here, a turkey: four food."), at the shot ("downwind of a bear") and in the record ("brought down a buffalo"). The deer (2026-09-15), the turkey and the mustang (both 2026-09-21) are drawn where the server put them; every other quarry is given no place to be drawn at (`chore.quarry` stays unset), because a deer drawn where the words say a bear would be a wrong picture | `DRAWN_GAME`, `quarryAt` and `GAME` in `sim/hunting.mjs`; the drawing is decided where `quarryPoint` is called in `sim/chores.mjs`, and `miniQuarry` in `public/app.js` picks the sheet by `quarry.kind` | Request 2026-09-19 — the game of 1836 | `wildlife-bear`, `-javelina`, `-pronghorn`, `-bison`, `-geese`, `-cattle`; each one lands, its id joins `DRAWN_GAME` and nothing else has to change |
| The panel icon for fetching logs from the timber is a canvas glyph: three logs laid across a wagon bed on two wheels, in the panel's brown | `PANEL_ICONS` (`glyph`) and `drawGlyph` in `public/family-panel.js` | Request 2026-09-19 — the logs fetched from the timber | `icon-fetch-logs` |
| A traveller faster than a walk can be drawn is a canvas-drawn pin: a round disc with the family panel's `portrait-<figure>` clipped inside it (itself a Claude-drawn stand-in), ringed rust for the principal, ink for the family, grey for somebody else's and slate for a courier, on a short point to the ground, with the road ahead in canvas dots. A beast or wagon on the road by itself is its own standing sprite (`horse-chestnut`, `ox-brown`, `wagon-covered`) on a smaller disc; their initial while no sheet has loaded | `drawTravelMarkers` in `public/app.js`; the rule in `MARKER_ABOVE`/`wantsMarker` in `public/motion.js` | Request 2026-09-19 — the traveller's marker | `marker-pin` (the pin and its ring, portrait-less) and `marker-dot`, drawn over by the same portrait; `drawTravelMarkers` lays the sprites down instead of its strokes |
| In a **hard** norther the broad oak, the spreading oak, the pecan and the grass tuft now take Astra's painted gale poses, and a camp fire's smoke streams (delivered 2026-09-21). Everything else still standing in that wind — pine, cedar, mesquite, live oak, elm, scrub, reeds, prickly pear, and every sized tree of `trees-colonies-1` and `-2` — is the library's own upright sprite sheared about its foot | `GALE_POSES` and `windLean` in `public/weather-art.js`, applied by `postOak`, `plain` and `drawGroundDetail` in `public/app.js` | Request 2026-09-20 — the country in a norther | A gale silhouette for each remaining tree kind and ground mark, at the same one strength as the five delivered |

| The mark that leads a student to the one thing to press is CSS: a triangular caret over the icon, a rust box-shadow ring round it, and ten coloured bars for the lesson’s steps | `.panel-icon[data-pointed=true]` and `.lesson-pip` in `public/style.css`; the pips built by `renderLesson` in `public/app.js` | Request 2026-09-21 — the guided start’s marks | `lesson-point`, `lesson-ring`, `lesson-pip`, `lesson-pip-done` |


| A tree or a tuft in a norther is the library's own upright sprite sheared about its foot, so it leans; nothing streams, and smoke is not drawn at all | `windLean` in `public/weather-art.js`, applied by `postOak` and `drawGroundDetail` in `public/app.js` and by `lean` in `public/art.js` | Request 2026-09-20 — the country in a norther | `oak-broad-wind`, `oak-spreading-wind`, `pecan-wind`, `grass-tuft-wind`, `smoke-streaming` |

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
| ~~Request 2026-09-16 — the winter's icons~~ and ~~Request 2026-09-15 — action icons~~ | **Retired 2026-09-21**: Astra delivered all 53 action icons ([delivery](ART_DELIVERY_2026-09-21-FAMILY-ACTION-ICONS.md)), her frames win in the loader, and the stand-ins, their SVGs and their entries in `SHEETS` are deleted. The rule they proved is kept in the contracts: one silhouette, a thin dark outline, readable dimmed to 40 per cent at 34–38 CSS pixels. | — | — |
| Request 2026-09-16 — the family panel's marks | `claude-marks.png`: `mark-need`, `mark-need-rider`, `mark-main`, `mark-idle`, `mark-auto-off`, `mark-auto-on` | `panelMark`/`paintMark` in `public/app.js` (a canvas in `.panel-attention`, `.panel-star`, `.panel-idle-mark`, `.panel-focus` and `.panel-auto`; the type shows only while no frame is drawn, `data-drawn`), `drawMark` in `public/family-panel.js` | The five marks at 96 by 96, transparent, no text; `mark-auto` in its two states as `mark-auto-off` and `mark-auto-on` (dim brown; green `#4f7a3a`) |
| Request 2026-09-15 — face portraits for the family panel | `claude-portraits.png`: `portrait-rust`, `portrait-teal`, `portrait-elder`, `portrait-blue`, `portrait-rust-woman`, `portrait-indigo`, `portrait-ochre`, `portrait-blue-girl`, `portrait-girl`, `portrait-boy`, `portrait-smallchild`, `portrait-infant` | `drawPortrait` in `public/family-panel.js` (draws `portrait-<figure>` for the figure `castVariant`/`childFigure` choose; without one it still crops the idle clip, the older stand-in) | Twelve head-and-shoulders portraits at 192 by 192 matching the sheet figures exactly; Claude's are one parameterised drawing dressed after each figure and are the first to replace |
| Request 2026-09-17 — the armies on the map (owner: "there was no army. they were just off in the middle of no where") | Not a sheet: the tents, the fire and the flag are drawn in canvas by public/army-view.js; the men are the militia and regular figures the battles already use | public/app.js draws each army the server sends (sim/armies.mjs): a camp with its men close up, a flag far off | A camp: three or four wedge tents, a cook fire with a pot, stacked arms and a colour on a pole, at 192 by 192, in the map art's own light; then drawArmy lays her sprites down instead of its strokes |
| Request 2026-09-17 — the title screen (owner, 2026-09-17: "a professional game introduction experience") | Not a sheet: drawn in canvas by `drawIntroScene` in `public/intro-art.js` (a Texas evening looking east: sky, hills, timber, a river, a cabin with its chimney, the wagon and ox, a rail fence, the family in the grass) | `public/creation.js`: the scene behind the title "Family: Texas 1835/36" and every step of making a family | One painting of that view, 1600 by 900 or larger, that can be cropped to any screen shape, with the lower third quiet enough for the cards to read over it; `drawIntroScene` is then one `drawImage` |
| Request 2026-09-12 (second) — layered people: the How We Look pop-up (owner, 2026-09-17) | Not a sheet: drawn in canvas strokes by `drawLooks` in `public/looks-art.js` (a head and shoulders with the skin, hair, clothes and hat, beard, bonnet or pinned hair chosen; colours in `SKIN_COLOURS`, `HAIR_COLOURS`, `CLOTHING_COLOURS`) | `public/appearance.js`: the preview (`#looks-preview`, 160 by 160) and one 64 by 64 picture on every choice | Layered head-and-shoulders parts at 192 by 192 (a base head per sex, skin, hair and clothing tinted or one frame per colour, and the four head pieces) so the pop-up draws her layers; when they land, `drawLooks` is replaced and the colour tables go |
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

## Request 2026-09-21 — the guided start's marks

**Status: open; CSS stand-ins in use since 2026-09-21 (see *Stand-ins in use* above).** After a real class played on
Chromebooks the owner asked for the tutorial to be "an integrated forced part of the game ... one task at a time, guided by
the ui and unavoidable" ([FAMILY_PANEL.md](FAMILY_PANEL.md) §12). The screen now leads a student to one icon on the ability
bar at the bottom middle. The three marks that do the leading are CSS, not art.

- **Why.** These are the marks a seven-year-old reader looks at instead of the sentence. A CSS triangle and a coloured
  box-shadow read as a web page beside icons Astra painted, and at the bottom of a busy map the ring has to win against
  grass, trees and a wagon without hiding the icon it is round.
- **What.** Three small pieces, transparent, in the illustrated palette with the thin dark outline the action icons have,
  drawn to read over open country (deliver at 96 by 96 unless said otherwise):
  - `lesson-point` — a pointing mark that sits **above** an icon and aims down at it: a small painted hand, a carved
    signpost finger or a feathered dart, in the rust the game already uses for "attend to this", `#c2582c`. It is drawn
    about 20 CSS pixels tall over a 48-pixel icon, and it bobs; the icon under it never moves.
  - `lesson-ring` — a frame that goes **round** a 48-pixel icon without covering it: a painted rope, a rust-tooled border
    or a wreath of rails, transparent inside, delivered as a nine-slice or as a single 72 by 72 frame the icon sits inside.
  - `lesson-pip` and `lesson-pip-done` — the two states of one step-marker in the strip's run of ten, about 10 by 6 CSS
    pixels: a stake in the ground and a stake with a rail on it, say, or a plain unfilled and filled tally mark. No text.
- **How it plugs in.** Registered through `npm run build:art`. The bar's `.panel-icon[data-pointed=true]` takes
  `lesson-ring` in place of its box-shadow and `lesson-point` in place of its `::after` triangle (a canvas over the button,
  as `panelMark` in `public/app.js` already does for the row's marks); `renderLesson` draws the pips from the two frames in
  place of the two `.lesson-pip` colours. The accessible names carry the words either way and do not change.
- **Check.** At 1366 by 768 over grass, over a road and over a wagon, the ring is told apart from the server's own gold glow
  (`data-active`, "doing this now") at a glance, and the pointed icon's own picture is still readable inside it.

## Request 2026-09-20 — the country in a norther: trees and grass bent by the wind

**Status: delivered 2026-09-21.** `weather-norther.png` supplies `oak-broad-wind`, `oak-spreading-wind`, `pecan-wind`, `grass-tuft-wind`, and `smoke-streaming` as genuine-alpha painted sprites. Owner, 2026-09-20: "Weather should be a visual thing...
Players should see the weather. If implemented correctly, no text should be required." The weather is drawn
([docs/WEATHER.md](WEATHER.md), `public/weather-art.js`), and a norther is the kind the record makes most of: Gray at San
Felipe on 25 February 1836, "the wind **chopped suddenly round to the north**, and there commenced what is familiarly
called in this country **a norther**, by which is always understood a hard and cold blow from the north."

- **Why.** A norther has no rain and no cloud to draw (`HIST-TEX-229`; Almonte has "clear" or "clear and pleasant" every
  morning of one), so what carries it is the **wind in the country**: the trees and the grass going over with it. Every
  tree the library has stands straight. The page bends them by shearing the sprite about its own foot, which works — it
  is what the shots in `docs/evidence/weather/` show — but a sheared painting is a leaning silhouette, not a tree in a
  gale: the crown does not stream, the branches do not part, and the leaves do not lift off the windward side. At the
  closest zoom that shows.
- **References.** `HISTORY.md` `HIST-TEX-221`, `HIST-TEX-229`; [docs/WEATHER.md](WEATHER.md) §4.1, which is Gray's own
  paragraph and is worth reading before drawing this.
- **What.** In the frontier-v1 `nature` style, the same three trees the map already scatters, each in one more pose —
  bent hard to the viewer's right, as if the wind came out of the page:
  - `oak-broad-wind`, `oak-spreading-wind`, `pecan-wind` — the trunk leaning about a sixth of its height off vertical,
    the crown pulled downwind and thinned on the windward side, a few leaves leaving the crown to the right.
  - `grass-tuft-wind` — the tuft's blades laid over nearly flat to the right, not merely fanned.
  - `smoke-streaming` — a chimney's or a campfire's smoke lying flat and low instead of rising, about three figure
    widths long, thinning as it goes. Nothing in the library draws smoke; a norther over a house or a camp is the place
    a class will look for it first.
- **Scale and anchor.** Exactly those of the sprites they stand beside (`oak-broad`, `grass-tuft`), so a tree does not
  change size when the wind gets up; `smoke-streaming` anchors at the chimney top or the fire, at its upwind end.
- **How it plugs in.** Add to the `nature` sheet, `npm run build:art`. In `postOak` and the tuft in `drawGroundDetail`
  (`public/app.js`), pick the `-wind` sprite when `windLean(...)` is past about half of `MAX_LEAN` and drop the shear to
  what is left over, so light airs still bend a little and a gale uses the drawn pose. Delete the stand-in row.
  **Keep the rule the stand-in proved**: the lean must be read at each thing's own place on the map
  (`weatherMix(weather, wx, minute)`), not once for the view, or it stops at a region boundary in a straight line.
- **Check.** Beside the upright `oak-broad` at the same height the trunk is the same thickness and the crown the same
  mass; at the county zoom, a stand of them reads as wind and not as a different kind of tree.

---
## Request 2026-09-20 — the launcher's remaining plates — **Delivered 2026-09-20**

**Status: delivered the same day it was asked for; nothing on that window is a stand-in.** The owner drew the launcher window on
2026-09-20 and had the art made for it the same day: the title painting (`launcher/art/background.png`)
and eight cast plates (`launcher/art/button-*.png`), all in hand and all shipping. Two things the window
needs are not among them.

- **Why.** The launcher's "Check for updates" plate becomes **Update to v2026.09.20.2** the moment GitHub
  has a newer build, and there is no plate that says that. It is drawn in code instead, in the same shape
  and in the amber the mockup uses for a warning - which is honest but is not the owner's hand, and it is
  the one button on that window that does not match the rest. The same drawn plate is what the window falls
  back to if a plate cannot be read at all, so it earns its keep either way.
- **What.**
  - `button-update-available.png` - the same cast plate as the other seven (2172 x 724, the sign inside the
    same box: x 136, y 161, 1902 x 348, on a black field), but **amber or brass** rather than slate, with a
    downward arrow into a tray at the left where the others have their mark, a chevron at the right, and
    **no words**: the version changes with every release, so the launcher writes the line itself over the
    plate. If words are wanted in the art instead, "Update available" is the one phrase that is always true.
  - Optional, and only if it is easy: the seven marks as cut art (`icon-people`, `-monitor`, `-person`,
    `-clipboard`, `-link`, `-swords`, `-gear`) for the drawn fallback. Nothing needs them while every plate
    is cast; they exist for the day one cannot be read.
- **Where it goes.** `launcher/art/`, embedded by `launcher/TexasRevolution.Launcher.csproj` like the rest.
  In `launcher/LauncherForm.cs`, `LookForUpdateAsync` sets `_updates.Plate = null` to get the drawn plate;
  point it at the new art instead and let `PlateButton` draw the version over it (the plate has no words, so
  nothing is being covered). Delete the stand-in rows.
- **Check.** Beside "Check for updates" and "Play Solo" at the same width it reads as one of the set.

**Delivered 2026-09-20.** `launcher/art/button-update-available.png` (1536 x 1024): a red badge reading UPDATE
AVAILABLE in gold, with a gold download arrow in a roundel that overhangs its left edge and a red exclamation mark
above the roundel. It carries its own words, so the launcher writes nothing over it and the version stays in the
button's `Text` and in the line of news below - the same arrangement as every other plate.

Two things about it differ from the other nine and are worth keeping in mind if it is ever replaced. It is **RGBA
with a real alpha channel** where the others are opaque pictures on a black field, so it is composited as it is and
must never be flooded or keyed (`FloodBelow` is 0 in `PlateArt.Cuts`). And the roundel **overhangs the badge's left
edge**, so its row is given 80% of the column's width and the overhang is allowed to hang into the margin, the way
the stop sign's torn flag is.

The optional cut marks were **not needed and were not made**. While every plate is cast, nothing draws them; the
stroke marks in `TitleScene.DrawGlyph` exist only for a plate whose art cannot be read, which is a fallback rather
than a stand-in, and they are marked `ceiling:` rather than `stand-in:` for that reason.

## Request 2026-09-19 — the places past the box

**Status: open; nothing drawn, and no stand-in.** Owner, 2026-09-19, by multiple choice: the places past the old box. Five
places outside the colonies now stand on the map ([MAP_ACCURACY.md](MAP_ACCURACY.md) §11): **Matamoros** and **Laredo** on the
Rio Grande, the **Presidio del Río Grande** (San Juan Bautista at present Guerrero, Coahuila), **San Patricio** on the Nueces,
and **Gaines's ferry** on the Sabine. Each is drawn as its name and nothing more.

- **Why no stand-in.** The library's settlement art is an Anglo colonist's cabin and its town art is the colonies'. A cabin at
  Matamoros or at the presidio would say something false about the place - these are a Mexican river port, a Spanish presidio
  and mission, an Irish colony's village and a ferry landing on the border - and the standing rule is that missing art is never
  left silently wrong. A name alone is honest: the map says a place is there and claims nothing about what it looked like.
- **References.** `HISTORY.md` `HIST-TEX-158` to `-163`.
- **What.** In the frontier-v1 style (the `places` preamble in [art-prompts.json](art-prompts.json)), seen from a little above
  as the towns are, small enough to read at province zoom:
  - `town-mexican-river` — a low adobe and stone town on a river bank: flat-roofed houses, a church tower, a wharf or landing.
  - `presidio-spanish` — a square walled presidio with a corner bastion and a mission church beside it.
  - `village-irish-colony` — a handful of jacales and log houses round a small chapel, on a low bluff over a river.
  - `ferry-landing` — a landing on a big river: a cut bank, a plank ramp, a shed and a rope post, without the boat (the boat is
    the ferry art above).
- **Where it goes.** `public/atlas` as the towns are, drawn for a place of kind `distant` in `public/app.js`, which today draws
  the name only.

## Request 2026-09-19 — the ferry flatboat

**Status: delivered 2026-09-21.** `ferry-flatboat.png` supplies the empty and laden plank flatboats plus the bank post on genuine transparency. Owner, 2026-09-18: "when the various rivers and creeks are
added, we're going to have to have assets ford, or build bridges (where they historically were)"; chosen the same day, every
place a road crosses a river or creek gets a ford, a ferry or a bridge ([MAP_ACCURACY.md](MAP_ACCURACY.md) §10). Twelve of
the map's crossings are ferries - Lynch's, Groce's, the San Felipe ferry, Robinson's, Brigham's, Burnam's (the Colorado
crossing), Beeson's, the Atascosito crossing of the Trinity, the Harrisburg ferry, and the game's own at Victoria, Matagorda
and on the San Jacinto. Each now draws the plank flatboat at the near landing and a `ferry-post` at each bank, with the rope between them still in canvas strokes (it spans whatever width the map's river is here). `ferry-flatboat-laden` is registered and unused: nothing on the map says who is on the water at this moment.

- **Why.** The library's `ferry-raft` is logs lashed together with a rope rail: a raft. The ferries of the colonies were
  flatboats - "a good and substantial ferry flat boat" (San Felipe's lease, 1829), "a flat raft-like barge onto which a wagon
  or cart could be driven" (TSHA, *Ferries*), Lynch's "a flatboat service with a hand-pulled rope for power" (TSHA, *Lynch's
  Ferry*). A raft of round logs reads as something made in a hurry, which is what the army's rafts of April 1836 were, not the
  licensed ferry that took a loaded wagon across for a dollar (`HIST-TEX-140`).
- **References.** `HISTORY.md` `HIST-TEX-140` (the rules, the rates, what a ferry was) and `HIST-TEX-150` (Lynch's).
  https://www.tshaonline.org/handbook/entries/ferries ; https://www.tshaonline.org/handbook/entries/lynchs-ferry
- **What.** In the frontier-v1 style (the `transport` preamble in [art-prompts.json](art-prompts.json)), a plank flatboat of
  the 1830s: flat-bottomed, square-ended, of sawn planks, about twice as long as it is wide, low sides a hand high with an
  apron (a hinged plank ramp) at each end for a wagon to drive on, a pole or two lying on the deck, and a rope running the
  length of the boat through two posts or rings on the upstream side, where it meets the ferry rope. Seen from a little
  above, broadside, as `ferry-raft` is. No painted water beyond a thin water-contact line; no lettering.
  - `ferry-flatboat` — empty, at rest.
  - `ferry-flatboat-laden` — carrying an ox and wagon (the library's `ox-brown` and `wagon-covered` at their own scale, standing
    on the deck), a man at the rope.
  - `ferry-post` — the post a ferry rope is made fast to on the bank: a stout timber a little taller than a man, the rope
    turned about it. The rope itself is drawn by the page, bank to bank.
- **Scale.** Drawn length about three and a half figure heights (a wagon is 1.55): big enough to carry one wagon and team,
  which is what the rates of 1831 priced.
- **Anchor.** The middle of the boat at the waterline.
- **How it plugs in.** Add the sheet to `SHEETS` in `scripts/build-atlas-manifest.mjs` beside `ferry-raft`, `npm run build:art`,
  and in `drawFerry` (`public/landscape-art.js`) draw `ferry-flatboat` where `ferry-raft` is drawn now and `ferry-post` where the
  canvas posts are; delete the stand-in row. The boat stays at its landing: nothing in the simulation moves it yet.
- **Check.** Beside `wagon-covered` at the drawn scale a wagon fits on the deck; at the map's close zoom it reads as a boat and
  not a raft or a bridge; alpha edges clean.

## Request 2026-09-19 — the country of 1836: trees and ground cover

**Status: partially delivered 2026-09-21.** `biome-ground-bexar.png` supplies palmetto, cypress knees, two cane variants and wind pose, tall grass and wind pose, two thorn-thicket variants, yucca, marsh cordgrass and dune grass. The size-specific longleaf, sabal palm, bald cypress, magnolia and beech trees remain open. Owner, 2026-09-19: the map brought in line with the
natural biomes of Texas (docs/BIOMES.md, built the same day).

- **Why.** The map shows each natural region of 1836. Longleaf pine, the Texas palm, bald cypress, river cane, tall prairie
  grass and the South Texas thicket are what tell a student where they are, and the library has none of them.
- **What.** Transparent, anchored at the base, three-quarter view, in the style of `pine-loblolly-*` and `live-oak-*`:
  `pine-longleaf` at `-pole`, `-log`, `-large` (very tall straight trunk, sparse tufted crown of long needles high up, grass
  at the foot); `palm-sabal` at three sizes (a Texas palm: straight grey trunk, round head of fan leaves, 40-60 ft when large)
  and `palmetto` (a low fan clump, no trunk); `cypress-bald` at three sizes (buttressed flaring base, flat-topped feathery
  crown, with and without Spanish moss) and `cypress-knees`; `cane` (river cane in a dense clump, two variants, with a `-wind`
  frame) about twice a person's height; `grass-tall` (bluestem and Indian grass, waist to shoulder high, golden, with a
  `-wind` frame); `thicket-thorn` (a blackbrush-guajillo-granjeno clump, grey-green, two variants); `yucca` (Spanish dagger);
  `marsh-cordgrass` and `dune-grass` (sea oats on sand); `magnolia` and `beech` at `-log` and `-large` for the thicket.
- **How it plugs in.** `KINDS` in `sim/woods.mjs` names each tree kind's picture, whether it comes at three sizes (`sized`)
  and how tall it is drawn (`scale`, which goes back to 1 when the tree's own art lands); `GROUND_CLASSES` in
  `public/ground-classes.js` names each class's marks. Registering the frames and changing the names is the whole swap.
- **Check.** Beside `oak-broad` at the same size a longleaf reads taller and more open than a loblolly, a palm unlike any
  pine, cane as a solid wall, tall grass above a person's knee; a closed stand still reads closed.

## Request 2026-09-19 — Béxar's fields and acequias

**Status: partially delivered 2026-09-21.** `biome-ground-bexar.png` supplies compatible straight, bend and plank-crossing acequia pieces plus the period brush fence. Irrigated young/mature crop rows and the fallow-field fill remain open. The owner decided
(2026-09-19, by multiple choice) that the Alamo stood among irrigated fields, not woods; the map now has no woods round it.

- **Why.** The fields need to look like Béxar's labores, not the colonies' log-fenced plots, and the acequias are what made
  them.
- **What.** `acequia` (an earth ditch a yard wide with water, straight and bend pieces, and a plank crossing),
  `field-irrigated` (corn in furrows along a ditch, young and mature, sharing the corn frames' scale), `fence-brush` (a brush
  fence, the kind the Texians crossed in December 1835), and `field-fallow` (grass and weeds on an old field).
- **How it plugs in.** The Béxar layout (`public/bexar-layout.js`) lays the acequias as lines and the fields as plots;
  `drawPlots` draws them. The envelope they fill is `BEXAR_FIELDS` in `scripts/terrain/biomes.mjs`.
- **Check.** At the street zoom the Alamo stands in open fields with ditches and a line of bank trees on the river.

## Request 2026-09-19 — the game of 1836

**Status: delivered 2026-09-21; the mustang is wired into the hunt the same day (`FIC-GONZ-261`), and the rest are still words only.** The wildlife sheets now supply animated deer, turkey, bear, javelina, pronghorn, bison, geese, wild cattle and wild mustang.

- **Why.** The quarry a hunt finds should be the country's (`HIST-TEX-103`, `HIST-TEX-104`): turkey in the bottoms, bear in
  the canebrakes and the thicket, javelina in the chaparral, pronghorn and bison on the western grass, waterfowl on the coast.
  Only the deer is drawn.
- **What.** As the delivered `wildlife-deer` (idle, alert, bound, four frames each, east-facing, anchored at the feet):
  `wildlife-turkey`, `wildlife-bear`, `wildlife-javelina`, `wildlife-pronghorn`, `wildlife-bison`, `wildlife-geese` (a flight
  and a resting flock), `wildlife-mustang` (a wild horse, rougher than the family's), `wildlife-cattle` (a rangy longhorned
  wild cow; added 2026-09-19, when the hunt began to bring the wild cattle of the coastal prairie).
- **How it plugs in.** `miniDeer` in `public/app.js` draws the clip for `chore.quarry`; the quarry's kind picks the sheet.
  Since 2026-09-19 the hunt chooses its quarry (`quarryAt`, `sim/hunting.mjs`) and stores it on the hunting place
  (`chore.ground.quarry`); today only a deer is given a place to be drawn at (`quarryPoint` in `sim/chores.mjs`), and the swap
  is to give every quarry its place with `kind` set to its id once its sheet is registered.
- **Check.** Scale against `wildlife-deer` and `horse-chestnut`.

## Request 2026-09-19 — the logs fetched from the timber

**Status: open; a glyph drawn in canvas strokes in use (see *Stand-ins in use* above).** A family with no timber of its own
can take the ox and wagon to the nearest timber and bring six logs home (`fetch-logs`, docs/BIOME_GAMEPLAY.md §3.2). The
order is on the family panel with no icon art.

- **Why.** One stroke-drawn glyph beside the illustrated icons reads as a placeholder, and it must be told from *Fell trees*
  and *Haul logs to the house*.
- **What.** `icon-fetch-logs` in the action-icon contract (request 2026-09-15 — action icons, 128 by 128, one silhouette,
  reading at 38 pixels and dimmed to 40 per cent): logs loaded across an ox wagon's bed, the ox's head at the edge.
- **How it plugs in.** Registered through `npm run build:art`; `drawIcon` in `public/family-panel.js` takes `icon-fetch-logs`
  for a key whose `PANEL_ICONS` entry has only a glyph, with no change to the page.
- **Check.** At 38 CSS pixels it is told apart from `icon-fell-trees`, `icon-haul-logs` and the wagon's travel icon.
## Request 2026-09-19 — the traveller's marker

**Status: delivered 2026-09-21.** `travel-markers.png` supplies painted rust, ink, grey-green and slate portrait pins, route dots, destination rings and hoofprints with transparent centers. Owner, 2026-09-18, playtesting Solo: "when i sent my main
character to gonzales on foot he ran inhumanly fast". The pace is right and the clock and the figures' size stay; the owner
chose, by multiple choice, "Marker when fast": once somebody would cross the screen faster than a walk can be drawn (more than
1.2 of their own heights a real second, `MARKER_ABOVE` in `public/motion.js`), they are drawn as a marker moving along a
dotted road instead of a running figure. Pressed close in, a walker in the farming day is past it; in the family's own view
they are not; in the long ticks nearly everybody on the road is.

- **Why.** The marker is drawn in canvas strokes: a flat disc and a triangle point, and round dots. It reads, and the face on
  it is the person's own portrait, but it is the only thing on the map drawn as a diagram rather than in the illustrated style
  around it.
- **What.** Transparent, in the map art's own light (upper left) with the thin dark outline the family panel's marks have:
  - `marker-pin` — a round frame on a short tapering point, like a pin pushed into the map, the round part empty in the
    middle (the page draws the person's portrait into it, clipped to a circle 90% of the frame's inner width), about 64 by 96,
    the point's tip at the bottom centre. Three rings: `marker-pin-rust` (the principal's rust `#a9512d`), `marker-pin-ink`
    (`#3b3221`, the rest of the family) and `marker-pin-grey` (`#7b8676`, somebody else's); a courier's slate (`#41556b`) may be
    a fourth.
  - `marker-dot` — one dot of the road ahead, 16 by 16: a round pebble or a small hoof-print in the ring's colour with a pale
    edge, drawn to read at 5 pixels and repeated along the road every 13.
  - `marker-end` — where the road ends: a small ring or a flag on a stake, 32 by 32, base at the bottom centre.
- **Anchor.** `marker-pin` at the tip of its point; `marker-dot` at its centre; `marker-end` at its base.
- **How it plugs in.** Add the sheet and ids to `SHEETS` in `scripts/build-atlas-manifest.mjs`, `npm run build:art`; then
  `drawTravelMarkers` in `public/app.js` lays `marker-pin-*` where it strokes the disc and point (the portrait is drawn into it
  as now), `marker-dot` along the road where it strokes the dots, and `marker-end` at the destination. Remove the stand-in row
  above. Nothing else changes: when a traveller is a marker, where it stands, and what a tap on it does are the page's.
- **Check.** `node scripts/travel-marker-proof.mjs` and look at `docs/evidence/travel-marker/close-marker-detail.png` beside
  `close-marker.png`: the pin reads as a thing standing on the road, the face is the same person as the panel's portrait, the
  principal's rust is told from the family's ink at 30 pixels, the dots read as a way ahead over timber and over prairie.

## Request 2026-09-18 — the Alamo's faces seen from the south

**Status: delivered and wired 2026-09-21** (`public/alamo-faces.js`, laid by `public/bexar-art.js`; `FIC-GONZ-262`). `alamo-face-strips.png` supplies distinct straight-on limestone, room-range, gate, convento and roofless-church south elevations. Owner, 2026-09-18: "bring the Alamo complex into the same
art style as the rest of the game. ensure it matches the dimensions of the historical building." The map now draws the
compound at its true footprint (`HIST-TEX-090` to `-092`, [ALAMO_LAYOUT.md](ALAMO_LAYOUT.md) "On the map"): every building a
box on its plan, as tall as its true height times the towns' `DRAWN_HEIGHT`, with a flat parapeted roof, and the face turned
south to the camera painted. The camera looks north, so the church's carved front, which faces west, is edge on and not seen.

- **Why.** The painted faces are one generic stone module cut and repeated, so the low barrack, the long barrack, the west
  range and the church all wear the same wall; the gate is a dark rectangle. The compound reads as stone buildings of the
  game, but not yet as the Alamo's own buildings.
- **What.** Straight-on elevations in the `alamo-modules` style — warm outlined limestone, dark olive-brown ink, light from the
  upper left — with **no top, no perspective and no ground**: a flat strip of wall face from its foot to its parapet, each
  drawn to **tile left to right without a seam**, transparent above the parapet line only where the wall is broken.
  - `alamo-face-limestone` — plain coursed limestone, about 2 : 1 (width : height).
  - `alamo-face-rooms` — a one-storey range front, stone with patched plaster, one plank door and one small barred window per
    tile, beam ends under the parapet, about 2 : 1.
  - `alamo-face-gate` — the low barrack's gate passage: a wide opening under a timber lintel with two heavy plank leaves standing
    open, the stone either side, about 1 : 1, to sit in the low barrack's front where the gate is.
  - `alamo-face-convento` — the long barrack's south end, two storeys: a door below, a small window above, a line of beam ends at
    the floor between, about 1 : 1.
  - `alamo-face-church-south` — the church's south side in 1836, roofless: thick coursed stone to a rough, broken top edge, the
    few small high windows, no roof line, about 3 : 1.
- **Scale.** Whatever the tile's pixels, the renderer scales the strip's height to the face's drawn height and keeps its
  proportion along the face; nothing of the plan changes. A stone course about a twentieth of the strip's height reads as the
  existing module does.
- **Anchor.** None: a strip is laid by its corners, foot at the bottom edge.
- **How it plugs in.** Add the sheet and ids to `SHEETS` in `scripts/build-atlas-manifest.mjs`, `npm run build:art`, then name
  each strip in `FACE_ART` in `public/bexar-art.js` with its crop as `u: [0, 1], v: [0, 1]`, and choose it by building
  (`alamoMassing` in `public/alamo-layout.js` names every block and wall). Remove the stand-in row above.
- **Check.** `node scripts/alamo-style-shots.mjs after` and look at `docs/evidence/alamo-after-bexar-closest.png` beside the
  Gonzales shots: no seam where a strip repeats, the gate where the low barrack's gate is, the church's south side broken at
  the top, the long barrack's two storeys; `node --test tests/alamo-dimensions.test.mjs` still passes (the art changes no
  dimension).

## Request 2026-09-18 — the steamboat Yellow Stone

**Status: delivered 2026-09-21; the laden underway loop is wired (`FIC-GONZ-260`) and the empty-deck loop is knowingly not drawn.** `steamboat-moored.png` supplies four researched Yellow Stone states; `steamboat-steam.png` and `steamboat-laden.png` add empty and army-laden underway paddle/smoke loops. Owner-approved
2026-09-18. On April 12–13, 1836 Houston's army crossed the Brazos at Groce's ferry, above San Felipe, on the steamboat
Yellow Stone, which had come up the river for cotton ([HOUSTON_CAMP.md](HOUSTON_CAMP.md), `sim/houston.mjs`, `HIST-TEX-086`).
A student with a man in the army reads "The army is crossing the Brazos on the steamboat Yellow Stone. She came up the river for cotton under Captain John E. Ross, and General Houston has taken her to carry the men, the horses and the wagons over the flood." **and, since 2026-09-21, sees her**: `steamboat-cotton-moored` at the crossing between Groce's and Bernardo while the army drills there, and `steamboat-laden` — under way with the militia, the horses and one wagon on her deck — from April 12 while she carries it over, gone from the map when it marches east on the 14th (`yellowStone` in `sim/houston.mjs`, carried on the army by `sim/armies.mjs`, drawn in `public/app.js`). `steamboat-gangplank` was drawn for the crossing until the laden loop landed later the same day; the server places her in the middle of the water, which is not a bank, so the plank-out beat now has no moment of its own. `steamboat-steam`, the empty-deck loop, is registered and drawn by nothing: nothing projects her steaming light, and a return trip invented to have something to draw is not in the record at this hour.

- **Why.** The crossing is the moment the retreat turns east toward Harrisburg, and it happened on a named boat a class can
  look up. Nothing in the library is near it — a `skiff` or a `ferry-raft` would put the army on the wrong craft — so until this
  lands the game says it and draws nothing, rather than drawing it wrongly.
- **References.** Read 2026-09-18 through a fetching tool that returns page summaries; the quoted wording is to be checked
  against the pages before it is quoted to a class.
  - TSHA, *Yellow Stone*: built at Louisville in 1831, a "sidewheeler" with a "tonnage of 144"; on April 12, 1836 she "made the
    first of seven trips transporting the Texas army across" at Groce's. https://www.tshaonline.org/handbook/entries/yellow-stone
  - *American Heritage*, "The Short, Dramatic Life of the Steamboat Yellow Stone" (May 1987): 120 feet long, a 20-foot beam,
    "two side wheels, each 18 feet in diameter", "sheet-iron chimneys", a pilothouse on the boiler deck; she carried the
    army's men, horses, wagons and ox teams. https://www.americanheritage.com/short-dramatic-life-steamboat-yellow-stone
  - Wikipedia, *Yellowstone (steamboat)*: three decks — hold, main deck, boiler deck; a second boiler added in 1835; 120 or 130
    feet by 19 or 20, the sources differ. https://en.wikipedia.org/wiki/Yellowstone_(steamboat)
  - **The picture to draw from:** Karl Bodmer's aquatint *The Steamer Yellow-Stone on the 19th April 1833*, drawn from life on
    the Missouri three years before the crossing, called perhaps the most accurate depiction of the boat in existence.
    https://www.nga.gov/artworks/183372-steamer-yellow-stone ; https://www.metmuseum.org/art/collection/search/680742 ;
    https://www.nps.gov/jeff/blogs/karl-bodmer-aquatint-the-steamer-yellowstone-on-the-9th-april-1833-artifact-of-the-month-for-december-2012.htm
    Take the number and place of the chimneys, the paddle boxes, the cabin and the pilothouse from the plate; where it does
    not show something, keep it plain rather than borrow a later, grander steamboat (no gingerbread, no tall texas deck, no
    stern wheel).
- **What.** A small side-wheel river steamer of 1836 in the frontier-v1 style (the `transport` preamble in
  [art-prompts.json](art-prompts.json): warm outlined storybook art, dark olive-brown ink, flat shading, light from the upper
  left, a slightly elevated view that sees the deck as well as the side). Broadside, **bow to screen-right (east; mirrored for
  west)**, the starboard paddle box amidships toward the camera. The Brazos at Groce's runs north–south, so the crossing is
  east–west and no north or south view is needed now. Weathered wood and cream paintwork, black sooty sheet-iron chimneys,
  cotton-bale white; **no lettering** (her name on the paddle box would be text), **no flag**. Nothing below the waterline and
  **no painted water** — the map draws the river; a thin dark water-contact line along the hull is fine, and the moving frames
  may carry white churn at the foot of the paddle box and a small bow wave inside the frame. Three sheets of four frames, each
  sheet square and transparent, read by the builder as **2 by 2** (a sheet of four names is laid out 2 × 2 in
  `scripts/build-atlas-manifest.mjs`, as `wagon-rig` is), one boat per cell, 12 per cent margin, waterline at 86 per cent down
  the cell like every other sprite's base:
  - `steamboat-moored` — lying at the bank with steam up: (1) still, thin smoke; (2) the same, smoke lifting; (3) a gangplank
    run out from the bow to the bank; (4) moored with cotton bales stacked on the main deck. Paddles still in all four.
  - `steamboat-steam` — under way, empty main deck: a four-frame loop, the paddle buckets turning at the foot of the box,
    churn, smoke puffs from the chimneys; the hull steady (the renderer adds a slow rock).
  - `steamboat-laden` — the same four-frame loop with the main deck **crowded with the army**: men standing close in plain
    frontier clothes with their rifles held upright, a few horses, one wagon; no uniforms beyond what the militia figures wear.
- **Scale.** The library compresses big things; this one too. Drawn height, waterline to the chimney tops, **four figure
  heights** (`SIZE` in `public/app.js` draws a person at 1, a wagon at 1.55, a cabin at 3.3); hull length about three times that
  height, so the boat is plainly bigger than any building on the map but not a true 120 feet (about 21 figures). The main-deck
  rail stands about one figure above the waterline, and **every man on the laden deck is one figure tall — a quarter of the
  frame's height** — so the men aboard are the same size as the men waiting on the bank.
- **Anchor.** The waterline at the middle of the hull, beneath the paddle box: the renderer sets that point on the river.
- **How it plugs in.** Put the PNGs in `public/assets/frontier-v1/atlases/`, add the three sheets and their frame ids to
  `SHEETS` in `scripts/build-atlas-manifest.mjs` with clips beside `skiff-float` and `ferry-float` (`steamboat-moored` a slow
  loop with smoke, `steamboat-steam` and `steamboat-laden` 4-frame loops with `rock`), record the prompt and source, then
  `npm run build:art` and `npm test`. The page then draws her on the Brazos at Groce's ferry for the two days of the crossing,
  beside the army (`public/army-view.js`): moored or under way, laden or empty, **as the server's projection says** — the art
  decides nothing, and the page never moves her across the river on its own. The words stay.
- **Possible reuse, not a commitment.** River traffic — the Yellow Stone carrying cotton down the Brazos to Brazoria and
  Velasco, or the Cayuga at Harrisburg — is a later design question. `steamboat-moored` frame 4 is asked for with that in mind;
  a different boat would need its own request and research, and a boat going down the river would need north and south views.
- **Check.** Beside `rust-idle-s` and `wagon-covered` at the drawn scale, a man on the laden deck is a person's height and the
  boat outsizes a cabin; at the map's close zoom she reads as a side-wheel steamboat and not a building; the paddles turn in
  `steam` and `laden` and are still in `moored`; each loop runs without a jump; one paddle box amidships, no stern wheel, no
  text, no flag, no painted water; alpha edges clean, no painted transparency; compared with Bodmer's plate, the chimneys, the
  paddle box and the cabin are where he drew them.

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

## Request 2026-09-16 — the camp's icons

**Status: open; drawn glyphs in use since 2026-09-17 (see *Stand-ins in use* above).** A man serving with General Houston's
army in the spring of 1836 has the camp's work on his row of the family panel ([HOUSTON_CAMP.md](HOUSTON_CAMP.md), `sim/camp.mjs`):
drilling, going out for beef and corn, standing guard, riding with the scouts.

- **Why.** The four are canvas strokes (a musket at the shoulder, horns over a corn ear, a bayonet under a crescent moon, a
  horseshoe and a spyglass) beside illustrated icons, and they read as placeholders.
- **What.** Four icons in the action-icon contract (request 2026-09-15 — action icons): `icon-camp-drill` (a file of men
  with muskets at the shoulder, or one man at the position of the soldier), `icon-camp-forage` (a man leading a beef, a sack of
  corn over the saddle), `icon-camp-guard` (a sentry with a fixed bayonet by a fire, night), `icon-camp-scout` (a rider low on
  the horse's neck, looking out over prairie).
- **How it plugs in.** Registered through `npm run build:art`; `PANEL_ICONS` in `public/family-panel.js` names the sprite
  (`sprite: 'icon-camp-<key>'`) in place of the glyph for each key, and `drawGlyph`'s four camp cases are deleted.
- **Check.** At 38 CSS pixels on the panel's dark row each is told apart from the others, from the winter's eight and from the
  farm icons; the drill and the guard are distinguishable at a glance.

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

**Status: delivered 2026-09-21.** Four transparent atlases now supply all 53 current `PANEL_ICONS` keys, including the later service, road, subsistence, gathering and stock actions. See [delivery note](ART_DELIVERY_2026-09-21-FAMILY-ACTION-ICONS.md). Every action a student can give a person is now an
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

**Status: substantially delivered 2026-09-21.** `trees-colonies-1.png` supplies loblolly pine, cedar, mesquite, live oak and elm; `trees-colonies-2.png` adds post oak, blackjack, pecan, hackberry and sweetgum at pole/log/large sizes plus a felled hardwood log. Shortleaf pine and later species breadth remain.
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

**Status: delivered 2026-09-21.** `town-buildings-researched.png` supplies five frame-building variants, Whiteside Hotel, two Round Top House views, four jacales/ramada, open and closed Mina stockades, and two Liberty court-room views. The six towns drawn from `docs/town-research/` (docs/TOWNS.md
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

**Status: partially delivered and wired 2026-09-21** for `rust`, `teal`, `elder` and `blue`; the second cast and the children are still the composite stand-in. `people-wagon-drivers.png` supplies compositing-ready south/east/west/north seated driver layers for the original rust, teal, elder and blue cast. The second cast and child/adolescent coverage remain open. Owner's playtest, 2026-09-16: "characters don't actually
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

**Status: delivered and wired 2026-09-21** for all eight identities; a child on the horse is still the composite stand-in. Six `people-mounted-cast*` atlases supply 96 frames and 24 authored east/south/north riding clips for all eight established identities; east mirrors west. The person's own figure now rides the family horse
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

**Status: delivered for the requested family cast.** 2026-09-14: children's idle, east walk, rest and injured-rest (`people-children-idle`, `-walk`, `-care`), in use; the rider's vertical dialogue (`courier-encounters-vertical`), in use; the dismount, remount, on-foot and waiting-horse sheet (`courier-dismount`), registered and not yet bound; speaking and listening poses for the first cast (`people-dialogue`), registered and not yet bound. 2026-09-15: children's north/south walk sheet is delivered and in use. The second cast has idle, east/west and north/south walk, work, carry, care, search/trade, dialogue/listening, sowing and repair. See [vertical delivery](ART_DELIVERY_2026-09-21-CAST2-VERTICAL.md), [dialogue delivery](ART_DELIVERY_2026-09-21-CAST2-DIALOGUE.md), and [task delivery](ART_DELIVERY_2026-09-20-CAST2-TASKS.md).

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

## Request 2026-09-20 — the gathering icons

- **Why.** Four new works went on the family panel on 2026-09-20 — small game, a line in the water, the oyster beds and a
  bee tree (`sim/gathering.mjs`, docs/BIOMES.md §17.3) — and the panel's other twenty-odd actions are illustrated icons.
  These four are strokes drawn in code until their frames land, which is the standing practice and is marked `stand-in:`
  in `public/family-panel.js`.
- **What.** One icon per action, square, transparent, a single strong silhouette in the illustrated palette with a thin
  dark outline, reading at 34 and 38 CSS pixels (deliver at 128 by 128) and still at 40 per cent opacity. Named
  `icon-<key>`: `take-small-game` (a squirrel on a branch with its tail up, or a rabbit — the hour's work, not the
  day's), `fish-the-water` (a fish on a line over water), `gather-oysters` (two opened shells on wet sand, water behind),
  `cut-bee-tree` (a hollow trunk with comb in it and a bee). Period-appropriate: a line and a hook, not a rod and reel;
  an axe, not a saw.
- **How it plugs in.** `PANEL_ICONS` in `public/family-panel.js` maps each key to `{ glyph: … }` today; registering the
  frames and naming `{ sprite: 'icon-<key>' }` there is the whole swap. `tests/family-panel.test.mjs` fails if an icon
  names a frame the atlas does not have.
- **Check.** The four beside the hunt's own icons at 38 pixels are told apart without their popups, and the oyster and
  the bee tree read as *food* rather than as *shore* and *tree*.

## Request 2026-09-20 — the stock icons

- **Why.** The family's own stock became a herd on 2026-09-20 ([STOCK.md](STOCK.md)) and put three works on the family
  panel. They are strokes drawn in code until their frames land, marked `stand-in:` in `public/family-panel.js`.
- **What.** One icon per action, square, transparent, a single strong silhouette in the illustrated palette with a thin
  dark outline, reading at 34 and 38 CSS pixels (deliver at 128 by 128) and still at 40 per cent opacity. Named
  `icon-<key>`: `butcher-beef` (a long-horned cow of the period — a Spanish criollo beast, lean and rangy, not a modern
  Hereford), `butcher-hog` (a razorback hog with its snout down in acorns, not a fat pink pig), `look-to-stock` (a rider
  on the range, or a hat and a coiled rope over open grass). **No blood and no butchery**: these name the work, and the
  work is a family feeding itself.
- **How it plugs in.** `PANEL_ICONS` in `public/family-panel.js` maps each key to `{ glyph: … }` today; registering the
  frames and naming `{ sprite: 'icon-<key>' }` there is the whole swap. `tests/family-panel.test.mjs` fails if an icon
  names a frame the atlas does not have.
- **Check.** The cow and the hog are told apart at 38 pixels without their popups, and neither reads as the deer of the
  hunt's own icon.

## Request 2026-09-21 — the children's icons

- **Why.** A child under ten had an empty action bar until 2026-09-21, when the owner gave them works of their own
  ([FAMILY_CREATION.md](FAMILY_CREATION.md) §3's amendment, `sim/children.mjs`): play, kindling, keeping the birds off the
  corn, the eggs, carrying water, and minding the younger ones. Six new keys on the family panel, drawn today as strokes
  in code and marked `stand-in:` in `public/family-panel.js`.
- **What.** One icon per work, square, transparent, a single strong silhouette in the illustrated palette with a thin dark
  outline, reading at 34 and 38 CSS pixels (deliver at 128 by 128) and still at 40 per cent opacity. Named `icon-<key>`:
  - `child-play` — a stick horse, or a hoop and stick: **the one icon that must not look like a job.**
  - `child-kindling` — an armful of bark, chips and dead sticks. **No axe anywhere in the frame**; that is the rule this
    icon carries, and a hatchet in a child's hand would say the opposite of what the work is.
  - `child-birds` — blackbirds going up off a standing ear of corn.
  - `child-eggs` — two or three eggs in a nest of straw, or a small basket of them.
  - `child-water` — a wooden pail with a bail, water in it.
  - `child-mind` — a bigger child with a smaller one on the hip. **A child minding, not an adult**: the difference in
    height is the whole content of the picture.
- **The rule the set has to keep.** These are **children's** works. Wherever a figure appears it reads as a child — smaller
  head-to-body ratio, the rule the people stand-ins already proved. Nothing in the set holds a tool with an edge, and
  nothing in the set holds a gun.
- **How it plugs in.** `PANEL_ICONS` in `public/family-panel.js` maps each key to `{ glyph: … }` today; registering the
  frames and naming `{ sprite: 'icon-<key>' }` there is the whole swap. `tests/family-panel.test.mjs` fails if an icon
  names a frame the atlas does not have.
- **Check.** `child-play` is told from the five jobs at 38 pixels without its popup, and `child-mind` is not mistaken for
  a mother and baby.

## Request, 2026-09-21 — the Play Solo menu's trash can

**What it is for.** The owner: *"When I click Play Solo a menu appears. This menu has the saves. That's where a little
trash can emblem should appear and let me delete the save."* One emblem at the end of each row of the saved-games list in
the launcher's Play Solo dialog (`launcher/SoloGameDialog.cs`). Pressing it asks once and then sets that game aside.

**Name:** `icon-delete-save`.

**Size:** 16×16 and 32×32, PNG with transparency. The row is 30px tall and the emblem is drawn in a 34px-wide cell at the
end of it, so it must read at 16px and stay square.

**Two states, both wanted:** at rest, and under the pointer. At rest it is the colour of the row's own text — near-black
on the pale list, near-white on the selected green row — so it must be supplied as a *shape* that can be tinted, or as
two files. Under the pointer it goes to the game's warning red (`#963420`).

**What it should look like.** A frontier object rather than a modern office bin: a lidded pail or a stave bucket would sit
better with the rest of this launcher than a cylindrical wheelie bin. It has to be unmistakably "throw this away" at 16px,
which is the whole difficulty — a bucket alone reads as water. A lid lifted slightly, or a handle, is probably what
separates them.

**Where it will be drawn:** on a pale parchment list (`#F6F0E1`) and on a selected green row (`#4A6850`). No drop shadow;
it sits inside a row, not on the map.

**Until it lands:** drawn with a pen in `DrawBin`, listed under *Stand-ins in use* above. A picture of the menu as it
stands is `evidence/solo-dialog.png`.
