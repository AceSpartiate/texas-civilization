# Men's work, women's work, and the wash: "Custom, necessity opens"

**Owner-decided 2026-10-03, its four follow-up questions answered 2026-10-04 (§1b), and the viability study's seven answered the same day (§1c); not released.** Amends [FAMILY_CREATION.md](FAMILY_CREATION.md) §4 (the housekeeping saving now comes
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

## 1c. The owner's answers to the viability study's seven questions (2026-10-04)

[BALANCE.md](BALANCE.md) §23 measured whether the game is too hard to play short of one sex and put seven questions; the owner chose,
verbatim, from the multiple choice:

1. *How should a woman or girl help when the only man is busy?* (§23 issue 1) **"Help, not lead"** - women and girls of ten or more may
   join men's work a man of the family has begun, never begin it.
2. *How should a family with one grown person keep house?* (issue 2) **"Children keep house"**.
3. *Should the house be kept when nobody is told to?* (issue 3) **"Prompt the student"**.
4. *Who may be washed for after wash day?* (issue 4) **"Wash whoever's dirty"**.
5. *How should men help with the women's work?* (issue 5) **"Help, not lead"** - men and boys may join the women's work a woman has
   begun; the same rule as the first answer.
6. *When is a man of the army away?* (issue 6) **"Only while serving"** - a rule fault, fixed.
7. *Should a son of sixteen keep men's work from his mother?* (issue 7) **"Leave it"** - with "Help, not lead" she may join his work.

**Built** (2026-10-04, branch `custom-work-3`):

- **Help, not lead** (§2b, `FIC-GONZ-1159`): both ways, from ten, only work more hands speed; on the bar only while one of its custom is
  at it, with the helping-hands badge; never begun; left off when he (or she) leaves off.
- **Children keep house** (§4b, `FIC-GONZ-1158`): the honest reading of the owner's question about lone parents - **whenever only one
  custom is kept at home** (no grown man at home and able, or no grown woman), a child of **seven** or more of either sex may keep house
  and do the wash: a lone father's children, a lone mother's (so she can work the field and the men's work), and a mother's whose
  husband is at the war. A child on auto takes it up first; so do the families nobody plays.
- **Prompt the student** (§8): a cue, not text - the work's picture (the pot over the fire, the washtub) pulsing on the portrait of the
  one idle person who may begin it, and the matching icon glowing on her bar, while the house is not kept today or somebody at home
  wants the wash. Never on somebody busy, on auto (who keeps house by herself) or stopped by a child, gone once the work is done or
  somebody is at it, **quiet while the food is low** and **never on the only grown hand at home** (for a lone parent it points at a
  child of seven instead) - both found by measuring a student who follows it (BALANCE.md §24).
- **Wash whoever's dirty** (§6, `FIC-GONZ-1160`): the weekly wash day stays the household's; before the week is out the wash may be done
  again whenever somebody at home wants it - dirty, or away on wash day - cleaning only them, so the one going to town can be washed
  first.
- **Only while serving** (§2, `FIC-GONZ-1150` amended): a man is away from the custom while serving or a prisoner; sent for or deserted
  and home, he keeps it.
- **Leave it**: nothing changed for the son of sixteen.

## 2. The rule (`sim/custom.mjs`, `FIC-GONZ-1150`)

- **Every work is men's, women's or shared** (§3). Only the table's works have a custom; everything else is shared and never asked.
- **Who keeps the custom**: a man (or a woman) of the family of **sixteen or over** (`FIGHTS_FROM_AGE`), or a parent of the founding
  four, who have no stated age. **A boy of ten to fifteen follows the men's work and a girl the women's, but nobody under sixteen keeps
  it from anybody else**: a mother whose husband is at the war may take up the axe beside her son of fourteen.
- **At home and able** (`keepers`): on the family's own land - standing there, or out on a work of the place that comes home by
  itself (the creek, the timber, the range; `homeWork` in sim/chores.mjs) - and not dead, taken, very sick, sick or lying wounded.
  Tired or slightly hurt, a man still keeps it. **Away** is a journey to town or to the war, serving with any force (or held its
  prisoner), helping where a call sent them, or visiting at the neighbours'. **Only while serving** (owner, 2026-10-04; `withTheArmy`):
  a man sent for (`released`) or who deserted keeps his service record for the land and the glory, and once home he keeps the custom
  like anybody - until 2026-10-04 the record counted him away for good.
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

## 2b. Help, not lead (`helpsWhom`, `helpLead`, `helpHeld`; `FIC-GONZ-1159`)

The owner, 2026-10-04, **"Help, not lead"**, both ways (§1c, answers 1 and 5):

- **Who**: a woman or girl of **ten** or more (`HELPS_FROM_AGE`) may join men's work, and a man or boy of ten or more women's work -
  while the custom refuses them that work (somebody of its custom is at home).
- **What**: only work more hands speed - a `crew` on the chore table: the house, a clearing, the lane, the felling, a fence, the yard,
  the well, the carreta, furniture, keeping house, the garden and the wash (the three house works are joined like the fence since
  2026-10-04). **Not** the hunt, the survey, the range (its cattle are the men's by necessity; she minds the hogs there, §7), killing a
  beef or nursing (a second nurse adds nothing).
- **Joined, never begun**: the work is on the helper's list and bar **only while somebody of its custom is at it** (`helpLead`: the first
  of the family at that very work who is of its custom and not himself helping), sent with `help` (his id) and drawn with the green
  helping-hands badge; with nobody at it, it is not there and an order for it is refused in the custom's words. Pressed, the helper joins
  him where he is (his plot, his timber; a press on the map is not asked), marked `helping`, and the story says it - *"Elena went to help
  Thomas: work on the house."*
- **Their hands**: at the one curve every crew goes by (sim/hands.mjs): alongside the lead of a job done together (the fence, the well,
  the wash), or into the one thing (the house, the clearing, the lane, the felling).
- **Leaves when he does** (`helpHeld`): at work each puts their own hands into, the helper is asked as each spell or tree begins - so the
  one in hand is finished and put in - and leaves off once nobody of its custom is at it and somebody of it is still at home: *"Elena left
  off work on the house: Thomas is no longer at it."* Alongside a lead, the helper leaves with the lead (`workAlongside`). If the custom
  has opened meanwhile - every one of its custom gone from home - the work is theirs by necessity and goes on as anybody's.
- **The families nobody plays** help too: their women join the men at the house and the clearing, and the director lets a helper through
  to a work one of the family is already at (`ONE_AT_A_TIME`).
- `ceiling:` keeping house and the garden are steps of a tick each, and a step is never shorter than a tick, so a second pair of hands
  does not shorten them; the wash goes a tick sooner (five ticks to four) and the heavy works as much as any crew. Worth undoing only if a
  class wants a man's help at the hearth to show: longer steps, or the job's ticks shared.
- `ceiling:` the help is asked of somebody of the custom **at the work**, not merely at home: a mother whose husband is at the felling
  may join the felling, not begin the clearing.

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

## 4b. Children keep house (`childKeeps`, `FIC-GONZ-1158`)

The owner, 2026-10-04, **"Children keep house"** (§1c, answer 2; BALANCE.md §23 issue 2: a lone parent doing both customs fell behind):

- **When**: whenever **only one custom is kept at home** (`childrenKeepHouse`): no grown man at home and able - a lone mother, or a mother
  whose husband is at the war or in town, who has the men's work to do - or no grown woman (a lone father). With both at home, the
  children keep their own works.
- **Who and what**: a child of the family of **seven** or more (`CHILD_KEEPS_FROM`), girl or boy, may **keep house and do the wash**
  (`CHILDREN_KEEP`); a boy of ten to fifteen too, whom the custom held from the women's work while his mother was home. Not the garden,
  which stays the women's.
- **On the bar**: the two works are marked a child's (`child`), so a child of seven to nine sees them on their own bar beside the water
  and the eggs, only while they are theirs to do; a child's order for them is taken; and they are worked at a grown work's pace (`grown`).
- **Auto**: a child on their own automation keeps house first, then the wash when it is wanted (sim/childhood.mjs `JOBS_FIRST`); a
  grown person or a child of ten on auto keeps house while their task waits as before. The families nobody plays send a child of seven
  to nine to the house before they give the grown hands the farm.
- **What it saves**: the house a child keeps saves what **that child's own** housework saves - the hidden trait of FAMILY_CREATION.md §4,
  which grows with age, so a child of eight saves little and a girl of fourteen nearly what her mother would. The wash a child does
  cleans as anybody's does.
- `ceiling:` the saving is the child's own, not the parent's; a lone mother who wants the most from the house keeps it herself. Worth
  undoing only if the owner wants a child's keeping house to count as the parent's.

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
- **The wash for whoever's dirty** (owner, 2026-10-04, **"Wash whoever's dirty"**; `wantsWash`, `washWanted`, `FIC-GONZ-1160`): the
  weekly wash day stays the household's (`household.washDay`), and **before the week is out the wash may be done again whenever somebody
  at home wants it** - their clothes dirty, or away when the family's wash day was done - **cleaning only them**; the family's wash day
  does not move (*"Elena did a wash for Thomas, who wanted it before wash day: one set of clothes boiled, beaten and hung on the fence to
  dry."*). So the one sent to town, who was the one most often away on wash day, can be washed for before he goes again. With nobody
  at home wanting it the refusal is as before (*"The wash was done 3 days ago; it is done once a week."*).
- **A family with no woman can always wash**: the men by necessity (§2), and a child of seven or more for a lone parent (§4b).
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
- **Help** (owner, 2026-10-04, §2b): work open only as help is on the bar with a small **green helping-hands badge** in its corner
  (`data-help`), no map press asked; its popup says whom - *"Helps Thomas, and leaves off when they do."* - and it leaves the bar when he
  leaves the work.
- **The house's cue** (owner, 2026-10-04, **"Prompt the student"**; sim/housework.mjs `houseCue`, sent as `cue` on one person): while the
  house is not kept today, or somebody at home wants the wash, the one idle person who may begin it - in the panel's order, father,
  mother, then the eldest child; so a woman or girl while one is home, a man when none is, a child for a lone parent - has the work's
  own picture (the pot over the fire, or the washtub) **pulsing in the foot of her portrait**, and the matching icon on her bar **glows
  blue** (`data-cue`). No words. Not on somebody busy, on auto, stopped by a child, sick or away; gone the tick somebody is at that work
  or it is done. One cue at a time for the family: the house before the wash. **Quiet while the food is low** (under a week of the
  family's eating, `CUE_FOOD_DAYS`, the food gauge's own "low": the ways to food glow then) and **never on the only grown hand at home**
  (a lone parent, or a mother whose husband is away: the cue goes to a child of seven who may keep house for them, or to nobody).
  Measured (BALANCE.md §24): a student who pressed the cue first, before both rules, drew lone parents from the field into the wash and
  lost children to hunger at home.
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
| `FIC-GONZ-1150` (amended 2026-10-04) | Away only while serving or a prisoner: a man sent for or deserted and home keeps the custom |
| `FIC-GONZ-1158` | Children of seven keep house and wash whenever only one custom is kept at home (owner, 2026-10-04) |
| `FIC-GONZ-1159` | Help, not lead: from ten, both ways, joined never begun, left off with the lead (owner, 2026-10-04) |
| `FIC-GONZ-1160` | The wash for whoever at home wants it before the week is out; the weekly day stays (owner, 2026-10-04) |

## 10. Balance

[BALANCE.md](BALANCE.md) §22, briefly: two-parent families the director plays raise their house about half a day later (median
day 1.1 to 1.6 of the first period) and end it with more food (55.6 to 60.2); lone parents build as fast, clear a plot less and end
with far more food (25 to 39.5, 13 to 35.7); a student who gives no orders starves a day sooner (nobody keeps house); a student who
plays as the director does loses nobody at home either way.

[BALANCE.md](BALANCE.md) §23 (2026-10-04, a study for the owner: *"is it too hard to play if your family doesn't have enough of a
certain gender?"*): eleven family shapes over three periods against the game before the custom. No dead end; a family with one man for
all the men's work roofs its house one to three days later; a lone parent doing both customs falls behind (a lone mother of small
children loses children to hunger at home in the winter); a student who never finds *Keep house* is dirty in town nine times in ten;
seven questions with proposed fixes for the owner, none built.

[BALANCE.md](BALANCE.md) §24 (2026-10-04, the owner's answers built and measured again with §23's harness): the house roofed a day or
more sooner where a woman or girl may help the one man (class median 2.5 to 1.4 days, 1.2 before the custom); grown women without work
16% of their time (65% before the custom), girls of ten to fifteen 42% (81%); a lone mother of small children loses no child to hunger
at home (two in §23) but still goes hungry, since a child's keeping house saves little; a student who follows the cue keeps house and is
dirty at 38% of town arrivals against 90% for one who never finds it; dirty arrivals of a washing family 38% to 30%; the recalled man at
home again. Two remainders put to the owner as questions, not built.

## 11. Evidence

- `tests/custom-work.test.mjs` (12 tests: the rule and its words, and the other sex's work off the list; off the bar, and on it, lit, the tick it opens; opening for every way of being away; boys under sixteen; the line
  once a reason; the lone mother and the lone father; every step of the guided start has a hand in all three shapes, and its work
  played through by whoever the custom allows; auto; the job in hand finished; the cattle; the families nobody plays) and
  `tests/housework.test.mjs` (7: keeping house and the saving; the garden; the wash; the remark in town; at the war; the prices; an
  old save). Each proved by injection: `npm run test:custom-work-injections`, **73 of 73** (2026-10-04, with the answers below; 46 of
  46 before them) caught by the test written for them, 53 by that test alone ([record](evidence/custom-work-injections.json)).
- The owner's answers of 2026-10-04: `tests/custom-work.test.mjs` *help, not lead* (a woman or girl of ten joins the yard he is at, drawn
  as help, faster, never begun; a girl of nine not), *help, not lead, the other way* (a man and a boy of twelve join her at the house
  and the wash, faster; a boy of eight not), *help at work each puts their own hands into* (she helps raise the house, leaves off when he does, and goes on by
  necessity when he is dead), *only while serving*, and *the families nobody plays keep the custom* (now: and their women help);
  `tests/housework.test.mjs` *children keep house*, *prompt the student* (not while the food is low, never on the lone mother: her
  child of eight instead), *wash whoever's dirty*. Each of the 27 new injections caught by the test written for it; two first tried
  were caught by nothing, because another gate already holds the line (a boy of eight helping, held by the age ladder; the cue on
  somebody busy, held by `choreAvailability`), and were replaced by ones that bite (a girl of twelve refused; the cue on the only grown
  hand at home).
- `npm run test:custom-work`: the browser proof with screenshots, 17 checks - none of the men's work on the mother's bar with the father home and an order for it refused in words, the work lit once he is on the road, and the same button back when he goes again; and since 2026-10-04 the cue on the idle mother (and off her once busy), the house on her bar with the helping-hands badge while he builds and her joining him as help, their son of seven keeping house and doing the wash while the father is on the errand, and the father washed for, alone, before the week is out ([record](evidence/custom-work-browser.json)).
