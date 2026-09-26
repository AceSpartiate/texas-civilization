# Claude handoff — Astra foundation

## Gonzales before the fight: the town doing things, talking, and a card to click — 2026-09-25 (released in v2026.09.25.6)

Owner, verbatim: *"when i try to watch a battle, or actions that led to a battle, i see npc's just standing around. example:
there's no one worried at gonzales that the mexicans are coming. there's no group of women making the come and take it flag"*
and *"shouldn't there be talking, orders given, taunting etc? … build it reasonably, and interactively for the player. players
should walk away understanding what happened."* docs/BATTLES.md §5 step 2, the town's half (another builder has the fight).

- **Research first**: docs/battle-research/gonzales-town.md (every source opened 2026-09-25; primary letters of Sept 25 – Oct 3,
  Castañeda's reports in translation, Mason 1874, Bennet 1899, Smithwick, Taylor, the Handbook entries). Registered as
  **`HIST-TEX-460` to `-469`** (the eighteen; the boats and breastwork, amending `HIST-TEX-141` - the ferry was hidden, not gone;
  the stall and Clements's refusal; the first demand and the soldiers held; couriers and the men who came in; the organising,
  the crossing at the ferry and the return about 2 p.m. Oct 2; the cannon buried, dug up, put on cart wheels, loaded with cut
  chain; families leaving or hiding; the flag, DISPUTED; "come and take it" as spoken, DISPUTED) and **`FIC-GONZ-410` to `-413`**
  (the scenes; the flag made on Sept 30 – Oct 1 by unnamed women; lending a hand; walking in town).
- **Built**: `sim/town-scenes.mjs` - 36 dated beats in 8 scenes (the street, the crossing, the far bank, the cannon, the flag,
  the commons, a rider out, families leaving), 54 cast figures with stable ids that are a picture of the town and not a count,
  recomputed from the clock (nothing stored but a family's help, so **no saveVersion**). `townScenesFor` sends a family only the
  beats seen from where its people stand (Gonzales; the crossing and far bank also from the ford), the Host all; only the
  moment's people, props, this tick's words and cards - never the schedule. `public/town-scenes.js` draws them (props, the flag in
  canvas, `TownWalker`), the words through `public/speech.js`, and the card. Hooks: `sim/town.mjs` (Ruth Crandall walks to the
  street, `advanceTownScenes`), `sim/world.mjs` (the projection key and the `town-help` order), `public/app.js` (the drawables in
  the Gonzales branch, `townGround` so **everybody in the town walks, residents included - they used to slide**, the words after
  the figures, the tap, the card), `public/motion.js` (`stepping` and `scenePose` in `grownClip`), `server/app.mjs` (serves
  `/town-scenes.js` and **`/speech.js`, which was committed but never served** - `tests/asset-http.test.mjs` caught it).
- **Talk**: every line `reconstructed` (dashed bubble) and said by an unnamed townsperson, a volunteer or an invented resident
  (Ruth Crandall, Marta Ibarra, a woman bringing food), each resting on a cited claim; the one documented line is Clements's
  *"I cannot now will not deliver to you the cannon"*, read across the river at four on Sept 30 (solid bubble, `HIST-TEX-462`).
  "Come and take it" is never said to the soldiers; the women at the table say it as the words to paint.
- **Interactive**: clicking a scene opens its card - told by a person there, plain words, then what is known labelled
  DOCUMENTED / STRONGLY SUPPORTED / DISPUTED / TRADITION with claim ids, then what is invented. At the flag and the cannon a family's
  person in town may **lend a hand** (a woman or girl of ten with the flag, a man or youth of age with the gun): they walk there,
  are drawn at the work, and the family keeps one line in its story (`FIC-GONZ-412`). No cost, no glory, no effect on history.
- **Evidence.** `tests/town-scenes.test.mjs` (9). `npm test` after merging main (e440bbe): **1212 pass**, 0 fail. **Injections: 21 of 21 caught, each by the check written for it, alone** - 11 unit (each by its
  own test). **`npm run test:gonzales-town`** (new; a real class through
  the join flow, the student's man walked into Gonzales on the 29th, 1366x768 and 1024x768): 10 checks - 35 beats sent as they
  came; at 601 sampled moments people doing different things, never all idle; the flag on its days; 2383 reconstructed lines and
  Clements's drawn as documented; people and residents walking (fastest resident 1.16 heights a second; 7.8 with the pace injected); the flag card opened,
  labelled, on screen and clear of the family at both sizes; the student's man lending a hand from the cannon's card; a family on
  its land sent nothing; the Host's page drawing it. 10 browser injections, `docs/evidence/gonzales-town-injections.json`. Re-run after the merge, PASS: lesson (33), panels (14),
  family-panel (17), gonzales-art, battle-gonzales (11). Pictures: `test-results/gonzales-town-*.png` (the close ones are the ones to look at).
- **Merged with the fight (main e440bbe)**: the town's claims moved to `HIST-TEX-460`–`-469` and `FIC-GONZ-410`–`-413` (the fight has
  `-470`–`-479`, `-415`–`-419`). October 2 in the town keeps the fight's new clock: waiting until first light (05:40), then
  `street-gun` - the town hears the gun up the river (the fight's `FIC-GONZ-417`, which writes the same in the family's journal)
  and waits - until the outcome at 09:40, the men back about 14:00. The flag in town is the only flag: the fight does not draw
  one on the field (`FIC-GONZ-419`).
- **Owner, please confirm** (each is one place to change):
  1. **The flag's makers are shown as unnamed women**, on Sept 30 – Oct 1, carried over the river with the men and back. The research
     leaned to showing the flag only from the October muster (Smithwick, who saw it, remembered it made for Austin's army); you asked
     for the women making it before the fight, so it is built that way and the card says the day is disputed. The card names the
     traditions (Sarah Seely DeWitt and Eveline; Eveline DeWitt with Cynthia Burns, or with Caroline Zumwalt; a committee of five
     officers) and calls the wedding-dress story apocryphal, as the Handbook does. Alternatives: name the DeWitt women on the figures
     as a labelled tradition, or keep the flag to the muster.
  2. **The star is drawn** on the flag and marked disputed on the card.
  3. **"Come and take it" is never spoken to the soldiers** (research question 3, its leaning); Mason's 1874 memory is on the card only.
  4. **Who may help**: women and girls with the flag, men and youths with the gun, anybody of the family in town (not only the main
     person), and it changes nothing but the family's story. Research question 5 offered staying, loading the wagon or hiding
     instead; a player family's home is its land, so those are shown, not offered.
  5. **The eighteen are named on the crossing's card, not on figures** (question 6); **the wheels are "a cotton wagon's"** (question 7).
  6. **Castañeda's camp on the far bank is drawn by the town** until he moves upriver on Oct 1; if the fight's engine draws it, one of
     the two should go (docs/BATTLES.md §5).
  7. **The men cross at 7–8 p.m.** as the research has it; the director's own crossing moment (the upriver call) stays at 10 p.m.,
     "schematic" - both true, the force waited at Mrs. DeWitt's until about one (`ceiling:` at `crossing-over`).
- **Found, not fixed**: `canFight` (sim/family.mjs) reads `entity.sex`, and a founding mother of an unrolled family has none, so she
  passes it (`sexOf` says female). The town's help uses `sexOf`; a background task was offered for the rule itself.
- **Not done**: no named figure but Clements; the scenes' people are not entities (nobody meets one of the eighteen - `ceiling:`);
  the family panel does not light an icon for somebody helping (`ceiling:`); the art request (spade, forge, painting at a table,
  pointing, the flag, the gun on cart wheels, a log breastwork and canoes) is in docs/ART_REQUESTS.md with its stand-ins; phones
  not checked; not on a physical LAN or a Chromebook.

## Battles on one engine, and the fight at Gonzales rebuilt on it — 2026-09-25, night (after a9dbc36; released in v2026.09.25.6)

Wave 1 of docs/BATTLES.md §5, owner-directed 2026-09-25 (*"when i try to watch a battle ... i see npc's just standing around
... there's no smoke from the gunfire"*; *"build it for every conflict"*). docs/BATTLES.md §6 is the engine as built and how
to add the next engagement.

- **Research.** `docs/battle-research/gonzales.md` (Castañeda's own two reports, Macomb, Rusk, Mason, Smith, Taylor, TSHA;
  46 KB): the timeline, the ground, the counts (Texians ~150–168, fifty mounted; ~100 dragoons, all mounted, never
  dismounted), the parley's documented words, the cannon (brass six-pounder on cart wheels, scrap and slugs), the flag
  (design documented; **whether it flew on Oct 2 disputed**), the Mexican loss (**0, 1 or 2, disputed**), the fog and no
  recorded wind. Claims `HIST-TEX-470`–`-479`, `FIC-GONZ-415`–`-419` (upper halves of the reserved blocks, leaving
  `-460`–`-469` and `-410`–`-414` to the town-before-the-fight build), engine rules `FIC-GONZ-445`–`-449`; `FIC-GONZ-023`
  amended.
- **The engine** (`sim/battle-stage.mjs`): engagements as checked data (the talk rules refuse a named man reconstructed
  words), phases dated on the director's clock, state in `world.battles[id]` holding only who was in the force, alerted,
  told and heard - the phase, places, fire, lines, shots and falls are recomputed from the minute, so a save reopens
  mid-fight and an old save gains the record on its next tick. **No `saveVersion` bump.** `director.battle`/`frames` are
  kept, their formations now read off the engine.
- **Gonzales** (`sim/battles/gonzales.mjs`): eleven phases from 22:00 Oct 1 (over the river at Mrs. DeWitt's, Smith's
  address) to 14:00 Oct 2 (home with the cannon): the march up in fog, the outpost at 3, the wait, the dawn skirmish with
  the charge and the first gun, the lull, the parley (Smither, Castañeda, Moore - documented words only, each labelled with
  its source), the cannon and the advance at the double, the dragoons riding off, the field. Director moments now dated from
  it: `approach` 05:40 (was 06:00), `exchange` 08:40 (07:20), `withdrawal` 09:00 (08:40), `resolved` 09:40 (10:00); a new
  `upriver-call` at 18:00 Oct 1. The macro-outcome is unchanged and depends on nobody.
- **Pacing** (`battleMinutes` in `sim/military-pacing.mjs`, also on the invented map): the fighting from first light to the
  field cleared is 36 ticks - **5:42 at Study, 2:24 at Brisk, 0:36 at Quick**; only ever slower; a Host jump refuses while it
  is fought. Measured whole-class cost: the invented country 338 -> 371 ticks to its end (+5 min at Study); the real land
  194 -> 245 ticks to the gathering (+8 min at Study), which includes the upriver call's longer night.
- **Arriving in time** (`FIC-GONZ-446`): every path to "set out upriver and got there too late" closed - the call opens at
  dusk and shuts per family when a walk could no longer reach the men before first light (a family reaching town later is
  told so, never asked); the road ends with the men, not on the Mexican camp's point; the ford is crossed with them whatever
  the river; nobody in the line can be ordered away (by hand; auto is guarded too) until they walk back to Gonzales with the
  men. Participation is now `fought` for anybody in the line while it fired (was `present`) - glory 3, not 2.
- **Viewers** (`FIC-GONZ-447`): the Host live, its camera following the field while it is fought (the delayed Host
  reconstruction is gone); a family live only while one of its people is with the men; the town hears the gun in words
  (`FIC-GONZ-417`: twice, never the rifles); nobody else anything, reconnect included.
- **The card** (`FIC-GONZ-448`): the alert through the person before contact with **Watch** (frames the field and keeps the
  fight framed as it moves until the student moves the camera; never over an open decision; never moves the camera by
  itself); afterwards the account through the person - *What happened*, *What X did*, *Why it ended so*, what next - for a day
  on the card and in the journal.
- **The renderer** (`public/battle-view.js`, replacing `drawFormations`): dragoons mounted in ranks, Texians loose (measured
  nearest-neighbour spread 0.32 against 0.026), every man on his own looping fire-and-load cycle, the officer's volley words,
  flashes, smoke that gathers, lingers, drifts on the day's wind and thins, the gun served by three and fired at its dated
  minutes, the parley, speech bubbles through `public/speech.js` at the moment of the tick each line is dated, generic
  falling / wounded / carried (one Mexican hit at dawn is drawn helped back, wounded), a caption of the phase over the map, and
  a family's own person posed in the force. Five stand-ins, each `stand-in:` in code and a row in docs/ART_REQUESTS.md
  (request 2026-09-25 — battles). Battle drawing measured at 1.4–2.1 ms at its 95th percentile per frame.
- **Tests.** New: `tests/battle-stage.test.mjs` (5), `tests/battle-arrival.test.mjs` (5), `tests/battle-viewers.test.mjs`
  (4), `tests/battle-view.test.mjs` (5). Updated for the owner's new rules (the Host live, the town sees nothing, `fought`,
  the call's words and window, the engine's phase names): battle-ground, battle-members, clock, decisions, glory, gonzales,
  host-live, movement, outcome-news, upriver. `npm test`: **1203 pass, 0 fail (1184 before; the 15 tests the owner's new rules changed were updated, 19 added)**.
- **Injections** (`npm run test:battle-injections`, `docs/evidence/battle-injections.json`): ****29 of 29 caught** by the check written for them - 19 unit injections, each failing its named test and no other in its file, and 10 browser injections, each failing the proof with its own message, among them the owner's own finding (every man fires once and freezes: *"no shot was fired between two moments of the dawn-skirmish by the Texians (0 -> 0)"*); clean runs before and after, every file restored byte for byte**.
- **Browser** (same computer, headless Chrome): new `npm run test:battle-gonzales` - a class through the real join flow at
  1366x768 and 1024x768 (**11 checks: the alert before contact and Watch framing the field; fire and smoke at all 8 sampled moments (Texian shots 16 -> 115, 15-102 puffs in view); loose 0.324 against ranks 0.026; 27 lines drawn including the parley's documented words; the family's man in the force firing; the Host live on the field; the town and the farm sent nothing before and after a reload; the town hearing the gun; the account**); `docs/evidence/battle-gonzales-browser.json`, screenshots
  `test-results/battle-gonzales-*.png`. Re-run: PASS test:alamo-siege (8), test:lesson (33), test:panels, test:host-view, test:host-live (11; its spotlight check now asks for the field, not the town).
- **Not done / limits**: the town before the fight is the other build's; the later engagements are wave 2; the staged fate
  of a family's person inside a deadly battle is designed (§2.6) but not built; the dawn charge moves the whole Mexican
  sample (40 of 100 in the record) and the fifty Texian horsemen are drawn on foot (`ceiling:`); a family's person fires in
  the militia's poses (stand-in); `test:slice` was already failing at a9dbc36 (the family-creation curtain intercepts its
  first click) and still does.
- **For the owner to confirm**: `fought` for the man in the line (glory 3); the flag not drawn on the field (`FIC-GONZ-419`);
  the hit dragoon shown wounded, not dead (`FIC-GONZ-418`); the town hearing the gun (`FIC-GONZ-417`); the Host's live view
  replacing the delayed reconstruction; the call opening at dusk and shutting about 00:50 on the invented country (03:00 on
  the real land, whose camp is nearer) instead of 22:00–06:00; the added class time; the crossing moment kept at 22:00 though the
  crossing began about 19:00.

## Two owner decisions, and the column above the bar — 2026-09-25, late (after 817c104; not yet committed or released)

- **Decided (owner): the ending counts coin held**, not coin gained - starting rich is an advantage, as it was historically.
  Recorded at the head of docs/MONEY_AND_GLORY.md's 2026-09-25 amendment (the recommendations kept only as what was weighed) and
  in its §6 table; docs/FAMILY_CREATION.md's coin bullet says so. `sim/ending.mjs` already scores it (`countedCoin(money)`) and still
  opens the account with *"The family came with N reales."*; no code changed. Struck from the open lists below.
- **Decided (owner): autoplay does not repeat clearing or fencing** - they stay one at a time. docs/FAMILY_PANEL.md §16.1; the
  comment on `REPEATED` in `sim/auto.mjs` says it is a decision, not a ceiling. No behaviour changed. Struck from the open lists.
- **Fixed (owner: "Fix it"): no row of the family column is under the ability bar** (docs/FAMILY_PANEL.md §17). The two-row
  bar was measured at 186px, its top 290px up (330px in the guided start), at both supported sizes - so the fixed
  `#hud-left{bottom:200px}` ran a full column 90px under it. The column's foot is now the bar's measured top less 8px
  (`columnRoom` in public/family-panel.js; `fitColumn` in public/app.js writes `--column-room`), above the Journal/Land buttons
  where they cross it, never off the screen; the main person is scrolled into view when chosen; when the rows do not all fit, the
  auto sentence goes off every row but the main person's into the switch's tooltip (the *Auto ✓* word and glow stay). The
  `ceiling:` at that rule is replaced with what is true now. Found in the screenshots and fixed: *Hide names* shrank to a sliver in
  a scrolling column (`flex:none`).
- **Tests.** New `tests/family-column.test.mjs` (3): the column's foot above the bar and inside the screen for no bar, one row
  and two, plain and lifted, 4/16/26 icons, families of 4, 12 and 20 at 1366x768 and 1024x768; the bottom buttons only where they
  cross; the main person scrolled into view from either end. **Injection**: `columnRoom` returning the old fixed 200 - the two
  `columnRoom` tests fail and nothing else of the 1184. `npm test`: **1184 pass**, 0 fail (1181 before).
- **Browser** (same computer). `npm run test:panels` extended (`measureTheColumn`): a server-rolled family of twenty, two on
  auto pressed from their rows, at 1366x768 and 1024x768, in the guided start and after it is stopped: column above the bar
  (470 over 478, 510 over 518), every row in view on top, the youngest reached by scrolling, the last grown child made main
  scrolled into view. With `bottom:200px` put back it fails (*"the column ends at 568px, under the bar's top at 478px"*); with the
  scroll into view taken out it fails on that row. Screenshots looked at: session scratchpad `column-1024x768.png`,
  `column-1366x768.png` (and `-lesson`, `-last`, `-main` of each).
  Re-run, PASS: panels (14), family-panel (17), auto (14), lesson (33). `node --check` passes on .mjs copies of public/app.js and
  public/family-panel.js. **`test:family-twenty`** now passes its 1366, 1440 and 1024 bar checks (on the tree before this it failed
  at 1024: *"the panel runs down under the ability bar"*, 528 over 478) and then fails on the **phone** at 400px (map on top at 34%
  before `flex:none` on *Hide names*, panel 35% after; its thresholds are 40% and 30%). The tree before this fails the same phone
  check identically (34%) once its 1024 check is stepped past, so it is not this work's; phones are unsupported (8e6ecd5).
- **Found, not fixed**: a 10-to-17-year-old's name beside *Idle* and *Auto* is cut to a letter or two at 19rem (since §16's
  switch took its word); the meeting over the column (§12.12) is still the owner's.

## Starting coin, a family with no vehicle, the carreta, and the horse ridden — 2026-09-25, evening (after 7b102ad; not yet committed or released)

Owner, verbatim: *"families should get some starting coin, starting with a minimum of 3 coin, and a maximum of 10 coin. this should be
a structured part of the wealth d20 roll. yes, it should be possible to start with no wagon. it shouldn't block gameplay, but some
things might have to happen slower. what was the cart thing that tejanos used? maybe we could use that? have it be something families
can make at home? could work the same, just with reduced carrying capacity? yes, the horse should carry a rider."* Recorded as dated
amendments in [docs/FAMILY_CREATION.md](docs/FAMILY_CREATION.md) (the second amendment of 2026-09-25, and the "no band brings coin"
bullet struck), [docs/SETTLING_IN.md §4b](docs/SETTLING_IN.md) ("Zero wagons" amended, and a dated sub-section),
[docs/WOODS_AND_BUILDING.md §6.6](docs/WOODS_AND_BUILDING.md) (the carreta), [docs/MONEY_AND_GLORY.md](docs/MONEY_AND_GLORY.md) (dated
note: coin chosen, the ending's count still open), [docs/LESSON.md](docs/LESSON.md). Claims `HIST-TEX-443` (the carreta's record),
`FIC-GONZ-397` (the second table, coin, on foot), `FIC-GONZ-398` (the carreta); `FIC-GONZ-393` and `-394` amended. **No save version**:
a class made since carries `world.meansRoll = 2`; a class of the afternoon (`true`) keeps the first table, no coin, the horse led.

- **Coin, face by face** (`sim/means.mjs` `MEANS_COIN`): 1-20 → 3, 3 · 3, 3, 4, 4 · 5, 5, 5, 5, 6, 6, 6, 6 · 7, 7, 8, 8 · 9, 10 reales
  (hard up 3; poor 3-4; modest 5-6; comfortable 7-8; well-to-do 9-10; mean 5.65). In the house at the roll, on `household.means.coin`
  (validated against the face), and said with the band: *"Poor. A cart and one ox to draw it, the family's horse, and 4 reales. 4 ride
  and 8 walk beside the cart."* The ending's account opens *"The family came with 4 reales."*; **scoring unchanged** (open, below). The
  lesson's sale step now counts coin over what was in the house when it began, or starting coin would have finished it.
- **The odds, re-cut**: 1-2 **hard up** (no vehicle), 3-6 poor (cart), 7-14 modest, 15-18 comfortable, 19-20 well-to-do = 10/20/40/20/10.
- **No vehicle**: the family wagon is not the family's; its ox carries **7** spaces of packs (hoe, felling axe, first seed, a shot; the pot
  for corn); five days of food on its own backs (five a person of ten and over, `carriedOnFoot`: fits every size 1-20, least margin 1);
  walked in (`mode: 'foot'`, walker's ground pace, slowest walker's speed), one on the horse, the rest in a file; *"They carried 11 food
  on their backs, in sacks and bundles, and the ox carried the rest."* **Slower, not blocked**: a crop that would want the wagon is
  carried in by hand, 6 ticks more (`byHand`); a load over the horse's 7 is refused with *"Send a smaller load, and go again for the
  rest."*; the flight is on foot; stock refused when the packs are full. Tested: the whole lesson (buying seed on foot, selling on foot),
  a by-hand harvest, the Scrape, errands. `ceiling:` fetching logs from timber *off* the land still wants a vehicle; the pack ox and a
  led horse keep the walkers' pace.
- **The carreta** (`sim/carreta.mjs`, `make-carreta`). Research (`HIST-TEX-443`, read 2026-09-25): Smithwick p. 47 *"Carts with great,
  clumsy, solid wooden wheels"*, *"Rawhide entered into the construction of pretty much everything"*; p. 18 the biscuit-wheeled
  *"miniature Mexican cart"*; Woodman pp. 44, 48 *"plank-wheeled vehicles"*, *"unhewn sticks which squeak in the holes of the plank
  wheels"*; Harris 4:2 p. 114 men *"sawed wheels from logs"*; TSHA *Cart War* (1857). Not found: the word "carreta", its size, load,
  making time, or iron. **Recipe**: felling axe (shared at home), **3 logs** from the pile (poorest first), **1 hide**, **12 ticks**; taken at
  the end, nothing if called off; one at a time. **Capacity**: **12** on a trip (wagon 20), **10** spaces in the flight (cart 12, wagon
  16), **2** riders. An ox draws it; `userOf` holds it; the harvest, errand and flight use it. Offered only on land whose trees are
  counted (every real-land class); refused in plain words. Drawn with the wagon's art at 0.8 and a glyph icon (`stand-in:`, new request
  *the carreta* in docs/ART_REQUESTS.md with the pack ox). The game has no family origins, so the poor band's cart stays a cart.
- **The horse carries a rider** (`sim/company.mjs` `riddenHorses`, `seatPlan(people, vehicles, horses)`): one more seat a sound horse,
  after the vehicles' seats, same order (sick, then youngest); a baby in its carrier's arms; `saddle` on the travel record, tired as a
  rider, drawn in the saddle behind the last vehicle (public/app.js), the horse not drawn again. On the road in, the move to the site,
  the flight and the way home.
- **Tests.** New `tests/afoot.test.mjs` (7), `tests/carreta.test.mjs` (5), the horse test in `tests/means.test.mjs` (14 now). Changed
  because the world changed: `means` (five bands, coin, the horse rider counted apart), `lesson` (coin over the start), `ending` (the
  class plays from no coin; the account's first line), `store` (every family starts with its means' coin), `travel-modes` (a family on
  foot has no wagon), `powder`, `beasts`, `chores` (the carreta not offered on the invented map); fixtures `withoutStartingCoin` for
  the coin-from-nothing files (money, crops, ending) and `modestMeans` now gives back the family wagon. **Injections**
  (`scripts/afoot-injections.mjs`, [record](docs/evidence/afoot-injections.json)): **41 of 41 caught**, 27 by that test alone;
  `scripts/means-injections.mjs` re-run with its strings brought up to date: **37 of 37**. `npm test`: **1174 pass**, 0 fail (1161 before).
- **Browser** (same computer only). `npm run test:means` extended (11 checks): the coin on the means line; the poor cart with a child on
  the horse drawn in the saddle; a hard-up family's packs panel (*"No wagon or cart. The ox's packs: 7 of 7"*, *"The family carries its
  food itself: 11 food"*, 5.2 days), walking in apart with a 3-year-old in the saddle and the ox behind, and in with its food; a carreta
  made from the family panel's icon on the real land and standing in the yard. `test:creation` (10; its means regex takes the new bands
  and coin, and its toggle is pressed from the keyboard - the panel's foot covered it under the longer words) and `test:family-panel`
  (17; its seed now rolls hard up with one shot, so the fixture adds four) changed. Re-run, PASS: means 11, creation 10, lesson 33,
  wagons 4, errand 13, going 7, family-panel 17, panels 10, travel 10, farm 7, host-view 8, scrape 5. Screenshots looked at (session
  scratchpad): `means-roll-1366.png` (the coin line), `means-afoot-arrival-1366.png`, `means-poor-arrival-1366.png`, `means-carreta-1366.png`;
  no family arrives short of food (5.0 and 5.2 days in the shots, the floor tested on every size). `node --check` passes on .mjs copies of
  public/app.js, motion.js and family-panel.js.
- **Open for the owner.** (1) ~~How the ending counts starting coin~~ - **decided 2026-09-25 by the owner: coin held**, starting coin
  and all; starting rich is an advantage, as it was historically (docs/MONEY_AND_GLORY.md, the decision at the head of the
  amendment; `sim/ending.mjs` unchanged). (2) The coin
  amounts, the odds, the pack room (7), five a person carried, the carreta's recipe (3 logs, a hide, 12 ticks) and capacity (12/10/2)
  are invented. (3) Should the **cart** also carry less than a wagon on a trip (it carries 20 as before)? (4) Families of origins: the
  poor band's vehicle could be a carreta for a Tejano family if the game ever tells families apart. (5) A pack ox at the walkers' pace.
  (6) Fetching logs off the land with no vehicle is still refused (a family makes a carreta first). (7) Found in passing: the pack
  panel's foot (note and Done) stands over the last lines of its item list, so a pointer can miss an item there (proof pressed it by
  keyboard); a UI fix, not made here.

## Auto keeps at one task, and works about the place while it waits — 2026-09-25 (not yet committed to main or released)

Owner: *"the autoplay feature on characters (the little green circle) isn't quite visible enough and should glow more when
active. if it's on, the character should perform that task on repeat, and if it can't, then it should work around the house
until that task becomes available again. i'm thinking that i could put a character on planting autoplay, and another one on
harvest. then they'd naturally keep going until i turned off autoplay for them."* Recorded as a dated amendment in
[docs/FAMILY_PANEL.md §16](docs/FAMILY_PANEL.md) (and pointers in §11.7, §15 and [docs/LESSON.md](docs/LESSON.md)). No save version.

- **Before:** the switch answered every question at once (unchanged) and repeated **only a hunt**, standing about while it was
  refused; the repeat called the work directly and **walked round the guided start**.
- **Now** (`sim/auto.mjs`): one remembered task (`REPEATED`: the field, the hunts, the gathering, the range, house, lane, well,
  hauling); every tick a person on auto home and free is asked `heldWhy` - the lesson's step, `offered`, `choreAvailability`
  (`userOf`), powder for the hunts - and either takes it up (the quickest way, §15 unchanged) or **works about the place**
  (`task: 'work'`) with the reason written once; a hoe-work refused for a worn hoe mends it first. Refused repeatable work given to
  somebody on auto is **taken as their task** (`waitForTask`; the page is told `waits` and sends it without the chooser), so the
  harvest can be given before anything is ripe. Whoever has waited is asked first, so two hunters on auto share one rifle.
  Exits: off (the work in hand finishes; the task is kept), called away / the family fled (paused, resumed at home), dead or
  taken (switch and task cleared). The director's orders to an absent family are not remembered as the task.
- **Page**: the switch is the key **and the word** (*Auto* / *Auto ✓*), green-filled with a breathing green glow when on
  (never the gold of *Now:*), a green ring on the portrait, and a line under the name with the server's sentence
  (`autoTask.says`): *"Auto: bring in the crop. The field is not ready. Working about the place meanwhile."* No switch under ten
  (the server refuses `set-auto` there; a child with works of their own still showed it).
- **Tests**: `npm test` **1168 pass**, 0 fail (1161 before). New `tests/auto-repeat.test.mjs` (7); `tests/auto.test.mjs` changed (the waiting hunter gets his turn; held means
  about the place; the invalid-order case now uses `visit-shop`). Injections `scripts/auto-injections.mjs`, **18 of 18 caught**, 11 by their own test alone
  ([record](docs/evidence/auto-injections.json)). Browser (same computer only): `npm run test:auto` extended - the switch off and
  on at 1366×768 and 1024×768 (names not cut short), a planter and a reaper on auto, the field bare > planted > ripe > bare >
  planted with nobody pressing anything, each row's reason in the server's words
  ([record](docs/evidence/auto-browser.json), `auto-off-*.png`, `auto-on-*.png`). The proof now packs seed into the cart in the
  lobby and stops the guided start with its X: `app.state` is a **copy**, so its old `powder = 8` never reached the world.
  Re-run, PASS: auto (14), family-panel (17), panels (10), lesson (33), farm (7), family-commands (23). `node --check` on .mjs
  copies of `public/app.js` and `public/family-panel.js`.
- ~~**Found, not fixed**: at 1024×768 a two-row ability bar (16 icons) rises above `#hud-left{bottom:200px}` and covers the
  bottom of the column when it is full~~ - **fixed 2026-09-25**, the entry at the top (docs/FAMILY_PANEL.md §17).
- **Open for the owner**: the way auto goes (quickest, not the last chosen); *Rest* on
  somebody on auto lasts one tick. (Clearing and fencing not repeated: **decided by the owner 2026-09-25 - they stay one at a
  time**, docs/FAMILY_PANEL.md §16.1.)

## Farm plot art overhaul — 2026-09-25 (Astra; for the next release)

Validation completed: **1,160 tests passed**, plus the field-surface, clearing-art, and farm browser proofs. Farm proof checked 58 cached-ground snapshots with none stale. Local files are ready to include with the other work below; this change has not been published separately.

Replaced the plain field rectangles with rough turf margins, shaded textured soil, clods, denser irregular furrows, and young/ripe corn and cotton rows. Partially cleared ground has its own disturbed-soil appearance. Plot geometry, yields, and permissions are unchanged. Implementation and art manifest: [docs/FIELD_ART.md](docs/FIELD_ART.md). New module: `public/field-surface.js`, served by `server/app.mjs` and called from the existing `fieldPatch`/`drawPlots` code. Preserve the module and its server route together when packaging. Visual contact sheet: `docs/evidence/field-surface-contact.png`. The dedicated browser proof passes and rejects an injected blank renderer; the actual-game clearing art and farm browser proofs pass, including cached-ground correctness. Added alongside the uncommitted work documented below.

## The family's means, rolled on a second die; who rides and who walks — 2026-09-25 (after 79e031a; not yet committed or released)

Owner: *"introduce rolling for starting wealth. tie it into the extra wagons. part of wealth will be number of wagons. if a family
doesn't have enough wagons, older family members walk. have this potentially affect travelling speed."* Recorded as dated amendments
in [docs/FAMILY_CREATION.md](docs/FAMILY_CREATION.md) (foot, and §2's wagon note), [docs/SETTLING_IN.md §4b](docs/SETTLING_IN.md)
(and a pointer on §4a), and [docs/MONEY_AND_GLORY.md](docs/MONEY_AND_GLORY.md) (the fairness note, open). Claims `HIST-TEX-442` (the
research), `FIC-GONZ-393` (bands), `-394` (seats), `-395` (pace); `FIC-GONZ-391` retired for new classes. No save version.

- **Research** (`HIST-TEX-442`, read 2026-09-25 in the Internet Archive text of Holley 1833, Woodman 1835, Parker 1836, Smithwick
  1900, Harris *QTSHA* 4:2 and 4:3, Marcy 1859, and the TSHA *Old Three Hundred* page): a family's standing was reckoned by what it
  hauled with (Harris's three classes); coin was scarce for everybody ("none who have much money", Holley p. 128; "Specie is the only
  current money", Woodman p. 117); small children rode and the rest walked ("Mother and I were walking, she with an infant in her
  arms. Brother drove the oxen, and my two little sisters rode in the sleigh", Harris 4:3 p. 162); the ox was the pace. **Not found:**
  counts of rich and poor, how much coin anybody brought, the old or sick riding first, any child's walking pace.
- **The roll.** One press of *Roll the die* throws two d20s (`sim/family.mjs` `meansRoll`, seeded on its own question); the panel
  draws both, says *"You rolled a 12 for your family and a 1 for what it has."* and the server's words: *"Poor. A cart and one ox to
  draw it, and the family's horse. 3 ride and 9 walk beside the cart."* Still Step 1 of 4; no new wizard step, so every proof that
  walks creation still walks it. Families nobody plays get means on the first running tick (`settleMeans`), writing no event.
- **Bands** (`sim/means.mjs`): 1-6 poor, a **cart** (12 spaces, 2 riders, three quarters of a wagon's flight room, "Family cart");
  7-14 modest, one wagon; 15-18 comfortable, two; 19-20 well-to-do, three; an ox to each, one horse always, stock unchanged. Load
  packed a wagon's stores per wagon and trimmed for a cart (never the hoe, axe or seed; `packForRoom` moves resources by the
  difference). **No coin in any band** (drafted 0/2/6/15, withheld: the built ending counts coin).
- **Seats** (`sim/company.mjs` `seatPlan`): a driver per drawn vehicle (principal, then eldest 10+), 4 riders a wagon / 2 a cart to
  the sick then the youngest, a baby under 2 in its mother's arms (no seat), everyone else walks. **Pace** (`companyPace`): the ox's
  0.65, or the slowest walker if slower - 10+ walk 1, 6-9 2/3 (keeps up), 2-5 0.5 (does not); no vehicle, the slowest walker.
  Walkers pay a walked mile of exertion, riders half, carried babies none; nobody is made to stop (`ceiling:`). Applied to the road in,
  the move to the chosen site, the flight east and the way home; errands unchanged. Gated on `world.meansRoll`.
- **Five days of food at the least** (`FIC-GONZ-396`, after the coordinator saw a poor family of twelve arrive with *Food 4.0* - the cart's
  trim had left one barrel): where the load holds less than five days for the family's eaters, the rest is carried on foot
  (`household.packs.food`, fixed at the means roll, outside the load, so repacking moves only the cart's). That family now arrives
  with 15 food (5.2 days, 11 carried). Five days = the Gonzales first period with the guided start in it (4.7 days, measured). Measured
  too: an idle family's routine work at home adds food, so none was starving - but a student sets every hand to the house and field.
  Tested on every band, sizes 1-20, two seeds each, and the families nobody plays; three injections caught (the old trim, packs lost on
  repack, three days). Sources give no amount (`ceiling:`).
- **Zero wagons**: no band arrives with no vehicle - the record's poorest had a sleigh behind oxen, and the lesson's first steps need
  the hoe and axe a vehicle brings. A family whose vehicles are all lost or taken flees on foot at its smallest walker's pace
  (tested). A cart family plants, brings in a crop that "wants the wagon" with the cart, and does its lesson (tested).
- **Page**: `wagonTeams` draws the server's drivers only (a wagon with nobody 10+ to drive goes undriven); riders sit in the wagon
  behind the driver (`bedLayout`, `stand-in:`, in front of the driver going north); walkers in a file along the near side; a train's
  rigs now a whole rig apart (82, was 44), so a following ox no longer stands over the riders ahead. Pack panel: "Pack the cart",
  "The cart: 12 of 12". Lesson step 1 says "Your cart". Host sent the seats too.
- **Tests.** New `tests/means.test.mjs` (13). Changed, each because a family can now have a cart or more wagons than the one the test
  was about: `tests/support/settled.mjs` (`createSettledWorld` gives means first, as the first tick would; new `modestMeans`),
  `tests/wagons.test.mjs` (built as a by-size class, `bySize`), `arrival`, `beasts`, `errands`, `felling`, `gathering`, `going`,
  `travel-modes`, `war-rifle`, `stock` (its fixture now of modest means, since a cart's twelve spaces will not take stock and the default load). **Injections** (`scripts/means-injections.mjs`, [record](docs/evidence/means-injections.json)): **37 of 37
  caught** by the test written for each (19 by it alone). `npm test`: **1161 pass**, 0 fail (1148 before).
- **Browser** (same computer only). New `npm run test:means` ([record](docs/evidence/means-browser.json)): the two dice and the means
  words; a poor family of twelve packs "The cart: 12 of 12", comes in with the principal driving, 2 riding, 9 walking apart beside
  it; a well-to-do family of eight comes in with three wagons, each drawn driven, nobody walking. `test:creation` extended (the means
  after the throw; the taller panel still fits 1366×768; `creation-die-means.png`). `test:wagons` now builds a by-size class.
  Re-run, PASS: creation (10), wagons (4), lesson (33), errand (13; its class now `modestMeans`), going (7; same), family-panel (17), panels (10), travel (10), farm (7), host-view (8), scrape (5; the flight card now says "Room for 15 in the cart" and the load fits the room it reads), looks (8), family-commands (23). **`test:road` fails with a TimeoutError after its second check on this tree and identically on the tree without these changes** (a `.panel-focus` button "not visible"), so it is not this work's; not fixed here. Screenshots looked at: `means-roll-1366.png`, `means-poor-arrival-1366.png`, `means-rich-arrival-1366.png`.
- **Open for the owner.** (1) ~~Coin by band, and how the ending should count it~~ - both answered 2026-09-25: 3-10 reales on the means
  die (that evening), and the ending counts **coin held** (owner; docs/MONEY_AND_GLORY.md). (2) **Slaveholding** was part of some Anglo families' means in the record; the game's
  families are not slaveholders and no band carries it. (3) **An arrival on foot** with no vehicle at all: not built. (4) The die's
  shares (30/40/20/10 in 100) and a cart's 12 spaces and 2 riders are invented. (5) Women drive: the second driver is the eldest after
  the principal, often the mother (Harris's brother drove; the game's driver art has women). (6) The horse is led, never ridden, on a
  family journey; a seat on it would be one more rider. (7) Found in passing: docs/MONEY_AND_GLORY.md §3 cites `HIST-GONZ-022` for
  barter, but that row is about corn; `HIST-GONZ-023` is the coin row.
## Wagons by the family's size, the wheelwright's wagon, and the journey with one way — 2026-09-25 (after b45cab3; not yet committed or released)

Owner, two decisions: *"When a journey has only one possible way, skip the 'how will they go?' chooser."* and *"families should
arrive with an appropriate number of wagons. larger families get more than one wagon based on their population. research first.
wheelwright sells one, very expensive."* Recorded as [docs/FAMILY_PANEL.md §15](docs/FAMILY_PANEL.md) (dated amendment),
[docs/SETTLING_IN.md §4a](docs/SETTLING_IN.md), [docs/TOWNS.md §4f](docs/TOWNS.md) (and §4d's ceiling struck), with dated notes in
FAMILY_CREATION.md §2, LAND_GRANTS.md §3 and COLONIES.md §5.3. Claims `HIST-TEX-441` (the research), `FIC-GONZ-391` (the rule),
`FIC-GONZ-392` (the wheelwright's wagon). No save version.

- **Research first** (`HIST-TEX-441`; read 2026-09-25 in the Internet Archive text of Parker 1836, Woodman 1835, Harris *QTSHA* 4:2 and
  4:3, Smithwick 1900, Holley 1833, and the TSHA *Runaway Scrape* and *Cart War* entries through a fetch). One wagon to a family
  moving overland (Parker pp. 147-48, 203-04; Woodman p. 188: "a strong large wagon, and buy a couple of oxen"); more wagons went with
  **wealth**, not children (Harris pp. 113-14: wagon owners "the aristocracy", carts the next class; one big wagon behind six yoke
  carried five families in the flight, 4:3 p. 163); many had none (Harrisburg 1833 "not a dray nor a wagon", p. 87; the Scrape's
  "Wagons ... were scarce", Harris 4:3 p. 161, Smithwick p. 129). Wagons went behind a yoke or more. Carts and carretas were common
  (Woodman p. 44; Smithwick p. 47). **No wagon was made in Texas and no wagon price was found**; a cart "rate[d] at $100" (Woodman
  p. 169). **Not read:** Jordan, *Trails to Texas* (not online). Page numbers are from the text's running heads; wording to be
  checked against page images before it is quoted to a class.
- **The rule** (`FIC-GONZ-391`, `sim/beasts.mjs` `wagonsForPeople`/`fitOut`): **a wagon for every eight people, by head** (1-8 one,
  9-16 two, 17-20 three), because seven or eight children was a large family of the record; an **ox to each wagon** (`ceiling:` the
  game's ox is the team); the horse stays one. Fitted out at the roll, before the family goes on the road in; the load is packed
  again with **a wagon's worth of stores to each wagon** (`loadForWagons`; room 16 a wagon, stores' most × wagons, tools/goods one
  each); the founding line says the wagons. **New classes only** (`world.wagonsBySize`, set by `createWorld`): a saved class, in its
  lobby or running, keeps one wagon a family. Families nobody plays keep the founding four and one wagon.
- **Counted like horses**: `hh-1-wagon-2` "Second wagon"; `userOf` holds one wagon a person, so two wagons are two loads out at once,
  each behind its own ox (the third is told *"A and B have both oxen and wagons."*). Every beast and wagon home from the road now stands
  on its own `yardSpot` (the regex there had lost its backslash: every bought animal stood on the second one's spot). The flight east
  loads every wagon an ox at home can draw (`FLIGHT_ROOM` × wagons). `teamAt`/`wagonAtHome`/the director's team-left read any wagon.
- **The wheelwright's wagon** (`FIC-GONZ-392`, `sim/shops.mjs` `buy-wagon`): **100 reales, coin only** - the cart's price at a real
  to the dollar, a floor, the dearest thing in the game (`ceiling:` a wagon price from the record replaces it). **An ox bought on the
  same list draws it home**: refused alone in words; at the counter the ox is bought first and **yoked**, and the buyer drives home at
  the wagon's pace; with no ox there the wagon is refused and nothing paid. **One person drives one wagon**: the buyer goes on foot or
  on the horse (the wagon way is shut), a ridden horse is tied on behind (`leads`), so no horse bought the same trip; not on the same
  list as the wheelwright's own service. At most four wagons. The director buys none.
- **The one-way skip** (`goingFor` → `oneWay` when exactly one way can and nothing shuts the order; `public/going.js`
  `skipsTheChooser`): sent at once with that mode, no chooser drawn; the server still checks the mode, and a refusal draws the chooser
  (never skipped again for that order); none open still shows the refusal. The errand popup is unchanged.
- **Page**: `public/motion.js` `wagonTeams`/`teamDrivenBy` - every wagon on the road has its own driver (the one it names; on the
  arrival and in the flight the family dealt in order, principal first) and its own ox; `public/app.js` draws each driver on their
  own wagon, each wagon after the first a length behind; the pack screen says "2 wagons: 24 of 32 space filled" and its `+` stops at
  the server's most.
- **Payload and fog**: a family of twenty is sent 25,335 bytes (24,378 with one wagon; bound moved 25,000 → 26,600, per-person bound
  kept at 1,060 on the people alone, 1,056); another family's wagons never reach a student (test and injection).
- **Tests.** New `tests/wagons.test.mjs` (10: every roll 1-20 on three seeds, arrival drivers, two loads at once, price, refusals,
  bought and driven home, flight, old classes, fog, one-way). Changed `tests/scrape.test.mjs` (room by wagons), `tests/family-roll.test.mjs`
  (bounds). **Injections** (`scripts/wagons-injections.mjs`, [record](docs/evidence/wagons-injections.json)): **24 of 24 caught** by the
  test written for each (18 by that test alone), including "always ask" on the server and on the page. `npm test`: **1148 pass**, 0 fail.
- **Browser** (same computer only; screenshots in the session scratchpad). New `npm run test:wagons` ([record](docs/evidence/wagons-browser.json)): a family of twelve rolled in the browser packs "2 wagons: 24 of 32 space filled"; on the track in both wagons are drawn, each with its own seated driver (rust and teal driver art) and ox, 106 px apart in line; in, both stand in the yard 95 px apart. `test:going` extended: buying furniture with two ways open asks (and fits at 1366 and 1024, Escape sends nobody); the fourth person, with the horse and the wagon out, is sent on foot at once with no chooser drawn. `test:errand` extended: the wheelwright's "Buy a new wagon: 100 reales" is refused alone, sent with an ox, the popup shows the wagon way shut and "Drives the new wagon home behind the new ox"; Soledad drives it home behind Buck, drawn on the wagon, and it stands in the yard. PASS: errand (13), going (7), shops, family-commands, family-panel, panels, lesson, riding, travel, farm, host-view, wagons. Screenshots looked at: `wagons-arrival-1366.png`, `wagons-yard-1366.png`, `wagons-pack-1366.png`, `errand-new-wagon-1366.png`, `errand-new-wagon-home-1366.png`. `node --check` passes on .mjs copies of public/app.js, going.js and motion.js. In the errand proof's last shot, at the page's closest zoom, the two wagons' yard spots are a screen apart, so only the new one is in frame.
- **Open for the owner.** (1) 100 reales is out of most families' reach in a class (families that stay home end the first period
  near 1 real, MONEY_AND_GLORY.md §8.1); if the wagon should be buyable in play, the price is one number. (2) Wealth, not size, bought
  a second wagon in the record; a rolled wealth would replace the size rule. (3) The game's ox is a whole team; a yoke of two would
  double the oxen on the wire. (4) The wheelwright's "good order" is still once for all of a family's wagons.

## Horses and stock at the stock pens; the families nobody plays buy a rifle again — 2026-09-24 (after 67bd422; not yet committed or released)

Owner, two requests: *"have automatic families buy a replacement rifle."* and *"players should also be able to buy more horses
and other animals. they should be relatively expensive though."* Recorded as [docs/TOWNS.md §4d and §4e](docs/TOWNS.md) and
[docs/STOCK.md §7](docs/STOCK.md); claims `HIST-TEX-440` (the prices), `FIC-GONZ-389` (the pens, the animals), `FIC-GONZ-390`
(the director's rifle). No save version.

- **The stock pens** (`sim/shops.mjs` `stockman`), a new trade added the documented way (no livery or dealer is in any town's
  research): Gonzales (Anselmo Treviño, in the open shed at the west edge of the drawn town), San Felipe, Columbia and Victoria
  (De León's ranching colony), invented keepers. **A horse 25 reales, an ox 15, a cow and calf 10 - coin only - and a hog 4 reales
  or 14 food**: one real to the dollar of Parker 1834-35 (a horse $20-30, a yoke of oxen about $30, a cow and calf $10, the last
  also Almonte and Woodman). A horse is 3.1 rifles, an ox 1.9, a cow and calf 1.25, a hog half one. No hog, ox-alone, rifle or
  wagon price was found (`HIST-TEX-440`). Coin only because a food price at two food a real is more than two wagons carry.
- **Counted animals** (`sim/beasts.mjs`, new): every horse or ox bought is its own entity (`hh-1-horse-2`, `hh-1-animal-2`), named
  in the order bought (Dandy the gelding, Buck the ox, ...), drawn with the family's own figures, at most four of a kind.
  `sim/keeping.mjs` `userOf` counts them like tools: **two horses are two riders**, refused only when every one is out
  (*"Alvin and Mateo have both horses."*). `beastFor` picks the animal a person takes; `modeAvailability`, `beginTravel`,
  `harness`, `leaveBehind`, `modeWith`, `keepWithRiders`, the flight east and the overtaking read every animal. No second wagon
  (`ceiling:`).
- **Home on a halter**: the buyer leads it home beside them whichever way they go (riding the horse they came on), one animal a
  person; a led ox and cattle or hogs driven hold them to an ox's pace; nothing led is a load. The popup says so and each way's
  card gives the time home. Cattle and hogs join the herd at the counter.
- **The director's rifle** (`sim/neighbours.mjs` `rifleErrand`): no rifle owned (none home, none at the war), somebody free, one
  at a time; paid in food above `rifleFloor` (3 food a grown share, the larder it keeps for any trade, `ceiling:`) else 8 coin,
  never credit; the nearest gunsmith town by road (Liberty → San Felipe, Matagorda → Columbia); the student's own `visit-shop`
  errand (now carrying an optional `town`, validated) and the quickest way.
- **Study** (`scripts/rifle-food-study.mjs`, extended; [record](docs/evidence/rifle-food-study.json) `afterRebuy`): all 14 rifles lost with the dead were bought again (0 before), 1-10 days
  after the loss (median 3), every one for 16 food, three at another town's gunsmith; no family ended without a rifle (14
  before). Mean food at period ends 34.3 / 65.4 / 12.6 → 34.3 / 64.0 / 12.5; household-ticks with no food 755 → 749; houses ever
  out of food 34 → 35; deaths 14 and 14, the same people. The before is commit 67bd422 run with the same extended script.
- **Tests.** New `tests/beasts.test.mjs` (8) and `tests/rebuy.test.mjs` (4). Changed: `tests/shops.test.mjs` (Gonzales's
  outbuildings are drawn buildings too). **Injections** ([record](docs/evidence/beasts-injections.json)) over 11 test files:
  **22 of 22 caught** by the test written for each (15 by that test alone; the rest also fail neighbouring tests, e.g. the
  director with a second rifle also breaks its riding test). Every new test failed under its injection first. `npm test`: **1138 pass**, 0 fail.
- **Browser** (same computer only). `test:errand` extended: the stock pens' four lines and prices, the popup's animal line and
  *"Rides the horse: 0 of 7 loads. Leads the new horse home on a halter."*, the new horse seen led home beside its rider and
  standing in the yard beside Bess, and two riders out at once on two horses. Screenshots looked at (session scratchpad):
  `errand-animals-1366.png`, `errand-led-home-1366.png`, `errand-two-horses-1366.png`, `errand-two-riders-1366.png`.
  PASS: errand (12 checks), going, shops, family-commands, family-panel, panels, lesson, riding, travel, farm, host-view.
  **travel-drawn is flaky, and was before this change**: 4 of 7 runs pass on this tree and 8 of 10 on 67bd422 (a clean worktree).
  Every failure is a short road for the random Solo family (4.3, 9.2 and 11.8 miles; one HEAD run also failed its frame-pair
  pace check): too little road is walked in view at one end. Not this change's; a proof that pinned the family's road would fix it.
  `node --check` passes on .mjs copies of public/app.js, errand.js and going.js.
- **Open for the owner.** (1) The hog is cheaper than a rifle, as the record's hog was; if "relatively expensive" should cover
  it too, a lot of hogs or a dearer hog is one number. (2) Whether classes already in progress should get the stock pens (today
  a trade appears only in a class made after it, as every trade has). (3) Payment in kind (cattle for a horse) instead of coin
  only. (4) A second wagon from a wheelwright. (5) The director buys no animals and no other tools.

## Every journey asks how they will go — 2026-09-24 (after 0a175bb; not yet committed or released)

Owner: *"when sending someone to travel, the game should ask how they'll travel."* Recorded as
[docs/FAMILY_PANEL.md §15](docs/FAMILY_PANEL.md) (cross-referenced from docs/TOWNS.md §4b). No save version.

- **Which orders ask**: `travel` (Gonzales, home from away, a neighbour's homestead), the call answers that go somewhere
  (`help`, `go-see`, `go-upriver`, `turn-out`, from the card or the call's menu, which asks each person in turn), and every
  work with a road in it (`sim/chores.mjs` `makesJourney` → `journey: true` on the catalogue: hunt in the timber, make/buy
  furniture, fetch logs, the winter's enlisting/joining/voting, Houston). **Not asked**: the four short works and the hunt on
  the family's land (they stroll on foot), work at home, the errand (its popup asks it, now with the same component), and
  sending for / recalling somebody from the army (they come home on what they have, `modeWith`).
- **Server** (`sim/going.mjs`, new): `waysFor` (every way quickest first with pace, miles and time there, carry and what is
  carried or brought home, how tiring, `can`/`why` from `modeAvailability` → `userOf`), `quickestWay` (same per-way function).
  `sim/world.mjs` `journeyOf`, `orderMode`, `goingFor` → `GET /api/ways?entityId&order`. **An order with no `mode` now goes
  the quickest way that can** (was: walked) - the director (`ride` is plain `attempt`; same answer as its old horse-else-walk)
  and auto (chosen again each time) use it. `sim/errands.mjs` `waysOf` is `waysFor` with the load (sentences unchanged).
- **Page** (`public/going.js`, new; `#going`; `.going-way*`): `asksTheWay`, `chosenWay`, `drawWays` (also the errand's), `mountGoing`.
  The quickest is marked and chosen; a shut way carries the server's reason; Enter sends, Escape sends nobody; the bar steps
  aside (`body[data-going]`); a refusal on send is shown and the ways re-asked. **Removed**: the card's *Going by*
  (`#selection-travel`, `renderTravelModes`, `travelModeByEntity`/`modeFor`). The hunt icon's note: *"A good trip gives about N food;
  what comes home depends on how they go."*
- **Tests.** New `tests/going.test.mjs` (8) and `tests/going-page.test.mjs` (3). Changed where the expectation moved (a no-mode
  order rides now): `tests/travel-modes.test.mjs` (expects the horse), `tests/auto.test.mjs` (remembered mode 'horse'); tests
  *about* walking now say `mode: 'foot'`: hunting, geography, tools, upriver, war-rifle. **Injections**
  ([record](docs/evidence/going-injections.json), `scripts/going-injections.mjs`) over 13 test files: **11 of 11 caught**; the
  auto, director, page, forage, logs and mark injections fail only their own tests; slowest-first, no-mode-walks and
  no-holder-check fail every test that holds the rule (errands, keeping, travel-modes, tools). `npm test`: **1123 pass**.
- **Browser** (same computer only). New `npm run test:going` ([evidence](docs/evidence/going-browser.json)): Travel to Gonzales
  opens the chooser, horse marked and chosen, walking picked, Enter, he walks and the horse stays home; the timber hunt sent on
  the horse and drawn riding it; furniture in town with the horse shut in the hunter's name and the wagon picked; the next
  chooser with the wagon shut in the driver's name, fits 500x259 at 1366x768 and 1024x768, Escape sends nobody. Screenshots
  looked at: `going-timber-1366.png`, `going-taken-1366.png`, `going-taken-1024.png` (session scratchpad). `test:travel`
  rewritten for the chooser; `test:errand`, `test:family-commands`, `test:furniture`, `test:auto`, `test:slice` answer it
  (`scripts/support/going.mjs` `sendTheWay`); `test:lesson` reads the card's fold without *Going by*. PASS: going (6), travel (10), errand (10), shops, family-commands (23), family-panel, panels, lesson, riding, travel-drawn (17), farm, host-view, furniture, auto. `test:slice` fails before this change reaches it: the family-creation curtain intercepts its first click (that proof never meets the family) - not fixed here. `node --check` on .mjs copies of `public/app.js`, `public/going.js`, `public/errand.js`, `public/family-panel.js`.
- **Open for the owner.** (1) A journey with one possible way still shows the chooser (the student learns the question; Enter
  sends it) - skip it instead? (2) Auto takes the quickest each time rather than the way the student last chose. (3) The
  errand keeps its ways under its list, not as a second step.

## Brown over the rivers — 2026-09-24

Owner: *"why can I see brown trail looking things over the rivers?"* Reproduced on the Host's page of a thirty-family class
on the real land at 1,400, 420 and 90 pixels a mile and looked at. [docs/MAP_ACCURACY.md §10.8](docs/MAP_ACCURACY.md) has
all of it. No save version; nothing on the server changed.

- **What they were: the flood, drawn on chords.** A class opens with the Guadalupe up (`HIST-TEX-225`), and a river in flood is
  drawn gone brown (`drawHighWater`, public/weather-art.js). It was stroked with `lineTo` through the course's points while the
  river under it is `curveThrough`'s curve, so close in the brown cut every bend in straight translucent bands over the grass -
  32 px off the water at the Guadalupe's bends above Victoria. The fog was banked on the same chords. Both are on
  `curveThrough` now (imported relative, `./curve.js`). **Then its colour** (coordinator, after looking): on the curve the
  flood was a wide tan band the roads' colour - ΔE 10.6-15.3 from road dirt, 11-13 L* darker. Now `FLOOD`: a muddy olive
  body (`#5a6a3c`) with a soft dark silty edge, ripples of current scattered across it (from 16-32 px of flood), sticks of
  drift once it is over its banks. Mid-channel ΔE ≥ 24.3 from every road surface and 19-35 L* darker; ripples ΔE ≥ 10 from
  every road colour; ΔE ≥ 25 from the ordinary river, whose blue stays covered (the 2026-09-20 reason). A try with long light
  streaks along the water drew a paved highway with lanes and was taken out.
- **And the family's lane, over water with no ford.** Lanes wade the smaller water by design (`sim/colonies-region.mjs`) but only
  a road's wade was a ford. `wadesOf` (public/map-base.js) finds each meeting of a lane with drawn water more than a quarter
  mile from a crossing; the page draws the road's own ford there from 45 px a mile (`window.__wadesDrawn`). Two `ceiling:`s in
  `public/app.js`: the wade costs the family nothing, and the timber tracks are left.
- **Routing, found and not mended** (the built map's): the timber tracks and Gonzales's bank path cross the Guadalupe, Colorado,
  Trinity and Brazos a half mile to two and a half miles from the documented crossing, through the barrier cells each crossing
  opens; a hunter walks over there with no ferry or wade. Laying them again is a `colonies-map.json.gz` rebuild and a map
  decision for the owner. Also 26 road/creek meetings off any ford (braided creek-bottom runs, §10.6's ceiling), and Coleto
  Creek, Cibolo Creek and the Neches/Angelina past the box as oddities.
- **Tests.** New `tests/water-overdrawn.test.mjs` (3). Injections ([record](docs/evidence/water-overdrawn/injections.json),
  script beside it): **5 of 5 caught, each failing only its own test** (the fifth: the flood back in its old tan). `npm test`: **1115 pass**, 0 fail. `node --check` on `.mjs` copies of `public/app.js`, `map-base.js`, `weather-art.js`.
- **Browser** (same computer only). Before/after shots of six places at three zooms, looked at (session scratchpad,
  `rivers-before.png`, `rivers-after.png`; after the colour `rivers-after2.png`, and the ordinary day and a shut river
  under fog in `rivers-after2-normal-shut.png`). PASS: crossings (21 shots, each crossing drawn as its kind; the Gonzales ford's
  flood now on the river's curve), farm, host-view; their rewritten evidence files were put back rather than committed.
  **`scripts/weather-browser-proof.mjs` fails at HEAD as well** (0a175bb, checked with this change taken out): it waits 120 s
  for `status === 'running'` before meeting the family, and a solo game is no longer running then. Not mended here.

## Tools counted and bought in town — 2026-09-24 (after fd13eea; not yet committed or released)

Owner: *"players should be able to send someone to buy more rifles, hoes, tools in general."* Recorded as
[docs/TOWNS.md §4c](docs/TOWNS.md), claim `FIC-GONZ-388`; CLAUDE.md item 16 updated. No save version.

- **Counts** (`sim/tools.mjs`, new, no imports). `household.tools` unchanged (one owned; the wear of the one in hand);
  `household.spares[tool]` the wear of each further copy; `household.rifles` the rifles (absent = the one every family always
  had). Old saves open with one of each they owned. The soundest hoe is kept in hand (`soundestFirst`): a hoe bought beside a
  worn one goes into use, the worn one waits, *Mend the hoe* mends the worst (`mendWorst`), planting waits only when all are worn.
- **Sold** (`sim/shops.mjs`): the store's hoe (2 reales, coin only - the "null food" fix kept) and the blacksmith's four tools
  are no longer refused for the family having one (`TOOL_MOST` 4 a trip); **the gunsmith sells a rifle, 8 reales or 16 food**
  (`RIFLE_COIN`/`RIFLE_FOOD`, invented `FIC-GONZ-388` with a `ceiling:`: no 1835 price found), in the four towns with a
  gunsmith only. Tools are a load each; the way-of-going choice still has to carry them; no credit (the list is reckoned
  against what the family has, before and at the counter).
- **One copy held** (`sim/keeping.mjs` `userOf`, `COUNTED` rifle and axe): each holder takes a copy, the shared work at home one
  copy among all of it; refused only when every copy is out, named together (*"Alvin and Mateo have both rifles."*). Beasts
  unchanged. No rifle left: *"There is no rifle in the house. The gunsmith sells them."*, and a man going to the war goes
  without (`takeToWar` → `'none'`, `warRifleWords`).
- **The death rule** (replaces §4b's `ceiling:`): the rifle a man carried to the war is **lost with him** if he is killed,
  captured or taken prisoner (`homeAgain` → `loseTool`), said in the story. Open for the owner: whether men who surrendered
  should get theirs back.
- **Study rerun** ([record](docs/evidence/rifle-food-study.json) `afterTools`): families nobody plays **bought no rifles** - their
  director never sends anybody to the shops. 14 rifles lost with the 14 dead, 14 families ended without one; food, hunger
  (743 household-ticks) and deaths (the same 14) as before within a tenth of a food.
- **Tests.** New `tests/tools.test.mjs` (8: counts and old saves, buying, the hoe, two hunters, war with two rifles, the death
  rule, two axes, the load). Changed: `tests/shops.test.mjs` (a second auger is sold), `tests/errands.test.mjs` (the most of a
  line), `tests/war-rifle.test.mjs` (the rifle is lost with the dead; "went without a rifle"). **Injections**
  ([record](docs/evidence/tools-injections.json)) over the 14 test files the change touches: **13 of 13 caught**; the family
  with no rifle by default fails 38 tests across the suite (every hunt), as it should. `npm test`: **1112 pass**.
- **Browser** (same computer only). `test:errand` extended: a second rifle and an axe bought at the gunsmith and blacksmith,
  the stock line naming the family's tools, and two hunters out at once (10 checks). Screenshot looked at:
  `errand-tools-1366.png` (session scratchpad). PASS: errand (10), shops, family-commands, family-panel, panels (2 sizes), lesson, riding, farm, host-view, travel.

## The owner's four answers: the axe off the land, the rifle to the war, one rifle measured, the way chosen — 2026-09-24 (after v2026.09.24.4; not yet committed or released)

The four questions the errand entry below left open, answered by the owner the same day and recorded as dated decisions in
[docs/TOWNS.md §4b](docs/TOWNS.md). CLAUDE.md item 16 updated. No save version.

- **The felling axe is held off the land.** `sim/chores.mjs` `axeFor`: work that carries it past the family's line
  (`fetch-logs`, `cut-bee-tree`, `make-furniture` when the timber is outside `holdingOf`) holds it alone from the order until
  home (`axeHome` in `progressTravel`); work that uses it on the land (felling, the house when its pieces want the axe, a lane
  or a clearing through timber) holds it **shared** (`chore.shares`, `userOf`'s `shares`), so the family works it together
  and nobody carries it off meanwhile. Refusals name the holder: *"Rosa has the felling axe, on the road to the timber on
  …"*, *"Mateo has the felling axe, felling a post oak."* House work stops itself when the logs run short, so fetching is never
  locked out for good. Old saves derive the axe (`deriveUses`).
- **He takes the rifle to the war.** `sim/keeping.mjs` `takeToWar` writes `person.carries` from every way a man goes:
  `sim/calls.mjs` `handleCall` (turn-out), `sim/directors.mjs` `handleMarch` (go-upriver), and the winter's six war chores
  (`war` words; `beginChore` → `goToWar`). Nobody at home hunts or practises: *"Alvin has the rifle, gone with the volunteers to
  Gonzales."* `homeAgain` (each tick after `keepWithRiders`) lets it go when he is home, dead, captured or a prisoner
  (`ceiling:` the rifle is not lost with him; nothing sells one). A hunter out with it means he goes without, said, and
  remembered (`carries.items` empty) so a reload does not hand it to him. Carrying food ("help") takes no rifle. The family
  owns one gun; none was invented. Old saves: a man away with an active commitment or service opens holding it (`warWords`).
- **One rifle kept, and measured** (`scripts/rifle-food-study.mjs`, [record](docs/evidence/rifle-food-study.json)): four classes
  of fifteen families nobody plays, all three periods, before (45023e7: two hunters, rifle at home) and after (both rules):
  mean food a house at each period's end 37.9 / 65.1 / 12.1 → 34.9 / 64.3 / 12.4; household-ticks with no food 914 → 743;
  houses ever out of food 34 → 34; **deaths 14 → 14, the same fourteen people**. Nobody starved who would not have. Nothing
  retuned.
- **The student chooses the way.** `sim/errands.mjs` `waysOf`/`errandQuote(..., { mode })`: every way, quickest first, with
  `can`/`why`; `quickest` is the suggestion; a chosen way is held to it (*"On foot a person carries 5, and this is 6 loads."*, the
  holder's name) and said (*"Goes on foot: 3 of 5 loads, as you chose. The horse would be quicker."*). The order's `mode`
  reaches `planErrand` as `extra.errandMode`; `GET /api/errand` takes `mode`. Page: `public/errand.js` `drawWays`,
  `#errand-ways` (index.html, style.css). Screenshot looked at: `errand-ways-1366.png` (session scratchpad) - the horse marked
  quickest, *On foot* chosen, the wagon shut with Alvin's name under the row.
- **Tests.** New `tests/war-rifle.test.mjs` (9: the call, the march, the garrison; sent for and home; dead, captured, prisoner;
  going without; old save; the axe carried off, shared at home, let go and derived) and one in `tests/errands.test.mjs` (the
  choice). **Injections** ([record](docs/evidence/war-rifle-injections.json)) over the 13 test files they touch: **13 of 13
  caught**; 9 fail only their own test, the call left unheld also fails the two tests that start from a turned-out man, the
  rifle never coming home also fails death's test, the axe never held away fails all three axe tests, and sharing removed at
  home also fails `tests/felling.test.mjs`'s two fellers in one place. `npm test`: **1104 pass**.
- **Browser** (same computer only). `test:errand` extended (a way chosen, the wagon shut in the holder's name, the walker
  goes on foot and the horse stays home): PASS, with errand (9 checks), shops (5), family-commands (23), family-panel, panels (2 sizes), lesson, riding, farm, host-view, travel and travel-drawn.

## The errand chosen before anybody leaves, and one person at a time with a thing — 2026-09-24 (after v2026.09.24.3; not yet committed or released)

Owner: *"When sending someone to town to stores, there should be a popup first asking what they should buy or sell.
(Currently I can't buy more seed.) They'll take priority on the wagon and take it so they can carry whatever it is they need
to. If someone is using the wagon (or horse, or any item really), then no one else can use it."* Recorded as
[docs/TOWNS.md §4b](docs/TOWNS.md), claim `FIC-GONZ-387`, and item 16 of CLAUDE.md's reading list.

- **The seed, found first.** Nothing refused the seed: the store sells it for a real or three food, and a node run and a
  browser both bought it for anybody who answered in time. `visit-shop` asked *which shop* and *what at the counter* only on
  arrival, each question waited `ASK_PATIENCE` (two hours of 1835: six ticks, under a minute at the study pace, six seconds at
  the quick one) and silence answered *Come home again* / *Nothing today*; **a person on auto was answered the tick they
  arrived**, so they never bought anything. The owner's own solo game of 2026-09-21 (`data/solo/games/deleted/3e5807f84e27.json`
  in the installed build) shows it: auto switched on at tick 191, sent to the shops at 192. Found on the way: the store's hoe
  has no food price and the counter offered *"Buy a sound hoe: null food"*, replacing a worn hoe for nothing — mended in
  `counterOptions`/`counterRefusal`.
- **The errand** (`sim/errands.mjs`). `visit-shop` is now the errand: the order carries its list, `{ action: 'chore', chore:
  'visit-shop', entityId, errand: [{ id: 'trade:offer', n, pay }] }`. `planErrand` (the chore's new `plan` hook in
  `beginChore`) checks it against the family's stock — shop standing there, the shop's own refusal, can pay, has what it sells,
  one of anything bought once, the load fits a way of going it has free — and throws the popup's own sentence; the keeper's
  purse is not checked (owner, 2026-09-12). At the shops `carryOutErrand` (a `run` step) does it **sales first, then the mill,
  then purchases**, each in list order; what differs on arrival is done as far as it can still be paid for, nothing is paid for
  what is not received, and the shortfall is said. The store buys cotton and food for coin outside its purse, as the owner
  decided on 2026-09-16 (the old counter wrongly drew them from the purse). **The load**: every good a load a unit, coin
  nothing, a tool/shoes/saddle/blankets one, the rifle one each way; the larger of the way there and the way home.
  **The way of going**: the server takes the quickest that carries it and is free — horse, foot, then wagon — and says why:
  *"Takes the wagon: 14 of 20 loads, more than the horse carries (7)."*; the wheelwright's line takes the wagon itself.
- **The popup** (`public/errand.js`, `#errand`, `GET /api/errand` → `sim/world.mjs` `errandFor`). The Go to town to trade icon
  opens it (`public/app.js` click dispatcher); the town's shops grouped with keeper, price, why a line is shut, a count and
  Coin/Food; the stock, the stock after, the server's sentence for how they go, a refusal in its words with Send shut. Enter
  sends, Escape sends nobody. Re-asked whenever the list, the family's stock or the person's travel modes change. The ability
  bar steps aside while it is open, by §12.13's rule for a rider, and the person's card is hidden under it. The command's id is
  made in `app.js` after the spread. Screenshots looked at: `errand-1366.png`, `errand-refused-1366.png`, `errand-1024.png`
  (session scratchpad) — clear of the family's column and the bar at both sizes.
- **One person at a time** (`sim/keeping.mjs` `userOf`, the one rule; `hasWords` now says what the holder is doing: *"Rosa has
  the ox and wagon, on the road to Gonzales."*). Held on the road (`borrowedBy`, as before) or **by work** (`chore.with`,
  written in `beginChore` from the chore's `takes` and its mode's `needs`): the rifle for hunt-timber, hunt-land,
  take-small-game, practise-shooting and hunt-road; the ox for haul-logs (taken at the first load when free, `takeUpLogs`); the ox
  and wagon for a harvest that wants them, **shared** by the harvesters. `promisedTo` is gone — `with` is it. `intoTheRoad` lets
  the work's hold go when the road begins. Every exit releases because the hold is the work: finished, called off, abandoned for
  a call, dropped by `flee`, dead or captured (never counted). The keeping.mjs ceiling ("somebody may still drive off with the ox
  mid-haul") is paid. Refusals: `modeAvailability`, `choreAvailability` (`takenWhy`), `fetchLogsFacts`, `teamAt`, `oxFree`.
- **Old saves.** `readSave` renames a saved `visit-shop` with no `errand` to the retired `visit-shop-street` (the old steps,
  offered to nobody, still in the catalogue so its icon names it) and runs `deriveUses`: a hunt opens with the rifle, a load
  behind the ox with the ox, a harvest wanting the wagon with both, a journey still to come with its beasts. No `saveVersion`.
- **Lesson.** Step 8's sentence no longer names a counter on arrival; docs/LESSON.md's table row updated. `chore:visit-shop` is
  still on plant/harvest/sell/hunt, so the seed is bought on the planting step (tested).
- **Tests.** New `tests/errands.test.mjs` (13). Changed where the expectation moved: `tests/shops.test.mjs` (the counter tests
  now send lists; the hoe has no food price), `tests/lesson.test.mjs` (the sale is a list), `tests/keeping.test.mjs` and
  `tests/travel-modes.test.mjs` (the holder's doing in the sentence), `tests/hunting.test.mjs` (two hunters of one family in one
  stand can no longer happen: now *one family has one rifle*), `tests/auto.test.mjs` (the second hunter waits for the rifle),
  `tests/hunt-weather.test.mjs` (reads only the hunt's own events; the family's earlier history had changed), `tests/chores.test.mjs`,
  `tests/family-panel.test.mjs`, `tests/children.test.mjs` (the errand is sent with a list). **Injections**
  ([record](docs/evidence/errand-injections.json)), each put back alone over the 20-21 test files the change touches, file
  restored: **16 of 16 caught**; 13 fail only their own test; the plant step shut also fails the lesson's playthrough, the wagon
  tried first also fails the exclusive-use test (which asserts the horse), and the rifle shared fails the five tests that hold
  the rifle rule. `npm test`: **1094 pass** (1081 + 13). `scripts/check-doc-links.mjs` clean.
- **Browser** (same computer only). New `npm run test:errand` (`scripts/errand-browser-proof.mjs`, [evidence](docs/evidence/errand-browser.json)).
  `scripts/shops-browser-proof.mjs` now buys the tavern meal through the popup; `scripts/family-commands-browser-proof.mjs`'s
  asking work is making furniture (nothing is asked in town now); `scripts/riding-browser-proof.mjs` and
  `scripts/travel-browser-proof.mjs` accept the holder's doing. PASS: errand (8 checks, 1366x768 and 1024x768), shops (5),
  family-commands (23), family-panel, panels (10 checks, 2 sizes), lesson, riding, farm, host-view, travel (modes). travel-drawn
  failed once on its walk-in timing ("they are back and walking before they are drawn at Gonzales", nothing of this change) and
  passed on a lone rerun, as it did on 2026-09-24's house entry. `node --check` on .mjs copies of `public/app.js`,
  `public/errand.js`, `public/family-panel.js`.
- **Open for the owner** (docs/TOWNS.md §4b): tools not held (the family's shared work at one place goes faster with more
  hands); whether the rifle goes with a man who turns out; one rifle a family (measured once, first class period only (same computer; a 15-family class on the colonies, families nobody plays, four seeds, before and after this change): nobody went hungry or died either way; the mean food in a house at the period's end fell from 37.9 to 33.9. The
  winter and spring are not measured); the server, not the student, chooses the way of going.

## The dog-run's passage is twelve feet — 2026-09-24 (after v2026.09.24.2; not yet committed or released)

Owner decision: widen the dog-run's open passage from one 8-ft plan cell to 12 feet. `HIST-GONZ-025` gives "a ten- or
fifteen-foot passage"; the plan's 8 ft was under the source's narrowest. **Now honoured** (HISTORY.md HIST-GONZ-025 and
FIC-GONZ-033 rows updated). Server and page: a plan, footprint and spacing change; no projection field, command or save
version.

- **Representation.** 12 ft is a cell and a half, not rounded to 16: the plot's pieces are sized and placed to the **half
  cell** (4 ft). `sim/houseplot.mjs`: `CELL_FEET` 8, `PASSAGE_FEET` 12, passage `w: PASSAGE_CELLS` (1.5); `cellsOf` counts
  half cells; `placeRefusal` takes any whole number of half cells (4.5 yes, 4.25 no); `pensFor`'s `between` finds the east pen
  at `p.x + kind.w`. Dog-run plan: chimney 0, pen 1, passage 3, pen **4.5**, chimney **6.5** — 7.5 × 2 cells, 60 ft. The
  catalogue is the one width: server footprint, placement, spacing (`houseFootprint`, `houseOnGround`) and page drawing,
  preview, outline and tap boxes all read `kind.w` (`public/house-plot.js` `chimneyGables` changed from `p.x + 1` to
  `p.x + p.kind.w`; `alongRidge` needed nothing).
- **Cost.** Passage roof 4 wall logs and 4 work a cell: **6 and 6** (was 4 and 4). A dog-run wants 2 more wall logs.
- **As drawn.** Pens 1.75 pen depths (28 ft) apart along the ridge, was 1.5; still one building at every turn. One copy of the
  pens' roof still spans the passage, now a quarter cell over each pen's roof (was half) — no second roof copy needed. The
  floor's deck (~1.1 cells of ridge) no longer covers the passage, so it is laid **twice** (`PASSAGE_FLOOR_DEEP` replaces
  `PASSAGE_FLOOR_BACK`): back edge on the far pen's front wall, and foot at the near pen's back wall. Roofs seated, chimneys
  on their gables, upright sprites, preview == built, zoom merge unchanged. Montage `passage-12.png` (session scratchpad):
  dog-run 0/90/180/270, before and after, finished, roofed-not-chinked, walls to course 7 — looked at: one building, the
  passage visibly wider, floor across it, roofs joined.
- **Spacing.** Measured on every plan and turn: the dog-run now reaches 1.57 up, 0.87 down (0°/180°), 1.36 either side
  (90°/270°). **`PICTURE_REACH` `{ 1.5, 1.3, 0.8 }` → `{ up: 1.6, side: 1.4, down: 0.9 }`**: +0.1 cell (about 15 ft of the
  map) each way, for every plan (`ceiling:` one reach for all). 1.6 × `CELL_MILES` = 0.045 mi < `SITE_MARGIN` 0.05. The land:
  a dog-run is drawn over 7.6 acres (was 7.1) and claims 23.6 (was 21.0); a cabin claims 13.3 (was 12.3); a labor still holds
  a dog-run, two cabins and **4** ten-acre plots (4 before this change too — WOODS_AND_BUILDING's "eight" was stale from the
  first reach; now corrected), above the 3 the docs promise.
- **Old saves.** A dog-run saved with the 8-ft passage opens **laid out at 12 ft**: `server/storage.mjs` `readSave` (the one
  door, as for powder) runs `widenPassages` on the house and every completed house — east pen, what is east of the passage in
  its rows, and what stands in/before/behind a moved pen go half a cell east (or, off the plot, the west side and passage half
  a cell west). Stages, progress and placement kept; nothing refunded (a passage begun keeps its 4 logs, now wants 6 work). No
  `saveVersion` bump: no field added or reread. `ceiling:` a free plot with no room either side stays as it was and would not
  open — no plan is one, the grid is not offered. Other plans untouched: saddlebag, porch, shed room, cabins, jacal.
- **Tests.** New `tests/house-passage.test.mjs` (4): 12 ft on the server and in the catalogue, pens 12 ft apart, footprint 7.5 ×
  2 at every turn, roof 6/6, half-cell placement; nothing else moved; an old-save round trip through `writeSave`/`readSave`
  with an 8-ft dog-run being raised and one finished — invalid without the door, opens at 12 ft with every stage kept and is
  drawn at every turn exactly as a dog-run planned today; free-plot widening east/west/neither. Changed:
  `tests/house-connected.test.mjs` (b) (`BETWEEN`: dog-run gables 1.5 cells apart, saddlebag 1), `tests/house-turn.test.mjs`
  (pens 28/16 depths apart), `tests/house-spacing.test.mjs` (`CLEAR`, `CLEAR_NORTH` at the new reach),
  `scripts/house-spacing-injections.mjs` (swap string). **Injections**, full `npm test` each, file restored: `PASSAGE_FEET` 8 —
  exactly 5 fail: the 12-ft, old-save and free-plot tests of house-passage, the dog-run's connected (b) and turn's dog-run
  test (the "nothing else moved" test, the saddlebag's (b) and every other test pass); the save door not widening — only the old-save test. `npm test`: **1081 pass**
  (1077 + 4). `scripts/house-spacing-injections.mjs` PASS 8 of 8.
- **Browser** (same computer only): house-plot and house-plot-regression (8 of 8) PASS; family-panel, panels (10 checks, 2
  sizes), lesson (33) and host-view PASS. `node --check` on an .mjs copy of `public/house-plot.js`.

## One building: a two-pen house along one ridge — 2026-09-24 (after v2026.09.24.1; not yet committed or released)

Owner: *"the angle of the houses makes it so they don't seem to be connected single buildings. fix this."* The page stood a
dog-run's or saddlebag's two pens where their cells are, side by side along the house's long side; the house-modules sheet
draws a pen corner-on with its ridge on a diagonal, so the two ridges ran side by side — at 0°/180°, each pen mirrored for
its own chimney (`mirrorPens`, the entry below), a V — with grass between, and the passage a small roof on four posts of
its own. Client drawing plus the spacing reach; no projection field, command, plan, footprint, cell or save version.

- **Art checked first.** houses-settling has a whole dog-run in all four stages, one roof over both pens and the passage —
  but front-on, its long side across the screen, at a single cabin's width, chimneys and passage roof drawn in from the
  roofing stage whatever is built, and no end-on view for 90°/270°; no saddlebag at all. Not used (it would mix views beside
  corner-on cabins, misstate what is built, and cannot turn). house-modules' `house-passage-roof` is flatter than the pens'
  roofs, nearly square and on posts, and meets neither; nothing spans two pens. So the house is composed from the pieces.
- **What changed** (`public/house-plot.js`). `housePicture` (replaces `mirrorPens`) draws every pen of a house the same way
  round — fewer chimneys on the door's gable, the house's quarter-turn mirroring on a tie; cabins unchanged. `alongRidge`
  stands a row of log pens one behind the other along that picture's ridge: a plan cell is half the pen's depth along the
  ridge line (`RIDGE`, read by eye off the finished roof; the sheet's ridge is steeper than the walls' ground, 0.88 against
  0.72), east up the ridge at 0°/270°, west at 90°/180°, the row's middle where the pens' feet were at the house's middle,
  the pens' ground centred across the screen, drawn far pen → between → near pen. The passage is roofed with the pens' own
  roof seated at its middle, so it runs into both roofs (`stand-in:`, new ART_REQUESTS *one roof over a two-pen house*); its
  floor's back edge is on the far pen's front wall. The double chimney stands at the middle between the far pen's front gable
  and the near pen's back gable (`DOUBLE_TOWARD` gone), `DOUBLE_RISE` high. The chooser draws 5 px lower so the dog-run's far
  roof is not cut off.
- **Each plan now.** Cabins: as before at every turn. Dog-run: one long house, one roof over both pens and the passage, up to
  the right at 0°/180° and to the left at 90°/270° (0° and 180° are one picture, as are 90° and 270°); the passage is the gap
  in the long wall toward the viewer; the far chimney behind the far end; **the near chimney stands on the near end's gable,
  the door's, and covers the door whole** — at every turn now, not only 90°/270°. Saddlebag: two pens on one ridge line joined
  at the double chimney, which rises between the roofs and covers the far pen's door whole at every turn; the near pen's door
  on its outer gable. While the walls go up the two pens stand on the same line, end chimneys at their ends. The joins show
  the roof pictures' end poles (the stand-in's cost). **No conflict remains** under "covers the whole door".
- **Spacing changed.** The pictures run on the art's diagonal while the ground stays the cells: at 0°/180° the far roof rises
  1.47 cells above the back wall and the near pen's foot stands 0.77 below the front one (in front of the preview's
  outline); at 90°/270° the house reaches 1.25 either side. **`PICTURE_REACH` `{ up: 1, side: 0.9, down: 0.2 }` → `{ up: 1.5,
  side: 1.3, down: 0.8 }`**: two houses side by side are held 0.8 cell (about 119 ft of the map) further apart, one north of
  another 1.1 cells (about 164 ft) further — every plan, the reach being one for all (`ceiling:`; a reach per plan is the
  way out if a class finds houses held too far apart). 1.5 × `CELL_MILES` = 0.042 mi, inside `SITE_MARGIN` 0.05.
- **Tests.** New `tests/house-connected.test.mjs` (7): for dog-run and saddlebag, in the chooser, at the site, placed and
  previewed at every turn and three zooms, pens at stages 1, 5, 12, 13 — (a) both pens the same way round, the far ridge on
  the near ridge's line within 5 frame px and carried on beyond it; (b) facing gables one plan cell apart and every picture
  between touching both pens; (c) the passage roof on that line, overlapping both ridges; (d) far pen, between, near pen.
  Ridges and corner posts read by eye in the test. Changed where the expectation moved: `tests/house-chimney.test.mjs`
  (`ROW_GABLE` for two-pen houses; the double chimney at the middle between the facing gables; `towardViewer` counts the near
  end's side gable), `tests/house-turn.test.mjs` (`mirroredAt` the house's for two-pen houses; their feet checked against the
  claim, not the footprint; the dog-run test now "runs along its ridge"; the site test now "upright and unmirrored"),
  `tests/house-roof.test.mjs` (the passage roof, drawn after its floor, is not paired with a pen), `tests/house-spacing.test.mjs`
  (`CLEAR`, `CLEAR_NORTH` at the new reach), `scripts/house-spacing-injections.mjs` (its reach swap string).
  **Injections** (`inject.mjs` in the scratchpad, whole house suite, file restored each time): each pen chosen alone again —
  the (a), (b) and passage tests fail plus 10 changed older ones; pieces left where their cells are — all 7 new tests plus 2
  older ones; the sheet's four-post passage roof back — only the passage test; the passage drawn last — the (d) test plus 5
  older back-to-front ones; the pens 1.4 × as far apart — (b), the passage test and 7 older ones. `npm test`: 1077 pass (1070 + 7). `scripts/house-spacing-injections.mjs`: PASS, 8 of 8 at the new reach.
- **Browser.** `scripts/house-plot-browser-proof.mjs` PASS (the chooser's dog-run and saddlebag drawn whole, `test-results/house-plans.png`); house-plot-regression PASS (8 of 8); family-panel, panels, lesson and host-view PASS; travel-drawn failed once on its walk-in timing ("they walk in view … again at the end", nothing of the house drawing) and passed on a lone rerun. `node --check` on an .mjs copy of `public/house-plot.js`. Same computer only.
- **Montages** (session scratchpad): `connected-before.png`, `connected-after.png` — every plan at 0/90/180/270, finished
  and with the walls up to course 7 (the jacal with its thatch going on). Looked at closely: each dog-run and saddlebag reads
  as one building; no chimney leaves part of a door showing.
- **Decided since.** `HIST-GONZ-025` gives a dog-run's passage as ten or fifteen feet; the plan's was one eight-foot cell.
  The owner chose twelve the same day: *The dog-run's passage is twelve feet*, above.

## No chimney in front of a door — 2026-09-24 (after v2026.09.24.1; not yet committed or released)

Owner: *"fix the chimney standing in front of the door."* Since the chimney fix below, a chimney stands against its gable
wall — and the house-modules sheet has one corner-on pen, its door in the left-front gable, so wherever the chimney's gable
was that face the chimney covered the door: the cabins at 90° and 180°, the dog-run's west pen at 0° and 270° and its east
pen at 90° and 180°. Client only: no projection field, command, plan, footprint, tap box, spacing number or save version.

- **Art checked first, none usable.** No sheet has a corner-on pen without its door, with the door on another face, or a
  door drawn apart from its wall: house-modules' walls and low walls both have it in the left-front gable (the sill has no
  walls); houses-settling, buildings and architecture-extra are front-on whole houses with their own chimneys.
- **What changed.** `mirrorPens` in `public/house-plot.js` chooses each log pen's picture for its chimney. In either
  picture the gable toward the viewer has the door and the one behind the walls has none, so a chimney whose gable is to the
  screen's right stands against the unmirrored pen's right-back gable and one to the left against the mirrored pen's
  left-back; a gable away from the viewer is behind the walls of either, and the pen keeps the house's mirroring. Walls and
  roof are drawn with the pen's `flip`; everything else with the house's. The saddlebag's double chimney, between two back
  gables at 0°/180°, is drawn before both pens and `CHIMNEY_HIGH` high (at `DOUBLE_RISE` it stood 0.18 of a cell above
  `PICTURE_REACH.up`).
- **Each plan now.** Cabins: 0° as before; 180° mirrored, chimney behind to the left, door right-front (the same picture
  as 270°); 270° as before; **90° still in front of the door, hiding it whole**. Dog-run: 0° and 180° two mirror-image pens, each door on
  the gable toward the passage and each chimney behind its outer end; 90° and 270° the far pen as before (chimney behind,
  door toward the passage), **the near pen's chimney still in front of its door, hiding it whole**. Saddlebag: 0° and 180° two mirror-image
  pens, doors on the outer gables, the double chimney behind between their back gables, the eaves over its sides; **90° and
  270° it stands in front of the far pen's door, hiding it whole** (follow-up below). Montages: `door-before.png` / `door-after.png` (session
  scratchpad, every plan at 0/90/180/270).
- **Stopped, not guessed: a chimney whose gable faces the viewer.** Both pictures show the door in the gable toward the
  viewer, so there is no picture for it. Standing it on the back gable puts it on the far side of the pen from its cell;
  on the long wall under the eaves contradicts `HIST-GONZ-025` ("centred in one gable wall") and covers the window. It
  stays in front of the door, covering it whole, `stand-in:` for *the house from its other sides* (ART_REQUESTS.md, now asking for the back
  gable without its door **or** a pen with its door on its long side).
- **Cost (`ceiling:`).** A mirrored pen lays its ridge on the other diagonal, so at 0°/180° a two-pen house's ridges form
  a V instead of one line, and a cabin at 180° is its 270° picture. A pen's ground is square and the picture 45° off either
  axis, so no footprint moved; **`PICTURE_REACH` unchanged** and server spacing as it was (`tests/house-spacing.test.mjs`).
- **History.** Nothing registered says which way a dog-run pen's door faced: `HIST-GONZ-035` (Smithwick) gives Austin's
  house a passage, a porch on the front and "chimney at each end"; `HIST-GONZ-025` two pens under one roof. Doors on the
  passage are what the one picture allows, not a claim (the houses-settling dog-run has them on the front long wall).
- **Tests.** New in `tests/house-chimney.test.mjs`: *no {plan} chimney is drawn over a door* (4 tests) — every plan at every
  turn, chooser (65 high at the site), site, placed at three zooms and as preview, roofing and finished; the door read by eye
  off the sheet (`DOOR`) mapped through each pen's drawn transform; a chimney drawn after a pen must not overlap it,
  except exactly the chimneys whose gable the plan turns toward the viewer. Changed where the expectation legitimately
  moved: `GABLE` table (east at 180° and west at 0° are now left-back), the double chimney at 0°/180° behind both pens and
  touching their walls or roofs; `tests/house-turn.test.mjs` `mirroredAt` (the pen with its chimney on its left mirrored at
  0°/180°), the site test and the dog-run ends test reading each pen's own mirroring. **Injection:** every pen back on the
  house's mirroring — against HEAD's turn and chimney tests all 28 pass, and the new door tests fail for round-log, hewn-log
  and dog-run (saddlebag passes: its old chimney stood beyond the end of the east pen's door gable, not over the door; only
  the `GABLE` model caught it); against today's files, those 3 plus the 4 `GABLE` tests and 7 turn tests fail. The double
  chimney at `DOUBLE_RISE` behind both pens: only the spacing test fails. `npm test`: 1070 pass.
- **Follow-up the same day: the saddlebag at 90°/270°, and "covers the whole door".** The coordinator, on the stand-in
  montage: the cabins at 90° and the dog-run's near pen read correctly, the chimney hiding the door gable so it reads as the
  chimney's end; the saddlebag was wrong — its flat rectangle was narrower than the far pen's door, which showed either side.
  Now the double chimney is drawn with the single chimney's picture (`house-chimney-stick`, `stand-in:` for its own
  two-sided picture, ART_REQUESTS request 2026-09-15; the rectangle stays as the fallback with no sheet). 0°/180° unchanged:
  at the middle between the two back gables, behind both pens, `CHIMNEY_HIGH`. 90°/270°: in line with the far pen's gable
  toward the viewer, where a single chimney would stand, brought `DOUBLE_TOWARD` (0.8 of a cell) down the screen so its foot
  is behind the near pen's roof, and `DOUBLE_RISE` 2.35 → 2.7 so it is wide enough at the door's top to hide it (along the
  gable's own depth it left the house's ground before it reached the near pen; at 2.35 the door's top corner showed).
  `ceiling:` both tuned by eye. **`PICTURE_REACH` unchanged**, spacing tests pass. The door test now asserts, for a
  chimney against a gable toward the viewer, that the chimney's outline (read by eye off the three chimney pictures,
  `OUTLINE`) contains all four corners of the door (`DOOR`, now a four-cornered opening following the face's slope, not
  a box); every other chimney drawn after a pen must not overlap its door. The saddlebag's 90°/270° position test is now
  "between the far pen's front gable and the near pen's back gable, in line with the far one". Test first: against the
  rectangle, the saddlebag door test and position test fail. Injections: single chimneys drawn at 0.8 of their height —
  exactly the round-log, hewn-log and dog-run door tests fail; the double at 90°/270° drawn at `CHIMNEY_HIGH` — only the
  saddlebag door test fails; the double back at the old middle — the saddlebag door and position tests fail. Montage
  `door-after.png` redrawn (scratchpad) and looked at: no chimney leaves part of a door showing, every chimney touches its
  house.
- **Browser.** `scripts/house-plot-browser-proof.mjs` now expects the round-log's pen mirrored at 180° and checks, in one
  frame's drawing, that no chimney drawn after the walls covers their door — only at 90° does it (`chimneyOverDoor` in
  [evidence](docs/evidence/house-plot-browser.json)); the chimney moved onto the door gable at 0°/180° with mirroring kept
  made it fail at 0°. PASS; house-plot-regression PASS (8 of 8); family-panel, panels, lesson, travel-drawn and host-view
  proofs PASS. Same computer only.

## Everybody drawn as who they are — 2026-09-24 (after v2026.09.23.3; not yet committed or released)

The bug the host-view note below had seen: on the Host's map the far family `hh-9` (nobody's) had *Antonia*, its mother, drawn
as an old man and *Jonas*, its son, as a woman. Same computer only.

- **Cause.** A household nobody joins keeps the founding four (docs/FAMILY_CREATION.md §2): a `kin.role`, no `sex`, no `age`.
  All three projections — a student's own family (`projectWorld`), somebody met (`observedBy`), the Host's map
  (`overviewEntity`) — sent only the stated `sex`/`age`, so the page's `castVariant` fell to its hash of the id, whose pool is
  `teal` (a woman), `elder` (a man) and `blue` (a boy): `hh-9-elena` hashed to `elder`, `hh-9-mateo` to `teal`. Not the Host
  projection omitting a field the others had, and not the student's own family (always rolled, except a class saved before
  rolling, which had the same bug); **any student meeting a founding family saw it too.** Every town's keeper (43 in the Host proof's class)
  had no `sex` either and fell to the same hash: Adelaide Vance and Lucía Benavides were `elder`, Hiram Stovall `teal`,
  grown keepers the boy `blue`.
- **Fix, at the root, server side.** `seenAs` in `sim/town.mjs` is the one glance every projection now sends (`sex`, `band`,
  nothing else — `traits` are never read): `sexOf` in `sim/family.mjs` (stated sex, else the role: father/son a man,
  mother/daughter a woman — read from the role the world authored, as sim/appearance.mjs, alamo.mjs and winter.mjs already
  did, never a name), `bandOf` (the age's band, else a founding parent `adult` and a founding son or daughter `youth`,
  `ceiling:` beside it), and for a townsperson the sex authored with their name: `sex` on `RESIDENTS` and `CARPENTERS`,
  `STOREKEEPERS`' own `pronoun`, `KEPT_BY_WOMEN` in `sim/shops.mjs`, set on each keeper when made and found by id
  (`townsfolkSex`) for a class saved before. **No save version moved**; the Host is shown nothing it was not allowed (a sex
  and a band were already on its wire for rolled people; roles were already on its class panel).
- **One chooser.** `figureOf` in `public/motion.js` (child's figure if the children's sheets draw them, else `castVariant`).
  Where a person is drawn: the map, student and Host (`entityClip` → `miniPerson`); on the horse and driving the wagon
  (`seatedClip` → `seatFigure`, now `figureOf`); the family panel's portrait (`renderFamilyPanel`, which had its own
  `childFigure || castVariant`, now `figureOf`). Travel is the same map path; the rider/conversation poses are
  `entityClip`'s; the card and the Host's panels draw no figure; the looks portraits (`public/looks-art.js`) read the family
  book's `sex`, which already came from the role and now from `sexOf`. The id hash is left only for something sent with no
  sex (a beast; a rider is the courier sheet). **No stand-ins added**: every sex and band has its figure.
- **Tests.** `tests/figures-match-people.test.mjs` (3): across seeds until every face of the die, a lone father and a lone
  mother were rolled, plus two parents alone and four founding households a class — every person in every family's own
  view, in every yard and town a student walks into and on the Host's map is drawn (figure and actual map clip) as their own
  sex and band against a truth written by hand (figures from the art notes, keepers' women by name, bands from the ages);
  hh-9's Antonia a woman and Jonas an adolescent boy in the Host proof's own class; every keeper on the real land; a class
  saved with no keeper's `sex` draws the same; and no page file but `motion.js` picks a figure. **Injections:** projections
  back to the stated fields only — exactly the first two fail (*"hh-9's own map: Charity (hh-9-elena, female adult, mother)
  is drawn as elder"*, *"Antonia, the mother, is drawn as elder"*), 1064 pass; the saved-class fallback removed — only the
  second fails (*"Hiram Stovall is drawn differently in a class saved before"*); the portrait back to its own
  `childFigure || castVariant` — only the third fails, 1065 pass. `tests/motion-binding.test.mjs` comment updated;
  `scripts/hunt-browser-proof.mjs` asks `figureOf` for the hunter (the founding son, `blue` — the same figure the hash had
  happened to give him), `scripts/riding-browser-proof.mjs` comment.
- **Checked.** `npm test` **1066**, 0 failed. `node --check` on `.mjs` copies of `public/app.js`, `motion.js`,
  `family-panel.js`. Browser: host-view 8 checks, family-panel 17, panels 10, lesson 33, travel-drawn 17, house-plot, hunt 15,
  riding 16, shops 6, furniture 5 pass; evidence refreshed from those runs. **Looked at:**
  [host-view-person.png](docs/evidence/host-view-person.png) — Antonia a woman in a skirt with her card open, Jonas a boy
  resting, Lavinia a girl — and [host-view-farm.png](docs/evidence/host-view-farm.png), Thomas a man in the field.
- **Changes in how some people look**, all now right: a founding daughter who was drawn as a grown woman (`hh-1-rosa`,
  `teal`) is `blue-girl`, a founding son or daughter is drawn at an adolescent's 0.9, and a founding mother may be `indigo`
  as well as `teal`.

## The last two failing proofs — 2026-09-24 (after v2026.09.23.3; not yet committed or released)

Both were the proof, not the game: no file under `public/`, `sim/` or `server/` changed, so no unit test was added and no
`.mjs` copy needed checking. Same computer only.

- **`npm run test:farm` — flaky, 6 of 10 passing before (4 of 6 more with a debug capture); 10 of 10 after.** Its ground audit (`window.__groundAudit`,
  `auditGround` in `public/app.js`) redraws the kept ground aside and compares pixels. The failures were always the same:
  tick 1, minute 20, 3.1% of the screen, the whole screen's box. The two pictures saved at a miss show every tree and tuft
  a shade softer in the kept ground than in the fresh one, at the same places (shifted by no whole pixel); a log of both
  drawings showed **the same 834 `drawImage` calls, the same sheets, transforms, alpha, smoothing and quality, call for
  call**. So nothing was stale: Chrome with the graphics card in use did not rasterise the same drawing the same way twice
  (it moves a canvas read back a few times off the card, and a standalone page reproduced a 21.5% difference that way;
  putting both grounds on `willReadFrequently` alone still failed 3 of 10, so it is not only that). Neither a race nor a
  wait: no frame is drawn from an old snapshot. **Changed:** `scripts/farm-browser-proof.mjs` launches Chrome with
  `--disable-accelerated-2d-canvas`, with the finding and a `ceiling:` beside it (a softer tree between two redraws on a
  Chromebook is not caught, and is not a wrong field). **The check is not weakened:** with the plots left out of the
  ground's key (`groundInputs` in `public/map-base.js`) the proof still fails, the clearing drawn stale from tick 12.
- **`npm run test:host-view` — 0 of every run before; 5 of 5 after.** The Host's page is not broken. The proof picked the
  person to click by being in `__drawnAt`, and at the closest zoom this family's three at home were one at the right edge
  (drawn at x 1458 of a 1440 window, so the click landed on nothing) and two under the class panel and the Rumor Mill,
  which since 2026-09-18 (docs/HOST_PAGE.md §2.2) run half the screen's height down the left. **Changed:**
  `scripts/host-view-browser-proof.mjs` clicks one of the family who is drawn inside the window with nothing of the page
  over them (`elementFromPoint` is the map); if none is, the teacher folds the two panels (they are `<details>`), looks
  again, and opens them after the card. Every check is kept, and one is tighter: the card must be the person clicked, not
  only one of the family. Seen to fail: with the Host's card shut in `renderSelection` the proof stops at `#selection`, its
  first three checks passing. Shots looked at: Antonia's read-only card over the farm, the panels open again on
  *Whole class* ([record](docs/evidence/host-view-browser.json)).
- **Checked:** `npm test` **1063**, 0 failed. Browser: farm 10 of 10, host-view 5 of 5, and house-plot, family-panel 17,
  panels 10 at 2 sizes, lesson 33, travel-drawn 17 pass. Evidence refreshed from passing runs only.
- **Noticed then, fixed 2026-09-24 (section above):** on the Host's map the far family's figures did not match their people —
  *Antonia* (`hh-9-elena`) drawn as an old man, *Jonas* as a woman.

## Chimneys against their gable walls — 2026-09-23 (not yet committed or released)

Owner: *"Something looks wrong with the chimneys too. Are they positioned correctly?"* They were not: every chimney was
drawn standing on the ground apart from its house — to the right of a round-log cabin at 0° with grass between, in front
of and below it at 90°, rising alone behind it at 270°, the dog-run's at each end apart from both pens. A Texas log house
had an exterior chimney centred in one gable wall (`HIST-GONZ-025`; the dog-run a chimney at each end, `HIST-GONZ-035`;
the saddlebag a double chimney between its pens, `HIST-TEX-017`). Client and atlas only: no projection field, command,
plan, footprint, spacing number or save version.

- **What was wrong (three causes).** (1) The plan data was right — each chimney's cell is beside its pen's east or west end
  — but the page drew the chimney at the front of that cell, and the sheet draws a pen corner-on, about 2.6 cells wide and
  1.2 deep on the screen, so the cell beside a pen is not where the picture's wall is; nothing measured where the walls meet
  the ground. (2) It was drawn in the order of its cell's front edge, not by which side of the pen its wall is on.
  (3) At 1.55 cells high a chimney against the gable behind the walls is hidden whole under the roof.
- **What changed.** `scripts/build-atlas-manifest.mjs` `groundOf` measures the full walls' three visible corner-post feet
  (`ground` in `atlas.json`; `ceiling:` within about 3% of the frame's width of the feet read by eye). `public/house-plot.js`
  `gableFoot` and `standChimneys` put each chimney's foot at the middle of its gable wall, `CHIMNEY_STANDS_OUT` (0.1) of the
  pen's depth outside it, and draw it before its pen when that gable faces away and after the pen and its roof when it faces
  the viewer. The gables are the sheet's left-front (door) and right-back faces, mirrored at a quarter turn; the east gable
  is right-back at 0°, right-front at 90°, left-front at 180°, left-back at 270° (table in `docs/WOODS_AND_BUILDING.md`
  §6.4). `CHIMNEY_HIGH` 1.55 → 2.1 cells so one behind the walls rises over the ridge. The saddlebag's double chimney
  (`stand-in:` rectangle, 0.6 of a cell wide, `DOUBLE_RISE` 2.35) stands at the middle between the west pen's east gable and
  the east pen's west gable, after the pen in front and before the one behind; at 0°/180° it touches both pictures, at
  90°/270° the pens stand one behind the other with ground between and it rises in front of the far pen, its foot hidden by
  the near one. `stand-in:` at 90°/180°, and on the dog-run's west pen at 0°/270°, a chimney stands in front of a gable the
  sheet has drawn a door in (`docs/ART_REQUESTS.md`, *the house from its other sides*). **Amended 2026-09-24** (*No chimney in front of a door*,
  above): only where the chimney's gable faces the viewer.
- **Kept.** Preview is the built house (one draw); roofs seated; every picture upright, mirrored only at a quarter turn;
  **`PICTURE_REACH` unchanged** — every picture still inside the claim (`tests/house-spacing.test.mjs`), so server spacing
  is as it was; zoom and tap boxes as before (the chimney's drawn box is still noted).
- **Evidence.** `tests/house-chimney.test.mjs` (6 tests): every plan at every turn, in the chooser, at its site and placed
  at three zooms and as its preview, at roofing and finished — each chimney's foot centred on its gable wall within a tenth
  of its length and outside it by at most a fifth of the pen's depth, against the post feet read by eye; drawn behind or in
  front as its wall is; the double chimney within 6% of a pen's width of the middle between its walls, touching both, in
  order; the chimney not moving as the pen goes up. Old placement injected (the `standChimneys` call removed): exactly the 4
  chimney-plan tests fail, the other 1059 pass. Order left as the cells had it: the dog-run test fails. The wrong gable:
  the 4 chimney tests fail (and three turn tests). `tests/house-turn.test.mjs`'s back-to-front foot check now leaves out
  chimneys and its "chimneys at the ends" check measures from each pen's ground middle. Browser:
  `scripts/house-plot-browser-proof.mjs` now also asserts every chimney's foot stands inside a pen's walls picture at each
  turn (`chimneysAgainstTheirPen` in [evidence](docs/evidence/house-plot-browser.json)). `npm test`: 1063 pass.

## Houses apart at every zoom — 2026-09-23 (after v2026.09.23.2; not yet committed or released)

Owner: *"fix the zoom issue"* — zoomed far out, two houses placed as close as allowed were drawn touching or over one
another. The server spaces houses by the ground they are drawn over close in (`CELL_MILES`, section below), and the page
drew a house with the people, whose figure is floored at 7 pixels, so from about 370 pixels a mile out every house grew past
its ground. **The server's rule is unchanged** (widening it would push houses a mile apart); the drawing changed. Client
only: no projection field, command or save version.

- **A family's house is never floored** (`houseScale` in `public/app.js`, on the camera as `camera.house`): drawn
  `CABIN_PEOPLE` people of `PERSON_MILES` high at every zoom — placed house, preview and a house at its site alike — so it
  is never drawn past its ground. People, the camp, log pile, stock and a town's cabins keep their floor.
- **`HOUSE_LEGIBLE` = 16 pixels**, the smallest height at which the cabin reads on the house sheets (looked at from 8 to 23:
  at 12 and under it is a blot). A house reaches it at about **255 pixels a mile**; from there out **the family's houses are
  drawn as one, its home** (the first it finished, else the one being raised), 16 pixels high where it stands, and only it
  answers a tap. The preview is drawn at the same size, so a first house's preview is the home it becomes.
- **Two families zoomed out:** each one-house symbol is 16 pixels whatever the ground, and leagues can lie 0.085 miles apart,
  so two houses built by a shared line could meet below 255. `keptApart` keeps the family's own house and each other
  family's only where it would not be drawn over one already kept (measured as drawn); the name is still drawn. Close in
  none can meet (every house is inside its own land and no bigger than its ground). `ceiling:` first kept first drawn in
  site order on the Host's map; every class laid out so far has sites 2.8 miles or more apart.
- **Looked at, not redesigned:** at 218 pixels a mile a family standing at its 16-pixel home with its oxen and wagon (all
  floored) covers most of it (`test-results/houses-zoom-218.png`); at the colonies map's farthest zoom (3.4) the home of a
  family near Brazoria and Columbia is drawn among those towns' floored cabins (`houses-zoom-3.png`).
- **Evidence:** `tests/house-zoom.test.mjs` 4 tests at 83 zooms from the closest to the farthest on both maps: two houses as
  close as allowed (3 plan pairs × 2 turns × 4 sides) never drawn with overlapping picture boxes; the switch at 16 pixels,
  the home alone, the tap following; preview drawn exactly as the built house; two families' houses 0.185 miles apart kept
  apart. Put back the old floored size and exactly these 4 fail, the other 1053 pass; four more injections (never one house,
  every house when one, families not kept apart, a tap spot for a house not drawn), run against that file, each fail only
  the tests written for them. `tests/support/page-camera.mjs` gives every house-drawing test the page's own `houseScale`.
  `scripts/house-plot-browser-proof.mjs` now zooms the pair out in 35 wheel steps from 2,883 to the country's 3.4 pixels a
  mile: never over one another, both at their ground's size to 255, the home alone past it, a tap spot per house drawn
  ([record](docs/evidence/house-plot-browser.json), montage `test-results/houses-zoom-montage.png`, or `ZOOM_MONTAGE`).
  Design: [WOODS_AND_BUILDING.md §6.5](docs/WOODS_AND_BUILDING.md).
- **Checked:** `npm test` **1057** (1053 + 4). Browser, same computer: house-plot proof passes through the zoom-out;
  house-plot-regression (8 cases), family-panel 17, panels 10 checks at 2 sizes, lesson 33, travel-drawn 17 and
  house-spacing-injections (8 of 8) pass. `npm run test:host-view` fails after its third check, waiting for `#selection`
  when the Host looks at Antonia — and fails identically on a clean export of `49388ff`, so not from this change; open.

## Four stale proofs driven through today's game — 2026-09-23 (after v2026.09.23.2; not yet committed or released)

The four browser and regression proofs that failed on `cf32263` and `c010022` alike. Each failure was read at the step it
failed and checked against the owner-decided docs; **every one was the proof out of date, none was the game broken**, so no
game file changed and no unit test was added. Each proof still proves what it was written to prove, through the current game.

- **`node scripts/house-plot-regression-proof.mjs`** — its *families nobody plays* mutation (`treeless ? 'jacal'` →
  `'round-log'`) left its test passing. On 2026-09-19 (`ced5a9d`, docs/BIOME_GAMEPLAY.md §3.2) that test stopped asserting
  a jacal and began asserting that a family with no timber *fetches its logs*, and says the jacal "is held in
  tests/biome-game.test.mjs". Now each case names the test file that holds it: the jacal mutation runs against that biome
  test, and *families nobody plays* gets the mutation its test does guard (`&& !fetchesLogs(...)` → `&& true`: nobody
  fetches). 8 cases, each failing exactly one selected test; both selected tests pass unmutated
  ([record](docs/evidence/house-plot-regressions.json)).
- **`node scripts/biome-game-browser-proof.mjs`** — the hunt was refused *"Not yet - first, put somebody to work."*: the
  guided start (docs/LESSON.md, 2026-09-21, after the proof was written) puts the hunt ninth. The class now starts `taught`
  (`tests/support/settled.mjs`), as `test:family-commands` does; the lesson's own order is `test:lesson`'s. 6 checks; the
  turkey is drawn as a turkey ([record](docs/evidence/biome-game-browser.json), shots looked at).
- **`node scripts/field-art-browser-proof.mjs`** — pressed a *Roll the die* button and a journal close that the
  family-making walk (public/creation.js, owner 2026-09-17) replaced. Now walks it with `meetFamily`, and asserts the walk
  was shown. The art counts are unchanged: 7 timber stumps, 3 brush piles, none on prairie, no fire
  ([record](docs/evidence/field-art-browser.json)).
- **`npm run test:family-commands`** — two checks read refused icons, which the owner's action-bar rule of 2026-09-22
  (docs/FAMILY_PANEL.md, `8e6ecd5`) stopped drawing. (1) *A stale order refused in words* picked an `aria-disabled` icon;
  the only one left is the glowing *Doing this now.* one, and the check timed out. Now: the person at a chore has **no
  refused order drawn**, and an order drawn open for somebody else, put back on their bar by hand as a lagging tick would
  leave it and pressed, is refused by the server in its words and their work is unchanged. (2) *"the principal … has no
  journey icon"* asked for *Travel to Gonzales* on a principal standing in Gonzales. Now: every journey open to a person
  where they stand (not on the road, not to where they are) is on their bar, the principal's before the star and the
  mother's after; the "moved off the principal's row" check is unchanged. Each new check was seen to fail: the page drawing
  refused icons again stopped the run at (1), with every check before it passing, and *Return home* never offered stopped it
  at (2). The hand-made icon is taken off again after (1), so later shots show the bar as the page drew it. 23 checks
  ([record](docs/evidence/family-commands-browser.json), shots looked at).
- **Checked:** `npm test` **1053**, 0 failed. Browser, same computer only: the four above, and `house-plot-browser-proof`,
  lesson 33, panels 10 at 2 sizes, family-panel 17, travel-drawn 17 pass. **`test:farm` is flaky, and was before this:**
  its ground audit finds the kept ground stale at tick 1, minute 20 (3.1% of the screen) in about half of runs — 3 of 4 at
  a clean `cf32263`, 1 of 4 at `c010022`, with no game file changed; the other runs pass whole. Not fixed here.

## Houses as far apart as they are drawn — 2026-09-23 (after v2026.09.23.1; not yet committed or released)

Owner: *"fix the overlapping houses so spacing matches the drawings."* The house was drawn at the map's symbol size (an
eight-foot cell about 149 feet of the map) and checked by the server in true feet (an 80 × 64 foot envelope), so houses the
server let stand a hundred feet apart were drawn one over the other and a house by a creek was drawn over the water. Now
**one module, `sim/house-footprint.mjs`, holds the size and the footprint for both**: the page imports it (`SIZE.cabin`,
`PERSON_MILES`, `plotCell`, `houseFootprint`, `turned`), and `sim/house-placement.mjs` checks the plan's **drawn** footprint
at its turn — nine points of ground (in the land, set back, dry, not steep), no watercourse within 0.03 miles of any part of
it (exact, `waterNear` in `sim/ground.mjs`), not on the family's field, and **no two houses' claims overlapping**, a claim
being the footprint grown to the ground its pictures stand over (1 cell north for roofs and chimneys, 0.9 either side, 0.2
south). The pictures stay inside the family's own line, so neighbours' houses cannot be drawn over one another. Survey now
refuses ten acres over any house as drawn. The preview predicts the spacing refusal with the same function: over another
house it is tinted red and `#house-placement-note` says *"Leave space between this house and the existing house."* — the
server's words when *Build here* is pressed. Ground refusals still come from the server on *Build here*.

- **Land still big enough:** a round-log cabin is drawn over 3.1 acres (claims 7.8), a dog-run 7.1 (claims 14.3); a labor is
  177 acres, 116 of them set back from its line, and holds a dog-run, two cabins and eight ten-acre plots by the rule. No
  grant sizes changed.
- **Old saves:** no `saveVersion` bump. Houses already placed stand where they were, even overlapping as drawn; nothing
  moves them and validation does not judge spacing. Only a house still to be placed is held to the rule. A house placed
  nowhere is judged where it is drawn, a cell above the site point.
- **Ceilings** (`ceiling:` in `sim/house-footprint.mjs`): exact only from about 370 pixels a mile in, where a person is
  drawn his `PERSON_MILES` (lifted the same day: *Houses apart at every zoom*, above); one conservative `PICTURE_REACH` for every plan and turn, so houses as close as allowed show a
  gap (about a cell more than needed east of a round-log cabin); a house chosen whole claims its plan's pieces.
- **Evidence:** `tests/house-spacing.test.mjs` 9 tests. `node scripts/house-spacing-injections.mjs`: 8 injections (true feet,
  no spacing, pictures not counted, water at nine points only, house on the field, field over a house, overlapping houses
  refused as invalid, preview predicting nothing), each failing exactly its own tests
  ([record](docs/evidence/house-spacing-injections.json)). Against the whole suite (`WIDE=1`, [record](docs/evidence/house-spacing-injections-wide.json)) the
  only others: *no spacing* also fails the old overlap test in `tests/house-plot.test.mjs`, and *the preview predicting
  nothing* fails two server tests that compare the served `app.js` with its file, an artefact of patching the read. `scripts/house-plot-browser-proof.mjs` now also refuses a second
  house over the first (preview tinted, server refuses in the same words), builds one just clear (5 feet of the map clear in
  the rule's terms) and shoots the two (`test-results/houses-closest.png`, or `HOUSES_CLOSEST_SHOT`)
  ([record](docs/evidence/house-plot-browser.json)). Found while extending it: an order the server refuses puts the class
  back from its save text, so a proof holding the world object (`liveWorld`) is holding a stale copy after any refusal; the
  proof now finishes the second house by hand only while its handle is still the class's world. Design and numbers:
  [WOODS_AND_BUILDING.md §6.5](docs/WOODS_AND_BUILDING.md).
- **Checked:** `npm test` **1053** (1044 + 9). Browser, same computer: house-plot proof passes through the second house;
  lesson 33 checks, panels 10 checks at 2 sizes, farm, travel-drawn and relay pass. Four other proofs failed here, and
  failed identically on a clean checkout of `cf32263`, so not from this change; **all four are fixed in the section
  above.**

## Released as v2026.09.25.6 — 2026-09-25

**[v2026.09.25.6](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.25.6)**, from `ad39ee2`: battles on one engine (`sim/battle-stage.mjs`, `public/battle-view.js`) with the Battle of Gonzales rebuilt on it (ranks against loose volunteers, looping fire and drifting smoke, the parley, arrival in time, Watch alert, Host live on the field, the account afterwards), and Gonzales before the fight (`sim/town-scenes.mjs`: 36 dated scenes, the flag, the cannon, the eighteen, clickable cards, walking residents). Verify tree: 1212 tests; battle-gonzales 11, gonzales-town 10, alamo-siege 8. Known: `test:slice` is stale (predates family creation and the Host-live rule) and fails; the later battles are wave 2, building.

## Released as v2026.09.25.5 — 2026-09-25

**[v2026.09.25.5](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.25.5)**, from `05437b8`: the family column is bounded above the measured action bar and scrolls (`columnRoom`, `fitColumn`); owner decisions recorded: the ending counts coin held, autoplay does not repeat clearing or fencing. 1184 tests; panels, family-panel, auto, lesson proofs pass. Known: children's names cut beside the Idle/Auto badges; the meeting panel still overlaps the column at 1024; `test:family-twenty` fails its phone check, as before this change (phones unsupported).

## Released as v2026.09.25.4 — 2026-09-25

**[v2026.09.25.4](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.25.4)**, from `8ebaae2`: autoplay repeats one task and works about the place while it can't (`sim/auto.mjs`, FAMILY_PANEL §16; merged `17f42d1`); starting coin 3-10 on the means die; hard-up families on foot; the carreta made at home (`sim/carreta.mjs`, HIST-TEX-443, FIC-GONZ-398); the horse ridden on family journeys (FIC-GONZ-397). 1181 tests; auto, family-panel, lesson, means, panels, farm proofs pass on the merged tree. Decided by the owner since (2026-09-25): the ending counts coin held (MONEY_AND_GLORY.md); autoplay does not repeat clearing or fencing (FAMILY_PANEL §16). Open for the owner: auto's way of going; the invented coin, odds, pack and carreta numbers; the cart's trip capacity; logs off the land with no vehicle. (The 1024x768 panel overlap with a two-row action bar: fixed since, FAMILY_PANEL §17.)

## Released as v2026.09.25.3 — 2026-09-25

**[v2026.09.25.3](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.25.3)**, from `7d3484d`: the second die rolls a family's means (`sim/means.mjs`, FIC-GONZ-393, HIST-TEX-442): cart / one / two / three wagons; riders and walkers and the family's pace (`sim/company.mjs`, FIC-GONZ-394/395); five days of food at arrival, the rest carried on foot (FIC-GONZ-396); Astra's farm-plot art (`8f6f7fc`, docs/FIELD_ART.md). 1161 tests; means, creation, lesson, wagons, errand, going, family-panel, panels, travel, farm, host-view, scrape, field-surface proofs pass. Open for the owner: coin by band and how the ending counts it (MONEY_AND_GLORY.md); a family on foot with no vehicle; the band odds and seats; the horse ridden on family journeys. `test:road` times out on its second check; it did so before this change too.

## Released as v2026.09.25.2 — 2026-09-25

**[v2026.09.25.2](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.25.2)**, from `48c8cf4`: one-way journeys skip the chooser; wagons by family size in new classes (one per eight people, FIC-GONZ-391, research HIST-TEX-441); counted wagons held one per use; the wheelwright's wagon at 100 reales with an ox on the same list (FIC-GONZ-392). 1148 tests; errand, going, wagons, shops, family-commands, family-panel, panels, lesson, riding, travel, farm, host-view proofs pass. Open for the owner: 100 reales is beyond most families; the record ties wagons to wealth, not size; one ox stands for a team; "Put the wagon in good order" covers all wagons.

## Released as v2026.09.25.1 — 2026-09-25

**[v2026.09.25.1](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.25.1)**, from `5435889`: every journey asks how they'll go (`sim/going.mjs`, `public/going.js`); flooded rivers follow the curve and read as water, lanes ford creeks (merge `67bd422`); the stock pens sell horses, oxen, cattle and hogs (`sim/beasts.mjs`, HIST-TEX-440); automatic families replace a lost rifle. 1138 tests. Open for the owner: one-way journeys still show the chooser; auto takes the quickest way, not the student's last; the hog is cheaper than a rifle; stock pens only in new classes; animals payable in kind; a second wagon; automatic families buy only rifles. `travel-drawn` flakes on short roads from Gonzales, and did so before this change as well.

## Released as v2026.09.24.5 — 2026-09-24

**[v2026.09.24.5](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.24.5)**, from `05d5455`: the owner's four errand decisions (`fd13eea`: felling axe held off the land, the rifle goes to war, one rifle kept after a three-period food study, the student may choose a slower way) and counted tools (`sim/tools.mjs`; the gunsmith sells rifles, FIC-GONZ-388; `userOf` holds one copy; a rifle carried to war is lost with the man). 1112 tests; errand, shops, family-commands, family-panel, panels, lesson, riding, farm, host-view, travel proofs pass. Open for the owner: whether men who surrender get their rifles back; automatic families never shop, so a family that loses its rifle at war stays without one.

## Released as v2026.09.24.4 — 2026-09-24

**[v2026.09.24.4](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.24.4)**, from `62a45f2`: the errand popup (`sim/errands.mjs`, `public/errand.js`, `/api/errand`) replaces asking on arrival, which is why seed could not be bought; the server picks the quickest mode that carries the load; `userOf` in `sim/keeping.mjs` holds the wagon, ox, horse and rifle for one person at a time. 1094 tests; errand, shops, family-commands, family-panel, panels, lesson, riding, farm, host-view, travel proofs pass. Open for the owner: docs/TOWNS.md §4b (tools not held; the rifle and the war; one rifle per family; choosing a slower way).

## Released as v2026.09.24.3 — 2026-09-24

**[v2026.09.24.3](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.24.3)**, from `ab16bf8`: the dog-run's passage is 12 ft (owner, 2026-09-24; HIST-GONZ-025), pieces placed to the half cell, `PASSAGE_FEET` in `sim/houseplot.mjs`; old saves widened in place by `widenPassages`; `PICTURE_REACH` {1.6, 1.4, 0.9}. 1081 tests; house-plot, house-plot-regression, family-panel, panels, lesson, host-view proofs pass.

## Released as v2026.09.24.2 — 2026-09-24

**[v2026.09.24.2](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.24.2)**, from `f5174d7`: no chimney leaves a door showing (`4bf5ee4`; saddlebag chimney is the stick-and-mud picture, `stand-in:`); dog-run and saddlebag drawn as one building on one ridge (`housePicture`, `alongRidge`, passage roofed with the pens' roof, `stand-in:`); `PICTURE_REACH` grew to {up 1.5, side 1.3, down 0.8}, so houses are held ~120–160 ft further apart. 1077 tests. (The dog-run passage's width, left open here, was decided the same day: twelve feet, *The dog-run's passage is twelve feet*, above.)

## Released as v2026.09.24.1 — 2026-09-24

**[v2026.09.24.1](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.24.1)**, from `4b7b8f1`: every person drawn as their own sex and age band (`seenAs` in `sim/town.mjs`, one chooser `figureOf` in `public/motion.js`), including default families and town keepers; the farm and host-view proofs pass again (`1f01f9a`, proof-only). 1066 tests; host-view, family-panel, panels, lesson, travel-drawn, house-plot, hunt, riding, shops, furniture proofs pass.

## Released as v2026.09.23.3 — 2026-09-23

**[v2026.09.23.3](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.23.3)**, from `22b1f03`: chimneys stand against their gable wall at every turn (`groundOf`, `standChimneys`, HIST-GONZ-025); houses drawn no bigger than their ground at any zoom, one symbol at the home below 16 px (`houseScale`, `HOUSE_LEGIBLE`); the four stale browser proofs driven through today's game (`49388ff`). 1063 tests; house-plot, house-plot-regression, family-panel, panels, lesson, travel-drawn proofs pass. Known and not from this work: `test:farm` flakes at tick 1, `test:host-view` times out waiting for `#selection` on a clean `49388ff` — **both fixed after this release, and both were the proof, not the game** (*The last two failing proofs*, above): the farm proof's ground audit now runs on processor-drawn canvases, and host-view clicks a person nothing of the page covers.

## Released as v2026.09.23.2 — 2026-09-23

**[v2026.09.23.2](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.23.2)**, from `e1c4a60`: houses are spaced, and kept off water, the land line and fields, by their drawn footprint (`sim/house-footprint.mjs`, shared by server and page); the preview tints red over another house; old saves keep their houses where they stood. 1053 tests; house-plot proof covers a refused and an accepted second house. Four proofs were already failing before this change, on a clean `cf32263` too (`house-plot-regression-proof`, `biome-game-browser-proof`, `family-commands-browser-proof`, `field-art-browser-proof`); all four were stale, not the game, and are fixed after this release (*Four stale proofs*, above).

## Released as v2026.09.23.1 — 2026-09-23

**[v2026.09.23.1](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.23.1)**, from `c3b5ddb`: "Build here" builds again (the house command's id carried a `.` from `Math.random()` and failed the server's `^[\w-]{8,80}$`); preview and built house at symbol size (`cabinSize`); roof seated on the walls from measured seat points; turned houses stay upright, mirrored at quarter turns (`stand-in:`, art requested); tapping a placed house opens it where drawn. 1044 tests; house-plot browser proof rewritten through placement.

## Released as v2026.09.22.6 — action bar update

The selected person's bar now renders only actions currently allowed by the server and guided lesson; an active task remains visible as status. Available actions use a compact grid of at most two rows with no horizontal scrolling on the supported desktop layout. The action names remain inside their buttons. When nothing is available, the bar shows the server's reason where possible. Keep this behavior when adding new orders: `panelActions` still returns the full action set for game logic, while `public/app.js` filters only its presentation. The lesson and family-panel browser proofs cover the revised behavior. The merged simulation suite passed all 992 tests. The panel proof is scoped to 1366×768 and 1024×768, the supported desktop sizes; phones remain unsupported by the owner's explicit decision.

## Released as v2026.09.22.5 — 2026-09-22

**[v2026.09.22.5](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.22.5)**, from `f71f5a8`: people walk at the pace of what they are on, fade out off their own land, cross unseen and fade back in for the last hundred yards, arriving when the server says. The traveller’s marker is gone. 992 tests; travel-drawn 17, alamo-siege 8, panels 15, family-panel 17, lesson 33. Open for the owner: whether a horse or wagon may be hurried on the family’s own land (built as: nobody is).

## Released as v2026.09.22.4 — 2026-09-22

**[v2026.09.22.4](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.22.4)**, from `410c98f`: Astra’s house placement, second houses and frontier art; the Resume tutorial button; food by age and twins; Travis’s runner, the Alamo’s fates by role and the 90-second decision budget; and the start-up fix below, without which the Host page froze and a reloading student was sent back to the join form. 986 tests; alamo-siege 8, panels 15, family-panel 17, lesson 33, family-twenty 9.

**Astra’s draft release v2026.09.22.3 carries that start-up fault and was never published.** It is the owner’s to delete.

## Nobody is seen moving unnaturally: walk, fade, cross, fade, walk — 2026-09-22 (released in v2026.09.22.5)

Read [MAP_ACCURACY.md](docs/MAP_ACCURACY.md) §12a first, and §14.7 of [FAMILY_PANEL.md](docs/FAMILY_PANEL.md) for the word on
the panel. **Presentation only.** The server still owns every journey, every pace (`sim/travel.mjs`) and every arrival
minute; nothing is stored, `saveVersion` did not move, and a class saved before today opens unchanged.

The owner, verbatim, after playing the day the travel marker shipped:

> "characters are still seen zipping around. i don't want to see icons. i want to see them walk at a normal pace, then
> when they've walked a ways (say if they're going somewhere that isn't their farm) they should fade out. then after they
> travel extra fast, they fade back in after arriving close enough to when normally the rest of the way. that way they
> arrive at the correct time, but no one sees them move unnaturally. their icon should say 'Travelling' next to it."

Asked by multiple choice, they chose **"A short fixed stretch"** of normal walking before the fade (about a hundred yards,
the same everywhere); **"The road only"** while away (no figure and no marker, but a faint line showing the road they are
on); and **"Everyone on the map"** (your family, other families, riders, couriers and armies alike). Then, the same day:

> "this shouldn't be a thing on their land. everyone should move at normal speed at all times (unless on horseback or
> wagon) on their land."

What was built:

- **A pace nobody exceeds** (`GAIT_CEILING`, `public/motion.js`). A figure is never drawn crossing more ground than its own
  travel cycle covers at the rate it was drawn: 1.2 of its **own drawn height** a real second, which is the marker's old
  threshold kept and renamed. Counted in the figure's own height it is already the pace of what they are on — a rider and
  horse are drawn 1.8 of a person (`MOUNTED_HEIGHT`) and may cross 1.8 times the ground, a driver the wagon's — which is
  the owner's "unless on horseback or wagon" with no second number.
- **The schedule** (`travelSight`, asked once a frame by `sightOf` in `public/app.js`). Below the gait nothing happens and
  the journey is drawn exactly where the server has it. Above it: the family's own land and a hundred yards past it walked
  at the gait; a 700 ms fade out; the middle crossed with nobody watching at whatever speed the arrival needs; a fade back
  in a hundred yards short of the end (or short of their own land, whichever comes first); the rest walked at the gait.
  Everything is a function of the server's own progress and it maps the journey's end to the journey's end, so **the drawn
  arrival is the server's arrival** and nothing else could make it not be.
- **The family's own land, by the land and not by a distance** (`landRuns`, read from the grant bounds the server already
  sends). The road inside the family's own grant is walked in view however long it is; the fade may begin only off it, and
  the fade-in is finished before the line coming home. A journey that never leaves their land is never faded at all.
- **And an order for spending the road when it will not pay for everything: the land first, and in full.** A journey has
  only its `rate` of length to spend on being watched, and walking half a mile of farm at a walk costs thirteen real
  seconds. The owner's correction is absolute, so the land comes first; the hundred yards off it are a target and not a
  promise, and shorten to nothing rather than start a fade a foot inside the line. Where the road cannot pay even for the
  land there is no fade at all and the whole journey is drawn where the server has it, in view. In the farming day there
  is room for the land *and* the hundred yards from about two and a half miles up.
- **The road, and nothing else, while they are away** (`drawTravelRoads`). The road still ahead as the same faint dotted
  line the marker drew, coming up as the figure goes. No disc, no pin, no portrait, no destination ring.
- **The marker deleted**, with `MarkerFade`, `wantsMarker`, `MARKER_ABOVE`/`_BELOW`, `drawTravelMarkers`, its stand-in row
  and its request (now *WITHDRAWN 2026-09-22* in [ART_REQUESTS.md](docs/ART_REQUESTS.md)). Astra's delivered
  `travel-markers.png` stays in the library, registered and unused. The one rule it proved is kept and said in code: **the
  road behind a traveller is not drawn** — the road itself is already on the ground, and two lines is two things to read
  on a small screen.
- **Travelling on the panel** (`travellingLine`, `.panel-travelling`). While the server has somebody on a journey their row
  says **Travelling**, where §14.1 puts a line and by §14.1's rule; beside the icons when the bar still has open ones (a
  person walking out to a chore can be called off while they walk), in place of them when it does not. Somebody carried out
  of sight (`travel.away`, §12) keeps the server's fuller sentence — where they went, how far off, when they are back.
- **Everyone on the map**: other families' people, riders, couriers and the Host's whole class go through the same
  schedule. Only the student's own grant counts as own land; an observed person and the Host are given none.

**Evidence.** `tests/travel-drawn.test.mjs` (13, replacing `tests/travel-marker.test.mjs`) and one new case in
`tests/family-panel.test.mjs`. **Every one was made to fail first**: `node scripts/travel-drawn-injections.mjs`,
**23 of 23 caught** — 17 unit injections and, with `PROOF_BROWSER=1`, 6 that only a real browser can answer
([record](docs/evidence/travel-drawn-injections.json)).

**Two of them missed on the first attempt, and both times the test was wrong, not the code.** The pop-guard test stated
its numbers *against* `FADE_RATE`, so it moved with whatever it was guarding; it now holds the eased jump to at least
250 ms and at least twelve painted frames, absolutely. And the browser proof read the page's own **schedule** rather than
where the figure was **painted**, so drawing it at the server's place instead of the scheduled one passed every check in
the file; the page now publishes the point it really put the figure at beside the one the schedule asked for, and the
injection lands 22,662 px off.

**The browser proof found a real bug the unit tests could not**, and it is kept as an injection: the grant the server
sends is `{ kind, acres, bounds }`, and read a level too high it is never a rectangle, so **no road was ever on the
family's own land** and every fade began a hundred yards from the house. Nothing threw and every unit test passed. The
proof now reads the schedule's own walked lead off the page and fails unless it is well past a hundred yards.

`npm run test:travel-drawn` (replacing `test:travel-marker`, [record](docs/evidence/travel-drawn.json),
[screenshots](docs/evidence/travel-drawn/)) plays a Solo game on the real land, sends the main person to Gonzales on foot
and reads **every painted frame** of the whole journey — seventeen checks. On the run recorded, a road of 115.9 miles:
the server would carry them 157.9 of their own heights a second pressed close in and they are drawn at **1.209**, the
gait, measured frame to frame from where they were actually drawn over 487 pairs of frames at one camera; painted where
the schedule walked them and not where the server has them, the farthest 0 px off over 2,102 frames; a walked lead of
0.453 miles, which is 0.396 of their own land and then the hundred yards off it; 2,927 frames with nothing of them on the
map and the road drawn on every one of them; 126 frames part drawn and no frame changing by more than 0.14, so it fades
rather than blinking; no marker on any frame and no marker hook in the page; back and walking for the last 1,827 frames;
**not one frame drawn at Gonzales before the server put them there**, and the walk in finished inside the tick the server
called the arrival. `docs/evidence/travel-drawn/road-only.png` is the owner's "the road only": a dotted line across the
timber, nobody on it, and *Travelling* in the bar.

**A Solo game deals a new world every run**, so this family's road to Gonzales has been anywhere from five to two hundred
miles. The proof plays a long road at the quick pace and a short one at the Study pace a class really uses, so the
schedule fades either way, and it says plainly when a family is dealt too near Gonzales to have a road at all. Run four
times over in a row without a change, after two flakes that were the proof's own and are now written into it.

**Two measuring traps, written down so nobody pays for them twice.** First, the map is not redrawn on every animation
frame, so two samples 27 ms apart can hold 66 ms of drawn movement; timed by the sampler's own clock a figure walking at
1.2 reads as 4.4. The proof times the measurement by the **renderer's** clock (`frameMs`, the moment `drawWorld` ran).
Second, a frame on which the schedule itself moved - a zoom, the teacher changing the class pace, the calendar turning over
to longer ticks - is not a speed and not a fade: the page snaps the figure to the schedule on exactly those frames rather
than easing a half-drawn figure across a leap (`leapt` in `sightOf`, which the page publishes for this), so both the speed
and the fade measurements leave them out and say how many there were.

`npm test` 992, and `test:panels`, `test:family-panel`, `test:lesson`, `test:alamo-siege` and `test:travel-sight` — the
Alamo one watches a runner walk across the compound step by step and would notice a pace change. Same computer, headless
Chrome: nothing here is a Chromebook, a classroom projector or a physical LAN.

**One thing the owner may want to change, and one price it costs.**

1. **"(unless on horseback or wagon)" was read as the narrower of its two readings.** It is built as *the pace you hold
   somebody to on their own land is the pace of what they are on* — so a rider crosses their own farm at a horse's gait and
   a walker at a walk, and **nothing on their own land is ever sped up or faded, on foot or otherwise**. The other reading
   is *a horse or wagon on their own land may still be sped up and faded*. It is marked `ceiling:` in
   [MAP_ACCURACY.md](docs/MAP_ACCURACY.md) §12a.3 and is a question for the owner.
2. **The price, and it is not a choice: a journey whose own-land stretches the road cannot pay for is drawn at the server's
   pace, in view, from end to end.** That is one rule covering two cases — a crossing of the farm itself, and a short
   errand at a hurried class pace that begins at the house, where walking the farm at a walk would cost more real time
   than the whole journey has. Either can still outrun the gait, and nothing else is possible at once: **on their own land
   nobody may be faded**, and the arrival is the server's. So the land is always shown honestly and a hurried short errand
   is visibly quick. The ways out are the class clock or fading on the farm too, which the owner refused.

   `tests/travel-drawn.test.mjs` pins it: **not one frame of any journey is faded, or part faded, while the figure is still
   on its own land** — swept frame by frame over three class paces, four road lengths and four ways the land can lie under
   a road, the hurried errand included. The ordering this shipped with first, which paid the hundred yards before the
   land, is an injection, and it fails that test alone.

**Two proofs had to be told the new word**, and both were checked to make sure that was all that changed:
`npm run test:family-panel` (the family driving in, in the lobby, is on a journey like any other, so its bar now reads
*Travelling* where it read "… is on the road.") and `npm run test:panel-silence` (the main person sent to Gonzales, the
same line in the same place). §14.2 of [FAMILY_PANEL.md](docs/FAMILY_PANEL.md) is untouched: every line about *why*
somebody may not be given an order is still the server's own, word for word, and every other check in that proof holds it.

**Found, not caused, and not fixed here:** `npm run test:panel-silence` fails one check — *"Paulita Proofwright: the line
is on the screen", a child's too-young line measured outside the 1366x768 screen. It fails identically with the
Travelling line switched off, so it is not this work; its other twenty-odd checks pass.

Also worth knowing: **`scripts/travel-marker-proof.mjs` was already broken on `main` before this work**, and its replacement
fixes the cause. A Solo game's class now has to be started by the student's own *Done packing* (`server/app.mjs`, owner
2026-09-21), and the old proof pressed it only after waiting for the family to reach its land — which never happened,
because the class was still in the lobby. The new proof presses it first.
## Travis's runner, the 90-second budget and the Alamo's fates by role — 2026-09-22 (released in v2026.09.22.4)

Read [ALAMO_FATES.md](docs/ALAMO_FATES.md) (the historical review and what the game allows) and the new last section of
[MILITARY_EXPERIENCE.md](docs/MILITARY_EXPERIENCE.md) first.

**The four owner questions of the military pass below, answered by the owner on 2026-09-22** (verbatim): *"Military: build
the real local Alamo runner encounter next. Give unanswered decisions a configurable 90-second real-time budget, suspended
during Host pause, with a documented fallback. Reconsider eligible volunteers on later courier dates. Replace sex-only
fictional fates with historically reviewed roles, location, choices, and plausible escape/capture outcomes. Preserve smooth
shared-world play and delayed news."*

1. *Next build step?* — The local Alamo runner encounter, now, ahead of Gonzales/core usability for this piece. **Built.**
2. *The 20-minute cap holding the class until the dated deadline?* — A 90-second real-time budget per question. **Built.**
3. *Ask each courier date once, or reconsider?* — Reconsider on later dates. **Built.**
4. *The sex-decided fate?* — Replace with roles, location and choices after historical review. **Reviewed and built.**

What was done:

- **The historical review** ([ALAMO_FATES.md](docs/ALAMO_FATES.md); `HIST-TEX-430` to `-439`). Every fighting man still
  inside at dawn on March 6 died, the few taken alive included; the men who ran over the walls were cut down; the people who
  lived had left before (couriers, men cut off outside, Rose — disputed) or were noncombatants (Dickinson and her daughter,
  the Tejana women and children, Joe), with Guerrero the one fighter who talked his way out. No courier is recorded caught
  leaving. Sources: the TSHA Handbook (entries on the battle, the noncombatants, the Tejanos, Dickinson, Joe, each courier,
  Rose, Crockett, de la Peña, Kimbell), the Alamo's *Joe's Account*, and Stephen L. Hardin's *Lines in the Soil; Lines on the
  Soul* (read in full). The printed books (Todish, Lindley, Hansen, Davis, Crisp, Groneman) were cited through those, not
  opened — say so if anybody asks.
- **Fates by role and place** (`alamoRole`, `stormAlamo`, `tellFall` in `sim/alamo.mjs`; `FIC-GONZ-381`, `-386`). A
  fighter (a man or boy of sixteen and up, sick or well) inside at the assault is killed; a courier chosen and gone lives; every
  woman and child inside is spared and walks home east. A boy under sixteen is no longer killed for being male. No escape
  over the wall, capture or disguise route is offered — the record says they failed or were not a colonist's. Delayed news
  is unchanged: no family sees a fate before its word.
- **Survival opportunities said before they close** (`FIC-GONZ-383`): when the rumour of Santa Anna's march comes, a family
  with somebody in the garrison is told they can still send for them (`warnGarrison`), and the card's recall button says the
  same; on each courier night the runner says a man sent leaves the fort, and on March 3 and 5 that the lines are closing.
- **Travis's runner** (`sim/alamo-runner.mjs`, `FIC-GONZ-380`). The besieged stand on the compound's plaza; on each courier
  day a runner with a stable ID walks from the reconstructed Travis quarters to each played fighter at ninety feet a tick; the
  question opens only when he is beside them; only that family hears him (`kind: 'alamo-runner'` meeting); the answer is said
  aloud and he walks back. The card and the "!" open the meeting, whose two buttons are the existing `alamo-courier` action.
- **Asked again on later dates** (`courierEligible`, `FIC-GONZ-382`): once a day, every day, whatever was said before; never a
  courier gone, the dead or captured, a woman or child, or an auto/absent family (answered at once, no runner).
- **The 90-second budget** (`sim/decision-budget.mjs`, `FIC-GONZ-385`): for the runner, the division, the army's questions
  and Houston's camp. Real milliseconds between the ticks the server runs (`realTimeMeter`, injectable `now`); none while
  paused; kept in the save; `createClassroom({ decisionBudgetMs })` and `DECISION_BUDGET_MS`; "pressing" at two thirds. On
  expiry, auto's answer at the record's share (`FIC-GONZ-048`, `FIC-GONZ-384`) with "Nobody answered for … in time, and it was
  decided for them" in the journal; the question closes, so the class stops being slowed.
- **No save version moved.** `decisionClock`, `courierDay`, `courierOffer`, runner entities and the `coming` state are all
  absent on older classes, which correctly reads as nothing spent, never asked, no runner.

Evidence (same computer, headless Chrome, on this branch): full `npm test` **965 passed, 0 failed** (13 new tests in
`tests/alamo-runner.test.mjs`, 10 in `tests/decision-budget.test.mjs`, one each added to the military pacing and attention
files; two existing Alamo/auto tests changed for the runner's `coming` step); `node scripts/military-regression-check.mjs`
**39 of 39 mutations caught**, each failing exactly its named test in its whole file (26 new; `docs/evidence/military-injections.json`);
`npm run test:alamo-siege` **8 checks** (runner walking in 391 → 301 → 211 → 121 → 31 → 6 ft; the meeting; a 20 s pause
holding a 15 s budget with 5 s spent; the budget running out 14 s after Resume with its journal line; the next day's runner
and an answer given in the meeting; 1366 × 768 layout); `npm run test:panels` **15 checks**; `npm run test:family-panel`
**17 checks**; no page errors. The old phone check in the siege proof was replaced by the Chromebook size (phones are not supported).

**Not proved:** anything on a LAN, a Chromebook device or in a classroom; whether 90 seconds is enough for a real student;
seamless play; the runner's walk looking right at every zoom (only the server positions were measured, and one screenshot
each at 1440 × 950 and 1366 × 768 was taken).

**For the owner to decide or change:**

1. **The fallback when nobody answers the runner.** Built as your standing rule `FIC-GONZ-048` — auto takes over, so about
   one in three silent men offers and may be chosen and live. The review would equally defend **staying at one's post**
   (Travis chose riders from men who offered; leaving would then always be the family's own act). One line in
   `settleUnanswered` changes it. Which?
2. **Noncombatants killed in the storming.** The record has a woman and children killed inside (`HIST-TEX-433`); the game
   spares every woman and child. Keep the simplification?
3. **Sixteen as the line between fighter and child** is the game's age for answering calls, not a recorded rule (boys of
   about sixteen died with the relief; Enrique Esparza, about eight, lived). Keep?
4. **The runner's pace** is a real-seconds jog (ninety feet a tick), which the continuity contract asks of local motion, but
   it means the walk takes one to five ticks whatever the class's pace. Right?
5. **Ninety seconds** is your number; nothing has measured it with students.

## Food by age, birth dates and twins — 2026-09-22 (released in v2026.09.22.4)

**Owner:** *"Children's food consumption: ages 0–2 use 25% of an adult portion, 3–9 use 50%, 10–15 use 75%, and 16+ use
100%. Preserve fractional totals. Allow seed-deterministic twins at approximately 1% of births."* Astra's handoff
(`docs/HOUSE_SELECTION_HANDOFF.md`) adds quarters summed before rounding, twins with their own identities and one birth date,
and no artificial one-a-year spacing. Read the amendment of 2026-09-22 at the foot of
[FAMILY_CREATION.md](docs/FAMILY_CREATION.md) first.

- **Eating by age** (`quartersFor`, `quartersEaten`, `mouthsOf`, `eatenADay` in `sim/family.mjs`, `FIC-GONZ-360`): a quarter,
  half, three quarters or all of the 0.35 a day, by age on the world's date. Quarters are summed as integers and turned into
  food once: four babies eat exactly one grown share. Every place a family eats uses it — the day at home, the winter, the
  road east, and the neighbours' director (`mouthsAt`, `FIC-GONZ-364`). The Alamo, the army and the camps never ate from the
  family's store, and no screen shows days of food left, so nothing else changed. Nobody with no stated age changes.
- **Birth dates** (`born`, `bornOf`, `ageNow`, `ageOnDay`, `FIC-GONZ-361`): stored on everybody rolled from now; a person rolled
  before gets a date worked out from their age and a hashed day, never written back. `validateWorld` accepts `born` only as
  `YYYY-MM-DD` beside an age. **No save version moved; nobody is re-dealt.** ceiling: in the winter's skipped weeks ages are
  read on the evening the first period ends (`sim/periods.mjs`).
- **Births** (`birthsFor`, `BIRTH_GAP`, `SHORTEST_GAP`, `TWIN_SHARE`, `GROWN_AT_HOME`, `FIC-GONZ-361` to `-363`): 1.4 to 3
  years apart, never under ten months; twins by `share(seed, id, 'twin')` at one birth in a hundred (measured 0.95 in 100);
  in a family too large for eighteen years of childhood, the eldest grown and at home to 22. **A 20 is now a father of 41–45,
  a mother of 37–42, the eldest 18–22, births about 14–16 months apart and uneven, twins in about one family in six, and
  about two and a half sons of fighting age (none to six) where it had exactly two sixteen- and seventeen-year-olds.**
- **Tests changed, each with its reason beside it:** `tests/family-roll.test.mjs` (birth-date checks replace "no two share an
  age" and the 17-to-0 stair), `tests/periods.test.mjs` (the winter eaten by age), and three seeded fixtures whose class
  history moved with its families — `tests/camp.test.mjs` (a skilled man's one-tick guard: "never idle a whole think"
  replaces "at work 7 of 12"; the scouts' loop stops at the army's march; the family's other waiting questions are its own),
  `tests/houston.test.mjs` (two men of two families), `tests/winter.test.mjs` (a son of ten to fifteen, not a daughter).
- **New:** `tests/rations.test.mjs` (nine tests). **Injections:** `node scripts/family-roll-injections.mjs`, **24 of 24 caught** (the eleven kept from the roll, three rewritten for birth dates, ten new); each new one fails only its own test except four that fail two tests guarding the same rule (a birthday a day late; twins three times as often, which also moves the 20's tick size; and the two spacing injections, caught by both the 20's test and the spacing test)
  ([record](docs/evidence/family-roll-injections.json)).
- **Suite:** `npm test` **949 passed, 0 failed** (940 before; nine new), same computer. **Browser:** `npm run test:family-panel` 17 checks passed and `npm run test:family-twenty` 9 passed ([panel](docs/evidence/family-panel-browser.json), [twenty](docs/evidence/family-twenty-browser.json)), desktop sizes and the 400 px phone, same computer only; no LAN or district claim.
- **For the owner:** a birthday changes only eating, not the shown age or the rules of ten and sixteen; grown children at home
  give large families more fighting sons; a one-child family can never have twins. FAMILY_CREATION's amendment lists them.

## "Resume tutorial": five real minutes to take the X back — 2026-09-22 (released in v2026.09.22.4)

**Owner:** *"After closing the tutorial, show a small 'Resume tutorial' button for five real minutes from the original
dismissal, including across reloads. Resume existing progress; quietly show dismissal/resumption to the teacher. Phones are
not officially supported—prioritize desktop and Chromebook."* Astra's `docs/HOUSE_SELECTION_HANDOFF.md` adds: same step,
never reset progress or extend the original window. Recorded verbatim in [LESSON.md](docs/LESSON.md) §1, second amendment,
which replaces yesterday's `ceiling:` that the X was for good.

- **The X keeps the step.** `stopLesson` now stores `{ step: 'done', from, at, stopped: true, stoppedAt, resumeBy }` and
  keeps every marker the steps had gathered (it used to replace the whole object). `stoppedAt` is real server
  milliseconds; `resumeBy = stoppedAt + LESSON_RESUME_MS` (5 min, `sim/lesson.mjs`), fixed at the first press. A second X
  after a resume keeps both, so the window is always the first press's.
- **`resume-lesson`** (`resumeLesson`): the family's own student only (Host, another family's student and an absent,
  director-run family are refused), only while stopped by the X, only before `resumeBy`. Restores `step: from` with every
  marker plus `resumed: true`; the gate applies again, and `applyAction` walks it on at once if the step's work was done
  meanwhile. On `ALWAYS` only so a wrong sender hears the true reason, not "Not yet".
- **Real clock, injectable.** `applyAction(world, id, input, { now, resumeWindowMs })`, `projectWorld(…, { now })`, and
  `createClassroom({ now, lessonResumeMs })` in `server/app.mjs`; a real class passes neither and gets `Date.now` and 5 min.
- **Projection:** `world.lessonResume = { until, ms }` while the window is open, absent otherwise and never to the Host.
- **Screen:** `#lesson-resume`, a small "Resume tutorial" button top right where the strip was (119×36 px). The page counts
  `ms` down on its own clock from receipt (earliest deadline kept per window), so it disappears on time with no reload, even
  in a paused class, whatever the Chromebook's clock says. The military card now stands below it too. The X's question now
  says *"For five minutes, a “Resume tutorial” button can bring it back."*
- **Host:** a quiet italic line on the family's class-panel row — *stopped the guided start at step 3* / *resumed the guided
  start: on step 3 of 10* / *…, after resuming it once* (`lessonHostWords`, passed into `familiesOverview` as `guidedOf`;
  importing the lesson into `sim/host.mjs` closed an import loop through `sim/chores.mjs` that crashed the server at start,
  caught by `npm run test:lesson`, not by `npm test`). Events `lesson-stopped` / `lesson-resumed` are written with
  `visibility: 'host'`, `about: <household>` and no `householdId`, so no family's journal carries them. No banner or sound.
  [HOST_PAGE.md](docs/HOST_PAGE.md) §2.5.
- **Saves:** no `saveVersion` change. An old stop without `from`/`stoppedAt`/`resumeBy` is "window long gone": no offer, and
  `resume-lesson` is refused. `validateWorld` checks the new fields (from only on a stop and naming a real step; both times
  together, finite, in order; `resumed` true or absent).

Evidence (same computer, headless Chrome): `npm test` **949 passed, 0 failed** (940 before; 9 new in
`tests/lesson.test.mjs`, and `tests/host-page.test.mjs` asserts the row's line). `node scripts/lesson-injections.mjs`
**55 of 56 caught** — all 10 new ones caught; the one miss is the older absent-family gap already named in the record. The
harness now checks every pattern before it runs (`--check` does only that). The host-page assertion was seen to fail with
the line removed from `public/live-page.js`. `npm run test:lesson` **33 checks**: X, confirm, "Resume tutorial" measured at
1366×768 and 1024×768 (on the screen, reachable, sharing pixels with nothing), a reload keeps it with the same window, the
press brings the strip back on the same step (`house`) with the bar shut again, a second X offers it inside the first
window, and with the test server's clock moved past the window the button goes without a reload. The proof failed when the
button was made to send the wrong order. `npm run test:panels` **15 checks** pass. `npm run study:overlap` at 1366 and 1024
has a new *resume-offered* state: the button covers nothing and nothing covers it (the other covered controls are the same
family-column rows as before). **Not proved:** a Chromebook, touch, a LAN, a real five-minute wait, or the page's own
countdown hiding the button while no snapshot arrives (the proof's expiry came through a snapshot).

**For the owner:** (1) the window counts from the first X even if the student resumes and stops again — as asked; (2) the
Host's "stopped" line stays for the rest of the class, and the line goes when a resumed family finishes; (3) there is no
teacher control to reopen a family's guided start after the five minutes; (4) five minutes is one constant
(`LESSON_RESUME_MS`).

## Release integration: v2026.09.22.3

House placement, additional homes, the compact builder, biome art, children’s icons and the launcher delete emblem are committed release work. Preserve them in subsequent builds. This integrates origin/main through v2026.09.22.2, including Claude’s tutorial dismissal and family-roll updates.

## House placement preview — 2026-09-22

Choosing a preset now opens a translucent completed-house draft on the map. Move the pointer to position it; click to hold, Rotate (or R) in quarter turns, Move to reposition, Build here to confirm, or Cancel/Escape. Only confirmation sends `plan-house` with `placement: { x, y, rotation }`. Coordinates remain full precision. The server checks a conservative 80×64-foot envelope (swapped on quarter turns) at nine ground samples and rejects overlaps with retained houses. **Superseded 2026-09-23:** the server checks the house's drawn footprint and the ground its pictures stand over (top of this file; [WOODS_AND_BUILDING.md §6.5](docs/WOODS_AND_BUILDING.md)). Both current and retained placed houses use saved coordinates on the family and Host maps. Old saves and commands without placement remain supported.

The preview and built rendering share one draw (`drawPlacedHouse`), size and transform. **Amended 2026-09-23** (student: *"the holographic preview of the house is too small"*): that shared size was true feet - an eight-foot cell, a pen 17.6 feet high - on a map whose people are `PERSON_MILES` (about 100 feet) tall, so at the family's own zoom the preview and the placed house were drawn 8.8 pixels high beside people 49.5 high. Both now draw at `cabinSize` (`SIZE.cabin` people, the size the house at its site always had, TECH.md's one yardstick): 163 pixels at that zoom. The cyan outline is now the footprint the plan's pieces make (`houseFootprint`, public/house-plot.js), not the whole 80 x 64-foot grid. A hover before any press on the map also read the canvas as it was behind the title screen and put the preview at no number, so nothing showed until the first click; the hover now re-measures. `ceiling:` drawn at the symbol size, checked by the server in true feet (see `cabinSize`) - removed 2026-09-23, when the server began checking the drawn size (top of this file). Test: `tests/house-preview.test.mjs` (the old size injected fails only its size test, 998 of 999 pass); browser: `scripts/house-plot-browser-proof.mjs`, now through placement ([evidence](docs/evidence/house-plot-browser.json)). **Amended 2026-09-23 (turning and tapping):** a turn turned the canvas, so the house's pictures turned with it - at 90 degrees the house lay on its side, at 180 it stood on its roof with its chimney pointing down. A turn now turns the house on the ground and never its pictures (`drawHousePlot` with `rotation`, `turned` in public/house-plot.js): each piece stands upright in its turned cells, drawn back to front, so a dog-run at 90 or 270 runs into the screen with one chimney behind and one in front, and the round-log cabin's chimney is right of the pen at 0, in front at 90, left at 180, behind at 270 (since the chimney fix at the top of this file, against the pen's gable wall on that side). The sheet draws a pen corner-on, so at 90 and 270 every piece is mirrored about its foot (gable on the other face, ridge on the other diagonal); at 0 and 180 it is not. The cyan outline is the footprint turned on the ground (`houseFootprint(house, catalogue, rotation)`), long side the way the server's swapped envelope runs. `stand-in:` at 90 and 180 the gable facing the viewer should be the pen's doorless back, and the porch, shed room and passage are broadside whichever way they run: [ART_REQUESTS.md](docs/ART_REQUESTS.md) *Request 2026-09-23 — the house from its other sides*. And a tap on a placed house did nothing - the tap spot (`housesDrawn`) was still the family's site point, where the bare ground opened a house that was not there; `drawPlacedHouse` now returns the box its pictures cover and `drawLandHouses` notes it (`notePlacedHouse`), and the site point answers only while a house stands at it. Tests: `tests/house-turn.test.mjs` (upright, mirrored at a quarter turn, on the turned footprint, back to front; the old canvas turn injected fails its 16 turned-house tests, and the 5 tap tests whose taps aim at the turned pixels, 1023 of 1044 pass), `tests/house-tap.test.mjs` (the old site-only tap spot injected fails its 9 tests only, 1035 of 1044 pass); `tests/house-preview.test.mjs` now all four turns. Browser: the proof sets the built house's saved turn to 0/90/180/270, records every house-sheet picture the map draws (none drawn with any rotation or shear, this house's mirrored at 90 and 270 only), then clicks the house where it is drawn and its rooms open ([evidence](docs/evidence/house-plot-browser.json)). Seen in the proof's pictures and not fixed: the placed house is depth-sorted with the people as one item at the site's y, not its own, so a person or horse standing just behind it can be drawn over its near chimney. Construction workers and the furnishing interaction still use the homestead service point; independent building access/pathfinding remains follow-up work. Terrain validation samples the envelope rather than computing polygon intersection against every waterway.

**The roof on its walls, 2026-09-23** (student: *"the roof doesn't seem to stay where it's supposed to be. It slides forward."*). A round- or hewn-log pen is drawn from `house-modules` a piece at a time, and the roof was drawn at the walls' ground anchor - which for a roof is the low front tip of its eaves - so on every pen, in the chooser, the preview and the house that stands, it sat about a third of the pen's width forward and down, over the walls to the ground. Nothing moved over time, with zoom or between preview and built; the turn rotates walls and roof together. The atlas now measures a seat on the full walls and each roof (`seatX`/`seatY`, `seatOf` in `scripts/build-atlas-manifest.mjs`; `ceiling:` read off the silhouette) and `roofSeat` in `public/house-plot.js` puts the one on the other at the walls' pixel scale. Every stage of a pen is also drawn at its full walls' scale: drawn each to the pen's height, the sill had been 28% bigger than the walls that replaced it. `drawHousePlot` takes `spriteFrame` for this; without it a pen draws its whole picture. Test: `tests/house-roof.test.mjs` (the old roof injected fails only its 8 roof tests, the old stage heights only its stage test; 1009 pass). Browser: `scripts/house-plot-browser-proof.mjs` now also shoots every plan in the chooser, the preview at each quarter turn and the built house at three zooms (`HOUSE_SHOTS`), and sends the builder back after a wet day stops him. Still open: the turn rotates the pictures themselves (a 90-degree house lies on its side), and the dog-run passage roof is a hand-sized piece below the pens' eaves.

Validation: 20 house/plot tests passed, including coordinate/orientation persistence, invalid rotation, off-property envelope and existing-building overlap; the lesson browser regression reported 21 passing checks and no page errors. That browser regression verifies general UI health, not an end-to-end placement interaction.

## Second houses and compact builder — 2026-09-22

The colonies house chooser now offers “Build another” after construction finishes. `plan-house` with `additional: true` validates the new design before preserving the finished house in `household.completedHouses` and opening a fresh active project. Only one construction project runs at a time. Finished houses survive saves, remain drawn beside the active project, and contribute combined shelter capacity. The Host projection includes the retained houses. Original-home furnishings retain their original interior. The chooser contains illustrated presets, the current stage, and immediate requirements; the component grid and extended statistics are hidden.

Validation: 933 tests passed in `test-results/second-house-full.log`; after the final interior/Host refinements, 15 house-plot/interior tests passed, including completing a second house through actual construction spells, persistence, and refusing another simultaneous project. The completion test initially held the weather clock at a rainy hour; advancing its clock allowed the existing weather-dependent work to finish. Separate furnishing selection for additional homes and future nightly individual sleeping assignments remain follow-up work. The retained homes currently use automatic visual spacing at the homestead, not independently surveyed sites.

## Simplified house selection and owner decisions — 2026-09-22

Read [HOUSE_SELECTION_HANDOFF.md](docs/HOUSE_SELECTION_HANDOFF.md). The desktop house chooser now presents illustrated preset plans using the world’s actual modular renderer, hiding the component grid and palette. House-site/survey prompts move right, away from the family column. The document records food weights, rare twins, the five-minute tutorial resume window, desktop support, all four military decisions, and the remaining multiple-house/youngest-first sleeping implementation. One house per holding remains a simulation limitation; this pass changes the interface.

## Play Solo delete emblem — 2026-09-22 (released in v2026.09.22.4)

`launcher/art/icon-delete-save.png` replaces the modern line-drawn trash can with a transparent frontier stave pail whose lid is visibly open. `SoloGameDialog` embeds, scales and tints one source for ordinary rows, selected rows and warning-red hover. The old GDI line work runs only if the resource cannot load. Exact prompt and provenance are in `docs/LAUNCHER_ART.md`.

## Children’s action icons — 2026-09-22 (released in v2026.09.22.4)

`icons-children.png` replaces all six code-drawn children’s work glyphs: play, kindling, shooing birds, gathering eggs, fetching water and minding a younger child. `public/family-panel.js` binds each action directly to its sprite. The kindling icon deliberately contains no blade, and play is visually distinct from work. Generation prompt and provenance live in `scripts/art-deliveries/children-icons.mjs`. The atlas audit found 80.3% clear alpha, 100% object retention and zero overlap trimming.

## Biome trees and field art — 2026-09-22 (released in v2026.09.22.4)

`biome-trees-fields.png` adds sixteen production sprites in the established hand-painted style: three sizes each of longleaf pine, Texas sabal palm and bald cypress; medium/large southern magnolia and American beech; young/mature irrigated crop rows; and fallow ground. The unmodified generated source is registered in `scripts/art-deliveries/biome-trees-fields.mjs`; prompt and provenance records are rebuilt into `docs/art-prompts.json` and `docs/art-provenance.json`.

The simulation now binds longleaf, palm and bald cypress to their own three-size art. Beech and magnolia use explicit per-size pictures so mature trees select their large frame. Palm-grove marks and town/Béxar field marks use the new sprites. `npm run build:art` passes with 1,165 measured frames across 82 sheets and 447 clips; the new sheet retained 100% of every measured object with zero overlap trimming. See `docs/ART_REQUESTS.md` for the remaining species stand-ins and the still-open researched acequia layout.

## The roll is the family — 2026-09-22 (released in v2026.09.22.2)

**Released as [v2026.09.22.2](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.22.2)** on 2026-09-22, from `c25414f`.

**Owner:** *"change the family rolls. if i roll a 20, there should be 18 kids. if i roll a 4 it's two parents and 2 kids. each
number over 4 is another kid."* By multiple choice for 1 to 3: **"The roll is the family"** — the number is how many people
there are. Read [FAMILY_CREATION.md §2 and §3](docs/FAMILY_CREATION.md) first.

- **The table** (`compositionFor`, `FAMILY_TABLE = 'd20-size'` in `sim/family.mjs`): 1–3 one parent and the rest children,
  4 and up two parents and the rest children, so a 20 is two parents and eighteen children. A family of one to twenty, ten
  and a half on average. `FIC-GONZ-350`.
- **Old classes open as they were.** A new roll is marked `household.rollTable = 'd20-size'`; `die` 20 with no mark is the
  2026-09-14 table of set families, and no `die` is six sides. `tableOf` picks the table and `validateWorld` reads each roll
  on its own. **No save version moved.** People are stored in the save, so nothing is ever re-dealt.
- **Ages** (`agesFor`, `FIC-GONZ-351`): eighteen different ages born when the mother was 17 to 42 fit only a mother of 34 to
  42, so a 20 is always children aged 17 down to 0, one a year. Parents too old for the window are made younger; a father
  is at least 18 at every birth, made older where he is not (he was checked for nothing before, and a big family made him
  nine at his eldest's birth). No twins; no two children share an age.
- **What was measured and left alone:** everybody eats 0.35 a day, a newborn as much as the father (superseded the same day
  by *Food by age* above, as were the ages of the bullet before); the same wagon and stock
  for any size; the four set houses hold at most eight, so nine or more are crowded (rest at 80 in 100) unless the class
  builds from pieces, where three pens with lofts and a shed room hold twenty. Names: the son and daughter pools hold twenty
  each, so a family never repeats a first name. `sim/children.mjs`, hidden stats, kin labels and the director scale by the
  person with no change.
- **Payloads.** A student's tick for a family of 20 is 23,459 bytes against 7,567 for a 4 (993 bytes a person), bounded
  in `tests/family-roll.test.mjs`. The Host's thirty-family snapshot went from 132,587 to 210,231 bytes at the arrival
  (159 to 331 people); the per-figure bound held (450 bytes), and the total bound in `tests/host-view.test.mjs` moved from
  140,000 to 240,000 with the reason written beside it.
- **Tick time**, `node scripts/perf-server-measure.mjs --rolled` (new flag; [rolled](docs/evidence/perf-server-rolled-2026-09-22.json)
  against [founding four](docs/evidence/perf-server-founding-2026-09-22.json), run back to back on the same computer while
  other sessions' processes were also running): the thirty-family class with 295 people took **178–332 ms a tick** (step
  51–118, projection 48–233) against 138–202 ms with 120; a burst of thirty orders answered in a median 117–869 ms. The
  class ticks every 1.5 s in that measure and every 9.5 s in play.
- `tests/road.test.mjs`: the road-fishing test compared the food before and after an hour's fishing, which a family of
  twenty eats through; it now compares against the same family left on the bank.

- **A screen bug a big family found.** The family column stopped 150px above the foot of the screen, set for the old bar of
  48px pictures; the bar of 98px tiles reaches about 195px (235px under a lesson), and a family that fills the column had its
  youngest children's portraits under the father's work — `test:family-panel` (its seed now rolls fourteen) could not
  press the youngest. On screens wider than 760px the column now stops at 200px, 240px under a lesson (`public/style.css`,
  `ceiling:`; [FAMILY_PANEL.md](docs/FAMILY_PANEL.md) §13's amendment). `test:family-twenty` failed on it before the change.
- **Proofs whose seeds now roll bigger families:** `test:family-panel` renamed ten people from a list of ten (now twenty
  names); `test:family-commands` (its seed rolls twenty) ran out of class before its phone section and raced a question that
  lapses in two fictional hours: the tick is 350 ms instead of 250, and the "!" is pressed the moment it shows, the errand
  sent again if it lapsed first.

Evidence: `npm test` **935 passed, 0 failed** (932 before); `node scripts/family-roll-injections.mjs` **12 of 12 caught**
([record](docs/evidence/family-roll-injections.json)); `npm run test:family-twenty` (new) **9 checks** at 1366×768, 1440×950,
1024×768 with the class running, and 400×800 ([record](docs/evidence/family-twenty-browser.json)); `test:family-panel` 17,
`test:family-commands` 23, `test:creation` 9 (the names card now twenty boxes), `test:family` 11, `test:panels` 9 and
`test:lesson` 21 checks pass; `study:overlap` and `study:creation` rewritten. Same computer, headless Chrome; no LAN,
Chromebook or real phone.

**For the owner to decide:** whether a child should eat less than a grown person (today a family of twenty eats 7 a day);
whether twins should be dealt so a big family is not one child a year; whether the set houses need a larger one.

## The X on the guided start — 2026-09-22 (released in v2026.09.22.1)

The owner: *"i should be able to X off the tutorial to stop it and just do what i want."* Asked by multiple choice who
gets the X, the owner chose **"Everyone, always"**. This amends the "unavoidable" of 2026-09-21; recorded verbatim in
[LESSON.md](docs/LESSON.md) §1, amendment, with every "unavoidable" in that doc brought into line.

- **Server:** a new order `stop-lesson`, on `ALWAYS` in `sim/lesson.mjs`, applied by `stopLesson`. It stores
  `household.lesson = { step: 'done', at, stopped: true }`, so the gate opens and the projection's `lesson` key is absent
  at once (no closing card). Only the family's own student: the order acts on the household the cookie names, the Host
  (no household) is refused, a director-run absent family is refused, and a family with no lesson running is refused in
  words. `validateWorld` accepts `stopped: true` on a finished lesson only. **No `saveVersion` change**: absent means
  never stopped. `ceiling:` it is for good; the comment names what a restart button would need.
- **Screen:** an X top right of `#lesson` (36 px, "Stop the guided start"), asking once inline — *Yes, stop it* /
  *Keep going* (focus on *Keep going*), no `window.confirm`. The eyebrow and title are padded clear of it. On success the
  page marks the older "New to this?" walk-through as seen, so it is not offered in the lesson's place. The title card
  (`#creation-begin`) no longer says the game "will not let you jump ahead"; it says the X stops it.
- **Tests:** five in `tests/lesson.test.mjs` (gate opens and a refused order succeeds; no `lesson` key after; another
  family's student cannot stop yours; save round-trip through `validateWorld`; refused for the Host). Seven injections
  added to `scripts/lesson-injections.mjs`, **7 of 7 caught**; the whole harness is **45 of 46**, the miss being the older
  absent-family gap already named in the record.
- **Browser:** `npm run test:lesson` now presses the X on the server's own step, checks the question and that *Keep
  going* sends nothing, confirms, and sees the strip go, a step-refused order (probed against the server first) accepted,
  and the strip stay gone after a reload; the X is measured at 1366×768 and 390×844 (36×36, inside the strip, on no word,
  reachable). A deliberately broken X (sending a wrong action) was seen to fail the proof.

Evidence (same computer, headless Chrome): full `npm test` **937 passed, 0 failed**; `npm run test:lesson` **27 checks**;
`npm run test:panels` **9 checks**; `npm run study:overlap` shows the same covered controls with and without this change
(the X is covered by nothing). **Not proved:** a Chromebook, touch, a LAN or a classroom.

**For the owner:** (1) the X cannot be undone — a restart button is a separate decision; (2) the Host is not told when a
student presses it — an event and a line on the class panel would be the way; (3) `CLAUDE.md` item 15 still describes the
guided start as "forced"; it was left for the owner to reword.

## Military pacing and continuity — 2026-09-22 (released in v2026.09.22.1)

Read [MILITARY_EXPERIENCE.md](docs/MILITARY_EXPERIENCE.md) next. It separates the implemented military pacing/message safeguards from the remaining local messenger, staged battle, survival/role and seamless-continuity work. The owner requires smooth uninterrupted play: no visible fast-forward, dated transition screens or forced camera cuts. Hard tick caps alone do not satisfy that requirement.

Implemented: slower attended military journeys, protected reading time, historical-boundary landing, one calendar interval throughout a live tick, guards against jumping over military choices/travel, physical camp relocation without a free movement tick, and visible invitations to a rider or the family's serving person. Alamo courier choices remain the existing authoritative choices; room-by-room combat is not implemented. Earlier usability changes below remain included. No save-version change and no deployment in this pass.

Validation by the session that started it: full `npm test` 930 passed; Alamo browser proof 6 checks, lesson browser proof 21 checks. Superseded by the finishing pass below.

**Finished 2026-09-22 (military finishing pass).** What was left and is now done:

- The injection harness `scripts/military-regression-check.mjs` ran only the selected test, so it could not see a mutation that also broke a neighbour. It now runs a clean baseline, then the whole test file per mutation, requires exactly the named test and no other to fail, and throws on a target not found exactly once. Thirteen mutations, one for every military test: **13 of 13 caught** (`docs/evidence/military-injections.json`).
- `moveCamp`'s two new lines (clear the camp, no free tick on the order) had no test. Added `a camp order starts a visible journey` in `tests/military-pacing.test.mjs`; two mutations prove it.
- The claim `FIC-GONZ-232` sat inside the travel-sight block (`230`-`239`). Renumbered and registered in the table as `FIC-GONZ-320` to `-322`.
- `npm run test:panels` failed on the new message card at 390px: it lay over `#survey-cancel`, and once moved, over the family column's "!" so the rider's conversation could not be opened. The card now stands below the guided start and any open land chooser, starts right of the family's faces on a phone, and is hidden while the meeting (`#encounter`) or the call's menu is open. Both failures were seen before the fix; the proof passes after it.
- `ceiling:` comments on the three deliberate simplifications: fixed caps for the whole class rather than a scheduler; a time jump refused outright rather than run up to the protected interval; a card of words rather than a runner walking to the person.

Evidence, on a clean verify tree holding only this work (same computer, headless Chrome): full `npm test` **932 passed, 0 failed**; `node scripts/military-regression-check.mjs` **13 of 13 caught**; `npm run test:alamo-siege` **6 checks**; `npm run test:family-panel` **17 checks**; `npm run test:lesson` **21 checks**; `npm run test:panels` **9 checks**; no page errors. **Not proved:** anything on a LAN, a Chromebook or in a classroom; seamless play of any kind; the length of a class period under the new pacing; the continuation steps 1–6 of MILITARY_EXPERIENCE.md, none of which is built.

**Questions for the owner:**

1. Is the next build step 1 of MILITARY_EXPERIENCE.md (a server-owned local Alamo courier encounter with a runner who walks to the person), or does Gonzales/core usability stay first? It is a large piece and CLAUDE.md names usability as the active phase.
2. The 20-minute cap for an open question slows **every** household in the class until the director's dated deadline closes it (`ceiling:` in `sim/military-pacing.mjs`). Is a longer class period acceptable while a student has a question open, or should an open question get a wall-clock budget of its own (step 4)?
3. Each of the four Alamo courier dates asks each person once; a volunteer not chosen is not asked again. Keep, or reconsider on the next date?
4. The fictional player fate inside the Alamo is still decided by sex (`tellFall`). Replacing it with roles is a design decision about who in a family can survive the fall; it was left unchanged.

## Current usability changes (released in v2026.09.22.1) — 2026-09-21

Portraits now select an eligible person and their action bar in one click. Every action has a persistent name, and phone conversations reserve space above the bar. See [the usability handoff](docs/TUTORIAL_USABILITY_HANDOFF.md#second-usability-pass--2026-09-21) for changes, evidence, and remaining work. The release record below describes the earlier shipped build.

**Released as [v2026.09.21.8](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.21.8)** on
2026-09-21, verified on the clean tree at `3f91610` (920 passed). All six agents of that day are merged: the children's
works, the line an empty bar shows, Astra's last four art batches, rain on the roofing and daubing, the four panels the
overlap study could not reach, and the four browser gates that had been broken since before any of it.

## The bar steps aside, and the column folds to faces — 2026-09-22

**Released as [v2026.09.22.1](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.22.1)** on 2026-09-22, from `62261a6`, together with the military pacing (`b780534`) and the guided start's X. The new family roll was not in it.

The owner decided both of the contested pairs below (§ "Two things are the owner's to decide") by multiple choice:
*"The bar steps aside"* while a rider talks, and *"The column folds to faces"* while a place is chosen. Built in
`renderScreenMoments` (`public/app.js`) and the last rules of `public/style.css`; the whole account, with the numbers it
was chosen over, is [docs/FAMILY_PANEL.md §12.13](docs/FAMILY_PANEL.md).

- **Measured, same computer:** the meeting shares nothing with the ability bar at 1366, 1024 or 390 (it shared 520×48px
  and 520×42px), and the bar is back, drawn and of real size, the moment the meeting shuts. The site and stake panels
  share nothing with the folded faces at any size (they shared 304px of the column's width), stand below the guided
  start where it reaches lower, and the names open again after "Not now".
- **Gate:** `npm run test:panels` 9 → **15 checks**; `node scripts/panels-injections.mjs` puts seven regressions back
  one at a time, including the rule as first written, which lost on specificity and left the bar standing
  ([panels-injections.json](docs/evidence/panels-injections.json)).
- **Still open, nobody has chosen it:** the meeting over the family's column — the whole column on a phone, 8px at 1024.

## Corrected: the lobby bar is not empty — 2026-09-21

**I wrote this up as a possible regression and it is not one.** `npm run test:family-panel` failed after the merge in a
section that runs *before* it presses Start, and the page draws no `.panel-icon` for any row there — which I reported as
"nobody's bar carries anything in the lobby", with `LOBBY_ACTIONS` as the reason it might matter.

Asked properly, the page says otherwise. In the lobby the whole family is still driving in, so every one of the eight
works the server offers the principal is refused *"Elias Proofwright is on the road."* — and since the same day's panel
work (§14) a bar where nothing is open is replaced by that one sentence. The bar is not empty; it says why. My first
probe counted `.panel-icon` and never looked for `.panel-reason`, which is the thing that had replaced them.

Nothing in the game was wrong and nothing was changed to fix it. The proof's hover section simply ran in a state where
no icon can exist, and waited thirty seconds for one; it now asserts the lobby's line where it used to stand, and does
its hovering after the class has started and the family is home.

**The lesson worth keeping is about the instrument, not the game.** A probe that counts the thing it expects will report
zero when something else has taken its place, and zero reads like a fault. Ask what *is* there, not only whether what you
expected is.
## Where everything is, end of 2026-09-21

**On main and released:** v2026.09.21.4 (Astra's art in the game), .5 (the screen stops standing on itself), .6
(deleting solo games), .7 (Play Solo asks what a class asks). Since .7 and **not yet released**: the house step saying
to choose a house, rain holding the roof and the daub, and the line an empty bar shows. `npm test` **904**, doc links
**785**.

**Three agents were still running when the session ended** (the fourth, the broken proofs, came in and is merged). Each is on its own worktree branch and has been told not to
push and not to merge. Merge them one at a time, run `npm test` after each, and expect the interesting faults to be in
the merge itself rather than on any branch — three of the four wizard faults on 2026-09-21 existed only where two
branches met, and two more appeared when the rain work met the panel work.

| Branch | What it was asked for | What it will collide with |
| --- | --- | --- |
| art wiring | Astra's four unwired batches: mounted family, mustang and *Yellow Stone*, Alamo face strips, wagon drivers | the drawing code in `public/app.js` |
| screen overlap | the four panels the overlap study cannot reach honestly — `#site-choose`, `#survey-choose`, `#encounter` (which the stylesheet puts where the ability bar lives), `#call-menu` | `public/app.js`, `public/style.css`, `scripts/screen-overlap-study.mjs` |
| children's work | play and the small jobs a frontier child did, in a module of its own (`sim/children.mjs`) so it registers rather than edits `sim/chores.mjs` | `public/family-panel.js` glyphs; the panel line above |

**The sweep the owner asked for comes after all four are merged:** every life stage and situation — soldier, sick,
captured, travelling, fled, a family that has left for the east — checked so that each person's bar says something true
about that person. Their words: *"This philosophy should be followed logically and dynamically throughout the
experience of the game."* The panel work above is the first half of it; what remains is the audit.

**Do not trust a harness that reports a number.** Five were found unable to run on 2026-09-21, every one of them
reporting success while matching nothing. Run one before relying on it, and read the count.

**Released as [v2026.09.21.5](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.21.5)** on
2026-09-21, verified on the clean tree at `b2e184c` (869 passed).

**Rain on the roofing and the daubing, 2026-09-21 — the last row of the weather work:**
[WEATHER.md §10.5](docs/WEATHER.md), `FIC-GONZ-290`, `HIST-TEX-390`. `FIC-GONZ-135`'s last unbuilt line, and with it
every row of §10.5 that claim covers.

- **The rule is `rainHold(here, work)` in `sim/weather.mjs`**, with `RAIN_HOLDS` naming the two kinds of work a wet sky
  holds and the reason for each: `daub` ("the mud would wash out of it before it set") and `roof` ("the roof would go on
  wet"). Wet means a rain day, a storm, or a norther that brought its rain (`rainingOn`, which `rainingAt` now reads); a
  **dry norther does not hold the roof**. Ten stages in `sim/houseplot.mjs` carry a `wet` tag and no others — a pen's
  roof and chinking, a jacal's wattle and thatch, the passage, the shed room's roof, the porch, the stick-and-mud
  chimney. **Felling, hauling, the sills, all ten courses, framing, the floor, the loft and the stone chimney are
  untouched.**
- **Held, not stopped.** `nextStage(pieces, here)` passes over a held stage, so a family whose roof cannot go on frames
  its shed room instead. The house stands still only when the rain is on everything left; then the chore ends and the
  family is told which stage of which piece is waiting, once. The refusal is on the land line before anybody is sent
  (`FIC-GONZ-008`), and no die is anywhere in it.
- **A house chosen whole is not held at all.** The four of `sim/houses.mjs` are one bar of work with no roofing stage in
  it, and stopping the bar would stop the felling. `ceiling:` in that file.
- **It is fiction and it was checked first.** `HIST-TEX-390`: Smithwick never uses the word *daub*, Jordan's *Texas Log
  Buildings* has a whole section on chinking and not one word about weather, the only explicit rule found anywhere (NPS
  Preservation Brief 26) names *sun, heat and frost*, and Lewis and Clark roofed and daubed through a fortnight of
  Pacific rain. No source supports this rule and one primary source is against it. It is built because the owner asked
  for it, and registered as fiction rather than dressed as history.
- **Cost, measured before and against after** — four classes of thirty run to the end of all three periods,
  `docs/evidence/biome-balance-rain-before.json` and `-after.json`. **Every family still gets a roof: 120/120 before and
  after, all inside the first period.** Median tick the family lived in its house **95.5 → 99**; p90 **136 → 137**; the
  worst family of 120 **239 → 255**. Hungry ticks **4.5 → 5**. Final number, glory and coin unmoved. **21 stoppages over
  the four classes, 20 of 120 families met one.**
- **`npm test` 879 → 893.** `tests/rain-work.test.mjs` (14), proven by `node scripts/rain-work-injections.mjs`:
  **33 of 33 caught** (`docs/evidence/rain-work-injections.json`). That harness handles CRLF, which
  `scripts/weather-model-injections.mjs` still does not.
- **What could not be proved.** The measurement is of a **dry week**: a class raises its house 29 September to about
  4 October, and the wet share over the families' own land in that window is **.098**. November is .40/.47/.57 by region
  and the wet spring multiplies March by 1.35 — a family still roofing then would meet this four times as often, and
  **nothing in the game builds a house in November, so nothing measured it**. Re-run the study before pushing house work
  past October. No browser proof was run: nothing was drawn and no transport or projection shape changed.
- **Files touched:** `sim/weather.mjs`, `sim/houseplot.mjs`, `sim/houses.mjs`, `sim/chores.mjs` (two call sites),
  `tests/rain-work.test.mjs`, `scripts/rain-work-injections.mjs`, `HISTORY.md`, `docs/WEATHER.md`,
  `docs/WOODS_AND_BUILDING.md`, this file.
**A person who can do nothing says why, 2026-09-21:** [FAMILY_PANEL.md §14](docs/FAMILY_PANEL.md). The owner, after
hitting it: *"When I switch characters, the action bar at the bottom should switch to that person's bar… This philosophy
should be followed logically and dynamically throughout the experience of the game."* Asked what an empty bar should
show, they chose **one line saying why, in the person's own terms**, over a row of greyed icons and over leaving it
blank. This is the `ceiling:` `public/style.css` wrote on 2026-09-21 paid on the first day a class asked for it: the
one-line reason lived *inside* the icon group, and only the main person's group is drawn, so a child under ten was a
face, a name and nothing.

- **Where it goes.** The main person's line is in the bar at the bottom middle, in place of the icons; everybody else's
  is a line of its own in their row (`.panel-why`, the way out that ceiling named). Never both — no student is told the
  same thing twice.
- **The page writes none of the sentences.** `rowReason(icons, { offered, entity })` returns the reason the server put
  on **every** piece of work it offered that person — `tooYoungWhy`, `servingWhy`, the per-chore `why` — and nothing
  when anything on the bar is still open. Somebody dead or captured has no icons at all, so theirs is read from
  `world.work` itself. Swept over a played day: every line shown was found word for word in what the server sent.
- **The lesson and a refusal look the same and are not.** `sim/lesson.mjs` refuses in `applyAction` and leaves
  `world.work` alone, so a step that shuts the whole bar leaves every icon `can: true` and no line appears — while a
  child the server really refused gets theirs **in the same tick**. Both halves are held by tests and by the browser.
- **Found by sweeping a played class, not by listing:** a child under ten, an infant, the dead, the captured, anybody on
  a road, anybody away too fast to follow, a man shut in the Alamo or ridden for it, a man marching with the camp.
  Three that were expected and turn out **not** to empty a bar, and were left alone: somebody serving at rest (their
  *Send for them* is open), somebody sick (sickness refuses no work at all), and a family fled east (the adults have the
  road's own chores).
- **Evidence:** `tests/panel-silence.test.mjs` (10 tests) in `npm test` **890**;
  `docs/evidence/panel-silence-injections.json` — **8 of 8 caught**, one of them only after a test was added to give it
  something to fail: the injection first caught nothing, because no test yet had a row whose every refusal was wordless; `npm run test:panel-silence` — **39 checks**
  at 1366×768, `docs/evidence/panel-silence-screen.json`, screenshot `test-results/panel-silence.png`; and
  `node scripts/panel-silence-browser-proof.mjs --inject` — **3 of 3 caught**,
  `docs/evidence/panel-silence-screen-injections.json`. Claims `FIC-GONZ-310` to `-312`.
- **Not proved:** same computer only; no phone size was measured, and on a phone the line follows the body it lives in,
  so only the opened row shows it (`ceiling:` in §14.4). A row refused for **several different reasons** keeps its
  dimmed icons rather than choosing between the server's sentences — the case is a family halted on the road east, and
  it is a `ceiling:` held by a test, not an oversight. `npm run test:family-panel` was already broken before this work
  and was not touched; these checks are in a proof of their own for that reason.
**Four broken gates, and the game was right in all four, 2026-09-21:** [FAMILY_PANEL.md §13.6](docs/FAMILY_PANEL.md).
`test:family-panel`, `test:family-commands` and `test:furniture` had been failing since before the guided start went in
(verified at `68c4d56` and `4f96879`), and `test:road` was failing at the bog. Each was asked the same question —
**is the proof wrong, or is the product?** — and in each the proof was measuring a rule an owner decision had replaced,
or a screen that had moved under it. **Nothing in `sim/` or `public/` was changed.** `npm test` **879**, unmoved.

- **`test:furniture`** never walked `meetFamily`, so the title screen's canvas took its first press — a timeout on a
  button that was on the screen and could not be pressed. **5 checks.**
- **`test:family-commands`** was measuring §11's "the whole family at work at once" *through the guided beginning*,
  which forbids exactly that. Its class is `taught` now, and the section says out loud that no lesson stands before it
  counts. **23 checks; 7 of 10 set to work.** A real student is not caught by this: in a real class the house is **not**
  up on arrival, so the step after *order* is *house*, which asks for the whole family.
- **`test:family-panel`** read §7's phone rule at **one point**, and the guided start's strip pushed the column 220px
  down until the one open row §7 allows sat under it. Read on a **grid of 288 points** now. **14 checks**, and
  **3 of 3 injections caught, each by the check written for it** (`scripts/family-panel-phone-injections.mjs`,
  [evidence](docs/evidence/family-panel-phone-injections.json)).
- **`test:road`** waited **60 seconds** for a bog that takes **154** when served to a browser — the roll is once a day
  against the weather where the family is, so the day it sticks on moves with how long somebody takes to press Confirm.
  Past it, it pressed *Hunt from the camp* on a row that was not the main person's (§12). **7 checks.** **The road's
  simulation was never at fault**: stepped in process it bogs this family every time.

**Not proved:** same computer only, headless Chrome, no LAN and no district claim. No real phone: the 400×800 context is
Chrome. No claim ID was spent — nothing here invents anything. The guided start's strip takes about a third of a 400px
phone screen; that is §12.11's and the overlap study's, recorded here and not chased.
**Astra's last four deliveries of 2026-09-21, wired: what was registered and drawn by nothing, and now is.** The four
batches that landed after the nine were measured, validated, written up — and nothing in the game placed one frame of
them. They are in play:

1. **A rider is one painted picture of a person on a horse** (`people-mounted-cast1/2-e/s/n`, 96 frames, 24 clips). All
   eight identities — `rust`, `teal`, `elder`, `blue`, `rust-woman`, `indigo`, `ochre`, `blue-girl` — ride the chestnut
   east (west mirrored), south and north, with legs, boots, stirrups and reins, in place of a standing figure cropped at
   the hip and laid over a separately drawn horse. `seatedClip(entity, direction, 'horse')` returns it, `seatLayout`
   answers with **one part and no horse under it**, and the rig is drawn at `MOUNTED_HEIGHT`, the height a rider and
   horse have always been drawn at, so nothing about the click target, the label or the travel marker moves.
   **Still the composite:** a child on the horse (`girl`, `boy`, `smallchild`, `infant`), whose mounted sheets are not
   delivered — a real case, since a girl of twelve may be sent on it.
2. **A driver is a whole seated figure with reins and a goad** (`people-wagon-drivers`, 16 frames). `rust`, `teal`,
   `elder` and `blue` in all four headings, composited over the wagon and team the renderer still draws itself, standing
   on the footboard and **not clipped at the hip**. `SEAT.driverHeight`/`driverHip` place it, read off the sheet by eye
   and proved by photograph, not measured out of the pixels — marked `ceiling:`. **The second cast's driver layers are
   not delivered and are not invented:** `rust-woman`, `indigo`, `ochre`, `blue-girl` and every child keep the stand-in,
   and that row in `docs/ART_REQUESTS.md` is narrowed to exactly them rather than deleted.
3. **A mustang is a picture** (`wildlife-mustang`). `DRAWN_GAME` is `['deer', 'turkey', 'mustang']`; the graze and alert
   cycles keep the deer's contract exactly — foraging while the hunter comes, head up the moment the family is asked
   about the shot. The bear, javelina, antelope, buffalo, geese and wild cattle are still words only, given no place to
   stand rather than a deer's picture.
4. **The *Yellow Stone* is under way** (`steamboat-laden`). `crossing` is the only thing the server says about her beyond
   `cotton`, and the place it gives her is the **middle of the water** between Groce's and Bernardo — so the pose that
   matches it is the army-laden loop under way, not a plank out at a bank. `steamboat-gangplank` (`steamboat-moored-3`)
   was drawn there until today and is now on the written-down list with that reason: an exchange, and the honest one.
5. **The Alamo wears five painted elevations** (`alamo-face-strips`). Plain limestone on the outer and pen walls; the
   one-storey room front on the west range, the low barrack, the quarters, the store, the hospital, the kitchen, the
   sacristy and the powder store; the two-storey convento end on the long barrack alone (the same 16 ft the beam-end
   rows already read); the gate passage over the one opening the massing carries; the roofless church's own unfinished
   wall on the shell `alamoMassing` cuts out of the nave. The palisade keeps its stakes. **Nothing of the compound
   moved:** the footprint, the heights, the openings and the destructible north wall are asserted unchanged
   (`tests/alamo-faces.test.mjs`). The choice is a pure module, `public/alamo-faces.js`, so it can be asked the same
   questions the renderer asks.

**What is deliberately not drawn, and why.** Thirteen frames, each on the `NOT_DRAWN` list in
`tests/art-library.test.mjs` with its reason, and the test fails **both ways** — a listed frame quietly drawn, or a
delivered frame drawn by nothing: the **eight mustang gallop beats** (no fleeing or missed-shot state is projected — the
turkey's bound frames are up there for the same reason); the **four `steamboat-steam` beats** (nothing projects her
steaming light, and a return trip invented to have something to draw is not in the record at this hour); and
**`steamboat-moored-3`**, above.

**What is measured.** `npm test` is **885, 0 fail** (879 before). Injections: **25 of 25 caught**
(`node scripts/mounted-wiring-injections.mjs`, `docs/evidence/mounted-wiring-injections.json`). Browser:
`npm run test:riding` photographs the painted rider and the seated driver and records the clip each was drawn from
(`docs/evidence/riding-horse.png`, `riding-wagon.png`, `riding-browser.json`); `node scripts/alamo-style-shots.mjs faces`
asserts all five elevations were **laid** on the compound, not merely chosen (`docs/evidence/alamo-faces.json`,
`facesLaid`); `npm run test:art` counts the pixels each delivery paints in the catalog **against a control page with one
atlas refused**, which reads 1,022 against 46,454 — the number means something because it goes to nothing when the
picture is withheld.

**Two things this cost, both worth keeping.** (1) A new `public/*.js` module the page imports is a **401**, because the
server serves named routes and not a folder; the whole module graph then fails and every page is a blank join form with
no error anywhere in `npm test`. `public/alamo-faces.js` did exactly that, and it was found twenty minutes later by a
browser proof that could not type its own name. `tests/asset-http.test.mjs` now walks every absolute import in `public/`
and asks the server for it. (2) `scripts/riding-browser-proof.mjs` was waiting for `__seatedDrawn` on a **running** class,
where somebody crossing the country on horseback is a travel marker and no figure at all — the check was being made in a
state where the fault could not appear. It holds the class while it looks, and says out loud that the figure is on the
screen and not a marker.

**Claim IDs used:** `FIC-GONZ-260` (the *Yellow Stone* carrying the army is drawn under way, amending `FIC-GONZ-200`),
`FIC-GONZ-261` (the mustang joins the quarry the map may draw, amending `FIC-GONZ-201`) and `FIC-GONZ-262` (which painted
elevation each part of the Alamo wears), all in `HISTORY.md`. **No `HIST-TEX-` claim was needed:** nothing here is a new
reading of a source. The mounted family and the seated drivers make no claim at all — they are the figures this game
already draws, doing what the server already said they were doing.

**What is not proved.** The mustang and the *Yellow Stone* have **no browser proof of their own**: both are proved only
by `npm test` and by the catalog pixels, and nobody has watched a hunt bring up a mustang or seen her on the Brazos on a
real canvas. `npm run test:hunt` still passes and still hunts a deer; **`npm run test:armies` does not run at all** — it
dies on the wagon-load screen intercepting a click, before it reaches anything about the boat, and it was doing that
before this work started. The boat's drawn height is one number and each frame is normalised to it, so her hull breathes about a tenth
as her smoke column grows — which the moored clip has always done; a `logicalHeight` for the boat sheets in
`scripts/build-atlas-manifest.mjs` is the way out and would re-measure the accepted moored art with it. Same computer
only throughout.
**The four panels the overlap study could not reach, 2026-09-21:** [FAMILY_PANEL.md §12.12](docs/FAMILY_PANEL.md).
§12.11 asked the browser what is drawn over what and **left four panels out** — `#site-choose`, `#survey-choose`,
`#encounter`, `#call-menu` — because an earlier turn of that script simply unhid them, and an empty panel has almost no
height, so it covered nothing and the run read as clean. Each is reached now in a real state with the server's own
content in it, on two classes on the real land played in process. `npm run study:overlap` reports, `npm run test:panels`
gates, both from one instrument (`scripts/support/panel-states.mjs`), at 1366×768, 1024×768 and 390×844.

- **All four were drawn over the guided start's own strip**, which §12.11 had already ruled against in words: *the strip
  stays above the dim, because it is the instruction*. The call's menu covered "Show placement controls" **outright** at
  1024 (264×94px of the strip) and two of its five points at 1366; the meeting took the middle out of it at every size
  and covered **all** of `#lesson-help` and `#lesson-action` on a phone; and on a phone `#site-choose` was drawn
  **entirely behind the strip**, while the strip covered `#survey-choose`'s own "Not now" — a panel whose one button a
  student could not press. All four take their top, or their height, from `--lesson-room` now: **0px shared, all three
  sizes.** The meeting costs about 62px of conversation on a Chromebook (520×538 → 520×476) in a panel that scrolled
  already.
- **Two things were the owner's to decide** — **decided and built 2026-09-22** (section above). (1) The **meeting and the ability bar**
  want the same pixels: 520×48px at 1366 with **14** controls wholly covered, thirteen of them the meeting's own doing
  (eight icons of the main person's work and the five controls of the docked card under it); 520×42px and **22** at
  1024, where it reaches the family's column too. It cannot be nudged — the column (316px) + a 520px meeting + the 544px
  strip is 1380px of a 1366px screen. The ways out are a shorter meeting that scrolls sooner, a bar that hides while a
  rider talks, or the §12.11 answer (cover, dim, say so). (2) The **two placement panels and the family's column** want
  the same pixels: 304px of width and their whole height at 1366 and at 1024. `#site-choose` covers **ten** controls of
  the column outright — "Hide names" and the father's and mother's whole rows — and `#survey-choose` covers "Plan a
  house". These two are the pair §12.11 excluded from the dim on purpose, because dimming the map would hide the very
  thing the student has been told to tap; moving them right fits at 1366 and not at 1024.
- **Recorded, phone only:** the ability bar's 30px bottom padding takes **three of five points, centre included**, of
  every map button (`Journal`, `Land`, `Gonzales`, `Béxar`, `+`, `−`). Found because a `force` click on "Land" inside
  this study's own instrument was swallowed by the bar and the camera never moved.
- **Evidence:** `docs/evidence/panels-browser.json` (**9 checks**, three at each of three sizes),
  `docs/evidence/panels-overlap-injections.json` (**5 of 5 caught, each by the check written for it** — three faults put
  back one at a time, plus two that make a panel *vacuous*: never unhidden, and drawn with its one button never shown),
  and the `fourPanels` section of `docs/evidence/screen-overlap.json`, `-1024.json`, `-390.json`. Screenshots
  `test-results/panels-*.png` were looked at by eye before any number was believed. `npm test` **879**, unchanged.
- **Not proved:** same computer only, headless Chrome, no LAN, no Chromebook, no touch screen, no classroom. One family
  and one seed per panel; `ceiling:` the cabin is raised and the guided start's step set in process for the stake, the
  way `test:family-commands` hands over a housed class. The two contested pairs are measured, not fixed — what is clean
  is the guided start, not the screen.
- **`npm run test:lesson` and `npm run test:relay` still pass** with these moves in. **`npm run test:travel-sight` is a
  fourth gate that was already broken** and is not this work's: it fails identically on `66dbd3e`, the tree before this,
  with *"their row on the family panel says the same: 'Not this yet. Choose a place on your own land for the house…'"* —
  the guided start's refusal reaching the row's own line. Add it to the three named in §13.5.

**The family-creation wizard as a thing on a screen, 2026-09-21:** [FAMILY_PANEL.md §13](docs/FAMILY_PANEL.md). §12.11
asked what was drawn over what on the screen a student plays the *game* on, and stopped at the curtain. The same question
of the five steps in front of it — the title, the die, the last name, everybody's first names, each parent's looks — and
of the wagon after them. `npm run study:creation` reports, `npm run test:creation` gates, both from one instrument
(`scripts/support/creation-geometry.mjs`), at 1366×768, 1024×768 and 390×844, with a family of **ten** — two parents and
eight children, the largest the twenty-sided die makes.

- **Nothing was covered and nothing was off the screen** at any size, which is the one thing that was already right.
- **The modal was not modal.** Tab walked off *every* step onto `#world-map` and, from the last name onwards, **89**
  controls of a world the student cannot see, while `#surname`, `#names` and `#looks` each told a screen reader
  `aria-modal="true"`. The world behind the curtain is `inert` now: **0** reachable, every step, every size.
- **Focus never arrived on a card.** The die disables its own button while it tumbles and a browser blurs a control it
  has just disabled, so focus landed on nothing with no way back but Tab from the top of the document. The card takes
  focus when its step arrives and is given it back whenever focus falls to nothing.
- **22 targets under 44px** at 1366×768 — the last name's box 37, the naming boxes 36, Continue 43, the wagon's `+`/`−`
  32, its stock rows 20 — and two pairs a finger cannot tell apart (6px, 4px). **0** under 44px now.
- **"Done packing" sat 771px down the wagon's list.** `#names`, `#looks` and `#wagon-load` are a scrolling list with a
  footer now; the button that ends a step and the line that announces a refusal are outside what scrolls. A *sticky*
  button was tried first and sat on top of the last child's name box — the fault it was meant to cure.
- **Evidence:** `docs/evidence/creation-overlap.json`, `-1024.json`, `-390.json`; `creation-browser.json` (4 checks over
  24 step-and-size measurements); `creation-overlap-injections.json` — **7 of 7 caught, each by the check written for
  it**. Three first read as caught-by-another-check because the harness's failure-sentence pattern was **greedy**: an
  assertion whose own sentence held a colon was recorded by whatever followed its *last* colon.
  `scripts/screen-overlap-injections.mjs` had the same latent read and is fixed with it. `npm test` **869**.
- **`npm run test:looks` and `npm run test:family` had been failing since the dim shipped this morning** and nobody ran
  them: the dim behind a covering panel is over the Journal button and Chrome refuses a click through it, which is the
  dim working. Both put the wagon away first now, the way a student does — **8 checks** and **13**. Eleven other proofs
  click `#journal-toggle` and were not run here; any that reaches that line with the wagon open has the same fault
  waiting.
- **Three gates were already broken and are still broken**, each failing identically on the tree before this work
  (`4f96879`): `test:family-panel` (*"the middle of a phone screen is not the map: DIV"*), `test:family-commands`
  (*"only 2 people could be given work; this seed was chosen for a large family"*) and `test:furniture` (times out on
  `.panel-focus[data-focus="hh-1-elena"]`). None of the three is this work's, and none was repaired here.
  `npm run test:lesson` still passes. **(All three, and `test:road`, were repaired later the same day — see *Four
  broken gates* at the top of this file. In every one the proof was wrong and the game was right.)**
- **Not proved:** same computer only; no real screen reader was run (NVDA, JAWS, ChromeVox have not been near it); the
  join form and the wagon-that-opens-by-itself are the two places focus still starts on the page itself, both recorded
  in §13.4 rather than chased. No claim ID was spent — nothing here invents anything, it is where things are drawn.

**The family's children have something to do, 2026-09-21:** [FAMILY_CREATION.md §3's amendment](docs/FAMILY_CREATION.md),
`sim/children.mjs`. The owner switched to a child on the family panel and found an empty bar: *"Children should have
action bars too. They should be able to play, and other things that kids would do."* A person under ten could do
**nothing** — the 2026-09-12 rule, working exactly as written. The owner amended the first third of it by multiple
choice, over *play only* and over *everything an adult does, more slowly*, **because an eight-year-old should not be put
on the axe or the rifle**.

- **Six works in a module of their own**, registered through `registerChores` the way `sim/camp.mjs` and `sim/road.mjs`
  are: **play** from 2; **gather kindling**, **keep the birds off the corn** and **gather the eggs** from 5; **carry
  water** and **mind the younger ones** from 7; and all six close at 10, where the family's own work opens. **An infant
  under two has nothing, deliberately.** Every threshold is invented (`FIC-GONZ-301`) against a general-frontier source
  that says "four or five" and "six or seven" and no more (`HIST-TEX-400`).
- **Two of the six produce; four do not, and each of those four says so on its own control.** The eggs put a little food
  in the house, once a day, more for an older child — `food` is the only column any of these works is, and poultry on a
  Texas farm is Holley 1836 (`HIST-TEX-401`). Minding cancels `BABY_BURDEN` on the parents while it lasts, **which
  invented nothing**: the simulation already had that effect and already had the number, and a cradle already cancelled
  it. Water, kindling and the birds add nothing: they have no column, and inventing `water` and `kindling` would be
  inventing a resource where none is needed. **The corn is the deliberate one** — a harvest that depended on a child at
  the field edge would make a child's work compulsory, which is the opposite of what was asked for.
- **Nothing takes a child off the family's own land and nothing arms them.** Every work is `where: 'home'` with no travel
  step, none costs powder, none needs the axe or the hoe, and the other two thirds of the 2026-09-12 rule stand: not on
  a road, not answering for the family, not sent to the fighting.
- **Shared files, touched as little as possible.** `sim/chores.mjs` — **three small blocks and no new import**: one
  `&& !chore.child` on the too-young refusal, one `childBar` const beside the other hoisted conditions, one term in the
  `choresFor` filter. `sim/world.mjs` — the order gate takes `childAction`, plus `childrenInvalid` on the validator.
  `sim/furniture.mjs` — one line in `mindingBaby`. `sim/lesson.mjs` — the six ids on `ALWAYS`, because a lesson that
  refused a five-year-old their hour because the house was not raised would be refusing the one thing that family member
  is for.
- **Suspected, measured, and not so** (corrected the same day, `FIC-GONZ-313`). This entry first said `advanceRoutine`
  (`sim/routines.mjs`) fed every family from its under-tens standing about, and that excluding `tooYoung` from `workers`
  would take about two food a day off most families. **Measured instead of read:** six classes of thirty families over
  three periods, every family rolled as Start rolls a class (`node scripts/biome-balance-study.mjs 6 30 3 <label>
  rolled`), with and without the exclusion — **identical to the tick**: median family short of food on 56.5 ticks,
  161 of 180 ever short, median glory 31.5, no family's result different
  ([before](docs/evidence/biome-balance-children-work-rolled-before.json),
  [after](docs/evidence/biome-balance-children-work-rolled-after.json)). **Why:** a rolled person is founded
  `task: adult ? 'work' : 'rest'` with `adult` at sixteen (`addPerson`, `sim/world.mjs`), a child under ten is refused
  the `'work'` order (`sim/world.mjs`, the `tooYoung` gate), a child's work sets `'work'` only while `chore` is set (which
  `workers` already excludes) and puts them to rest when it ends. A probe of a rolled class found all 76 under-tens at
  rest from arrival on. **The "nine-year-old worker" was the test's own:** `aged()` in `tests/children.test.mjs` rewrites
  the oldest child's age, and in both seeds that child was founded 16 or 17 and on `'work'`. The comment there now says
  so; the line it guards is still needed. **The filter was not added** — it would change nothing a class can reach.
  **Two ways a young person can still count, both left for the owner:** (1) moving the camp while somebody is mid-chore
  clears the chore but keeps `'work'` through `settle` (`sim/homesite.mjs`, marked `ceiling:`); (2) a child of ten to
  fifteen may be set to `'work'` and then counts a full food a day like a grown hand — a rule, not a leak, and
  `tooYoung` would not reach it anyway.
- **Found by the same measuring, and bigger: the balance study had never measured a family a student plays.**
  `scripts/biome-balance-study.mjs` plays unrolled founding-four families, who have no ages. Rolled (the new fifth
  argument `rolled`), the same six classes are far hungrier: median ticks short of food **56.5 against 4.5**, median
  glory **31.5 against 56**, final **32.5 against 61.5**. Every earlier balance figure from that harness in this file —
  "8.5 ticks where it was 65.5" among them — describes families nobody plays. Part of the gap may be the neighbours'
  director, which was tuned on the founding four, so this is a lead and not a verdict; **not investigated**, and it is the
  week a real class plays rolled families.
- **Evidence.** `npm test` **890**, from 880. Ten new tests in `tests/children.test.mjs`, each named for a rule and not
  an event; `node scripts/children-injections.mjs`, **24 of 24 caught**,
  `docs/evidence/children-injections.json` — two of them first read as **MISSED** and both were real holes in the tests
  (the play line was being matched against the bare *"finished:"* event every chore writes, and the replay check
  compared one hour where `Math.random()` coincides a sixth of the time; it compares four now). Three existing tests were
  updated rather than worked around: `tests/family-roll.test.mjs` held the *old* rule and now holds the two thirds of it
  that stand, `tests/chores.test.mjs` excludes `chore.child` from an adult's count, and `tests/family-panel.test.mjs`
  wanted a summary sentence and an icon for each of the six.
- **Not proved.** **No browser proof was run.** The six icons are Claude-drawn glyph stand-ins (`docs/ART_REQUESTS.md`,
  request 2026-09-21 — the children's icons) and no layout changed, but *nobody has seen a child's row render its icons
  on a Chromebook*. Same computer only; no LAN and no district claim.

**What was drawn over what, 2026-09-21:** [FAMILY_PANEL.md §12.11](docs/FAMILY_PANEL.md). Nothing had ever asked whether
two pieces of this interface land on the same pixels. `npm run study:overlap` asks the browser — for every control a
student can press it samples that control's own points and asks `elementFromPoint` what is on top — at 1366×768,
1024×768 and 390×844. Three faults, all invisible at the size the class played on until the other two sizes were asked:
the guided start covered the family's column at anything under about **1180px wide** (at a phone's width Chrome
*refused a click* on "Choose a house" through it); "Choose a house" covered the whole column — **28 controls** — while
the step's own words said to assign a family member; and the names drawn under the icons sat on the *Journal* and *Land*
buttons, and were clipped away entirely on a phone. Fixed: the strip is top right and bounded off the column, the
covering panels **dim what they cover and say so in words**, and the bar rides 30px higher while it names its icons.
Also fixed in passing: the ring pointed at the survey stake while the words said to choose a house plan (`pointedKey`
guessed among several open chores by row order — the exact fault its ranking was written to remove).

- **Evidence:** `docs/evidence/screen-overlap.json`, `-1024.json`, `-390.json` — **0 controls covered** at both desktop
  sizes. `docs/evidence/screen-overlap-injections.json` — **4 of 4 caught, each by the check written for it**, after
  two of them first read as MISSED for good reasons worth keeping: one check ran while no lesson was showing (a hidden
  strip has a box of nothing, which overlaps nothing) and one measured only the icon that happened to be named rather
  than the bar's room. `npm run test:lesson` is **20 checks**; `npm test` is **868**.
- **Two harnesses were not running at all.** `scripts/lesson-screen-injections.mjs` matched LF patterns against a CRLF
  working copy, so every injection missed — and three of its injections were still written against the `pointedKey`
  Astra replaced. Both repaired; it is **23 of 23** now. A flaky check in the lesson proof (the summary on focus, about
  one run in three) was focusing and reading in two calls with a redraw able to land between them; it reads in one now.
- **Left alone on purpose:** on a **phone only**, the docked person card covers a portrait's star. The four panels this
  study could not reach — `#site-choose`, `#survey-choose`, `#encounter`, `#call-menu` — were reached and measured later
  the same day; see §12.12 and the section above.

**The family-creation wizard's words, 2026-09-21:** the last item on the tutorial pass's own next-work list
([TUTORIAL_USABILITY_HANDOFF.md](docs/TUTORIAL_USABILITY_HANDOFF.md)), done and written up as a dated amendment in
[FAMILY_CREATION.md](docs/FAMILY_CREATION.md). The five-step order is untouched — it is the owner's. **No rule, number or
save version moved**; the one simulation change is that `grantProjection` now sends `stockChoice.herd` so the page can
print the server's numbers instead of its own. Claims `FIC-GONZ-240`, `-241`. Four faults were the point of it:

- **The title card promised freedom the server had begun refusing the day before.** *"After that the country is yours to
  work: the field, the timber, the town"* — `lessonRefusal` refuses every order that is not the family's current step,
  and the town is step 8 of 10. It now says the game walks you through the farm one task at a time and will not let you
  jump ahead.
- **The stock choice never said the family arrives with animals.** It decides a labor (177 acres) or a league and a labor
  (4,606) *and*, since 2026-09-20, a herd of six cattle and twelve hogs that feeds itself and feeds the family
  ([STOCK.md](docs/STOCK.md)). The panel had gone on offering only the acres and the two wagon spaces. This is the same
  shape of fault as the tutorial's sale that promised coin the store pays in food.
- **"Anything left out is not coming" is false**, and the item lines on that same panel already contradicted it: every
  town keeps a blacksmith selling the axe, broadaxe, froe and auger, and the store sells seed and powder
  (`sim/shops.mjs`). What genuinely cannot be bought back is the things for the house, and that is what it says now.
- **A hidden second interaction, and a hidden second screen.** A loaded thing's button read **Loaded** — a state, not an
  action — and pressing it took the thing out; it reads **Take out**. And a family with two parents met the mother after
  pressing Done with nothing having said a second screen existed; the pop-up now reads *Step 4 of 4. Parent 1 of 2. Done
  brings up the next parent*, counted over every parent so the total does not shrink.

Also: every step is numbered 1–4; the last name says it is set once and that first names are not; the names card says
every box is already filled in and an emptied box is put back rather than left showing a name nobody has; the looks
pop-up says it is chosen once and that the children are not asked for. **The die still explains nothing about the
number** — `docs/FAMILY_CREATION.md` §2 — and a test refuses the words *parent*, *children* and *lone* on that panel.

- **Evidence:** `npm test` **876 passed, zero failed** (869 before). Seven new tests in `tests/creation-words.test.mjs`,
  each proven by injecting the mistake it guards — `node scripts/creation-words-injections.mjs`, **16 of 16 caught**,
  [record](docs/evidence/creation-words-injections.json); the harness converts its patterns to the working copy's CRLF
  and throws unless each is found exactly once. `npm run test:creation` — **9 checks at 1366×768**,
  [record](docs/evidence/creation-browser.json). `scripts/creation-browser-proof.mjs` is new: it was referenced by
  `tests/creation.test.mjs` and `scripts/support/meet-family.mjs` and had never been written. Every check runs with the
  panel it measures visible and refuses an element with an empty box, and it was break-drilled three ways (the old
  **Loaded** label, an over-wide panel, a display-none step line) and failed each time. Same computer only.
- **One pre-existing red proof repaired, and it was not mine.** `npm run test:looks` had been failing since the
  panel-backdrop change of 2026-09-21: the dim over the family's column took the click meant for the Journal button.
  Confirmed by running it against the clean tree at `4f96879`, where it fails identically. The proof now puts the wagon
  panel away first, the way a student would. **8 checks pass.**

**Open, and needs the owner rather than Claude — Play Solo never packs its wagon or chooses its land.** Measured:
`wagonProjection` and `grantProjection` both send nothing once `world.status !== 'lobby'`, and `newSoloGame` opens a
Solo world `running` (the 2026-09-18 hold freezes its *clock* at tick 0, not its status). So a Play Solo player never
sees the wagon panel or the stock radios at all: they get `defaultLoad`, no herd, and **a labor of 177 acres** where a
class student may hold 4,606 — a 26-fold difference in land, decided by a screen they are never shown. That contradicts
the owner's *"the experience in solo vs live class should be the same"* (2026-09-17), but closing it means inventing a
lobby or a ready gate for a game that has none, which is a design decision. Until it is taken, the title card
deliberately does not promise a wagon step. Two smaller ones left alone for the same reason: a class whose Host presses
Start early loses the stock choice (the panel now says *when* it closes but does not warn as the moment nears, and it
vanishes rather than saying it has gone); and `stockChoice.why` is unreachable today — it is now displayed anyway, marked
`ceiling:`, so the next refusal does not arrive invisible.

**Opening tutorial usability repair:** Read [TUTORIAL_USABILITY_HANDOFF.md](docs/TUTORIAL_USABILITY_HANDOFF.md) first for the complete change list, evidence and follow-up work. The guide now chooses actions by objective, locates the correct person's control with a named button, explains placement and waiting, opens unanswered work questions, and shows completion. Map actions retain the working bare-command path and also accept chore-prefixed aliases. This corrects the older prefix diagnosis below: actual map confirmation already sent the bare action. Full suite: **868 passed**; browser guide proof: **17 checks passed**, including phone layout. The user expressly authorized changes to earlier UI restrictions.

**Mounted family cast, 2026-09-21:** The registered frontier library now contains **1,149 measured sprites across 81 sheets and 434 validated clips**. Six `people-mounted-cast*` atlases add 96 frames and 24 authored clips for all eight established identities riding the same chestnut horse east/west, south and north. Read `docs/ART_DELIVERY_2026-09-21-MOUNTED-FAMILY.md`. Wired the same day: they replaced the cropped-person-over-horse composite for all eight, which now survives only for a child on the horse.

**Mustang and Yellow Stone motion, 2026-09-21:** `wildlife-mustang.png` completes the requested wildlife with sixteen graze, alert and gallop frames. `steamboat-steam.png` and `steamboat-laden.png` complete the named steamboat's empty and army-laden underway animation states. Read `docs/ART_DELIVERY_2026-09-21-MUSTANG-YELLOW-STONE.md`. All 24 frames passed isolated alpha and retention validation. Wired the same day: the mustang grazes and is alert in a hunt, and the laden loop is the Brazos crossing; the empty-deck loop is written down as knowingly not drawn.

**Alamo elevations and wagon drivers, 2026-09-21:** `alamo-face-strips.png` supplies five historically distinct south-facing compound surfaces without changing the measured footprint or destructible wall state. `people-wagon-drivers.png` supplies sixteen wagon/ox compositing layers for the original cast in four directions. Read `docs/ART_DELIVERY_2026-09-21-ALAMO-FACE-STRIPS.md` and `docs/ART_DELIVERY_2026-09-21-WAGON-DRIVERS.md`. Both wired the same day; second-cast driver layers remain open and are named as the open request.

**Three faults the first screenshots of the guided start showed, and one the server still has, 2026-09-21 (later the same
day):** [FAMILY_PANEL.md](docs/FAMILY_PANEL.md) §12.8–§12.10. The two halves met on main; the screenshots of them together
were read back and three things on the page were wrong.

- **Two bars.** The ability bar was capped at 58rem and wrapped — sixteen icons along the bottom, three floating above and
  left of them, one of them ringed. To a student that is two bars. The row never wraps now, may use the whole width bar a
  gutter, and the icons give up a little size before anything else does; nineteen sit on one line at 48 px, 8 px apart,
  and the bar went from **9.4% of the screen to 4.8%**. The proof asserts one line **and one group of icons on the screen
  at all** — its old "nineteen icons" check passed straight through two bars.
- **The card was pushed up under the step.** The strip was counted among the controls the card must stay *above*, and it
  stands across the **top**: the card was shoved to the top of the screen and under the one thing that has to stay
  readable. The strip is **overhead** now, not underfoot, and only the part of it the card would really stand in front of
  counts.
- **The card's journey block ate the right quarter.** While a step is running the card opens **folded** — the person,
  their state and their questions — with *Going by, and the neighbours* one press away. **3.8% of the screen folded
  against 10.3% open.** Nothing is shut: `travel` is on the lesson's `ALWAYS` on purpose.
- **And the id an icon carried was not the id the server matches on.** `actionIdOf` wrote `order:<key>`, which
  `sim/lesson.mjs` never sends, so every journey, *Work about the place* and *Rest* were dimmed on **every** step although
  `ALWAYS` allows them throughout. The page spells an icon exactly as `actionId` does now — a chore `chore:<id>`, the
  three journeys all `travel` — and a test walks every shape `panelIcon` builds and holds the two to the same answer.
- **Names no longer pile up.** A family round the wagon drew four names in the same few pixels; each now steps down a line
  rather than landing on one already placed, and is left undrawn if it still has nowhere to sit (`layOutCaptions`).
- Measured again at 1366×768: **28.1%** covered in the lobby, **27.7%** with a step running and a person chosen, **23.9%**
  with a step running and nobody chosen — which is what a student who has just joined and pressed nothing sees.
  849 tests, 0 fail; **20 regressions injected into `public/lesson.js`, 20 caught**; `npm run test:lesson` 14 checks with
  four screenshots at 1366×768.

**Left open, and it is the server's: six steps name a chore in a way the gate cannot match.** `actionId` turns a student's
order into `chore:<id>`, but `STEPS` writes `'survey-plot'`, `'clear-plot'`, `'fence-plot'`, `'hunt-land'` and
`'fell-trees'` bare, so `lessonRefusal` refuses the very work the step is asking for:

| Step | `allow` has | a student sends |
| --- | --- | --- |
| house | `fell-trees` | `chore:fell-trees` |
| survey | `survey-plot` | `chore:survey-plot` |
| clear | `clear-plot`, `fence-plot` | `chore:clear-plot`, `chore:fence-plot` |
| harvest | `fence-plot` | `chore:fence-plot` |
| hunt | `hunt-land` | `chore:hunt-land` |

The survey, clear and hunt steps have no other way to be finished, so a class reaching **survey** stops there: the screen
rings the stake, the student presses it, and the gate answers *"Not yet - first, stake out a field."* `choose-site`,
`plan-house`, `place-piece` and `remove-piece` are bare correctly — they are not chores. The page reads the bare spelling
as well, on purpose, so the **screen** is already right; it needs no change when the prefix lands.

**Too fast to follow means away, 2026-09-21:** owner, after a real class played it on Chromebooks: "students saw
characters moving too fast. i thought we were going to use fog of war for that? if they're moving too fast then players
shouldn't be able to follow them until they arrive." **The decision moved to the server.** `sim/sight.mjs`
`tooFastToFollow` asks how far one tick would carry *this* traveller — their pace times the calendar (`milesATick`),
never the phase — and past `WATCHABLE_MILES_A_TICK` (**3 miles**, the same number as `ROAD_WINDOW_MILES`, which is the
stretch of road the page is given so it can draw somebody *sliding* down it between two ticks; its own `ceiling:` had
already named this bug) `sim/world.mjs` `seenTravel` projects them with **`location: null`** and a `travel` of `from`,
`to`, `distance`, `mode`, `away`, `miles`, `due` and `back` — **no points, no progress, no speed, no step**. The page
cannot draw what it was not sent, so `outOfSight`, `IN_SIGHT_MILES` and the client's own copy of the rule are gone from
`public/map-base.js`; every drawing filter is now "did the server send a place". It covers the **whole journey**, not its
middle: the 2026-09-17 rule kept 2.5 miles at each end, and at four or twelve hours a tick one tick is longer than that
window, so what a student saw was the figure appear, jump the window in one step and vanish. **Somebody who is not moving
is never away** — a rider reined in to speak (`halted`), a family bogged, waiting at a ferry or camped on the road east
(`sim/road.mjs` sets `halted`), anybody on a bank while the water is over a crossing (`waitUntil`). **The Host is
unfiltered**, as `docs/HOST_PAGE.md` says: the teacher is sent every traveller where they truly are and the class panel
still reads "Amos on the road to Gonzales" while the student's card reads "Away on the road to Gonzales · about 96 miles
off · should be there about October 8". The same words are on the family panel row (`sim/chores.mjs`) and in the page's
spoken description. **Nothing in the farming day changed** (a walk 1 mile a tick, the family horse 1.67, the ox wagon
0.65, a courier 2.6): the hunt's walk out, the arrival, a ride into Gonzales and a rider coming up to a door are all
watched end to end, and the walk of the news hour sits exactly on the line. Also fixed, found by the proof: pressing the
portrait of somebody away left the camera with nobody to frame and threw on every painted frame. **Nothing is stored and
`saveVersion` did not move.** 831 tests (+7, `tests/travel-sight.test.mjs`); **twenty-one regressions injected one at a time
and every one caught** (`node scripts/travel-sight-injections.mjs`,
[evidence](docs/evidence/travel-sight-injections.json)); browser proof `npm run test:travel-sight` — two classes, the
same person walking the same road, one at twenty minutes a tick and one at four hours, a student page and the teacher's
page on each, 12 checks and no page errors ([record](docs/evidence/travel-sight.json),
[screenshots](docs/evidence/travel-sight/)). `test:hunt`, `test:farm`, `test:crossings` and `test:solo-game` all pass
(`solo-game` on the second run; the first hit the known call-menu flake noted in `scripts/support/whole-game.mjs`).
**`npm run test:road` fails at the bog, and fails identically on a clean HEAD — pre-existing, not this work.** The rule,
the reason for the number and the ceilings are [docs/MAP_ACCURACY.md](docs/MAP_ACCURACY.md) §12, `FIC-GONZ-230` and
`FIC-GONZ-231`. **Same computer only.**

**The screen given back, and the guided start on it, 2026-09-21:** A real class played this on Chromebooks on 2026-09-21
and three things went wrong on screen. Two of them belong to the page rather than the world: [FAMILY_PANEL.md](docs/FAMILY_PANEL.md) §12,
`public/lesson.js`, `FIC-GONZ-220` to `-222`. Measured at **1366×768**, the Chromebook the school buys, by rasterising
every part of the page that paints over the map and counting the covered pixels once (`npm run measure:screen`):
**33.4% covered before, 28.3% after**, and the family column down the left **584 px → 264 px**, or **102 px** with the new
**Hide names** folded. Three of six family rows used to be hidden behind the walk-through card; all six are in sight now.

- **A person's work is drawn only while they are the family's main person**, and it stands across the **bottom middle** of
  the screen — 48 px icons 10 px apart, one line where they fit, wrapping upward where they do not, with **nothing drawn
  behind them**, because a panel across the bottom would cover exactly the ground this was meant to give back. Every row
  still holds its own icon group in the page, so a row's icons are still that person's to the page and to a screen reader;
  the stylesheet draws only `.panel-row[data-focused=true] .panel-icons`. **Nothing about which orders a person may be
  given moved**: that is still `world.household.mainId` and `applyAction`'s gate. The star moves the bar.
- **Hide names** folds the panel to a column of faces and leaves the bar alone. This is the `ceiling:` §7 wrote on
  2026-09-16, paid on the first day the covered ground mattered.
- **The guided start is the world's.** `public/lesson.js` reads `world.lesson` — `step`, `index`/`of`, `title`, `says`,
  `did`, `allow` — and **decides nothing**: no memory, no timer, no Next, so the one thing a page must never do (tell a
  student they have finished something the world has not seen) it cannot do. A strip over the top middle says the step; on
  the bar every icon `allow` does not name is dimmed and says *"Not this yet. …"* with the step's own sentence instead of
  a refusal, and the one it does name gets a ring and a caret that bobs over a button which never moves. An **empty**
  `allow` shuts everything (the step where the only thing to do is watch the wagon come in); a **missing** `allow` shuts
  nothing. The older skippable walk-through is not offered while a lesson stands.
- **Proof.** `tests/lesson-screen.test.mjs` (8 tests), `scripts/lesson-injections.mjs` — **17 regressions injected, 17
  caught** (`docs/evidence/lesson-injections.json`); `npm run test:lesson` (`scripts/lesson-browser-proof.mjs`, 11 checks
  at 1366×768, four screenshots) and `npm run measure:screen`. Suite **832, 0 fail**; `check-doc-links` 730.
- **`world.lesson` is stubbed** (`scripts/support/lesson-stub.mjs`, on the model of the weather stub) because
  `projectWorld` does not carry it yet — that side was being built in parallel the same day. What is proved is that the
  page reads the contract and adds nothing to it. `server/app.mjs` serves `/lesson.js`; no `saveVersion` moved and no
  field was invented.
- **Ten browser proofs were changed, not because they were wrong but because the interaction is:** a proof that *presses*
  somebody's icon now chooses them first, as a student does (`scripts/support/main-person.mjs`, `asMain`); one that only
  *reads* an icon's words does not, because choosing somebody starts the camera watching them, and a proof of motion would
  then be measuring the wrong thing. **Rerun and green on this build:** `test:family-panel`, `test:family-commands`,
  `test:auto`, `test:hunt`, `test:shops`, `test:farm`, and the new `test:lesson`. `test:family-commands` (23 checks) and
  `test:farm` each wanted a second run: the first hit a real-time flake of their own, a town errand that never stopped to
  ask inside four minutes and a kept-ground audit that went stale while another agent's proof had the CPU. **`test:travel`, `test:camp` and
  `test:furniture` fail - and fail identically on `68c4d56` with `public/` and `server/app.mjs` restored, so they were
  already broken before this work**: travel never samples the wagon as drawn, camp's seed deals no father at home, and
  furniture never walks `meetFamily`, so the title curtain swallows its first press. Not fixed here. `test:whole-game`,
  `test:trade-animation` and `test:winter` carry the same one-line patch and were **not** rerun.
- `stand-in:` the ring, the caret and the lesson's pips are CSS. `docs/ART_REQUESTS.md`, request 2026-09-21 — the guided
  start's marks.

**The guided beginning, the world's half, 2026-09-21:** A real class played this on Chromebooks today. It ran, and the
students **could not work out how to farm, or build a house, or do anything else.** The owner's answer is a tutorial that
is "an integrated forced part of the game... one task at a time, guided by the ui and unavoidable". Built:
[LESSON.md](docs/LESSON.md), `sim/lesson.mjs`, `tests/lesson.test.mjs` (11 tests),
[36 of 36 injections caught](docs/evidence/lesson-injections.json), `FIC-GONZ-210` to `-215`. A student's own family is
walked through **ten steps** — arrive and choose the house site, put somebody to work, get the house up, survey ten
acres, clear them, plant a crop **of the student's own choosing**, bring it in, sell it in town for coin, hunt, dig the
well — and **`applyAction` refuses every order that is not that step's**, in words ("Not yet — first, put somebody to
work."). The page greys the rest out from the same `allow` list and decides nothing: the same rule as fog of war. Each
step finishes because the world says so, each family has its own lesson and its own pace, and the Host's clock is
untouched. **No `saveVersion` moved**: `household.lesson` is absent on every class saved before, and the empty value is
worked out from what the family has — a family still coming in starts at the beginning, a family already standing on its
own land never gets a lesson at all. 824 → 835 tests, 0 fail.

**What is open on it.** (1) **The screen's half is a second agent's** and is built against the contract in
[LESSON.md](docs/LESSON.md) §3 — the card, the greying, the arrow onto the control being asked for. (2) **The browser
proofs have not been re-run against it.** `npm test` does not run them, and any proof that joins as a student and then
orders work out of the lesson's order (`test:farm`, `test:hunt`, `test:solo-game`, `test:whole-game`) will now be
refused. They need a pass once the screen's half lands; `taught()` in `tests/support/settled.mjs` is what a fixture that
is not about the lesson should use. (3) The decisions the owner may want to change are listed in
[LESSON.md](docs/LESSON.md) §6 — chiefly that **the well step stands down where the house has running water within
carrying distance**, which is the one place the built thing does not literally satisfy the owner's sentence.

**Wildlife and travel-marker expansion, 2026-09-21:** The registered frontier library now contains **1,008 measured sprites across 70 sheets and 389 validated clips**. Three new wildlife atlases add 48 animation frames and 12 authored clips for black bear, javelina, bison, pronghorn, geese and rangy wild cattle. `travel-markers.png` adds sixteen painted marker components in the principal, family, other-household and courier colors. The wildlife request now lacks only the wild mustang. Read `docs/ART_DELIVERY_2026-09-21-BEAR-JAVELINA.md`, `docs/ART_DELIVERY_2026-09-21-WILDLIFE-BISON-PRONGHORN.md`, `docs/ART_DELIVERY_2026-09-21-WILDLIFE-GEESE-CATTLE.md`, and `docs/ART_DELIVERY_2026-09-21-TRAVEL-MARKERS.md`.

**World-art expansion, 2026-09-21:** The registered frontier library now contains **944 measured sprites across 66 sheets and 377 validated clips**. New deliveries add sixteen biome/Béxar ground details, sixteen animated wild-turkey frames, sixteen researched town buildings, sixteen additional colony-tree assets, an empty/laden ferry and post, and four moored *Yellow Stone* states. Read `docs/ART_DELIVERY_2026-09-21-BIOME-GROUND-BEXAR.md`, `docs/ART_DELIVERY_2026-09-21-WILDLIFE-TURKEY.md`, `docs/ART_DELIVERY_2026-09-21-TOWN-BUILDINGS.md`, `docs/ART_DELIVERY_2026-09-21-TREES-COLONIES-2.md`, and `docs/ART_DELIVERY_2026-09-21-RIVER-TRANSPORT.md`. `docs/ART_REQUESTS.md` records the remaining gaps rather than claiming the larger biome and steamboat requests are wholly finished.

**Art production update, 2026-09-21:** The frontier library now contains **873 measured sprites across 60 sheets and 351 validated clips**. This batch closes the second cast's north/south walk and conversation poses, replaces every current family-panel placeholder with 53 named action icons, and adds authored norther silhouettes for three trees, grass, and streaming smoke. Start with `docs/ART_DELIVERY_2026-09-21-CAST2-VERTICAL.md`, `docs/ART_DELIVERY_2026-09-21-CAST2-DIALOGUE.md`, `docs/ART_DELIVERY_2026-09-21-FAMILY-ACTION-ICONS.md`, and `docs/ART_DELIVERY_2026-09-21-WEATHER-NORTHER.md`. The delivery modules under `scripts/art-deliveries/` are the source of truth for cell maps, animation names, prompts, and provenance. `node scripts/register-delivered-art.mjs` followed by `npm run build:art` reproduces the generated registry.

**Second-cast sowing and repair art, 2026-09-20:** [`people-cast2-tasks`](docs/ART_DELIVERY_2026-09-20-CAST2-TASKS.md) adds sixteen accepted transparent poses and eight authored clips for all four second-cast identities. Atlas checks: 59.6% clear alpha, zero overlap trimming, 100% retained. Library: **783 sprites, 53 atlases, 330 clips**. North/south walking and dialogue still block switching the full appearance assignment to this cast.

**The snapshot test on a barrier, 2026-09-19:** `tests/save-cadence.test.mjs` *"a page is sent a snapshot when what it sees
changed or it sent the order"* slept 500 ms after each order for a broadcast `broadcastSoon` may hold back 200 ms, and
failed once in 10 loaded full suites (*"the family that gave the order was not shown it"*). Now it waits on conditions, and
because "was sent nothing" and "was sent exactly one" cannot be waited for, each step ends on a barrier: a third family's
page opening or closing changes `connected`, which every page is sent in a later broadcast, and a page's frames arrive in
order, so what a page was sent in a step is exactly what came before that frame. The 2.5 s cap on waiting for ticks is a
30 s limit that only turns a hang into the assertion. An order shown 700 ms late (slow, not wrong) fails the old test and
passes the new one. Six regressions injected into `server/app.mjs` (sender not forced, unchanged page resent, order never
broadcast, sender sent twice, ticks held like orders, a page opening not broadcast) each failed this test and only it in its
file. Under load: 100/100 at 24 runs in parallel beside a 120-thread busy loop; 10/10 in 10 full suites run 5 at a time
beside a 24-thread busy loop. **Seen in those suites (HEAD's other tests, not fixed):** `capacity.test.mjs` *"30 HTTP
households"* timed out at its 30 s in 9 of 10, `pace.test.mjs` (HEAD's, before the fix above) 9 of 10, and this file's
*"an order is shown at once and written within the save window"* 1 of 10 (*"written before the save window"*: under load the
answer can come back after the 300 ms save timer has fired; it also sleeps `SAVE_WITHIN + 400` for the write). Other work on
the computer made these suites far slower than the pace test's (up to an hour each). No product code changed.

**The pace test on node's mock clock, 2026-09-19:** `tests/pace.test.mjs` *"slowing a class down really does slow the clock
down"* slept 400 ms and asked for four 40 ms ticks; on a loaded computer it got two or three (7 of 10 loaded full suites;
42/50 at 24 runs in parallel beside a 48-thread busy loop). Now it holds `setInterval` on node's mock clock
(`t.mock.timers`, setInterval only; the requests stay real) and moves time by hand, so the server's own interval ticks
exactly when the test says: ten ticks in 400 ms at 40 ms, none in the 400 ms after slowing to study, none at 9,499 ms, one at
9,500. The last two are new: a pace change that cleared the old timer and started none, or started it at the wrong period,
passed the old test. Four regressions injected into `setPace` (old timer not cleared, argument ignored, never restarted,
wrong period) each failed this test and only it. Under load: 50/50, and 10/10 in 10 full suites run 5 at a time beside a
24-thread busy loop. One of those suites lost `periods.test.mjs` to a libuv crash at exit on Windows
(`!(handle->flags & UV_HANDLE_CLOSING)`, `src\win\async.c`) after all its tests passed, with `--test-force-exit`, which
`npm test` does not use; not investigated. No product code changed.

**The absence test on a held clock, 2026-09-19:** `tests/absence.test.mjs`. Its server test failed once in a full `npm test`
on a loaded computer (2026-09-18): it slept 80 ms after closing the page and asserted the family was not yet absent under a
150 ms grace, and the sleep overran. Reproduced under a 120-thread busy loop at 24 runs in parallel: 98/100 and 39/40, every
failure *"marked absent inside the grace"*. Now the test holds `Date` still (`t.mock.timers`, Date only; ticks, stream and
close stay real) and moves it by hand, waiting on conditions instead of sleeps: open past twice the grace is present; the
close waited for until the Host reads *away*; 149 ms later still present after a whole tick; 150 ms absent; reopened, present
the next tick. Stronger than before (the exact boundary, and open beyond the grace). Six regressions injected into
`server/app.mjs` (`>` for `>=`, a grace 1 ms short, an open page not trusted, never unmarked, the close time not recorded,
`markAbsences` not called) each failed this test and only it. Under the same load: 100/100; in 10 full suites run 5 at a time
beside a 24-thread busy loop it passed 10/10. **Seen in those suites:** `pace.test.mjs` *"slowing a class down"*
failed 7 of 10 (fixed the same day, above) and `save-cadence.test.mjs` *"a page is sent a snapshot"* 1 of 10 (fixed the same day, above), both real-time tests of their own. No
product code changed.

**Astra's delivery of 2026-09-21, wired: eight batches that were drawn by nothing, and now are.** The nine batches that
landed while the stock was being built were registered, measured and written up, and only the 53 action icons were
actually drawn by the game. The other eight are in play:

1. **The norther is painted, not sheared** (`weather-norther`). A hard north wind now draws Astra's own gale poses and
   drops the shear with them; every lesser wind — a storm, a rainy blow, the light air of a fair day — keeps the shear,
   which is the rule the stand-in proved. `GALE = 0.62` on the smaller of *how far the norther has arrived here* and
   *how hard it blows here* (`FIC-GONZ-201`): under the 0.7 the east of the country blows in a norther and over what half
   a blend or half a fade can reach, so a **storm is never drawn as a gale** however hard it blows and the edge of a
   norther's country hands back to the shear instead of stopping at a line. Seven poses are bound, not five: `weather-norther`
   carried the broad oak, the spreading oak, the pecan, the grass tuft and streaming smoke, and `biome-ground-bexar` the
   same day carried a cane wind pose and a tall-grass one. The smoke is the only frame with no drawing site of its own, so
   it went where the map's only fire is: an army's camp fire in a norther streams instead of rising (`public/army-view.js`).
   **Still sheared in a gale:** pine, cedar, mesquite, live oak, elm, scrub, reeds, prickly pear and every sized tree — the
   row in `docs/ART_REQUESTS.md` is narrowed to exactly those, not deleted.
2. **A turkey is a picture** (`wildlife-turkey`). `quarryPoint` carries the species the simulation already chose, and the
   page draws that species or nothing: `DRAWN_GAME` is `['deer', 'turkey']` and the bear, javelina, antelope, buffalo,
   geese, mustang and wild cattle are still words only, given no place to stand rather than a deer's picture. The server
   remains the sole authority on where a quarry is; the page chooses only which sheet says it.
3. **Ten tree kinds have their own art** (`trees-colonies-2`). Post oak, blackjack, pecan, hackberry and sweetgum at
   pole/log/large; the other oaks (water, bur, white, Texas) take the post oak's rather than the generic broad oak, and
   hickory, walnut and ash the pecan's. A felled hardwood trunk is `log-fallen-hardwood`; pine and cottonwood keep
   `log-fallen`. Beech and magnolia are still the broad oak, and shortleaf and longleaf still the loblolly.
4. **The towns' researched buildings** (`town-buildings-researched`). San Felipe's Cooper & Chieves saloon and the
   Whiteside Hotel, Victoria's Round Top House and its jacal variety, Columbia's Brown house and Kelsey's store,
   Liberty's court room, Washington's two-storey frame, Matagorda's frame town, and the jacales of Nacogdoches, Goliad
   and Refugio. **Mina's stockade is one painted compound** where it was 27 `palisade` pieces and a `gate` run round a
   square, with the ground inside it still held against the filler houses. Two stand-ins in `sim/town-layouts.mjs` are
   **not** retired and say so: the Harrisburg steam mill and Nacogdoches's two-storey Stone House, neither of which this
   delivery covers.
5. **The ferry is a plank flatboat and the *Yellow Stone* is on the river** (`ferry-flatboat`, `steamboat-moored`). Every
   ferry crossing draws `ferry-flatboat` at the near landing with a `ferry-post` at each bank; the rope between them is
   still canvas strokes, because it spans whatever width the map's river is there. The *Yellow Stone* is drawn in the
   middle of the water between Groce's and Bernardo, in her cotton state while she is Captain Ross's and with her plank
   out from 12 April while she is carrying the army over, and gone when it marches east on the 14th (`FIC-GONZ-200`,
   `HIST-TEX-089`). She is **never drawn under way**: that loop is not delivered and the delivery note forbids inferring
   it. She rides on the army in the projection, so a page that may not see the army is told nothing about her.
6. **The countries wear their own plants** (`biome-ground-bexar`, twelve of sixteen frames). Tall grass on the tallgrass
   prairie and under the longleaf; cane in the canebrake and the thicket; palmetto under the Big Thicket timber; the
   thorn thicket and Spanish dagger in the chaparral, the brush and the mesquite prairie; marsh cordgrass in the marsh,
   the salt prairie and the cypress swamp; cypress knees in the swamp; dune grass on the sand.
7. **The second cast is the family** (`people-cast2-vertical`). A woman is `teal` or `indigo`, a man `elder` or `ochre`,
   an adolescent girl `blue-girl` and a boy `blue`, by the same stable hash that has always chosen a neighbour's coat —
   and **a mother who is the principal is `rust-woman`**, a woman in the principal's own colour, which is what the
   request was for and what one rust figure could not do. Both principal figures stay out of the pool, so the mark still
   means "this is you". That row is **deleted** from *Stand-ins in use*.
8. **A conversation looks like one from both sides** (`people-cast2-dialogue`). The speaking and listening frames of both
   casts had never been drawn, because only the RIDER carried a `facing` and a `speaking`: the settler he had reined in
   for stood in their idle pose with their back to him. `listeningOf` in `sim/encounters.mjs` gives that person the
   rider's own two facts reversed, and `grownClip` draws `${variant}-speak`, `-listen-n` or `-listen-s`. One thing had to
   change for it to be reachable at all: both now read **the last line that speaker said**, not the last line of all,
   because a question and its answer are one action and the rider always answers — so the asker would never have been
   drawn speaking. For the rider the answer is identical; a question and an answer share a minute, so for that window
   both figures are drawn talking, which is what a conversation looks like from across a field.

**What is measured.** `npm test` is **832, 0 fail** (824 before). Injections: **27 of 27 caught**
(`node scripts/art-wiring-injections.mjs`, `docs/evidence/art-wiring-injections.json`) across the turkey, the second
cast, the conversation, the trees, the towns, the ferry and the Yellow Stone; and the weather's own script is now **29 of
29** (`docs/evidence/weather-injections.json`), seven of them new and about the gale. Two new tests are worth naming:
*every sprite the simulation names is a frame the library actually has* — a `picture` or a `sprite` a letter out draws
nothing at all, silently, and this delivery moved about forty of those names — and *every frame of a delivered sheet is
drawn somewhere, or is written down here as knowingly not drawn*, which is the defect this whole session existed to fix,
turned into a test. Eighteen frames are on that written-down list with their reasons: the turkey's bound and display
cycles (no missed-shot and no strutting state is projected), the Round Top House's weathered variant and Liberty's side
view (one of each building), Mina's closed gate (nothing shuts it), the laden ferry (nothing says a wagon is aboard), the
two plain moored *Yellow Stone* beats (she is never simply at anchor), and the four Béxar pieces below.

**What of the delivery is still unwired, and why.** **The acequias and the brush fence** (`acequia-straight`, `-bend`,
`-crossing`, `fence-brush`). The art is registered and correct; what is missing is not a binding but a **layout** — where
each ditch ran round Béxar, which is a researched course and a claim ID, not a sprite. Inventing the lines of the Alamo
madre and the San Pedro acequia to have something to draw would be exactly the thing this project does not do, so the
row in `docs/ART_REQUESTS.md` now says the art has landed and names the layout as the open work.

**Seen and fixed in passing:** `scripts/weather-injections.mjs` matched its multi-line replacements with plain newlines
against a working tree checked out CRLF (`core.autocrlf=true`), so on Windows it threw on the first injection and had
never run here; it now matches the file's own line ending both ways. `scripts/relay-browser-proof.mjs` never made its
families, so the creation curtain stayed over the map for the whole run — every assertion passed, because they read the
projection, but nothing on the page could be clicked and the proof died at `#journal-toggle`. It calls `meetFamily` now
and passes end to end, and photographs the meeting into `docs/evidence/encounter-poses.png`.

**Browser proofs, looked at.** `test:towns` (15 checks), `test:biome-game` (6), `test:crossings` (21 shots), `test:relay`,
and `scripts/weather-browser-proof.mjs` at four zooms across ten days (40 shots, `docs/evidence/weather/`). What the
pictures show: the grass on a norther day is the painted flattened tuft streaming south, against upright tufts on the
fair day photographed beside it, under a thin blue light; a wild turkey with its blue-red bare head stands ahead of the
hunter in `docs/evidence/biome-game/quarry-turkey.png`; the Whiteside Hotel is its own broad log building with a dog-run
and two chimneys and Cooper & Chieves is a white clapboard frame beside the log town; Victoria's Round Top House is a
round drum among the jacales; Mina's stockade is one palisaded compound with its gate open and the cabin inside it; and
Lynch's ferry is a low plank flatboat at the landing with a post at each bank. Same computer, headless Chrome; nothing
here is a Chromebook or a LAN measurement.

**Performance:** `docs/PERFORMANCE_RENDER.md` has a new section and it is honest about a measurement that failed. The
gale path is *cheaper* than the shear it replaces (no `ctx.transform` pair over a pose already bent, and no clip sample
for a timber oak), and a fair day pays one `Math.min` and one `Math.hypot` a scattered thing, read off the mix the lean
was already reading. The two runs taken on this build put the **fair** day — the one doing less work — 20 ms a frame
*slower* than the norther, because the machine was running browsers and suites; no before-and-after figure is claimed
from them. What they do hold is the count that matters: **the ground is redrawn 0 to 0.2 times a second on both**, as on
every build since the kept ground was built, and there were no page errors.

**Claim IDs used:** `FIC-GONZ-200` (where the *Yellow Stone* is drawn and in which state) and `FIC-GONZ-201` (which wind
is a painted gale, and which quarry may be drawn). `HIST-TEX-300`–`-319` were not needed: nothing new about 1836 was
asserted, only where existing facts are drawn.

**A CLASS PLAYED IT, 2026-09-21. Read this before anything else.** The owner ran real students on Chromebooks. **It ran
well** - the server, the launcher and the map all held up, which is the first time that has been tested outside this
computer. Four things came back, and they are now the project's priorities, above everything in the open list below:

1. **Nobody could work out how to play.** "students couldn't figure out how to farm, or build a house, etc." The owner's
   answer: **the tutorial becomes an integrated, forced part of the game** - no freedom until the family has arrived and
   been walked through each major function, "one task at a time, guided by the ui and unavoidable", and by the end each
   student, at their own pace, has **built a house, farmed and sold a crop of their choosing, hunted, and dug a well**.
2. **The UI covered too much of the screen.** A Chromebook is 1366x768 and the panels ate it.
3. **A character's abilities must be hidden unless that character is the selected/main one**, and the selected one's
   abilities belong **bottom-middle, spaced out to maximise what can be seen**.
4. **Characters moved too fast to follow.** The owner: "if they're moving too fast then players shouldn't be able to
   follow them until they arrive" - the fog of war answer, decided at the projection rather than on the page.

**5. A student was disconnected and could not get back in**, because getting back in wanted a family key off a screen
they no longer had. **Built the same day** (see the entry below): they pick their own name off a list of the families
whose student is away. `FIC-GONZ-186`.

Four agents were set on these on 2026-09-21, each in its own worktree, with the lesson's contract fixed between the two
halves of it before they started (`view.lesson`, in the prompts and in docs/LESSON.md when it lands): **the art wiring**
(Astra's eight unwired batches), **the lesson's world side** (`sim/`), **the lesson's screen side with the UI's
footprint and the ability bar** (`public/`), and **what a student may see of somebody travelling fast**. Claim blocks:
art `FIC-GONZ-200`+/`HIST-TEX-300`+, lesson-sim `210`+/`310`+, screen `220`+/`320`+, travel `230`+/`330`+.
**WHERE THIS STOOD WHEN THE SESSION STOPPED, 2026-09-20 (evening).** Read this first; the entries below it are
finished work.

**1. Everything through the weather and the launcher is built, merged, released.** Main is green at **791 tests, 0 fail**,
`check-doc-links` 693, and the browser proofs `test:crossings`, `test:solo-game`, `test:hunt` and `test:farm` all pass on a
clean detached worktree. **The release is [v2026.09.21.4](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.21.4)** —
Astra's nine batches wired (the painted norther, the turkey, the towns' real buildings, the plank ferries and the
*Yellow Stone*, ten more trees, the second cast's walking and speaking), on top of .3's **everything the class of
2026-09-21 asked for**: the guided start (both halves), the screen given back to the game, the ability bar
bottom-middle, travellers too fast to follow going out of sight, and a disconnected student picking their own name off
a list. **866 tests, and all four agents merged.**
The previous one was [v2026.09.21.2](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.21.2)
— the cold on the road east and Astra's 53 action icons, on top of .1's stock, 09.20.7's sky in the hunt, .6's line in the river, .5's four works at home, .4's
weather proof and green plate, and .3's coast, animals, weather model, weather drawn and launcher face. Setup 191.7 MB → 212.4 MB at .3, which is the art embedded in the executable.

**2. What is left open, in the order I would take it.**
- **What is left of `FIC-GONZ-135`:** rain stopping roofing and daubing. The road, the hunt and the cold are built.
- ~~**Astra's delivery of 2026-09-21 is registered and mostly unwired.**~~ **Done 2026-09-21**, all nine batches: see
  *Astra's delivery of 2026-09-21, wired* above. What is left of it is **the acequias and the brush fence round Bexar** -
  the art is registered and correct, and what is missing is the layout, which is a researched course and a claim ID
  rather than a binding. Eighteen other frames are deliberately not drawn and are listed with their reasons in
  `tests/art-library.test.mjs` (`NOT_DRAWN`), which fails if one of them is quietly drawn after all.
- **Two crossings still graze a bank** because the road runs in the creek bottom for a stretch; the crossings audit says so
  and it is a routing decision, not a bug in the ford.
- **Two coastal cover cells are mine to look at:** `mesquite-savanna` reaching 95.01°W and `live-oak` 94.00°W.
- **Left of the bestiary:** the **predators** (not built on purpose: `FIC-GONZ-008` says there is no hidden risk to a
  person out on the land). The feral hogs arrived with the stock on 2026-09-20 - they are the hogs a family left on the
  range when it fled, gone wild in the timber (`FIC-GONZ-184`). Longleaf is still drawn at 90% timber and the hunting-wait scale is still the old one.
- **What is left of the road's hunger** after the line went in (Columbia 31 ticks, Matagorda 33, from 109 and 100.5): the
  days between the crossings, and the days the river is in flood. Both are honest, and neither is obviously wrong.
- **Weather follow-ups named by the research and not done:** the Fort Jesup manuscript daily forms (they start in the right
  month and would replace inference with observation), a *Telegraph and Texas Register* sweep, and §6.2's unsourced column.

**3. Claim numbers in use, so nothing collides:** mine to `HIST-TEX-163` and `FIC-GONZ-095`; the weather research
`HIST-TEX-220`-`238` and `FIC-GONZ-130`-`136`; the launcher `240`+/`150`+; the animals `260`+/`170`+; the weather drawing
`280`+/`190`+ (it used `FIC-GONZ-190` and `-191`); travel out of sight `HIST-TEX-330`-`339`/`FIC-GONZ-230`-`239` (it used
`FIC-GONZ-230` and `-231`, and no `HIST-TEX-330`: the paces and the day on the road are unchanged and still rest on
`HIST-TEX-093` and `FIC-GONZ-059`).

**The weather of 1835-36, built and drawn, 2026-09-20:** [WEATHER.md](docs/WEATHER.md) §10 (1,350 lines of research under
it), `sim/weather.mjs`, `public/weather-art.js`, `HIST-TEX-220` to `-238`, `FIC-GONZ-130` to `-134`, `-190`, `-191`. A day
in a region is one of five kinds — `fair`, `rain`, `norther`, `storm`, `fog` — and the country is three weathers wide
(`REGION_BOUNDS`, cut at x=55 and x=152): **cold is shared across the map and rain is not**, which is what 25 February to
1 March 1836 shows, Béxar clear and bitter while San Patricio's rain fell 120 miles off. The rain share is the month's and
the country's, anchored on the U.S. Army post surgeons' counted rain days across the Sabine for the exact months the class
runs (`HIST-TEX-234`); about two dozen dated days are written in from the record itself (`WRITTEN`), each carrying its
source's claim ID, so **the weather a class meets on the day of a battle is the weather that was there** — the Alamo siege
cold and *clear*, on Almonte's own thermometer. Each region carries a **water level that remembers**: it rises with rain
(saturating, so a flood wants days of it) and falls 0.18 a day, which is why a river can still be up under a fine warm sky.
Past `WATER_HIGH` the wade at a ford costs more and goes wrong more often, both scaled by how high the water is; past
`WATER_SHUT` (0.85) **a river's ford is shut** and whoever came down to it waits on the bank — "sudden rains made the
Medina unfordable", 21 February 1836. Measured over three classes: the water is high on a fifth to a half of days and a
ford is shut on a **median of 3 days of 210** - 19% of classes on none at all, the worst of 200 on 16, and country by
country a day in 110 in the centre - which is the shape the record has. Two numbers moved under measurement and both are
recorded in the doc: the rise saturates (straight addition shut 62 days of 210) and the wet spring multiplier came down
1.6 → 1.35 when a ten-day wet run contradicted Gray's fine mid-March. The wet spring now begins **21 March**, not 1 March;
its citation was `HIST-TEX-068` all along and my `-071` was wrong, corrected in `sim/travel.mjs`, MAP_ACCURACY and HISTORY.
The hashed `share` moved to `sim/shares.mjs` to break the cycle `scrape`→`ways`→`weather`→`scrape` (`scrape.mjs`
re-exports it). **No `saveVersion` moved**: a class saved before this opens on the weather its own seed always implied.
**And none of it is written down for the student.** The owner: *"Weather should be a visual thing… Players should see the
weather. If implemented correctly, no text should be required."* So it is drawn — rain over a country gone flat and grey, a
norther as a lean in the trees and the grass with dust and leaves streaming north to south and the light gone thin and
blue, a storm with lightning banked in the far sky, fog lying in the bottoms until half past nine, and a river past the
shut line drawn brown and out of its banks with drift on it. The three regions blend over eighteen miles rather than
switching at a line. 18 new tests, **22 of 22 injections caught**, ~1 ms a frame worst case (`docs/PERFORMANCE_RENDER.md`),
33 screenshots under `docs/evidence/weather/`. `FIC-GONZ-136` (a line a day, in words) is marked **superseded, not built**,
and WEATHER.md §10.6 says why. Same computer only.

**The weather model's own proof, 2026-09-20:** `tests/weather.test.mjs` (9 tests), `scripts/weather-model-injections.mjs`,
`docs/evidence/weather-model-injections.json`. The model shipped read by the road, the wade and the drawing, each with
tests of its own, and with none of its own behaviour held down: `CLAUDE.md` says a test is not evidence until the
regression it guards has been injected and seen to fail. Nine tests now hold the record's own days (every row of
`WRITTEN`, on three classes, with the claim each carries), that cold is shared across the map and rain is not, that the
rain share is the month's and the country's (checked against `RAIN_SHARE` itself over 60 classes of January - the one
month the record writes nothing into), that a river falls exactly `WATER_FALL` on a dry day and can stand up under a fine
sky, that the rise saturates, that the wet spring begins on 21 March and the middle of it stays fine, that a class
replays and that its rain does not run in streaks, that a place reads its own country through `weatherAt` on a real
class, and that a fog wants a wet day behind it while a norther does not come in July. **27 regressions injected, 27
caught.** Writing them found two faults, both fixed here: **a norther could only carry its rain where it began**, so in
two hundred days no norther ever reached the east wet - it is the day the front *arrives* that can be wet, which in the
east is the day after - and my own first draft of the seasonal test counted summer over a class that never reaches May,
which is a test that checks nothing. The measured shut-day figure is corrected everywhere it appears: not "0 to 4 days of
210" from three classes but a **median of 3 over 200 classes**, none at all in 19% of them and 16 in the worst. 800
tests. Same computer only.

**Coming back without knowing anything, 2026-09-21:** `server/app.mjs` (`/api/away`, `/api/claim`),
`tests/rejoin.test.mjs`, `FIC-GONZ-186`. A class ran and **a student was disconnected and could not get back in**: the
way back wanted the eight-letter family key, off a screen they no longer had. A school Chromebook is often a guest
session that keeps no cookie, and a twelve-year-old has no id, no key and no way to know either. The owner, asked how
it should work, chose **"pick yourself from a list"**. So: with the class code - the same door a join goes through, and
it is on the Host's screen - a device asks for the families **whose student is away**, each named by the name that
student typed ("Ana - the Beeson family"), and taps its own. The family moves to that device exactly as the key path
moves it, the old device is signed out, and **the Host is told on the class's public record**: "Ana came back to the
class on another device." What guards it: the class code; the same five-tries-then-thirty-seconds cooldown a guessed
key meets, now shared by all three doors; and **a family somebody is playing is never listed and can never be taken** -
the key path's own refusal, in the same words. `ceiling:` a student in the room can pick up a classmate's family while
that classmate is away, and what stands against that is the teacher seeing it happen rather than the server refusing
it - naming each family's own student is what makes the list usable by a child. 827 tests; 11 regressions injected, 11
caught, and two of those were only caught after the test was made to try claiming without the code and to work through
wrong codes until the door shut. **The student's side of it is the screen agent's**: it owns `public/`, and has been
sent the contract.

**The cold, 2026-09-21:** [WEATHER.md](docs/WEATHER.md) §10.5, `sim/scrape.mjs` `COLD_WEIGHT`, `sim/routines.mjs`
`coldAtHome`, `tests/cold.test.mjs`, `FIC-GONZ-135`. The last unbuilt row of the weather, and the only place the record
puts it: Harris's Runaway Scrape, where "many persons died" of "**disease, cold, rain and hunger**". A norther now
**doubles a person's weight in the day's sickness**, exactly as hunger already did and by the same hashed share, and it
reaches **only somebody the cold can get at** - on the road east, or camped on their own land with no roof up. A family
in its own cabin is cold and nothing more, which is the line the claim draws and the reason a roof is worth having
before the winter. **Rain is left out on purpose**: a wet day on the road is already the mud and the bog, and doubling
the sickness for half the spring as well would make the road a lottery rather than a journey. **Measured** over a class
of twenty run to the end: fourteen families met a norther on the road, five people fell sick on it, **nobody died of
it**, and the cold at home fired not once - by the northers every family had its cabin up. **The rule is a function now** - `sicknessWeight` and `coldSky` - because the first draft of
its tests asserted that the cold *happened* rather than that it made a difference, and of twelve injected regressions
caught four. Rewritten against the rule itself: 11 of 12 caught, and the one that is not is marked unfalsifiable in the
script (a family in the first days of its flight is still in the country it left). **Two faults the injections found:**
the cold at home was scaled by the tick's own minutes *and* rolled once a day, which made a family under canvas about
seventy times safer than one on the road in the same weather - forty days of northers over a class of twenty cost
nothing at all - and two guards turned out to be belt and braces, which is now said in the code rather than guarded by
an injection that cannot fail. **Three test fixtures had to be mended**, all the same way: `tests/camp.test.mjs` wanted
five *well* men in five families, and `tests/alamo.test.mjs` picked the first grown person of a Gonzales family and got
a sick man's wife, refused for being a woman. The road's cold leaves a few of any class laid up, so those fixtures name
what they actually want - a man who may ride - and the Alamo's own assertion is now that the family cannot see the
**death**, not that the man is well. Same computer only.

**An art delivery that rode in on the stock's commit, 2026-09-20:**
[ART_DELIVERY_2026-09-20-CAST2-TASKS.md](docs/ART_DELIVERY_2026-09-20-CAST2-TASKS.md),
`public/assets/frontier-v1/atlases/people-cast2-tasks.png`. Astra's second-cast sowing and repair poses - sixteen
transparent frames for `rust-woman`, `indigo`, `ochre` and `blue-girl`, a two-frame sowing cycle and a two-frame repair
cycle each, 59.6% transparent, eight authored clips. It was registered on disk earlier in the session and never
committed, and `git add -A` swept it into the stock's commit (`fd94446`), whose message says nothing about it. **Said
here rather than rewritten**, because the commit is pushed. The library now holds 783 sprites across 53 atlases and 330
clips; **still open:** second-cast north/south walking and dialogue.

**The family's own stock, 2026-09-20:** [STOCK.md](docs/STOCK.md), `sim/stock.mjs`, `FIC-GONZ-180` to `-185`. Owner,
asked what stock should do: *"a herd that feeds you, **and the stock can be lost**."* Until this it was a boolean chosen
in the lobby that decided the size of a land grant and **nothing else**, in a country Almonte counted **75,000 cattle
and 110,000 hogs** in - and the biome study had found **0 of 180 families with any stock at all**. Now: a herd of
**6 cattle and 12 hogs** that **costs nothing to keep** (Holley: "the pasturage is sufficiently good to dispense with
feeding live stock"), calves in the spring and farrows on the autumn mast, and can be killed - **a beef is 40 food of
which a family keeps 15 and the rest goes to the nearest families, because it cannot be kept** ("when one man butchered
a beef, he divided with his neighbors", and both records say so), while **a hog is 12 and all of it keeps**, salted
down, which is why the colonies ran two hogs to every cow. And it is lost: a herd nobody rides after strays every month,
and **the flight east leaves the whole herd on the range** - fifteen of twenty families left six or seven cattle and
twenty-two hogs standing there. A family that comes home finds half the cattle and a quarter of the hogs, **and the
hogs that lived have gone wild in the timber**, which is where the bestiary's feral hogs come from. Families nobody play
now drive stock in at three in four and keep a breeding herd. **Measured**, six classes of thirty over three periods:
food and the final number barely move (hungry ticks 5 → 4, final median 60.5 → 61.5) - but **the land does**: sound logs
within reach go 2,127 → 13,690 and the families that must fetch logs 16 → 2, because three families in four now hold a
league and a labor rather than a labor. **That is the 1825 law's own rule being exercised for the first time**
(`HIST-GONZ-036`), and it is written down in STOCK.md §4 rather than buried; two tests that are about a family short of
timber now say "no stock in this class" out loud. **A latent bug it exposed and fixed:** `burnFarm` set
`household.stock = false`, which `grantInvalid` forbids - it had never run, because no director family had ever had
stock. 820 tests; 26 regressions injected, 26 caught, and four of those were only caught after the tests were made to
require a neighbour near enough to share a beef with, to bound the increase to a season's, and to check the pork
actually arrived. Same computer only.

**The sky in the hunt, 2026-09-20:** [WEATHER.md](docs/WEATHER.md) §10.5, `sim/hunting.mjs` `HUNT_WAIT` and `powderDamp`,
`tests/hunt-weather.test.mjs`, `FIC-GONZ-135`. The weather shipped reading through to the road and the river crossings
and **not to a family's own work** - the sky meant nothing to somebody standing on their own land. Now: the **wait
downwind takes the sky as well as the ground** (×1.5 rain, ×1.8 storm, ×1.4 norther, **×0.6 fog** - the one kind of day
that is good hunting weather, because the approach is hidden), and a **damp charge costs the certainty that waiting
buys** - on a wet day the close shot wants the steady hand the long shot wants, or a rifle the gunsmith has put in order,
so **the knack is what keeps your powder dry**. The family is told which fault it was ("his powder had taken the wet and
the rifle would not fire", not "fired and missed"). **No die in any of it**, and the control says the sky before anybody
is sent: `skyWords` reads the wait off `HUNT_WAIT` and the powder off `rainingAt`, so the words cannot drift from the
numbers, and the shot's own question and its `wait` note change in the rain. **Measured**, six classes of thirty over
three periods: a hunt takes **5.89 ticks a shot against 5.17**, about **0.73 charges a class take the wet**, the median
family's hungry ticks move **4 → 5** because the four gathering works absorb it, and the final number, the glory and the
houses do not move. **One thing the measuring found and fixed:** `scripts/biome-balance-study.mjs` counted misses by the
words " fired and missed ", so a damp charge dropped silently out of the count and the hunt looked as though it had got
*easier* on the day it got harder; it counts both now and tells them apart. 813 tests; 20 regressions injected, 20
caught, and two of those were only caught after the tests were made to read the wait through a real hunt rather than off
the table. Same computer only.

**A line in the river on the road east, 2026-09-20:** [ROAD_EAST.md](docs/ROAD_EAST.md) §3, `sim/road.mjs` `fish-road`,
`FIC-GONZ-178`. The hole the gathering study measured the same evening and could not reach: the camp hunt wants powder
and the trade among the camped families wants coin, so **a family that fled with neither had no way at all to eat**, and
that is where Columbia's and Matagorda's hunger actually was - not on their farms. At a crossing or at a refuge (the
family is standing at the water, and every refuge the flight makes for is on a river) two hours with a line brings back
**2 food** for nothing at all. Two and not three, which is what the same hours bring at the family's own creek: five
thousand people were camped on the same bank. **Refused while the river is over its banks** - Dilue Harris's flooded
Trinity, drift wood "as far as we could see" and the families in the bottom that night "without fire or anything to eat",
is why they were hungry and must not also be where they are fed - but **a river merely up is still fished**, because the
flight is in the wet spring and a line that shut with the water would be shut exactly when it is wanted. The director
uses it after the camp hunt and before the trade. **Measured**, six classes of thirty over three periods: Columbia
**109 → 31** hungry ticks, Matagorda **100.5 → 33**, Gonzales 52.5 → 6, the median family 8.5 → 4 - and the final number,
the glory and the hunting **do not move at all**. 809 tests; 11 regressions injected, 11 caught, and two of them were
only caught after the test was made to assert what its own comments already claimed (that the line is refused out on the
road between rivers, and that a river merely up is still fished). Same computer only.

**What a family ate between deer, 2026-09-20:** [BIOME_GAMEPLAY.md](docs/BIOME_GAMEPLAY.md) §10,
[BIOMES.md](docs/BIOMES.md) §17.3, `sim/gathering.mjs`, `FIC-GONZ-173` to `-177`. The owner, asked which of the
bestiary's unbuilt list to take: **"all three"**. So the game now has the food the record is full of and it had no idea
about. **Take small game** is an hour in the timber with the rifle: one shot, two food, and the knack the long shot wants
is **not needed for it** - which is who the record has bringing it home ("venison, *and small game*"). **Fish the creek**
wants water that runs all year within three miles: two hours, three food, no powder, no tool, no knack. **Gather
oysters** is the coast's alone - the biomes' own salt prairie and dunes - two hours and three food for nothing at all.
**Cut a bee tree** wants timber and the axe: an afternoon and four food of honey. Four rules hold them together: **the
country decides** (the bee tree is open to 95% of families, the beds to 6%, and no family inland is ever shown one),
**nothing can go wrong** (the hunt can miss and these cannot), **none wants the knack**, and each is a **walk** out over
the family's own ground rather than a journey down a road. Small game is deliberately not a quarry in `GAME`: putting a
squirrel in the draw would have taken places from the deer and made the long hunt worse, which is the fault
BIOME_GAMEPLAY §9.4 named when it declined to build it - the deer's draw is untouched and its tests pass unchanged. And
`killYield` takes the month now: in December, January and February a **turkey is worth half as much again and a deer a
quarter less** (Kuykendall, 1822: "The deer were lean but the turkies were fat and fine"). **Measured, six classes of
thirty families over three periods** (`scripts/biome-balance-study.mjs`, before/after in docs/evidence): the median
family is short of food on **8.5 ticks where it was on 65.5**, food in hand 37.4 → 40.6, shots fired 10.3 → 6.5, ticks
spent hunting 57.6 → 33.8, and **the final number moves by less than a fifth of a point** - it fed people without
inflating the game. The families nobody plays fall back on these works too, one person at a time, which is the answer to
the fault §5.2 measured on 2026-09-19: a family that fired its last shot in November used to sit at no food for the rest
of the class. **What it does not reach, and it is written down rather than averaged away:** Columbia and Matagorda barely
moved, because their hunger is the **flight east** and not the farm - all four works are done at home. 807 tests, 22 of
22 injections caught, `npm run test:hunt` passing. Same computer only.

**The plate that says you are current, 2026-09-20:** `launcher/PlateArt.cs`, `launcher/LauncherForm.cs`, the owner's
`button-up-to-date.png`. The last of the ten plates to be wired. A check the teacher asked for that finds nothing now
wears the green badge with the tick, and **after four seconds the button goes back to the ordinary "Check for updates"
slate** - the owner: "After an appropriate amount of time, it should go back to default." The quiet look on the way into
the launcher still says and shows nothing, because a teacher opening this two minutes before a lesson did not ask. The
badge never covers the amber one: if an update is waiting, or turns up while the green badge is on screen, the news
outranks the reassurance and the badge leaves the amber plate alone. The plate is cut to its own alpha (1881 x 836,
RGBA, box measured off the file at 14,108,1849 x 591) exactly as the amber badge is, so nothing is keyed out of it. One
fault fixed on the way: the column's worst-case height counted whichever plate `_updates` happened to be wearing, so the
**whole column resized the moment a badge appeared**; both badges are now counted at their tallest and nothing moves.
Evidence, photographed off this machine with the branch forced and the exe standing in a staged installation:
[launcher-up-to-date.png](docs/evidence/launcher/launcher-up-to-date.png) with the badge up, and
[launcher-up-to-date-after.png](docs/evidence/launcher/launcher-up-to-date-after.png) six seconds later with the slate
plate back. Same computer only.

**The launcher's face, 2026-09-20:** `launcher/TitleScene.cs`, `launcher/PlateArt.cs`, `launcher/SceneControls.cs`, the
owner's painting and ten plates under `launcher/art/`. It registers **no claim ID**: nothing in it is a statement about
1836, and the reserved `240`+/`150`+ block went unused. The window is built around the
owner's title painting with the cast plates as its buttons, and it **scales to the monitor** rather than to a fixed size
(the owner, on an early build: "Looked better when it was bigger"). A button that does not apply is **not there** rather
than greyed out, and appears when it means something — the owner asked for that directly. The art is an
`<EmbeddedResource>` because the launcher publishes `PublishSingleFile`/`--self-contained`; that is the 20.7 MB the setup
gained. Two real bugs were found and named on the way: the stop sign went **see-through** because the darkest reds of the
sign sat under the black-flood threshold that makes a plate's background transparent, and the **error dialogs the owner
kept dismissing** came from `ApplyFonts` disposing `Control.DefaultFont`. `button-update-available.png` is wired to the
updater's "a newer build is waiting" state; **`button-up-to-date.png` is on disk and not wired yet** (it should show after
a check finds nothing and go back to the ordinary plate after a moment). Because `Updater.cs` downloads the release's
`TexasRevolutionSetup.exe`, runs `--extract` and swaps the running exe aside, **an existing install gets this new face by
pressing the launcher's own update button** — no reinstall. Evidence: `docs/evidence/launcher/launcher-running.png`.


**The coast filed right, 2026-09-20:** [BIOMES.md](docs/BIOMES.md) §16, `FIC-GONZ-095`. The biome critique's eighth
finding, taken next by the owner: the Nueces line asked one question of a cell - which side of the river it lay - so every
LANDFIRE thornscrub setting north-east of it was drawn as mesquite savanna wherever it stood, including the humid Gulf
coastal prairie at Matagorda and Harrisburg and the barrier islands. The coast of 1836 was tall grass to the water
(`HIST-TEX-096`, `HIST-TEX-097`); the brush came with the overgrazing after. A mesquite or chaparral setting in EPA 34a or
34c is coastal prairie now, and in 34g, 34h or 34i saline prairie; 33b and 34b keep theirs, which the research contemplated
and said so. Measured by decoding the grid before and after: **127.0 square miles moved** - 106.6 to coastal prairie, 18.9 to
saline prairie, 1.5 of chaparral - and nothing else in it. `colonies-woods.*`, `colonies-land.*` and the country outside the
box were rebuilt (78 s for the outside; the raw data is at `C:UserszachwTexasData
aw`), so the ring of the box's own
classes at the outside's edge still matches, and their hashes in `tests/map-outside.test.mjs` carry the reason. No save
version moved. `tests/biomes.test.mjs` holds the rule for each ecoregion and one of the cells it moved. `npm test` 772. The
animals themselves - whether an antelope belongs anywhere near the colonies at all - are a separate session's. Same computer
only.

**The town fields cut to the record, 2026-09-20:** [BIOMES.md](docs/BIOMES.md) §15, `HIST-TEX-203`, `HIST-TEX-204`,
`FIC-GONZ-062`. The biome critique's largest finding, put to the owner by multiple choice and answered *cut them to the
record*: the map laid **twenty square miles - 12,768 acres - of solid field round Béxar**, three and a half times the 3,500
acres the seven acequias watered at their height and two and a half times what had been tilled in the whole county by 1850,
in a county still three-quarters prairie in 1858; and **0.7 mile of field round each of sixteen other towns, 985 acres
apiece**, at villages of a dozen to fifty cabins whose one street still had the stumps in it in February 1836. Béxar's band
is now a fifth of a mile either side of the river (0.12), San Pedro Creek's 0.08, the Alamo's quarter mile, each mission's
0.15: **5.5 square miles, 3,520 acres**, against the record's 3,500. Every other town's ring is **a quarter mile**, about 130
acres - which is what [COLONIES.md](docs/COLONIES.md) §5.2 asked for in the first place. A mile east of the Alamo is
tallgrass prairie now. `public/terrain/colonies-woods.*` and `colonies-land.*` were rebuilt from the raw LANDFIRE and EPA
data (still on disk at `C:\Users\zachw\TexasData\raw`, 4.6 GB, listed in `docs/evidence/outside-data.json`), and their four
hashes in `tests/map-outside.test.mjs` are updated with the reason. **No save version moved and no felled tree is lost**: a
patch that was field had no trees in it to lose, so the change only puts trees and game back. Measured on six classes of
thirty over three periods, same seeds: **178 log houses and 2 jacals**, nobody left unable to build; ticks short of food
67 → 65.5. `tests/biomes.test.mjs` holds both facts now - the fields at the Alamo, and the prairie a mile east of it. Checks:
`npm test` 772, `test:biome-game`, `test:farm`, `test:hunt` and `test:alamo`, and twelve shots in
`docs/evidence/biomes/fields-after-*.png`, looked at. `ceiling:` the fields are still a class with no trees and no game, laid
by a rule rather than a survey, and the acequias are still not drawn. Same computer only.

**A ford is a wade now, and the water can be up, 2026-09-19:** [MAP_ACCURACY.md](docs/MAP_ACCURACY.md) §10.7,
`FIC-GONZ-094`. The owner asked in play - *"to ford a river, shouldn't characters have to wade?"* - and chose by multiple
choice: a wade that can go wrong, and high water costing more. A ford cost nothing at all until now; only a ferry's hour was
paid. A river's ford is twenty minutes on foot, fifteen on the horse, forty with the ox and wagon, a creek's a quarter of
that, laid into the pace of the road as the ferry's wait is, so a class plans for it and the travel control says so. A bridge
still costs nothing. On a day it rains the water is up: the wade takes three times as long, the family is told at the water,
and one crossing in four goes wrong - *"swept off the crossing and had to go up the bank to find a place to get over"* - for
an hour more and a tired traveller. The share is hashed from the class, the person, the crossing and the day, so a class
replays the same. The army's dated camps, the word's relays and the Runaway Scrape's own flooded waits are untouched.
**Two things in the weather had to be mended for this to be honest:** the rain share was one day in two all year, which is the
*spring* of 1836 and far too wet for the autumn a class opens in (March and April keep it; the rest of the year is one day in
five, `RAIN_SHARE_ORDINARY`), and the day was hashed straight into `share`, which is FNV-1a and runs in streaks - one class
had twenty rainy days together, another none in its first twenty - so the day is mixed before it is hashed. Neither showed
while only the wagon's bogging read the weather. Measured over thirty families: the median family's way to town crosses **no
ford at all** and the worst crosses four, twenty-five minutes on a journey of nearly three hours; a long road like Liberty to
Gonzales wades fifteen. `tests/crossings.test.mjs` +1, proven by five injections
([wade-injections.json](docs/evidence/crossings/wade-injections.json)). Three tests changed with it: the ferry test takes the
fords' wade off before it measures the hour, the ways test measures the going against the road without its waits (a way
across country may miss a ford, which is a saving and not a fault), and the host-view test now asks whether a trader keeps a
shop rather than matching the shape of their id - Marta Ibarra's is `town-ibarra`, and the old pattern passed only by luck of
which family dealt when. `npm test` 772. Not done: nothing a traveller carries is lost in a bad wade, nobody is turned back
to the near bank, and every ford of a kind wades alike. Same computer only.

**The crossings audited, and two rules of placement mended (2026-09-19).** Owner: *"go through all of the bridges and fords.
ensure that they're actually placed correctly so that they cross the rivers."* Every crossing was checked against the built
map by a script that is part of the repository now - `node scripts/crossings-audit.mjs` (`--flagged`, `--json`, `--region`) -
which asks of each whether it stands on the water it names, on its road, and whether the road goes bank to bank through it
rather than along it; the table is [audit.txt](docs/evidence/crossings/audit.txt). Forty-three were looked at on the page
(`node scripts/crossings-browser-proof.mjs --audit`, shots in `docs/evidence/crossings/audit/`, read by eye). Two faults, both
in `scripts/build-colonies-map.mjs`: a crossing was the **middle** meeting of a chained run, which on a road laid along a creek
bottom is a graze - the ford on Brushy Creek stood on a meeting of three degrees with one of ninety a third of a mile off -
and is the **squarest** meeting now, moving nine fords 0.17 to 1.16 miles; and a meeting inside the last twentieth of a mile of
a drawn line is the road passing the water's **head**, so two fords on the tips of Bear Branch and East Branch Mad Island
Slough are gone. Every road, every crossing window and all 561 watercourses came through byte for byte; `saveVersion` is not
bumped. `tests/crossings.test.mjs` +3, each proven by injection (`docs/evidence/crossings/audit-injections.json`), and the six
that were there still prove out. Written up as [MAP_ACCURACY.md](docs/MAP_ACCURACY.md) §10.6, claimed as `FIC-GONZ-110`; **no
1835 source was read for this pass and it makes no historical claim**. After the merge with the places past the box the audit
reads 125 crossings in the box, 2 flagged and 0 uncovered; the six crossings outside the box are set aside, checked by their
own test. Left standing with `ceiling:`: two crossings are still a graze because the **road** runs in the creek bottom (a
routing decision - a creek cell costs a quarter mile of extra effort - and its own pass), and 86 degenerate two-point
watercourses no crossing depends on.

**The biomes criticised, and two things mended (2026-09-19).** Owner: criticise the biomes brutally and improve them. The
criticism is [BIOMES.md](docs/BIOMES.md) §14 and what it changed in play is [BIOME_GAMEPLAY.md](docs/BIOME_GAMEPLAY.md) §8.
Two faults were the same fault twice - the research wrote a rule and the build shipped something else. §7.1's quarry column
carried geography ("wild cattle and mustangs west of the Lavaca", "bison north and west of the Colorado") and lost it when the
column became a flat array of ids, so 170 of 447 autumn prairie kills were a wild cow or a mustang inside the Austin colony
and every coastal-prairie place had a one-tick duck hunt forty miles from water; Woodman's own next sentence, on the page the
registry already quotes, says the wild horses were "not numerous" within the settlements. A quarry carries a country now as
well as a cover and a season (`HIST-TEX-200` to `-202`, `FIC-GONZ-120`): buffalo, mustang, wild cow, antelope and javelina
west of the Lavaca as the map draws it, ducks and geese within a quarter mile of water, the buffalo's months October to April.
And §4.6 measured Harrisburg as the test its creek rule had to pass - "the strip must not simply be removed" - then chose a
width that took Harrisburg to 5 in 100 timber where the 2016 grid had 13, with six running bayous through it: a running creek
big enough to carry a name keeps a belt 0.14 mile either side through the plains now, never in the Hill Country
(`FIC-GONZ-121`). Measured on six classes of thirty, same seeds: wild cows 42 → 6, mustangs 54 → 6, winter ducks 132 → 72,
deer 564 → 696, food a hunt unchanged; median sound logs within a mile 1,574 → 2,116, families under a cabin's fifty logs
29 → 21, houses the same to the family. No terrain file was rebuilt and no save version moved. 23 injections, 23 caught;
`test:hunt` now passes in full. **Left named and not mended, worst first:** twenty square miles of `fields` round Béxar and
0.7 mile round every other town, three to four times any documented acreage (`HIST-TEX-203`, `-204`) - mending it wants
`colonies-woods.*` and `colonies-land.*` rebuilt, and "clear them to fields" was the owner's own choice, so it is the owner's
to reopen; LANDFIRE thornscrub filed as mesquite prairie inside the humid coastal prairie and on the barrier islands; longleaf
savanna drawn at 90 in 100 timber; a hunting-wait scale on which 15 of 26 stands are indistinguishable; and §6.2's "1836
expectation" column, for which no published figure was found in any source searched. Also flagged for checking before it is
quoted to a class: the phrase `HIST-TEX-110` gives as Woodman's, "having all the streams skirted by timber", was not found in
a full-text pass.

**The places past the box, and Robbins's ferry, 2026-09-19:** [MAP_ACCURACY.md](docs/MAP_ACCURACY.md) §11,
`HIST-TEX-158` to `-163`, `FIC-GONZ-093`. Owner, by multiple choice: the places past the old box. **Inside the box:** the
Trinity could be crossed only at the Atascosito crossing above Liberty, so the road from Washington to Nacogdoches was laid
the length of the river and back - 199.3 miles. Robbins's ferry, the Old San Antonio Road's own crossing at the 1936 marker,
is a window of the Trinity now and that road is **141.6 miles**. **Outside the box:** Matamoros, San Patricio, Laredo, the
Presidio del Río Grande and Gaines's ferry stand where the record puts them, with five roads - Urrea's up from Matamoros, the
Camino Real from Goliad by San Patricio to Laredo, the Camino Real from the presidio over Paso de Francia to Béxar, and the
Old San Antonio Road east to the Sabine - and their crossings: Paso de Francia, the ferry at Matamoros, the crossing at San
Patricio, Gaines's ferry, and the fords where the Camino Real comes down to the Nueces and the Frio. A road outside is kind
`outside` and a place kind `distant`: `walked` (sim/colonies-map.mjs) keeps every one of them out of `findWay` and
`findPath`, so nobody walks to Matamoros, no rider carries word to Laredo, and no shop, refuge or express stop moved. A
distant place is drawn as its name only - the library has no art for a Mexican town, and the request is in ART_REQUESTS.
**Two faults this turned up, both fixed:** a family's lane was laid over the easiest ground *after* the river check, so it
could swing across a meander and back (found at Liberty, where the family could then not choose its own house site); and the
region framed itself on every site, so Matamoros would have shrunk the colonies to nothing - the outside country is drawn
where it is and never frames a view (found by `node scripts/map-outside-browser-proof.mjs`, which failed on it and passes
now). The map was rebuilt (its hash in `tests/map-outside.test.mjs` updated with the reason); no save version moved.
`tests/crossings.test.mjs` +1 and `tests/colonies-map.test.mjs` amended, proven by four injections, each rebuilding the map
and putting it back byte for byte ([evidence](docs/evidence/crossings/outside-injections.json)). One test changed: the
old-map camp test times the march from the man's arrival event, because a man who reaches Harrisburg in the hour the army
marches on follows it the same tick and is never seen standing there. The whole-game proof presses the "!" again when the rider
who brought the word is still standing there and its conversation opens before the call, as a student would. Checks: `npm test` 766, `npm run test:crossings`, the
map-accuracy and map-outside proofs. Not done: Fort Lipantitlán, Burr's ferry, Niblett's Bluff, Laredo's own crossing of the
Rio Grande, and art for a distant place. Same computer only.

**Beeson's bank and the Atascosito road's own crossing, 2026-09-19:** [MAP_ACCURACY.md](docs/MAP_ACCURACY.md) §10.1,
`HIST-TEX-156`, `HIST-TEX-157`. Owner, by multiple choice: Beeson's bank next. Beeson's crossing stood at Columbus's official
point, which is on the *Gonzales* side of the river the map draws, though Houston's army "camped on the east bank of the
Colorado River opposite Beason's crossing" (the 1993 marker in Beason's Park). Its place now stands at that marker, 0.31 miles
south-east and over the water, so the camp of March 19-26 is on the east bank and the road from Gonzales crosses by the ferry
to reach it. The Atascosito road went over at Beeson's; its own crossing was nine miles below Columbus at 29°40' N, 96°27' W
(TSHA), which is now a place of its own - *The lower Colorado crossing* (`lower-colorado-crossing`), a ford at the river
nearest that point, opened as a window of the Colorado - and the road from Victoria goes over it to San Felipe. Beeson's keeps
its road east as **The mail road by Beeson's**, mail route 13 of 1835 ("San Felipe, by Beason's and Daniel's, to Gonzales",
`HIST-TEX-146`), the way the army took on March 26-28. `public/terrain/colonies-map.json.gz` was rebuilt (its hash in
`tests/map-outside.test.mjs` updated with the reason); 51 roads where there were 50, and nothing else moved. No save version
moved: a class saved before keeps its own map. `tests/crossings.test.mjs` +1, proven by three injections, each of which
rebuilt the map and put it back byte for byte ([evidence](docs/evidence/crossings/beesons-injections.json)). Checks: `npm test`
765, `npm run test:crossings` and the map-accuracy proof. Same computer only.

**Fords, ferries and a bridge wherever a road meets the water, 2026-09-19:** [MAP_ACCURACY.md](docs/MAP_ACCURACY.md)
§10, `HIST-TEX-140` to `-155`, `FIC-GONZ-090` to `-092`. Owner: "we're going to have to have assets ford, or build
bridges (where they historically were)". Every place a road on the map meets a river or creek is a `ford`, `ferry` or
`bridge`: 135 in all, 122 fords, 12 ferries and Vince's bridge. The record's crossings stand where it puts them (Lynch's,
Harrisburg, Groce's, San Felipe, Robinson's, Brigham's, Burnam's, Beeson's, the Atascosito ferry, the fords at Gonzales,
Mina, Goliad and Béxar); the rest are the game's. The Colorado crossing, Beeson's and the Atascosito crossing are ferries
marked `stage` (`isStage`), so expresses and the Runaway Scrape stop there as before and an old save's `crossing` kind
reads the same. A ferry costs an hour's wait for anyone on the roads (`FERRY_MINUTES`), said on the travel control and in
the departure words; riders with word and the flight (`findWay(..., { ferries: false })`) don't pay it, and the army's
dates hold. No ferriage (`ceiling:`; the 1831 rates are in `HIST-TEX-140`; the owner chose to leave the ferries free). A ferry is drawn with a
rope and the `ferry-raft` stand-in. Six roads re-routed so one river crossing has one point; 143 creeks added round the
march east; a saved class keeps its creeks two miles round each ford; no save version moved. `tests/crossings.test.mjs` +6,
each proven by injection; `npm run test:crossings` (18 shots). Not done: crossings past the old box (Rio Grande, Nueces,
Sabine) need their roads first; nothing drawn on a ferry or waiting at one; the ferry waits the same hour at night; Beeson's
stands west of the drawn Colorado though Houston's March camp was on the east bank. Found: the shipped province file does
not rebuild to its own hash, before this work too. Same computer only.

**The biomes in play, 2026-09-19:** [BIOME_GAMEPLAY.md](docs/BIOME_GAMEPLAY.md), `HIST-TEX-109` to `-112`,
`FIC-GONZ-065` to `-067`. Owner: research what the new biomes should change and make those changes, "balance and
gameplay". On a class of the biomes a hunt brings the quarry its place holds, fixed by the patch, its cover and the month
(ducks, geese and buffalo in winter; turkey and ducks 4 food and no hide, javelina 4 and a hide, the rest 5 and a hide), said
before sending, at the shot and in the record; only a deer is drawn. *Fetch logs from the timber* takes the axe and the ox
and wagon to the nearest timber for 6 sound logs, its cost said in hours and miles; unplayed families fetch when timber is
within 2 miles, and prairie jacales went from 26 to 2 of 76. A fence costs 8 ticks plus 4 a mile to the nearest timber.
Measured over 6×30 families (`scripts/biome-balance-study.mjs`): food an hour from hunting within about a tenth between
regions in either season; final numbers barely move. Decided against: soil yields, stock, firewood, buying logs, bear oil.
`tests/biome-game.test.mjs` +9, 16 injections caught; `npm run test:biome-game`. No save version moved. Found, and fixed the same
day (next entry): unplayed families never bought powder and were short of food two-thirds of the time; the stay-home family
in `npm run balance` no longer sold its cotton. Same computer only.

**The families nobody plays go to town again, 2026-09-19:** [BIOME_GAMEPLAY.md](docs/BIOME_GAMEPLAY.md) §5.3. Owner, by
multiple choice: the unplayed families' food next. From 2026-09-17 the five town errands (seed, powder, sell food, cotton,
hoe) were hidden from the neighbours' director with a student's list, so no family nobody played bought seed or sold cotton;
and the director had never gone for powder. Now the errands are listed for a family the director runs (`directed`,
sim/chores.mjs) and nobody else, and the director sends a hand for powder under two shots (`POWDER_KEPT`). Six classes of
thirty, before → after: ticks short of food median 566 → 67 of 829, food in the house 5.1 → 39.3, shots 2.2 → 9.2, final
number 60.5 → 59.5. One family in ten is still short for long spells (hands away, or food and powder spent together);
setting idle hands to work was measured, moved nothing, and was not kept. `npm run balance`'s stay-home family sells its
cotton again: finals 1-74, ranks 6-12 of 15, no class won (it won one in six on 2026-09-16; much else has moved since, so
recorded, not tuned - the owner's call). Also found and mended: somebody called to the war while fetching logs left the ox
and wagon at the timber for good; `fetch-logs` now walks out to a team left there and drives it home loaded, and the
director sends a hand for it first (BIOME_GAMEPLAY §3.2). `tests/neighbours.test.mjs` +1 and `tests/biome-game.test.mjs`
+1, proven by six injections. Two tests changed: the fair-trade test carries out only the neighbour's answers (kept at its
last shot, it now sends the man being offered to town), and the camp test's bound is 7 of 12, not 8 - a two-tick chore and a
think every third tick give 7 when the family's turn falls last, which the class's new history happened to pick. Same
computer only.

**The biomes of 1836 on the map, woods only where woods make sense, 2026-09-19:** [BIOMES.md](docs/BIOMES.md) §13,
[MAP_ACCURACY.md](docs/MAP_ACCURACY.md) §9. Owner: research the natural biomes, then bring the map in line; "woods should
only exist where woods make sense... some families are going to have a harder time hunting... thats okay"; Béxar cleared to
fields. New real-land classes record `map.woods: 'biomes-1836'` and read LANDFIRE and the EPA ecoregions filed into 26
stands by `scripts/terrain/biomes.mjs` (the Nueces line, the Big Thicket, coastal cane, canebrakes, delta palms, Béxar's
irrigated fields from the head of the river to Espada, every town's cleared ring, Mexico chaparral). Creek timber stands
only on creeks that run all year; the Alamo's quarter mile went from 41% timber to under 15%. Each biome has its own wash
(the land file now 5 bits of class). Classes made the week of 2026-09-15 keep their own grid (`colonies-woods-2016.*`), so
their felled trees are found again by id; no save version moved. Timber within 3 miles: Béxar 18→7%, Goliad 22→10, coast
towns about half; 13 of 90 families now have fewer than a cabin's 50 logs and build a jacal (no family is stuck). The hunt's
words name each country's quarry, but the hunt still brings a deer. `tests/biomes.test.mjs` +7, 8 injections caught; 11
before/after pairs in `docs/evidence/biomes/`; test:farm (audit on), navigation, map-accuracy, solo-game, hunt and the house
plot pass; speed unchanged on a quiet machine. Not done: the acequias drawn, plantation fields past the towns' rings, the
province's cover belts (drawn only while the land loads). Next: the balance session. Same computer only.

**A traveller faster than a walk is drawn as a marker, 2026-09-19 — SUPERSEDED 2026-09-22, the marker is gone:** Owner, by multiple choice: "Marker when fast". Past
`MARKER_ABOVE` (1.2 of their own drawn heights a real second - the ground the library's walk, horse, ox and wagon cycles
cover at their authored rate; `public/motion.js`) a traveller is a pin with their panel portrait (rust for the principal,
ink for the family, grey for others, slate for a courier), at the server's progress and never beyond it, the road ahead
dotted to a ring at the destination; back below 1.0 a figure again, faded over 600 ms, and no cycle plays while the pin
stands. The clock, the paces and `PERSON_MILES` are unchanged. Riders and wagon drivers are one marker with their mount;
beasts and a wagon going with their family fold into its marker. A tap on the pin chooses them and the camera follows it.
Also fixed: the camera and figures placed at one frame moment (a watched walker had been drawn a few pixels ahead of
centre). `tests/travel-marker.test.mjs` +6, each proven by injection; `npm run test:travel-marker`
([screenshots](docs/evidence/travel-marker/)): a walker in the Solo family view is 0.16 heights a second and a figure,
pressed close 5.54 and a marker, a figure again on arrival. Stand-in: ART_REQUESTS 2026-09-19, the traveller's marker. The
render measurements were taken on a loaded machine and cannot tell the builds apart. Found, not changed: watching somebody
close up redraws the ground about three times a second.

**Houston's march east a forced march that keeps the record's days, 2026-09-19:** [HOUSTON_CAMP.md](docs/HOUSTON_CAMP.md)
*The march east*, `FIC-GONZ-064`. At a family's seven hours on the road the army reached Harrisburg on April 20 and Lynch's
ferry the morning of the 21st; owner, by multiple choice: a forced march. The army's legs go ten hours a day
(`FORCED_MARCH_HOURS`, `sim/travel.mjs`; `travel.forced`, set by `followCamp`), and each camp's moment is now when it sets
out, chosen to arrive on the day: Donoho's the night of the 14th, McCarley's the evening of the 15th, Roberts' before the
noon question on the 16th, Burnett's that night (the army leaves the fork while the question is still open, taking the
right-hand road whatever was said), opposite Harrisburg at 6 p.m. on the 18th, Lynch's ferry at 2 a.m. on the 20th (all
measured in an unplayed class). New milestones `houston-roberts` and `houston-burnetts`; `houston-harrisburg` and
`houston-lynchburg` moved earlier to the setting-out. A man who reaches a camp the army has left follows it
(`catchUpCamp`); one his family sent for is left to go. Tests in `tests/camp.test.mjs`: the camps and milestones at one
moment each, every arrival inside its dated window, the catch-up and the old-map march at a forced march's pace - each
proven by injection (a family's seven hours, no catch-up, a camp out of step; the forced flag left off in `followCamp` is equivalent, because `catchUpCamp` runs first in the tick and sends the man on at the forced pace itself). Found on the way: a
played family with a question open holds the calendar at twenty minutes a tick, when everybody moves at the hour's pace,
so a played man's army arrives earlier than these times.

**The map out to the Sabine and the Rio Grande, 2026-09-18:** [MAP_ACCURACY.md](docs/MAP_ACCURACY.md) §8. Owner, by
multiple choice: all three rivers, USGS NHD with the edge units, full relief and woods outside the box. The map reaches
93.5-100.5°W, 25.8-32°N, built by `scripts/build-outside.mjs` from data downloaded 2026-09-18
(`docs/evidence/outside-data.json`; raw data in `C:\Users\zachw\TexasData\raw`, outside the repository) as a display layer
round the colonies' box in its projection, origin and lattice. The box's eight `colonies-*` files are byte for byte what
they were (hashed in `tests/map-outside.test.mjs`; `colonies-map.json.gz` re-hashed for the march east, which changed it on
purpose). Rivers: the Rio Grande, Nueces, Frio and Sabine, and the Colorado, Guadalupe, Medina and Neches carried on past
the box, meeting its lines within 0.04 miles. Mexico has real 3DEP heights but no LANDFIRE and is drawn as brush
(`ceiling:`). The box's edge ring is drawn from the outside layer, which removes a false hillshade cliff at the old edge.
The woods tiles run past the box through `standAt`'s `beyond`, which only `sim/woods-view.mjs` passes; the simulation's
woods still end at the box. The camera zooms out to 3.035 px per mile (was 4.248). New files: outside-province 71 KB and
outside-land 170 KB for the page, outside-woods 420 KB for the server. 11 new tests, 14 injections each caught by its own
test. Browser, same computer: `scripts/map-outside-browser-proof.mjs` ([whole map](docs/evidence/map-outside/whole.png)),
`scripts/map-outside-compare.mjs` (inside the box at most 0.005% of pixels differ), test:farm with the ground audit,
test:navigation, test:map-accuracy. At 6x CPU, fully zoomed out a ground redraw went 51-55 → 62 ms over twice the ground;
other views unchanged. Next: the towns and crossings of that country (Matamoros, Laredo, San Patricio, the Sabine ferries).

**A day on the road in the long ticks, and the family horse at a walk and trot, 2026-09-18:** Owner, playtesting Solo:
"when i sent my main character to gonzales on foot he ran inhumanly fast". In the gathering and campaign ticks everybody
travelled at their hourly pace for all 24 hours: 72 miles a day on foot, 187 on the horse, 47 with the wagon; and the
family horse went at a courier's 7.8 mph. A tick of an hour or less still moves at the pace; a longer tick carries its
share of seven hours of travel a day (`roadTicks`, `sim/travel.mjs`): 21 miles a day on foot, 35 on the horse at 5 mph,
13.7 with the wagon. Couriers and expresses keep 7.8 mph night and day, calibrated to `HIST-TEX-006`. `HIST-TEX-093`,
`FIC-GONZ-059` (amends `-027`). On screen ([measurement](docs/evidence/travel-speed-screen.json), same computer): with the
portrait pressed a walker covers 4.3 of its own heights a second in the farming day, against about 0.8 for a real walker -
the cause of what the owner saw, and it is the pace, the calendar and `PERSON_MILES`, which are the owner's to decide and
unchanged. Two assertions that held only at the old speeds were changed to the right ones (`tests/camp.test.mjs`, the old
map's march within a day's march; `tests/scrape.test.mjs`, a family turned for home by April 25). `npm test` +5, each
proven by injection; the travel and riding proofs walk the title screen again. Found on merge: the army now reaches
Harrisburg on April 20 and Lynchburg the morning of the 21st, not the 18th and 20th - put to the owner. `ceiling:` in
ticks of an hour or less nobody stops for the night; children and the sick walk at full pace.

**The Alamo in the towns' style, at its historical dimensions, 2026-09-18:** [ALAMO_LAYOUT.md](docs/ALAMO_LAYOUT.md) *On
the map*, `HIST-TEX-090` to `-092`. Owner: "bring the Alamo complex into the same art style as the rest of the game. ensure
it matches the dimensions of the historical building." Researched from the Alamo's model, Ivey's excavations of the west
wall, the 1772 inventory, the 1926 *Light*, Myers and Schoelwer, disagreements recorded (the church's length 75 ft or 105
ft 8¼ in; the compound's extent; the palisade 75 or 150 ft). As drawn before: the west range 32.5 ft deep against Ivey's 16
ft 9 in, the church's walls 2½ ft against 4, the church 69 ft north to south against 62 ft 11⅜ in, the barracks sized on
their centre lines - all corrected in `public/alamo-layout.js`; placement, `alamoOnMap` and the bearing unchanged. The map
draws the compound from `alamoMassing` (`public/bexar-art.js`) on its true footprint at true height × `DRAWN_HEIGHT`, with
parapeted roofs, the library's painted stone, outlines and shadows, and a solid plaza. `npm test` 715
(`tests/alamo-dimensions.test.mjs` +3, each proven by injection with the whole suite run). Evidence: `node
scripts/alamo-style-shots.mjs`, [before](docs/evidence/alamo-before-bexar-closest.png) and
[after](docs/evidence/alamo-after-bexar-closest.png) beside Gonzales, same computer. `ceiling:` the church's carved west
front is edge-on to the north-looking camera and not shown; the roofless church reads as a stone mass; the palisade stays
150 ft; stand-in: one stone module on every face (ART_REQUESTS 2026-09-18). Seen on review: it is still a plan drawn in
stone rather than a building like the towns' sprites, and the woods stand thick round a compound that stood in open ground
and fields - both for the owner. A fetch of the National Register nomination saved a PDF against the no-download rule; it
was deleted at once.

**The army's march east, a night at each house on the road, 2026-09-18:** [HOUSTON_CAMP.md](docs/HOUSTON_CAMP.md) *The
march east*, `HIST-TEX-088`. Owner, by multiple choice: the march's stops made places. Donoho's, McCarley's, Roberts' and
Burnett's are places at their markers (kind `farmstead`, named from the zoom a landing is), the road to Harrisburg laid leg
by leg between them (`scripts/build-colonies-map.mjs`; nothing else in the built map moved). The army leaves Bernardo at 3
p.m. on April 14 - said once, "The army has left Groce's and is marching east..." - camps at Donoho's, McCarley's (6 p.m.
the 15th), the fork at Roberts' (noon the 16th, when the men are asked which road) and Burnett's (noon the 17th, when that
closes), and is opposite Harrisburg at noon on the 18th as before. No drilling on the march; guard, mess and scouts go on. A
class saved before the houses were places keeps the army at Bernardo and marches it straight to Harrisburg, as it always
did (`LATER_CAMPS`). `npm test` +3 new and 3 rewritten in `tests/camp.test.mjs` and `tests/geography-truth.test.mjs`, each
proven by injection: a milestone an hour off, the army left at the fork, drilling on the march, old maps not passed over,
the road skipping Roberts'. `ceiling:` the fork's left-hand road, to Robbins' ferry, is still not on the map.

**Play Solo holds its clock until the family is made, 2026-09-18:** [FAMILY_CREATION.md](docs/FAMILY_CREATION.md)
*Amendment, 2026-09-18*. Owner, by multiple choice: *hold*. The world wrote a family's arrival on its second tick, which
closes the die, so a Solo page slower than that to open never offered it. `familyMaking` (`sim/family.mjs`) - not yet
rolled but free to, or no last name, or a parent's looks unchosen - stops `tick` (`server/app.mjs`) stepping a Solo world,
neighbours and all; the status stays `running`, so the die, the name and the looks are taken. A kept game that can no
longer roll is not held. `npm test` 710 (`tests/solo.test.mjs` +2, each proven by injection); `npm run test:solo` now
waits two study-pace ticks and more at tick 0 with the die still offered, then sees the world go on once the family is
made (fails with the hold out). The navigation proof's own pause and resume are gone. Class play is unchanged.

**The ground drawn again only when it changed, 2026-09-18:** [PERFORMANCE_RENDER.md](docs/PERFORMANCE_RENDER.md) *Redrawn
only when it changed*, [before](docs/evidence/perf-render-redraw-before.json), [after](docs/evidence/perf-render-redraw-after.json).
The kept ground was keyed on the snapshot and thrown away on every render, so each snapshot and each click drew the whole
country again. Its key is now what it is drawn from (`groundInputs`, `public/map-base.js`): the land's plots, fences, crop,
grant, lane and house site, every family's on the Host's map, surveys under way, the woods' kind and the pick on the land.
The woods' revision, which the neighbours' felling moved nearly every tick, is out of it; a woods tile that comes back
unchanged draws nothing. Throttled 6x on this computer: the ground drawn 1-2 times a second → 0-0.1; a snapshot handled
in 12-23 ms instead of 46-73; long tasks a minute 63 → 6 in the default view and 119 → 0 close up on the land. **The ground
audit** (`window.__groundAudit`) guards the risk - something drawn into the ground the key does not know of - by drawing it
afresh aside and comparing pixels; `test:farm` runs with it on (50 snapshots, none stale) and fails when the plots are left
out of the key. `npm test` 708 (`tests/map-base.test.mjs` +1, `tests/woods-view.test.mjs` extended, both proven by
injection; the woods test now puts `fetch` back however it ends). Same computer only; no Chromebook measured.

**The navigation proof made steady, 2026-09-18:** `scripts/support/navigation.mjs`. `npm run test:navigation` failed about
one run in three. Nothing was weakened; the causes it found and fixed are the proof's own: a tap aimed at a person who walked
between being found and being tapped (a target must now stand still across 700 ms, not travelling), a family still walking to
its site (waited for), a target out of view (the camera goes to the next of the family), a man dealt alone (the game is dealt
again), and the click after a drag landing on the family panel (80 px of open map now required). One is the product's: a
Play Solo family may roll only until the world writes its arrival on the second tick, so a page slower than that to open is
never offered the die - since fixed in the game (above), where the proof first held the clock through the Host's own
`pause`/`resume`. Two batches of 12 in a row, 24/24, none dealt again, every run all 13 checks.

**The Rumor Mill as one running story, 2026-09-18:** [HOST_PAGE §2.2](docs/HOST_PAGE.md), `sim/rumour-story.mjs`,
[screenshot](docs/evidence/host-live-rumor-mill.png). The owner's words were "a short, easy to read story" that "will
adapt and change as new rumors flow in"; by multiple choice the story **replaces** the list, word that changed **keeps
its turn**, and the mill draws on **everything any family heard**. A paragraph a month in the order the news first
reached the colonies, each of the war's 26 pieces in a short line taken from its report's words, framed by how firm the
word was ("it was said that...") and how far it went ("heard by 3 of 8 families"); a turned report reads "First word
had it that... Fuller word said..." or "...but it was not so"; the latest word is set apart under the story. The mill
had read only the public reports, so the Alamo, Goliad and San Jacinto never reached it; they do now. Consequence, kept
on purpose and guarded: the teacher reads how the fight at Gonzales went when the families who fought do, marked as
heard by them alone (Gate D in `tests/gonzales.test.mjs` narrowed to that, and the truth never on the wire). The class
list and the story each scroll within their share of the column. `npm test` 707, every new test proven by injection
(a line missing, public reports only, no turn, a late rumour undoing the word, reach unsaid, a silent empty mill).
Browser, same computer only: `test:host-live` 11 checks.

**Over the Brazos at Groce's, 2026-09-18:** the owner asked whether a steamboat was worth drawing; the answer was to fix
the crossing first and request the boat as art. Three agents, one item each (`HIST-TEX-088`, `HIST-TEX-089`). **The ferry
and the road east:** `bernardo` ("Bernardo", the east bank, at the 1936 Groce's Ferry marker) is joined to the camp at
`groces` by a 1.7-mile ferry across the Brazos - the only new Brazos crossing - and a 62.7-mile road runs from it to
Harrisburg past the marker positions of Donoho's, McCarley's, Roberts' and Burnett's (a `via` on the road's entry in
`scripts/build-colonies-map.mjs`). **The army crosses:** at dawn on April 12 (`houston-brazos`) the story says "The army is
crossing the Brazos on the steamboat Yellow Stone. ..." and the men with Houston move to Bernardo; on April 18 they march to
Harrisburg by the new road, not back through San Felipe. The Host reads "with Houston's army at Bernardo, Groce's
plantation". A class saved on a map without these places keeps its old camps (`LATER_CAMPS`). The fork of April 16 is
now said to be at Roberts', beyond Spring Creek, as the sources put it (owner's choice); it said "below Harrisburg".
**The steamboat** is requested from Astra in `docs/ART_REQUESTS.md` (a side-wheeler, from Karl Bodmer's 1833 plate): three
sheets, moored, under steam and laden with men; nothing is drawn meanwhile, which is recorded as deliberate. Landings are
named from 45 px a mile (`LANDING_LEGIBLE`), where Groce's and Bernardo stand clear of each other. `npm test` 704, every
new test proven by injection. Browser, same computer only: `test:road`, `test:map-accuracy`, `test:whole-game`,
`test:armies`, `test:scrape`. `ceiling:` the army waits at Bernardo until April 18 (it left the evening of the 14th; the
stops between are points on a road, not places), so the fork question is asked while the men sit at Bernardo; the crossing
is all at once, not seven trips; Robbins' Ferry road at the fork is not drawn.

**Three map fixes, 2026-09-17:** chosen by multiple choice; researched from TSHA, the THC atlas, Barker's *San Jacinto
Campaign* (1901) and Bill Stein's county history (`HIST-TEX-086`, `HIST-TEX-087`, `FIC-GONZ-058`). **The road from
Gonzales to Beeson's**, "the road which led from Beeson's Crossing to Gonzales" in March 1836, is on the map (62.7 road
miles), and the Mexican column marches it instead of cutting across country; the 1835 expresses still go by Moore's on the
Colorado, as the letters say (`byTheLetters` in `sim/expresses.mjs`). **Groce's is a place**: the army's camp west of the
Brazos (the 1990 THC marker, 30.01736, -96.10685), 17 road miles above San Felipe by a new road; the army marches there
the evening of March 30 (`houston-groces`), and a class saved on the old map keeps its camp at San Felipe with the old
words. **Béxar's river is the 1836 one**: the owner sent the Nelson panorama and a plan of the Alamo; the map's modern line
through the town was the 1920s cut-off channel, and the town was pinned 220 ft east of its plaza, so its eastern streets ran
into the water. The town is now pinned by the Plaza de las Islas, turned 21.1 degrees so the Alamo church lies on its true
bearing, and the map's San Antonio through it is the reconstruction's own loops round La Villita and the Potrero, joined
to the real line where the town ends ([screenshot](docs/evidence/bexar-1836-river.png)); the compound keeps its plan's
compass. `ceiling:` the panorama puts the church about 600 ft short of its true distance; the army leaves Groce's for
Harrisburg through San Felipe, not by the *Yellow Stone*; Burnam's is not a place. `npm test` 697, every new check proven
by injecting its regression (the old map, an unturned town, the express on the new road, no fallback for an old map, the
compound left turned). Browser, same computer only: `test:map-accuracy`, `test:road`, `test:camp`, `test:armies` (its
seed now tried in a fixed order), `test:scrape`, `test:whole-game`.

**One counter, one hand, one next course, 2026-09-17:** the three fixes the owner chose after *"problem solve the various
things characters can do amd make improvements"*. **The town errands are the store's own trades.** Fetch seed, buy powder,
sell food, take the cotton, buy a hoe each walked a person to a counter the *Go to a shop* order already reaches, so a
student had two ways to the same shop and two sets of prices; they are offers of the `store` trade now (`sim/shops.mjs`) at
exactly the prices the errands paid, and the errands are left to the families nobody plays (`directorOnly` in
`sim/chores.mjs`). The counter learned to buy **by the lot** - the store's five food a real, whole reales only, the sixth
food staying in the house - and to offer only the payment an offer prices. **A person's row says what they have become**:
*a steady shot*, *the best shot on this land*, *steady in the line* (`standing` in `public/family-panel.js`), because an
afternoon at the mark cost two powder and then showed nowhere. **The house panel says what the next stage wants**, not only
what the whole plan wants: *"Next: laying the sills on the round-log pen. It wants 4 sill logs and about 2 hours' work; 3
sound and 1 poor at the house, 6 lying out."* (`stageWants` in `sim/houseplot.mjs`, `nextLine` in `public/house-plot.js`).
`npm test` 695; the four new tests each proven by injecting the regression they guard, and `camp.test.mjs` no longer names
a man of one seed. Browser, same computer only: `test:family-panel`, `test:family-commands`, `test:shops` and
`node scripts/house-plot-browser-proof.mjs` rerun ([evidence](docs/evidence/house-plot-browser.json)). Docs: TOWNS §4,
FAMILY_PANEL, WOODS_AND_BUILDING §6.3.

**Navigating the map on a slow computer, 2026-09-17:** [PERFORMANCE_NAVIGATION.md](docs/PERFORMANCE_NAVIGATION.md), `public/map-camera.js`, `tests/navigation.test.mjs`, `npm run test:navigation` ([evidence](docs/evidence/navigation-browser.json)), measured by `node scripts/perf-navigation-measure.mjs` ([before](docs/evidence/perf-navigation-before.json), [after](docs/evidence/perf-navigation-after.json)). Owner: *"exceptionally laggy ... a lot of problems with being able to navigate"* on a school laptop. Same computer, CPU throttled six times, median of three runs: every move and wheel event drew the whole map and the animation starved input, so a touchpad swipe lagged 1.4 s and zoomed 9.4 times over, a touchpad pinch of 1.5 zoomed 4.4, a slow page lost wheel notches, a finger pan was heard 4 moves in 60, and a pinch slid 246 px from the fingers. Now inputs only move the camera, one draw a frame; while a hand is on the map the last drawing is moved and scaled and the map is redrawn when it stops (`ceiling:` figures stand still meanwhile); the wheel zooms by its delta; pinches anchor at the fingers; taps use a CSS-pixel slop and never with two fingers; the animation takes at most half the page's time (`ceiling:`); arrows and +/− work on the focused map. Swipe and pinch latency ~55 ms, drag 18 ms. **Not claimed:** a Chromebook, a real touchpad or touchscreen. **Still slow:** the whole-map draw itself (75–100 ms throttled) and the per-tick render.

**What the server costs, 2026-09-17 ([docs/PERFORMANCE_SERVER.md](docs/PERFORMANCE_SERVER.md)):** owner: *"exceptionally laggy ... Or is the server doing some of the heavy work?"* Yes. The server runs the whole world, and a Chromebook only receives and draws its family's view (17–33 KB a tick). `scripts/perf-server-measure.mjs` measured a real classroom (15 families solo, 30 families with 31 pages) at four points through the game on this desktop only. A late 30-family tick went from **242 ms to 87 ms**. Thirty orders at once went from a **6.2 s to a 0.94 s** slowest answer, with 899 snapshots sent before and 28 after. A solo tick went from 66 ms to 35 ms. What changed: events projected newest-first instead of filtering 30,000; logs lying out counted, not placed and sorted; the server's views serialised without a copy; no `structuredClone` of the class per commit (a refused change is rolled back from the commit's own save text, held to exact by `tests/save-text.test.mjs`); ticks and students' orders written within **five seconds** (`SAVE_WITHIN_MS`, a `ceiling:`), while joins, Host commands, Play Solo and every graceful stop are written before they are answered; pages sharing a view share a projection, an unchanged page is sent nothing, and orders are broadcast at most every 200 ms (ticks never held). The wire format is unchanged and no save version moved. `tests/save-cadence.test.mjs` 5 and `tests/save-text.test.mjs` 2, each assertion proven by injection. RECOVERY and TECH updated for the five-second window. No classroom, laptop or Chromebook acceptance is claimed. Largest remaining costs: projecting 31 views (24 ms), serialising a 9 MB save that is 88% event history (25 ms per commit), and the neighbours' thinking in the step.

**Drawing a running game on a weak computer, and zoom that holds still, 2026-09-17:** [PERFORMANCE_RENDER.md](docs/PERFORMANCE_RENDER.md), [before](docs/evidence/perf-render-before.json), [after](docs/evidence/perf-render-after.json), [injections](docs/evidence/perf-render-injections.json). Owner: *"exceptionally laggy"* on the school laptop, then *"Rivers and forests pop in and out of their places during zoom"* and *"desert and other land styles"*. Measured with `scripts/perf-render-measure.mjs` (CPU throttled 6×, headless Chrome): the main thread was over 100 % busy in every view, the animation loop redrawing every river and creek of the colonies (nine curve strokes, off screen included) and testing every tuft against every river point, twelve times a second. Now the ground under the people is drawn once into its own canvas (`mapBase`, keyed on the snapshot, the camera and the canvas; art and woods tiles coalesced) and laid down each frame; water is laid down only where it can reach the screen (`visibleSegments`); the scatter measures only nearby water; words are written only when they change; `drawSprite` undoes its transform by hand; the canvas holds to a 1080p pixel budget on dense screens. Default view: 7.5 → 10.9 painted fps, 109 → 15 ms a frame, 518 → 73 long tasks a minute, busy 102 % → 41 %; the whole map 2.5 → 11 fps. Zoom: water width `waterWidth` (a river was 18 px at every wide zoom), creeks and surface detail fade in, the woods hand over across bands and are drawn as smoothed pictures instead of squares, the scatter is a doubling grid whose things never move, and on the real land the rivers, sea, escarpment, land classes and hillshade come from the map data's nested levels (`public/land-levels.js`; merged from main). A land style is one entry in `public/ground-classes.js`. Tests 662 (`tests/map-base.test.mjs` 11 new; `tests/art-library.test.mjs` amended), thirteen injections each failing only its test; `test:family-panel`, `test:looks`, `test:art`, `test:whole-game` and the map-accuracy proof rerun. **Same computer only; no Chromebook was measured.** Ceilings: the oaks stand still between ground redraws; one canvas pixel budget; one edge softness for every land class; the ground is redrawn on every snapshot whether or not it changed. **Next:** a fingerprint of what the ground is drawn from, so a snapshot that changes nothing on the ground does not redraw it; a real Chromebook.

**The map's rivers, woods and land where they are, 2026-09-17:** [MAP_ACCURACY.md](docs/MAP_ACCURACY.md), `HIST-TEX-084`, `HIST-TEX-085`, `FIC-GONZ-057`, [injections](docs/evidence/map-accuracy-injections.json), [screenshots](docs/evidence/map-accuracy/). Owner: *"there is supposed to be the san antonio river between the alamo and san antonio. Liberty is on the east side of the Trinity river. Rivers and forests pop in and out of their places during zoom"*, then *"there's also desert and other land styles we need to consider"*. **Cause:** the real rivers (USGS NHD) and towns were right; every real-land class also carried and drew the invented province of `sim/texas.mjs` under them at every zoom - its Trinity 99 miles from Liberty, a mile-wide San Antonio over Béxar and the Alamo - and near Béxar, with no family within thirteen miles, only the invented river was drawn. **Built (data only; `public/app.js` untouched):** `scripts/build-land.mjs` (ten land classes from LANDFIRE, EPA and 3DEP, six relief classes, the sea, the escarpment; bands of 0.5, 2 and 8 miles with a hillshade), `scripts/build-province.mjs` (rivers, sea, shore, woods outlines, escarpment at nested bands of 0.05, 0.25, 1 and 3 miles), `sim/province.mjs`, `sim/land.mjs`, `scripts/terrain/lines.mjs`; the page is sent `mapForPage(world.map)` - a real-land class no longer saves a province and old saves are drawn with the real one, no `saveVersion` moved; `GET /terrain/colonies-province.json` and `/terrain/colonies-land.json` (formats in MAP_ACCURACY §6). **Lynchburg moved** from TSHA's Interstate 10 point to Lynch's ferry (2.3 miles). No desert in the box: the driest is 31c thornscrub, drawn as brush. Tests 640 pass (`tests/geography-truth.test.mjs` 6, `tests/land.test.mjs` 5; 13 injections, each caught). Browser, same computer only: `test:map-accuracy`, `test:road`, `test:whole-game`, `test:solo-game`, `test:hunt`, `test:host-view` pass. `ceiling:` the drawing and its pop-in are the rendering work's; nothing outside 94-99°W, 28-32°N is drawn; the Béxar street layout's river is its own.

**Opening the game on a weak computer, 2026-09-17:** after the owner's laggy Play Solo playtest on the school laptop, the page load was measured with `scripts/perf-load-measure.mjs` (headless Chrome, CPU 6× slower, solo loopback and a 20 Mbps / 40 ms school Wi-Fi, fixed seed) and fixed where it paid: scripts, styles and JSON of 1 KB or more gzipped (`server/delivery.mjs`; cold text 1.6 MB → 347 KB, the map 347 → 97 KB); the page's files `no-cache` with an ETag instead of `no-store`; art sheets asked for by their manifest hash (`?v=`) and kept `immutable` for a year, so a reload or a second class day downloads no art (warm reload 1,043 KB → 220 KB, 13 revalidations → none); a 304 no longer reads and hashes the picture; sheets decoded off the main thread as `ImageBitmap` (632-714 ms throttled main-thread decode → none). Still 15.2 MB of PNG on a cold open (lossless WebP would be -27%, quality 90 -71%: an owner and art-pipeline decision), 120-180 woods tile requests every load, and the per-frame draw (~75 ms a frame throttled) is what keeps the page unresponsive after it has loaded. `tests/delivery.test.mjs` 5, each proven by injection; `npm test` 634. Same computer only - no Chromebook acceptance claimed. docs/PERFORMANCE_LOAD.md.

**The armies on the map, 2026-09-17:** owner, playtesting: "when i sent someone to join the army, they zipped excessively fast across the map. also, there was no army. they were just off in the middle of no where. no mexican army, no texas army. nothing." By multiple choice: camps, men, and the Mexican columns. sim/armies.mjs says where each army stands - the 1835 force, each winter service, Houston's camp as it moves, and every Mexican column on its dated road (sim/road.mjs) - and who may see it: a family sees an army it has men in or one within ARMY_SIGHT_MILES (25) of its own people, the Host sees them all, and nothing else rides on a family's wire. public/army-view.js draws a camp of tents, a fire and the men close up (the militia and regular figures the battles use) and a flag with the army's name and how many of yours are in it from far off. No invented numbers: an army's strength is the men the simulation holds in it, and a column has none. tests/armies.test.mjs (3) and npm run test:armies (5 checks, [evidence](docs/evidence/armies-browser.json), camp and Host screenshots). The tents and fire are Claude-drawn stand-ins (ART_REQUESTS). **Same computer only.**

**The title screen, making the family, and travel out of sight, 2026-09-17:** owner, playtesting: the rolling, naming and looks "should all happen before the world renders", with an intro screen named **Family: Texas 1835/36**, and the same experience in Play Solo as in a class; then "when i sent someone to join the army, they zipped excessively fast across the map" and "what if we used fog of war to hide teleporting the character to their destination". Built: public/creation.js (the curtain and five steps - title, die, last name, everybody named, each parent looked at), public/intro-art.js (the scene, Claude-drawn, marked as a stand-in), and the map drawn only once the family is made; Play Solo leaves the die to the player (rollRefusal allows a played family to roll while the class runs). Travel: somebody more than 2.5 miles from both ends of a journey is out of sight while a tick carries them further than two miles (outOfSight in public/map-base.js), on the student page and the Host; their card says how far is left. Also fixed: the work cards (the wagon, the house plan and plot, the survey, where the house stands) stood over the family panel, so the father could not be renamed. [FAMILY_CREATION amendment](docs/FAMILY_CREATION.md). 688 tests; tests/creation.test.mjs and the travel rule each proven by injection; every browser proof reruns through the new flow (). **Same computer only.**

**Navigation merged; woods in batches; the land levels revalidated, 2026-09-17:** the pan/zoom branch merged ([PERFORMANCE_NAVIGATION](docs/PERFORMANCE_NAVIGATION.md)); five proofs repaired for the merged behaviour (the pop-ups answered in interior and navigation, movement interrupted by a change its page sees, family-commands waiting until two may go). Woods tiles now come 48 to a request and the land tiles are remembered by the server; the province and land levels answer 304 on reload. Measured: 167-224 requests on a load down to 54-56, responsive in 3.2-9.9 s from 18-28 s ([PERFORMANCE_LOAD, woods in batches](docs/PERFORMANCE_LOAD.md)). 684 tests. **Next:** the ~2 s long task on the first ground draw with the land classes. **Same computer only.**

**Performance merged, and Esc leaves full screen, 2026-09-17:** the page-load, rendering, server and map-data agents' branches merged (docs/PERFORMANCE_LOAD.md, PERFORMANCE_RENDER.md, PERFORMANCE_SERVER.md, MAP_ACCURACY.md); 669 tests; browser, solo, host-live, host-view, family-panel, family-commands, looks, map-accuracy, road, camp, whole-game and solo-game proofs and verify-launcher.ps1 (10 PASS) rerun on the merged main. Owner: saving every few seconds is kept ("as long as it doesn't affect performance"). Owner: *"went fullscreen, and saw no way to exit fullscreen. it should be the esc button on the keyboard"* - the launcher's windows (launcher/TeacherWindow.cs) catch Esc and F11 from inside the page through a web message, and say *Press Esc to exit full screen* for three seconds on entering it. `ceiling:` the key handling builds but was not pressed by automation (it would open windows on the owner's screen). The pan/zoom agent has not reported yet. **Same computer only.**

**The family's last name, How We Look, and saved solo games, 2026-09-17:** owner: after rolling, a pop-up for the "Family Last Name" that every member carries; then How We Look with a picture on every choice, so the Family button is not needed; and Play Solo asks new game or continue one. By multiple choice: last name kept apart from first names ("the García family"), both pop-ups required with defaults set and set once, first names on the panel only, the journal button kept as **Journal**; every solo game kept and listed. [FAMILY_CREATION amendment](docs/FAMILY_CREATION.md), [DEPLOYMENT: saved games](docs/DEPLOYMENT.md). `tests/surname.test.mjs` 4, `tests/appearance.test.mjs` updated, `tests/solo.test.mjs` +2, every rule proven by injection; `npm run test:looks` 7 checks; the launcher's `--solo --list/--continue` run against a scratch data folder. Pictures are Claude-drawn stand-ins (ART_REQUESTS). **Same computer only.**

**Play Solo, the uninstall link, and a launcher older than its game, 2026-09-17:** the owner's second computer showed *Release v2026.09.17.2* and no Solo Mode button after running the setup: the released setup was checked byte for byte against the build and its launcher does show the button, so that computer was running a launcher from before 2026-09-16 beside new game files. The launcher now carries its release tag and says when it differs from the game's (DEPLOYMENT, *Uninstalling from the launcher*). Owner: *"don't call it playtest for solo mode. Just call it 'Play Solo'"* - the button, its windows and the server's messages renamed. Owner: *"an uninstall button that remove everything that the game installed"* - a small link at the bottom of the launcher running `--uninstall --after <pid>`, which now also removes the stamp folder, the view profile, the update staging, the .NET extraction and the logs, with Cancel the default on the first question. Proved on this computer only, with the Cancel path a `ceiling:`.

**The owner's word on the road east, 2026-09-17:** by multiple choice: the bog rate, the prisoners and the drill kept; a family overtaken now loses glory **like a desertion** (`awardGlory` with `adjust: -2x` on `enlisted`, once per column, sealed); and the columns **march the map's roads on the same dates** (`columnLeg`, `ROAD_DETOUR` 1.6, a `via` for Thompson's ferry; Gonzales to the Colorado stays across country because the map has no road for it). `tests/road.test.mjs` 9, each new assertion proven by injection (straight lines, no glory, a detour limit of 16). ROAD_EAST §2 and §5, `FIC-GONZ-051`, MONEY_AND_GLORY §4.

**The road east, 2026-09-17:** [ROAD_EAST.md](docs/ROAD_EAST.md), `sim/road.mjs`, `HIST-TEX-068` to `-074`, `FIC-GONZ-049` to `-052`, [browser](docs/evidence/road-browser.json), [injections](docs/evidence/road-injections.json). Owner (2026-09-16): *"Players that are running during the Runaway Scrape, they need things to do besides just running. Wasn't it wet? Wagon could get stuck and they'd need to free it. Hunt for food while at camp? Various things. The Mexican army should be close enough that if players spend too much time in one place that they could be caught. Historically accurate consequences."* Built in the owner's absence, every choice a default the owner may change (ROAD_EAST §2): rain on about half the days, hashed from the seed; a wagon family moving on a rain day bogs at one in two and is asked - dig out (eight hours, the diggers worn, the ox spent to half pace for a day), wait for a dry day, or leave the wagon and walk on with what the grown people carry; a hunt from the camp with the family halted and the shot decided as at home; a real for two food among the families camped at a crossing or refuge; a day's nursing that keeps the sick alive and mends them sooner; and the pursuit - each Mexican column a head between the dated places of `SETTLEMENT_DAYS`, a warning at twenty miles put to the family with press on / stay / leave the wagon, and a family that sits within five miles overtaken: wagon, animals and goods taken, grown men prisoners at one in two, the rest let go on foot, nobody killed (the record has no such death, `HIST-TEX-073`). The director answers the same questions through `applyAction` by the question's own fallback, hunts from the camp when short, and presses on when warned; an absent family or a main person on auto is answered the next tick; the calendar holds only for a played family deciding (twelve ticks). Host's rows read *bogged in the mud on the road east to …* and the like; a played family overtaken is spotlit. Three panel icons drawn as glyphs (`stand-in:`, request 2026-09-16 - the road's icons). `tests/road.test.mjs` (8), ten injections each failing its own test (the calendar's hold is guarded by three); `npm run test:road`; `test:whole-game` and `test:solo-game` rerun. **Same computer only.** Ceilings in ROAD_EAST §5: straight-line columns with placed dates between the settlements' days, a circular reach, one sky for the class, coin never taken. **Next:** the owner's word on any default in §2; a column's road along the map's ways.

**Houston's camp: things to do for a man in the army, 2026-09-17:** [HOUSTON_CAMP.md](docs/HOUSTON_CAMP.md), `sim/camp.mjs`, `HIST-TEX-075` to `-083`, `FIC-GONZ-053` to `-056`, [browser](docs/evidence/camp-browser.json). Owner (2026-09-16): *"Soldiers in Houston's Army should have things to do too. Drilling, etc."* A man serving with Houston now has the camp's work on his row, each in the shape every chore has and each with a consequence the family reads: **drill** (three days make him steady in the line, said on his card; at San Jacinto a steady man's weight in the battle's roll is three quarters of his frailty - no new die, `rollFates` takes `weightOf` - and the word of the battle says so), **beef and corn** for the mess, **guard**, and the **scouts** (a horse at the camp; two outings in a hundred bring him back slightly hurt, said on the control). Two questions on his card with a "!": with the word of Goliad on March 25, whether he goes home (the card says what leaving costs: an ordinary man starts home, an auxiliary's land goes, a regular has deserted; closes at dawn on the 28th), and at the fork below Harrisburg on April 16, which road (the army goes right whatever he says; calling for the enemy's road is a `forward` part). Glory: one supporting award, `served` (1), the first time he does any of it; `forward` (2). A man whose family does nothing is set to the camp's work by the neighbours' director, by auto and while his family is absent, at documented rates, and answers the questions at once at the shares (half leave; three in four call for the right). The calendar holds only while a played, present family decides. The Host's page reads *with Houston's army at Groce's, above San Felipe de Austin: drilling with the company*. **Every design choice is in HOUSTON_CAMP §2, marked chosen by default; the owner may change it.** Three hooks in `sim/chores.mjs` let a chore kept in its own module carry its own `offered`, `refusal` and `run`, and `registerChores` now takes a registration made while the table is still loading (the import cycle winter → houston → scrape → host → directors → camp). **Found and fixed:** `houstonCamp` read the record's dates eighteen hours ahead of the director's milestones (the class's clock starts at dawn on September 28), so for those hours a man at the old camp "had not reached the camp"; it now reads them as `momentOf` does (`campClock`). **Tests: 620 pass** (612 before; `tests/camp.test.mjs` 8; `tests/houston.test.mjs`, `tests/winter.test.mjs`, `tests/chores.test.mjs`, `tests/family-commands.test.mjs` amended - a test that wants its men at the battle keeps them in with `leave: 'no'`, a serving regular is offered nothing). Twenty-four regressions injected one at a time (the camp offered to everybody, drill uncounted, the fourth day not refused, the award given twice, drill unweighted at San Jacinto and weighted at one, foraging unsaid, a scout never hurt, the scouts without a horse, the question never opened, a family nobody plays not answered at once, leaving not releasing, the question never closed, the calendar not held, the right-hand road earning nothing, the director and auto skipping the camp, the march not breaking off the work, the Host not saying the work and not counting the question, the panel hiding the camp, no "!" for the question, a bad save accepted, the question not on the wire): each failed its guarding test and only it, except where two tests guard one rule - the drill cap (the camp test and the director's), the one award (the camp test and the scouts'), the close (Goliad's and the fork's), and the "!" (the panel's, Goliad's and `family-commands`' `NEED_KINDS` pin). `npm run test:camp` (9 checks: a real class played in process to the Colorado camp; the father sent to join Houston from the panel, his row's five icons, drilling from the row and the glow, the card counting the day, the "!" with the word of Goliad opening the card at the question and its price, answered, the Host's words, 400 px, no page errors) and `npm run test:whole-game` (14 checks) pass. Same computer only. One whole-game run before the passing one timed out pressing *Confirm: leave, and let it burn* ("element was detached from the DOM"): the flight card is rebuilt whenever the family's stores change (`renderFlight`'s key holds `flight.have`), and at 100 ms a tick a family on auto changes them often; not touched here, and worth a key that leaves the form standing while only the numbers move. **Left out:** sickness in the camp (`HIST-TEX-078` registered, a `ceiling:`), Groce's as a place, a camp store; see HOUSTON_CAMP §5. **Next:** the refugees' road (the other piece of the owner's instruction, `sim/road.mjs`); the ceilings in COLONIES §6p.

**Claude-drawn stand-ins, 2026-09-16:** owner's instruction: complete the outstanding art requests with Claude-drawn art, marked so Astra can replace it later. Sixty frames drawn as hand-written SVGs in Astra's painted style and rendered by headless Chrome into a **separate library**, [public/assets/claude-standins/](public/assets/claude-standins/) (every file prefixed `claude-`, `madeBy: "claude"` on every entry of its own `atlas.json`, never inside her atlases): the family panel's five marks (`mark-need`, `mark-need-rider`, `mark-main`, `mark-idle`, `mark-auto-off`/`-on`), the winter's eight icons, twenty-nine action icons (`icon-<key>`, every panel key), twelve portraits (`portrait-<figure>`, one parameterised drawing dressed after each cast figure, [scripts/draw-claude-portraits.mjs](scripts/draw-claude-portraits.mjs)) and the wagon's five tools (`home-hoe` ... `home-auger`). `public/art.js` reads the second manifest and **lets her frame of the same name win**, so `npm run build:art` on a delivery replaces a stand-in with no page change; [tests/claude-standins.test.mjs](tests/claude-standins.test.mjs) then fails naming the frame until the stand-in is deleted (proved by injecting `bucket`). Build: `npm run build:standins` ([scripts/build-claude-standins.mjs](scripts/build-claude-standins.mjs), needs the Playwright/Chrome environment). Plugged in: `PANEL_ICONS`/`drawIcon`/`drawMark`/`drawPortrait` in `public/family-panel.js`, `panelMark`/`paintMark` in `public/app.js` (the type "!", stars and words stay under the canvases and show only while no frame is drawn), `INTERIOR_ART` in `sim/interior-data.mjs`; the drawn glyphs, the fitted scene sprites and the cropped-clip portraits are gone as defaults. The family-panel proof now reads every icon and mark canvas and fails on a glyph or type. **Not attempted** (animation sheets and whole buildings in her style): shops, the towns' researched buildings, house-plot pieces, trees, Béxar, riders, the ox wagon, the saddlebag interior, layered people - listed in [docs/ART_REQUESTS.md](docs/ART_REQUESTS.md) *Claude-drawn stand-ins (replace with Astra's)*, which is also the table of what she should deliver to replace each piece. The portraits should be replaced first.

**Two class periods, 2026-09-16 — build step 8(a):** [COLONIES §6m](docs/COLONIES.md) (decided by multiple choice §7e), `FIC-GONZ-044`, research [winter-1835-36.md](docs/battle-research/winter-1835-36.md), [browser](docs/evidence/ending-browser.json). The first period ends at Béxar with interim standings ("leads", "the story so far"); the Host presses *Continue to the winter of 1836* and the same class opens paused on January 25, 1836, everyone home, wounds mended by the time passed, a winter eaten but never below a fortnight's food. The second period ends at dawn on February 23 with the final reckoning until the Alamo is built.

**Women are not sent to the fighting, 2026-09-16:** owner: *"I've also changed my mind. Women did not participate in battle. Actual combat shouldn't be a presented option for them."* `canFight` in `sim/family.mjs` gates turn-out (`sim/calls.mjs`), riding upriver (`sim/directors.mjs`) and every winter service (`sim/winter.mjs`) - refused in words on the control, so the panel greys the icon and says why; going to see, helping, the vote's own rule, the flight and the chores are untouched. The 2026-09-14 glory penalty for a woman sent to fight is superseded and kept only for a class saved with a woman already in the ranks ([MONEY_AND_GLORY §4](docs/MONEY_AND_GLORY.md), [FAMILY_CREATION amendment](docs/FAMILY_CREATION.md)). `tests/women.test.mjs` (4, each proven by injection).

**The Host's live page and absent families, 2026-09-16:** [docs/HOST_PAGE.md](docs/HOST_PAGE.md), [evidence](docs/evidence/host-live-browser.json). Owner, by multiple choice: the class panel shows *"where everyone is, what waits on them, who is here"* (no coin, no glory); *"Call it the Rumor Mill … Some are true, some aren't. When major events happen, such as the Fall of the Alamo, the Goliad Massacre, or the burning of a player's house, the host camera should zoom in on that and show it live"*; *"Absent families automatically become npc, but may be played again by the player if they return later."* Built: `sim/host.mjs` (the class in words, the Rumor Mill from public knowledge with its earlier tellings, the spotlight lit at Gonzales, Concepción, the Grass Fight, Béxar, the Alamo's fall, Coleto, Goliad, San Jacinto, Santa Anna taken, a played family's farm burned and somebody taken at home), sent to the Host alone as `live`; `sim/absence.mjs` and `markAbsences` in the server (a page closed two minutes while the class runs; the director gives the family's orders, its questions are answered at once, nothing of it holds the calendar; back the tick its page opens); `public/live-page.js` and `renderHostLive` (the panel, the mill, the banner and the camera move). Tests 614 (14 new, 17 injections each failing only its tests); proofs host-live (new), host-view, whole-game rerun. Two things learned: a page module named `/host-…` is not served (the files table is a whitelist; it is `/live-page.js`), and the Host's payload bound (140 KB at a thirty-family arrival) left room for the class in words only once people carried no ids. **Next:** the ceilings named in COLONIES §6p; the Rumor Mill as one running story; a drawn reconstruction at a spotlight.

**Solo Mode end to end, 2026-09-16:** `npm run test:solo-game` ([scripts/solo-game-browser-proof.mjs](scripts/solo-game-browser-proof.mjs), [evidence](docs/evidence/solo-game-browser.json); the play shared with the class run in [scripts/support/whole-game.mjs](scripts/support/whole-game.mjs)). A solo game dealt by `newSoloGame` - joined, rolled, running, no join form, no Start press, the other four families automatic - played to the road home through all three periods with the solo class view continuing it twice, and a new game dealt after the end with the old pages open; sixteen checks, 470 + 195 + 318 ticks in about 108 s at 100 ms a tick, no page errors. **It found the defect a playtest on the second computer would have met first:** the launcher's Solo Mode, and a class started from the launcher, dealt the **invented Gonzales country**, which cannot continue past 1835 - the winter and the spring only exist on the real land - so no solo playtest could ever reach them. `server/main.mjs` now deals on the colonies unless `MAP=gonzales`; the proof starts the real solo server and checks what it deals. DEPLOYMENT (Solo Mode) and COLONIES §5.8 amended. **Next:** the ceilings named in COLONIES §6p; the Host's live page.

**The whole game in the browser, 2026-09-16:** `npm run test:whole-game` ([scripts/whole-game-browser-proof.mjs](scripts/whole-game-browser-proof.mjs), [evidence](docs/evidence/whole-game-browser.json)). One class from the lobby to the road home through all three periods, a student and the Host in headless Chrome the whole way: join, roll, the house site, everybody on auto and set to work from the panel, the settlement's call answered from the one menu, the interim standings, the Host continuing twice, a winter enlistment from the panel, the flight by hand from the "!", the final reckoning on both pages - with a stall detector that fails the run if the class stops advancing while it says it is running. Fourteen checks pass; 633 + 195 + 516 ticks in about 147 s at 100 ms a tick, no page errors. **It found two defects the period proofs could not.** (1) A man who enlisted in the winter, marched with Houston and came through San Jacinto finished with **no land**, because the victory releases him and the ending counted only those still serving: fixed in `landPromised` (released with the promise kept counts; being sent for still forfeits), tested in tests/houston.test.mjs, docs amended (MONEY_AND_GLORY, COLONIES §7e, the ending page's footnote). (2) The same man was shown on the Host's closing table as **"nobody" having gone**, and his family's story said they stayed with the land, because the ending's parts came only from the 1835 participation record: `partsTaken` now folds in the sealed glory awards (enlisting, the vote, the Alamo, Coleto, San Jacinto), tested in tests/winter.test.mjs. Both proved by injection. **Next:** the ceilings named in COLONIES §6p; Solo Mode end to end; the Host's live page.

**The auto switch, 2026-09-16:** [FAMILY_PANEL §11.7](docs/FAMILY_PANEL.md), `sim/auto.mjs`, `FIC-GONZ-048`, [evidence](docs/evidence/auto-browser.json). Owner: *"for all combat, and hunting, the player should be able to let it automatically happen (autohunt, or autofight) but the player should have the ability to micromanage their character … if they fail to make the character's choices in a timely manner then eventually the auto should take over."* Answered by multiple choice: one switch per person that repeats the last order; auto-fight only for somebody already in the ranks; auto-hunt only the shot; the game's own windows by hand, then auto decides that one question; the Scrape follows the main person's switch, a family by hand given a day. Built: `set-auto` on every panel row (the word *auto*), the shot decided by steadiness, the army's questions, the detachment and Travis's couriers answered at once at the unplayed shares, a hunt repeated when the hunter is home with powder, `autoFlee` and a day's `FLIGHT_PATIENCE`, and — because silence no longer stays — *Stay, and take the risk* (`flight-stay`). **Changed rule:** a question nobody answers in time is now decided as auto decides (not 'silent'/stay/first fallback); tests that relied on silence keep their volunteers in explicitly. Tests 589 (6 new, 14 injections each failing only its test); proofs auto, family-commands, family-panel, scrape rerun. **Next:** the ceilings named in COLONIES §6p; a run of the whole game in the browser end to end.

**The balance study and the crop choice, 2026-09-16:** [MONEY_AND_GLORY §8.1](docs/MONEY_AND_GLORY.md), [evidence](docs/evidence/balance-study.json), `FIC-GONZ-047`. `npm run balance` plays whole classes through all three periods with one family kept home selling its crop: every winner fought; a stay-home cotton family reached ranks 2, 3 and 5 (possible, unlikely); a stay-home corn family finished last, corn being unsellable for coin. Owner: *"both, but cotton is more expensive, so more profitable for players."* Built and tuned by re-measurement (three runs, the table in §8.1): planting asks corn or cotton (the family's own first, and what silence plants), cotton three seed a plot to corn's two and a cotton family's default load a sack more and a barrel fewer, the neighbours' director gathering its own crop's seed, the store buying food for coin beyond its purse at five a real (owner: "food dearer to sell"). Final: a cotton family that stays home and sells everything wins about one class in six; a corn family places mid-field. **Next:** the ceilings named in COLONIES §6p; a run of the whole game in the browser end to end (the proofs cover each period separately).

**The third period - the Runaway Scrape, Goliad and San Jacinto, 2026-09-16 — build step 10:** [COLONIES §6p](docs/COLONIES.md) (decided by multiple choice §7g), research [goliad-scrape-san-jacinto.md](docs/battle-research/goliad-scrape-san-jacinto.md), `HIST-TEX-062` to `-067`, `FIC-GONZ-046`, [browser](docs/evidence/scrape-browser.json). The Host continues the class a third time to dawn on March 14; each settlement's families are told to leave on its day; the main person's card takes the decision - what fits in the wagon, where east - and the Texas army burns the farm as they go (a family that stays is burned out anyway, and may be taken when the Mexican army passes); the rivers hold them, the road makes them sick and rarely kills; Houston's army is joined at its camps and left at will; Fannin's men meet Coleto and Palm Sunday; San Jacinto at the record's rates; the word on April 23 turns every family home and the game ends on the 25th with the final reckoning. **The whole war is now built, arrival to San Jacinto.** Next: the ceilings named in §6p - news by rider in the spring, the settlements' own days, Groce's, a sick pose.

**The Alamo, San Patricio and Agua Dulce, 2026-09-16 — build step 9:** [COLONIES §6o](docs/COLONIES.md) (decided by multiple choice §7f), research [alamo.md](docs/battle-research/alamo.md), `HIST-TEX-054` to `-061`, `FIC-GONZ-045`, [browser](docs/evidence/alamo-siege-browser.json). Whoever is at Béxar on February 23 is shut in; a played person inside is asked on the four courier days whether to carry letters out (one volunteer in four rides out and lives); any family that heard Travis's letter can send somebody to Gonzales to ride in with the relief by 2 p.m. February 27; on March 6 the men inside fall and the women are spared, and no family sees it until the word comes (a rumour at Gonzales March 11, confirmed the 13th, elsewhere that evening); the Matamoros men are rolled at San Patricio or Agua Dulce for killed, captured or escaped (to Fannin at Goliad). The second period ends the night of March 13, Gonzales burned.

**The winter's choices, 2026-09-16 — build step 8(b) and 8(c):** [COLONIES §6n](docs/COLONIES.md), `HIST-TEX-047` to `-053`, `FIC-GONZ-044`, [browser](docs/evidence/winter-browser.json). In the second period a grown family member can enlist for land at San Felipe (regular, bound - sent for is desertion; or auxiliary, the war or a year - sent for loses the land), join the garrison at Béxar, go south to the Matamoros men, or - a man of 21 or more - vote in town on February 1; one person, one place. **The owner amended the ending**: `final = coin × (1 + glory) + land`, land a real for twenty acres, and the store buys a whole cotton crop, so staying home is a possible but unlikely win (measured first; `docs/MONEY_AND_GLORY.md` §5). Families nobody plays go at the record's rarity by a hashed share.

**The main person is the world's, and a call has one menu, 2026-09-16:** the owner's two answers to the questions the family panel left open ([FAMILY_PANEL §11.5](docs/FAMILY_PANEL.md), [browser](docs/evidence/family-commands-browser.json)). Owner: *"If any character (that's old enough) is selected as the main person (only one at a time) then they can be sent on travelling … select the dad of the family as the main, send him off to war, then switch the main person to the mom so that I can have her take something into town"* and *"The ! should appear on anyone that can answer. When it's clicked on however, a single interactable menu should appear that lets the player make the choice for each applicable person. Say a series of checkmarks."* **Main person (§11.3):** a new action `set-main` keeps `household.mainId` on the server — one at a time, anybody of the family alive, uncaptured and old enough to be sent, refused otherwise in the words every order gets; travelling, the yard and rest are now the main person's (*"Only your main person can be asked that. Choose them with the star on their row."* replaces *"Only your principal …"*), their row alone has those icons, and the browser keeps nothing (`localStorage` gone). Switching recalls nobody: the father stays in the army, the mother keeps walking. **Fallback when the main person dies or is captured:** the principal if they can act, else the oldest living member old enough to be sent, else nobody (`mainPersonId`, resolved on every read, so the star moves the same tick). `mainId` rides on the tick only when it is not the principal — absent means the principal — because the per-tick payload was one byte under its 10,240 budget (`tests/family.test.mjs`); **no save version**, and rolling the family clears a choice among the founding four. **The call's one menu (§11.2):** any "!" for a call opens `#call-menu` — a tick per person the server lets answer, name and age, the server's price or reason, *Send them*, *Nobody goes: …*; confirm sends one existing command per tick in order with each person's way of going, the camera goes to the first sent, a refusal is said in words and leaves the menu open for the rest. **The settlement's call now takes more than one** (`sim/calls.mjs`: `turn-out` while open or already accepted, `call.actorIds`, each with the powder and the ride and each said to arrive; staying once somebody has gone is refused, and so is going twice); the food call, the rumour and the march stay one person's, and their menu is a single choice (`ceiling:` in `public/family-panel.js`). **Tests:** `tests/family-commands.test.mjs` (8: the main person against the simulation — chosen, gated, switched without recall, refused for the too young and the gone, the fallback chain, an old save; the menu's rows and plan against a real class), `tests/calls.test.mjs` (7: two sent, each said to arrive, staying refused after, an older save's one volunteer, validation), `tests/world.test.mjs` and `tests/family-panel.test.mjs` updated (`principal:` → `main:`). Sixteen regressions injected one at a time (a gone main person not giving way, the gate reading `entity.principal`, `set-main` taking a child under ten, `mainId` never sent, `mainId` sent for the principal, validation taking a stranger, switching dropping the old main person's journey, a call closed to a second volunteer, staying still a question after somebody went, going twice, only the first said to arrive, `actorIds` naming nobody, the menu listing the dead, the plan keeping everybody home with somebody ticked, every call taking several, the journeys on every row): each failed its guarding test — `mainId` for the principal also failed the payload budget in `tests/family.test.mjs`, staying-after-going also failed the older turn-out test, and the journeys-on-every-row also failed two `family-panel` tests, which guard the same rule. `npm run test:family-commands` (23 checks; two classes, the second on the real land played in process to San Felipe's call: two ticked, both sent, "!" gone, the phone's menu on screen), `test:family-panel`, `test:army` (6) and `test:interior` (9) pass. **550 tests pass** (548 before). Same computer only. **Not proved in a browser:** a main person dying (simulation only), a refusal from the menu leaving it open (the server refused nothing in the run), an army question's "!". **Not built:** the card offers nothing on an accepted settlement call, so a second volunteer goes from the menu when the family answers, not later.

**Solo Mode and a launcher that updates itself, 2026-09-16:** owner: *"build into the launcher a 'Solo Mode' so I can quickly playtest the game without having to restart class sessions, the server, copy/paste the join code, etc."*, then *make the launcher update itself*. [DEPLOYMENT: Solo Mode](docs/DEPLOYMENT.md#solo-mode-playtesting), [Updating](docs/DEPLOYMENT.md#updating-launcher-included). **Play solo (playtest)** starts or reuses a solo server (`server/main.mjs --solo`: `data/solo/`, port 1836, 127.0.0.1 only, `SAVE_PATH`/`PORT` ignored), deals a fresh game with one player joined, rolled and started (`POST /api/solo` with the solo Host key, one-use `GET /solo/enter?ticket=`), and opens it in a window with **Class view** and **New solo game**; `npm run solo` does the same from a terminal. Proved: `tests/solo.test.mjs` (5 tests, ten injections each failing only its test), [browser](docs/evidence/solo-browser.json) beside a running class, and two new `verify-launcher.ps1` PASS lines (each failed under its injection). **Updating** now downloads the release's setup program, runs `--extract` into staging, checks its stamp, and swaps launcher and game together: the running exe renamed to `.old`, everything moved aside to `.update-backup` with a journal, all of it rolled back on any failure or on the next launch after an interrupted swap. Proved on this computer only by `scripts/verify-update.ps1` — six PASS lines, four injections each stopping at its own line — [evidence](docs/evidence/launcher-update.json); no real release has been through it. **The release that ships this is the last one that needs `TexasRevolutionSetup.exe` reinstalled**, because every launcher installed before it takes only the update archive and cannot replace itself.

**Commands, the "!" and the main person, 2026-09-16:** [FAMILY_PANEL §11](docs/FAMILY_PANEL.md), [browser](docs/evidence/family-commands-browser.json). Owner: *"If they need my attention (for example a rider is trying to talk to them) then there should be an exclamation point there for me to click on ... I should also be able to select one character to be focused on."* Client only: no projection field, command or save version moved. An "!" on a row for a rider standing with that person, an army question put to them, a call they may answer, work that stopped to ask, or an offer made to them — all read from the family's own projection (`needsOf`); pressing it takes the camera to them and opens the conversation or their card at the question, keyboard on the first answer, and it goes when answered. Rows show **Idle** (nothing to do, something open). A star chooses the **main person** (per browser, `localStorage`; the principal until chosen): gold edge, the default card, the only row with **House** (opens the interior). The panel now writes the DOM only when a value changes (a quiet tick: 0 nodes, 0 attributes). **Stand-ins:** the "!", star and idle marks are type (request 2026-09-16 in `docs/ART_REQUESTS.md`). `tests/family-commands.test.mjs` (7): seven regressions injected into `public/family-panel.js` (offer direction ignored, a rider marking everyone, any chore as asking, a call's answerers ignored, army answers ignored, idle ignoring task, a dead main person kept) each failed its test and only it — except the call injection, which both call tests guard. `npm run test:family-commands` (19 checks: rider, call, busy family, a stale order refused in words, idle, asking, offer, main person through reload, House, camera back, DOM churn, 400 px) passes; `test:family-panel` (its no-other-buttons check now allows the three new controls), `test:army` and `test:interior` pass. **543 tests pass.** Same computer only. **Asked of the owner** (answered the same day; the entry above): should the other grown people be able to travel, rest and work about the place from their rows (today a world rule keeps those to the principal); should a call any adult may answer mark all of them (as built, matching the map) or only the main person? `pace.test.mjs` failed once in a full run under load and passed on the rerun; not touched.

**Inside the house, 2026-09-16 — SETTLING_IN step 7:** [§7.2](docs/SETTLING_IN.md), `FIC-GONZ-043`, [browser](docs/evidence/interior-browser.json). Decided by multiple choice: tap your own house on the map and its room opens; set furniture and the wagon's goods on marked spots (hearth, back wall, window, door …), move them or put them away; opens only once a house stands; the Host sees any family's room read only. Changes nothing in the world. `sim/interior-data.mjs` is shared with the page. Follow-up the same day: the wagon's tools can be set out too, and a saddlebag has its own two-pen rooms with no passage; both are `stand-in:` art (tools as `tools`, the saddlebag on the dog-run's picture), listed in [ART_REQUESTS.md](docs/ART_REQUESTS.md); the browser proof now sets the felling axe under the window.

**Casualties at the record's rates, no cap, 2026-09-16:** owner: *"I disagree with the never more than one killed per battle per class ... Keep it inline with % of casualties from the actual battle (within reason, you're allowed to round)."* [COLONIES §7d](docs/COLONIES.md). **Before:** Concepción and the storming each allowed at most one death in a class (the likeliest roll won), and a later death from a wound at Béxar only if the fight had killed nobody. **Now** one rule, `rollFates(world, ids, { event, death, wound })` in `sim/army.mjs`, rolls each fighter on their own at the battle's documented share, weighted by frailty as `1 − (1 − rate)^frailty` (rate × frailty for small rates; a rate of 1 still kills the strongest, ready for the Alamo), with no limit per fight or class. Rates, rounded from the research: **Concepción 1 killed / 2 wounded in 100** (1 of ~92, 0–2 wounded); **Béxar 2 / 8 in 100** for those who went in (1.7%, 7–9%), reserve unhurt; a dangerous wound's later death about 15 in 100, each rolled, all of them dying on December 12. The Grass Fight is unchanged (nobody killed). The storming's unhurt sentence now says "the storming of Béxar" like the other fates (a test matched on it). `FIC-GONZ-039`, `-041` amended. Tests replaced: crowds of middling people (frailty exactly 1) die and are wounded within a band of the documented rate over thousands of fighters, a crowd loses more than one in some fight, the frail die more than 1.8× the hardy, Espada and the camp unhurt, every rolled later death comes (including on top of a death in the fight, and several in one class) at about 15 in 100, and `rollFates` kills everybody at a rate of 1. Each proven by injection: the old cap in each fight, the old later-death cap, doubled/halved rates for each battle's killed and wounded and the later death, frailty removed, the reserve rolled, and the multiplied weighting.

**All fourteen towns drawn, 2026-09-16:** [TOWNS §5b](docs/TOWNS.md), `FIC-GONZ-042`, `HIST-TEX-046`, [browser](docs/evidence/towns-browser.json). Washington, Brazoria, Velasco, Harrisburg, Anahuac, Nacogdoches, Refugio and Goliad join the six, each on a measured origin; forts and ruins as `walls` (Goliad's breached quadrangle, Fort Velasco's ring, Refugio's churchyard) and ruin sprites (Anahuac's brick fort, the missions). Brazoria's map point moved to Old Town (map rebuilt). Go to… frames a town on its buildings. Three more art requests (round fort, steam sawmill, the Stone House).

**The storming of Béxar, 2026-09-16 — build step 6 complete:** [COLONIES §6l](docs/COLONIES.md) (decided by multiple choice §7c, every answer the research's leaning), [research](docs/battle-research/bexar-storming.md), [browser](docs/evidence/storming-browser.json). The class now ends the evening of December 15. December 4: winter quarters (played asked, unplayed go at the documented rate) and Milam's call on the card; December 8 the camp asked to reinforce; resolved at the white flag: ~1.7% killed, ~8% wounded for those who went in, camp unhurt, one death at most (a later death from a wound included) *(cap withdrawn the same day: see the entry above)*; wounds in three grades, the badly wounded lying at Béxar unable to travel, a dangerous wound able to mark (`marks` on the card) or kill later; wrong express Dec 8, victory Dec 15 with the terms as signed and losses 150–300; army starts home Dec 14. `HIST-TEX-036`–`045`, `FIC-GONZ-041`.

**The towns drawn, 2026-09-16:** [TOWNS §5b](docs/TOWNS.md), `FIC-GONZ-042`, [browser](docs/evidence/towns-browser.json). San Felipe, Victoria, Mina, Matagorda, Columbia and Liberty are drawn from their research sketches (`sim/town-layouts.mjs`, one file for page and server; `public/town-art.js`): streets turned to each grid's measured bearing, squares, every named building, ordinary houses on lot centres; keepers now keep drawn buildings, the documented one where the research names the trade. Stand-ins and a new art request for the buildings the library lacks. The other eight places are next, each sketch ready.

**The siege and the Grass Fight, 2026-09-16:** [COLONIES step 6](docs/COLONIES.md) (§6k, decided by multiple choice §7b), [research](docs/battle-research/grass-fight.md), [browser](docs/evidence/siege-browser.json). The class now ends December 4 with Milam's call (about 78 more ticks). Camps above the town, at Concepción, then the old mill; unplayed families' men go home for winter clothing and half return; three questions on the volunteer's card — Austin's storm order (yes earns `willing` glory), the pledge (no sends them home), and after the silver rumour whether they go out after the pack train; nobody killed, ~3% slightly wounded, ~1% run home with the award turned negative. News by the family's reports: the wrong rumour Dec 1, fuller word Dec 3 with the losses as a range. **Found and fixed:** Goliad and Concepción news had reached only the Host page; it now reaches every family (`sendWord`). `HIST-TEX-026`–`035`, `FIC-GONZ-040`. Next in step 6: the storming of Béxar, researched first.

**The map corrected from the town research, 2026-09-16:** [COLONIES §6j](docs/COLONIES.md), `HIST-TEX-025`. Columbia, Goliad, Velasco, Harrisburg and Refugio moved to their 1835 sites; the Trinity crossed at the Atascosito crossing three miles north of Liberty; the Liberty-Nacogdoches road and Lynchburg on the mail road added; 37 places, 42 roads. Hunter's not placed (no position found). Also owner-confirmed: glory at or below nothing counts as nothing, so a family's final number is its coin.

**Concepción, 2026-09-16:** [COLONIES step 6](docs/COLONIES.md) (§6i, decided by multiple choice §7a), [research](docs/battle-research/concepcion.md), [browser](docs/evidence/concepcion-browser.json). The army halts at the Cibolo and the Salado on the order book's dates and goes south to Espada; on Oct 22 a family is asked whether its volunteer goes ahead with Bowie and Fannin (risk hidden); on Oct 28 they fought and the rest were present, fates rolled at ~1% killed and ~2% wounded weighted by hidden strength and health, never more than one killed in a class *(cap withdrawn the same day: see the top entry)*; a woman killed has her award taken twice, labelled the game's reading. Class ends Nov 2 (about 41 more ticks). `HIST-TEX-019`–`024`, `FIC-GONZ-039`. **Owner-confirmed (2026-09-16):** glory at or below nothing counts as nothing, so the final number is the coin, never zero. Next in step 6: the Grass Fight and the storming of Béxar, each researched first.
**Movement drawn slower and even, the ground unchanged, 2026-09-16:** [browser](docs/evidence/movement-browser.json), `tests/movement.test.mjs`. The owner: walking "still looks too fast", without changing the ground covered. Nothing under `sim/` or `server/` changed; a test pins every pace constant and Thomas's mile-a-tick walk. Three causes, all in the drawing: **(1)** any command anywhere in the class bumps the revision, and every screen treated that same-tick snapshot as a break - travellers snapped to the end of the tick and the next tick's walk was squeezed into what was left (measured before: 56-70% of a tick's walk painted in its first quarter, or the walker standing still for the second half of the tick); `ProjectionMotion.accept` now keeps the walk going and spreads each tick over the tick interval the server states, continuing from where the figure is drawn. **(2)** on the real land every tick of the news phase and after (an hour or more a tick) failed a hard-coded twenty-minute check and was drawn as a jump; `CALENDAR_STEPS` now mirrors `CALENDAR_SCALE`. **(3)** the walk and ride cycles played at their authored 2.8 steps a second whatever the drawn ground did; a traveller's cycle now advances by the ground drawn under them (`GaitClock`, one stride = 0.86 of a person's drawn height, a wheel its circumference), never faster than authored and never below a quarter of it. At the Study pace a zoomed-out walker (about 0.36 heights a second) steps at 30% of the old rate; zoomed right in (about 2 a second) it is unchanged. Seven injected regressions each caught; `npm test` 494 pass, 0 fail. Not measured in a browser: the frame of the cycle drawn, and a compressed-calendar class (both unit-tested). `docs/evidence/pace.json`'s body-lengths figures predate `PERSON_MILES` becoming 0.019 and the 7-pixel figure floor, and no longer describe the screen.
**One person on each horse, ox and wagon, and they sit on it, 2026-09-16:** owner's playtest: *"characters don't actually sit on the horse when using it. More than one character is able to use each mode of transportation even if it's already in use ... Same thing for the Ox and Wagon."* [Browser](docs/evidence/riding-browser.json), [horse](docs/evidence/riding-horse.png), [wagon](docs/evidence/riding-wagon.png). **The fault:** a beast was freed the moment any journey ended, so a second person standing beside it in town or at the timber could take it, and work given with the horse whose road out came after a first step (making furniture) held nothing. **Now** (`sim/keeping.mjs`): whoever takes the horse, or the ox and wagon, keeps it until it is back on the family's land, until they go on without it, or until they are dead or captured; work given with it holds it from the moment it is given; a volunteer who rode to the army has the horse marching with them and rides it home when sent for. A second person is told *"Maria has the horse."* or *"Maria has the ox and wagon."* on *Going by*, and the server refuses the same order sent any way (every journey goes through `beginTravel`). **Drawn:** a rider is their own figure sitting on the family horse, and whoever has the wagon sits on it with the ox ahead; the ridden horse and driven team are not drawn again; the courier sheet is no longer used for family riders. Stand-ins listed and requested (new request: driving the ox wagon). `tests/keeping.test.mjs` (5) and `tests/riding.test.mjs` (4): 11 injected regressions, each failing its test (the free-on-any-arrival injection fails the three tests that rest on it; the courier-clip injection is caught by the updated `tests/motion-binding.test.mjs`). `npm run test:riding` (11 checks) passes; travel (updated: its ox and wagon are measured as the driver's parts, and the reason is now "has the ox and wagon"), army, Concepción, ending and family-panel proofs pass. **498 tests pass** (489 before). No save version. Same computer only. `ceiling:` hauling logs and a harvest use the ox and wagon at home without holding them. **Not decided by the owner:** freeing a beast left behind for whoever is there, and the principal driving the wagon on the arrival.
**The teacher sees the whole class, 2026-09-16:** owner: *"On the Class View, the teacher should be able to see everything and everyone … players are limited by fog of war, but the teacher shouldn't be."* [Measured and drilled](docs/evidence/host-view.json), [browser](docs/evidence/host-view-browser.json). **Before:** the Host projection had no household, so `entities` was empty and `observedBy(world, undefined)` returned nobody — the Host page drew the map and not one person, and neighbours' houses as assumed camps. **Now** `sim/overview.mjs` sends the Host alone every person, animal and wagon at its true position and doing its real work, and every family's land as it stands (line, house or camp and pieces, plots and crop, lane, log pile, stock), picked field by field. **Go to…** on the Host map lists every family's land and every town (a town framed to its street of shops); zoom reaches a student's closest; clicking anybody opens a read-only card, and the server still refuses the Host every family action. Glory, hidden stats, what riders carry, a family's stores and coin, and private news stay off the Host screen; the glory, hidden-stat, participation, purse and relay privacy tests all still pass against the larger payload. **Students unchanged:** 510 student projections hashed identical before and after. **Payload:** the Host went from about 2 KB to 87 KB mean / 118 KB worst (the arrival) for thirty families on the real land, 51 / 68 KB for fifteen — beside about 740 KB sent to thirty students on the same tick; `ceiling:` the whole class goes every snapshot rather than only what the teacher's camera holds, and a traveller's road is sent only 3 miles either side of them. `tests/host-view.test.mjs` (6): eight injected regressions caught (the old fog filter fails three tests that all need the Host's class, the rest only their own). `npm run test:host-view` (8 checks) passes; four regressions injected into the page each failed it. Re-run and passing after the change: browser, information, slice, ending, farm, field-art, travel, shops, family-panel, house-plot, hunt, army and relay proofs. **495 tests pass** (489 before). Same computer only: headless Chrome at 1440×950 and 400×860, not a LAN or a classroom. **Not changed, flagged for the owner:** the live Gonzales fight still reaches the Host only as the delayed reconstruction once the news is public, and the Host's news list is still the public reports, not every family's.

**Concepción, 2026-09-16:** [COLONIES step 6](docs/COLONIES.md) (§6i, decided by multiple choice §7a), [research](docs/battle-research/concepcion.md), [browser](docs/evidence/concepcion-browser.json). The army halts at the Cibolo and the Salado on the order book's dates and goes south to Espada; on Oct 22 a family is asked whether its volunteer goes ahead with Bowie and Fannin (risk hidden); on Oct 28 they fought and the rest were present, fates rolled at ~1% killed and ~2% wounded weighted by hidden strength and health, never more than one killed in a class *(cap withdrawn the same day: see the top entry)*; a woman killed has her award taken twice, labelled the game's reading. Class ends Nov 2 (about 41 more ticks). `HIST-TEX-019`–`024`, `FIC-GONZ-039`. **Decided by me, flagged for the owner:** glory below nothing counts as nothing in the final number. Next in step 6: the Grass Fight and the storming of Béxar, each researched first.

**The shops of the towns, 2026-09-16:** [docs/TOWNS.md](docs/TOWNS.md) (owner-decided by multiple choice), [browser](docs/evidence/shops-browser.json). Blacksmith (tools), gunsmith (powder, a rifle put in order), doctor, tavern (rest and public news), tanner (hides, shoes, saddle), wheelwright (wagon), mill, weaver (cotton, blankets), each for coin or food and each stating what it does. Core trades everywhere; Gonzales and San Felipe have the full street, Victoria a smith. 19 invented keepers per class at most. `FIC-GONZ-038`. Each keeper keeps a building (owner, same day): in Gonzales one of the buildings already drawn, labelled with the shop; in every other settlement a building of their own from `world.map.shops`, drawn with stand-in sprites (request written). Automatic neighbours do not use the shops.

**Furniture and the carpenter, 2026-09-16:** [SETTLING_IN step 6](docs/SETTLING_IN.md) (§6.1), [browser](docs/evidence/furniture-browser.json). Five pieces, one of each, made at home (a trip to the timber and the work, with an axe and for most an auger) or bought from a carpenter in the family's town for coin or food. Each does one small stated thing under a roof; a cradle lifts a new quarter-slower pace on heavy home work for a parent with a baby. `FIC-GONZ-037`. The default wagon brings no auger, so most families can make only benches or a cradle and must buy the rest.

**How a family looks, 2026-09-16:** [SETTLING_IN step 8](docs/SETTLING_IN.md) (§7.1), [browser](docs/evidence/looks-browser.json). After the roll a student chooses each parent's skin, hair, clothes and a hat or beard / bonnet or pinned hair in the family book, saved as chosen; children take after the parents and cannot be chosen. Nothing reads it, proved by playing a class at both extremes and comparing the worlds. **Stand-in:** words only; the figures are still chosen by sex and age until the layered people sheets (written out in `docs/ART_REQUESTS.md`) arrive. Found while proving it: the person panel keeps its desktop position when a window is narrowed to phone width and scrolls the page sideways; not fixed here, and the family panel work replaces that panel.

**The ending, 2026-09-16:** [MONEY_AND_GLORY steps 4–5](docs/MONEY_AND_GLORY.md) (§7.1), [tests and drills](docs/evidence/ending.json), [browser](docs/evidence/ending-browser.json). When a class ends each family sees its coin, its glory, coin × (1 + glory) written out — no coin counted as one real, owner's amendment of 2026-09-16 — and what earned each; the Host sees every family's three numbers in household order, names the family that finished first (ties name all; automatic families never), and asks the class why. Nothing of it is on any wire before the end. **Found and decided:** as first built a family that sent somebody and held no coin finished at 0; the owner set no coin to count as one real. In a class nobody plays no family ends with coin or glory at all, so the balance gate cannot be run yet. Same-computer browser proof only.

**The family panel, 2026-09-16:** [docs/FAMILY_PANEL.md](docs/FAMILY_PANEL.md) (owner-decided 2026-09-15, amends [docs/SETTLING_IN.md](docs/SETTLING_IN.md) in how a family's people are managed), [browser evidence](docs/evidence/family-panel-browser.json). Owner: *"i'd prefer an interface on the left side of the screen father at the top, then mother, then kids descending by age …"* Built, client only — no simulation rule, projection field, command or save version moved. A row per person down the left of the map: father, mother, then the children oldest first (a lone mother is first; no ages keeps the household's order), a portrait, the name in a box, and an icon for every action the server offers that person now — the twenty chores in `world.work`, and on the principal's row *Travel to Gonzales*, *Return home*, *Go to a neighbour's homestead* (opens the card's list), *Work about the place* and *Rest*, plus *Call off the work* while somebody is at one. Hover or focus shows a popup with one sentence, and the server's price or refusal. An icon glows while the projection says the person is doing it (`chore.id`, `travel.to`, `task`) and goes out when it says they are done. A portrait takes the camera to the person and zooms in (the camera's existing watch) and opens their card, which keeps what is a question rather than an order: calls, riders, a chore's question, *Going by*, the neighbour list, trading, the army's *Send for*. Every name — on the panel and in the family book — saves itself on leaving the box, Enter or a 1.5-second pause; the Rename buttons are gone; a refusal is the server's sentence. On a phone the panel is a column of portraits with one row open. **Found and fixed on the way:** the family book was rebuilt on every snapshot, replacing the name box under a typing student. **Stand-ins** (both requested in [docs/ART_REQUESTS.md](docs/ART_REQUESTS.md) and listed): portraits are the head and shoulders of each person's own map figure; icons are the nearest library sprite, or a drawn glyph for four. `tests/family-panel.test.mjs` (8): twelve injected regressions, eleven caught, and the twelfth (a busy row collapsing to its refusal) showed its guard could never matter — a busy row always has its open call-off icon — so the guard was removed. `npm run test:family-panel` (13 checks) passes, and six regressions injected into the page each failed it (a glow the page remembers, a portrait that does not move the camera, names never saved, no save after a pause, no hover popup, every phone row open); its first drill also found the panel drawn for a moment before the family's book arrived, showing the founding four, now fixed. The proofs whose selectors moved (family, hunt, travel, farm, trade-animation, art, browser) were updated and pass, as do information, relay, slice, army, house-plot, house-plot-regression, alamo, Béxar, field-art, Gonzales-art and landscape-art. **457 tests pass** (449 before). Same computer only: headless Chrome at 1440×950 and 400×800, not a real phone, LAN or classroom. **Not done:** the detailed chore descriptions (clearing's spells by ground, for instance) are no longer on the control before a place is chosen — the owner asked for one sentence; the place panel still states the spells before anybody is sent.

**The rivers, 2026-09-15:** [What was wrong and what was measured](docs/evidence/rivers.json). A reader said the rivers changed shape on zoom, were angular instead of curved, were not connected in places, and had trees standing in them. Four separate faults, all fixed. Water is now drawn as a **curve through the map's own sample points** (`public/curve.js`) rather than straight lines between them — the invented Guadalupe is four points with segments up to 7.4 miles, which drew a survey traverse. Width is now the water's **true width measured in the same exaggerated yardstick as every tree and person** (`figure` = `PERSON_MILES` of ground), so it grows with the land; it used to be pixels, capped at 26 on the invented map and a two-pixel thread on the real land. **34 tributary mouths** that stopped between 100 feet and a quarter mile short of their river are carried onto it — while an end *cut* where a course leaves the country this map keeps is left open, which the map now records as it is made. Nothing is drawn standing in the channel. Found on the way: joining mouths mid-build dealt a different class from the same seed (the join is now last), and a chore that began with the horse crashed the whole class if somebody else took it (it walks). **449 tests pass**; six injected regressions each caught by the test that claims them.

**The gathering and the march, 2026-09-15:** [Build step 5](docs/COLONIES.md) (§6h), [evidence](docs/evidence/gathering-and-march.json), [browser](docs/evidence/army-browser.json). A class on the real land no longer stops when the fight is over: volunteers keep coming into Gonzales, the town's own families are asked for the first time, the army is made on the afternoon of October 11 and marches for Béxar on the 13th, and the slice preserves on the 17th with the column on the road. A measured thirty-family class mustered **19 volunteers** and had them 40 of 69 road miles out at 262 ticks — about 41 minutes at the Study pace. A volunteer is a person inside one body and can be **sent for** at any time. Standing in the ranks the day it was made is written down as `present` and awarded sealed. Dates are `HIST-TEX-018`, researched for this from Austin's manuscript order book, the Austin Papers and the Telegraph — **it found that the march date in the older `HIST-TEX-007` rests on the weakest of three sources**, and that no Liberty company appears in any October 1835 letter. The invented Gonzales country ends where it always did; no save version moved. **443 tests pass**, 14 injected regressions each caught by the test that claims it, and the browser proof passes on this computer.

**The two clocks, 2026-09-15:** [Build step 4 part 3](docs/COLONIES.md) (§6g), [evidence](docs/evidence/two-clocks.json). On the real land a tick still holds twenty minutes of anybody's effort; the date it carries follows the phase — twenty minutes while farming, an hour through the news, four hours and half a day declared for steps 5 and 6. The same thirty-family class reached the fight at tick 288 and ended at 464 before this, and now reaches it at 168 and ends at 236: the Gonzales slice fits a lesson with room left for the gathering and the march. Days follow the calendar, including how far the ground goes past, so the letters keep the dates `HIST-TEX-006` gives them and a volunteer can reach a gathering history dated (owner decision, 2026-09-15). Effort and **attention** stay in ticks: a rider still waits about sixty ticks for an answer and is still seen about two ticks up the road, where before they would have shrunk to a third. The calendar steps back to the farming scale through the night of the crossing, because a dated question is open in it. The invented Gonzales country and every saved class keep the single clock; no save version moved. 433 tests pass and eight injected regressions are each caught by the test that claims them. No browser proof: nothing a student sees is new.

**Art batch, 2026-09-15:** [Seven accepted atlases](docs/ART_DELIVERY_2026-09-15-ART-BATCH.md) add modular house construction, five species of size-aware regional trees, animated white-tailed deer, second-cast east/west walking and carrying, children's north/south walking, and volunteer/regular cannon-service poses. Library: **767 sprites, 52 atlases, 322 clips**. Live bindings preserve server authority; artillery bound/drink poses do not invent action. One second-cast vertical candidate failed alpha/cell validation and was withheld. Remaining gaps stay explicit in `ART_REQUESTS.md`.

**Wildlife art, 2026-09-15:** [Delivery contract](docs/ART_DELIVERY_2026-09-15-WILDLIFE.md). The procedural deer stand-in is replaced by a sixteen-frame white-tailed deer atlas with idle, alert, bound and drinking cycles. Live hunts use idle and the unanswered-decision alert pose; the server remains the sole authority for quarry identity, position and visibility. Bound and drinking are registered without inventing simulation behavior.

**Release `v2026.09.15.1`, 2026-09-15:** [Release contents](docs/RELEASE_2026-09-15.md). Completed the interrupted house-plot/staged-building update, including neighbour-help crash, interior-piece placement and phone supplies wrapping. Seven house tests pass and seven isolated injected regressions are caught; the actual student browser flow builds shelter using 50 logs. All **426 tests** pass with four concurrent workers, and all **15 existing browser proofs** pass, plus the new house-plot browser proof. One unrestricted-concurrency test worker exited without an assertion; its isolated rerun and the complete bounded-concurrency suite pass. The installer was extracted and its **120 runtime/game files matched the working sources**, with new art/UI routes served using its bundled Node; [package evidence](docs/evidence/release-package-2026-09-15.json). Three release downloads include the installer, updater ZIP and NeedsNode ZIP. This includes the unpublished colonies/woods/settling work and all current artwork. Same-computer evidence only; later campaigns, physical-device acceptance and remaining art requests are still pending. The Alamo workshop remains a preview outside classroom battle state.

**Landscape visual pass, 2026-09-15:** [Waterways, roads and crossings](docs/LANDSCAPE_ART.md). Shared rendering adds bank/depth/surface detail, road shoulders and ruts, and shallow stone fords aligned to water. A timber bridge treatment is available only for explicit bridge data; none was invented on the live map. Gonzales and Béxar share these materials. Travel/crossing rules are unchanged.

**Gonzales art improvement:** [Town presentation](docs/GONZALES_ART.md). Thirty premade structures, store and ironworker yards, paths, props and trees now form the close-range settlement. The Gonzales button frames the whole town; the old rectangular tint is removed. Scenery only: existing people, routes, fog of war and saved state remain authoritative.

**Art batch: livestock, clearing and care, 2026-09-14:** [Delivery and remaining work](docs/ART_DELIVERY_2026-09-14-FIELDS.md). Corrected longhorn/hog animations now replace ox stand-ins. Fields use timber stumps, worked brush piles and survey markers. Second-cast care/search/trade sheets are registered. Library: 45 atlases, 663 frames, 283 clips; 394 tests passed. No smoke/fire inferred from clearing, and no change to simulation facts.

**A rider at the fork still stops for somebody on the last of the road, 2026-09-14.** In the tick a rider reached the end of a leg, `progressTravel` ended the journey, so the stretch ridden that tick was never looked along, and `advanceRelays` then handed the word on before `advanceEncounters` ran. Somebody standing or walking on that stretch was ridden past; in the `road` class Mateo, walking to town, was passed a mile short of `road-2` and the next rider told his father at home instead. Now a rider that finishes a leg keeps it as `report.lastLeg`, `stepWorld` and `resolveTimeJump` call `advanceEncounters` once before `advanceRelays`, and a person met on that stretch is spoken to by that rider, who is put back on the road halted beside them and finishes the ride after. `lastLeg` is cleared by the end of every encounter pass, so nothing new is saved and no save version moved. `tests/encounters.test.mjs` "a rider coming to the fork where the word changes hands…" failed before; removing either the kept leg or the earlier pass makes it, and only it, fail. The relay browser proof's default class had no family near town after the east-bank change and now uses `gonzales-relay-2` (4.8 miles first-hand, 27.0 miles third-hand). 392 tests pass; all eleven browser proofs pass on the same computer.

**The Guadalupe is crossed only at the ford on the invented map, 2026-09-14.** Families' tracks ran straight over the Guadalupe to the east-bank road (in the `ways-river` class `route-road-0-home-1`, `-4-home-5`, `-5-home-7`, `-2-home-9`, `gonzales-home-10`), and the bank road from the ford crossed the joined river and the San Marcos, because the ford stood below the forks; the crossing route itself never crossed the water. So west-bank families reached Williams's land without the ford, across country too (`findWay` follows tracks), and their wagons were not refused. `sim/geography.mjs`: the ford is now 0.6 river miles above the forks, a few yards onto the west bank, so `route-gonzales-ford` carries the one passage and the bank road runs up between the rivers; Williams's land is seven river miles above the ford (it was seven above the forks); every homestead is on the east bank with a track that crosses no river. `ceiling:` the San Marcos gives no frontage on this map. `tests/geography.test.mjs` asserts every route's river crossings (crossing: the Guadalupe once; all else none) over five classes and that every home's road to the camp uses the crossing; it failed before the fix and, with the old placement injected, fails naming `route-road-0-home-1`. The ceiling in `tests/ways.test.mjs` is gone and that test now requires the ford. Moved homes exposed `huntingGround` facing a house inside the timber's edge out onto prairie (fixed, `sim/chores.mjs`); six encounter/decision/store/upriver fixtures that depended on where their families lived now use classes that fit and assert that premise. The `road` fixture also showed a rider handing word on at a fork riding past somebody on that last stretch; fixed the same day, see the entry above. No save version: a saved class keeps the map it was made with. 391 tests pass; travel and hunt browser proofs pass on the same computer.

**Béxar town and Alamo reference update, 2026-09-14:** [Assembly contract and evidence](docs/BEXAR_ASSEMBLY.md). Existing assets now build an 80-building town with twin plazas, San Fernando stand-in, Valero plaza, La Villita and Alameda; 144 trees follow the reconstructed river and avenue. The real-map game's Béxar button opens its detailed scenery, and the Alamo workshop has a whole-town view. West-range Alamo rooms now adjoin. Shared geometry, no new population or battle triggers. Town placements are inventoried in `manifest.json`; exact façades and street-level navigation remain future work.

**Alamo illustrated assembly, 2026-09-14:** [Alamo update](docs/ALAMO_LAYOUT.md). The workshop now defaults to roofed buildings, uses the game's earth/stone/timber artwork on its surfaces, and cuts away when a room is chosen. Any north-wall section can play a pause-aware collapse ending in a walkable breach, with reduced-motion support. Expanded browser proof passes; this stays outside the saved classroom world.

**Art delivery, 2026-09-14:** [Accepted assets and remaining production](docs/ART_DELIVERY_2026-09-14.md). Library: 41 atlases, 599 frames, 254 clips; 370 tests pass. Second-cast work now joins idle; other action sheets remain pending. Preserve current bindings and the held-stock safeguard.

Updated **2026-09-12**. Overall maturity: **PROTOTYPE**. The four foundation gates were developed sequentially and have practical development evidence. This is a working Gonzales foundation, not the complete game or a classroom-ready release.

**The woods, where they were, 2026-09-15** ([docs/WOODS_AND_BUILDING.md](docs/WOODS_AND_BUILDING.md), owner-decided today: realistic woods, hunting on the family's own land, felling its own trees for the house, and building from a period plan or pieces on a grid). Research: LANDFIRE's pre-settlement vegetation for the colonies (downloaded with the owner's email, which the service requires), EPA's Texas ecoregions, six LANDFIRE model descriptions, and Holley 1836 on the timber region by region (`HIST-TEX-016`); Terry Jordan's *Texas Log Buildings* and the GLO bearing-tree notes are named and not read. **Step 1 built:** `scripts/build-woods.mjs` and `sim/woods.mjs` put a stand on every eighth of a mile, a patch of the model's classes on every sixteenth, and one real tree at most on every twenty-one feet, nothing stored (`FIC-GONZ-032`). New real-land classes read timber, brush and the miles to timber from it for the going, lanes, fields and the house site; older classes keep timber by the water. **Step 2 built:** every tree drawn where it stands close up, timber patches as canopy at middle distance and a shade of timber further out, from `/api/woods` tiles (`sim/woods-view.mjs`, `public/woods-view.js`), kinds drawn with the nearest tree the library has (requested). Browser-checked on the same computer in Brazos bottomland, Liberty pine and Gonzales post oak savanna. **Step 3 built:** *Hunt on our land* - tap a place inside the family's line, read the ground and how good it is for game, send somebody; they walk out on foot and wait longer on poor ground than good (`sim/hunting.mjs`, no chance); neighbours on the real land hunt the best ground within a mile. Browser-checked on the same computer. **Step 4 built:** *Fell trees* at a place in timber on the family's land fells the real trees within 260 feet one by one, wall timber first, leaving stumps and lying logs; *Haul logs to the house* brings them to the log pile, six behind the ox or one on a shoulder (`sim/felling.mjs`); stumps drawn, supplies line says the logs. Browser-checked on the same computer. 419 tests pass. **Next:** step 5, the house plot and its pieces; then raising by stages.

**Each settlement's call, and a deer, 2026-09-14** ([docs/COLONIES.md](docs/COLONIES.md) §5.4a, §6f). A far family on the real map is asked its own settlement's 1835 call once the express reaches it (`sim/calls.mjs`, `HIST-TEX-014` from the Austin Papers): San Felipe to turn out for Gonzales, Matagorda and Columbia to gather at Kerr's (they ride for Victoria: Kerr's is not on the map), the Trinity, Mina and Victoria the general word. Go (rifle and two powder, ride to the gathering, wait there for step 5) or stay; on the coast "Stay and keep the coast". Neighbours: the coast stays, inland a second grown hand goes. A hunt now shows a deer the server places ahead of the hunter (`HIST-TEX-015`, stand-in shape), riders and couriers are drawn at horse size, and close-up timber is drawn where the simulation has it. `sim/ground.mjs` `landAround` is one shared block index: a 30-neighbour real-map class went from 290 to 24 ms a tick. HIST-GONZ-024 to 026 registered. 400 tests pass. **Next:** part 3, the two clocks; then step 5.

**Riding, the way people go, and where they hunt, 2026-09-14** (found in play by the owner). Whoever goes on the horse is drawn in the saddle, the horse not drawn twice (courier rider stands in; ART_REQUESTS "family members on horseback"), and neighbours ride whenever the horse is home. `sim/ways.mjs` `findWay`: people on foot or horseback take the quickest of road, straight across country or across country to a road, costed by the land's going plus an off-road cost; never across a big river off a road; the wagon off the road only over open ground (FIC-GONZ-029). Riders carrying word and the arrival keep to `findPath`. Hunting goes to each family's nearest timber or brush, `hunt-<household>`, named for its water (FIC-GONZ-030): a few hundred yards on a wooded creek, miles on the prairie. Browser-checked on the same computer: a principal sent on the horse rode, drawn mounted, with no horse left in the yard; hunt, travel, farm, family, slice, relay, information, trade-animation and art proofs pass. `tests/ways.test.mjs` (6), hunting (+3), neighbours (+1), motion (+1); every guard drilled. 390 tests pass. (The invented map's tracks over the Guadalupe noted here were fixed the same day; see the entry above.) Béxar (Astra) is committed and draws on the real map.

**News by riders over real distance, part 1: the expresses, 2026-09-14** ([docs/COLONIES.md](docs/COLONIES.md) §6e). On the real map the word leaves Gonzales when the letters say (the call for help 8 am Sept 30, the fight 2 pm Oct 2), rides the real roads settlement to settlement, waits six hours at each settlement and crossing, and goes out to each settlement's families by in-person riders who say where it came from. San Felipe has the call at 3:20 am Oct 1 and the fight at 9:20 am Oct 3, inside the letters' dates; Liberty after. Distant families are asked none of the Gonzales calls yet, and a real-map class runs on until the furthest family has heard the fight (ends about Oct 4, 470 ticks: too long until the two clocks). Browser-checked: a San Felipe family's child met a rider on Oct 1 and another on Oct 3, each "out of Gonzales" by way of San Felipe. `tests/news.test.mjs` (5), thirteen injected regressions caught. 378 tests pass. **Next:** part 2, each settlement's own call (turn out for Gonzales); part 3, the two clocks.

**Every browser proof runs again, 2026-09-14.** All eleven (`test:browser`, `information`, `relay`, `slice`, `travel`, `hunt`, `family`, `art`, `alamo`, `trade-animation`, `farm`) pass on the same computer with the workstation Playwright and Chrome listed below; seven had been failing since families began to be rolled at Start. The proofs that follow the founding family now name it before Start (`keepFoundingFamilies` in `tests/support/settled.mjs`), which the Start rule already honours; the family proof rolls the die in the page first; the general proof reads its own page's principal and waits for the description. **Bugs they found, all fixed:** the person card on a wide screen covered Family, Follow and Land, so the journal could not be opened with somebody selected; an event recorded with no actor kept an `undefined` field the save drops, so a reloaded class was not the saved class (unit test added, failed first); "You rolled a 18" (now "an 8", "an 11", "an 18", tested); and a family of eight children read "Marcos and Levi and Delia and …" (now a list, tested). **Noticed, not fixed:** a family of eight's per-tick snapshot measured 17,364 bytes without the map, against the 7,500 the payload budget test holds for the founding four; bigger rolled families need that budget looked at. 373 tests pass.

**The family die has twenty sides, 2026-09-14** ([docs/FAMILY_CREATION.md](docs/FAMILY_CREATION.md) §2). Owner: *"when rolling for a family, it should be a 20 sided die."* Chosen with the owner: bigger frontier families and fewer lone parents. 1–5 a lone parent with none to four children, 6–20 both parents with none to eight (three to five most often), set against a total fertility rate of about 6.5 in 1830; a family of one to ten. The roll panel draws a twenty-sided die with its number. A class rolled on six sides keeps its old reading (`household.die` absent). Browser-checked on the same computer: the die tumbled and landed on 6, and the family was a couple of 45 and 41 with no children. Five injected regressions caught, one only after the old-save test was made to use a six (the one face where the two dice differ in size). 370 tests pass. Not changed: large families are simply crowded in houses built for four or eight and eat more.

**Clearing and the field, 2026-09-14** ([docs/LAND_GRANTS.md](docs/LAND_GRANTS.md) §5.1). *Break new ground* and *Fence the field* are gone: the field is the plots a family has cleared. Pick a person, *Clear a staked plot*, tap the plot, read what it wants (prairie 10 spells, brush 20, timber 30 with the axe) and send them; many hands go faster, called home the work stays, and everybody on it stops when it is cleared. *Fence a cleared plot* rails one plot. Planting costs two seed a cleared plot and walks to each; a plot cleared after planting is not harvested; the stock take a third only from unfenced plots. Ruin returns every plot to staked. Automatic families stake, clear and fence up to three plots. Old classes read their old field as cleared plots and write nothing until a plot changes; no save version moved. Browser-checked on the same computer (invented map, quick pace): survey ten acres of timber, the clearing panel refusing the cleared first patch, *Clear it*, the spells drawn as turned earth growing in the square, a second person sent, both walking in when it cleared, the timber plot drawn as field with no scrub in it, *Fence it* on the first patch with rails drawn round that plot only, the land line *"20 acres cleared in 2 plots, 1 fenced"*; planting refused for want of four seed, as it should be. Fixed in the proof: cleared plots were drawn faint and had prairie oaks scattered in them. `tests/clearing.test.mjs` (7) and a rewritten `tests/improvements.test.mjs`; nineteen injected regressions, all caught. 370 tests pass. **`npm run test:farm`** rewritten for plots and passing (6 checks) with the workstation Playwright below. It had already been failing before this change (it chose the founding family's Thomas, who is replaced when an unrolled family is rolled at Start) and, fixed, found two client bugs, both fixed: a family rolled by the server at Start kept its unrolled family in the page and could not open anybody's work panel until reloaded; and **+**, **−**, **Land** and **Gonzales** did nothing while a person was being watched. `slice-browser-proof`, `travel-browser-proof` and `trade-animation-proof` still choose `hh-1-thomas` and very likely fail the same way; not yet run. **Next on the land:** art for staked and cleared ground (requested); a neighbour's plots seen by going there.

**Survey, 2026-09-14** ([docs/LAND_GRANTS.md](docs/LAND_GRANTS.md) §4.1). A family surveys ten acres anywhere on its own land: pick a person, *Survey ten acres*, tap the land, read what the ground is and where (*"Ten acres of timber a quarter mile south-west of the house"*) or why not, and send them; they walk out over their own land a tick at a time, stake it and walk back, and the plot is drawn staked on the family's map. Both maps. Refused off the land, over its line, on staked or being-surveyed ground, the yard, the old field block, a river or creek the map draws, in the lobby, before the house site. Browser-checked on the same computer (colonies class): the panel, a refusal, a timber plot a quarter mile south-west, the walk out to the dashed square and the staked plot after. Fixed on the way: choosing the house site exactly on the surveyor's mark was refused as an invalid journey; the person panel hid the land; water refusals for undrawn creeks. `tests/survey.test.mjs` (5) plus one house-site test; thirteen injected regressions caught, one after strengthening. 363 tests pass. **Next on the land: §5, clearing staked plots into the field** (the field becomes the cleared plots, per-plot fences, retire *Break new ground*), and neighbours surveying and clearing with it.

**Astra's second batch registered, 2026-09-14** ([docs/ART_REQUESTS.md](docs/ART_REQUESTS.md)). Ten of eleven delivered sheets are in the atlas: the four houses are drawn finished and at their site, walls and roofing stages (the server now reports `phase`, and a neighbour's house is remembered at the stage it was seen); children are drawn as the delivered girl, boy, small child and infant wherever those sheets have the pose, and as a grown figure drawn small where they do not yet; a rider talking to somebody north or south of them turns that way. Registered and not yet bound: the courier dismount sheet, interiors, furnishings, the first cast's dialogue poses, the second cast's idle. **Held:** `animal-stock`, because a longhorn's horns cross into the next cell and the build would clip the figure; asked for again, stand-in oxen stay (`HELD` in `scripts/art-deliveries/index.mjs`). Browser-checked on the same computer: a round-log house drawn walls-up then finished, a five-year-old girl and an infant in their own figures. 357 tests pass.

**Colonies: the going and the house site, 2026-09-14** ([docs/COLONIES.md](docs/COLONIES.md) §6d, [docs/LAND_GRANTS.md](docs/LAND_GRANTS.md) §8.4). On the real land only (`MAP=colonies`; the default map is still Gonzales until the gathering step): lanes are laid over the easiest ground and every lane and track carries its going, so slope, timber, brush and creeks slow journeys on foot, horseback and most with the wagon, and the roads stay easy (`sim/ground.mjs`). The wagon comes in to the surveyor's mark and the family chooses where the house stands anywhere on its holding, shown the ground, height above water, running water, timber, flood risk and lane length; house, field, fence and clearing wait for it; choosing relays the lane, moves the home and field and brings the wagon over, and a house set back is further for every rider (`sim/homesite.mjs`). Water further than a quarter mile slows heavy work until a well is dug. Neighbours choose sites too. **Browser proof (same computer only):** a five-family colonies class on port 8757; the San Felipe family tapped four places on its labor (facts differed: timber by Deadman Creek with water close, open ground 0.4 miles from running water with a 4.7-mile lane), set the house on the far one, and the family moved, the lane and field were redrawn from a 3 KB `/api/map/homes` patch (the whole map is 281 KB), and the supplies line read `water carried 0.4 mi`; the four automatic families had chosen sites, two dug wells, and all four built round-log houses by tick 250; no server errors. `tests/ground.test.mjs` (5), `tests/homesite.test.mjs` (8); twenty-five injected regressions all caught, two only after the tests were strengthened. [docs/evidence/ground-and-site.json](docs/evidence/ground-and-site.json). **352 tests: 350 pass; the two art-inventory tests fail on Astra's delivery still being unpacked, not on this work.** **Then, the same day, on the owner's look at it** ([docs/LAND_GRANTS.md](docs/LAND_GRANTS.md) §8.5): people were drawn six hundred feet tall, so every holding looked five people wide. Owner decided: much smaller figures, the stock rule kept, and the family cuts its own lane. Built: figures a sixth the size with a closer zoom and denser ground detail, a yard a few rods across, a forty-acre field (first patch ten acres), and *Cut the lane to the road* from the house outward (slowest through timber, axe wanted; a cut lane is quicker going; the uncut stretch drawn as stakes; neighbours cut theirs). Browser-checked on the same computer: the labor now reads as open country with the family's camp compact at the house, the lane drawn as stakes beyond the cut stretch, and the cutters came back up the lane when done. 354 tests: 352 pass, the same two art-inventory failures. Still owner-raised and not built: children's farm work (research first), fields placed anywhere on the land (Survey, §4–5). Next: news by riders over real distance, or Survey if the owner wants the land first.

**Colonies, build step 3: automatic neighbours, 2026-09-14** ([docs/COLONIES.md](docs/COLONIES.md) §6c). Every new class the server makes now runs the families nobody joins (`sim/neighbours.mjs`): they choose and build a house, farm, hunt, mend, fence, fetch seed and sell cotton, answer trades fairly with reasons in both stories, and raise walls a student can help with. A family a student joins is marked `played` and never touched; classes and saves made before are unchanged. Live on the server: one student joined, the class ran 154 ticks at Quick pace, the four other families built round-log houses and were planting, harvesting and trading while the student's family was untouched. `tests/neighbours.test.mjs` (6); twelve injected regressions caught, one not (a doubled guard). [docs/evidence/neighbours.json](docs/evidence/neighbours.json). **339 tests pass.** Not yet: unasked help, neighbours' own offers, a Host takeover control, the war (§6c ceilings). Next: step 4, movement by ground and the house site.

**Colonies, build step 2: families dealt to the colonies, 2026-09-14** ([docs/COLONIES.md](docs/COLONIES.md) §6b). On `MAP=colonies`, a class's families are dealt one to Gonzales, one to Liberty and the rest by Almonte's 1834 counts; each gets land 2–12 miles from its settlement by a named watercourse and within 30 road miles of it, trades at a store in its own town (six invented storekeepers, `FIC-GONZ-027`), and arrives "near Liberty" or wherever it is. Proved in the browser with a Gonzales family and a Liberty family (Liberty land 9 miles out, its neighbour the other Liberty family 5 miles away). `tests/colonies-deal.test.mjs` (4); ten of eleven injected regressions caught (the eleventh removes a second guard the sampling already enforces). [docs/evidence/colonies-deal.json](docs/evidence/colonies-deal.json). **333 tests pass.** The owner decided: a store at every settlement; **default classes stay on the Gonzales map until step 5**. Next: step 3, automatic neighbours.

**Colonies, build step 1: places and roads on the real map, 2026-09-14** ([docs/COLONIES.md](docs/COLONIES.md) §6a). `scripts/build-colonies-map.mjs` routes 26 roads over the real terrain between 23 places at official coordinates, crossing the big rivers only at named crossings; Gonzales's ford is on the real Guadalupe at the town and Castañeda's camp 7.1 river miles above it on Béxar's side. `createWorld(seed, n, { map: 'colonies' })` (server `MAP=colonies`) makes a class on that map with families still near Gonzales; the Gonzales chapter plays to its end on it. Default classes are unchanged. Browser: the real Guadalupe, San Marcos, creeks, timber, roads and homesteads draw (rivers now near true width on the real map). Tests: `tests/colonies-map.test.mjs` (4) and `tests/colonies-world.test.mjs` (5); eleven injected regressions caught. [docs/evidence/colonies-map.json](docs/evidence/colonies-map.json). **327 of 329 pass: the two art-inventory tests fail on `public/assets/frontier-v1/atlases/people-cast2-idle.png`, an untracked sheet that appeared on disk at 05:40 on 2026-09-14 without its walk sheet — an art delivery in progress, not touched.** Next: step 2, families dealt across the colonies.

**Real terrain, build step 1: the data, 2026-09-14** ([docs/LAND_GRANTS.md](docs/LAND_GRANTS.md) §8). The owner chose real land for the whole game area — the settled colonies of 1835, 94–99°W by 28–32°N, fine detail everywhere — and said families will not all start near Gonzales. With approval, 19 USGS 3DEP 1 arc-second tiles (973 MB) and nine NHD basins (1.23 GB) were downloaded to scratch (not the repo). `scripts/build-terrain.mjs` (no dependencies: its own GeoTIFF LZW and shapefile readers in `scripts/terrain/`) builds `public/terrain/`: an eighth-of-a-mile elevation grid 303 by 276 miles and 162,177 watercourse lines, 13.7 MB gzip, origin at the real San Marcos–Guadalupe confluence; modern reservoirs, stock tanks, canals and ditches are left out. `sim/terrain-data.mjs` loads it; nothing in the game uses it yet. `tests/terrain-data.test.mjs` checks nine towns' published heights, the coast, the confluence and the rivers; four injected regressions caught. [docs/evidence/terrain-data.json](docs/evidence/terrain-data.json). **320 tests pass.** **Starts decided (2026-09-14, [docs/COLONIES.md](docs/COLONIES.md)):** families dealt near real 1835 settlements across the colonies, each arriving at its own land; news by riders along real roads; distant families can join the army that gathered at Gonzales after October 2. Researched and specified the same day (HIST-TEX-006–013; `docs/COLONIES.md` §5–7): starts at the seven colony settlements dealt by 1834 population with Gonzales and Liberty always seated; places, roads and Gonzales's ford and camp on the real map; news by relay riders calibrated to the dated letters; the gathering and the march to Béxar; a 50-minute class (10 minutes of farming, then the war) with two clocks so compressed time does not feel compressed; and one student playing a normal class alone. Build step 1 (places and roads) is next.

**Land grants, step 1: the grant, 2026-09-13** ([docs/LAND_GRANTS.md](docs/LAND_GRANTS.md)). Every family now holds land marked out for it under the 1825 law's quantities (`HIST-GONZ-036`): a labor, 177 acres, without stock; a league and a labor, 4,606 acres, if it drives cattle and hogs in — chosen in the lobby on the wagon panel, at a cost of two wagon spaces. Every grant is laid out when the world is made and never moves (`sim/grants.mjs`); none overlaps another or reaches within 0.35 miles of another house, in any class size. The family's map draws the boundary, the arrival story and the family book say what they hold and that no title has been issued (`FIC-GONZ-025`). Old saves work out the same grants from their map and hold a labor. Proved live in the browser (refusal, cost, acres, arrival, book, boundary pixels); the stock stand-in was not seen in a readable screenshot. [docs/evidence/grants.json](docs/evidence/grants.json); twelve injected regressions caught. **316 tests pass.** **Next is terrain, not Survey:** the owner decided the same evening on real Gonzales elevation and water, the house site chosen on arrival, wells, movement by ground, and the lane to the road delaying news (`docs/LAND_GRANTS.md` §8) — research and a data download (to be asked for) come first.

**Settling in, step 5: the house-raising, 2026-09-13.** A principal can now set out for a neighbour's homestead from the person panel ("Go to", nearest first) — there was no way to stand on another family's land at all before this. Anybody standing on a neighbour's land while its walls are going up (40–80% of the house's work) can **Help raise the walls**: their spells go into that house, they stop when the walls are up, and both families' stories record who came and how many hours they put in, including a neighbour who arrived too late or was called home. Nobody is asked or pressed; there is no glory in it. All `FIC-GONZ-024` (no first-hand raising account, `HIST-GONZ-032`). Proved live with two families, one in the browser; a first run found the too-late case silent in the host's story, now fixed. [docs/evidence/raising.json](docs/evidence/raising.json); twelve injected regressions caught. **309 tests pass.** Owner decision during the proof: walking speed stays — the walk that looked fast was at Quick pace.

**Settling in, step 4: houses, 2026-09-13.** A family chooses a jacal, a round-log or hewn-log cabin, or a dog-run — each stating what it needs, the hours of work, how many it holds, how rest mends and how food keeps in it — and builds it with one chore, **Work on the house**, that the whole family can be set to at once; it runs until the house stands. A finished house replaces the camp through the same two hooks (rest at home, food spoiling), with crowding for a family too big for it. A neighbour's land is drawn as it was last seen (`household.seenLand`), which retires `arrivalClass`'s ceiling. Houses are drawn with stand-ins from the cabin sprites, and the exterior art is now written out as a request. The research behind it is `HIST-GONZ-029`–`035`; every number is `FIC-GONZ-024`, and a house takes hours rather than a week (`ceiling:`). Not built: chimney/roof/floor method choices, and the house-raising (step 5). `sim/houses.mjs`; [docs/evidence/houses.json](docs/evidence/houses.json); proved live; fourteen injected regressions caught. **302 tests pass.**

**Settling in, step 3: the wagon load, 2026-09-13.** After the roll, in the lobby, a student packs the wagon: 16 spaces, sixteen things (meal, seed, powder and lead, a hoe, four building tools, eight household goods), each stating its space and what it does. The family's stores, tools and `belongings` are recomputed from the whole load, so anything not loaded is not in the game — a family that leaves the hoe cannot plant until it buys one. A student who never packs has the default, packed at creation (3 or 4 barrels, 2 seed, 3 powder, hoe, felling axe, bedding, pot). Refusals are the server's sentence; packing ends at Start; the arrival line names what came. **Which things are on the list is researched** (`HIST-GONZ-027`/`028`: Holley 1833, Woodman 1835, Smithwick, Harris); every space and amount is invented (`FIC-GONZ-024`). The owner then had a local Qwen model attempt the list changes as a subagent; the run could not finish because a separate benchmark kept restarting the local model server, and a Sonnet subagent made the changes, verified here by six injected regressions and a live check. Tools are not read until step 4, belongings not until steps 6–7. `sim/wagon.mjs`; no art needed. This step was first attempted by another model and left half-done (a catalogue and creation-time default, nothing wired); that work was reviewed, its sound core kept and the rest rewritten. [docs/evidence/wagon-load.json](docs/evidence/wagon-load.json); proved live; twenty injected regressions caught. **293 tests pass.**

**Settling in, step 2: arrival by wagon, 2026-09-13.** A new class begins with every family — people, ox, horse, wagon — at the fork where its own track leaves the road, and it drives in at the wagon's pace (2 to 21 ticks, long before the news). There is no house on anybody's land yet: the family camps by the wagon, where rest mends at two-thirds and 3 in 100 of the food spoils a day, and its land line says so. `sim/settling.mjs`; the camp is drawn from the road-camp art, no stand-in. Tests about work at home build their class with `tests/support/settled.mjs`. **Until step 4 a class on this build camps all game.** The Playwright proofs were moved to the settled fixture but not run (no Playwright here). [docs/evidence/arrival.json](docs/evidence/arrival.json); proved live; eleven injected regressions caught. **280 tests pass.**

**Settling in, step 1: a peaceful opening, 2026-09-12.** A class now starts at dawn on September 28 and the first news of the cannon still comes on the morning of the 29th — 13.3 real minutes of peace at the Study pace, nothing historical before it, chores and trades running. Every director moment goes through `momentOf`, and a class saved before this keeps its timeline. [docs/evidence/peaceful-opening.json](docs/evidence/peaceful-opening.json); proved live; four injected regressions caught. **274 tests pass.**

**Next: settling in, 2026-09-12.** Owner direction, specified in [docs/SETTLING_IN.md](docs/SETTLING_IN.md) and to be built next, before the end-of-game reveal. The first real ten minutes are peaceful: families arrive by wagon at dawn on **September 28, 1835** as late settlers (DeWitt's colony recorded no arrivals after 1831; immigration resumed in 1834 — both sourced in the spec), choose what the wagon carries, build a period-correct house — round-log or hewn-log single-pen, dog-run or jacal, each with needs, benefits and problems — with neighbours able to help raise the walls, and make or buy furniture from a carpenter in Gonzales, then decorate. Players also choose what the parents look like and the children take after them. Weather and day/night come later. Eight bounded steps; the first is a clock offset so a saved class keeps its timeline.

**The store's purse is limited, and a horse can be lost, 2026-09-12.** Owner's choices. Marta Ibarra holds 2 reales a family, pays out no more than she holds, and takes coin back into the purse; a family learns she is short at the counter (three injected regressions caught, one only after the test was fixed to stand somebody at the counter). And, specified rather than built because it needs a battle where people died: a horse taken into such a battle can die, and the family goes without or buys another for coin ([docs/FAMILY_CREATION.md](docs/FAMILY_CREATION.md) §5). **271 tests pass.**

**Glory, counted and hidden, 2026-09-12.** Step 3 of [docs/MONEY_AND_GLORY.md](docs/MONEY_AND_GLORY.md). `sim/glory.mjs` awards glory from the battle's participation record — supplied 1, present 2, fought 3, multiplied for every 15 road miles the family came, once per person per event, nothing extra for a casualty (`FIC-GONZ-023`). It is stored at `world.glory` rather than on the household, because a household is projected to its student whole, and each award is a **sealed** event that no projection sends. Proved: a planted value reached no payload at any tick; a class with a planted glory played out identically to the same class without, so nothing reads it; and live, 190 snapshots of a whole class carried none while the server's save held 4 glory for the family. [docs/evidence/glory-hidden.json](docs/evidence/glory-hidden.json); six injected regressions caught. **270 tests pass.**

**Money, steps 1 and 2, 2026-09-12.** Coin is a household resource in whole reales, starting at none, in the supplies line and tradeable. The store counter now asks how to pay or be paid: cotton 2 food or 1 real a whole bale, powder 2 food or 1 real, seed 3 food or 1 real, surplus food 3 for 1 real, and a new hoe is **coin only** at 2 reales — mending at home still costs nothing. The sourcing is now DOCUMENTED from TSHA (`HIST-GONZ-023`: Almonte's 1834 report that not ten transactions in a hundred used coin), and prices are `FIC-GONZ-022`. The no-money tripwire test was retired on purpose. [docs/evidence/money.json](docs/evidence/money.json); proved live; seven injected regressions caught. **266 tests pass.**

**Stand-in art is standard practice, 2026-09-12.** Missing art is requested in `docs/ART_REQUESTS.md` and drawn meanwhile from existing art, marked `stand-in:`. First use: figures chosen by sex and age, children drawn smaller by age.

> **Waiting on Astra (owner's reminder, 2026-09-12).** Art is requested and not yet delivered: children, a second cast so men and women look like themselves, a rider who dismounts and remounts, and north/south dialogue facings. Everything Astra needs is in [docs/ART_REQUESTS.md](docs/ART_REQUESTS.md). Until it arrives the game draws **stand-ins** from the existing art, listed in that file — grep `stand-in:` in the code.

Read **VISION.md → this file → TECH.md → GAME.md**, then **HISTORY.md** before changing historical content. The full Claude roadmap remains reference; do not start later arcs to compensate for unfinished core quality.

**Latest owner direction: news must arrive through people.** *(Step 1 of its build order shipped 2026-09-11; see the next section.)* Read [docs/LIVING_INFORMATION.md](docs/LIVING_INFORMATION.md) before further information/UI work. Messengers must travel from events or real relays, meet a specific family member in range and deliver news through conversations. Near Gonzales and far Liberty households learn at different times and face different reachable opportunities: early service with lasting Alamo/Goliad consequences, later army participation, evacuation protection, San Jacinto and plausible government work. Houston's uncertain plans should create frustration through incomplete reports, without forced tragedy or a claim that he never communicated. The document supplies architecture, regional pacing, historical constraints and production release gates. **Step 1 of its bounded build order is implemented and proved as of 2026-09-11, for one report only. Steps 2 and 3 - relays, onward delivery, director integration, and the regional service, evacuation and government paths - remain required next work and not implemented gameplay.**

**Art requested from Astra, 2026-09-12.** [docs/ART_REQUESTS.md](docs/ART_REQUESTS.md) is now the standing queue of art requests. The first asks, in priority order, for **children** (a girl and a boy of 5–9, a small child in a gown, an infant in a basket), a **second cast** so men and women look like themselves (including a woman in the principal's rust, since a lone mother is now a principal), a **rider who dismounts, remounts and talks on foot** beside a tethered horse, and **north/south dialogue facings** for riders and the existing cast — each with the exact sheet layout, identities, clothing and pipeline steps, and what Claude will wire on delivery. Found while writing it: the library already has a woman (`teal`), but figures are chosen by a hash of the person's id, so a rolled mother can be drawn as the grey-bearded `elder`; choosing by sex and age is part of the wiring that waits on the new cast. Registered as `family-cast` in `scripts/art-registry.mjs`.

**Who took part in the fight, and where they stood, 2026-09-12.** Next-task 4. `williams-camp` is the point the Mexican detachment is drawn on, so a family member who went upriver stood among the Mexican soldiers for the whole fight. They now stand with the Texian force (0 A.D.'s formation-member rule: identity and state stay the person's, only position follows the formation), set off home from where they actually stand, and the server records privately who took part and how — `world.participation.gonzales[personId]` with `supplied` or `present`, the record glory will be counted from. 0 A.D.'s slowest-member pace was **deliberately not adopted**: the timing of Gonzales is fixed by `HIST-GONZ-003` and must not depend on who turned up. [docs/evidence/battle-members.json](docs/evidence/battle-members.json); proved live with a screenshot; five injected regressions caught. **258 tests pass.**

**No report is posted through a door any more, 2026-09-12.** Next-task 6 finished for the slice: how the fight ended is said by riders who start at the camp on Ezekiel Williams's land and hand it on, in dialogue held inside HISTORY.md's exclusions (no counts, no casualties either way, an orderly withdrawal); and the upriver call is asked on the night crossing as news learned in Gonzales, saying "are crossing tonight" or "crossed N hours ago … follow them" by when the family learned it — it used to say "tonight" to everybody until dawn. Measured: all 15 and all 30 families hear the outcome before the slice closes. **Found and fixed:** a hand-off could go to a rider with the same name as one already in the chain ("Ned Falk, who had it from Ned Falk"). [docs/evidence/outcome-news.json](docs/evidence/outcome-news.json); proved live; seven injected regressions caught. **255 tests pass.**

**What the hidden stats do, and who answers, 2026-09-12.** Steps 3 and 4 of [docs/FAMILY_CREATION.md](docs/FAMILY_CREATION.md): the best housekeeper at home makes food last longer and the saving leaves with them; strength paces planting, harvesting, clearing and fencing; a call is answered by whichever parent or child of sixteen or more the family sends, and the march is put to whoever carried the food — so a family can send its mother. [docs/evidence/family-effects.json](docs/evidence/family-effects.json); proved live; eight injected regressions caught. **251 tests pass.**

**A family is rolled, 2026-09-12.** Owner direction: a student rolls a die on joining and the number is the family — one parent for 1–3, two for 4–6, the rest children — with sensible ages and hidden strength, health and housework that differ on average by sex and overlap between people. Read [docs/FAMILY_CREATION.md](docs/FAMILY_CREATION.md). **Step 1 is built** (`FIC-GONZ-021`, [docs/evidence/family-roll.json](docs/evidence/family-roll.json)): the dice in the lobby, the family it makes, the family book with ages, a child under ten sent nowhere, the hidden stats proved absent from every payload, and Start rolling any joined family that never did. Proved live in a browser. **Not built:** children and women drawn as such (the art has one adult figure — ask Astra), the hidden stats having any effect, the family choosing who answers a call, and the hidden lethal risk in battle, which cannot exist until a battle where people died does. **247 tests pass.**

**Nobody knocks on a rumor, 2026-09-12.** The owner started next-task 6 and chose its rule: a family's account of the cannon news now decides what it is asked. Heard from the eyewitness or second-hand, the neighbour brings the food call to the door; heard as a rumor (two or more hand-offs), the family is asked whether to **go to Gonzales and see**, and standing there makes the word firm and brings the call in town. `FIC-GONZ-020`, [docs/evidence/knowledge-decides.json](docs/evidence/knowledge-decides.json). **Three defects found by measuring, all fixed:** every call asked about somebody called *Thomas* whatever the family had named its people; the word left Gonzales on a household-order clock, so hh-1 twenty-seven miles out was told on the spot by a neighbour who did not exist and a family four miles out heard seven hours after one five miles out; and once every rider left at the same minute, a far family's rider could take a nearer family's gate from that family's own rider and stand there waiting, so `advanceEncounters` now lets the rider sent to a family speak first. Proved live in a browser end to end; nine injected regressions all caught. **240 tests pass.**

**Owner direction, 2026-09-12: deployment waits.** Next tasks 5 and 7 below — physical devices, the half-proved update and uninstall paths, and code signing — are **held until the game is mostly complete**. Do not start them unprompted.

**Owner direction, 2026-09-12: money, hidden glory, and a winner.** *"i do want money. players should have to trade or spend money. winning the game at the end will be through a combination of who has the most money, multiplied by glory. glory will be attained by participating in major historical events. glory will be a hidden stat that players don't see. it's revealed at the end of the game."* **Specified, not built** — there was no usage budget to build it. Read [docs/MONEY_AND_GLORY.md](docs/MONEY_AND_GLORY.md) before any economy, director or ending work. The owner answered the open design questions the same day: glory comes from **every kind** of participation with **fighting weighted above supporting**; the final outcome is **money × (1 + glory)** so a family with no glory keeps its money; and **the Host names a winner**. A family that never fights **can** win, but it should be difficult. This amends `VISION.md` §20 ("No rankings" is gone; "No best patriot" stays) and §11, and reverses the no-money decision recorded below and in `HIST-GONZ-022`. Two things any builder must not get wrong: glory must reach **no student and no Host payload before the ending**, and **no director may read it**.


**And a real installer, the same day.** `TexasRevolutionSetup.exe` is the same binary as the launcher, carrying the game inside it as an embedded zip: run from a folder with no classroom beside it it is a setup program, run from inside an installation it is the launcher. The payload is **the game and never the launcher**, because the setup copies *itself* into place once it has unpacked - embedding the launcher inside the launcher would put .NET in the download twice. One 136 MB download, no second asset to keep in step.

It installs **per-user** under `%LOCALAPPDATA%\Programs\TexasRevolution`: no administrator, no Program Files, no UAC prompt, and nothing a managed machine is likely to refuse. It registers under `HKCU` so it appears in Settings ▸ Apps, and uninstalling asks separately whether to keep saved classes and keeps them by default. Installing over an existing copy replaces files and never touches `data`. `--install [folder] [--desktop]` does it silently for a room of machines and `--extract [folder]` unpacks without registering anything, for a memory stick.

**Proved end to end on a setup file marked exactly as a browser download leaves it**: everything landed and nothing leaked (no handoff, no tests, no evidence records, no payload left behind), the installed copy started a class in 3.2 seconds and stopped clean with no stale save lock, and the registering install produced an Add/Remove entry with a working uninstall string and both shortcuts - all of which the harness then removed again.

**Two defects, both from testing rather than reading.** Windows writes zip entries with backslashes, and the code decided "is this a folder" on the *original* string after having normalised a copy to forward slashes - so every folder looked like a file and the install died on the first one that needed creating. And `--extract` was making shortcuts and an Add/Remove entry for a copy nobody installed, which left two shortcuts pointing into a deleted temp folder on the machine that ran the test; unpacking and installing are now different things.

**Nothing is code-signed.** SmartScreen will say *"Windows protected your PC"* on first run and a teacher has to choose More info ▸ Run anyway. Same class of obstacle as the Mark of the Web and the same cause - nobody has paid for a certificate, which is a few hundred dollars a year. It should be expected rather than discovered in front of a room.

**The characters were never moving too fast; the clock was, from 2026-09-11.** `WALK_SPEED` is three miles an hour and `RIDER_SPEED` is 7.8, and both were already right. What was wrong was one real second a tick: at twenty fictional minutes a second a walking figure crossed **8.7 of its own drawn body lengths every second**, against **0.78** for a person walking at three miles an hour, with a correct 2.8-step gait playing underneath - life-speed legs taking a nineteen-hundred-foot stride. Zoom could never have fixed it, because screen speed is scale times miles per second and a drawn person is also proportional to scale, so the scale cancels. `PACES` in [server/app.mjs](server/app.mjs) now offers **Study 9.5s / Brisk 4s / Quick 1s**, the Host may change it mid-class, and **nothing under `sim/` can see it** - the same day, the same distances, the same arrivals at every pace. The pace is outside the world and outside the save.

**The tick that makes the gait honest is the same tick that fills the lesson.** The slice had been running in 4 minutes 44 seconds against a stated 45-minute period; at the study pace it fills 45 minutes without one new event being authored. The fix for the complaint and the gap in the lesson length turned out to be one number. Proved in [docs/evidence/pace.json](docs/evidence/pace.json); **148 automated tests passed at that commit**, and seven injected regressions were all caught - **one of them only after the guard that mattered most was found missing**: every test passed happily while the shipped entry point defaulted back to the one-second tick, and `server/main.mjs` cannot be imported to check it because loading it starts a real server.

**The general store, and the crop nobody can eat, 2026-09-12.** The owner: *"there might could be a general store in each town. when players take their crops to sell for money, maybe they can buy more powder and shot?"* Two ideas in that, and **the first one turned out to be a defect rather than a feature.**

**A cotton field came in as food.** `harvest-field` added to `resources.food` whatever the field was growing, so half the class ate its cotton. That is not a balance choice — it is the game not knowing what it had grown, and it made the crop a household is dealt at founding mean nothing but a sprite. Cotton now yields **cotton**, which nothing eats, and the general store at Gonzales trades **two food a bale**, taking as much as whoever went can carry. A cotton field is worth about twice a corn field **and nothing at all until somebody walks it into town** — which is the shape of a cash crop, and it gives the wagon a third job.

**The second idea — money — is the one thing here that was deliberately not built.** *(Reversed by the owner later the same day: money is wanted. See the owner direction above and [docs/MONEY_AND_GLORY.md](docs/MONEY_AND_GLORY.md). What follows is why it was declined, and it still explains why coin must stay scarce and barter must survive.)* Hard coin was scarce enough in Mexican Texas that barter was the ordinary way of doing business, so a store that takes cotton and hands back what a family needs is **nearer the period than a counter full of coin**, as well as one fewer number for a twelve-year-old to track. `HIST-GONZ-022` says so in its implication column, and a test asserts no household and no tradeable good is ever named for a currency, so a later change has to be deliberate.

**Marta Ibarra was always the general store; now she is called one** — and her description reached the screen for the first time. The client had its own copy of it, three strings keyed off what she trades in, so changing the town changed the town and nothing a student could see.

**Two things the payload bound caught, and the bound was right both times.** A household's **remembered story was projected whole on every tick** for the length of a class — the only genuinely unbounded thing on that channel, and worth 6 KB on a busy family by the end. Capped at twice what the journal shows. And the bound itself was calibrated when a tick was **one real second**: thirty students at 6 KB a second is 190 KB/s, which mattered. A tick is 9.5 seconds now, so the test measures a family that has **worked a full afternoon** rather than a fresh one, and bounds that.

**233 tests. Twelve injections, all caught.** [docs/evidence/store-injections.json](docs/evidence/store-injections.json).

**An afternoon at the mark, 2026-09-12.** The owner asked whether a family should be able to practise shooting at home to get better at it. **Yesterday I refused exactly this**, as Total War's veterancy, in [§8 of the reference architectures](docs/REFERENCE_ARCHITECTURES.md) — and the refusal was drawing the right line for the wrong reason. That entry is now **amended rather than quietly replaced**, because a verdict that changes is worth reading twice.

**The distinction that makes it work:** veterancy is getting better at what you were already doing, free, as a reward for repetition. **Practice is a decision that costs** — an afternoon nobody spends planting, and **two powder out of a house that holds three**, the very thing the skill is for. It cannot snowball, because the cost rises against the benefit and a hand tops out at three. And it removes no pressure at all: my own argument was about `hands` and the hoe, and **hunting has never had anything to do with the town**.

So **hunting is the only trainable skill**, which is the line the original refusal was actually drawing without saying so. Farming and hands stay exactly as dealt, and a household without the handy member still walks into Gonzales.

**Why it costs rather than being free is documented, not invented.** `HIST-GONZ-021`: powder on this frontier was scarce and dear enough that the rifles themselves were built around conserving it, and settlements could be down to a pound of it between them. Practice was something a family decided to afford. (That claim is **STRONGLY SUPPORTED and no better** — general histories read through search, not TSHA or a primary source, and no figure from it is used as a number anywhere.)

**223 tests. Nine injections, eight caught and one genuinely unreachable**, recorded as such: the step's own clamp is the middle of three locks — the control refuses the work before it begins and `validateWorld` refuses a world holding a skill outside one to three — so nothing can reach it. It is kept and marked `ceiling:` because it is the only lock that would still hold if a chore ever carried two `practise` steps, which is a one-line mistake nothing else would notice, and which this drill injected separately and caught. [docs/evidence/practice-injections.json](docs/evidence/practice-injections.json).

**This is my family — and the game finally knows who they are, 2026-09-12.** Next task 2, and the one that came from a real person rather than from this list: the first player asked **who the mother and the father were** and the game had no answer. Four names in a roster, a `relationships: {}` nothing ever wrote to, and every household in the class a copy of the same four names.

**Now:** a household is a father, a mother, a daughter and a son, each described in a sentence — *"Married to Refugia. Father to Delia and Marcos."* — in a **Who we are** page at the front of the family journal. **Every name is the student's to change**, people and family alike; until a family names itself it goes by its principal, *Alvin's family*, which follows him if he is renamed and stops following the moment somebody chooses a name.

**Three things are kept strictly apart, and that is the whole design.** Kin is the world's and never moves — renaming somebody does not change whose child they are. Names are entirely the student's. And **ids are neither**: `hh-1-thomas` stays `hh-1-thomas` for the life of the class, because `skillsFor` and `visualVariant` are derived from it and a rename must not touch a person's hands or face. The price is an id that keeps its founding name, so a student's Bartolo may be `hh-3-thomas` underneath — ids not lying about identity, which is the right way round.

**Default names are dealt, not hashed, and the first version was measurably bad.** Hashing each household into a pool and taking the remainder gave fifteen households **seven** distinct mothers and a run of **four consecutive fathers called Feliciano**; a remainder of a hash is not a shuffle. The pools are now shuffled once from the seed and dealt in order: fifteen households, fifteen different fathers.

**Names are text one child types and another reads**, so they are held to a shape — letters, marks, spaces, name punctuation, one line, twenty-four characters — and **every rename is written into that family's record** so a teacher can see what a class has been typing. That is the whole of the moderation this can honestly offer, and it is worth a teacher knowing it before a lesson rather than after.

**216 tests. Eleven injections, all caught — and three of them took more than one aim, which was the useful part.** One struck a loop a rewrite had already removed. One was caught by nothing because `applyAction` refuses a neighbour's person before the writer is ever reached, so the test now calls the writer directly — the lock that would still hold if a later caller found another way in. And one was guarding **luck**: "no family holds two people with one name" is guaranteed by the pools being disjoint, not by any code path, so what is asserted now is the disjointness. [docs/evidence/family.json](docs/evidence/family.json), [docs/evidence/family-injections.json](docs/evidence/family-injections.json), and nine PASS lines in Chrome in [docs/evidence/family-browser.json](docs/evidence/family-browser.json).

**Two things this broke, both found by the proofs.** The journal's new name box answered to `[name=name]`, which is the join form's selector — *every* browser proof fills that field, and Playwright's strict mode caught the collision immediately. And two proofs plus eight unit tests hard-coded "Thomas"; they now read names out of the world, which is what they should always have done.

**Powder and lead, 2026-09-12.** The owner asked what Total War might give hunting and battles. **Three quarters of that game is what VISION.md §16 forbids by name** — its whole grammar is *select a unit, issue an order*, and the atom here is a household with named people in it. That refusal is written up as [§8 of the reference architectures](docs/REFERENCE_ARCHITECTURES.md), along with five more refusals and six ideas that turned out to be here already from better sources.

**Two of its ideas were exactly right.** The first is the one with teeth: **a shot costs something finite.** Powder and lead is now a household resource — a shot spends one, an empty house is said so on the control before the answer is pressed, somebody deciding alone with nothing to fire comes away rather than firing, and more costs food and an afternoon in town or a neighbour with some to trade.

**It is the material tie between hunting and taking part that the owner had been circling for two days.** The volunteers at Gonzales were settlers who brought their own arms (`HIST-GONZ-020`), so the powder that goes upriver is the powder in the family's house. Spending it in the timber is not having it when somebody is asked to go. It changes **nothing** about the battle — `HIST-GONZ-004` fixes that and a household with none may still go and carry supplies — and everything about the family afterwards.

**The second is a caption, and that is the right size for it.** Total War's morale system exists to say that pre-modern battles ended when a side *decided to stop*. The Host used to narrate the phases without ever saying why one gave way to the next, which reads as a script advancing. The exchange now says neither side is destroyed and both are deciding whether to go on; the withdrawal says the detachment was not beaten down, it broke off.

**206 tests. Thirteen injections, all caught — and the one that took three attempts found a real hole in a different guard.** Putting a dead field back on the per-tick channel was invisible: the payload's size bound is a **ceiling** that catches gross growth, not creep, and ninety bytes went back on unnoticed. A work entry now has an allow-list of keys. *(The second miss was the harness, not the code — its fallback re-ran the test after the `finally` had already restored the injection.)* Trimming two fields nothing read — `level`, and a `kept` the client recomputes — paid for the whole feature and left the payload **480 bytes lighter than before it started**. [docs/evidence/powder-injections.json](docs/evidence/powder-injections.json).

**One shape for every decision, 2026-09-12.** The owner asked whether hunting could be a hidden tutorial for taking part in a battle. **It can, but the condition was not met.** A tutorial teaches a shape, and hunting had just been given a good one — a question on a named person, answers that each say what they cost, silence written down — while the call from Gonzales had none of it: four hard-coded buttons with the price glued onto a label, one of which sat enabled for a household that could not pay it. So the work was not to add anything to hunting. It was to make the large decision **the same control** as the small one, and it is.

**Three things now transfer**, without the game ever saying so: a decision arrives mid-action and waits for you; you read the *person* rather than odds, because both outcomes resolve from condition and neither has a die in it; and how you prepared upstream decides what they can do downstream — ride rather than walk and they arrive steady enough for the shot, which is the same fatigue that decides whether going upriver leaves somebody tired or hurt.

**Two things do not, and should be said plainly.** A hunt has no opponent acting on its own schedule, and a hunt is one person alone rather than one person inside a formation that moves without them. Both belong to the Battle Director and nothing rehearses them yet.

**Nothing says any of this out loud, on purpose.** The owner's word was *hidden*, and it is also the safer design: a game that told a class hunting is practice for shooting at people would draw a line this project has no business drawing. The historical continuity is real and needs no pointing at — the Texians at Gonzales were settlers with their own arms.

**Two live defects came out with it.** `callAvailability` is now asked by the control *and* the handler, so a button that says a thing is possible cannot be refused on the press. And an unanswered call or march used to flip to `expired` with **no event at all** — a family that never came to the door had no story about it, in the log the epilogue is built from. Both now record what happened, and the march names who was left standing.

**196 tests. Nine injections: seven caught, one weak test found, one genuinely unreachable and recorded as such** rather than quietly dropped — the expiry runs inside `once()`, so the loop's own guard is defence in depth, and the assertion is kept with a ceiling note because the guarantee lives in a different function. [docs/evidence/one-decision-shape.json](docs/evidence/one-decision-shape.json), [docs/evidence/one-decision-injections.json](docs/evidence/one-decision-injections.json).

**A hunt you take part in, 2026-09-12.** The owner: *"polish hunting. it needs to be more than just [tell character to hunt and boom they do]."* The work now **stops and asks**. Somebody downwind, with a long shot, and three answers that are genuinely different: take it — which connects or not depending on whether *that person* is tired and whether they have the knack, both stated on the button in their own words; wait three hours for a certainty, at the price of three hours; or come away with nothing and get the rest of the day back. Nobody waits for ever: after two fictional hours they decide alone, and the record says that is what happened rather than pretending the family chose it.

**No die anywhere in it.** `FIC-GONZ-008` requires outcomes inside a visible risk and this file has always answered by containing no randomness at all; that is still true. `steadyHand` is the whole rule, and both halves of it are already on screen before the student answers.

**And it is where four systems finally touch.** Fatigue comes from the road; the road's cost comes from the travel mode; a tired hand misses. **How a family travelled decides whether it can shoot straight** — and not one part of that chain is new. It is the interaction VISION.md §21 asks for, assembled rather than invented.

**The mechanism is general on purpose.** `{ ask: 'shot' }` is a chore step and the interpreter knows nothing about hunting. Later steps carry `when: [...]` and run only for the answer they belong to. The ford, a trade, a river crossing are the obvious next ones.

**189 tests. Eleven injections, all caught — after one was missed for a reason that has now bitten twice.** "Waiting costs no time at all" was caught by nothing, because the three answers were each played on **their own seed**, which is three different maps and three different roads; the tick counts were never comparable. The travel-mode cost test made exactly this mistake a day earlier and passed by luck. One seed for all three. [docs/evidence/hunt-decision-injections.json](docs/evidence/hunt-decision-injections.json).

**A hunt you can watch, 2026-09-12.** The owner: *"when they're out hunting, maybe i should see them actually hunting?"* It was one step — five ticks of standing on whatever spot the road left them with a searching pose playing. It is now four stages in four places: reading the ground at the edge of the timber, working up through the trees, waiting downwind and still, and the shot. A new `stalk` step moves a person about the place they are standing (the same relative move `walk` makes about a yard, refused outright for anybody on a road, which is the teleport `walk` fell into once) and falls through to the work on its own step, so a stage is one thing rather than two. They walk home drawn **carrying** it — a cycle the library has had since the art landed and only the harvest had ever used.

**Nothing names or draws the quarry, and that is the honest picture rather than a gap.** `HIST-GONZ-013` documents buffalo as the only game for this locality and this project names no other, so the kill is a puff of `musket-smoke` in the trees and then somebody carrying something home. A test asserts no stage, name or description contains any of twelve species. There is also no civilian firing pose in the library, and `volunteer-aim` was deliberately not borrowed: dressing a farmer in the militia sheet would put a soldier in the timber, and the browser proof asserts no militia clip was bound.

**Cost-neutral, and the injection drill is what made it so.** The first version gave each stalk a tick of its own before its work step, making a hunt half again as long as it had been. "The stages all run in one tick" was caught by *nothing* — which said plainly that the tick was buying nothing, because the work after each stalk already held the figure in its new place. Collapsing move-and-work into one step put it back to four to six ticks against the old four to seven, with the yield unchanged.

**182 tests. Ten injections, all caught — after two were re-aimed and one proof assertion was found to be worthless.** One injection was faulty (it removed one stage of three, and three minus one is still a sequence). One was a real gap: on foot the carry cap of five hides any yield change, so doubling the kill was invisible until the test also hunted with the wagon. And the browser proof first asserted that *some* `-idle-s` clip was bound — three other people are standing about the farm, so one of them idling satisfied it while the hunter did nothing. It now asserts the hunter's own colour. [docs/evidence/hunting.json](docs/evidence/hunting.json), [docs/evidence/hunting-browser.json](docs/evidence/hunting-browser.json), [docs/evidence/hunting-injections.json](docs/evidence/hunting-injections.json).

**A measurement trap, hit for the second time.** The proof first selected the hunter in the journal, which locks the camera to them — and a camera locked to a figure pins it at the centre of the screen where it cannot appear to move at all. It measured two places and failed. The pace measurement fell into exactly this in exactly this way. **If you are measuring whether something moves on screen, do not watch it.**

**A farm is something a family makes, 2026-09-11.** The owner: *"players should be able to expand their farms... they'll need to be destructible (runaway scrape)."* A household now starts with a cabin, one patch of broken ground and **no fence**, and two new jobs change that. **Break new ground** is a long afternoon with the hoe and makes the field bigger for good, up to four times what they came with; a bigger field swallows more seed and gives back more. **Fence the field** splits rails and lays them round the crop, and until they are up **a third of every harvest goes to stock** — which is not a balance knob but `HIST-GONZ-018`: in this colony cattle and hogs *"were allowed to range freely and flourished without feed on the land"*, so what was fenced was the crop and not the beast.

**That same line settles the open question about animal chores, and settles it against them.** The design research had already argued that feeding schedules are the classic tedium trap; the documented practice is that stock here were **not fed at all**. There is no feeding chore and there should not be one. `HIST-GONZ-018`'s implication column says so, so a later agent cannot add one on realism grounds.

**The interaction worth naming was not designed.** Past three clearings a crop is more than four people can carry and wants the ox and wagon standing in the yard — and since this morning, taking the wagon somewhere means it *is* somewhere else. A family that expanded its field and then sent the wagon to the timber has a ripe crop it cannot bring in. The rivalry came from the travel modes and the threshold from the field, and they met on their own.

**Destructible, and deliberately not wired to anything.** `ruin()` takes a cabin, a fence and the work of clearing, leaves the labor itself, and is called by nothing in the Gonzales afternoon. `HIST-GONZ-019` is the chapter it is for: Houston reached Gonzales on 11 March 1836 and ordered every inhabitant out, and families came back to homes that no longer existed. No destruction around Gonzales on 2 October 1835 is documented, so none is invented — and one test plays a whole class through and asserts it stays that way. Building the state now is the difference between a Runaway Scrape that takes a family's own property and one that prints a sentence about it.

**175 tests pass. Twelve injected regressions, and the one that got through is the same shape as last time.** "Ruining what is already ruined says it happened again" was caught by nothing: the test asserted the second ruin returns an empty list, which stayed true, while the *event* was recorded anyway — a Runaway Scrape passing a household twice would have announced a loss that did not happen, into the record the epilogue is built from. Six PASS lines in Chrome including the one only a browser can answer: after an afternoon of clearing the field is **drawn 2.00× the area it was**. [docs/evidence/farm-improvements.json](docs/evidence/farm-improvements.json), [docs/evidence/farm-improvements-browser.json](docs/evidence/farm-improvements-browser.json), [docs/evidence/improvements-injections.json](docs/evidence/improvements-injections.json).

**News stopped being a notification, 2026-09-11.** The owner: *"i don't like the popups at the bottom of the game that let us know a major event is unfolding. we need a better system. something that matches with our overall vision."* Two cards were stacked in the bottom-left corner of the map — a headline bar and a rider prompt — and both were the interface announcing something the world was already showing. **They are gone.** The arrival is the rider drawn reining in at the farm with a mark over the one person he stopped; the way in is a **Listen** button on that person's own panel, offered to nobody else, because the rule the whole encounter system turns on is that the person who was at the door is the person who heard it. The record moved out of the screen-reader-only block and became the **first page of the family journal**, with a small mark on the book when something new is written in it.

**And the meeting plays out as a meeting.** The owner again: *"when the rider arrives, shouldn't it play out more like a conversation?"* Lines now arrive one at a time with the speaker named while their turn is pending, and the family's questions wait until the rider has finished talking. Every word is the server's — this decides only when each line appears — and it is **not** the forced reading timer `LIVING_INFORMATION.md`'s attention gate forbids: nothing is removed, the journal holds every line regardless, and reduced motion puts the whole exchange up at once. A conversation paces once and is never replayed.

**Seven injected regressions, six caught, and the two that got through are the interesting part.** Nothing checked that the Listen button belonged to the person the rider actually stopped — offering it on every member of the family passed the entire proof. The server refuses the command either way, so it was never a hole in the fog of war; it was a control that lied about who was spoken to, which undoes the one idea the system exists to teach. And the first version of the pacing redeclared an identifier that already existed in `public/app.js`: a parse error, so **every student page failed to load**, and nothing under `tests/` could have seen it because nothing there loads the client. The browser proof caught it on the first run. [docs/evidence/news-arrives-as-a-person.json](docs/evidence/news-arrives-as-a-person.json).

**Horse for speed, ox and wagon for heavy, from 2026-09-11.** Every family owns a horse as well as its ox and wagon, and a person is sent **on foot**, **on the horse**, or **with the ox and wagon**. The three are genuinely different and none of them wins: walking is three miles an hour, always possible and the only thing that really tires anybody; the horse is near three times the pace at three tenths of the exertion but carries almost nothing; the wagon is *slower than the people walking beside it*, brings home four times what a person can carry, and will not go over the ford. There is one of each between four people.

**The rivalry is not a lock — it is a location.** A piece of property that goes on a journey gets its own travel record on the same road at the same speed, and `borrowedBy` names who took it. Both had been in the world since it was first built and neither had ever been used; the art library has likewise carried `ox-walk`, `horse-walk` and `wagon-loaded-travel` since the atlases landed, so until now **a family's animals had never once been seen to leave the yard**. The ox that walked to Gonzales is standing in Gonzales, and the next person who wants it is told who has it and where — which is the same idea a feeding schedule reaches for, without the alarm clock. That refusal is written up as a verdict in [docs/REFERENCE_ARCHITECTURES.md §7](docs/REFERENCE_ARCHITECTURES.md).

**A hunt kills more than one person can carry.** The timber trip now yields ten rather than five; on foot exactly five still comes home, so yesterday's balance is the floor and the wagon is an upside for the family that spends the extra hour on the road rather than a tax on the family that does not. The button says how much will come home *before* it is pressed, and the shortfall is said out loud afterwards. `FIC-GONZ-014` registers every number, and names the one invention worth naming: `HIST-GONZ-013` documents "some horses" for this locality, so **giving one to every household is a gameplay decision**, made because nothing yet lets a family without a horse borrow one and an asymmetry with no remedy is a dead end rather than a pressure.

**This was only possible because of the pace.** At the old one-second tick no travel decision could ever have mattered — every journey finished before a student could think about it.

**163 automated tests pass. Twelve injected regressions, every one caught — and the first attempt found a hole where I had not looked.** "Any word at all is accepted as a way of going" was caught by *nothing*, because an invented mode is refused three separate times over, so breaking any one of them changed nothing observable. Chasing that found the guard that was genuinely missing: a mode that is real but **unavailable**. `beginChore` wrote the work down and *then* took its first step, so a refusal there left somebody holding a chore with no road under it — and the next tick simply moved them on to the second step, hunting in the timber without ever leaving the yard. The guard is now keyed on whether a chore travels rather than on whether it hauls, because the journey **home** runs inside `stepWorld`, where a throw stops the whole class rather than one command. [docs/evidence/travel-modes.json](docs/evidence/travel-modes.json), [docs/evidence/travel-modes-injections.json](docs/evidence/travel-modes-injections.json), and ten PASS lines in Chrome in [docs/evidence/travel-modes-browser.json](docs/evidence/travel-modes-browser.json) (`npm run test:travel`).

**No save version moved**, which is the judgement `CLAUDE.md` asks for rather than a reflex: a class saved before this has no `mode` on its journeys and no horse in its yards, and both absences read correctly — everybody walked, and that family has no horse.

**A prerequisite bug went with it.** The renderer spread one tick's movement across at most one second, which was invisible while a tick *was* a second and became a bug the moment a class could be slowed: a traveller glided for a second and then stood frozen for eight and a half. The snapshot now carries `tickMs`. `window.__drawnAt` was added on the same contract as `window.__viewEntities` - presentation evidence, read by proofs and by nothing in the application - because the one question worth asking about motion cannot be answered from a projection that moves once a tick.

**The launcher has the owner's Texas emblem**, supplied 2026-09-11, built to a multi-resolution icon at seven sizes. **There are now two icons, because one binary does two jobs:** the executable carries the emblem *opened as a box*, so the file sitting in a Downloads folder looks like the setup program it is, while the installed program keeps the plain emblem — written beside it at install time and read by every window title bar, both shortcuts and the Add/Remove listing. The one place they diverge is the installed `.exe` seen in Explorer, which keeps the setup icon: a single-file bundle cannot have its icon resource rewritten after publishing without breaking the bundle, and nothing a teacher actually clicks goes through that path. Decorative and not a historical illustration; recorded in [docs/art-provenance.json](docs/art-provenance.json), which notes that the Alamo it shows is San Antonio in 1836 rather than the Gonzales afternoon this prototype simulates.

**There is a real launcher, from 2026-09-11.** `TexasRevolution.exe` in the package root: a **Start the class** button that becomes **Stop the class**, the join address on the face of it, **Open class view** in a window of its own rather than a browser tab, **Open a player window**, **Copy the join address**, the installed release, and **Check for updates** which downloads and installs a newer build with a progress bar. It offers a desktop shortcut once and adds a Start-menu entry either way. It is a WinForms application in [launcher/](launcher), built by [scripts/package.ps1](scripts/package.ps1) rather than tracked, and it is **deliberately a face and not a second implementation** - start and stop drive `scripts/launch.ps1` and `scripts/stop.ps1`, which already authenticate with the private Host credential, checkpoint and pause, and wait rather than killing. A second copy of that protocol would be a second thing to get wrong.

**Self-contained .NET, about 60 MB, and that is the point of the size.** A school machine may have no runtime and no right to install one. The presentation window is WebView2, which Windows 11 already ships, rather than a bundled browser - that was the choice that kept this at 131 MB instead of 200 MB+. Updates come from GitHub's own releases API, which answers unauthenticated for a public repository at sixty requests an hour: no account, no service to keep paid for, nothing to run. Installation replaces files with `robocopy /XD data` only *after* a successful download and unpack, so an interrupted update leaves the working copy untouched and never touches a teacher's classes; it refuses to update while a class is running.

**Two bugs in this work were found by measuring and one by looking at it.** The first version of the window was thirty pixels too short and quietly clipped **Check for updates** off the bottom - a control that exists and cannot be seen is worse than one that does not, and a screenshot is what found it. The start button hung for the length of the lesson, because `ServerControl` read the script's stdout to the end and the classroom server it leaves running inherits that pipe; it writes to a file now, and start returns in 2.5 seconds. And slimming the package had dropped `scripts/appinfo.mjs`, which `stop.ps1` and the launcher both need to find where this machine put the class data - the stop path was broken in the published build for exactly as long as it took to test it properly.

**`--status`, `--start`, `--stop` and `--check-updates` run the same code without the window.** That seam exists so the buttons can be proved from a script rather than by a person clicking, and it earns its keep twice: it is what a school's IT can run to see whether this works on a machine before a lesson depends on it. Measured against a package marked exactly as a browser download leaves it: start 2.5s and answering, class view found, update check correct, stop clean with no stale save lock and the checkpoint kept.

**The lobby is where a class now begins, from 2026-09-11.** A student who joined before the teacher pressed Start used to be able to do nothing whatever, which taught them that this is a thing that happens to them. A household can now be set to work while the class fills up — plant, hunt, walk somebody to Gonzales — and **none of it advances until Start**, so nobody buys a head start by joining early and every family's plan begins on the same minute. `LOBBY_ACTIONS` in [sim/world.mjs](sim/world.mjs) names what is allowed; anything addressed to another household waits, because that household may not have arrived. A short optional walk-through offers itself once and explains the family, the work and what planting costs, using the real controls on the real family, so finishing it leaves a student genuinely set out rather than having practised. It cannot show a crop growing — no clock runs yet — and says so.

**Five joined households became a guard rather than a wall on the same day.** Starting below five is refused once with a count and an instruction, and a deliberate second press goes ahead. That is what makes it possible to try the whole thing out alone on one machine, which had not been possible at all. **141 automated tests now pass.**

**A downloaded package could not start, and publishing it is what caused that.** Windows marks every file unpacked from an Internet zip, and the launcher ran PowerShell under `RemoteSigned`, which refuses an unsigned script carrying that mark — exiting before it could write the error file the failure dialog then pointed at. It never happened while the package was built and copied locally. `Launch.vbs` now clears the mark on its own folder first, reproduced blocked-then-loading with a real `Zone.Identifier` stream; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Fixing it also exposed that `scripts/verify-launcher.ps1` had been asserting `saveVersion 1` long after the format moved to 3, failing on a correct checkpoint and calling it unreadable; it now reads the version out of the code, and gives eight PASS lines again.

**The teacher package no longer carries the project's memory.** [scripts/package.ps1](scripts/package.ps1) ships the server, the simulation, the page, the art, the launcher and three documents — `README.md`, `GAME.md`, `HISTORY.md` — and refuses to build if `docs/`, `tests/`, `HANDOFF.md`, `TECH.md`, `VISION.md` or `CLAUDE.md` end up inside it. That is worth only about 0.3 MB of the 73.5 MB; the point is that a teacher unpacking it sees a game rather than a development project. All of it stays in the repository, which is where it belongs.

**And from 2026-09-11 it changes hands on the way, so distance now decides what a family hears and not only when.** Step 1 left every household meeting an eyewitness; the far ones simply met one later. A rider now carries the word about twelve miles - to a fork of the road or to the ford, never to the family's own gate - and gives it to somebody going further, who gives it on again. What crosses with it is the whole ancestry: where it started, when it was seen, and everybody who has carried it. So a family beside Gonzales meets the rider who saw the camp and holds a **confirmed** report, and a family at the edge of the county meets the fourth person to carry it, who says plainly that they did not see any of this themselves, names who handed it to them and where, and leaves that household holding a **rumor**. Nothing tunes that gradient; the road produces it. A rider also now reins in for **anybody** they come alongside who would learn something, not only the family they were sent to, and rides on afterwards still carrying the errand. Implemented as `advanceRelays` in [sim/world.mjs](sim/world.mjs) with the dialogue and the range rules in [sim/encounters.mjs](sim/encounters.mjs); the design record is [docs/evidence/rider-relay.json](docs/evidence/rider-relay.json) and the live one, two households in one class at one moment, is [docs/evidence/rider-relay-browser.json](docs/evidence/rider-relay-browser.json). **No save version moved** - a report from an older class carries no ancestry, which reads as first-hand, which is what it was.

**A hand-off costs the word no time, on purpose.** The part of the arriving rider's tick that would have been wasted is handed across with the message, so a relayed report reaches a family on the same minute an unbroken rider would have. Road distance therefore still decides *when* a family hears - the pre-existing monotonic-distance test is what holds that, and it fails the moment the carry is removed - while hands decide *what* they hear. The honest cost is that nobody waits at a fork for somebody going east; see the `ceiling:` note on `advanceRelays`.

**Two defects here were found by measuring and one by reading a transcript.** A family who never opened the panel used to hold a rider on the road for twenty fictional hours, and everybody further down that road waited too - because there was one patience for a rider who has arrived and a rider who is passing through, and the number was about a classroom's attention. There are two now. A rider also announced "I've come from The road", because every junction on the spine road is a site called *The road*, which is right on a map and wrong in a sentence; and the second-hand opening named who handed the word over while dropping where it began, which is the one fact that makes a chain mean anything. Sixteen regressions were injected and all sixteen were caught - **one of them only after a test that passed under both the old rule and the new one was rewritten to ride the whole chain out instead of following the first rider.**

**News is now carried by a person, from 2026-09-11.** The first Gonzales report - `cannon-request` - no longer appears in a family's panel because a courier's coordinates reached their home site. A rider starts where the thing happened, rides the road graph, **reins in beside whichever member of the family they actually came alongside**, and says it out loud. That opening line is the receipt: the household knows because somebody was told, and failing to open the panel cannot unhear it. Five optional questions then draw out what the rider saw, when they left, how old their account already was, and what they do not know. Registered as `FIC-GONZ-013`, implemented in [sim/encounters.mjs](sim/encounters.mjs), proved live in [docs/evidence/rider-encounter.json](docs/evidence/rider-encounter.json). **No save version moved** - `world.encounters` is absent on an older class, which is the correct empty value, and an in-flight courier from such a class still delivers the old way. **139 automated tests pass at that point; 141 now.**

**This is build-order step 1 of [docs/LIVING_INFORMATION.md](docs/LIVING_INFORMATION.md) and nothing more.** Exactly one topic was converted. A topic is carried in person because somebody authored a conversation for it and by no other mechanism, so `gonzales-outcome` still arrives at the door, and **relays, onward delivery, one rider telling successive households, and integration with the director's opportunity eligibility are all step 2**. The journal keeps the old summary as the family's record, which is what the direction asked for; "Read what Willa Hines said" reopens the whole transcript after the rider has gone.

**What it consumes is the same geography fatigue consumes.** A rider's ride is a real route at a real speed, so a family four road miles from Gonzales heard at minute 640 and a family twenty-six miles out heard at 960, from a different rider, in the same measured class. Receipt is monotonic in road distance across fifteen households. **The river is a barrier to a voice as well as to a wagon**: two people a few hundred yards apart on opposite banks cannot speak, because one cannot reach the other without riding to the ford.

**The rider is drawn as a rider, and the whole encounter sheet is now reachable.** `mounted-courier-*` is a delivered horse-and-rider atlas that nothing used - a courier fell through to the civilian walk cycles, so for months a message arrived on foot in a coloured coat. Measured tick by tick in a played class: `mounted-courier-e` riding up the road, `-speak` while a line is being said, `-listen` while waiting to be asked something, `-graze` once the errand is done. Same class of fault, and same class of fix, as the injured pose on 2026-09-10.

**Five defects in this work were found by measuring it and not by reading it**, and they are listed in the evidence: the approach was invisible because sight was shorter than one tick of riding; a rider's account aged while they stood there saying it, so three hours on the road became twenty-two the longer a student read; the horse vanished at the end of every conversation; the speaking pose was held for thirty ticks while nothing was said, making the delivered listening frames unreachable; and a rider who reined in out on the road disappeared from the family's own view one tick in. Sixteen regressions were injected and all sixteen were caught - **one of them only after a guard that had been passing either way was made to actually test the thing it named.**

**Untuned, deliberately.** A rider waits 1200 fictional minutes to be asked something, reset by every question; that number is about a classroom's attention rather than about horses, it was doubled because a first measured run lost its conversation to a timeout, and it has never been played with students. The five questions have had a historical review against `HISTORY.md`'s exclusions and no classroom review at all. And the visible approach is one or two ticks whatever the sight radius is: at twenty fictional minutes a tick a rider crosses the county in seconds, and the camera, not the radius, is the limit.

**Deployment hardening was completed on 2026-09-09** and is recorded in [docs/GATES.md](docs/GATES.md): bundled checksum-verified runtime, writable class-data folder, graceful stop, New Class, preflight diagnostic, verified double-click launch, and the first independent physical device on a LAN.

**The active direction is now the map-first student interface**, decided by the project owner on 2026-09-09 after playing the prototype on a phone. Their verdict was that the placeholder interface "feels like a quiz in disguise," which is a judgement about its shape rather than its polish. The decision, its constraints and its prerequisites are specified in `CLAUDE_DEVELOPMENT_ROADMAP.md` §1B. Crops, land, woods and hunting were added to the plan the same day in §1D. **Read §1B and §1D before touching the client.** The world model was a prerequisite for that interface and has since been rebuilt on researched geography (`HIST-GONZ-007` through `HIST-GONZ-013`), so the map is now worth looking at. What remains of §1B is contextual interaction: clicking things in the world instead of using a fixed button row.

**Fatigue got a second source on 2026-09-10, and it is the ground.** `progressTravel` now counts the miles a household's own people cover on their own feet; **twenty road miles makes somebody tired**, and **resting is the only thing that mends it** (about four and a half miles an hour; working does nothing). A courier is on a horse and never tires, and a chore's `walk` step moves somebody about their own yard and never counts. Registered as `FIC-GONZ-012`, proved in [docs/evidence/fatigue.json](docs/evidence/fatigue.json). **No save version moved** — `entity.exertion` is absent on an older class, which is the correct empty value. **107 automated tests now pass.**

**This is the first system that consumes the map.** Homesteads sit between about two and twenty-five miles from Gonzales and until now that difference changed only a travel timer. It now changes the state of whoever a family sends: a near family's man arrives fit and is offered *"will come back tired"*, a far family's man arrives worn out and is offered *"already tired… will leave him hurt"*. Measured across 15 households in 3 seeds, the split follows road distance exactly. **It also made the injured pose reachable in a played class for the first time** — previously `minor-injury` could not occur at all.

**It broke the upriver promise before it fixed anything, and that is worth knowing.** The risk text was computed at offer time, but the nine miles up the river are themselves enough to tire somebody, so families shown *"will come back tired"* were handed a hurt man — 3 of 5 in one measured class. **The cost is now frozen when the offer is made** and carried on it; `settleHelp` pays out the stored promise rather than re-reading the condition, and the projection returns the stored text so the button cannot change its price while a student is reading it. Promises broken across 15 households: **0**. A control that states a price must charge exactly that price.

**Untuned, deliberately.** A tired person stops counting as a worker in `advanceRoutine`, so sending somebody far now costs the household labour as well as time. That interaction is real and intended and has never been played with students; twenty miles splits the current map roughly in half, which is why it was chosen, and it is a number to revisit against a real 45-minute lesson.

**The injured pose was bound to conditions the simulation never sets, and was fixed on 2026-09-10.** `public/motion.js` matched `['injured', 'wounded']`; `sim/` has never set either. The only hurt state it names is **`minor-injury`**, so a hurt person fell through the condition branch and was drawn by task instead — the delivered injured art sitting behind a binding that matched nothing, which is the same fault that binding was written to fix. The old test asserted the same two invented names the code used, so test and code agreed with each other and neither agreed with the world. `motion.js` now exports `HURT_CONDITIONS`, `STILL_CONDITIONS` and `ORDINARY_CONDITIONS`, and **`tests/motion-binding.test.mjs` no longer restates the vocabulary** — it scans `sim/` for condition literals and fails if one is unclassified or draws a clip the library lacks. That guard immediately surfaced `lost`, a *wagon* condition; since `entityClip` reads `entity.health?.condition || entity.condition`, the two vocabularies share a code path and a collision is now asserted against. Proved by reinjecting the original binding and three other drift cases, all caught, then live: the same person at the same task drew `rust-rest` when well and `rust-injured-rest` when hurt. See [docs/evidence/motion-conditions.json](docs/evidence/motion-conditions.json). **97 automated tests passed at that point.**

**But `minor-injury` cannot currently happen in a played class.** Nothing makes a person tired before `settleHelp`, which is the same moment the march cost is applied, so every marcher is `well` when it lands and becomes `tired`. Measured across three full classes with every household helping and marching, the only conditions anybody ever held were `well` and `tired`. **The hurt rung of the stated risk is therefore unreachable today** and the text a student reads is always "will come back tired". The rung is kept because state carries between arcs and a fatigue system is on the roadmap; it is marked with a `ceiling:` note in `sim/directors.mjs`. Give fatigue a second source — a long walk, a night out, a day's work — and the ladder starts working on its own.

**The helping household now walks upriver to the camp, from 2026-09-10.** Owner direction, after the battle fix put the engagement eight to eleven miles above the town where the history puts it. A family whose person is *standing in Gonzales* when the force crosses the river on the night of October 1 is asked a **second** question: go on with them as far as Ezekiel Williams's land, or stay in town with the supplies. Going is a real journey — about **9.8 miles** over the ford and up the west bank, routed by `findPath`, with `location.siteId` null the whole way; nobody is ever placed at the camp. Somebody standing there sees the engagement itself (`reconstruction: false`) and learns the outcome by **Local observation** instead of waiting for a courier. Registered as `FIC-GONZ-011`, implemented in [sim/directors.mjs](sim/directors.mjs), proved live in [docs/evidence/upriver-march.json](docs/evidence/upriver-march.json) with both formations on screen **0.34 miles** from the family's own man. **No save version moved** — a class saved before this has no `marches` and no `crossing` barrier, both of which default. **96 automated tests passed at that point.**

**What it costs is stated on the control and contains no randomness.** `Go upriver to the camp · Thomas will come back tired.` is the whole button. Fresh becomes tired; already tired becomes hurt and days mending; hurt, captured or dead is never changed. **No casualty is modelled and none may be** — `HISTORY.md` excludes individual wounds and casualty counts at Gonzales until each has a checked claim, and `FIC-GONZ-005` permits only fatigue or a minor condition. So who a family sent, and how far that person had already walked, decides the outcome — which is the systems-interacting depth `VISION.md` §21 asks for, reached without a die.

**Owner clarification of `VISION.md` §11, 2026-09-10.** §11's "forced military quests" is a ban on *gamey* coercion — patriotism meters, shame, repeated coercive requests, hidden rewards — and **not a blanket ban on compulsion**. The owner's rule is that compulsion must be **grounded in historical fact**. Nothing in this slice is compelled, so the second act is asked about rather than imposed; but do not cite §11 to refuse a documented impressment, militia obligation or requisition in a later arc. Research it, register the claim, then build it. `VISION.md` itself is unchanged and this is the governing reading.

**The battle was being drawn 153 miles from Gonzales, and was fixed on 2026-09-10.** The formations were pinned to literal coordinates — `(141, 65)` and `(162, 75)` — taken from the grid map that preceded researched geography. When `buildGonzalesRegion` replaced it the whole world moved inside `x -2..6.5, y -25..24` and nobody moved the battle with it. Every phase still resolved, every caption still arrived, all 82 tests still passed, and **nothing was ever drawn**: a household standing at Gonzales through the entire exchange saw no formations, and the Host reconstruction showed an empty town. The second half of the defect was in the client — `framingFor()` never included `world.battle.formations`, and the Host's reconstruction focus framed the town alone, so correct coordinates would still have been off-screen. `sim/directors.mjs` now exports `battleGround(world)`, which derives the staging from the map every tick: the Mexican camp is Ezekiel Williams's land (`HIST-GONZ-008`), the Texians form up downriver toward the ford they crossed (`HIST-GONZ-007`) and close, and Castañeda withdraws away from the ford toward Béxar (`HIST-GONZ-004`). **No save version moved**, because nothing is stored — a class saved by the hardcoding build re-anchors on load. Proved by reinjecting the original coordinates verbatim and watching four of the five new tests in `tests/battle-ground.test.mjs` fail with no pre-existing test changing state, then on the live Host page, where both formations read `onScreen: true` at 8.1 and 10.8 miles from Gonzales. See [docs/evidence/battle-ground.json](docs/evidence/battle-ground.json). **87 automated tests passed at that point.** The engagement being eight to eleven miles upriver is historically right and may not be dramatically right; that is an open design question, not a defect.

**Gonzales was given people on 2026-09-09.** Three named residents — invented, and registered as `FIC-GONZ-009` — live in the town, move about it, and are who a student actually trades with; a trip to buy seed from nobody now fails and says so. With them came the first **shared-world observation**: a household sees anyone standing where one of its own people is standing, filtered on the server to who they are, where they are and what they appear to be doing. Another family's stores, skills and errands, and a courier's message, never reach the wire. Nobody who is not yours can be commanded.

**Reaching a neighbour no longer needs a pointer, from 2026-09-09.** The journal roster now lists *Also here* — anyone standing with this household — as `[data-select]` buttons beside the family's own people. Offering a trade requires selecting a neighbour, and until this existed the only way to do that was to click them on the canvas, which broke the contract that the map is never the sole channel for an action. Proved by carrying out a whole trade — travel, selection, form and offer — through DOM activation alone, without one canvas click.

**People turn as they walk, and the hurt are drawn hurt, from 2026-09-09.** `travelHeading()` reads the leg of the route the traveller is actually on and picks the delivered north or south cycle when that leg is more up-and-down than across; a near-level leg keeps the mirrored east/west cycle, and a vertical cycle is never mirrored. Injured and wounded now hold the delivered `injured-rest` pose instead of standing about as though nothing had happened. Capture and death deliberately keep a still upright pose — distinct states, and this project draws no casualty. `tests/motion-binding.test.mjs` guards both.

**Households can trade with each other from 2026-09-09**, which is the interaction the owner asked for by name. An offer is made face to face — two people standing at the same place — names what a family gives and what it wants, and is accepted, declined, withdrawn, or lapses the moment the two part. Any family member may strike a bargain, not only the principal, which is the point: the family with nobody spare can ask the neighbour who is actually there. Seed and food change hands; a tool does not. Nothing is escrowed, so an offer whose goods were spent fails plainly at acceptance. **Neither family ever learns the other's stores.** Registered as `FIC-GONZ-010`, implemented in [sim/trade.mjs](sim/trade.mjs), proved in both directions through the real interface in [docs/evidence/household-trading.json](docs/evidence/household-trading.json). **No save version moved**, because a class saved before trading existed simply had no offers.

**Losing a device stopped meaning losing a family on 2026-09-09.** Every household now has a **family key** — eight symbols, derived from the class secret rather than stored, shown to that household and to nobody else. `POST /api/rejoin` takes only the key: no class code, works after Start, never creates a household. A family somebody is playing right now cannot be taken over by its key, wrong keys are throttled, and the Host initially carried none of them. With it came the distinction between **away and gone**: the Host reads `here` and `away` across a ninety-second grace window, so a phone that locks its screen no longer looks like a student who left. Both came from reading two non-game projects at the owner's request — ponytail and OmniRoute — recorded with their verdicts in [docs/REFERENCE_ARCHITECTURES.md](docs/REFERENCE_ARCHITECTURES.md) §5 and §6. The Host now also supports revealing one selected household key for recovery, rather than listing every key. The live proof is [docs/evidence/family-key-recovery.json](docs/evidence/family-key-recovery.json). **No save version moved**, because the key is derived and presence is never saved.

**Farm work shipped on 2026-09-09.** A chore is now a short list of data steps and one interpreter runs them, so adding work means adding a table entry rather than a branch. A family plants and harvests a field of corn or cotton, hunts in the timber, fetches seed from Gonzales and mends or replaces a worn hoe; every family member can be sent, and each has a fixed aptitude for farming, hunting and handwork. **The whole path contains no randomness**, because `FIC-GONZ-008` requires outcomes to resolve inside a visible risk. The pattern came from Widelands; what was studied, taken and refused across four projects is recorded in [docs/REFERENCE_ARCHITECTURES.md](docs/REFERENCE_ARCHITECTURES.md). **`schemaVersion` and `saveVersion` are now 3**, so a class saved by an older build refuses to load rather than opening a world missing its tools and fields.

**Art delivery, 2026-09-10: 30 transparent PNG atlases, 443 usable sprites and 169 clips**, including 92 pose cycles and four layered rigs. Search/hunting and town-trade poses now bind to the farm, alongside cardinal travel, rest/injury, wagon wheels and bounded visible battle/cannon effects. Mounted courier travel is a separate horse-and-rider asset, now joined by sixteen listening/speaking/letter-offer/pointing frames. All original generated PNGs, exact prompts, provenance, measured anchors, checksums, directions and frame timings are inventoried. Read [docs/ASSETS.md](docs/ASSETS.md), [docs/ANIMATION_REQUIREMENTS.md](docs/ANIMATION_REQUIREMENTS.md) and [docs/ART_MANIFEST.md](docs/ART_MANIFEST.md); preview `/art-catalog.html`.

**The complete Alamo is an independent art/navigation workshop** at `/alamo-workshop.html`: 32 connected spaces, foot-scale geometry, twelve independent destructible north-wall segments, roofless church, removable roofs, furnishings and dedicated Joe walking/hiding/emerging/speaking poses. The owner's 1836 diagram and the Alamo's approximate published plan informed the assembly. Exact partitions and Joe's hiding room are reconstructed; an overnight north-wall collapse is not asserted as verified history. Read [docs/ALAMO_LAYOUT.md](docs/ALAMO_LAYOUT.md) before integrating server, save, knowledge or scenario state.

## What works and what was proved

| Gate | Implemented foundation | Evidence and boundary |
| --- | --- | --- |
| A | Authoritative local HTTP/SSE server; session code; five-to-thirty assignments; distinct credentials; refresh/reconnect; pause/resume; seed; checkpointed identity | Five actual Chrome contexts used the physical adapter's LAN address, each received all ticks 1–100. Separate 30-client Node HTTP/SSE test passed. On 2026-09-09 **one genuinely independent phone** joined over the LAN, got its own household and recovered after a disconnection; see [docs/evidence/lan-independent-device.json](docs/evidence/lan-independent-device.json). Five independent devices, thirty devices and district Wi-Fi remain open. |
| B | Four named people per household, Thomas principal, ox, wagon, home, a road network and Gonzales; one canonical entity registry | Same ID travels home → road → destination, saves mid-trip, reloads and arrives; browser refresh creates no copy. Animal/property/seed and event history persist. One camera renders the projected records at every scale. |
| C | Objective truth vs per-household reports vs public Host reports; physical courier delivery; report statuses and ages; deterministic routine compression with important-event barriers | Five-browser wire/UI test proves asymmetric knowledge, courier receipt, age, Host separation, mutation isolation and restart. Resolver tests preserve unresolved travel/service, borrowed damaged property, relationships, knowledge and deaths while advancing routine food/minor health. |
| D | One autonomous Gonzales sequence with a one-time fictional request, Help/Stay choices, travel, gathering, representative formations, anchored battle, consequences and memory | Five-browser test runs from lobby/Start without manual world edits. Refusal, pause during battle, reconnect, delayed Host reconstruction, save/restart consequence, Host reload and narrow layout pass. Headless tests prove causal ancestry, all-refuse/idle outcomes and deterministic inputs. |

**148 automated tests pass.** The intentional save-failure test prints a “Simulation paused” error; that is injected failure evidence, not a failing test. Gate details and dated browser records are in [docs/GATES.md](docs/GATES.md) and [docs/evidence](docs/evidence). Current visual captures are under ignored `test-results/`; recreate them with the browser proofs.

The original four ZIP documents were retained. VISION.md was not rewritten. The Alamo has an unsaved assembly workshop; its historical scenario and Goliad, Runaway Scrape and San Jacinto gameplay are not implemented. Classroom schema/save remain version 3.

## Exact run commands

Published at **https://github.com/AceSpartiate/texas-civilization**. Built packages are release assets rather than committed files, because a 74 MB zip does not belong in a git history: [the 12 September 2026 release](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.12) carries the setup program, the update archive an installed launcher downloads, and the smaller zip for a machine that already has Node. **The 11 September release had no update archive**, so no copy installed from it could update — `scripts/package.ps1` had stopped producing one when the installer arrived. The procedure for a release launchers will actually take is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). `data/`, `runtime/` and this machine's preflight records are deliberately not published.

Node **22+**; tested here with **24.18.1**. No runtime install or build step is required.

```powershell
cd 'C:\Users\zachw\Texas Civilization'
npm.cmd start
```

Open the private Host URL printed by the server (also in `data/host-url.txt`). Students use the LAN URL displayed inside Host and the six-character class code. Do not share the Host credential. At least five households must join before Start. The default is 15 slots, with 5–30 configurable by developers.

For the intended teacher flow, double-click `Launch.vbs`. It invokes `scripts/launch.ps1`, selects `runtime/node.exe` if present or installed Node otherwise, launches the server hidden, verifies its identity and opens Host. **Both `Launch.vbs` and `Stop.vbs` were run through `WScript.exe` on 2026-09-09 and succeeded**, including the default-browser opening. That closes the old VBS gap on this unmanaged computer; district application-control policy is still untested, and no school/system policy was changed.

To stop the hidden server, use **Stop Server** on the Host page or double-click **`Stop.vbs`**. Both save and pause the class first, tell connected students, and let the process exit cleanly. Neither ever force-terminates a process, because that is what leaves a stale save lock. **End Game** and closing a browser still do not stop the server.

**New Class** on the Host page archives the finished class and returns to a fresh lobby with a new code. It refuses to run while a class is running or paused.

The Node runtime is bundled. Rebuild it with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File scripts/bundle-runtime.ps1 -DownloadVersion v24.18.1 -Force
```

That verifies the download against nodejs.org's published `SHASUMS256.txt` before accepting it, includes the Node `LICENSE`, and writes `runtime/manifest.json` plus the tracked build record `docs/evidence/runtime-manifest.json`. Omit `-DownloadVersion` to copy the Node on PATH instead, with no network access. The launcher refuses a bundled runtime whose SHA-256 does not match its manifest, and refuses one with no manifest at all. `runtime/` is gitignored; the manifest copy under `docs/evidence/` is the durable record.

Class data — the save, launcher records, logs, the private Host URL and archived classes — lives in `<application folder>\data` whenever that folder is writable, otherwise `%LOCALAPPDATA%\TexasRevolution\data`, or `TEXAS_DATA_DIR` when set. Run `node scripts/appinfo.mjs` to print the resolved folder before following any recovery procedure.

The launched scenario uses **one tick per second, twenty fictional minutes per tick**. The short slice lasts about **4 minutes 44 seconds** plus pauses. It ends on October 2, 1835 with the family state preserved. This is not the target 45-minute full lesson.

Developer settings (new saves only for seed/player count):

```powershell
$env:SEED = 'gonzales-review'
$env:PLAYERS = '5'
$env:TICK_MS = '250'
$env:SAVE_PATH = 'data/review-class.json'
npm.cmd start
```

`PORT` defaults to 1835. Set it only for a deliberate development instance; do not make teachers configure it. A save takes precedence over new seed/player-count settings. To start an additional development class, stop the existing server cleanly and choose a fresh `SAVE_PATH`; never delete a live class save. The launcher intentionally refuses an existing server that it cannot match to its own process record.

For a developer-visible server, prefer `node server/main.mjs` and Ctrl+C for graceful shutdown. **End Game and browser closure do not stop the server**; use Stop Server or `Stop.vbs`. The hidden launcher still has no always-visible running/stopped indicator. See [docs/RECOVERY.md](docs/RECOVERY.md) before dealing with a crash/stale lock.

## Exact verification commands

No external tooling is needed for deterministic/network/storage tests or bot runs:

```powershell
npm.cmd test
npm.cmd run simulate -- repeatable-seed 5 mixed
npm.cmd run simulate -- repeatable-seed 30 stay
```

Bot strategies: `mixed`, `help`, `stay`, `idle`. The harness returns inputs, world and internal metrics without rendering. These are private developer seams, not a normal solo mode or an HTTP debug API. Evacuation and inherited-consequence balance metrics are explicit future placeholders.

The reproducible browser proofs require Playwright plus Chromium or installed Chrome. For a fresh developer checkout, install test-only tooling separately:

```powershell
npm.cmd install --no-save --package-lock=false playwright@1.62.1
npx.cmd playwright install chromium
$env:PROVE_WORLD = '1'
npm.cmd run test:browser
npm.cmd run test:information
npm.cmd run test:relay
npm.cmd run test:slice
npm.cmd run test:whole-game
npm.cmd run test:solo-game
npm.cmd run test:host-live
```

The exact tooling already used on this workstation is:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\Users\zachw\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:BROWSER_EXECUTABLE = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:PROVE_WORLD = '1'
npm.cmd run test:browser
npm.cmd run test:information
npm.cmd run test:relay
npm.cmd run test:slice
npm.cmd run test:creation
npm.cmd run test:looks
npm.cmd run study:creation
node scripts/creation-overlap-injections.mjs
npm.cmd run test:panels
npm.cmd run study:overlap
node scripts/panels-overlap-injections.mjs
```

`test:panels` and `study:overlap` are the four panels the overlap study could not reach (FAMILY_PANEL.md §12.12):
`#site-choose`, `#survey-choose`, `#encounter` and `#call-menu`, each reached in a real state with the server's own
content in it. `study:overlap` takes a width and a height (`node scripts/screen-overlap-study.mjs 1024 768`) and defaults
to the Chromebook; `test:panels` walks all three sizes itself and takes about five minutes.
`scripts/panels-overlap-injections.mjs` runs that proof six more times and takes about half an hour.

`test:creation` and `study:creation` are the family-creation wizard as a thing on a screen (FAMILY_PANEL.md §13);
`study:creation` takes a width and a height (`node scripts/creation-overlap-study.mjs 390 844`) and defaults to the
Chromebook. The bundled Playwright observed here is 1.62.1; Chrome was 152.0.7977.76. `TEST_ADDRESS` can override detected LAN address for a specific test. Tests start isolated temporary servers on ephemeral ports and preserve the ordinary classroom save. Browser tests use five isolated contexts; five tabs in one ordinary profile share cookies and are not five students. No remote asset requests occurred during the slice proof.

`test:browser` writes current A/B evidence into `test-results/`; `test:information` and `test:slice` write their JSON records into `docs/evidence/`. Initial acceptance records for A/B are retained separately. To refresh capacity timing evidence explicitly:

```powershell
$env:WRITE_CAPACITY_EVIDENCE = '1'
node --test tests/capacity.test.mjs
Remove-Item Env:WRITE_CAPACITY_EVIDENCE
```

Timing/payload numbers are observations from local tests, not 30-device or 45-minute performance promises. Test source code and gate evidence are more important than screenshots alone.

The Windows launcher process regression is also preserved:

```powershell
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File scripts/verify-launcher.ps1
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File scripts/verify-update.ps1 -Evidence docs/evidence/launcher-update.json
npm.cmd run test:solo
```

`verify-launcher.ps1` now also starts a solo server beside the running class (`launch.ps1 -Solo`) and stops it (`stop.ps1 -Solo`) with the class still running. `verify-update.ps1` needs the .NET 7 SDK; it builds three setup programs around stand-in games under `data/update-verification` and has an installed launcher update itself, fail and roll back (a few minutes).

It uses an isolated copy below `data/launcher-verification`, opens no browser, and checks startup, log survival, verified reuse, graceful stop releasing the save lock, a safe no-op stop, preference for a checksum-matching bundled runtime, refusal of a tampered runtime, unrelated-port refusal and timeout cleanup — eight PASS lines. It deliberately stops only processes it created. This does not prove district application-policy acceptance.

Before any classroom or physical-device session, record the machine's own report:

```powershell
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File scripts/preflight.ps1 -Tester 'name' -Network 'which network'
```

It is read-only — it changes no firewall rule, policy or registry value — and writes `docs/evidence/preflight-<timestamp>.json`. It reports Windows and PowerShell versions, execution policy per scope, the `.vbs` association, bundled-runtime checksum verification, the resolved data folder, ranked join candidates and firewall profile state. Reading the firewall *rule* list needs an elevated session; without it the report says so. **Preflight cannot prove that another device can reach this server.** The two-device procedure and its evidence template are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Art verification

With the Playwright/Chrome environment above, run `npm run build:art`, `npm run test:art`, `npm run test:alamo`, `npm run test:trade-animation`, then `node scripts/check-doc-links.mjs`. The Claude-drawn stand-ins (2026-09-16) are rebuilt by `npm run build:standins` in the same environment after any SVG under `public/assets/claude-standins/svg/` changes; `tests/claude-standins.test.mjs` fails on a stale build or a frame Astra has since delivered. These use isolated test servers and preserve class data. Browser records live under `docs/evidence`; ignored `test-results` contains reproducible screenshots.

## Files to inspect first

| File | Why it matters |
| --- | --- |
| [server/app.mjs](server/app.mjs) | Authority, credentials, household assignment, command validation, idempotency, projection transport, fault pause/retry |
| [server/storage.mjs](server/storage.mjs) | Single save owner, atomic checkpoint, recovery boundary and class archives |
| [server/deployment.mjs](server/deployment.mjs) | Writable class-data folder, save path and ranked join candidates; `scripts/appinfo.mjs` publishes the same answer to the PowerShell helpers |
| [sim/world.mjs](sim/world.mjs) | Canonical entities, deterministic initialization, physical travel, news changing hands on a long road, validation, server-filtered projections |
| [sim/knowledge.mjs](sim/knowledge.mjs) | Truth/report separation and physical delivery |
| [sim/time.mjs](sim/time.mjs), [sim/routines.mjs](sim/routines.mjs) | Continuity across compression and interruption before important moments |
| [sim/directors.mjs](sim/directors.mjs), [sim/gonzales.mjs](sim/gonzales.mjs) | Scenario composition, public/private progression, choice, macro-history and reconstruction |
| [sim/events.mjs](sim/events.mjs), [sim/headless.mjs](sim/headless.mjs) | Causal memory and deterministic test/balance seams |
| [public/app.js](public/app.js) | One full-screen map, contextual selection, camera, sprite and fallback drawing, aggregate soldiers |
| [sim/chores.mjs](sim/chores.mjs) | Farm work as data, skills, tool wear and crop state; the whole file is deliberately free of randomness |
| [sim/town.mjs](sim/town.mjs) | The people of Gonzales, and `observedBy()` — the rule deciding what one household may see of another |
| [sim/trade.mjs](sim/trade.mjs) | Offers between households: standing together, what may be swapped, and what each side is told |
| [sim/encounters.mjs](sim/encounters.mjs) | Riders, the range and river rules for being heard, and every word any of them can say |
| [public/motion.js](public/motion.js) | Which animation clip an entity is drawn with, tick-to-tick interpolation between two known positions (`ProjectionMotion`), and a traveller's cycle rate matched to the ground drawn (`GaitClock`) |
| [public/art.js](public/art.js) | Sprite library loading and anchored drawing; returns 0 when a sprite is unavailable so callers fall back |
| [docs/REFERENCE_ARCHITECTURES.md](docs/REFERENCE_ARCHITECTURES.md) | What four existing projects were studied for, what was adopted, and what was refused and why |
| [docs/ASSETS.md](docs/ASSETS.md) | What the art library holds, what is wired in, what is missing, and the rules the renderer must keep |
| [tests/gonzales.test.mjs](tests/gonzales.test.mjs) | Whole-loop regression example to preserve when expanding |

`createWorld()` is the small core fixture. `createGonzalesWorld()` composes the slice; `server/main.mjs` explicitly selects it. Do not mistakenly test only the core factory and assume the launched historical sequence is covered.

## Invariants to protect

1. One authoritative world; a principal has one entity ID and one location across every view/save/reconnect. Returning home requires a journey.
2. Clients receive permitted projections, never full truth with hidden UI elements. Keep seed, other household reports, future director state and credentials off the wire. Host public knowledge is a separate audience.
3. Characters and durable commitments survive time compression. Register a barrier for any new important event. Routine resolution cannot quietly kill, capture, revive or erase a major injury.
4. History changes local pressure; it does not grade compliance. Refusal is valid and suppresses this repeated request. Historical macro-outcomes stay independent of player participation.
5. Host progression is automatic after Start. Keep teacher event-triggering controls out of normal play.
6. Record actual causal events and preserve them. The internal memory chain includes world event, received information, pressure, choice, departure, travel, arrival, consequence and memory.
7. Save before acknowledging/broadcasting success. Only one process owns a save; failed persistence must be visible and stop time. Session cookie names include session ID to isolate classes sharing a host.
8. Detailed principals and aggregate formations are distinct concepts. Render samples must never become alternate copies of player characters.

## Partial features, known limitations and failures

- **Deployment: one independent device has passed; five devices, thirty devices and district Wi-Fi are still NOT YET TESTED.** District validation is mandatory before classroom use. Mandatory checks and the two-device procedure are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Local-address browser tests cannot prove client isolation, firewall or device-policy behaviour.
- A backgrounded mobile browser tab drops the live stream within seconds and recovers automatically on return, with identity preserved. This is normal mobile behaviour, not a fault. The Host now reports such a household as **away** rather than silently subtracting it from the connected count, but this has still not been tested across a full 45-minute lesson with screen locks.
- Launcher packaging is still missing a signed executable and a district-approved package. There is no always-visible running/stopped indicator while the server is hidden — the Host page is the only status surface, so a teacher who closes it has no window telling them the class is still running. A hard process kill can still leave a lock; recovery deliberately fails closed until ownership is verified.
- No settings screen, no way to choose seed or class size from the Host page, and no UI for browsing or restoring an archived class.
- No save migrations, rotating backups or automatic corrupted-save repair. Existing authenticated clients reconnect after Start; new household joins after Start are rejected. Family keys recover identity across devices, and the Host can now look up one selected household's key for a student who lost theirs. Preserve that individual reveal behavior; never list every family key on a potentially projected page.
- HTTP is for a trusted LAN. It is not encrypted or approved for public hosting. There is no production rate-limiting/identity service or multi-host storage design.
- View architecture is proved; shared local visibility is deliberately narrow. A household sees its own people in full, and anyone else **only where one of its own people is standing** — another family's member, a Gonzales resident, a rider passing through — reduced to who they are, where they are and what they appear to be doing. A courier is visible as a rider and never as a message. Nobody who is not yours can be commanded. Visibility across a distance does not exist, which is what keeps the per-tick payload small and trading physical.
- The map, travel speed, family demographics, economy and within-day battle timing are schematic. Distance now feeds fatigue (`FIC-GONZ-012`), which is the one place it bites. All households reuse the same fictional names. Supporting characters have simple routines, not rich autonomous behavior. Fatigue has two sources and a recovery rule as of 2026-09-10: walking accrues it, resting mends it.
- One request per family is the thin loop. Story opportunity parity across a whole lesson, extensive noncombat systems, scarce-resource balancing and later inherited crises are unimplemented.
- Battle visuals are representative miniature groups and short phase motion. There is no tactical combat engine, exact historical roster, full replay, audio or polished narration. Since 2026-09-10 the engagement is staged on Ezekiel Williams’s land where it belongs, which puts it **eight to eleven miles upriver of the town**: a household at Gonzales now sees it, but at a distance, and the camera pulls out to hold both. Whether the scene should instead be brought closer, or the helping household walked upriver to it, is undecided.
- **Trading is untuned.** No rate is enforced and nothing prevents two students agreeing an absurd exchange; whether that is a defect or a classroom conversation is a design question nobody has answered. Nothing is escrowed at offer time, so an offer can be made and then spent, which fails honestly at acceptance but may read as surprising. A trade is goods only: there is no way to lend a person, a tool or an ox, which is the pressure the design actually wants from a family with nobody handy.
- **News carried by people is still one report deep.** `cannon-request` arrives through a rider, a chain of riders and a conversation; every other topic, including `gonzales-outcome`, still arrives at the door by the old path in a single hand. The autonomous director knows nothing about any of it - it still dispatches one errand per household on its own schedule, and relays happen underneath that rather than because of it, so no opportunity yet depends on how good a family's information is. Twelve miles is invented and unplayed, and so is the two hundred minutes a passing rider will wait to be asked something. A family with nobody home is not told until somebody comes back, and if nobody ever does they genuinely never hear - that is the honest consequence of the rule and no measured class has hit it.
- **The pace has never been watched by a class.** 9.5 seconds a tick is the interval at which the arithmetic works - a walk looks like a walk and the slice fills a period - and no room has sat through it. Every wait in the scenario is also 9.5 times longer in real time now, including a rider's patience, the passing pause and every chore step; those numbers were tuned against a one-second tick and have not been retuned.
- **The launcher and the installer have never been used by a teacher.** Both have been driven from scripts and looked at once, on one monitor, at one scale. Nothing is code-signed, so the setup meets SmartScreen on first run. The uninstall path has been exercised only as far as its registration: the dialogs it shows, and the deletion script it hands to `cmd`, have not been run end to end, because doing so on this machine would remove a working copy.
- **Updating has been proved as far as the check and no further.** `--check-updates` answers correctly against the live API. The download, unpack and swap have not been run end to end against a genuinely newer release, because there has not been one since the code was written.
- **The walk-through has never been read by a student.** Five steps, written in one sitting, reviewed against nothing but the code they describe. It teaches the controls and the costs and cannot teach the clock, because no clock runs in a lobby; whether that leaves a student ready or merely informed is unmeasured. It also only ever offers itself once per family per browser, which is a `localStorage` convenience: a shared or wiped machine will offer it again.
- **Starting below five is a teacher's own risk.** The guard says how many joined and goes ahead on a second press. Nothing stops a teacher beginning with three because the other twelve were slow, and the scenario is written for five to thirty.
- **The town is three people and no more.** They stand in for a settlement of about thirty-two structures, they never leave Gonzales, and nothing they do changes. There is no reason to visit the town except to trade, no news to be had there, and no other household to meet unless one happens to be standing there at the same moment.
- **Art is broader than gameplay.** All 443 sprites and 169 clips can be inspected in the catalog; Gonzales uses only permitted relevant subjects. Remaining production work includes action facings, mounted transitions/dismounting, gun crews, N/S wagon rigs, boats in motion, assisted movement and final cast registration. Static buildings are intentional. Alamo partitions are reconstructed and furniture does not yet block navigation; its workshop does not save into a class. See the complete manifest for exact coverage rather than obsolete reachability totals.
- Save/stream processing uses full snapshots and whole-state clones. The Event Log grows without compaction. Profile before long arcs; 30 HTTP/SSE clients passing is not a 30-Chromebook classroom trial.
- The ending stops this slice; final epilogues, global fog removal, revelation and the later Revolution are not implemented. Previous family consequences are retained for those systems.

One failure was found and corrected in the farm work itself, and it is worth recording because it is the shape of mistake this project's invariants exist to catch: a chore was merely *frozen* while its owner travelled, so a principal who accepted the Gonzales request mid-planting resumed "breaking the rows" on arrival at Gonzales and was then carried home by the chore's own `walk` step **without a journey**. Answering the call now drops the work, and a `walk` step refuses to move anyone who is not standing on their own land. `tests/aggregate-identity.test.mjs` covers both.

Failures found and corrected during foundation work: Windows flushing required a writable file handle; full live-browser shutdown needed active connection cleanup; failed saves formerly left a false running status; multiple servers needed an exclusive save lease; class cookies needed session namespaces; public event records needed JSON-stable nulls; and later help consequences needed to preserve existing serious health conditions. Relevant regressions now pass. There are no remaining known failing automated tests at handoff.

## Next six recommended tasks

Reordered on 2026-09-09 for the map-first decision. **Re-read on 2026-09-12, when three of these had moved under a week's work.**

1. ~~**Finish what the farm loop and trading started.**~~ **Half done.** "Different skills changes only how fast a job goes" is no longer true: a hunting hand of one *cannot* make a long shot, which is the first thing anybody is uniquely unable to do. There are four new kinds of work — clearing ground, fencing the field, buying powder, and the hunt's own decision — and food now has real sinks. **What is left is trading, still entirely untuned:** no rate is enforced and nothing stops two students agreeing an absurd exchange. Whether that wants fixing at all is a teaching question rather than a balance one; an absurd trade between two children who both agreed to it may be the lesson.

2. ~~**Let a student name their own family.**~~ **Done 2026-09-12** in [sim/family.mjs](sim/family.mjs). **The shape half began the same day:** a rolled family is one to six people (see the top of this file and [docs/FAMILY_CREATION.md](docs/FAMILY_CREATION.md)); steps 2–5 of that document are the rest. Kin exists and is visible, every name is the student's, ids never move, and default names are dealt across the class so no two households start alike. `FIC-GONZ-017`. **What is left of it is the shape:** every household is still two parents and two children. VISION.md §12 asks that different families be genuinely different and §7 allows four to seven people, so a widowed parent with three children, or two siblings farming together, is the obvious next step — and it is marked as a `ceiling:` in `sim/family.mjs` because `principalId`, the id scheme and a great many tests all assume four people in one order.

3. ~~**Put the new geography to work.**~~ **Largely done.** Distance is consumed in four places now: it tires whoever walks it, it decides whether the ox and wagon are worth their slowness, it decides whether somebody arrives steady enough to take a shot, and couriers ride the real road graph so a far family meets the fourth person to carry the news rather than the first. **What is left is the named remainder:** the help request's feasibility and its deadline still do not depend on how far a family lives from town.

4. ~~**Make the battle's aggregate honest.**~~ **Done for Gonzales, 2026-09-12:** people who joined stand with the Texian force and participation is recorded per person; pace is deliberately not derived from members, because history fixes it. A `fought` role waits for a battle where households fight. The original note follows. A formation is a count and a position handed down by the director. 0 A.D. derives a formation's pace from its slowest real member; deriving arrival and pace from the actual travel of the people who actually joined would make the aggregate report the world rather than decorate it. `tests/aggregate-identity.test.mjs` already guards the invariant that must survive any such change: a person who joins a formation stays a person, and a formation names nobody.

5. **Finish deployment and continuity.** Five independent devices on an ordinary LAN, then district-managed devices and Wi-Fi; record PASS/FAIL with the observed restriction. Add a visible running/stopped surface for the hidden server, a signed package, save versioning and migration, and backups. Identity recovery exists as the family key, including a Host lookup for a student who has lost theirs. Test injuries, loans, absences and lifecycle failures across a realistic 45-minute session with screen locks — the family key, the here/away count and trading between neighbours are exactly what that session should be stressing.

6. ~~**Make what a family knows decide what it can do.**~~ **Done for the Gonzales slice, 2026-09-12:** a rumor family is asked whether to go and see (`FIC-GONZ-020`), every rider leaves when the news happens, the upriver call is asked on the crossing as news, and the outcome is carried in person. What is left belongs to later arcs: news that can be false or contradicted, and opportunities that differ by region rather than only by how firm a report is. Steps 1 and 2 of [docs/LIVING_INFORMATION.md](docs/LIVING_INFORMATION.md) are built and proved for `cannon-request` (`FIC-GONZ-013`): a report is said to a named person by a rider who came from where it happened, and it changes hands on a long road so a distant family's account is older, second-hand and labelled a rumor. **The remainder of step 2 is the director.** Right now an opportunity opens because the clock says so, not because a household was told something, and a family holding a four-hand rumor has exactly the same options as one that met the witness. Wiring encounters into opportunity eligibility is what turns better information into a better position, and it is the first point at which any of this changes what a student can choose. Then convert `gonzales-outcome`, which is now possible because a relay exists and is the report whose whole point is that it reaches far families through other people. Search/trade art is delivered and the encounter sheet is wired; focus new art on the remaining documented mounted gaps - dismount and remount with a persistent horse, and N/S dialogue gestures.

7. **Sign it, and prove the two paths that are still only half-proved.** The installer and the launcher are built and work. What is left costs money rather than effort: a code-signing certificate, a few hundred dollars a year, so that neither the setup nor the launcher meets SmartScreen in front of a class. Then the two untested paths - the update, proved only as far as the check because there has been no newer release to fetch, and the uninstall, whose dialogs and deletion script have never been run end to end. Neither needs new design, only a second machine or a willingness to remove the working copy on this one.

8. **Build money, hidden glory and the winner.** *Money (steps 1–2) and hidden glory (step 3) done 2026-09-12; the ending (steps 4–5) done 2026-09-16. What remains is the balance gate, which cannot be measured until automatic families earn coin and glory (docs/MONEY_AND_GLORY.md §7.1).* Owner direction of 2026-09-12, fully specified in [docs/MONEY_AND_GLORY.md](docs/MONEY_AND_GLORY.md) with every design question answered. Five bounded steps, each provable alone: money as a resource (retiring the no-money tripwire in `tests/store.test.mjs` deliberately); the store dealing in coin; glory, hidden, with a wire-isolation test **before anything reveals it**; the per-family ending; the Host's closing view naming the winner. Steps 1–2 fit alongside task 1. Step 3 is worth landing early — every event built after it should write glory as it is built — and it depends on task 4, because "a family member took part in the battle" is exactly what the battle's aggregate cannot yet say.

9. **The direction this replaced, for the record.** The owner's direction of 2026-09-11: not a zip. An installer that puts a launcher on the machine, offers a desktop shortcut and otherwise lives in the Start menu. In the launcher, a **Start server** button that becomes **Stop** while it runs; a **Check for updates** button that updates the game from this repository's releases, and ideally notices an update without being asked; a teacher presentation window **in its own frame rather than a browser tab**, with its own controls for maximising and moving between monitors; a button that opens a player window in the default browser; and a button that copies the join URL. No Cloudflare and no service needing an account — GitHub's own releases API answers unauthenticated for a public repository, which is exactly the update check this needs and costs nothing. The honest obstacles are that an unsigned installer will meet SmartScreen the way the unpacked zip met the Mark of the Web, and that a window of its own means either WebView2, which Windows 11 already has, or shipping a browser, which the package cannot afford. Decide that before building.

Build strong foundations, not unfinished breadth.

**Released as [v2026.09.21.6](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.21.6)** on
2026-09-21, verified on the clean tree at `5c3a63f` (878 passed): deleting a solo game, the wizard's words, and the dim
taken back off the wagon panel.

**Deleting a solo game, 2026-09-21.** Owner: *"I need a way to delete solo games."* The code had named this as its own way
out since September — a `ceiling:` on the saved-games store reading *"every solo game is kept for good; a Delete beside each
game is the way out if the folder grows."* Asked where it should live, the owner said the menu that appears on **Play Solo**,
with *"a little trash can emblem"* beside each save. So every row of that list now carries one. It asks once, naming the
family, and the server **sets the game aside** rather than destroying it: the file moves to `data/solo/games/deleted/`,
which the listing never reads, so a mis-click costs nothing that cannot be undone by hand. The game the server is *holding*
is deletable too, with no special case — it leaves the list, and the server goes on holding the world until something
replaces it. See [DEPLOYMENT.md](docs/DEPLOYMENT.md) §Solo Mode.

- **Evidence:** `tests/solo.test.mjs` (four tests) and `docs/evidence/solo-games-injections.json` — 8 of 8 caught, plus two
  recorded as *not provable over HTTP*: the `if (!solo)` guards inside `soloGames` and `deleteSoloGame` sit behind a route
  the `solo` flag already bolts, so removing one changes nothing a test can see. Kept as defence in depth, and the record
  says why they cannot be shown to matter rather than quietly counting them as passes. That file also writes down the
  "four injections" this doc has claimed since 2026-09-17 with nothing on disk to show for it.
- **Not proved:** nothing ever *clicked* the trash can. `scripts/solo-dialog-shot` draws the dialog to
  `docs/evidence/solo-dialog.png` and I read it; the hit region, the confirmation and the row disappearing rest on that
  picture and on the server's own tests. UI automation of this dialog is still the gap it has always been.
- The emblem is drawn with a pen in `DrawBin` (`stand-in:`); the request for Astra's is in `docs/ART_REQUESTS.md`.

**Released as [v2026.09.21.7](https://github.com/AceSpartiate/texas-civilization/releases/tag/v2026.09.21.7)** on
2026-09-21, verified on the clean tree at `4190758` (879 passed).

**Play Solo asks what a class asks, 2026-09-21.** Found by the wizard-words agent and decided by the owner by multiple
choice — *"Ask, the way a class does."* A solo game opened `running`, and both `wagonProjection` and `grantProjection`
are sent **only in the lobby**, so the solo player was never offered the wagon or the stock choice at all: a solo family
always held a **labor of land, 177 acres**, where a student in a class who drives stock in holds a **league and a labor,
4,606**, and arrives with six cattle and twelve hogs. The owner had been playtesting the small grant with nobody having
chosen it. A solo game now opens in a lobby of its own and the player's own **Done packing** is the Start.

- `begin-solo` is a student action the server accepts **only on a solo server and only in the lobby**. A class has a
  teacher and this is not a second way to start one; both halves of that are held by a test and by an injection.
- The page is told it is a solo game by one boolean on the snapshot (`solo: true`) rather than a role of its own — a
  solo player is a student in every other way.
- Evidence: `tests/solo.test.mjs` (six tests) and `docs/evidence/solo-games-injections.json` — **12 of 12 caught**, the
  two `if (!solo)` second locks still recorded as not provable over HTTP. `npm run test:solo` now walks the wizard, reads
  the stock choice's own words back (*"Drive cattle and hogs in…"*), presses Done packing and watches the world start;
  `npm run test:solo-game` plays a whole solo game through all three periods and the ending, 15 checks.
- **Two old owner decisions are amended by this**, and both are marked where they were written: `docs/DEPLOYMENT.md`
  ("already running", 2026-09-17) and `docs/LAND_GRANTS.md` (the open gap the agent recorded this morning).

**Five harnesses found unable to run, 2026-09-21.** Every one of them reported success while matching nothing, which is
the worst failure a proof can have. `scripts/lesson-screen-injections.mjs` and `scripts/weather-model-injections.mjs`
matched LF patterns against a CRLF working copy; `scripts/lesson-injections.mjs` went stale when the sale rule changed
the same day, so every injection after it was skipped; three injections in the screen harness were still written against
a `pointedKey` that had been rewritten; and one in the weather harness against a `rainingAt` the rain work had moved into
`rainingOn`. All repaired: lesson-screen **23 of 23**, lesson **38 of 39**, weather-model **27 of 27**.

The pattern is worth naming, because it will happen again: **an injection harness is code that nothing tests.** It only
runs when somebody runs it, it reports a number either way, and a pattern that has drifted from the code it points at
fails *open*. Two defences are now in every harness here - the `ends` helper for CRLF, and a throw when a pattern does
not match exactly once - and the second is what found four of these five.
