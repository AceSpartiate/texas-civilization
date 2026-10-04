# The balance measure: who wins, and why

**Measured 2026-09-27, at the owner's word** (by multiple choice: *"Yes, measure it now"* - run many automatic classes and report
who wins and why, **with no change to the rules until the owner has seen the numbers**). Nothing in the game was changed for this.
Script: `scripts/balance-measure.mjs` (`npm run balance:measure`). Record: [evidence/balance-measure.json](evidence/balance-measure.json).
The rule it measures is `docs/MONEY_AND_GLORY.md` §5 and §8 (*winning without fighting is hard, not impossible*) and `VISION.md`
§8 and §20 (a family that sends nobody must be able to win, though it should be difficult).

> **Answered and re-measured (2026-09-27/28).** The owner answered the four questions of §6 on 2026-09-27: leave staying home as
> it is, make coin the store's default, weigh the prisoners, raise the cotton price. All four are built and the same 210 classes
> were run again: **§9**. Sections 1-8 are the first measure as the owner read it, kept as it was. Two of its findings were the
> measure's own faults, found while building the answers (§9.1): **no bale of cotton was ever sold for coin, and no family rolled to
> corn ever planted cotton**, so "selling for coin" meant selling food, and "cotton made no difference" measured nothing. The record
> in [evidence/balance-measure.json](evidence/balance-measure.json) is now the re-measure; the first is in git (commit 363fb33).
>
> **Every family work at half its length (2026-09-29, not released): §15** - a quick look of 30 classes, not the 210; winners
> up by about a quarter to a half, coin by about a sixth. The record is still §14's run.
>
> **A third of the pace in the winter, a real for three food (2026-09-28, not released): §14** (winners at about 40,000 / 63,000 /
> 105,000). The record is now that run.
>
> **Slower in the winter, corn ten food a plot (2026-09-28, not released): §13** (winners at about 41,000 / 68,000 / 114,000). The
> record is now that run.
>
> **No limit until the Scrape, spare corn sold, corn four minutes and cotton six (2026-09-28, not released): §12** (winners at about
> 51,000 / 80,000 / 123,000). The record is now that run.
>
> **Crops in real minutes, the market re-tuned, prisoners weighed 1.5 (2026-09-28, not released): §11**, superseding §10's seasons the
> same afternoon (winners at about 4,100 / 10,000 / 15,200). The record is now that run.
>
> **Seasons and a limited market (2026-09-28, not released): §10.** The owner's answer to the design audit's blocker B9. The same
> 210 classes run again: winners at about 2,000 / 4,800 / 8,200 instead of 122,000 / 231,000 / 347,000. The record
> [evidence/balance-measure.json](evidence/balance-measure.json) is now that run; §9's "after" is in git at 8db1759.

---

## 1. The answer, in plain words

**Is the ending fair?** It is decided mostly by what a family *chooses*, not by its dice: the choices below explain about half of
where a family finishes, the family die about 7 in 100, the means die about 2 in 100, where its land lies about 2 in 100, and
deaths, burnings and captures about 2 in 100. The rest (about 40 in 100) is the game's own chance - who comes home from a fight, a
hunt, which column overtakes a wagon. So luck does not pick the winner. **But two choices decide almost everything: sending a man
to the war, and selling for coin.** A family that does both wins about three to four times its fair share of classes. A family that
never sells for coin almost never wins (1.4 in 100), however much it fights, because the final number multiplies the coin in the
house and a family that takes food at the counter has three or four reales to multiply.

**Can a family that sends nobody win?** **Only in the smallest classes, and only when the fighting families did badly.** In 210
classes a family that sent nobody finished first **twice (1 class in 100), both in five-family classes**, where every fighting
family had finished with almost nothing (winners at 783 and 56, where a five-family class is usually won at about 9,900). In
fifteen- and thirty-family classes - the size of a real class - it **never won and never reached the top three**. The best family
that sent nobody in each class finished, in the middle case, with **less than 1 in 100 of the winner's number**. To draw level with
the winner holding coin alone it would have needed, in the middle case, about **2,400 reales**; the most any family that sent nobody
ever held was 341. So the owner's gate - *possible, but difficult* - **holds only in five-family classes and fails at fifteen and
thirty**. At the sizes classes are played, staying home is not a hard road to first place; it is not a road.

**Does starting rich decide it?** No, though it helps, as the owner decided it should (coin held, 2026-09-25). Among families that
fought and sold, those that came with 7-10 reales won about 30 in 100 classes against 26 in 100 for those that came with 3-4.

**Does any strategy dominate?** *Fighting and selling* does: every one of the fifteen best combinations of choices both sent
somebody and sold for coin. Among the ways of fighting, sending **every man** beats sending **one** more the bigger the class (in
thirty-family classes 10 in 100 against 1 in 100). Farming harder helps a little; planting cotton made no difference.

**Does glory ever reward a death?** **No.** No award was ever larger than its part's weight times its distance; no woman was ever
sent to fight; and families whose fighting man was killed finished *lower* than families whose men all came home (less glory,
115 against 156; less land, 6 reales against 22; won less often).

**Is staying in the Scrape better than fleeing?** By the numbers, yes (index 1.18 against 0.79): the road spends coin, the burn zone
burns a farm whether the family stays or goes, and the ending does not count the 2,120 people taken prisoner at home in families that
stayed inside the zone.

**What the owner is asked** is in §6: four questions, each with a recommended answer. Nothing has been changed.

---

## 2. What was run

- **210 whole classes**, arrival to April 25, 1836, through all three periods to the ending: **100 of five families, 70 of fifteen,
  40 of thirty** - **2,750 families**. Seeds `measure-<size>-<n>`. Every class reached its ending.
- **Every family is played by a strategy**, dealt independently of every other factor and of the family's two dice (checked before
  running: no pair of factors is off its expected count by more than 8 in 100):

| Factor | Levels | What it does (only actions a student can send, through `applyAction`) |
| --- | --- | --- |
| war | **none** | Nobody is ever sent: not the call, the gathering, enlisting, the garrison, the expedition, the relief or Houston. Voting is kept. |
| | **neighbour** | The neighbours' own director: the call as the letters say, the winter's choices at the record's shares (about one man in ten). |
| | **one** | One man in the war whenever the family has none there: the call, the Gonzales questions, enlisting for land, the relief of the Alamo, Houston's army. |
| | **all** | Every man who may be sent is sent to every one of those that is offered. |
| sell | no / **yes** | Yes: every bale at the counter for coin, and food beyond three weeks' eating sold for coin. No: the counter's own answer, food. |
| farm | plain / **hard** | Hard: six plots under survey, not the director's three. |
| crop | own / **cotton** | Cotton at the field whenever the seed allows, and the seed fetched for it. |
| scrape | **flee** / **stay** / **late** | Told to leave: go at once, stay and take what comes, or stay three days and then go. |

- Everything else a family does - building, planting, harvesting, hunting, buying powder, the road east's questions, the camp's
  work - is the neighbours' director (`sim/neighbours.mjs`), and every question the war asks a man already in the ranks is answered at
  the shares the game gives a family whose student has gone.
- **Deterministic**: the same command gives the same 210 classes and the same numbers, whatever the number of worker threads
  (checked: two runs of the same classes on 2 and 3 workers were identical apart from the runtime).
- **Runtime**: 4,792 s on 18 worker threads (85,514 CPU seconds; a five-family class about 95 s, fifteen 284 s, thirty 1,405 s,
  under full load on a 24-core machine).
- **What the harness does that a class does not** (the harness, not a rule): each family's student is marked away during every tick,
  so its questions are answered at once; the guided start is closed with the student's own X; every family is rolled at the start as
  the teacher's Start rolls a joined family; and the winter-clothing furlough of November 3 never happens, because the game gives
  it only to families nobody plays. A strategy is fixed for the whole class: a student who changes course half way is not modelled.
  **Not measured**: trading with a neighbour face to face (the director only answers offers and never makes them); the family's
  store of food and goods at the end (the ending counts only coin held).

---

## 3. Who wins

"Win %" counts a tie as a share. "Fair share" is what a family would win if the winner were drawn from a hat (1 in 5, 15 or 30).
"Index" is the two divided: 1 is exactly its share, 2 is twice. "Place" is where the family finished, 0 first and 1 last.

### 3.1 By what the family did about the war

| War | Families | Win % | Fair share % | Index | Top 3 % | Mean place | Median final | Mean coin | Mean glory | Mean land |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| all | 661 | 15.4 | 7.7 | **2.00** | 36.6 | 0.31 | 1,007 | 31.6 | 217 | 30.5 |
| one | 706 | 9.9 | 7.6 | **1.31** | 30.5 | 0.38 | 681 | 36.4 | 107 | 14.6 |
| neighbour | 690 | 5.2 | 7.6 | 0.68 | 20.1 | 0.52 | 245 | 44.9 | 56 | 4.2 |
| none | 693 | **0.3** | 7.6 | **0.04** | 5.1 | 0.78 | 14 | 44.2 | -1.6 | 0 |

Head to head (two families in one class, different war strategies): *all* finished above *none* 95 times in 100, above *one* 59,
above *neighbour* 70; *one* above *none* 91.

### 3.2 War and the store together

| | Win % | Index | Top 3 % | Median final | Mean coin |
| --- | ---: | ---: | ---: | ---: | ---: |
| all, sells for coin | **29.1** | **3.93** | 54.0 | 5,891 | 62 |
| one, sells for coin | 18.6 | 2.32 | 48.3 | 3,891 | 70 |
| neighbour, sells for coin | 9.3 | 1.24 | 32.1 | 893 | 81 |
| none, sells for coin | 0.6 | 0.08 | 7.9 | 97 | 86 |
| all, food at the counter | 3.2 | 0.40 | 21.0 | 604 | 4 |
| one, food at the counter | 1.7 | 0.23 | 13.5 | 418 | 4 |
| neighbour, food at the counter | 0.6 | 0.08 | 6.8 | 114 | 4 |
| none, food at the counter | 0 | 0 | 2.3 | 6 | 4 |

Selling for coin, over all families: 14.0 % won against 1.4 % for families that did not (index 1.85 against 0.18).

### 3.3 The other choices

| Choice | Win % | Index | Top 3 % | Note |
| --- | ---: | ---: | ---: | --- |
| farm hard | 8.6 | 1.16 | 24.2 | more ground, a little more coin (42 against 36) |
| farm plain | 6.6 | 0.85 | 21.7 | |
| cotton | 7.1 | 0.92 | 23.2 | no measurable gain |
| own crop | 8.2 | 1.08 | 22.7 | |
| Scrape: stay | 9.0 | **1.18** | 24.7 | mean coin 47.5 |
| Scrape: late | 8.1 | 1.04 | 23.7 | 34.7 |
| Scrape: flee | 6.0 | **0.79** | 20.6 | 36.3 |

Every farm inside the burn zone burned (1,441 of 1,441) and none outside it, whatever the family did: in this build the zone, not the
choice, decides the fire. Staying costs no glory and keeps coin the road spends, and the people it costs - 2,120 taken prisoner at
home in families that stayed inside the zone, against 426 in families there that fled at once - the ending does not count; a family that fled and was overtaken lost glory as a
desertion does (about 120 families of every war strategy, 477 in all; for a family that sent nobody that costs nothing, since glory
below nothing counts as nothing).

### 3.4 The best and worst combinations

All fifteen best (of combinations that ran at least ten times) fought and sold: *all, sells, farms hard, cotton, late* (index 6.0),
*all, sells, hard, own crop, flee* (5.5), *one, sells, hard, own crop, stay* (5.4) ... The eight worst are all *one, food at the
counter*, and every combination of *none* won nothing but the two below.

---

## 4. A family that sends nobody

| | Five families | Fifteen | Thirty |
| --- | ---: | ---: | ---: |
| Families that sent nobody | 126 | 264 | 303 |
| Won | **2** (1.6 %) | **0** | **0** |
| Top three | 35 (28 %) | **0** | **0** |
| Winner's final number, middle class | 9,890 | 23,016 | 32,928 |

- **The two wins** (`measure-5-40`, `measure-5-66`): a family of seventeen with three men that sold 260 reales of crops, in a class
  where the families that meant to fight finished at 163 and below (one had no man to send); and a family of five that held 28 reales,
  in a class won at 56 where nobody fought at all (the family meant to send one man had none, and the neighbours' director sent
  nobody). Both are real wins, and both are classes in which the fighting never happened or went badly.
- **How far behind**: the best family that sent nobody in each class finished, in the middle case, with 0.6 in 100 of the winner's
  number (a quarter of classes 1.7 in 100 or better; one in ten 5.6 in 100 or better). Its middle place was 7th.
- **What it would need**: holding coin alone, about **2,400 reales** to draw level with its class's winner (middle case). Families that
  sent nobody and sold held 66 in the middle case, 196 at the top tenth, and 341 at most.
- **What its final number is**: coin, almost exactly. Glory for it is voting (1 point times distance) or nothing; one in six was
  overtaken on the road east and had even that taken away.

### 4.1 Would another scoring change it?

**A reading, not a proposal to build**: the same 2,750 families, held to what they did, scored other ways. A class that knew the
scoring was different might play differently, which this cannot show.

| Scoring | Classes won by a family that sent nobody | Win % none / neighbour / one / all | Top 3 % none |
| --- | ---: | --- | ---: |
| **As built**: coin × (1 + glory) + land | **1.0 %** | 0.3 / 5.2 / 9.9 / 15.4 | 5.1 |
| Distance multiplier capped at ×3 | 2.4 % | 0.7 / 5.5 / 9.5 / 15.1 | 6.3 |
| No distance multiplier | 3.8 % | 1.2 / 5.7 / 9.3 / 14.7 | 8.8 |
| Glory divided by 10 | 2.9 % | 0.9 / 5.2 / 9.8 / 15.0 | 6.8 |
| Square root of glory | 3.8 % | 1.2 / 6.7 / 10.8 / 12.1 | 9.7 |
| Coin + glory + land, added | 4.3 % | 1.3 / 2.6 / 6.1 / 21.2 | 6.2 |

**No reshaping of glory alone lifts staying home above about 4 classes in 100**, because a family that sent nobody has no glory at
all: anything that multiplies or adds glory leaves it behind. The gap is on the stay-home side - how little coin a farm makes, and
that nothing a family does at home earns glory - not in the size of the fighters' glory.

---

## 5. Why: the dice, the choices and the chances

### 5.1 How much each explains

Shares of the variance explained (Shapley, over groups of measures; ordinary least squares), on two measures of where a family
finished:

| Group | What is in it | Place in the class | Final number (log, within the class) |
| --- | --- | ---: | ---: |
| **Choices** | war, sell, farm, crop, Scrape | **0.456** | **0.505** |
| Family die | people, grown people, men | 0.062 | 0.075 |
| Means die | coin it came with, its band | 0.018 | 0.016 |
| Where the land fell | road miles from Gonzales, burn zone, settlement | 0.019 | 0.017 |
| Fates | deaths, men killed, captured, farm burned, stock driven off, glory taken away | 0.022 | 0.026 |
| **Not explained** | the game's own chances: the fights, the hunts, the road | 0.423 | 0.361 |

### 5.2 The means die, choices held level

| Strategy | Came with 3-4 reales | 5-6 | 7-10 |
| --- | ---: | ---: | ---: |
| all, sells: win % | 26.3 | 30.3 | 30.5 |
| one, sells: win % | 17.4 | 19.0 | 19.5 |
| neighbour, sells: win % | 9.4 | 8.3 | 10.7 |
| none, sells: win % | 0.9 | 0.7 | 0 |
| all, sells: median final | 4,328 | 5,142 | 11,998 |

By band over all families: hard up index 0.76, poor 1.00, modest 0.96, comfortable 1.08, well-to-do 1.23. A small advantage, and
real in the final number (the richest fighting sellers' median final is nearly three times the poorest's) - as the owner decided on
2026-09-25.

### 5.3 Class size

| War | Index at 5 | at 15 | at 30 |
| --- | ---: | ---: | ---: |
| all | 1.68 | 1.87 | **3.05** |
| one | 1.41 | 1.68 | **0.39** |
| neighbour | 0.84 | 0.50 | 0.61 |
| none | 0.08 | 0 | 0 |

The bigger the class, the more the family with the most glory wins it: in a class of thirty some family nearly always sent every
man and sold, and a family that sent one man rarely matches it.

### 5.4 Glory and death

- **No award larger than its weight**: every award in every class was checked against its part's weight times its distance multiplier
  (`sim/glory.mjs`): none exceeded it.
- **No woman fought** (0 awards for fighting to a woman; the owner's rule of 2026-09-16 holds under every strategy).
- **268 deaths** (221 men, 47 women - the women on the road east and at home, none in battle), in 248 families.
- **A death costs**: families that fought and lost a man won 11.3 % (index 1.40), against 12.5 % (index 1.64) for families that fought
  and whose men all came home; their glory 115 against 156 and their land 6 reales against 22 (land is promised only to the living).
  Across all families "a death in the family" looks better (index 1.19) only because the families that fight are the ones that lose
  men; held to families that fought, a death is a loss.
- **The neighbours' director loses far more men than any strategy here** (151 men killed, against 11 for *all*): its winter shares
  send about one man in ten to the Béxar garrison, and the Alamo follows. *All* enlists for land first, and a man serving at San Felipe
  is not free to go to the garrison.

---

## 6. Questions for the owner

Nothing has been changed. Each question has a recommended answer; the numbers it rests on are above.

**1. A family that sends nobody does not win at the sizes a class is played (0 of 567 families at fifteen and thirty; 2 of 126 at
five). The rule is "possible, but difficult". What should change?**

- **A. (Recommended)** Give staying home glory of its own: the support the design already names in `docs/MONEY_AND_GLORY.md` §4 and
  that nothing yet awards - feeding or sheltering a refugee family in the Scrape, selling food to the army, carrying supplies - at the
  support weight. §4.1 shows why: no reshaping of the fighters' glory lifts staying home above 4 classes in 100, because it has none.
- B. Weaken glory's multiplication, for instance the square root of glory: staying home would win about 4 classes in 100, and *all*
  would fall from 15.4 to 12.1 in 100.
- C. Let a farm earn far more coin - a better price for cotton, the store buying cattle and hogs: to draw level a family would need
  about 2,400 reales held, and the best seller held 341.
- D. Leave it, and say in `VISION.md` §20 that at fifteen families and more a family that sends nobody does not win.

**Answered 2026-09-27: "Leave it" (D).** No rule changed for it; `VISION.md` §20 and `docs/MONEY_AND_GLORY.md` §8 say so. §9.7.

**2. Selling for coin decides more than fighting does: families that take food at the counter win 1.4 in 100, those that sell for coin
14 in 100. The counter's own answer is food, and a twelve-year-old cannot know that coin held is what the ending multiplies.**

- **A. (Recommended)** Say so at the counter, in words that name no glory: *"Coin is what the family will have to show when this is
  over."*
- B. Make the counter's own answer, when nobody chooses, coin rather than food.
- C. Leave it for students to find out at the ending.

**Answered 2026-09-27: "Make coin the default" (B).** Built and measured, §9.6. (The student's own road to the store, the errand's
popup, already pressed Coin first; the counter that answered food was the one the families nobody plays stop at.)

**3. Staying in the Scrape scores better than fleeing (index 1.18 against 0.79): the road spends coin (a fleeing family held 36 reales,
a staying one 48) and the burn zone burns a farm whether the family stays or goes. Most families in 1836 fled.**

Staying does cost people: families that stayed inside the burn zone had **2,120** of their people taken prisoner at home, against
426 for families there that fled at once - and the ending does not count a prisoner at all.

- A. Leave it. Flight was costly, and the gap is modest.
- **B. (Recommended)** Let the ending's account say who was taken, and weigh it: a person taken prisoner at home takes something from
  the final number (for instance, what their part of the coin would be), so that staying is the gamble it was and not the safe
  choice the numbers now make it.
- C. Have fleeing save something staying does not - the stock, or what the wagon carried counted at the end.

**Answered 2026-09-27: "Weigh the prisoners" (B).** Built with each prisoner taking their part of the coin, and measured, §9.4.

**4. Farming harder helps a little (index 1.16 against 0.85); planting cotton made no difference (0.92 against 1.08), though the owner
chose on 2026-09-16 that cotton should be "more profitable for players".**

- A. Raise what the store pays for cotton.
- B. Leave it.
- **C. (Recommended)** Decide after question 1: if staying home is to earn more, the field is where it would, and cotton's price
  belongs to that answer.

**Answered 2026-09-27: "Raise the cotton price" (A).** Two reales a bale, §9.5. The "no difference" this question rested on was the
measure's own fault (§9.1): with cotton really planted and sold, a real a bale already made a difference.

---

## 7. Two fixes found by this measure, and what they moved

- **The neighbours' director could not take a family east when its main person was serving** (found 2026-09-27, seed `measure-5-0`:
  the flight was sent through him and refused, and the family stayed to be burned and taken). **Fixed on main the same day**
  (`sim/neighbours.mjs`: the flight goes through the first person at home, alive, not serving and not travelling; test in
  `tests/scrape.test.mjs`). **What it moved here: nothing.** The measure's families never use that path - each strategy sends the
  flight itself, through whoever is at home, as the page does - and the same 210 classes run before and after the fix were identical
  (0 of 210 differed). Every number in this document was taken on the fixed code.
  **What it moved in `scripts/balance-study.mjs`** (six classes of fifteen, fourteen families run by the director; re-run the same
  day, [evidence/balance-study.json](evidence/balance-study.json)): the stay-home family's own finals are unchanged (88, 66, 216, 118,
  136, 125) and it still never finishes first; its place rose by one in three classes (10th to 9th, 13th to 12th, 8th to 7th) as
  neighbours that had stayed to be burned now fled; one class's first family changed (964 to 592, a different family); deaths
  unchanged at 10.
- **The measure's own first runs were wrong twice, and were thrown away.** The first dealt strategies with a hash whose low bits moved
  together (every family that sold also farmed hard and planted cotton, and war was tied to selling); the second left every family as
  the founding four a family nobody plays keeps - no sex and no age - so the family die never varied and a mother could be sent to
  fight. Both are mended in the script (`independence` checks the design before a class runs; every family is rolled at the start as
  the teacher's Start rolls it). With those runs, staying home had won 0 of 210 classes; with the families rolled, 2.

---

## 8. Re-running it

```
node scripts/balance-measure.mjs                                   # the 210 classes above, ~80 minutes on 18 workers
node scripts/balance-measure.mjs --sizes 5 --classes 20 --workers 8 --out <file>   # a quick look
node scripts/balance-measure.mjs --rescore <record> --weight 0.5 --out <file>  # the same classes, another prisoner weight (exact)
```

The record carries every family's strategy, dice, coin, glory (by part, and every award with its miles), land, final number, place,
deaths, captures, burning and ground, so any other question can be asked of it without running a class.

---

## 9. The owner's four answers, built and measured again (2026-09-27/28)

The owner answered §6 on 2026-09-27, by multiple choice: **1. "Leave it"** (staying home), **2. "Make coin the default"**, **3. "Weigh
the prisoners"**, **4. "Raise the cotton price"**. All four are built; the same 210 classes (same seeds, same strategies) were run
again. **In one line: a family that sends nobody still wins no class of fifteen or thirty (and one of 100 of five); staying in the
burn zone no longer beats going, on average; a student who never chooses at the counter is paid in coin; cotton pays twice what it
did.**

### 9.1 Two faults in the first measure, found first

Building the answers meant reading where each family's coin came from, and it came from nowhere the measure said. In the first
run **no bale of cotton was ever sold for coin, and no family rolled to corn ever planted cotton.** The strategies answered the
cotton counter ("coin") and the field ("cotton") a tick late: every family is marked absent while the world steps (§2), and an
absent family's question is decided the tick it is asked, at the question's own default - food at the counter, the family's rolled
crop at the field. So in §1-§8 "sells for coin" meant *sells its spare food for coin*, and "cotton made no difference" measured
nothing: cotton was grown only by families rolled to it, and sold only for food.

Mended in `scripts/balance-measure.mjs` the same day, and re-run before any rule changed (**step 1** below):

- **cotton**: the family's own crop is made cotton at the start - what answering *Plant cotton* at the field does (the `crop` step
  in `sim/chores.mjs`) - so silence plants it whenever the seed allows;
- **selling**: a family that sells sends its cotton by the errand to town, the student's own road to the store (docs/TOWNS.md §4b),
  every whole bale on the list for coin. A family that does not sell leaves its cotton to the director's errand and **the counter's
  own answer** - which is exactly what the owner's second answer changes.

With cotton really planted and sold, **a real a bale already made cotton pay**: families that meant to plant cotton won 9.4 in 100
(index 1.22) against 5.9 (0.77) for their own crop, with 231 reales held against 143. The question the owner answered (§6 q.4) had
said "no difference"; that was this fault.

### 9.2 What was run

Four records of the same 210 classes (100 of five, 70 of fifteen, 40 of thirty; 2,750 families; every class reached its ending):

| Record | Rules | File |
| --- | --- | --- |
| **first** | as built on 2026-09-27, with the two faults | git, commit 363fb33 |
| **step 1** | faults mended; rules unchanged (food the counter's answer, a real a bale, prisoners not counted) | [evidence/balance-measure-step1-harness.json](evidence/balance-measure-step1-harness.json) |
| **step 2** | + coin the counter's own answer | [evidence/balance-measure-step2-coin.json](evidence/balance-measure-step2-coin.json) |
| **after** | + cotton two reales a bale, + the Scrape's prisoners weighed (`PRISONER_WEIGHT` 1) | [evidence/balance-measure.json](evidence/balance-measure.json) |

The prisoners' weight changes nothing anybody does - it is read at the ending - so any weight can be applied to a record exactly
(`--rescore`); steps 1 and 2 are scored with none, as their rules had none. The after run took 6,644 s on 12 worker threads (a
second run beside it for part of the time; CPU seconds by size: five 4,936, fifteen 25,848, thirty 48,670).

### 9.3 Who wins, before and after

By what the family did about the war (win % / index / top-3 % / median final / mean coin):

| War | first | step 1 | step 2 | **after** |
| --- | --- | --- | --- | --- |
| all | 15.4 / 2.00 / 36.6 / 1,007 / 32 | 14.4 / 1.87 / 36.0 / 1,444 / 145 | 16.8 / 2.18 / 39.5 / 19,955 / 213 | **16.5 / 2.14 / 38.4 / 31,500 / 407** |
| one | 9.9 / 1.31 / 30.5 / 681 / 36 | 10.5 / 1.38 / 29.7 / 898 / 181 | 8.9 / 1.18 / 29.3 / 13,240 / 247 | **9.2 / 1.22 / 29.6 / 18,541 / 473** |
| neighbour | 5.2 / 0.68 / 20.1 / 245 / 45 | 5.4 / 0.70 / 20.3 / 432 / 208 | 5.1 / 0.66 / 18.0 / 2,956 / 275 | **5.1 / 0.66 / 18.4 / 4,222 / 529** |
| none | 0.3 / 0.04 / 5.1 / 14 / 44 | 0.6 / 0.08 / 6.2 / 21 / 215 | 0.1 / 0.02 / 5.6 / 310 / 294 | **0.1 / 0.02 / 5.8 / 458 / 566** |

Fighting still decides: *all* above *none* 88 times in 100 head to head (95 before), *one* above *none* 84 (91). Every number is far
bigger than before because coin is: a class's winner now finishes, in the middle case, at 122,138 (five), 231,219 (fifteen) and
347,413 (thirty), against 10,123, 23,920 and 34,991 in the first measure. The dice and the choices now explain where a family
finishes like this (Shapley shares of its place): choices 0.32 (0.46 first; 0.53 at step 1), **the family die 0.19** (0.06; 0.07 at
step 1 - it rose with the coin default: a bigger family grows and sells more cotton whether or not anybody chooses), the means die,
the land and the fates under 0.02 each, 0.45 unexplained.

Glory still never rewards a death: no award over its part's weight, no woman sent to fight, and families whose fighting man was
killed won less (index 1.38 against 1.61; glory 112 against 158). **Deaths: 268 first, 271, 274, 274** - the coin default did not
leave the families nobody plays hungry.

### 9.4 The prisoners: staying in the burn zone against going (answer 3)

**Built** (`sim/ending.mjs`, `FIC-GONZ-710`): everybody of a family taken prisoner **at home** or **on the road east** is named in its
reckoning ("Rhoda was taken prisoner at home.") and in the Host's table, and **takes their part of the family's coin out of the
count**: the coin counted is multiplied by 1 − *weight* × prisoners ÷ the family's living people, before glory multiplies it, and
the sum on the page says so ("40 reales, less 3 of 9 parts for the 3 taken prisoner, counted as 26.67 reales × (1 + 12 glory) = 347").
The war's prisoners (San Patricio, Agua Dulce, Goliad) are not the Scrape's and are not weighed.

**The weight, measured.** Inside the burn zone, the family that stays against the one that goes at once, at five weights, on step 1
and on the after run (win index / mean place, 0 first and 1 last; lower place is better):

| Weight | step 1: stay | step 1: flee | after: stay | after: flee |
| ---: | --- | --- | --- | --- |
| 0 (as it was) | 1.00 / 0.478 | 1.01 / 0.503 | 0.92 / 0.477 | 0.78 / 0.483 |
| 0.5 | 0.92 / **0.496** | 1.01 / 0.502 | 0.78 / 0.495 | 0.81 / 0.483 |
| **1 (chosen)** | **0.86 / 0.518** | **0.96 / 0.500** | **0.70 / 0.519** | **0.78 / 0.481** |
| 1.5 | 0.59 / 0.560 | 0.96 / 0.493 | 0.50 / 0.565 | 0.81 / 0.473 |
| 2 | 0.42 / 0.645 | 0.98 / 0.478 | 0.28 / 0.656 | 0.88 / 0.459 |

**One - each prisoner takes their own part - is the smallest weight that leaves staying below going in both how often the family
finishes first and where it finishes, in both runs.** A half does it after but not at step 1, where a staying family still finished
higher on average (0.496 against 0.502). It is also the one that says itself in plain words. Staying three days and then going
(*late*) is between the two (0.81 / 0.545). Two is punitive: a staying family would win a third as often as one that went.

What it weighs: in the after run families that stayed inside the zone had **2,155** people taken at home (435 of 468 families had at
least one, 4.6 a family); families there that went at once 351 at home and 33 on the road; families outside the zone only road
prisoners (40 among those that fled). **18 families of 2,750 finished at nothing** - every living person of the family taken - and
their land alone would have counted, had they had any. Across all families *stay* now wins 7.3 in 100 (index 0.96) against *flee* 7.4
(0.99): no longer the safe choice (it was 9.0 against 6.0 in the first measure).

Outside the burn zone the Mexican army never comes, so nobody there is taken at home and staying still does a little better than
going (index 1.26 against 1.25; place 0.459 against 0.513): the road spends coin and time the farm would have used. That is the
geography of 1836, not a rule this answer was asked to change.

### 9.5 Cotton: two reales a bale (answer 4)

**Built**: the store pays **two reales a whole bale** (`STORE_BALE_COIN`, `sim/shops.mjs`; a real until 2026-09-27), and the weaver the
same coin with more food (3 food against the store's 2). Food a bale is unchanged. A neighbour nobody plays now values a bale at what
the store pays for it (`TRADE_VALUE`, `sim/neighbours.mjs`), so a bale bought from a neighbour for a food can no longer be sold on at the
store for coin.

**Why two.** Step 1 showed that, once really sold, a real a bale already made cotton the crop that pays: a plot's five bales fetch five
reales where its five food fetch one. Two is the smallest whole raise, doubles that, and keeps a plot's harvest at what a cow and calf
costs at the pens (on the game's own scale of a real to the record's dollar, `HIST-TEX-440`). **No price for a bale is in this
project's research**: `HIST-GONZ-022` says so and warns against claiming one, and `FIC-GONZ-019`, `-022` and `-047` register every
store price as invented. So the price is plausible by the game's own prices, not sourced.

**What it did** (step 2, a real a bale → after, two; the same play, since the price changes no order anybody gives):

| | step 2 | **after** |
| --- | --- | --- |
| Families meaning to plant cotton: coin held / from cotton | 324 / 312 | **636 / 625** |
| Their own crop: coin held / from cotton | 189 / 158 | **347 / 316** |
| A family that sent nobody and sold: mean coin | 434 | **822** |
| Cotton meant: win % (index) | 10.1 (1.32) | **10.2 (1.33)** |
| Own crop: win % (index) | 5.0 (0.66) | **5.0 (0.65)** |
| Grew any cotton (2,092 families): win % (index) against none (658) | 9.7 (1.28) against 1.1 (0.14) | **9.8 (1.29) against 0.8 (0.10)** |

**Measurable in the coin - every family that grows cotton holds about twice what it did - and hardly at all in who finishes first**,
because every family that grows cotton gains the same share and the final number multiplies coin. The difference cotton makes to
winning (index 1.33 against 0.65, and 1.29 against 0.10 for families that grew none) was there at a real a bale once the measure
really planted it (step 1: 1.22 against 0.77). If the owner wants cotton to change *who wins*, the price alone will not do it; what
cotton earns relative to the war's glory would.

### 9.6 Coin at the counter (answer 2)

**Built**: the cotton counter's own answer is **coin** (`cotton-counter` in `sim/chores.mjs`: offered first, and what silence, auto, a
family whose student has gone, a lapsed question and the neighbours' director all take; food only when there is no whole bale), and a
list for the errand to town that does not say how a sale is paid is paid in coin (`sim/errands.mjs`). **The student's own road to the
store - the errand's popup - already pressed Coin first** (proved now in `scripts/errand-browser-proof.mjs`); the food default was the
counter the families nobody plays stop at, and the one any student's family met the moment its student was gone. **Automatic and
neighbour families**: the director answers every question at work with the first answer open, so it follows the default - it now
takes coin for cotton. Nothing else it does changed.

What it did (step 1 → step 2), the families that never sell for coin of their own choosing:

| | step 1 | **step 2** | after (+ two reales) |
| --- | --- | --- | --- |
| *sell: no* - coin held / from cotton | 4 / 0 | **142 / 142** | 284 / 283 |
| *sell: no* - win % (index) | 0.8 (0.10) | **4.3 (0.56)** | 4.8 (0.62) |
| *sell: yes* - win % (index) | 14.6 (1.93) | **11.0 (1.45)** | 10.6 (1.39) |
| *all, sell: no* - win % (index) | 1.4 (0.18) | **10.6 (1.33)** | 11.8 (1.48) |
| *all, sell: yes* - win % (index) | 28.8 (3.88) | **23.6 (3.19)** | 21.7 (2.94) |

**Selling for coin no longer decides almost everything**: a family that fights and never chooses at the counter now wins more than
its share, where it won a fifth of it. The choices' share of where a family finishes fell from 0.53 to 0.34.

### 9.7 A family that sends nobody (answer 1: "Leave it")

| Classes | first | step 1 | step 2 | **after** |
| --- | --- | --- | --- | --- |
| five families (100): won / reached the top three | 2 / 31 | 4 / 35 | 1 / 34 | **1 / 35** |
| fifteen (70) | 0 / 0 | 0 / 4 | 0 / 0 | **0 / 0** |
| thirty (40) | 0 / 0 | 0 / 0 | 0 / 0 | **0 / 0** |

After: the one win is `measure-5-40` (a family of seventeen at 3,128, in a class whose fighting families did badly, as in the first
measure). The best family that sent nobody in each class finished, in the middle case, with 0.6 in 100 of the winner's number and
8th; the class's winner finished at about 880 times the coin such a family held (middle case); the most coin any of them held was
4,374. **No rule was changed for this**, by the owner's answer; `VISION.md` §20 and `docs/MONEY_AND_GLORY.md` §8 now say that a family
that sends nobody does not win a class of ordinary size. The cotton price and the coin default raised what such a family holds
(median 9 reales at step 1, 331 after) without changing where it finishes, because the fighting families gained the same.

### 9.8 The older study, run again

`scripts/balance-study.mjs` (six classes of fifteen, fourteen families run by the neighbours' director and one played to stay home and
sell for coin; [evidence/balance-study.json](evidence/balance-study.json)), run on the changed code on 2026-09-28: the stay-home family's
finals **174, 65, 222, 170, 202, 62** (88, 66, 216, 118, 136, 125 before), its place **9th, 14th, 9th, 10th, 12th, 12th** (9th, 12th,
4th, 12th, 7th, 7th), **no class won**; the first family fought in every class and finished at 19,943 to 80,536 (592 to 1,152
before), because the director's families now take coin for their cotton at the counter and sell it at two reales. Deaths 10, as
before. The stay-home family holds more than it did and places lower: its neighbours gained more.

---

## 10. Seasons and a limited market, built and measured (2026-09-28, not released)

The owner answered the design audit's blocker B9 (docs/audits/2026-09-28-design.md: *farming is a money pump - crops ripen in 18
ticks in any season, the store buys without limit, winners reach 122k-347k*) by multiple choice: **"Seasons and a limited market"**
- crops grow only in their real season; the store buys only what it can use and its price falls as it fills; farm choices and the
means die matter again. Both are built, and the same 210 classes (same seeds, same strategies, same harness) were run again.
**In one line: a class's winner now finishes at about 2,000 (five families), 4,800 (fifteen) and 8,200 (thirty) instead of 122,000,
231,000 and 347,000; the means die and farming harder matter; the crop chosen at the rows does not, because no corn or cotton
planted in its season comes in before the war ends; fighting and selling still decide, and selling decides more than it did.**

### 10.1 What was built

- **The farming year** (`sim/seasons.mjs`, `HIST-TEX-720`, `FIC-GONZ-721`). On the real land a crop goes in only in its window
  and ripens after its days on the class's own calendar: a **garden of turnips and greens** September 1 to April 30, 42 days, one seed
  a plot, food; **corn** February 15 to April 15, 120 days; **cotton** March 20 to May 15, 150 days. The record: the autumn of 1835
  was cotton-picking and corn-gathering time for crops planted the spring before (*Telegraph*, Oct 26; Bryan, Nov 18; Harris), a
  garden was kept "for fall and winter" (Holley, 1836), and "Every farmer was planting corn" at the end of February 1836 (Harris).
  A family that reaches raw land at the end of September can plant only a garden; a garden sown the first morning is ready about
  November 9. The invented Gonzales country keeps its eighteen-tick crop, and a crop sown in a class saved before today ripens as it
  was promised. No save version moved.
- **The limited market** (`sim/market.mjs`, `FIC-GONZ-722`). Each town's store wants 30 food and 4 bales for every family near the
  town, and its weaver 2 bales; full price to half of that, half price to all of it (a real for ten food, a real a bale), nothing when
  full; it sells on its whole want in 30 calendar days. The errand's list shows the price now and the room left; what the store would
  not take comes home and the story says why. Every family of the town - played, gone or the director's - sells into the same store.
  Coin stays the counter's own answer (owner, 2026-09-27).
- **Found by this measure and mended before the numbers below**: two of a family sent to plant at once, the later one found the seed
  gone, fell to the first answer at the rows and put cotton in in November (a class ran with it and was thrown away). A planter who
  finds no crop open now plants nothing (`tests/seasons.test.mjs`).

### 10.2 The winners' numbers

| | before (§9 "after") | **after** |
| --- | ---: | ---: |
| Class winner, middle case: five / fifteen / thirty families | 122,138 / 231,219 / 347,413 | **2,044 / 4,800 / 8,212** |
| Highest final number of any family | 1,705,300 | **38,060** |
| Coin held at the end, mean of every family (most any family held) | 485 (4,374) | **10.0 (95)** |
| Coin earned in the class, mean | 495 | **7.6** |
| Cotton brought in, mean a family | 355 | **0** |

Against the three to ten reales a family comes with, the money a family ends with is again of that order: selling for coin about
triples it (16.7 against 3.7), where it had multiplied it by a hundred.

### 10.3 Who wins, before and after

Win % / index / top-3 % / median final / mean coin; index 1 is a fair share.

| | before | **after** |
| --- | --- | --- |
| war: all | 16.5 / 2.14 / 38.4 / 31,500 / 407 | **16.5 / 2.14 / 39.0 / 701 / 8.9** |
| war: one | 9.2 / 1.22 / 29.6 / 18,541 / 473 | **9.9 / 1.31 / 30.0 / 560 / 9.6** |
| war: neighbour | 5.1 / 0.66 / 18.4 / 4,222 / 529 | **4.3 / 0.57 / 19.7 / 142 / 10.8** |
| war: none | 0.1 / 0.02 / 5.8 / 458 / 566 | **0.1 / 0.02 / 3.8 / 8 / 11.1** |
| sells for coin | 10.6 / 1.39 / - / 7,504 / 708 | **12.2 / 1.62 / - / 404 / 16.7** |
| never sells | 4.8 / 0.62 / - / 1,335 / 284 | **3.1 / 0.40 / - / 136 / 3.7** |
| farms hard (six plots) | 7.5 / 1.00 / - / 2,891 / 479 | **9.6 / 1.28 / - / 280 / 12.7** |
| farms plain | 7.8 / 1.00 / - / 2,828 / 510 | **5.7 / 0.73 / - / 148 / 7.5** |
| means cotton | 10.2 / 1.33 / - / 8,390 / 636 | **7.6 / 0.99 / - / 168 / 10.0** |
| its own crop | 5.0 / 0.65 / - / 1,199 / 347 | **7.7 / 1.01 / - / 207 / 10.2** |

Head to head, *all* finished above *none* 97 times in 100 (88 before), *one* above *none* 95 (84).

### 10.4 Do farm choices and the means die matter again?

- **Farming harder does**: six plots win at index 1.28 against 0.73 for three (1.00 against 1.00 before, when every plot's crop came
  in every few minutes and the store took all of it). The gardens are food, and food is what a family that sells has to sell.
- **The crop chosen does not**: 0.99 against 1.01. Nothing a class plants in corn's or cotton's season comes in before April 25, 1836,
  so the choice at the rows is, in the class, a choice about the summer after the war. **This is the honest result of the seasons and
  the owner's to weigh** (§10.9, question 1).
- **The means die does**, as the owner wanted it to (2026-09-25): by the coin a family came with, index **0.53 at three reales** rising
  to **1.46 at ten** (1.15 and 0.87 before - it did nothing); by band, hard up 0.49, poor 0.64, modest 1.00, comfortable 1.37, well to
  do 1.47 (1.16 ... 1.18 before). Its share of where a family finishes (Shapley, place in the class) rose from 0.002 to **0.018**; the
  family die's fell from 0.19 to **0.05** (a bigger family no longer grows and sells proportionally more cotton), the choices' rose
  from 0.32 to **0.47**, the unexplained fell from 0.45 to 0.40.

### 10.5 Does any strategy dominate?

**Fighting and selling, more than before.** Every one of the fifteen best combinations sells for coin; *all, sells* wins at index
**3.71** (2.94 before) and *one, sells* at 2.14 (1.82); a family that fights with every man and never sells wins at 0.83 (1.48). With
coin scarce, the few reales a family earns selling its spare food and garden are most of what the ending multiplies. The coin default
(owner, 2026-09-27) no longer rescues a family that never chooses at the counter, because there is almost no cotton for the counter
to pay coin for: the director's families do not sell food, and the balance measure's *sell: no* families hold only what they came
with. See §10.9, question 2.

### 10.6 Staying home, and the Scrape

- **A family that sends nobody**: one class won of 210 (`measure-5-66`, as before; `measure-5-40` no longer), none of fifteen or
  thirty, and never in the top three there. Its best in each class finished, in the middle case, at 0.7 in 100 of the winner's number
  (0.6 before), 9th. Unchanged: the owner's answer of 2026-09-27 ("Leave it") holds as it was.
- **Staying in the burn zone beats going again.** Inside the zone a family that stays wins at index 0.81 and finishes at 0.500 on
  average, against 0.70 and 0.534 for one that goes at once (0.70 / 0.519 against 0.78 / 0.481 before: the prisoner weight of 1, the
  owner's answer 3, had put staying below going). With coin scarce, what the road costs is a larger part of a family's coin than what
  its prisoners take out of it. Read again at other weights on the same families (exact, `--rescore`): at **1.5** staying wins at 0.59 /
  0.562 against going's 0.73 / 0.520 - below it again; at 2, 0.31 / 0.655. §10.9, question 3.

### 10.7 Food, deaths and class time

- **Food (the audit's S11) is not made to matter by the seasons.** Working about the place still feeds a family (`sim/routines.mjs`:
  a grown person adds a food a day and eats about a third of one), so a family with nothing in the field eats. In ten five-family
  classes run both ways, sickness deaths 5 against 3 and families ending the war with no food 6 of 50 against 5 of 50. **Deaths 301
  against 274** over the 210 classes (men 189 against 167, women and children 112 against 107): the men's are the war's, whose course
  every class re-rolls once anything changes; no hunger death was found.
- **Class time**: none. Every class ran the same 1,252 ticks. The guided start is shorter on the real land - its harvest step no
  longer waits for a crop (docs/LESSON.md, amended 2026-09-28) - and a garden sown the first morning comes in about November 9,
  about an hour into the first period at the Study pace.
- **Runtime**: 4,970 s on 18 worker threads (CPU seconds by size: five 9,075, fifteen 34,476, thirty 45,296), the machine shared. Measured on the branch at fbdba106 (before origin/main's "who acts for a family" and "neighbours remember and repay" were merged); those change who answers the road east and who helps whom, so a re-run on main will move these numbers a little.

### 10.8 The older study, run again

`scripts/balance-study.mjs` (six classes of fifteen, fourteen run by the neighbours' director and one played to stay home and sell
food for coin; [evidence/balance-study.json](evidence/balance-study.json)): the stay-home family's finals **32, 1, 33, 9, 33, 33**
(174, 65, 222, 170, 202, 62 before), its place **12th, 15th, 12th, 14th, 13th, 10th** (9th, 14th, 9th, 10th, 12th, 12th); no class won.
The first family finished at **312 to 960** (19,943 to 80,536 before) and in two of the six had fought in no battle. Deaths 9 (10).

### 10.9 Questions for the owner

1. **No corn or cotton the class plants comes in before the war ends, so the crop chosen at the rows makes no difference to the
   ending (index 0.99 against 1.01).** What should the choice mean?
   - A. Leave it: it is the history - the corn of 1836 was gathered after San Jacinto, and the Scrape left crops in the ground.
   - **B. (Recommended)** Count a crop standing in the ground at the ending at what it would fetch, so the spring's planting, the
     choice of crop and the Scrape's burning of a field all count.
   - C. Let a family pick an established neighbour's cotton in the autumn for a share (hands were short at picking time: the
     *Telegraph*, Oct 26, 1835), so cotton pays in the class.
   - D. Give the autumn a quicker crop than a six-week garden.
2. **Selling for coin decides more than it did (sells 1.62, never 0.40; *all, sells* 3.71).** The director's families never sell food,
   so the coin default reaches nobody who does not choose.
   - A. Leave it.
   - **B. (Recommended)** Let the neighbours' director and the counter's default sell food beyond a family's winter keep, as a student
     who chose would, within the store's want.
   - C. Say at the counter that coin is what the family will have to show (the audit's S12).
3. **Staying in the burn zone beats going again (0.81 / 0.500 against 0.70 / 0.534).**
   - A. Leave it.
   - **B. (Recommended)** Raise the prisoners' weight to 1.5 (read exactly above: 0.59 / 0.562 against 0.73 / 0.520).
   - C. Make the road east cost less coin.
4. **The market's numbers** (30 food and 4 bales a family, half price from half full, a month to sell on) are invented and set once,
   by one quick run. Keep them, or make the store tighter or looser?

The records: before, [balance-measure.json in git at 8db1759](evidence/balance-measure.json) (the §9 "after"); after,
[evidence/balance-measure.json](evidence/balance-measure.json).

---

## 11. Crops in real minutes, the market re-tuned, prisoners weighed more (2026-09-28, not released)

Two answers of the owner the same afternoon, by multiple choice. **"Have crops be independent of the seasons. say, 5 minutes for
cotton and 3 for corn? adjust prices to compensate"** and **"Weigh prisoners more"**. Built on the branch `crops-real-minutes` off
`integration-2026-09-28` (with the clock test's fix under it), and the same 210 classes run again. **§10's seasons are superseded;
its market stays, re-tuned.**

### 11.1 What was built

- **Crops in real minutes** (`sim/crops.mjs`, `FIC-GONZ-721`): corn ripens after three real minutes of a running class, cotton after
  five, planted in any month. The minutes are summed from the real time the server measured for each running tick, so the Host's
  speed changes the ticks and never the minutes, and a paused class grows nothing; a tick stepped in process (as here) counts at the
  Study pace, so corn is 19 ticks and cotton 32. The garden is gone (it was only the autumn's crop). The record of the farming year is
  kept, not modelled (`HIST-TEX-720`).
- **The market re-tuned** (`sim/market.mjs`, `FIC-GONZ-722`): food a real for four (five before), and the store's want of cotton three
  bales a family (four). Chosen from two quick measures of 32 classes (§11.4).
- **Prisoners weighed 1.5** (`sim/ending.mjs` `PRISONER_WEIGHT`, `FIC-GONZ-710`).

### 11.2 The numbers, before and after

"Before" is §10 (the seasons, measured on the seasons branch before `integration-2026-09-28`'s other work was merged, so not the
same tree in every other respect); "after" is this branch. Win % / index / median final / mean coin.

| | seasons (§10) | **real minutes** |
| --- | --- | --- |
| Class winner, middle case: five / fifteen / thirty | 2,044 / 4,800 / 8,212 | **4,144 / 10,052 / 15,152** |
| Highest final of any family | 38,060 | **52,182** |
| Mean coin at the end (most any family held) | 10.0 (95) | **23.6 (151)** |
| Cotton brought in, mean a family | 0 | **114** |
| war: all | 16.5 / 2.14 / 701 / 8.9 | **17.9 / 2.32 / 2,008 / 23.3** |
| war: one | 9.9 / 1.31 / 560 / 9.6 | **8.8 / 1.16 / 1,142 / 22.5** |
| war: neighbour | 4.3 / 0.57 / 142 / 10.8 | **4.2 / 0.55 / 270 / 23.9** |
| war: none | 0.1 / 0.02 / 8 / 11.1 | **0.1 / 0.02 / 24 / 24.7** |
| sells for coin | 12.2 / 1.62 / 404 / 16.7 | **6.8 / 0.90 / 396 / 26.4** |
| never sells | 3.1 / 0.40 / 136 / 3.7 | **8.4 / 1.10 / 266 / 20.9** |
| farms hard (six plots) | 9.6 / 1.28 / 280 / 12.7 | **7.8 / 1.05 / 388 / 24.4** |
| farms plain | 5.7 / 0.73 / 148 / 7.5 | **7.4 / 0.95 / 278 / 22.8** |
| means cotton | 7.6 / 0.99 / 168 / 10.0 | **10.1 / 1.31 / 616 / 29.3** |
| its own crop | 7.7 / 1.01 / 207 / 10.2 | **5.1 / 0.67 / 211 / 17.7** |

- **The crop choice matters again**: cotton index 1.31 against 0.67. By selling too: cotton and never selling 1.45 (25 reales), cotton
  and selling 1.16 (34), own crop and selling 0.64 (19), own crop and never selling 0.71 (16). The director's cotton errand takes coin
  by the counter's default; nobody who does not choose sells corn.
- **Selling does not dominate**: 0.90 against 1.10 (1.62 against 0.40 under the seasons). A family that sells its food fills the town's
  store with it; one that grows cotton is paid by the counter's default either way.
- **Farming harder matters only a little, and less the bigger the class**: 1.05 against 0.95 overall; by class size 1.11 / 0.90 at
  five families, 1.01 / 0.99 at fifteen, 0.97 / 1.03 at thirty. The store's want is per family, so in a town of many families the
  extra plots grow what the store has no room for. §11.6, question 1.
- **The means die** matters less than under the seasons (index 0.96 for three reales, 1.65 for ten; Shapley share 0.003) because
  a family now earns several times what it came with.
- **Deaths 331** (301 under the seasons, 274 before them): men 193 (189), women and children 138 (112). No hunger death was sought
  here; the men's are the war's, re-rolled whenever anything changes.

### 11.3 Prisoners at 1.5: staying in the burn zone falls below going

Inside the burn zone, the family that stays against the one that goes at once (win index / mean place, 0 first and 1 last), read
exactly on the same families at each weight (`--rescore`):

| Weight | stay | go at once |
| ---: | --- | --- |
| 0 | 1.37 / 0.451 | 0.68 / 0.523 |
| 1 (until today) | 0.84 / 0.503 | 0.76 / 0.512 |
| **1.5 (chosen)** | **0.56 / 0.555** | **0.78 / 0.499** |
| 2 | 0.33 / 0.659 | 0.81 / 0.474 |

At 1 staying was above going in both measures; at 1.5 it is below in both. Across all families *stay* wins at index 1.12 against
*flee*'s 0.86 - the families outside the zone, where nobody is taken and the road only costs, as in §9.4.

### 11.4 How the prices were chosen

Two quick measures of 32 classes (24 of five families, 8 of fifteen): with §10's numbers (food five a real, cotton four bales a
family) cotton won at index 1.42 against 0.64 and families held 27 reales; with food four a real and cotton three bales, 1.35 against
0.70 and 21 reales, the winners a fifth lower. The second was taken. Two more over 80 classes after the full run: raising the food want
from 30 to 45 changed nothing at all (no store's food want was ever reached), and raising cotton back to four bales moved farming harder
from 1.16 / 0.85 to 1.21 / 0.80 on those classes and the winners up a fifth. Not taken; §11.6, question 1.

### 11.5 The older study, before and after

`scripts/balance-study.mjs` (six classes of fifteen, fourteen run by the neighbours' director and one played to stay home and sell):

| | before (the seasons, on `integration-2026-09-28`) | **after** |
| --- | --- | --- |
| The class's first family | 1,152 / 164 / 199 / 384 / 309 / 772 | **6,200 / 8,364 / 9,548 / 3,584 / 5,459 / 9,922** |
| The stay-home family's final | 12 / 1 / 9 / 1 / 6 / 12 | **16 / 7 / 69 / 24 / 72 / 20** |
| Its place | 12 / 15 / 14 / 14 / 13 / 10 | **13 / 13 / 7 / 14 / 12 / 11** |
| Deaths | 9 | 9 |

### 11.6 Questions for the owner

1. **Farming harder barely matters in a class of fifteen or thirty (1.01 and 0.97), because the store's room is shared by the town.**
   - A. Leave it: the market is what keeps the farm from being a pump again.
   - **B. (Recommended)** Count the crop a family holds at the end - cotton in the house, food beyond the winter - at what the store
     would pay, so a bigger farm counts even where the store is full.
   - C. Give the store more room for cotton (four bales a family): a little more for the hard farmer, and winners a fifth higher.
2. **Cotton is the better crop (1.31 against 0.67)**, because nobody who leaves the counter alone is paid for corn.
   - A. Leave it: cotton is the colony's money crop.
   - **B. (Recommended)** Let the neighbours' director and the counter's default sell corn beyond a family's winter keep too, within
     the store's want, so corn families that do not choose are paid as cotton families are.
   - C. Lower cotton to a real and a half a bale.
3. **The crops' minutes** are counted from the class's real time. At the Quick pace (a second a tick) corn takes 180 ticks - most of a
   week of the calendar - and at the Study pace 19.
   - **A. (Recommended)** Keep real minutes, as asked.
   - B. Count them at the Study pace whatever the class's speed (a fixed 19 and 32 ticks).

The record: [evidence/balance-measure.json](evidence/balance-measure.json) (this run); §10's is in git on the seasons branch (3bcf1556).

---

## 12. No limit until the Scrape, spare corn sold, corn four minutes and cotton six (2026-09-28, not released)

The owner's answers to §11.6, the same afternoon: **"no limit on selling until the runaway scrape. after that, limit it to 4 per
family"**; **"Sell spare corn too"**; **"i want 4 minutes for corn and 6 minutes for cotton in real life"** (with: "time speeds up and
slows down too at times. it'll have to adjust for that"). Built on the branch `scrape-market` off `integration-2026-09-28` (db6d908a);
the same 210 classes run again.

### 12.1 What was built

- **Unlimited until the Runaway Scrape** (`sim/market.mjs` `limited`): until the third class period opens (dawn, March 14, 1836, when
  the families of Gonzales are told to leave) every store and weaver buys all it is brought at its full price, and nothing is held
  against it. From then on the store wants **4 bales of cotton a family** (the owner's number) and **32 food** (my reading of "4 per
  family" for food: what four bales fetch at full price, eight reales at four food a real - §12.5, question 1), the weaver 2 bales,
  with §10's curve: full price to half, half price to full, nothing when full, a month to sell on.
- **Spare corn sold** (`sim/neighbours.mjs`, `sim/market.mjs` `spareFood`): the neighbours' director - which also runs a family whose
  student has gone - sends food beyond three weeks of the family's eating to the store, as it sends cotton; the food errand never sells
  into those three weeks. Coin is the counter's answer, as for cotton.
- **Corn four real minutes, cotton six** (`sim/crops.mjs`). How it is measured: each time the class moves on a tick the server notes how
  long the tick really took on its clock and adds it to the crop; four or six minutes of it and the crop is ripe. A speed change half
  way through a crop, a pause (no ticks, and the first tick after one adds nothing) and a stall (capped at three ticks' worth) are all
  counted as they really were. Stepped in process, as here, a tick is the Study pace: corn 26 ticks, cotton 38.
- **The auto proof** (`scripts/auto-browser-proof.mjs`) had waited three real minutes for a season on the invented country, which ends
  at the fight after some 365 ticks - under a minute at its 150 ms tick - so a crop of real minutes never came in before the class
  ended. Its server clock now runs forty times fast (a tick counts as six real seconds), with the reason in a comment.

### 12.2 The numbers, before and after

"Before" is §11 (the branch merged into `integration-2026-09-28`); "after" is this branch. Win index (1 a fair share) / mean coin /
median final.

| | before (§11) | **after** |
| --- | --- | --- |
| Class winner, middle case: five / fifteen / thirty | 4,144 / 10,052 / 15,152 | **51,073 / 79,595 / 122,598** |
| Highest final of any family | 52,182 | **295,696** |
| Mean coin at the end (most any family held) | 23.6 (151) | **178.1 (685)** |
| **Farms hard, fifteen and thirty families** | 1.00 / 25.5 / 371 | **1.16 / 185.3 / 1,060** |
| Farms plain, fifteen and thirty families | 1.00 / 23.5 / 277 | **0.84 / 161.9 / 789** |
| farms hard / plain, fifteen families | 1.01 / 0.99 | **1.22 / 0.79** |
| farms hard / plain, thirty families | 0.97 / 1.03 | **1.06 / 0.93** |
| **Cotton** (meant) | 1.31 / 29.3 / 616 | **1.34 / 234.2 / 6,566** |
| **Its own crop** | 0.67 / 17.7 / 211 | **0.64 / 119.9 / 502** |
| its own crop, rolled to corn | 0.08 / 4.3 / 132 | **0.02 / 5.3 / 137** |
| its own crop, rolled to cotton | 1.26 / 30.3 / 708 | **1.26 / 228.6 / 7,569** |
| sells for coin / never | 0.90 / 1.10 | **0.93 / 1.07** |
| war: all / one / neighbour / none | 2.32 / 1.16 / 0.55 / 0.02 | **2.57 / 1.03 / 0.42 / 0.04** |
| means die: came with 3 / 10 reales | 0.96 / 1.65 | **1.03 / 0.97** |
| Burn zone: stay / go at once (index, mean place) | 0.56, 0.555 / 0.78, 0.499 | **0.39, 0.580 / 1.08, 0.466** |
| Classes won by a family that sent nobody | 1 (`measure-5-66`) | **2** (`measure-5-40`, `-66`) |
| Deaths | 331 | 317 |

- **Farming harder now matters at fifteen and thirty families** (1.16 against 0.84, from 1.00 against 1.00), because nothing fills
  until the Scrape.
- **Cotton beats corn more than ever in coin, not in index** (1.34 against 0.64): a corn family earns almost nothing. The spare-corn
  rule rarely fires - corn at four minutes brings five food a plot, and a family eats most of what it grows, so few ever hold three
  weeks' eating and more; families rolled to corn end with 5.3 reales against a cotton family's 229. §12.5, question 2.
- **The winners are back in the tens of thousands** (51,073 / 79,595 / 122,598), a third of what they were before §10 (122,138 /
  231,219 / 347,413): the pre-Scrape market is the one the owner asked for, open, and cotton is sold in full every six minutes.
- **The means die does nothing again** (1.03 against 0.97; its Shapley share 0.001): a family earns a hundred times what it came with.
- **Staying in the burn zone is well below going** (0.39 against 1.08): the prisoners' weight of 1.5 now weighs larger purses.

### 12.3 The older study, before and after

`scripts/balance-study.mjs` (six classes of fifteen, fourteen run by the neighbours' director, one played to stay home and sell):

| | before (§11) | **after** |
| --- | --- | --- |
| The class's first family | 6,200 / 8,364 / 9,548 / 3,584 / 5,459 / 9,922 | **50,880 / 24,086 / 32,407 / 31,060 / 25,201 / 33,712** |
| The stay-home family's final | 16 / 7 / 69 / 24 / 72 / 20 | **14 / 3 / 633 / 195 / 510 / 16** |
| Its place | 13 / 13 / 7 / 14 / 12 / 11 | **14 / 15 / 6 / 10 / 8 / 12** |
| Deaths | 9 | 9 |

Every first family fought. The stay-home family did best when it had spare food to sell (24 to 29 loads in three classes).

### 12.4 Class time

None: every class ran its 1,252 ticks. A crop takes four or six real minutes whatever the pace; at the Study pace that is 26 and 38
ticks, at the Quick pace 240 and 360.

### 12.5 Questions for the owner

1. **"4 per family" for food.** I read it as 32 food a family - what four bales fetch at full price.
   - **A. (Recommended)** Keep 32 food.
   - B. Four lots of food a family (16 food, four reales).
   - C. No limit on food at all, even after the Scrape; only cotton is limited.
2. **Corn does not pay** (families rolled to corn win at 0.02 and hold 5 reales; cotton families 229): corn at five food a plot every four
   minutes is eaten, and little is ever spare.
   - A. Leave it: corn feeds the family, cotton pays.
   - **B. (Recommended)** Raise corn's harvest (ten food a plot), so a corn family has spare corn to sell.
   - C. Let spare corn be what is beyond one week's eating, not three.
3. **The winners are in the tens of thousands again** (51,073 / 79,595 / 122,598), with the market open until March.
   - **A. (Recommended)** Leave it: it is the market the owner chose; the ending still ranks the families.
   - B. Keep the no-limit rule and halve cotton to a real a bale.
   - C. Limit from the winter (the second period), not the Scrape.

---

## 13. Slower in the winter, and corn ten food a plot (2026-09-28, not released)

The owner's answers to §12.5: **"32 food"** (as built), **"10 food a plot"** for corn, and, for the big winners, **"increase the time
until harvest during the winter. that way it feels more fluid."** Built on `scrape-market` after merging `integration-2026-09-28`
(4f529cbb); the same 210 classes run again on the merged tree before the change and after it (the merge alone moved no number: its
record is identical to §12's).

### 13.1 What was built

- **Half pace in the winter** (`sim/crops.mjs` `WINTER_SLOWER` 2, `WINTER_MONTHS` December to February, a `ceiling:`). The winter is the
  months of the class's own calendar, not a class period: December 1-15 of the first period and January 25 to the end of February of
  the second, on the real land; the invented country's September afternoon never reaches it. In the winter a tick adds half its real
  time to the crop, so corn takes eight real minutes and cotton twelve. What is stored is the crop's progress at full pace, so a crop
  that stands across the change blends: every tick grows it at the pace of the month that tick falls in. The words say so: the harvest
  counts the minutes left at the pace of now, and the question at the rows says "ripe in 8 minutes, slower in the winter".
- **Corn ten food a plot** (`sim/improvements.mjs` `CORN_YIELD_PER_PLOT`), cotton five bales.

### 13.2 The numbers, before and after

| | before (§12) | **after** |
| --- | --- | --- |
| Class winner, middle case: five / fifteen / thirty | 51,073 / 79,595 / 122,598 | **40,781 / 68,094 / 113,800** |
| Highest final of any family | 295,696 | **264,041** |
| Mean coin at the end (most any family held) | 178.1 (685) | **160.2 (606)** |
| Farms hard / plain, fifteen and thirty families | 1.16 / 0.84 | **1.14 / 0.86** |
| farms hard / plain, fifteen | 1.22 / 0.79 | 1.22 / 0.79 |
| farms hard / plain, thirty | 1.06 / 0.93 | 1.02 / 0.98 |
| Cotton meant / its own crop | 1.34 / 0.64 | **1.32 / 0.66** |
| its own crop, rolled to corn: index / coin / median final | 0.02 / 5.3 / 137 | **0.04 / 15.2 / 211** |
| sells / never | 0.93 / 1.07 | 0.96 / 1.04 |
| war: all / one / neighbour / none | 2.57 / 1.03 / 0.42 / 0.04 | 2.67 / 1.01 / 0.36 / 0.02 |
| means die: 3 / 10 reales | 1.03 / 0.97 | 0.88 / 1.07 |
| Burn zone: stay / go at once | 0.39 / 1.08 | 0.42 / 1.11 |
| Classes won by a family that sent nobody | 2 | 1 (`measure-5-66`) |
| Deaths | 317 | 319 |

- **The winter takes a fifth off the winners** (a fifth at five families, a seventh at fifteen, a thirteenth at thirty): the second
  period's crops, January 25 to the end of February, grow at half pace. The first period's winter is only its last fortnight, and the
  third period is all spring.
- **Corn pays three times what it did and still little** (15 reales against cotton's 204): ten food a plot every four minutes is more
  than a family eats, but spare corn fetches a real for four at a store, where a plot of cotton fetches ten reales.
- **Farming harder still matters at fifteen families** (1.22 against 0.79) and hardly at thirty (1.02 against 0.98).

### 13.3 The older study, before and after

| | before (§12) | **after** |
| --- | --- | --- |
| The class's first family | 50,880 / 24,086 / 32,407 / 31,060 / 25,201 / 33,712 | **46,656 / 31,652 / 31,309 / 23,668 / 23,821 / 33,346** |
| The stay-home family's final | 14 / 3 / 633 / 195 / 510 / 16 | **29 / 33 / 564 / 184 / 418 / 50** |
| Its place | 14 / 15 / 6 / 10 / 8 / 12 | **15 / 15 / 12 / 13 / 12 / 14** |
| Deaths | 9 | 10 |

### 13.4 Questions for the owner

1. **The winter moved the winners by a fifth at most**, because most of the class is not winter.
   - A. Leave it at half pace.
   - **B. (Recommended)** A third of the pace in the winter (corn twelve minutes, cotton eighteen).
   - C. Count the whole second period as winter (to March 13), not just December to February.
2. **Corn is still far behind cotton** (families rolled to corn: index 0.04, 15 reales; cotton: 1.28, 204).
   - A. Leave it: corn feeds, cotton pays.
   - **B. (Recommended)** A real for three food at the store (four now), so a corn farm's spare pays nearer a cotton farm's.
   - C. Corn fifteen food a plot.

---

## 14. A third of the pace in the winter, and a real for three food (2026-09-28, not released)

The owner's answers to §13.4: **"A third in winter"** and **"1 real for 3 food"**. Built on `winter-third` off `integration-2026-09-28`
(0ee43284); the same 210 classes run on that tree before the change and after it.

### 14.1 What was built

- **Winter at a third of the pace** (`sim/crops.mjs` `WINTER_SLOWER` 3, a `ceiling:`): in December to February of the class's calendar a
  tick adds a third of its real time to the crop, so corn takes twelve real minutes and cotton eighteen; a crop across the change still
  blends, each tick at the pace of its month.
- **A real for three food** at the store (`sim/market.mjs`, `sim/shops.mjs`, `COIN.foodPerReal`), a real for six from half full after the
  Scrape. The lot a student puts on the errand's list is three food.
- **The post-Scrape food limit no longer matches its analogy.** 32 food was read as what four bales fetch at full price, eight reales,
  at four food a real; at three food a real, eight reales are **24 food**, and 32 food is 10.7 reales at full price. The owner answered
  "32 food" before the price changed, so it is kept, and the question is put again (§14.4).

### 14.2 The numbers, before and after

| | before (§13) | **after** |
| --- | --- | --- |
| Class winner, middle case: five / fifteen / thirty | 40,781 / 68,094 / 113,800 | **39,760 / 63,408 / 105,185** |
| Highest final of any family | 264,041 | **254,546** |
| Mean coin at the end (most any family held) | 160.2 (606) | **149.6 (509)** |
| Farms hard / plain, fifteen and thirty families | 1.14 / 0.86 | **1.14 / 0.86** |
| Cotton meant / its own crop | 1.32 / 0.66 | **1.32 / 0.66** |
| its own crop, rolled to corn: index / coin / median final | 0.04 / 15.2 / 211 | **0.04 / 17.9 / 204** |
| its own crop, rolled to cotton: coin | 203.5 | 188.5 |
| sells / never | 0.96 / 1.04 | 0.93 / 1.07 |
| war: all / one / neighbour / none | 2.67 / 1.01 / 0.36 / 0.02 | 2.57 / 1.05 / 0.42 / 0.02 |
| Burn zone: stay / go at once | 0.42 / 1.11 | 0.36 / 1.18 |
| Classes won by a family that sent nobody | 1 | 1 (`measure-5-66`) |
| Deaths | 319 | 334 |

- **A third in the winter moves the winners a little further**: 3 in 100 at five families, 7 at fifteen, 8 at thirty - about a
  fifth to a quarter below where they were before the winter slowed crops at all (51,073 / 79,595 / 122,598, §12).
- **Corn pays a sixth more (18 reales against 15) and still a tenth of cotton**: a corn family's spare is little, however it is priced,
  because a family keeps three weeks of its eating before it sells.

### 14.3 The older study, before and after

| | before (§13) | **after** |
| --- | --- | --- |
| The class's first family | 46,656 / 31,652 / 31,309 / 23,668 / 23,821 / 33,346 | **38,784 / 27,388 / 28,031 / 22,612 / 20,601 / 31,882** |
| The stay-home family's final | 29 / 33 / 564 / 184 / 418 / 50 | **35 / 51 / 534 / 168 / 380 / 73** |
| Its place | 15 / 15 / 12 / 13 / 12 / 14 | **15 / 15 / 12 / 13 / 12 / 13** |
| Deaths | 10 | 11 |

### 14.4 Questions for the owner

1. **The food limit after the Scrape**: 32 food was four bales' worth at four food a real; at three it is 24.
   - A. Keep 32 food (a little more room for food than for cotton).
   - **B. (Recommended)** 24 food, so food and cotton stay the same eight reales' worth.
2. **Corn still earns a tenth of cotton**, because a family sells only what it holds beyond three weeks of its eating.
   - A. Leave it: corn feeds, cotton pays.
   - **B. (Recommended)** Spare corn beyond one week's eating, not three.
   - C. Corn fifteen food a plot.

**Answered 2026-09-29**: question 1 *"Lower to 24 food"* - built: the store wants 24 food a family after the Scrape (`sim/market.mjs`),
four bales' eight reales at three food a real, and food and cotton are the same coin's worth again. Question 2 *"Leave it"*: spare
corn stays what is beyond three weeks of eating. The 210 classes were not run again for this: nothing is limited before the third
period, and a town's food want after it moves from 32 to 24 food a family; `tests/market.test.mjs` holds the curve (120 food in a
town of five, 30 reales), proved by injection.

## 15. Every family work at half its length (2026-09-29, not released)

The owner, 2026-09-29: *"Tasks are taking far too long. Cutting down trees, fishing, building a house, all of those types of tasks
are taking too long. Reduce the variables need to complete these tasks by 50%"*. Built on `work-halved` off origin/main (af25547a):
`sim/work-pace.mjs` `WORK_PACE = 0.5`, applied to every tick of a family's own work (felling, the house, clearing, fencing, the
lane, the well, surveying, planting, the harvest, the hunt, the gathering works, the stock, furniture, the carreta, the hoe), and not
to a counter in town, the war's, the road's, the camp's, nursing or a child's work (docs/WOODS_AND_BUILDING.md §6.8,
`FIC-GONZ-908`). The crops' real minutes, the market, the roads and the war's timings are unchanged.

### 15.1 A quick look, not the 210

The same 30 classes (10 each of five, fifteen and thirty families; `--sizes 5,15,30 --classes 10,10,10`), run on this tree with the
old pace put back (`WORK_PACE = 1`) and with the new one. **Not re-recorded**: [evidence/balance-measure.json](evidence/balance-measure.json)
is still §14's 210 classes; ten classes a size is a look at the direction, and the winners' medians of ten move a good deal by chance.

| | old pace | **half the work** |
| --- | --- | --- |
| Class winner, median: five / fifteen / thirty | 19,456 / 54,216 / 107,548 | **30,912 / 75,607 / 132,618** |
| Median final of every family: five / fifteen / thirty | 1,212 / 956 / 1,600 | **1,536 / 1,879 / 2,208** |
| Mean coin at the end: five / fifteen / thirty | 141.8 / 151.6 / 148.5 | **163.3 / 182.3 / 176.6** |
| Plots cleared, mean a family: five / fifteen / thirty | 1.50 / 1.95 / 2.07 | **1.70 / 2.11 / 2.26** |
| Deaths (500 families) | 55 | 57 |
| Share of the spread within a class explained by the family's choices | 0.377 | 0.397 |

- **More gets done, and it is worth more at the end**: a family clears about a tenth more ground, sells more, and ends with about a
  sixth more coin; the winners are up by about a quarter to a half. The war is the same war (deaths 55 and 57).
- **Choices count a little more** (0.38 → 0.40 of the spread within a class), the family's die a little less (0.10 → 0.07): the
  time a work takes was part of what the die decided.
- `server/class-days.mjs`: **not moved by this.** A period ends on its calendar moments, and work never holds the calendar (a work's
  question holds only its person, `sim/clock.mjs` `deciding`); a class's ticks are the war's. Its high end was already flagged as
  pessimistic by the real-time limits (HANDOFF.md).

### 15.2 Re-running it

```
node scripts/balance-measure.mjs --sizes 5,15,30 --classes 10,10,10 --workers 10 --out <file>   # this look, about 30 minutes
```
The old pace is `WORK_PACE = 1` in `sim/work-pace.mjs`, nothing else.

## 16. Working about the place yields 0.3 food a day, and the army's request for supplies (2026-09-29, not released)

The owner, 2026-09-29, by multiple choice on the triage's D7: **"0.3 a day"** - *working about the place yields 0.3 food a day, so
the field, the hunt and the herd feed the family* (`sim/routines.mjs` `WORK_FOOD_A_DAY`, `FIC-GONZ-964`; it was one). Built on
`owner-rules` beside the same day's other answers (C4, D5, D6, D11, D12). `scripts/balance-measure.mjs` now records each family's
food by period - the least it held, the days it had none, what it ended with - and what it sent the army (D5).

### 16.1 The measure: the same 30 classes, the old yield and the new

Ten classes each of five, fifteen and thirty families (`--sizes 5,15,30 --classes 10,10,10`), run on this tree twice: once with
`WORK_FOOD_A_DAY = 1` put back (a copy of `sim/`, nothing else changed) and once as built. **Not re-recorded**:
[evidence/balance-measure.json](evidence/balance-measure.json) is still §14's 210 classes; the two looks are summed in
[evidence/owner-rules-balance.json](evidence/owner-rules-balance.json).

| | one a day | **0.3 a day** |
| --- | --- | --- |
| Class winner, median: five / fifteen / thirty | 24,859 / 55,609 / 114,735 | **19,764 / 57,444 / 109,070** |
| Median final of every family: five / fifteen / thirty | 1,669 / 3,041 / 2,933 | **1,637 / 2,921 / 2,994** |
| Mean coin at the end: five / fifteen / thirty | 174.7 / 188.1 / 182.6 | **173.4 / 186.8 / 181.9** |
| Food at the end of period 1, mean: five / fifteen / thirty | 23.4 / 20.6 / 22.3 | **22.8 / 21.2 / 22.6** |
| Families with a day of no food in period 1 (of 50 / 150 / 300) | 7 / 37 / 60 | **7 / 34 / 64** |
| … and in period 3, the road east | 23 / 66 / 158 | **21 / 65 / 154** |
| Deaths (500 families) | 60 | 63 |

- **For a family the director runs, almost nothing moves**, and that is the finding: the director keeps every hand on a chore - the
  field, the hunt, the house, a forage when short (sim/neighbours.mjs) - and somebody on a chore is paid by the chore, not by working
  about the place (`FIC-GONZ-313`). So the measure's families were already fed by the field, the hunt and the herd; coin and the
  finals move within the noise of ten classes a size.

### 16.2 Flagged: a family whose student gives no orders runs out of food in period 1

The families above are all played by a policy. A family whose student sets nobody to anything keeps its grown people on what they
were founded to - **working about the place** - and its children resting; that is where the yield bites. Measured on its own
(fifteen such families in a class on the real land, period 1 to December 15, two seeds; the probe is
`scripts/idle-food-probe.mjs idle-a`, and `idle-b`; recorded in the evidence file):

| | one a day | **0.3 a day** |
| --- | --- | --- |
| Families with no food at some point in period 1 (seed a / seed b) | 1 / 5 of 15 | **13 / 15 of 15** |
| The day of the class the first of them ran out (median) | day 53 (a), 39 (b) | **day 16 (a), 14 (b)** |
| Food held on December 15, mean | 29.0 / 26.8 | **0.1 / 0** |

**So a student who never plants, hunts or forages - who leaves the family "working about the place" - is out of food by the middle
of October, and for most of period 1.** What that does at home is little: nobody dies of hunger at home, a hungry family's sick are
weighed twice (`homeContext`), and the ending counts no food. The owner's option says the field, the hunt and the herd should feed
the family; this is what happens when none of them is used. Questions for the owner, in HANDOFF.md.

### 16.3 The army's request for supplies (D5)

In the same 30 classes (as built): of 746 asks put to the measure's families (all answered at the director's share - every
measured family is absent during a tick, so the director gives for it half the time), **156 sent food, 80 powder, none the horse**
(the director never sends one), 510 kept. `supplied` from the siege averaged **about 6 glory a family** (the support weight times
the miles from Béxar, 5 to 17 - flat, one a gift, since 2026-09-30 (owner, *"Flat"*), which would have made it 2 at most a family). A family that sent nobody won one class of five, as before; no class of
fifteen or thirty was won by one.

### 16.4 Re-running it

```
node scripts/balance-measure.mjs --sizes 5,15,30 --classes 10,10,10 --workers 6 --out <file>   # about 40 minutes beside other work
```
The old yield is `WORK_FOOD_A_DAY = 1` in `sim/routines.mjs`, nothing else.
## 17. The farm at the end: sold, or glory for a burned one (2026-09-29, not released)

The owner, 2026-09-29, answering the triage's D8: *"if their house and farm wasn't burned and is intact then make selling it part of
the end of the game cutscene. if there farm was burned then there's nothing to sell, but they get glory to compensate."* Built on
branch `end-sequence` (`sim/farm-sale.mjs`, docs/MONEY_AND_GLORY.md §5a). The question the measure answers: **how much glory for a
burned farm moves a family's final number about as much as the sale of a typical intact farm does.**

28 classes (16 of five families, 8 of fifteen, 4 of thirty; 320 families; `node scripts/balance-measure.mjs --sizes 5,15,30
--classes 16,8,4 --workers 10`), the families playing the measure's strategies as in §9; each family's final number worked again with
and without the farm (`node scripts/farm-sale-measure.mjs docs/evidence/farm-sale-measure.json`; [record](evidence/farm-sale-measure.json)).

| | |
| --- | --- |
| Families burned / intact / nobody left | 170 / 149 / 1 |
| An intact farm sold for: labor (no stock) / league and labor | 39-90, median 70 / 146-231, median 226 reales |
| The median intact family's final number, moved by the sale | **+3,164** (×1.70) |
| Glory for a burned farm that moves the median burned family's by as much | **40** (+3,160 by the average of the two middle families; 41 by the lower one) |
| The same, matched by the median *relative* gain instead | 48 |
| Classes won: before (no sale, no glory) / after, at 0, 20, 40, 60 or 80 glory | burned 14, intact 14 / burned 13, intact 15 (every one) |

- **40 glory**, the absolute match, is built (`BURNED_FARM_GLORY`). It is a family's worth of the middle of the table, not of its top:
  the winners' glory runs to hundreds, so neither the sale nor the compensation decides who finishes first in these classes - one
  class of 28 moved from a burned family to an intact one, and would at any compensation from 0 to 80.
- **Stock families sell for more.** A league of grazing land is 26 times a labor's acres at half the price, so a family that drove
  stock in and kept its farm sells for about three times a farm without (226 against 70). That is the land it held; it is also a
  second reason the lobby's stock choice matters at the end. Put to the owner.
- Not measured here: the 210-class record of §14 was not run again; these classes play at §15's half-work pace.

## 18. Each plot its own crop: a corn plot kept, against all cotton (2026-09-30, not released)

The owner, 2026-09-30: *"players can still plow new and extra fields right? so i as a player could have corn growing for food as
well as cotton to sell?"* Built on `per-plot-crops` (docs/LAND_GRANTS.md §5.2, `FIC-GONZ-1000`): every cleared plot its own crop, and
the families the director runs keep their nearest bare plot in corn when none of their field is in corn and they have two plots or
more, or are short of food. The question: **what a mixed field costs a cotton family, and what it buys it in food**, with the new
starvation rules another builder is adding in mind.

A quick look, not the 210: 14 classes (8 of five families, 4 of fifteen, 2 of thirty; 160 families; `--sizes 5,15,30 --classes
8,4,2`), run twice on this tree - as built, and with `MEASURE_CROPS=own`, where the measure plants every plot its own crop, so a
cotton family's field is all cotton (the harness only, `scripts/balance-measure.mjs`; nothing in the game reads it). The comparison is
the 84 families the measure deals the cotton strategy; the rest are below. Summed in [evidence/per-plot-crops-balance.json](evidence/per-plot-crops-balance.json).

| Cotton families (84 of 160) | **a corn plot kept (as built)** | all cotton |
| --- | --- | --- |
| Final number, median | **8,850** | 11,069 |
| Coin at the end, mean | **210.6** | 278.7 |
| Cotton grown, mean bales | **136.7** | 193.2 |
| Families with a day of no food: period 1 / 2 / 3 | **17 / 13 / 40** | 29 / 22 / 47 |
| Days with no food, mean: period 1 / 2 / 3 | **2.08 / 0.51 / 3.16** | 2.15 / 1.22 / 3.92 |
| Food held at each period's end, mean | **19.6 / 19.1 / 17.8** | 18.7 / 14.9 / 16.0 |
| Deaths | 8 | 8 |
| Classes won by a cotton family (of 14) | 9 | 11 |

- **All cotton pays about a third more coin** (279 against 211 reales) and a quarter more at the end (median 11,069 against 8,850):
  a plot of cotton is five bales at two reales, a plot of corn ten food at three a real, and the corn is mostly eaten.
- **A corn plot is the food**: through the autumn and the winter (periods 1 and 2) 17 and 13 of 84 cotton families went a day
  without food with a plot in corn, 29 and 22 without; the winter's days without food half (0.51 against 1.22 a family), and they come
  out of each period with more in the house. On the road east (period 3) the field is left behind and the gap narrows (40 against 47).
- **Today nobody dies of it** (8 deaths both ways; hunger at home kills nobody, §16.2). With starvation that does, the mixed field is
  the safer farm and all cotton the richer one: the choice the owner's question describes. The director keeps a plot in corn; a
  student chooses. Put to the owner in HANDOFF.md.
- **Not comparable**: the measure's families on their own crop that were rolled to cotton (37). Under `MEASURE_CROPS=own` the
  director still fetches seed for its own plan - a corn plot when short of food - and the harness plants cotton, so a one-plot family
  with two seed can neither plant nor fetch (coin 15.5 against 121.2 as built). A harness artefact, not a rule; the families rolled
  to corn are the same both ways (coin 27.7).
- As built, the class winners' medians (five / fifteen / thirty) were 33,775 / 92,894 / 229,446 over these 14 classes; too few to set
  beside §14's 210.

### 18.1 Re-running it

```
node scripts/balance-measure.mjs --sizes 5,15,30 --classes 8,4,2 --workers 6 --out <file>                     # as built, about 16 minutes
MEASURE_CROPS=own node scripts/balance-measure.mjs --sizes 5,15,30 --classes 8,4,2 --workers 6 --out <file>   # all cotton
```
## 19. A family can starve (2026-09-30, owner-decided; not released)

The owner, 2026-09-30: *"player characters *can* die of starvation. players should have to ensure there's enough food."* This
**amends §16.2's answer ("Leave it")**: running out of food at home now costs lives. The rules, the timings and the measure are
[HUNGER.md](HUNGER.md); `sim/hunger.mjs`.

- **The measure here does not move.** `scripts/balance-measure.mjs` runs families the director runs, and a family nobody plays
  never starves (HUNGER.md §6), so §14's 210 classes and §16's thirty are what they were; they were not run again.
- **What moves is a played family's**, measured by `scripts/hunger-balance.mjs` (four classes of fifteen each way, all three
  periods, [evidence/hunger-balance.json](evidence/hunger-balance.json)): a student who gives no orders loses **every one** of the
  family by the end of the first period (161.8 deaths a class of 161.8 people; the first about day 18-23); a student who farms,
  hunts and forages as the director does loses **nobody at home** and **3.3 a class on the road east** (small children, one family
  in fifteen, in three classes of four).

- **The owner's answers, 2026-09-30:** the idle family's losses and the road east's, "Keep it" both; a family overtaken by a
  column is left three days' food (HUNGER.md §8a). The measure above was not run again for it: it counts only the family the
  column overtakes, for the days before it forages.

## 20. Food only from real sources, one haul a day, seed at the harvest (2026-10-02, owner-decided; not released)

The owner, playing v2026.10.02.1: *"I was playing and generated hundreds of food just by having some adults working around the house
on auto. I'm thinking that we need to limit food generation to crops, fishing, hunting, etc."* - and seed from the crop. **This
supersedes §16's "0.3 a day"**: working about the place makes no food (`FIC-GONZ-1072`). The bug was the gathering works on auto in
the class's first phases, paid by the spell while the calendar ran at twenty minutes and an hour a tick (docs/HUNGER.md §10): two
people fishing on auto made 1,261 food in 80 days. Now each gathering work pays a person once a calendar day, and a trip spanning days
pays a haul a day (`FIC-GONZ-1070`); each plot brought in keeps its seed (`FIC-GONZ-1071`).

Measured with `scripts/hunger-balance.mjs` (six classes of fifteen, all three periods; docs/HUNGER.md §10 has the whole table,
[evidence/food-sources-balance.json](evidence/food-sources-balance.json)):

| Per class | before | now |
| --- | --- | --- |
| A student who plays sensibly (the director's policy): deaths by hunger | 1.7, all on the road east | **1.2, all on the road east; none at home** |
| … lone parents / big families / a man at the war, families hit | 1 of 6 / 1 of 31 / 1 of 34 | **1 of 11 / 3 of 63 / 3 of 68** |
| … median food at the end of periods 1 and 2 | 38.8, 43.4 | **47.0, 59.9** (the seed kept: no seed bought) |
| A student who gives no orders: deaths | everybody, first on day 18 | **everybody, first on day 11** (59-61 real minutes at Study) |
| A student who sends one person to gather on auto and nothing else: deaths | 38.2 (the bug fed them 134 food by December) | **116: 3 at home, 113 on the road east** |

The families the director runs are unchanged in kind: its hands are on chores, paid by the chore, so §14's 210-class record does not
move with the 0.3 gone and was not run again. Starting food and the handover's three days are left as they are.

## 21. The herder and the herd that pays (2026-10-03, owner-decided; not released)

The owner, 2026-10-03: the herd *"should be a path to making food and wealth too"*, and the herder should have *"appropriate skills"*
([STOCK.md](STOCK.md) §10). The question for balance: **does a herd now make food too easy, or decide who wins?**

**Food** (`node scripts/hunger-balance.mjs --seeds hunger-1,hunger-2,hunger-3,hunger-4`, four classes of fifteen, all three periods;
*before* = integration 9d34d767 with the same harness, [evidence/herds-balance-before.json](evidence/herds-balance-before.json);
*now* = this branch, [evidence/herds-balance.json](evidence/herds-balance.json)). Two new kinds of student in the harness:
*ranching* plays as *playing* does and also puts the best hand with stock of twelve or more (not the head of the family) on auto at
*Ride the range after the stock*, and would sell cattle over eight at the pens; *herdonly* drives stock in and does nothing but tend
the herd and kill a hog (else a beef) when the house is down to two days.

| Per class of 15 | playing, before | playing, now | **ranching, now** | herd only, before | **herd only, now** |
| --- | --- | --- | --- | --- | --- |
| Deaths by hunger | 3.3 (all on the road east) | 1.0 (all on the road east) | **3.3 (all on the road east)** | 146 | **126.3** |
| ... at home, periods 1-2 | 0 | 0 | **0** | 44.3 | **28.3** |
| Food at the end of periods 1 / 2 / 3, median family | 46.9 / 66.9 / 20.5 | 43.9 / 69.7 / 20.8 | **49.5 / 65.0 / 20.8** | 12.1 / 7.7 / 0 | **11.6 / 8.6 / 0** |
| Food from the herd, the class | 13.5 | 20.3 | **14.5** | 3,304 | **3,702** |
| The herd at the end of period 2, median family with one | 6 cattle, 22 hogs | 6-7 cattle, 23 hogs | **7 cattle, 29-30 hogs** | 6-7, 1-23 | **7, 1-23** |

- **A herd alone does not feed a family.** Tending the herd and killing from it is all a *herdonly* family does, and **126 of about 130
  people a class still die**, a fifth fewer than before (the hogs raised by minding; the fat pork). Untended, the rule of §2 is as it
  was: 6 cattle and 12 hogs give about 250 food a family over the whole game, not a year's eating.
- **Minded, a herd grows rather than feeds**: a ranching family ends the second period with **29-30 hogs and 7 cattle against 22-23 and
  6** for one that only rides the range when it is about to stray. The food students actually take from it stays small (14.5 a class:
  a family that plays sensibly does not need to kill), and **nobody of a played family dies at home either way**.
- **The sale was not exercised by the harness**: the cattle of a ranching family never passed the eight it keeps before selling (6
  cattle and 12% calves, minded half again). The sale is proved in `tests/herds.test.mjs` and `npm run test:herds` (2 head fair, 8
  reales); what selling does to a class is in the ending measure below. A harness that sells hogs too is the way to measure it in play.
- Deaths on the road east move between 1 and 3.3 a class across runs of four classes; that is the noise of four classes, not the herd
  (the ranching and playing families meet the road the same).
- The harness ran before the herder's work was put back at the family's pace (`grown`, the last commit): that changes how long a day on
  the range takes a hand, not what it yields.

**The ending** (`node scripts/balance-measure.mjs --sizes 5,15,30 --classes 10,10,10`, the director's strategies over 30 classes and 500
families, [evidence/herds-ending-measure.json](evidence/herds-ending-measure.json), scored with and without the herd's line by
`node scripts/herds-ending-measure.mjs`):

| | |
| --- | --- |
| Families with a herd still on the range at the end of an intact farm | **47 of 500** (most families fled and left theirs, §3) |
| The herd's line of the sale, median (range) | **76 reales** (22 to 84), against a median farm sale of **181** |
| What it moves a family's final number, median / mean | **+3,960 / +6,588** (glory multiplies it, as every real) |
| Classes whose winner changed | **0 of 30** (8 winners had a herd sold, with or without its line) |

So the herd at the end moves the middle of the table and not the winner, as the farm's sale did (§17). It is put to the owner
(STOCK.md §10.7, question 1) with the measure.

## 22. Men's work, women's work, and the wash (2026-10-03, owner-decided; not released)

The owner, 2026-10-03: *"work was usually gender specific"*, by multiple choice **"Custom, necessity opens"**
([CUSTOMARY_WORK.md](CUSTOMARY_WORK.md)): the men's work is refused a woman while a man of 16+ is at home and able, and the women's a
man; keeping house, the kitchen garden and the wash are new women's work; the housekeeping saving now needs somebody keeping house.
The questions for balance: **do two-parent families build markedly slower, and does a family eat worse or better?** Nothing was
retuned; these are the numbers.

**The building and the field** (`node scripts/custom-work-measure.mjs --seeds custom-1,custom-2,custom-3,custom-4`, every family of
four classes of fifteen played as the director plays a family nobody plays, through the first period on the real land; *before* =
origin/main cca3a891 with the same harness, `--root`; [before](evidence/custom-work-measure-before.json),
[now](evidence/custom-work-measure.json)):

| First period, median family | both parents (49), before | **now** | lone mother (6), before | **now** | lone father (5), before | **now** |
| --- | --- | --- | --- | --- | --- | --- |
| Day the house was roofed | 1.1 | **1.6** | 2.6 | **2.6** | 3.9 | **3.9** |
| Plots cleared | 3 | **3** | 3 | **2** | 3 | **2** |
| Food in the house at the end | 55.6 | **60.2** | 25 | **39.5** | 13 | **35.7** |
| Kitchen gardens laid out | 0 | **49 of 49** | 0 | **6 of 6** | 0 | **5 of 5** |
| A grown woman's ticks: building and felling / the field / the women's own work / no work | 3% / 13% / 0 / 67% | **0 / 12% / 14% / 59%** | 13% / 13% / 0 / 19% | **14% / 11% / 16% / 26%** | - | - |

- **Two-parent families raise their house about half a day later** (median day 1.1 to 1.6; 48 of 49 roofed in the period either way):
  the mother no longer builds beside the father. They clear as much ground, and **end the period with more food** (55.6 to 60.2): the
  house kept and the garden worked.
- **Lone parents build as fast as before** (nobody keeps the work from them) and **clear a plot less** - the hours go to the house,
  the garden and the wash - and **end with far more food** (25 to 39.5, 13 to 35.7).
- The median of all sixty families fell (54.6 to 49.4) while each shape's rose: medians of mixed groups, read by shape.
- The women's own work was placed in the director's plan before the trips to town after measuring the alternative: with it after them
  a lone mother ended the period with **10.5** food, not 39.5.

**Food and hunger** (`node scripts/hunger-balance.mjs --seeds hunger-1,hunger-2,hunger-3`, three classes of fifteen, all three
periods, every family played; [before](evidence/custom-work-hunger-before.json), [now](evidence/custom-work-hunger.json)):

| Per class of 15 | idle, before | **idle, now** | playing, before | **playing, now** |
| --- | --- | --- | --- | --- |
| Deaths by hunger | 153.7 (everybody) | **144.3 (everybody)** | 0 | **0.3** (one child on the road east, day 204, one class) |
| First death, day of the class | 14, 14, 13 | **13, 13, 12** | - | - |
| Median food at the end of periods 1 / 2 / 3 | 0 | 0 | 44.3 / 67 / 18.7 | **52.4 / 62.6 / 20.7** |
| Families hungry at some time | 15 | 15 | 2.7 | **2.3** |

- **A student who gives no orders starves a day sooner**: nobody keeps house, so the saving is gone. Meant, and small.
- **A student who plays as the director does** keeps house and gardens (the director's plan does), ends the first period with about
  8 food more and the third about 2 more; the second period is 4.4 lower in the median (noise at three classes, the herd and the
  winter's men away move it more). The one death is a child on the road east in the spring, which §20's six classes counted at 1.2 a
  class before this.
- **Not measured** (measured since: §23, issue 3): a student who never discovers *Keep house* and never puts a woman on auto - that family eats up to a quarter more
  than before (the saving was free until now). The idle student is the bound.
- `ceiling:` the director's own errands to town pay the plain price whatever the state of the clothes; its women wash among their work.

## 23. Is it too hard to play short of one sex? The custom's viability (2026-10-04, a study; no rule changed; all seven answered the same day, §24)

The owner, 2026-10-04: *"once gendered work is in, check for viability of game play. is it too hard to play if your family doesn't
have enough of a certain gender? propose fixes for each issue you may come accross."* Measured on branch `custom-viability` from
origin/main 4f76d4ed (the custom with the owner's four answers, [CUSTOMARY_WORK.md](CUSTOMARY_WORK.md)) against **726f9411, the commit
before the custom was merged** (the first parent of 58b1abff), unpacked to a scratch folder and run with the same harness (`--root`).
Nothing in the game was changed.

**The harness** (`scripts/custom-viability.mjs`): six classes of fifteen (seeds `viab-1` to `viab-6`), all three periods, every family
played, the hunger harness's way of running a class (§19-§21). In each class **eleven families are built to a shape** - rolled as
dealt (means, wagons, arrival), then their people put in place of the rolled ones with the hidden stats `dealTraits` deals for their
sex and age, the way the tests build families - and four are left as rolled. Which household gets which shape turns with the seed, so
no shape always has the same land. Six of each built shape a column; 19 rolled two-parent, 3 lone-mother and 2 lone-father families.

| Shape | People |
| --- | --- |
| manyDaughters | father, mother, five girls (14, 12, 9, 6, 3) |
| fatherGirls | lone father, four girls (13, 11, 8, 5) |
| fatherBoys | lone father, four boys (17, 14, 11, 7) |
| motherSmall | lone mother, four children all under ten (8, 6, 4, 1) |
| motherSon16 | lone mother, a son of 16 and three younger (12, 8, 5) |
| warHome | father, mother, a son of 17, three girls (14, 11, 7); **father and son sent to enlist** in the winter (day 122, median) |
| son16Home | father, mother, son 16, girl 13, boy 9, girl 4; **only the father sent to enlist** (the son at home 61 days with him away) |
| fatherBaby | lone father, three infants (4, 2, 0) |
| oneManManyWomen | father, mother, five girls (21, 19, 17, 14, 11): one grown man, four grown women |
| oneWomanManyMen | father, mother, five boys (21, 19, 17, 14, 11): one grown woman, four grown men |
| twoParentMixed | father, mother, boy 13, girl 11, boy 8, girl 4 (the baseline) |

Two students: **playing** plays as the director plays a family nobody plays (`thinkFor`, the hunger harness's *playing*);
**nohouse** plays the same but never finds *Keep house*, the wash or the garden (the three are taken off what it sees). The tree before
the custom has no such work, so it is run *playing* only. Read after every turn a family takes: a person of ten or more at home, able
and given nothing while a needed work (building, felling, fetching logs; clearing, fencing, survey, the lane, the well; the hunt and
the gathering works that take the rifle or the axe; keeping house, the garden, the wash, nursing) is refused them **by the custom
alone** - `choreAvailability` asked as it is, then again with that work's keepers counted away - is **stuck**; a family-day with
such a person is a *stuck day*; one where nobody free may begin that work at all (its keepers busy at other work) is *hidden from
everybody*. The wash is read at every arrival in a town, and the coin a person whose clothes want washing spent or took is the
**markup a student's errand would have added** (the director's own errands, which this harness uses, pay the plain price: §22's
`ceiling:`), a quarter of it.

How often each shape is rolled (`scripts/custom-viability-edges.mjs`, 20,000 families on the die as it is):

| In a class of 30 | families |
| --- | --- |
| Both parents | 25.6 |
| **One pair of hands for the men's work** (one man of 16+, no boy of 10-15), lone fathers included | **7.5** |
| ... of which three or more women and girls of 10+ beside him | 0.9 |
| A man with girls of 10-15 and no boy of 10-15 | 3.3 |
| Lone father / with a baby under two | 2.2 / 0.4 |
| Lone mother / all her children under ten / with a son of 16+ | 2.3 / 1.8 / 0.06 |
| One grown woman and three or more grown men / one grown man and three or more grown women | 1.3 / 1.3 |
| Both parents and a son of exactly 16 or 17 (who keeps the custom if the father goes) | 9.2 |

Run: `node scripts/custom-viability.mjs --study --seeds viab-1,viab-2,viab-3,viab-4,viab-5,viab-6 --before <a checkout of 726f9411>
--jobs 18 --out docs/evidence/custom-viability.json` (18 classes, about ten minutes each, in parallel), then `node
scripts/custom-viability-report.mjs --out docs/evidence/custom-viability-summary.json`, and `node scripts/custom-viability-edges.mjs
--out docs/evidence/custom-viability-edges.json`. Records: [raw](evidence/custom-viability.json),
[by shape](evidence/custom-viability-summary.json), [the rule's edges and the frequencies](evidence/custom-viability-edges.json).

### 23.1 The numbers, before / now (playing) / now (nohouse)

Six families a shape, medians unless said; roofed = day of the class the house was roofed (all 90 families roofed in every column);
food at the end of periods 1-2-3; hungry = families ever hungry; deaths by hunger (at home in periods 1-2 in brackets); rank of 15.

| Shape | Roofed day | Plots cleared, end P1 | Harvest food | Food P1-P2-P3 | Hungry | Hunger deaths | Coin | Final | Rank |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| manyDaughters | 1.1 / **3.9** / 3.6 | 3 / 3 / 3 | 400 / 386 / 387 | 24-37-13 / 31-38-13 / 26-30-13 | 2 / 2 / 2 | 1 / 1 / 1 | 424 / 331 / 360 | 26,382 / 31,614 / 24,276 | 8.5 / 6 / 8.5 |
| fatherGirls | 1.2 / **4.0** / 4.4 | 3 / 3 / 3 | 770 / 695 / 688 | 22-40-14 / 21-48-14 / 22-38-16 | 1 / 1 / 1 | 0 / 4 / 0 | 177 / 168 / 160 | 7,594 / 5,319 / 6,862 | 12.5 / 13 / 13 |
| fatherBoys | 1.2 / 1.3 / 1.2 | 3 / 3 / 3 | 644 / 678 / 636 | 29-37-11 / 37-37-11 / 23-35-11 | 0 / 0 / 0 | 0 / 0 / 0 | 343 / 316 / 342 | 31,599 / 29,916 / 31,885 | 6.5 / 6.5 / 7 |
| **motherSmall** | 10.9 / 6.7 / 5.3 | 3 / **1.5** / 3 | 134 / **29** / 144 | 12-21-8 / **10-6-7** / 11-9-7 | 1 / **3** / **4** | 1 / **2 (2)** / **2 (2)** | 100 / 65 / 87 | 430 / **215** / 399 | 14.5 / 15 / 15 |
| motherSon16 | 1.0 / **2.4** / 2.4 | 3 / 3 / 3 | 460 / 412 / 413 | 25-30-12 / 46-40-10 / 20-34-11 | 1 / 2 / 3 | 0 / 0 / 0 | 359 / 362 / 317 | 12,237 / 15,019 / 13,883 | 11 / 10 / 10.5 |
| warHome | 1.1 / 2.0 / 1.9 | 3 / 3 / 3 | 635 / 639 / 623 | 41-69-13 / 46-75-14 / 32-65-13 | 1 / 0 / 2 | 0 / 0 / 0 | 294 / 237 / 230 | 58,972 / 53,431 / 52,309 | 3 / 3.5 / 3 |
| son16Home | 1.2 / 1.3 / 1.2 | 3 / 3 / 3 | 371 / 379 / 356 | 26-36-19 / 27-40-22 / 25-37-18 | 0 / 0 / 0 | 0 / 0 / 0 | 480 / 469 / 471 | 68,770 / 58,805 / 64,913 | 4 / 5 / 4.5 |
| **fatherBaby** | 4.0 / 4.0 / 4.1 | 3 / **1** / 3 | 448 / **279** / 466 | 24-39-23 / 15-40-21 / 22-43-25 | 0 / 0 / 0 | 0 / 0 / 0 | 121 / **71** / 146 | 6,077 / **2,536** / 5,846 | 12 / 12.5 / 13 |
| oneManManyWomen | 0.9 / **1.8** / 1.7 | 3 / 3 / 3 | 540 / 504 / 518 | 48-42-18 / 38-39-19 / 44-41-15 | 0 / 0 / 0 | 0 / 0 / 0 | 479 / 427 / 429 | 30,409 / 42,496 / 28,383 | 6.5 / 6 / 6.5 |
| oneWomanManyMen | 0.9 / 1.0 / 1.0 | 3 / 3 / 3 | 514 / 515 / 524 | 33-40-16 / 34-46-16 / 33-43-16 | 0 / 0 / 0 | 0 / 0 / 0 | 566 / 579 / 569 | 63,992 / 66,037 / 65,051 | 4 / 3.5 / 4 |
| twoParentMixed | 1.2 / **2.1** / 2.0 | 3 / 3 / 3 | 378 / 375 / 392 | 22-33-11 / 29-37-11 / 25-32-11 | 2 / 2 / 2 | 1 / 0 / 1 | 430 / 407 / 410 | 19,102 / 21,169 / 21,331 | 8.5 / 8 / 8 |
| rolled, both parents (19) | 1.2 / 1.6 / 1.6 | 3 / 3 / 3 | 457 / 448 / 465 | 42-47-22 / 42-55-22 / 43-43-23 | 7 / 6 / 7 | 2 / 2 / 2 | 179 / 230 / 163 | 28,696 / 20,250 / 27,880 | 6 / 8 / 7 |
| **rolled, lone mother (3)** | 4.0 / 4.0 / 3.9 | 2 / **1** / 2 | 526 / **371** / 534 | 14-35-15 / 12-43-13 / 17-48-17 | 0 / 1 / 0 | 0 / 0 / 0 | 148 / 110 / 156 | 4,469 / **2,460** / 4,551 | 13 / 12 / 12 |
| rolled, lone father (2) | 1.8 / 1.7 / 1.8 | 3 / 2.5 / 3 | 1,036 / 1,085 / 1,081 | 87-66-17 / 148-103-19 / 90-78-18 | 0 / 1 / 0 | 0 / 0 / 0 | 347 / 266 / 320 | 14,758 / 11,268 / 13,595 | 9.5 / 9.5 / 9 |
| **All 90** | 1.2 / **2.5** / 2.3 | 3 / 3 / 3 | 445 / 413 / 443 | 31-40-15 / 33-40-15 / 29-37-15 | 15 / 18 / 21 | 5 / 9 (2) / 6 (2) | 328 / 276 / 307 | 21,775 / 20,373 / 21,225 | 8 / 8 / 8 |

The student's experience (now; none of it exists before the custom). Stuck share = the share of the family's days at home with
somebody stuck. Time shares are of all the person-time at home of that group: men's / women's / shared / no work.

| Shape | Stuck share, playing / nohouse | Hidden from everybody, days a family (playing) | Grown women, playing | Grown women, before | Girls 10-15 idle, before / playing / nohouse | Town arrivals dirty, playing / nohouse | Markup a family, playing / nohouse (reales) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| manyDaughters | 19% / 39% | 22.6 (men's 6, house 16) | 1 / 67 / 23 / 8 | 2 / 0 / 39 / 59 | 68% / 18% / 71% | 27% / 92% | 18 / 85 |
| fatherGirls | 18% / 52% | 26.7 (men's) | - | - | 76% / 17% / 77% | 23% / 93% | 12 / 50 |
| fatherBoys | 0 / 0 | 0 | - | - | - | 21% / 87% | 19 / 85 |
| motherSmall | 0 / 0 | 0 | 43 / 23 / 31 / 3 | 29 / 4 / 46 / 21 | - | **66%** / 97% | 1 / 22 |
| motherSon16 | 22% / 48% | 33.2 (house 31) | 1 / 54 / 41 / 5 | 4 / 1 / 61 / 34 | 70% / 7% / 66% | 37% / 91% | 36 / 76 |
| warHome | 32% / 39% | 42.5 | 0 / 62 / 30 / 8 | 1 / 0 / 38 / 61 | 74% / 30% / 79% | 41% / 87% | 28 / 61 |
| son16Home | 35% / 59% | 41.6 (house 39) | 0 / 54 / 34 / 12 | 2 / 1 / 34 / 63 | 73% / 16% / 77% | 43% / 91% | 55 / 109 |
| fatherBaby | 0 / 0 | 0 | the father: 11 / **49** / 39 / 1 | the father: 14 / 2 / 68 / 16 | - | 17% / 96% | 2 / 48 |
| oneManManyWomen | 38% / 40% | 55.6 (men's 55) | 1 / 42 / 27 / 30 | 1 / 0 / 25 / 74 | 95% / 88% / 95% | 29% / 92% | 28 / 93 |
| oneWomanManyMen | **88%** / 60% | **151.6** (house 151) | 0 / 68 / 27 / 5 | 3 / 0 / 31 / 66 | men idle 73% / 64% / 71%; boys 94% / 91% / 94% | 43% / 84% | 60 / 118 |
| twoParentMixed | 40% / 41% | 62.8 (house 60) | 0 / 60 / 33 / 8 | 2 / 0 / 38 / 60 | 71% / 11% / 78% | 54% / 88% | 40 / 77 |
| All 90 | 32% / 37% | 36.5 (men's 9, house 27) | 3 / 52 / 27 / 17 | 4 / 1 / 30 / 65 | 81% / 44% / 83% | **38%** / **90%** | 28 / 72 |

(About 181 days a family at home over the three periods. Remarks about the smell: 15.7 a family over the game playing, 42.3 never
washing.)

### 23.2 What goes wrong, and fixes for the owner to choose from

Each question is put as the owner answers them: the recommended option first, labels of one to five words.

**1. One man does all the men's work while the women and girls stand by: the house goes up days later.** Whenever the only hand for
the men's work is one man - a father with daughters, or with only small sons - the mother and every girl of ten to fifteen have none
of the building, felling, clearing or hunting on their bar while he is home. **The house is roofed one to three days later** in the
families with no second male hand (manyDaughters 1.1 to 3.9, fatherGirls 1.2 to 4.0, motherSon16 1.0 to 2.4, oneManManyWomen 0.9 to
1.8, twoParentMixed with a boy of 13 1.2 to 2.1; the class median 1.2 to 2.5), and somebody of such a family is stuck - free, the
men's work there, refused it only by custom - on **18-38% of its days at home**. Families with a second male hand of ten or more are
unchanged (fatherBoys 1.3, oneWomanManyMen 1.0, son16Home 1.3). **Nothing else moves**: plots, harvests, food, hunger and the final
number are the same within the noise of six families, because the director's families never used the women's and girls' hours on men's
work much (grown women 4% of their time, girls 1%, before the custom; most of it was idle - 59-74% - and is now the women's own work).
So the cost is the first days without a roof, and a bar that offers the mother and girls nothing of the farm's heavy work - what a
student sees. **7.5 families in a class of 30** have one pair of hands for the men's work. *Why*: `customWhy` refuses the work to
anybody of the other sex while one keeper is home and able, whether or not he is free; girls of ten to fifteen follow the women's work.
- *How should a woman or girl help when the only man is busy?*
  1. **Help, not lead** (recommended) - women and girls of ten or more may join men's work a man of the family has begun (the raising, the clearing, the logs), never begin it; as at the record's house-raisings and log-rollings.
  2. **Opens when he's busy** - the men's work opens to her while every man at home is already at other work.
  3. **Children not bound** - nobody under sixteen is held by the custom; a girl of twelve may fell like her brother.
  4. **Leave it** - the cost is days on the roof, not food or the ending.
- **Answered (owner, 2026-10-04): "Help, not lead".** Built on branch `custom-work-3`: §24.

**2. A lone parent now does two people's work, and falls behind.** A lone mother with small children must do all the men's work (by
necessity) *and* keep house, garden and wash; a lone father with infants the same in mirror. Played as the director plays, the women's
work takes **23% of a lone mother's time and 49% of a lone father's**, out of the field: **motherSmall** clears 1.5 plots by the end of
the first period instead of 3, brings in 29 food from the field instead of 134, ends the winter with **5.7 food instead of 20.5**, has
3 families of 6 hungry instead of 1, **2 children die of hunger at home in the winter** (none at home before) and finishes on 215
instead of 430; **fatherBaby** clears 1 plot instead of 3, harvests 279 instead of 448 and finishes on 2,536 instead of 6,077; the
rolled lone mothers 2,460 instead of 4,469. A lone parent who skips the women's work (nohouse) farms as before but is dirty 95% of the
time and - a lone mother - still loses the housekeeping saving, which came free before (motherSmall nohouse: winter food 8.5, 2 deaths
at home, one in the first period). **About 4.5 families in a class of 30** are lone parents, 1.8 a lone mother of children all under
ten. *Why*: the saving is now work somebody does (CUSTOMARY_WORK.md §4) and a family of one grown person has nobody else to do it;
keeping house is an hour a day whatever the family's size.
- *How should a family with one grown person keep house?*
  1. **Kept while working home** (recommended) - a lone parent's house counts as kept on any day they work at home; the wash and garden stay orders.
  2. **Children keep house** - children of seven to nine may keep house and work the garden as a child's job, like the water and the eggs.
  3. **Scaled to the family** - keeping house takes less of the day for a small family.
  4. **Leave it** - a lone parent's family is meant to be the hard one.
- **Answered (owner, 2026-10-04): "Children keep house".** Built: children of seven or more keep house and wash whenever only one custom is kept at home; §24.

**3. A student who never finds Keep house or the wash: idle women, dirty clothes, less food.** With the men's work off her bar and her
own work undiscovered, **a grown woman stands idle 63% of the time and a girl of ten to fifteen 83%** (about as idle as before the
custom, but now with no men's work to try either). **90% of town arrivals are dirty** (8,304 of 9,203), 42 remarks a family over the
game, and a student's own errands would pay about **72 reales a family** in markup (against a median coin of 307 at the end); food is
lower (end of period 1 33.1 to 28.6, period 2 39.5 to 36.6) and more families go hungry (18 to 21 of 90). This closes §22's *Not
measured*. Any family. *Why*: *Keep house* and the wash are orders like any other, and nothing does them unasked except a person on
auto (`houseworkMeanwhile`).
- *Should the house be kept when nobody is told to?*
  1. **Idle women keep house** (recommended) - a grown woman or girl at home with no work keeps house, and does the wash when it is due, unasked.
  2. **Prompt the student** - the house and the wash glow on the bar, and the journal says the house was not kept.
  3. **Warn before charging** - the first dirty visit to town is a remark only; the markup starts after.
  4. **Leave it** - finding the women's work is part of learning the family.
- **Answered (owner, 2026-10-04): "Prompt the student".** Built as a cue, not words (the owner prefers visual cues): the pot or the washtub pulsing on the idle woman's portrait and the icon glowing; §24.

**4. Away on wash day means dirty in town.** Even a family that washes every week arrives in town dirty **38% of the time** (3,255 of
8,515 arrivals), more than its people are dirty at home (30%): the person sent to town is the one most often away when the wash is
done, and the family may not wash again for seven days. Lone mothers of small children: **66%**. About **28 reales a family** of
markup on a student's errands over the game. Any family. *Why*: `washClothes` cleans only who is home, and the seven-day refusal is the
family's (`household.washDay`), not each person's.
- *Who may be washed for after wash day?*
  1. **Wash whoever's dirty** (recommended) - the wash may be done again whenever somebody at home wants it, cleaning only them.
  2. **Washed on coming home** - somebody who missed the wash is clean once home a night after it.
  3. **Leave it** - planning the wash around the trips is the student's to learn.
- **Answered (owner, 2026-10-04): "Wash whoever's dirty".** Built: §24.

**5. One woman, many men: the house work queues behind her while the men stand idle.** In oneWomanManyMen a grown man or boy is stuck -
free, the house unkept or the wash due, refused it by custom - on **88% of the family's days at home** (151 days a family when no free
person may do the house work at all). She works the garden 39 days of the game against 53-80 in the other two-parent shapes, washes 13 times
against 17, and the family is dirty 50% of its time at home against 26-30%. Food, hunger and the ending do not move (the house work is
an hour a day; the garden 0.3 food). In every family boys of ten to fifteen are kept from the women's work while their mother is home
(twoParentMixed: boys stuck 61 person-days, idle 52%). **1.3 families in a class of 30** have one grown woman and three or more men.
*Why*: the mirror of issue 1.
- *How should men help with the women's work?*
  1. **Help, not lead** (recommended) - men and boys may join the women's work a woman has begun; the same rule as issue 1's first answer.
  2. **Opens when she's busy** - the women's work opens to the men while every woman at home is at other work.
  3. **Leave it** - nothing measurable is lost.
- **Answered (owner, 2026-10-04): "Help, not lead"** (the same rule as issue 1, both ways). Built: §24.

**6. A man home from the army still counts as away (a rule fault, found reading the code).** `atHome` in sim/custom.mjs treats anybody
with a `service` as away, and a man called home from the army (`winter-recall`) or a deserter keeps his service, marked *released* or
*deserted* (sim/winter.mjs `recallFromService`). So **his wife has the men's work on her bar beside him for the rest of the class**, and
if she takes it up the story says she did it "with James gone to the army" while he stands in the yard (`scripts/custom-viability-edges.mjs`:
father released or deserted and home, the mother may fell and hunt). Permissive, never a dead end; not in the class runs (the harness
recalls nobody).
- *When is a man of the army away?*
  1. **Only while serving** (recommended) - away while serving or a prisoner; released or deserted and home, he keeps the custom.
  2. **Leave it** - he has done his part; his wife may work beside him.
- **Answered (owner, 2026-10-04): "Only while serving"** - fixed as a fault: §24.

**7. A son of sixteen keeps the custom from his mother.** With the father gone to the war, a son of 16 at home is the only keeper: the
mother has no men's work on her bar for the **61 days** he runs the place alone (son16Home; a son of 15 would not keep it - the edge
probe). The farm does as well as before the custom (winter food 39.6 against 36.1, spring 22.0 against 18.9, nobody hungry; coin 469
against 480; final 58,805 against 68,770 and rank 5 against 4, within the noise of six families). **9.2 families in a class of 30** have
both parents and a son of exactly 16 or 17. Not a problem the numbers show; asked because it is a shape a student will notice.
- *Should a son of sixteen keep men's work from his mother?*
  1. **Leave it** (recommended) - the farm does as well, and the rule is simple to read.
  2. **Mother may help** - she joins what he has begun (issue 1's first answer covers it).
  3. **Head of household** - a mother is held only by her husband, never by a son.
- **Answered (owner, 2026-10-04): "Leave it".** Nothing changed; with "Help, not lead" she may join the work he is at.

### 23.3 What is fine

- **No dead end.** No shape and no state found in which a work the family needs is refused to everybody for good. The moments when
  nobody free may do a work are queues - its keepers busy at other work, or holding a crying baby, or talking with a child (`aside`,
  owner: not away) - and end when that work ends. The edge probe found no state in which a man counts as home and able but is refused
  the men's work himself for another reason: sick, wounded and very sick open it to the women; tired, slightly hurt and weak with hunger
  keep it, and he may still work.
- **Families with a second male hand of ten or more** (fatherBoys, oneWomanManyMen, son16Home, most rolled families with sons): house,
  field, food and ending as before.
- **Mother and daughters left at home when the men go to the war** (warHome: father and son enlisted, day 122): winter food 75 against
  69.4 before, nobody hungry, rank 3.5 against 3. The work opens to them by necessity, as built.
- **A lone father with sons or with girls** (fatherBoys, fatherGirls): builds, clears and eats as before; he keeps house and washes by
  necessity, and these are among the cleanest families in town (dirty at 21-23% of arrivals). Nothing supports softening the markup for
  lone fathers. fatherGirls lost four children to hunger in one class (viab-4) on the road east in the spring, where every work is
  shared; not traced to the custom.
- **Babies with no woman** (fatherBaby): a crying baby calls the nearest woman of ten or more, else the nearest of the family of age
  (sim/babies.mjs `whoComes`), so the father holds them, capped at `COMFORT_CAP_TICKS` a day. The custom does not touch it; that shape's
  cost is issue 2's.
- **The guided start** is switched off (`LESSON_ENABLED` false). Read against the custom: every step has somebody who may do it in every
  shape (tests/custom-work.test.mjs), so none can deadlock; but five of its ten steps (the house, survey, clearing, the hunt, the well)
  are men's work, so a two-parent family's mother and girls would have only the house work during half of it - worth knowing for the
  redo.
- **Two-parent rolled families** (19): roofed day 1.2 to 1.6, as §22 measured (1.1 to 1.6); field, food and ending unchanged.

`ceiling:` six families a shape; differences in the final number under about a quarter are within the run-to-run spread (§21), and
deaths are counts of a few families. The *playing* student is the director's policy, which places the women's work before the trips to
town and more clearing (§22); a student who orders differently will split a lone parent's day differently. The markup is what a
student's errands would have paid on the same coin, not money any family in these runs lost.
