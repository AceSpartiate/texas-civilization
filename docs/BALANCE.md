# The balance measure: who wins, and why

**Measured 2026-09-27, at the owner's word** (by multiple choice: *"Yes, measure it now"* - run many automatic classes and report
who wins and why, **with no change to the rules until the owner has seen the numbers**). Nothing in the game was changed for this.
Script: `scripts/balance-measure.mjs` (`npm run balance:measure`). Record: [evidence/balance-measure.json](evidence/balance-measure.json).
The rule it measures is `docs/MONEY_AND_GLORY.md` §5 and §8 (*winning without fighting is hard, not impossible*) and `VISION.md`
§8 and §20 (a family that sends nobody must be able to win, though it should be difficult).

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

**2. Selling for coin decides more than fighting does: families that take food at the counter win 1.4 in 100, those that sell for coin
14 in 100. The counter's own answer is food, and a twelve-year-old cannot know that coin held is what the ending multiplies.**

- **A. (Recommended)** Say so at the counter, in words that name no glory: *"Coin is what the family will have to show when this is
  over."*
- B. Make the counter's own answer, when nobody chooses, coin rather than food.
- C. Leave it for students to find out at the ending.

**3. Staying in the Scrape scores better than fleeing (index 1.18 against 0.79): the road spends coin (a fleeing family held 36 reales,
a staying one 48) and the burn zone burns a farm whether the family stays or goes. Most families in 1836 fled.**

Staying does cost people: families that stayed inside the burn zone had **2,120** of their people taken prisoner at home, against
426 for families there that fled at once - and the ending does not count a prisoner at all.

- A. Leave it. Flight was costly, and the gap is modest.
- **B. (Recommended)** Let the ending's account say who was taken, and weigh it: a person taken prisoner at home takes something from
  the final number (for instance, what their part of the coin would be), so that staying is the gamble it was and not the safe
  choice the numbers now make it.
- C. Have fleeing save something staying does not - the stock, or what the wagon carried counted at the end.

**4. Farming harder helps a little (index 1.16 against 0.85); planting cotton made no difference (0.92 against 1.08), though the owner
chose on 2026-09-16 that cotton should be "more profitable for players".**

- A. Raise what the store pays for cotton.
- B. Leave it.
- **C. (Recommended)** Decide after question 1: if staying home is to earn more, the field is where it would, and cotton's price
  belongs to that answer.

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
```

The record carries every family's strategy, dice, coin, glory (by part, and every award with its miles), land, final number, place,
deaths, captures, burning and ground, so any other question can be asked of it without running a class.
