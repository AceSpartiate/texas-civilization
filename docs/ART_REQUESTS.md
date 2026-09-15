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
| Generic `chapel` and `adobe-flat` silhouettes represent San Fernando and the Governor's Palace | `public/bexar-layout.js` | Request 2026-09-14 — Béxar civic architecture | Researched 1836 civic façades in the existing illustrated style |
| A person is drawn as the nearest figure by sex and age: a woman or girl as `teal`, a boy as `blue`, a man as `elder`; the principal in `rust` whoever they are, including a mother | `castVariant` in `public/motion.js` | Request 2026-09-12, priority 2 — the second cast | `rust-woman` for a mother who is principal, `indigo` and `teal` for women, `ochre` and `elder` for men, `blue-girl` and `blue` for adolescents |
| A child walking north or south, working, carrying, sowing or repairing is a grown figure drawn smaller (90% at 10–17, 70% at 5–9, 55% at 2–4, 45% an infant). Idle, east walk, rest and injured-rest use the delivered `girl`, `boy`, `smallchild` and `infant` (2026-09-14) | `CHILD_POSES` and `entityClip` in `public/motion.js` | Request 2026-09-12, priority 1 — children | The children's remaining poses. **Keep the scaling**: the delivered sheets fill their cells and need it |
| *(Planned, with [SETTLING_IN.md](SETTLING_IN.md) step 8)* A parent's chosen appearance is stored and described in words; the figure is still chosen by sex and age | the family book | Request below — layered people art | Layered or palette-swappable sheets for the whole cast |
| *(Planned, with [SETTLING_IN.md](SETTLING_IN.md) steps 6–7)* Interiors and furniture drawn from the Alamo interior pieces | the interior view | Request below — interiors and furnishings | Cabin interiors, furniture and brought goods |
| A family that drove stock in has its cattle and hogs drawn as two `ox-brown` oxen grazing east of the house, on its own land only | the herd in the site loop of `drawWorld`, `public/app.js` | Request 2026-09-13 — stock and the grant (the 2026-09-14 `animal-stock` sheet is **held**, see the request) | `cattle-longhorn` and `hog` idle and grazing figures |
| Cleared ground is turned earth and rows whatever it was: ten acres cleared out of timber look like ten acres broken from prairie | `fieldPatch` and `drawPlots` in `public/app.js` | Request 2026-09-14 — cleared ground | `stumps` scattered over cleared timber ground, and `clearing-brush` piles on ground being cleared |
| A staked plot is a survey-chain square with a small post drawn at each corner | `drawPlots` in `public/app.js` | Request 2026-09-13 — stock and the grant (the surveyor's stake and corner marker) | A surveyor's stake and a corner marker |
| Every kind of tree is drawn with the nearest tree the library has: post oak, blackjack, water oak, elm and hackberry as `oak-broad`; live oak as `oak-spreading`; pecan, hickory, walnut and ash as `pecan`; loblolly and shortleaf pine, cottonwood and sycamore as `cottonwood`; cedar as `sapling`; mesquite as `scrub` | `KINDS` picture in `sim/woods.mjs`, drawn by `drawGroundDetail` in `public/app.js` | Request 2026-09-15 — the trees of the colonies | `pine-loblolly`, `cedar`, `mesquite`, `live-oak`, `elm`, `post-oak` and `blackjack` in the illustrated style, at three sizes |
| A deer being hunted is a plain procedural shape (brown body, stick legs, white tail, small antlers) standing where the server placed it | `miniDeer` in `public/app.js` | Request 2026-09-14 — game | `deer-idle`, `deer-alert` and `deer-bound` in the illustrated style |
| Anybody of a family riding the family horse is drawn as the courier rider (`mounted-courier-*`), whoever they are; the horse under them is not drawn again | `inTheSaddle` and `underARider` in `public/motion.js` | Request 2026-09-14 — family members on horseback | Each cast figure mounted on the family's chestnut, walking in four directions |
| A rider never gets down to talk: they speak from the saddle, turned east, west, north or south toward the listener (the vertical dialogue delivered 2026-09-14 is in use) | `carrierClip` in `public/motion.js` | Request 2026-09-12, priority 3 | `courier-dismount` (delivered 2026-09-14, registered, not yet bound: it needs the encounter to know when a rider has got down and where the horse stands) |

---

Open requests, newest first. Each one says why it is needed, what exactly to deliver, how it plugs
into the existing pipeline, and how it will be checked. When a request is delivered, mark it
**Delivered** with the date and move the details into [ART_MANIFEST.md](ART_MANIFEST.md) by running
`npm run build:art`; do not delete it from here.

---

## Request 2026-09-15 — the trees of the colonies

**Status: open; the nearest trees stand in.** The owner asked for realistic woods (docs/WOODS_AND_BUILDING.md §4). The map now
draws every tree where it stands on the real land, of its kind: loblolly pine round Bastrop and in the east, live oak in the
coastal bottoms, post oak and blackjack on the savanna, pecan, elm and hackberry by the water, cedar in the hills, mesquite
west of the Guadalupe. The library has four broad trees, a sapling and scrub, so a pine is drawn as a cottonwood.

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

**Status: open; a drawn shape stands in.** Found in play: "when hunting i don't see an animal". A hunt now places a deer
(`HIST-TEX-015`) ahead of the hunter in the timber, nearer if they wait for it.

- **Why.** The hunt's one decision - take the long shot or wait - means little when nothing is there to shoot at.
- **What.** A white-tailed deer, `deer-idle` (four frames, grazing and lifting the head), `deer-alert` (head up, ears
  forward, still) and `deer-bound` (four frames, running away), east-facing (mirrored for west), transparent, anchored at the
  hooves, sized to stand about as tall at the shoulder as a person's waist beside the existing people. No blood, no carcass.
- **How it plugs in.** `miniDeer` in `public/app.js` draws the clip for `chore.quarry`; `alert` while the hunter waits on the
  family's word, `bound` for the tick of a missed shot if that state is ever projected.
- **Check.** Scale against `rust-idle-s` and `horse-chestnut`, alternating legs in the run, no painted transparency.

## Request 2026-09-14 — family members on horseback

**Status: open; the courier rider stands in.** Found in play: a person sent on the horse was drawn walking with the horse
beside them. They are now drawn in the saddle, but every rider is the same brown-hatted courier.

- **Why.** A mother riding to the store, a son riding to hunt and the principal riding to Gonzales should each be seen as
  themselves on the family's horse, and the principal's rust coat must stay the student's mark even mounted.
- **What.** For each first- and second-cast adult figure (`rust`, `teal`, `blue`, `elder`, `rust-woman`, `indigo`,
  `ochre`) and the adolescent `blue-girl`: mounted on the same chestnut horse as `courier-mounted`, a walk cycle facing east
  (mirrored for west), north (away) and south (toward the camera), four frames each, same cell size and ground anchor as
  `mounted-courier-e`/`-n`/`-s`. Women ride astride or sidesaddle as the period evidence for Texas settlers supports; say which.
- **How it plugs in.** `inTheSaddle` in `public/motion.js` returns `${variant}-ride-${heading}` in place of the courier clip,
  registered through `npm run build:art`; `underARider` keeps the horse from being drawn twice.
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

**Status: open.** Specified in [LAND_GRANTS.md](LAND_GRANTS.md) §5 and §7 step 4.

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

**Status: delivered 2026-09-14, held for correction.** Astra's `animal-stock` sheet (three longhorn coats and a hog, four poses each) arrived with its provenance, but the red longhorn's horns reach into the neighbouring cell: the manifest build would have to clip 0.38% of that figure, over its 0.25% limit. It is held in `HELD` in `scripts/art-deliveries/index.mjs` rather than the limit loosened. **Asked for again:** the same sheet with every horn and tail inside its own cell, and generous gutters. The stand-in oxen stay until it lands. The original request: Specified in [LAND_GRANTS.md](LAND_GRANTS.md) §3.

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

**Status: houses delivered and in use 2026-09-14** (`houses-settling`: the four houses and their `-site`, `-walls` and `-roofing` stages, drawn by the stage the server reports). **Interiors and furnishings delivered 2026-09-14** (`home-interiors`, `home-furnishings`), registered for the interior view, which is not built. Layered people still open. Specified in [SETTLING_IN.md](SETTLING_IN.md); the exact sheets are to be written
into this request when that chapter's build reaches them, in the contract format of the request below.

- **Layered people.** Students now choose what parents look like (skin tone, hair colour, clothing colour,
  hat, beard, bonnet or pinned hair), and children take after their parents. Baked-colour figures cannot
  show that. Needed: the cast — adults, adolescents and the requested children — drawn as aligned layers
  (body and skin, hair, facial hair or head covering, clothing), or with clean flat colour regions a
  renderer can swap, across idle, walk, vertical and task sheets.
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
  rooms a student can place furniture in.
- **Furniture and brought goods.** Table, benches, bedstead, shelves, cradle; bedding, iron pot, chest,
  spinning wheel, clock, looking glass, crockery, rocking chair; a wagon camp.

---

## Request 2026-09-12 — families that look like who they are, and a rider who gets down

**Status: partly delivered.** 2026-09-14: children's idle, east walk, rest and injured-rest (`people-children-idle`, `-walk`, `-care`), in use; the rider's vertical dialogue (`courier-encounters-vertical`), in use; the dismount, remount, on-foot and waiting-horse sheet (`courier-dismount`), registered and not yet bound; speaking and listening poses for the first cast (`people-dialogue`), registered and not yet bound; the second cast's idle and work sheets (`people-cast2-idle`), and people-cast2-work, registered, waiting for its other sheets before the cast stand-in changes. See [delivery details](ART_DELIVERY_2026-09-14.md). Still open: the children's vertical walks and task poses, and the rest of the second cast. Requested by Claude on the owner's list of next work.

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
