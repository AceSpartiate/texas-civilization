# Children, babies and the Runaway Scrape's own work

Owner-decided 2026-09-26. Built the same day in `sim/children.mjs`, `sim/childhood.mjs`, `sim/obedience.mjs`, `sim/babies.mjs`,
`sim/aside.mjs` and `sim/flight-work.mjs`. Claims `HIST-TEX-630` to `-645` and `FIC-GONZ-475` to `-489` (HISTORY.md).

This amends docs/FAMILY_CREATION.md §3 (what a child under ten can do, amended already on 2026-09-21), **supersedes the rule of
2026-09-21 that an infant under two has nothing**, and adds a hidden stat to docs/FAMILY_CREATION.md §4. Who may be sent to fight,
who answers a call, what the wagon holds and who rides and who walks are unchanged.

---

## 1. What the owner asked for

Verbatim, 2026-09-26:

> "children that are too small don't do anything on the farm. we n3ed to make them do stuff. actions specifically for them .
> different types of play, and if they're idle they should find the nearest 0arent and engage them in an automated conversation.
> this conversation stops the parent from doing their task until the kid is given a new task. yes, kids should be able to be
> automated. no, it shouldn't go forever. kids disobey sometimes. sometimes they should randomly turn off their automation
> feature. wh3n kids are created there should be a hidden d20 roll for each one. the higher the roll, the more obedient, and vice
> versa. when it's the runaway scrape, if a family has to run, the kids and family members as a whole should have new tasks and
> abilities specifically geared for that. be creative."

And later the same day:

> "babies can crawl around and cry for attention too. if they cry, then the nearest female character that's of age will stop
> their task and hold the baby for a while. they'll comfort the baby and sing to it. then they'll put the baby down for a nap.
> then they return to their previous task and state. if there's only one female of age, then they won't obey an order to leave
> the baby and travel without the baby. be creative in how you handle the various situations that can arise from this. it isn't
> meant to be annoying or a time sink. it's meant to make the family feel more alive."

> "of age means old enough to do work on the farm for our purposes."

What the owner saw is plain from the code as it stood: a child at play had a `doing` the page drew no pose for, so a child of
four at play stood in the yard exactly as a child with nothing to do; and an infant had no work and no life at all.

---

## 2. Things for small children to do, visibly (`FIC-GONZ-475`)

Play has kinds. Each is a work of its own on the one chore table, with its own icon on the family panel that glows while the server
says the child is at it, and each is **drawn as what it is**: `playStep` moves the child about the yard every tick by the kind of play,
and the page walks them from one place to the next over the tick and picks the pose from what they are doing (public/motion.js
`littleClip`). A child sent to play while the family is still being drawn walking in off its road (a family home faster than its
land can be walked is drawn arriving late, docs/MAP_ACCURACY.md §12a.2) is let go of the road at once and walked to the play at a
child's pace (public/app.js `walkOn`, 2026-09-28): until then the child was drawn walking in beside the parent for as long as the
late arrival lasted, and never seen at the play.

| From | Until | Work | Drawn as |
| --- | --- | --- | --- |
| 2 | 10 | **Play as they please** (`child-play`) | whichever play their line tells of: at the water, a stick horse, hiding in the brush, a fort of sticks, Indians and rangers, lying in the grass |
| 2 | 7 | **Ride a stick horse** | galloping out and back across the yard (walking) |
| 2 | 10 | **Play with a corn-husk doll** | sitting by the house |
| 3 | 10 | **Play tag** | running from place to place about the family's play spot |
| 3 | 7 | **Scatter corn for the hens** | side-on, crouched |
| 4 | 10 | **Play hide-and-seek** | off behind the house, back turned and still, then out to be found |
| 4 | 10 | **Make a toy cart** (biscuit wheels, `HIST-TEX-631`) | kneeling |
| 5 | 10 | **Roll a hoop** | down the lane and back |
| 5 | 10 | **Marbles and knucklebones** | kneeling |

The jobs of 2026-09-21 are unchanged: kindling, the birds and the eggs from five, water and minding from seven, all to ten. **What a
child of two to four can do** is play - three kinds at two, and tag at three, hide-and-seek and the toy cart at four - and one job,
scattering corn for the hens, from three. The stick horse and the hens are left to the little ones at seven, when the pail and the
baby come, which also keeps an older child's row from being fourteen pictures long.

Play adds nothing to the family's store, and neither do the hens: the eggs remain the one thing a child brings in (`FIC-GONZ-305`).
Play is never disobeyed (§4).

`stand-in:` the children's sheets hold standing, walking and resting poses only. Running play is the child's walk, the doll and
lying in the grass the child's sitting rest, the cart, marbles and the hens the side-on rest, hiding the back-turned standing pose.
Requested in docs/ART_REQUESTS.md (2026-09-26); icons are stroked glyphs until the `icon-<key>` frames land.

---

## 3. The idle child goes to a parent (`FIC-GONZ-476`, `-477`, `-481`)

`sim/childhood.mjs` `advanceTalks`, every tick, for a family somebody plays:

1. **Who.** A child of two to nine, alive and at home, with no work, not on their own automation, not carried.
2. **When.** After `IDLE_TICKS` (two ticks - an hour of the farming day) with nothing to do. Not on a calendar faster than an hour
   a tick (`TALK_SCALE`: on the real land's four- and twelve-hour ticks a child at the elbow would stop a parent for half a day at a
   time), not in the dark (six in the morning to nine at night is the waking day, `WAKING_HOURS`), not while the family is being
   walked through its guided start (docs/LESSON.md -
   a student taught one farm task at a time is not also to be stopped by a child at the father's elbow), not in a family nobody plays
   or whose student has gone (nobody could give that child anything, and the parent would stand for the rest of the class), and
   not on the road east, which has its own work for them (§7).
3. **To whom.** The **nearest parent at home**. With no parent at home, the **nearest of the family old enough for its work** - ten
   or more: an elder brother or sister, a grown son. With **nobody** of age at home, the child goes off and **plays by themself**, and
   says so in the record; nobody is stopped.
4. **What happens.** The child walks over (one tick, drawn walking) and they talk: words over both, a line from the child and one
   back, changing every tick, childlike and of the frontier and never a historical person's (`CHILD_SAYS`, `GROWN_SAYS`,
   RECONSTRUCTED, dashed bubbles). **From the tick the child arrives the grown-up's work stands exactly where it is** - the chore, its
   step, its wait, its answers, their automation - and working about the place brings nothing in for them (`sim/aside.mjs`, read by
   `advanceChore`, `advanceAuto` and `advanceRoutine`). Their row says so in amber, naming the child and what to do:
   *"Stopped to talk with Tom, who has nothing to do. Give Tom something to do and Mary goes back to planting."*
5. **How it ends.** Only when the child is given something to do - by the student, or by the child's own automation - and then the
   grown-up goes back to exactly what they were at the same tick. Or when something the world does takes one of them away: a journey,
   the army, a death, the family's flight, a baby who needs holding (§6). The child then waits again, and may come again.

**The family's record** hears of it once a day for each child and each grown-up (`firstToday`), and those lines are kept out of the
page's short window of the family's news (`ambient`): the rows and the bubbles say it every time it happens, and a journal of the
same child going to the same parent all afternoon would push out what a family must read - found by the Mexican advance's proof,
whose "the house stands" was pushed out of the window by a family of children at home. Dawdling, wandering off and a child's
automation going off are not ambient: they are the plain lines obedience is made legible by.

While a grown-up is stopped they are refused **new work and journeys of their own** in those words. The family's answers to the
game's own questions - a call, the army, the road, the flight - are not refused: they are not the grown-up's task, and a journey
lets them go. Several children may come to one grown-up; two of them speak on a tick, in turn.

---

## 4. Obedience: a hidden d20 (`FIC-GONZ-478`, `-479`)

Rolled for **every son and daughter when the family is rolled** - twins as any - from the class's seed and the child's id on a
question of its own (`obedienceRoll`, sim/family.mjs), and kept with the hidden stats (`traits.obedience`). **Never on any wire**: not
the family's page, a neighbour's or the Host's; two classes the same but for their children's rolls send every page the same bytes
(tests/childhood.test.mjs). A child saved before the die gets the roll their seed and id make, when it is asked, never written back:
**no save version moved.**

It governs three things, each something the child is **seen doing, with a plain line saying so** (sim/obedience.mjs):

| Effect | At a roll of 1 | At a roll of 20 | What the family sees |
| --- | --- | --- | --- |
| Dawdling before a job | 30 in 100 jobs, two ticks | 2 in 100, one tick | *"Tom is dawdling instead of starting carrying water to the house."* The row: "Dawdling instead of starting." |
| Wandering off from a job | 6 in 100 a tick | 1 in 500 a tick | *"Tom has wandered off to play tag instead of carrying water to the house."* - and Tom is seen playing tag, on tag's icon. On the road east the job is left off and the child is back with the family. |
| Switching their automation off | 5 in 100 a tick | 1 in 500 a tick | *"Tom has decided they have done enough, and gone their own way: their automation is off."* On the row for six ticks. |

Every rate falls in a straight line up the die, so a lower roll is always the harder child and there is no cliff. **Play is never
disobeyed** - a child told to play who plays is doing as they are told - and nothing is punished: a child who wanders off has cost
the family nothing but the job. It applies to children of two to nine; see §9 for ten to fifteen.

---

## 5. A child's own automation (`FIC-GONZ-480`)

A child of two or more has the Auto switch on their row now (an infant has none, and is refused it in words). On it, the child
**finds themself things to do**: the jobs they are big enough for, most useful first - the eggs, the pail, the little ones, kindling,
the birds, the hens - with play between, one after the other. **Since 2026-09-29 it lasts until the day ends** (§12); until then it
lasted `childAutoTicks` of their roll, eighteen ticks at a 1 to fifty-six at a 20. It then goes off by itself: *"Tom has been good for as
long as a child can be, and has stopped finding themself things to do."* - and an "!" stands on the child's row until they are given
something to do (§12). The child may also switch it off themself (§4). **How long it has left is never shown**: a child's row says what
they are doing, never how long they will keep at it.

---

## 6. Babies (`FIC-GONZ-482` to `-486`)

**This supersedes the owner's rule of 2026-09-21 that an infant under two has nothing** (docs/FAMILY_CREATION.md §3's amendment,
docs/FAMILY_PANEL.md, docs/SETTLING_IN.md). An infant is still given no work. In a family somebody plays:

- **Awake**, a baby crawls a few yards this way and that about where it was set down (`CRAWL_REACH`, about nine yards; Rabb's baby
  crawled two hundred yards to the cow pen, `HIST-TEX-636`). Its row: "Crawling about the yard."
- **Now and then it cries** (`CRY_PER_TICK`, three in a hundred ticks of the farming day, about one cry a morning; twice as often
  sick): a tick of "(crying)" over it and "Crying for somebody." on its row.
- **Who comes**, in this order: a **child minding the little ones** (`child-mind`) has it already and stops nobody; a **woman already
  holding** another baby takes this one too (twins); else the **nearest woman of age at home** - "of age" is the owner's "old enough
  to do work on the farm", ten, `SENT_FROM_AGE`, so an elder sister of ten comes as her mother would (`HIST-TEX-645`); else the
  **nearest of the family of age**, a father or an elder brother; else **it cries a while and settles by itself**.
- **What she does**: stops her work where it stands, goes to it, picks it up and hushes it, **hums a lullaby** - named in the stage
  direction, "(humming)" in the bubble, never the words (`HIST-TEX-637`, `-638`) - puts it down to nap (`NAP_TICKS`, two hours), and
  **goes back to exactly her previous task and state**: the same chore at the same step with the same wait, where she stood, working
  or resting as she was, her automation as it was. Two ticks for a well baby (the tick she picks it up and the tick she lays it down),
  three for a sick one.
- **At night** a baby sleeps ("Asleep for the night.") and wakes nobody in the game's dark.
- **Sick** (since 2026-09-27, docs/DISEASE.md, sim/disease.mjs): a sick baby **held or carried is nursed** that day (`FIC-GONZ-673`)
  - the carer is doing it already - so nobody holding it lets it die that day or the next. Babies and small children are the ones a
  sickness turns very sick most (the whooping cough only them; the measles three times a grown person's weight under two), and a
  child can die of it: told to the family in one plain sentence, not drawn, not spotlighted, never named on the Host's projector
  (the owner, 2026-09-27). A sick baby is drawn as it is (a lying infant is request 2026-09-27 item 3, docs/ART_REQUESTS.md).

**Not annoying, not a time sink.** A well baby takes at most `COMFORT_CAP_TICKS` - four ticks, two comfortings, forty minutes - of
any one person's day; past it the next nearest comes, or it settles. The record hears of a person's comforting once a day, out of the
page's news window, as the talk is (§3). A sick baby is not capped: it needs more holding. A child who
has come to talk with her is let go the moment she goes to the baby, and may come again when she is back: the two never hold her at
once and never hold each other up. No popups: it happens in the world, in bubbles, and on the rows.

**Leaving the baby** (`takeBabyAlong`, from `beginTravel`, `FIC-GONZ-484`). The owner: "if there's only one female of age, then they
won't obey an order to leave the baby and travel without the baby." The least annoying reading is chosen: **the order is obeyed, and
she takes the baby with her on her hip**, said in the record - never a refusal, never a popup. With another woman of age at home she
leaves it with her ("Mary left Ana with Sarah."). The rule is carried on to the last grown person at home of all, so a lone father
sent to town does not leave a baby in the yard. A carried baby goes by her road, drawn at her side, and is set down to nap when she
is home.

**On foot she goes a quarter slower** (owner, 2026-09-27, decision 1 of §9 by multiple choice: "(B) goes a quarter slower on foot";
`FIC-GONZ-630`). Whoever walks with a baby on the hip goes at `HIP_PACE`, three quarters of a walker's pace, to town and home again
(`hipPace`, from `beginTravel`), and the row says why: *"On foot with Ana on her hip: walking a quarter slower for it."* The owner's
clarification, verbatim: *"if a mother and a child are riding on something, they would go the logical speed of that method of
transportation. horse, wagon, wouldn't be slowed down by a baby."* So on the horse, with the wagon, the cart or the carreta the pace
is that way of going's own, and the row says *"Ana rides with her, on the horse: no slower for it."* Somebody already slower - leading
an ox home - is slowed no further. As the carrying itself is (above), it is carried on to a lone father. `ceiling:` the family walking
together on the road east (sim/company.mjs) keeps its pace with a baby in its mother's arms: beside a wagon she keeps up with the ox
whatever she carries, and a family with no vehicle already goes at its slowest walker; the way out is `HIP_PACE` in `companyPace`.

**On the road east** the family carries its babies already (sim/company.mjs: in the mother's arms, or the wagon with her): nothing
stops, and a baby that cries is sung to as they go - a line of the day at most. At the camp at the refuge a baby crawls and cries as
at home. Where the calendar runs faster than an hour a tick (`COMFORT_SCALE`) a tick is too long a stretch to stop anybody for, and a
cry is a line of the day (`FIC-GONZ-485`). A family nobody plays is never stopped by its babies, and its babies stand as they did.

`stand-in:` the infant sheet has standing and resting poses only; crawling is the standing infant moved over the ground, and a woman
holding a baby is the harvest's carrying pose with the infant at her side. Requested in docs/ART_REQUESTS.md (2026-09-26).

---

## 7. The Runaway Scrape's own work (`FIC-GONZ-487` to `-489`, `HIST-TEX-639` to `-644`)

`sim/flight-work.mjs`. Each is a real work with an icon, offered only while it means something, and doing what it says where the
flight's own rules are (sim/scrape.mjs, sim/road.mjs):

| Work | Who | When | What it does | The record |
| --- | --- | --- | --- | --- |
| **Hide what the wagon cannot carry** | 10+ | told to leave | Powder, seed and cotton left behind, up to six units of the wagon's room, hidden in the river bottom: no fire or forager finds them; dug up on coming home. | DOCUMENTED: the Roses hid furniture and a chest in the river bottom; silver buried in a potato patch (`HIST-TEX-640`) |
| **Make up a bundle to carry** | 5-15 | told to leave | Half a unit more of the family's goods for each child with a bundle, on foot and when the wagon is left. | RECONSTRUCTED from the Roses' walking (`HIST-TEX-641`) |
| **Watch the road behind** | 7+ | on the road or at the refuge | Word of the army at thirty miles, not twenty: "Tom, watching the road behind, saw the dust first." | RECONSTRUCTED - no lookout in any source read |
| **Sing to keep the little ones walking** | 3+ | on the road, somebody walking | The family's walkers worn three quarters as much. | RECONSTRUCTED - no singing on the road in any source read |
| **Keep the little ones walking** | 7+ | on the road, a child of five or under walking | The family goes at its older walkers' pace, not its smallest. | RECONSTRUCTED from the older children walking beside (`HIST-TEX-641`) |
| **Keep a fire going** | 5+ | at a crossing or the refuge | A norther that night or the next finds nobody out in the cold (no cold weight in the day's sickness). | RECONSTRUCTED; the Trinity bottom without fire (`HIST-TEX-238`) |
| **Help load at the ferry** | 10+ | waiting at a crossing | The family's turn six hours sooner, once a crossing. | RECONSTRUCTED; five thousand waited at Lynch's ferry (`HIST-TEX-068`) |
| **Share food with a family camped here** | 10+ | at a crossing or the refuge | A food to the hungriest family camped at the same place, told in both families' records. | DOCUMENTED kindness: Liberty's people, a stranger at the Trinity (`HIST-TEX-642`) |
| **Carry the little ones over** | 16+ | on foot at a crossing below its banks | The family wades over now instead of waiting its turn; everybody with it worn six miles' worth. | RECONSTRUCTED; the documented crossing is the raft and the riders (`HIST-TEX-642`) |
| **Drive the milk cow along** (2026-09-27) | 7-15 | told to leave, the family has cattle | One cow out of the herd goes with the family: 0.2 food of milk a day; a day's milk lost when the child lets her stray; taken if overtaken; home to the herd; a family on foot goes at her pace, the ox's. | RECONSTRUCTED - no child driving a milk cow in any source read (`FIC-GONZ-631`) |

And one rule that is nobody's work: **a family with a sick child is let over a flooded crossing first**, at half the wait, as the
ferryman at the Trinity did (`HIST-TEX-639`, DOCUMENTED; the half is the game's).

What was already the road's is unchanged and still offered: **nursing the sick** (`tend-sick`, which halts the family a day - the
measles and whooping cough of the record), the hunt from the camp, the line in the river and the trade at the crossing; **what goes in
the wagon** is the family's choice as it was; **the father's choice between the family and the army** is the existing one and who may
be sent to fight did not change. A child's flight work is a job, and a child's obedience governs it (§4).

**Driving the milk cow along** (owner, 2026-09-27, decision 4 of §9: **"Yes, one cow"**; `FIC-GONZ-631`; docs/STOCK.md §8, which it
amends). A family told to leave that has cattle may set a child of seven to fifteen to *Drive the milk cow along* (`flee-cow`): one cow
comes out of the herd left on the range and goes with the family, driven by the child - a child's job, so the child may dawdle - and
gives `MILK_A_DAY`, 0.2 food, a day on the road, at the refuge and on the way home. **The child's obedience applies**: on a day a child
of a low roll lets her stray (`cowStrayChance`, three days in ten at a 1, one in a hundred at a 20) there is no milk, and she is found by
dark - never lost by straying. She is **taken if the Mexican army overtakes the family**, and home again she goes back into the herd.
A family with no cattle is not offered her. The child's row says *"Driving the milk cow along behind the family."*, and the page draws
her a step behind them (`stand-in:` a range longhorn's standing and grazing frames; docs/ART_REQUESTS.md, request 2026-09-27).
**On foot the family goes at her pace** (owner, 2026-09-27, decision 6 of §9: **"Slow a family on foot"**; `FIC-GONZ-631` amended):
with the cow along and no wagon, cart or carreta, nobody of the family goes faster than `COW_PACE` (`cowPace`, sim/flight-work.mjs) -
east, on to a further refuge, after leaving the wagon in the mud, and home. Her pace is not a new number: it is the one the game already
gives cattle driven on the road, sim/beasts.mjs `LEAD_PACE.cattle` (`FIC-GONZ-389`), which is the ox team's `WAGON_SPEED` - "the slow
pace of the oxen", about two miles an hour (`HIST-TEX-093`): 0.65 miles a tick, 1.95 an hour, 13.65 in the road's seven-hour day,
against a walker's three an hour and twenty-one. A family with a wagon, cart or carreta already goes at the ox's pace and is **not
slowed by her**; a family already slower - a child of five or under walking - is slowed no further, and kept walking by the hand it
goes at her pace and no faster. The driver's row says why: *"Driving the milk cow along behind the family: on foot, they all go at her
slower pace."*, and the family's flight card: *"On foot with the milk cow, the family goes no faster than she walks, about two miles
an hour."* When the army takes her, the family is let go at its own pace again.
**The research found no source for a child driving a milk cow** on the Runaway Scrape: the record has boys driving range cattle by
another road (`HIST-TEX-641`) and nothing of a milk cow, so the whole of it is RECONSTRUCTED.

---

## 8. The research

Checked 2026-09-26. Labels as HISTORY.md: **DOCUMENTED** (a period source or institutional history states it), **STRONGLY
SUPPORTED** (scholarly synthesis), **TRADITION**, **RECONSTRUCTED** (the game's inference). Every row is in HISTORY.md with its URL.

**Children's play.** Marbles, jacks and tops are very old games; hide-and-seek, blindman's buff and ring games were Texas children's
games; play-parties were popular in frontier Texas (`HIST-TEX-630`, STRONGLY SUPPORTED - Hartzog, *Handbook of Texas*, "Folk
Games"; its Mexican-American games are dated to the twentieth century and are not used). Frontier children made their own toys from
what was at hand; corn-shuck dolls came to Texas from the East; hoops are ancient; rubber-band toys came after 1830 (`HIST-TEX-632`,
STRONGLY SUPPORTED - Haile and Abernethy in *Texas Toys and Games*, 1989). A colonist's boy made a toy Mexican cart with his mother's
biscuits for wheels (`HIST-TEX-631`, DOCUMENTED - Smithwick). Running games at noon between chores, and small children dropping seed
corn and carrying water - of the 1850s and of Nebraska, not Texas in 1835 (`HIST-TEX-633`). **Stick horses, mud pies, mumblety-peg
and Andy-over have no dated Texas source**: the stick horse is RECONSTRUCTED; Andy-over is attested only from the mid-century and
is not used.

**What children of two to four did.** No 1830s Texas source gives a chore by age (`HIST-TEX-400` said so of the older ladder too).
Rabb's small child opened the cow-pen gate at milking, and her little ones played near the door with the puppies (`HIST-TEX-634`,
DOCUMENTED). A child of three scattering corn for the hens is RECONSTRUCTED from that and from generic frontier accounts.

**Babies.** An earth floor, a mother spinning at night with the baby asleep (`HIST-TEX-635`); a baby who crawled two hundred yards to
the cow pen (`HIST-TEX-636`); a mother jumping from the cart with the baby under her arm, and a father carrying it across the Colorado
on horseback (Rabb); older sisters as surrogate mothers in nineteenth-century America (`HIST-TEX-645`, STRONGLY SUPPORTED, no age).
Lullabies in print and public domain by the 1830s: Watts's "A Cradle Hymn" (1715), "Hush-a-by Baby" (c. 1765), "Bye, Baby Bunting"
(1731) (`HIST-TEX-637`); a Spanish cradle verse to Señora Santa Ana, collected in New Mexico in 1916 (`HIST-TEX-638`). **That any of
them was sung in a Texas cabin in 1835 is RECONSTRUCTED.** No source read has a baby carried on the hip or a puncheon floor.

**Children and families on the Runaway Scrape.** Dilue Rose Harris, who was eleven (`HIST-TEX-639` to `-642`): the family hid
furniture and a chest in the river bottom before leaving; left at sunset on an ox sled, Dilue walking beside her mother, who carried
the baby, her brother of thirteen driving the oxen and her little sisters riding; the brother sent to help drive cattle, the large boys
being at the army; the children gathered into one cart on the bogged prairie; five thousand at Lynch's ferry and three days' wait;
measles, sore eyes and whooping cough at the Trinity, and the ferryman letting families with sick children over first; the flood, the
raft and the riders; a stranger's supper and dry clothes; Liberty's help; a little sister dead and buried at Liberty, and the mother
worn out with nursing. Mary Rabb: driven out with all her small children, and her baby of under three months dead on the road
(`HIST-TEX-643`). Creed Taylor (late and edited): children on staked horses each carrying what it could; a mother walking barefoot
with her baby; strangers making a bed in their wagon for a mother just delivered (`HIST-TEX-644`, TRADITION for the vignettes).
Smithwick: women and children walking, a young woman keeping a solid-wheeled cart's wheels wet with a bucket, plunderers frightening
families into dropping their goods (`HIST-TEX-065` and his pp. 128-129).

**Not found anywhere read**, and so RECONSTRUCTED wherever the game uses it: a hand-chain crossing, singing on the road, a child as
lookout, a milk cow driven along, burying dishes as a common practice (beyond the Roses and the silver), a baby on the hip.

**Sources not reached**: West's *Growing Up with the Country* (summaries only); the unexpurgated Harris notebooks (2000); Rabb's 1962
printed edition (the 2000 transcription was used); Adele Looscan's articles; a Rose genealogy page (403).

---

## 9. Ceilings, and what the owner may want to decide

- ~~`ceiling:` a woman carrying a baby goes no slower on her errand.~~ **Decided 2026-09-27: a quarter slower on foot only** (§6).
- ~~`ceiling:` the milk cow goes at the family's pace, whatever it is.~~ **Decided 2026-09-27: a family on foot goes at her pace**
  (§7, decision 6).
- ~~A tight column folds a baby's sentence away and its row says nothing.~~ **Decided 2026-09-27: one short word instead** (decision 7).
- `ceiling:` **a baby whose carrier is killed or taken on an errand** is set down where they were and stays there; nobody in the
  record read has it, and bringing it home wants a journey nobody is making.
- `ceiling:` **obedience governs children of two to nine only.** Ten to fifteen have the family's own work, and a fourteen-year-old
  who wandered off from planting would cost the family more than the owner asked for; they are rolled a die all the same, so extending
  it is one line. **Kept as the owner's choice, 2026-09-27** (decision 2, (A)).
- `ceiling:` **the idle child is held back during the guided start.** A class that could not work out how to farm (docs/LESSON.md) is
  not also stopped by a child at the father's elbow.
- `ceiling:` **no night-time crying**: the game's dark (nine at night to six in the morning) is asleep.
- `ceiling:` a child's words are chosen by the tick, not by what the child last did; a talk does not remember what was said.

**Decisions for the owner**, multiple choice:

**Decided 2026-09-27**: 1 as (B), with the owner's clarification that riding or in a vehicle the pace is that way of going's own
(§6); 4 as (B), "Yes, one cow" (§7, docs/STOCK.md §8). Later the same day, by multiple choice: 6, "Slow a family on foot" (§7);
7, "Show a short word" (below); and two recorded with no change - 1's rule holds for **anyone carrying**, a father too, and 2 is (A).
3 and 5 are still open.

1. **A woman carrying a baby on an errand:** (A) goes at her own pace, as built; (B) goes a quarter slower on foot; (C) the order is
   refused in words and she must be sent with the baby by a second press. **Decided: (B).** **Recorded 2026-09-27, no change:
   carrying a baby on foot slows anyone who carries it, the father too** - as built (`hipPace` reads whoever carries the baby, and the
   carrying is carried on to a lone father, §6).
2. **Obedience for children of ten to fifteen:** (A) not applied, as built; (B) dawdling only; (C) dawdling and wandering, as for the
   younger ones. **Recorded 2026-09-27, no change: (A), obedience is not applied to ten to fifteen** (§4; the `ceiling:` above stands
   as the owner's choice, and they are still rolled a die).
3. **The idle child during the guided start:** (A) held back until the lesson is over, as built; (B) comes to the parent as at any other
   time.
4. **A milk cow driven along on the Scrape** (docs/STOCK.md keeps the herd on the range and has no milk): (A) not built, as now;
   (B) one cow driven by a child, a little milk a day, lost if overtaken - an amendment to STOCK.md. **Decided: (B), "Yes, one cow".**
5. **How often a baby cries at home:** (A) about one cry a morning, as built; (B) half that; (C) twice that.
6. **The milk cow and the family's pace on the road** (docs/STOCK.md §8 had "she goes at the family's pace, whatever it is" as a
   `ceiling:`): (A) she keeps up with anybody, as built; (B) slow a family on foot to her pace, a family with a wagon not slowed.
   **Decided: (B), "Slow a family on foot".** Her pace is the one the game gives cattle driven on the road, the ox's (sim/beasts.mjs
   `LEAD_PACE`, `HIST-TEX-093`): 0.65 miles a tick, 1.95 an hour (§7).
7. **A baby's row when the family column is too tight for full rows** (a family of twenty; the stylesheet folded a baby's sentence
   away first and the row said nothing): (A) nothing, as built; (B) show a short word. **Decided: (B), "Show a short word".** Every
   baby's row that is not the main person's shows one word beside its name - "crawling", "crying", "held", "napping", "asleep" or
   "carried" - with its sentence as the word's title (sim/babies.mjs `babyWord`, read in the order `babyLine` reads, so the two never
   disagree; public/family-panel.js `lifeWord`; public/style.css `.panel-life-word`). Beside the name, not on a line of its own, so the
   row is no taller for it. A sick baby's word is what it is doing; "Sick." is in the sentence.

---

## 10. Evidence

See HANDOFF.md, "Children, babies and the Scrape's own work (not released)", for the numbers of the test suite, the injections and
the browser proofs, and docs/evidence/ for their records.

---

## 11. Amendment, 2026-09-28 — the oldest child steps up; a baby never goes to the war; nobody very sick is called

Owner, 2026-09-28: "fix the blockers", and by multiple choice for a family left with nobody who can act: **"The oldest child steps
up"** - a child of about seven or older can act for the family in an emergency (flee, fetch water, mind the little ones, go for
help), as frontier children really did; with none, the student follows a neighbour family that takes them in. Built in
sim/acting.mjs; the whole rule is docs/FAMILY_PANEL.md §20 (`FIC-GONZ-730` to `-734`). What it changes here:

- **A child of seven to nine acts for the family** when nobody grown is with it: the order to leave, the route, staying, the road's
  questions and "¡Alto!" are theirs, on their row and card. Water and minding the little ones were theirs already (§2); **going for
  help** (`child-help`) is new, and is the one child's work with a road in it - a run on foot to the nearest neighbours, who take
  the family in. A child under seven still answers nothing, and is told who does.
- **A baby never goes to the war** (`takeBabyAlong`, `FIC-GONZ-733`; amends §6 "Leaving the baby"). The rule that the last grown
  person at home takes the baby along holds for every journey that comes home - town, a call's help, a visit - and not for a man
  going to join an army, the garrison or a call's volunteers: the baby stays with the nearest woman of age, else anybody of age,
  else an older brother or sister, said in the record ("Elias went to the war and left Rosa at home with Benita: a baby does not go
  with the army."). Before a man is sent to the war with only children under ten at home, the control says so. Until 2026-09-28 a
  widower's baby marched with Houston's army on his hip (interactions audit S4).
- **Nobody very sick or lying wounded is called** (`FIC-GONZ-734`; amends §3 and §6): a crying baby is not brought to them
  (`whoComes`), an idle child does not come to stop their rest (`talkTarget`), and the tick they turn very sick a baby they held is
  set down and a child with them let go (`settleTheUnable`).
- **Nobody gone is heard** (interactions audit M1): the dead and the taken let go of the family's little ones in the same tick, and
  neither `talkLines` nor `babyLines` gives a line to anybody gone.

~~`ceiling:` the little ones taken in by the neighbours can be watched, and their own works at their own home are not open to them
there; what they may do for the family that took them in is an owner's decision (docs/FAMILY_PANEL.md §20, decision 1).~~ **Decided
2026-09-29: "Follow and watch"** - the student follows the family that took them in and watches it, and gives no orders (§12,
docs/FAMILY_PANEL.md §20a).

---

## 12. Amendment, 2026-09-29 — until the day ends; follow and watch

The owner, by multiple choice on the triage of the 2026-09-28 audits (docs/audits/2026-09-29-triage.md, D2 and D3):

**D2, "Until the day ends."** Small children needed an order about every seventy-six seconds: play lasted six ticks, a child's auto
eighteen to fifty-six by their roll, and a child with nothing to do stopped a parent after two; a child's auto going off raised no "!".
In a family of eight to eighteen children that was most of what the student did (playthrough audit #9, design audit M7, M13, M26). Now:

- **A child's play lasts until the day ends** (`allDay` on the play's step, sim/chores.mjs; sim/child-day.mjs `dayOver`): every kind of
  play of §2, set by the student or taken up by a child alone at home for want of anybody to go to (§3). The play's own line goes into
  the record once, when the day is over.
- **A child's own automation lasts until the day ends** (§5). The jobs it finds and the play between go their old lengths - a spell of
  play is its couple of hours (`spell`), so a child on auto still takes up the eggs, the pail and the hens between - and the automation
  itself is what lasts the day. The child may still tire of it sooner by their hidden roll (§4); **the roll stays hidden**: two classes
  the same but for their children's rolls still send every page the same bytes.
- **An "!" when a child's auto goes off** (`autoOffAsking`, sim/childhood.mjs; public/family-panel.js `needsOf`, kind `child`, ranked
  after work that has stopped to ask and before an offer): *"Tom's auto went off. Give Tom something to do, or put Auto on again."* It
  stays until the child is given a work, play, or their auto again - not when they are only called off, and not when they take up play
  alone - and it never says how long the auto had lasted. The row's "Auto went off" line is still there for six ticks.
- **"Set out: play" at most once a day** (interactions audit M5, triage 2.3): the first play a child sets out to each day is written in
  the record, and the rest are on the row and the map (`firstPlayToday`, sim/chores.mjs, in the child's `told`).
- **The day** is the one the simulation already keeps, `Math.floor(minute / 1440)`: in a class whose families arrive by wagon it turns
  at six in the morning, when the children wake (sim/clock.mjs `dateOf`), and in an older class at midnight, in the dark.
- **Unchanged**: a child with nothing to do still goes to a parent after `IDLE_TICKS`; with play lasting the day that is at the day's
  turn, or when the student calls a child off. Obedience, dawdling and wandering off (§4) are as they were; a child who wanders off from
  a job is off at a spell of play, not the rest of the day.
- `ceiling:` **never sooner than eighteen ticks** (`DAY_FLOOR_TICKS`, sim/child-day.mjs). On the real land's faster calendars a day is
  six ticks or two, under a minute of a lesson, and an "!" on every child on auto every twenty seconds is the time sink the owner ruled
  out (§1). A day counted in the student's own minutes there is the way out.

**D3(a), "Follow and watch."** A student whose whole family is gone - everybody dead or a prisoner, the one meaning the ending uses
(sim/ending.mjs `nobodyLeft`) - or whose little ones have all been taken in by a neighbour family (§11), with nobody else of the family
left to play (a man serving with the army is still theirs), follows the family that took them in, or else the nearest neighbour family,
and watches it. The whole rule, the page and the refusals are docs/FAMILY_PANEL.md §20a
(sim/watching.mjs). Taken in, the little ones are on that family's page, where they are; when somebody grown of their own comes for
them, the page is the family's own again. **D3(b)** (the age a child steps up at) and **D3(c)** (a lone father sent to the war with only
small children at home) were not asked again: seven, and a warning, as built.

**The two edges the triage found (D3).**

- **A straggler at the refuge when the family turns home** is sent home after it: *"Tom came to Washington to find the family gone home.
  Tom follows it home."* (`followTo`, sim/acting.mjs). Until now he stood at the refuge for the rest of the game.
- **Little ones at home with no neighbour family near** - every one gone east, or with nobody grown at home - are not left without a word:
  *"Nobody grown is left at home with Benita, Chana and Rosa, and there is no neighbour family near to take them in: every one has
  gone. They wait at home."*, in the family's record, once a day while it is so (`nobodyNear`). `ceiling:` **they wait at home**: nobody
  turns back for them, and a child of six is sent on no road. The family's order to leave goes by itself after its day and takes them
  east, and at the refuge the families camped there take them in; a neighbour's wagon turning in for them is the way out.

Evidence: HANDOFF.md, "Small children until the day ends; follow and watch (not released)".

---

## 13. Amendment, 2026-10-02 — the children always go in out of the weather, and somebody of ten or more goes with them

Owner, 2026-10-02, verbatim: *"kids should always seek shelter, and a 10+yo character should have to accompany them and play with them
since they can't play outdoors."* Built in `sim/shelter.mjs` (`FIC-GONZ-1093`); the family's half - the tent, who goes in and where -
is docs/SETTLING_IN.md §4c.

- **Every child under ten goes in** on a day of rain, a storm or a norther, babies too (a baby in somebody's arms goes where it is
  carried). Whatever they were set to - a job, a kind of play, their own automation - **waits where it stands** (sim/aside.mjs
  `heldIndoors`, read by `advanceChore`; sim/childhood.mjs passes a sheltering child by) and goes on when it clears. A child given an
  order meanwhile keeps it for then. A sheltering child does not go to talk to anybody (§3): they are inside with somebody.
- **Somebody of ten or more sits with them and plays with them**, chosen each tick in this order: the nearest of ten or more already
  in out of the weather; else the nearest **older brother or sister of ten to fifteen** at work near the house (the elder child who
  minded the little ones, `HIST-TEX-645`); else the nearest **grown person** at work near the house. Their work stands exactly where
  it is (`aside` of kind `shelter`), and they go back to it, and to where they were, when the weather clears. Somebody free who comes
  in later takes over from a worker called in, who goes back to the work.
- **Never** somebody out on the land after game, fish, oysters, honey, timber or the stock, nursing the sick, or on a road
  (`CANNOT_LEAVE`): their work is out there.
- **A student's order wins.** Unlike a child's talk (§3), sitting with the children refuses nothing: the person's bar is open, and an
  order sends them; they are not called in again that day (`shelterExcused`) and somebody else comes in, or nobody.
- **With nobody who can come**, the children keep each other company, said once a day in the family's record.
- **On the same terms as the talk and the crying baby** (§3, §6): only in a family somebody plays, in the waking day, on a calendar of
  an hour a tick or slower, and not in a guided start. A family nobody plays sends its children in and stops nobody for them.
- **A baby who cries** in shelter is jogged on the companion's hip, as a child minding the little ones does it (`whoComes`).
- On the row: the roof or tent mark on each child's portrait, and the companion's one line, *"Inside with Tom and Ann, out of the
  weather."*
- `ceiling:` the companion "plays with them" in the picture - all of them sitting in the tent's mouth, or gone into the house - and in
  no words; indoor play of its own (cat's cradle, a story) is the way out if a class wants to see it.
- Measured (docs/WOODS_AND_BUILDING.md §6.11): in a family raising its house, the companion costs the slowest tenth of families about
  a fifth more time to the roof (155 ticks against 131); the medians do not move.

## 14. Amendment, 2026-10-02 — the fenced yard

The owner, 2026-10-02: *"there should be an option to fence in a yard too. if there's a fenced in yard then kids on auto play will not
be disobedient as often."* The yard itself - where it goes, what it costs, how it is drawn - is docs/LAND_GRANTS.md §10.3
(sim/land-paths.mjs). What it changes for the little ones (`FIC-GONZ-1104`):

- **Half as often disobedient** (`YARD_KEEPS` 0.5, sim/obedience.mjs `keptByYard`): a child of two to nine **on their own
  automation**, at home and not on a road, with sound rails round the family's yard, dawdles, wanders off from a job and switches
  their automation off half as often as the same child without one. Every rate of the die (§4) is multiplied, so the die stays a
  straight line and a harder child is still harder:

  | Effect | At a roll of 1, no yard → yard | At a roll of 20, no yard → yard |
  | --- | --- | --- |
  | Dawdling before a job | 30 → 15 in 100 jobs | 2 → 1 in 100 |
  | Wandering off from a job | 6 → 3 in 100 a tick | 1 in 500 → 1 in 1,000 a tick |
  | Switching their automation off | 5 → 2.5 in 100 a tick | 1 in 500 → 1 in 1,000 a tick |

  So the hardest child on auto keeps at it about forty ticks on average before tiring of it, where it kept at it about twenty. A child
  the student told what to do is as they always were: the owner's words are about kids on auto, and a child sent to the eggs by hand
  is doing as they are told. The roll stays hidden; nothing on any wire changes but the yard itself.
- **Play stays inside the yard** (sim/children.mjs `playStep`, sim/land-paths.mjs `keepInYard`): every kind of play is begun inside
  the rails and kept there - tag, the stick horse, the hoop down the lane and back, hiding behind the house - and the page never draws
  a child the server has inside the yard out over the fence (public/app.js `drawEntity`). That is the yard's effect, seen: the little
  ones in the fenced dooryard, not scattered about the land. No line says so.
- `ceiling:` the yard keeps a child on auto at home wherever on the land their job puts them; a job never takes a small child out of
  the yard today (the children's jobs are done where they stand), so a rule by where they stand would read the same.
