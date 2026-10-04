# Men's work, women's work, and the wash: "Custom, necessity opens"

**Owner-decided 2026-10-03, its four follow-up questions answered 2026-10-04 (§1b); not released.** Amends [FAMILY_CREATION.md](FAMILY_CREATION.md) §4 (the housekeeping saving now comes
from somebody keeping house) and [STOCK.md](STOCK.md) §10.3 and §10.7 question 3 (who works the cattle). Built in `sim/custom.mjs`
(the rule), `sim/housework.mjs` (keeping house, the garden, the wash, what people say and what the shops ask), `sim/chores.mjs`
(`choreAvailability`, `beginChore`, `herdWorkHere`), `sim/auto.mjs`, `sim/neighbours.mjs` and `sim/errands.mjs`; drawn by
`public/family-panel.js`, `public/work-art.js`, `public/errand.js` and `public/app.js` (`drawGarden`, `drawFlies`).

## 1. What the owner asked for

> "also, work was usually gender specific. we should incorporate that in a historically accurate yet reasonable for a game way."

Answered by multiple choice on 2026-10-03, verbatim:

1. *How should custom work?* **"Custom, necessity opens"**: each job is men's, women's or shared; other-sex work is greyed while
   someone of the customary sex, 16+, is at home and able. It opens on its own when the men are away, sick, dead or at war, with one
   journal line ("With James gone to the army, Martha took up the axe.").
2. *When may a woman do men's work (and a man women's work)?* **"No man at home"**: opens when every man of 16+ is away, sick or dead
   (and the mirror for women's work: no woman of age at home).
3. *What should women's own work add, so mothers aren't idle?* The owner wrote: **"keep house, garden, wash clothes. if a family
   member goes to town/war/away then other npc's should have negative comments about their smell, higher than normal prices, etc
   unless a woman has been washing clothes."**
4. *Who works the cattle on horseback?* **"Men, by necessity"**: men and boys 12+; women only when no man is at home; hogs and milking
   open to everyone.

## 1b. The owner's answers to the build's four questions (2026-10-04)

Asked by multiple choice once the first build was merged; answered 2026-10-04, verbatim:

1. *Called aside by a child* (not away, as built; or away, as the brief had it): **"Not away"**. As built: a mother stopped to talk
   with a child is still at home, and keeps the women's work from her husband.
2. *How many of another's works a bar shows greyed* (six after the goals, as built; all; or none, only the words when pressed): the
   owner wrote **"none, they only appear if the correct gender isn't around to do it."** Built: the other sex's work is **not on a
   person's bar at all** while somebody of its custom is home and able - not greyed, not hatched - and appears, lit, the tick the rule
   opens it (§2, §8). This amends the first answer's "other-sex work is greyed".
3. *The wash's window* (clean 8, again after 4, as built; or clean 7, again after 7): **"Weekly wash day"**: clean seven days, and
   washed again after seven (§6; it was eight and four).
4. *The markup* (a quarter more and a fifth less, as built; a real more; or only the words): **"Quarter more, fifth less"**. As built
   (§6).

## 2. The rule (`sim/custom.mjs`, `FIC-GONZ-1150`)

- **Every work is men's, women's or shared** (§3). Only the table's works have a custom; everything else is shared and never asked.
- **Who keeps the custom**: a man (or a woman) of the family of **sixteen or over** (`FIGHTS_FROM_AGE`), or a parent of the founding
  four, who have no stated age. **A boy of ten to fifteen follows the men's work and a girl the women's, but nobody under sixteen keeps
  it from anybody else**: a mother whose husband is at the war may take up the axe beside her son of fourteen.
- **At home and able** (`keepers`): on the family's own land - standing there, or out on a work of the place that comes home by
  itself (the creek, the timber, the range; `homeWork` in sim/chores.mjs) - and not dead, taken, very sick, sick or lying wounded.
  Tired or slightly hurt, a man still keeps it. **Away** is a journey to town or to the war, serving with any force, helping where a
  call sent them, or visiting at the neighbours'.
- **Refused while a keeper is at home**, in the control's own words: *"Felling is men's work, and James is at home."*, *"The wash is
  women's work, and Martha is at home."* The refusal is in `choreAvailability`, the one gate every order passes - a student's hand,
  auto, the families nobody plays, the guided start - and marked `custom`, so **the work is left off the person's work list
  altogether** (`choresFor`) and never reaches the bar: not greyed, not there (owner, 2026-10-04: *"none, they only appear if the
  correct gender isn't around to do it"*). It **appears, lit, the tick nobody of that custom is home**. An order for it sent anyway -
  a page a tick stale, a direct command - is refused validly, in those words.
- **Opens by itself** when every keeper is away, sick or dead, with **one line in the family's story** the first time the person takes
  such work up for that reason (`noteNecessity`, `FIC-GONZ-1151`): *"With James gone to the army, Martha took up the axe."*, *"With
  James dead, Martha rode out after the cattle herself."*, *"With no grown woman in the family, Elias did the wash himself."* It is
  said again only when the reason changes (James home from town and gone to the army is a new line; his second trip to town is not),
  and kept on the person (`necessity`), absent on every class saved before.
- **A man coming home in the middle of her work lets it finish.** The rule is asked only when work is begun or joined. `ceiling:` a
  long job begun by necessity runs to its end however soon he is home; worth undoing only if a student finds a mother clearing ten
  acres beside a husband home a week.
- **Not counted as away, deliberately**: being called aside by the little ones (sim/aside.mjs). The brief that came with the request
  counted it; a father holding a crying baby for twenty minutes does not open the axe to the mother, and the icons would flicker.
- **Fighting, enlisting and voting are not here** and never open to a woman (sim/family.mjs `canFight`, sim/winter.mjs).
- **Never applied to anybody but the family's own members** (`customApplies`). The custom of the free white and Tejano households is
  the record's (`HIST-TEX-1150`, `-1151`, `-1153`); **for free Black families no source was found** for their own division of
  labour, and the game gives them the neighbours' custom as a reconstruction (`FIC-GONZ-1152`). **Enslaved people's labour ignored the
  custom entirely** - enslaved women ploughed, hoed and picked cotton beside the men (`HIST-TEX-1154`) - so the table must never be
  applied to an enslaved worker. None is ever a family's member or given work (VISION.md §15, sim/means.mjs), and `customApplies`
  refuses anybody who is not a member of the household, as a guard for the day the game shows one.

## 3. The table, every work

| Custom | Works (chore ids) |
| --- | --- |
| **Men's** | `survey-plot` Survey ten acres · `cut-lane` Cut the lane · `fence-yard` Fence a yard · `fence-plot` Fence a cleared plot · `dig-well` Dig a well · `clear-plot` Clear a staked plot · `build-house` Work on the house · `help-raise` Help raise the walls · `fell-trees` Fell trees (and `fetch-logs`, the retired `haul-logs`) · `make-carreta` Make a carreta · `make-furniture` Make furniture · `hunt-timber`, `hunt-land` Hunt · `take-small-game` Take small game · `practise-shooting` Practise at the mark · `cut-bee-tree` Cut a bee tree · `butcher-beef` Kill a beef · **the cattle** on *Ride the range after the stock* (`look-to-stock`; §7) |
| **Women's** | `keep-house` Keep house · `work-garden` Work the garden · `wash-clothes` Wash clothes · `nurse-home` Nurse the sick |
| **Shared** | `plant-field` Plant the field · `harvest-field` Bring in the crop · `butcher-hog` Kill a hog · `milk-cow`, `milk-road` Milk the cow · `fish-the-water` Fish the creek · `gather-oysters` Gather oysters · the hogs on *Ride the range* · `visit-shop` Go to town to trade, `sell-cotton`, `sell-food`, `fetch-powder`, `fetch-seed`, `buy-furniture`, `replace-hoe` (the town's errands) · `mend-hoe` Mend the hoe · `pitch-tent` Put up the tent · **all of the road east and the Scrape** (`hunt-road`, `fish-road`, `tend-sick`, `trade-crossing`, `rest-road`, `camp-apart`, `flee-hide`, `flee-bundle`, `flee-cow`, `road-lookout`, `road-sing`, `road-little-ones`, `camp-fire`, `ferry-help`, `share-food`, `ford-carry`, `child-help`): on the run every family did what had to be done · **the children's own works under ten** (`child-*`), by age as before |
| **Not by custom** | `enlist-regular`, `enlist-auxiliary`, `join-garrison`, `join-relief`, `join-matamoros`, `join-houston`, `join-seguin`, `go-vote` and the camp's `camp-drill`, `camp-forage`, `camp-guard`, `camp-scout`: the men's always, by `canFight` and the vote's own rule, never opened |

Why these: the record's men cleared, fenced, built, felled and hunted (Smithwick's men "killing game and cutting bee trees"), and its
women spun, wove, sewed, cooked, churned, milked, nursed, kept the garden and the dairy and washed (`HIST-TEX-1150`). Planting and
picking were family work on a small farm - the women and children of DeWitt's colony were "left to finish picking the cotton" in
November 1835 (`HIST-TEX-1151`) - so the field is shared. The milking is shared on the owner's word (answer 4) though the record
gives it to Mary Rabb; the hogs ran semi-wild and anybody minded them.

## 4. Keeping house (`keep-house`, `FIC-GONZ-1153`)

- **An order**, customarily the women's: an hour at the hearth and about the house - cooking, sewing and mending, sweeping out - **once
  a day for the family** (*"The house has been kept today, by Martha."*).
- **The hidden saving (FAMILY_CREATION.md §4, `housekeepingSaving`) now comes from somebody keeping house**: the housework of whoever
  kept it today or yesterday (`KEPT_DAYS` 2), up to a quarter of what the family eats, and **nothing when nobody did**. Until
  2026-10-03 it came from the best housekeeper standing at home, whatever they were doing. The honest reading of the owner's "keep
  house": the saving is work somebody does. It stays hidden: no control states it, and strength remains the only difference of pace
  between men and women (nothing here presents a trait as a claim about men and women).
- **A woman on auto at home keeps house** (`houseworkMeanwhile`, sim/auto.mjs): whoever on auto is waiting on their task and may keep
  house by custom does, then the wash when it is due, then the garden - so a mother on auto at the planting keeps house between plots.
  The families nobody plays keep house, wash and garden among their work too (sim/neighbours.mjs).
- **Drawn** at the front of the house: cooking at the fire (the tend-fire stand-in), sewing (the mending pose), sweeping (the hoeing
  cycle) - `WORK['keep-house']` in public/work-art.js.

## 5. The kitchen garden (`work-garden`, `FIC-GONZ-1154`)

- **Laid out the first day** beside the house, east of the yard and inside the family's land (`gardenPlace`), and **drawn from then
  on** (`drawGarden`: beds in rows, green in season, thin in the winter months).
- **Worked once a day for the family**: **0.3 food** a day in its season and **0.1** (greens and turnips) in December to February on the
  real land, from the day after it is laid out. A real source of food (docs/HUNGER.md §10), the size of the milking.
- The garden of 2026-09-28 (sim/crops.mjs) was a field crop for the autumn, and went because corn and cotton stopped needing seasons.
  This is a different thing - the kitchen garden the record gives the women (`HIST-TEX-1150`, `-1153`) - and nothing of that reason
  applies to it.

## 6. The wash, the smell and the prices (`wash-clothes`, `FIC-GONZ-1155` to `-1157`)

- **Wash day** (`HIST-TEX-1152`): water carried up, the wash boiled with lye soap, beaten on the bench and hung on the fence - about two
  hours of the class's work. **Once a week**: washed again only after **7 days** (`WASH_AGAIN_DAYS`; *"The wash was done 3 days ago;
  it is done once a week."*).
- **Clean for 7 days** (`CLEAN_DAYS`; the owner, 2026-10-04: **"Weekly wash day"**; it was eight and four until then), **person by
  person**: the wash cleans the clothes of everybody at
  home or out on a work of the place, and **not** of anybody away - a man gone to the war takes the shirt he had on. Each person's
  last wash is kept on them (`washed`); a class saved before 2026-10-03, and every person before the family's first wash, is read as
  washed on the day the class was first stepped (`world.washBase`, written once), so **an old class opens with everybody clean and no
  save version moved**.
- **The smell** (`advanceWash`, the owner's invention; `FIC-GONZ-1155`): anybody of a played family who arrives somewhere away from
  home - a town, the army or a camp, a neighbour's farm - **with clothes that want washing** is told so by somebody there: a townsman
  or keeper first, then a soldier or volunteer, then another family's people. **Once a place, and at most once in three days**, so an
  army on the march is not one long complaint. The words are the game's, of the period and never crude, chosen by a share
  (`REMARKS`): in town *"Stand a little off from the counter, if you please."*, *"Mercy. When did that shirt last see a washtub?"*;
  at the war *"I have smelt sweeter mules."*, *"Stay downwind of me on the march, if you please."*; at a neighbour's *"Is there no soap
  at your place?"*. Said in the family's story (*"Mr. Ibarra at Gonzales wrinkled his nose at Rosa's clothes: "..."*) and **over the
  speaker's head** for three ticks (`remarkLines`, the family's own `familyTalk`). Nothing is said on the road east, where every
  family's clothes were alike, nor at home.
- **The prices** (`FIC-GONZ-1156`): at the shops on the town errand, somebody whose clothes want washing **is asked a quarter more**
  (rounded up to the real or the quarter of a food: seed *"2 reales or 3.75 food for 2 seed (1 real or 3 food to a clean customer)"*)
  and **paid a fifth less** for what they sell, on the whole sale, rounded (three reales for nine food become two). The errand popup
  says why above the list, with flies, and draws every dearer price in ember (`dearer`, `dear`); the story says what was paid and what
  a clean customer would have paid. Judged at the counter, on the person's clothes there.
- **The flies** (`dirty` on the person, `drawFlies`): three specks circling the head and two wavy lines rising, over anybody whose
  clothes want washing, wherever they are drawn - at home a reminder, in town the cause of what is said. No words.
- **A family with no woman can always wash**: the men by necessity (§2).
- `ceiling:` the families nobody plays are sent to town by their director's own errands, which pay fixed prices; the markup is on the
  student's errand (the shops' list). Their women wash anyway (§4), so it would rarely bite.
- `ceiling:` the retired walk to the shops (`visit-shop-street`, kept for a class saved in the middle of it) pays the plain price.

## 7. The cattle (STOCK.md §10.7, question 3, answered again)

*Ride the range after the stock* (`look-to-stock`): **the cattle are the men's and boys' of twelve and over; a woman's or girl's only
when no man of sixteen or over is at home and able; the hogs are everybody's from seven**. While a man is home a woman sent to the
range **minds the hogs only**, on foot (`herdWorkHere`, `hogsOnly`, decided as she sets out); with no hogs to mind she is refused in the
custom's words (*"Working the cattle is men's work, and James is at home."*); with no man at home she works the cattle on the horse,
and the line says so once (*"With James dead, Martha rode out after the cattle herself."*). The milking stays everybody's.

## 8. What the page shows

- The family panel: **another's work is not on the bar** while somebody of its custom is home (owner, 2026-10-04), and appears, lit,
  the tick it opens; nothing of the custom rides on the tick. An icon that leaves the bar and comes back is the same button
  (`row.made`, public/app.js), proved in the browser. Until 2026-10-04 the bar kept six such works greyed with a fine hatch; that,
  `customSays`, `customNoun`, `CUSTOM_SHOWN_MOST` and `data-custom` are gone. Three new icons (stroked glyphs until drawn): a pot over the fire, a sprout over rows, a washtub.
- The map: a woman keeping house at the front of the house, in the garden, at the wash; **the garden beside the house**; **flies over
  a dirty person**; the townsman's words over his head.
- The errand popup: the sentence why, with flies, and the dearer prices in ember.
- Art: request 2026-10-03 *"men's work, women's work and the wash"* in [ART_REQUESTS.md](ART_REQUESTS.md) (items 1-10), its stand-ins
  under *Stand-ins in use*, and plan items F34-F36, A34, A35, E21.

## 9. History and fiction (HISTORY.md)

| Claim | What |
| --- | --- |
| `HIST-TEX-1150` | The division of a settler household's work: Mary Crownover Rabb, Smithwick, Looscan |
| `HIST-TEX-1151` | Women ran the place and took up the men's work when the men were away: Rabb with her gun at the fence, Dilue Harris's women picking the cotton in November 1835, Looscan's women "the overseer of farm-work as well" |
| `HIST-TEX-1152` | Wash day: a regular, heavy household work, weekly in the period's own manuals (Beecher, 1841), and the women of 1836 Texas "at the wash tub" (Harris) |
| `HIST-TEX-1153` | Tejanas tended gardens and domestic animals and made the clothing; widows held grants and herds (Orozco, TSHA) |
| `HIST-TEX-1154` | Enslaved women's labour ignored the custom: field work, ploughing and picking beside the men |
| `FIC-GONZ-1150` | The rule: men's, women's, shared; sixteen; at home and able; opens by itself |
| `FIC-GONZ-1151` | The opening line, once a reason |
| `FIC-GONZ-1152` | Free Black families given the neighbours' custom: no source found (reconstruction) |
| `FIC-GONZ-1153` | Keeping house as work, and the saving read from it |
| `FIC-GONZ-1154` | The kitchen garden's numbers |
| `FIC-GONZ-1155` | What people say of dirty clothes (an invention for play) |
| `FIC-GONZ-1156` | The shops' quarter more and fifth less (an invention for play) |
| `FIC-GONZ-1157` | A weekly wash day: clean for seven days, washed again after seven (owner, 2026-10-04) |

## 10. Balance

[BALANCE.md](BALANCE.md) §22, briefly: two-parent families the director plays raise their house about half a day later (median
day 1.1 to 1.6 of the first period) and end it with more food (55.6 to 60.2); lone parents build as fast, clear a plot less and end
with far more food (25 to 39.5, 13 to 35.7); a student who gives no orders starves a day sooner (nobody keeps house); a student who
plays as the director does loses nobody at home either way.

## 11. Evidence

- `tests/custom-work.test.mjs` (12 tests: the rule and its words, and the other sex's work off the list; off the bar, and on it, lit, the tick it opens; opening for every way of being away; boys under sixteen; the line
  once a reason; the lone mother and the lone father; every step of the guided start has a hand in all three shapes, and its work
  played through by whoever the custom allows; auto; the job in hand finished; the cattle; the families nobody plays) and
  `tests/housework.test.mjs` (7: keeping house and the saving; the garden; the wash; the remark in town; at the war; the prices; an
  old save). Each proved by injection: `npm run test:custom-work-injections`, **46 of 46** (2026-10-04) caught by the test written for
  them, 37 by that test alone ([record](evidence/custom-work-injections.json)).
- `npm run test:custom-work`: the browser proof with screenshots, 14 checks - none of the men's work on the mother's bar with the father home and an order for it refused in words, the work lit once he is on the road, and the same button back when he goes again ([record](evidence/custom-work-browser.json)).
