# Hunger — running out of food, and dying of it

> "player characters *can* die of starvation. players should have to ensure there's enough food. when you update this, also update
> the ui to better facilitate player awareness of where the family resources stand and the severity of consequences of running out.
> do it with highlights, colors, etc. don't use text and over explain."
>
> — the owner, 2026-09-30

**Owner-decided 2026-09-30. Built on branch `starvation` (not released).** It **amends** two earlier rules:

- the owner's answer of 2026-09-29 to *"A family whose student gives no orders runs out of food by mid-October"* (HANDOFF.md, the
  owner's six answers; docs/BALANCE.md §16.2), where the built answer was (a) **"Leave it"** and running out cost little;
- the rule that **nobody died of hunger at home** (docs/BALANCE.md §16.2; docs/DISEASE.md §3.5, where hunger only doubled the weight
  of a sickness). That doubling stays.

The code is `sim/hunger.mjs`. The claims are `FIC-GONZ-995` to `FIC-GONZ-999` (HISTORY.md).

## 1. What exists now

- Each person of a **played** family carries **days of want** (`person.hunger.want`), counted wherever they eat from the family's
  store: at home (`sim/routines.mjs` `advanceRoutine`, whoever is at the house) and on the road east (`sim/scrape.mjs`
  `advanceFlight`, everybody with the family). A day's want is the share of the day's eating that the store and the day's work about
  the place could not cover, times how hard hunger falls on that person (§4). A day of eating one's fill wins **two** back.
- The stages are read off it (§3), said once each in the family's story, and shown on the page as colour (§5).
- A death by hunger is told as a death by sickness is (§7).
- Absent on everybody fed, which is the correct empty value: every class saved before opens with nobody hungry, and **no
  `saveVersion` moved**. `health.starved` marks a death by hunger; `household.hungerTold` is the story's bookkeeping, never sent to
  the page. Both are checked by `hungerInvalid` only when present.

## 2. What the record says, and what the game does with it

Documented nowhere in the sources read for this game is a death by hunger on a Texas farm in 1835–36, or on the road east in 1836;
none is claimed. Harris's families on the Scrape were "cold, wet, and hungry" (docs/DISEASE.md §2), which the game already had as
the weight of hunger on a sickness. What is borrowed is physiology, not Texas history, and it is **not re-checked in this session**:

- A grown, healthy person with water and nothing to eat lives **weeks** - the figure commonly given is about three weeks to two
  months (the 1981 hunger strikers in the Maze prison died after 46 to 73 days, a figure widely cited).
- Babies and small children, the old and the sick go down **much sooner**; in famines they die first, and parents going short so
  their children eat is the common pattern.
- People eating part of what they need live far longer than people eating nothing, and are weak long before they are in danger.

The game keeps the shape and the order and **compresses the time about threefold**, so it can happen inside the class periods a
class plays: sixteen days of want for a grown person, where the record says about fifty. That is `FIC-GONZ-995`, stated as an
invention.

## 3. The stages, and their timings

| Stage | Days of want (weight 1) | What it does | The page |
| --- | --- | --- | --- |
| **Fed** | 0, or being won back below 5 | Nothing | Nothing |
| **Hungry** | any, on a day the store could not cover | Nothing yet; the story says *"The family has eaten the last of its food."* | Amber ring on the portrait, a bowl in its corner; the food box red |
| **Weak** | 5 | Family work takes **half as long again**; **three quarters** of the pace on a road; **not sent to fight** (`canFight`, *"… is too weak with hunger to fight."*) | Ember ring and a sepia face; the food box glows |
| **Starving** | 10 | Work takes **twice as long**; **half** the pace on a road; the "!" and the story card, with the real time left | Red ring that pulses; the food box pulses |
| **Dead** | 16, and never inside a real minute of *starving* (§6) | *"… died of hunger at home, and was buried there."* | As a death by sickness (§7) |

In class time, at the Study pace (9.5 s a tick): in the first period's campaign a calendar day is two ticks, about **19 real
seconds**, so a grown person with nothing at all is weak after about **1.6 real minutes**, starving after about **3.2**, and dead
after about **5**; a family eating half its fill takes twice as long. In the first days (a day is 24 to 72 ticks) nobody gets near
it. On the road east in the spring a day is 10 to 20 real seconds. The minute in §6 comes on top of any of these.

The family's road east goes at the pace of its weakest walker (`hungerStride`), so a family never walks apart because one of them
is starving.

## 4. Who goes down first (`FIC-GONZ-996`)

`hungerWeight`: a baby under two **2.5**, a child under six **2**, a child under sixteen **1.25**, a grown person **1**, sixty or
older **1.5**; sick **×1.5**, very sick **×2**. **Children are fed first**: a child eating with somebody grown of the family takes its
want at **three quarters** (`CHILDREN_FIRST`). With nothing at all to eat and a parent at the fire:

| | Dies after |
| --- | --- |
| A baby | about 8.5 days |
| A child of four, an old person, a sick grown person | about 11 days |
| A grown person | 16 days |
| A child of ten | about 17 days |

So the weakest go first and the children are a little protected, which is the order famines show, and nothing is said of it but
the one sentence (§7).

## 5. What the student sees: colour, glow, motion - no sentences

The owner asked for highlights and colour, not words. Every number that was there stays; nothing explains.

- **The food box is a gauge** (`#food`, `paintLarder` in public/app.js; the level is `larderLevel` in public/family-panel.js). A
  sack, *Food 15.5* as ever, and a bar of the days the food lasts at what the family eats less what working about the place brings
  in (`larderShown`, sent as `household.larder`; `null` days while the work brings in as much as is eaten, drawn full). A fortnight
  fills the bar.

  | Level | When | Look |
  | --- | --- | --- |
  | plenty | 14 days and more, or not running down | sage bar, the box as before |
  | fair | 7–14 days | gold bar |
  | low | 3–7 days | amber bar and edge |
  | short | under 3 days | ember box |
  | empty | none left, somebody hungry | red box, empty bar |
  | weak | somebody weak | deep red box with a steady glow |
  | starving | somebody starving | darker red, **pulsing** |

  When a worse level is reached the box **flashes** three times. The words are only the hover and a screen reader's
  (`role="meter"`, `aria-valuetext`: *"Food 0.0, none left, starving"*), at most a few words.
- **The line of seed, powder, coin and the field** (`#supplies`, `paintSupplies`) is the same words, each lit by where it stands:
  run out in ember with a red underline (no seed with a bare field, no powder, the hoe worn out or missing), low in amber (one
  powder, no coin, water carried far), the crop growing in green, the crop ready in glowing gold, a bare field muted.
- **The portraits** (`data-hunger` on the row): hungry an amber ring and a warm tint from below, weak an ember ring with the face
  gone sepia, starving a red ring that pulses over a greyed face. An **empty bowl** in the portrait's top-right corner in the same
  colour (the sick badge is top-left, the idle mark bottom-right). The portrait's hover and screen-reader label gain one word:
  *hungry*, *weak with hunger*, *starving*.
- **Somebody starving** carries the **"!"** (`needsOf`, kind `hunger`, after very sick), which counts the real minute down, and the
  **story card** (`MOMENTS.hunger`): eyebrow *No food*, *"Anna is starving"*, *Go to Anna*, in its own alarm red breathing every
  1.1 s, with the icon `icon-sell-food` and *"About 1 min left to find food."*
- **Reduced motion** (`prefers-reduced-motion: reduce`): nothing pulses or flashes; the starving box and ring are heavier and
  brighter instead, and a flash is an outline.

Stand-ins: the bowl and the sack are drawn in the style sheet (docs/ART_REQUESTS.md, *Request 2026-09-30 — the hunger mark and the
food gauge's sack*, item B13 on Astra's list).

## 6. The minute, and the families the director runs

- **A minute before hunger can kill** (`FIC-GONZ-997`). Somebody starving in a played family whose student is at the screen cannot
  die of hunger until **sixty real seconds** (`QUESTION_BUDGETS.starve`) have passed since they were said to be starving: the
  clock of the very sick (`FIC-GONZ-960`, sim/decision-budget.mjs), suspended while the Host has paused, kept in the save, a tick
  stepped in process counting one at the Study pace. A spell that eases back to weak forgets it.
- **A family nobody plays** counts no want and never starves (`FIC-GONZ-998`): the director keeps it fed by its own rules
  (sim/neighbours.mjs - the hunt, the four gathering works when the house is short, the herd at the last day or two, powder bought
  before the last shot). The class's balance (docs/BALANCE.md) is untouched by this change.
- **A family whose student has gone** (sim/absence.mjs) is the director's too, which forages for it by the same rules; its want is
  **held where it stood** - it neither grows nor kills - and is won back by eating, until the student is back, when the minute starts
  again from nothing. **Decided here: yes, the director feeds absent families sensibly, and never lets one starve.** A family is
  never starved while nobody could see it.
- **The winter nobody plays** ends with everybody fed (`recoverOverWinter`, sim/periods.mjs), as the winter already ends with a
  fortnight's food at least.

## 7. A death by hunger follows the death by sickness

- One plain sentence to the family, the record's shape: *"Ruth died of hunger at home, and was buried there."* / *"… on the road,
  and was buried where they fell."* Nothing is drawn: the dead are sent with no place (`diedQuietly`, sim/world.mjs), not drawn on
  the Host's map (sim/overview.mjs) or another family's (sim/town.mjs).
- **A child who died of hunger is never named on the projector**: counted on the Host's class panel as a child who died
  (`diedAChild`, sim/disease.mjs), left out of "Who went" (sim/ending.mjs `UNNAMED_UNDER`), and never named in the video.
- The family's flashback says it by who they were (*"A child of the family, 3 years old died of hunger."*, the words it has always used for a child who died of a sickness), and its homecoming *"The family lost
  … to hunger."* (sim/flashback.mjs); the class's video counts it apart from the sickness and the war: *"Three families ran out of
  food, and lost somebody to hunger."* (sim/class-flashback.mjs). A man dead of hunger is never among those who "did not come home
  from the war".

## 8. The measurement

`node scripts/hunger-balance.mjs --seeds hunger-1,hunger-2,hunger-3,hunger-4 --modes idle,playing --out docs/evidence/hunger-balance.json`
(`npm run study:hunger`): whole classes of fifteen families on the real land, all three periods, every family played and its
student at the screen.

- **idle**: the student gives no orders at all (grown people working about the place, children resting).
- **playing**: the student farms, hunts, fishes and forages as the director does for a family nobody plays (`thinkFor`), and leaves
  for the east when told with all the food that fits.

Four classes of each, fifteen families (seeds `hunger-1` to `-4`), measured 2026-09-30
([evidence/hunger-balance.json](evidence/hunger-balance.json)):

| Per class of 15 families | idle | playing |
| --- | --- | --- |
| People in the class | 161.8 | 161.8 |
| **Deaths by hunger** | **161.8 - everybody** | **3.3** |
| … in the first period (home) | 157.5 | 0 |
| … in the second period (home) | 4.3 | 0 |
| … in the third (the road east and the refuges) | 0 (nobody left) | 3.3, all children under six |
| Families that lost somebody | 15 | 1 (0 to 2) |
| Families ever hungry / weak / starving | 15 / 15 / 15 | 7.8 / 4.5 / 2.5 |
| Median days a family had somebody hungry or worse | 32.6 | 0.9 |
| First death, day of the class | 18 to 23 | 173 to 203 (the spring) |
| Least real time from *starving* to a death (Study pace) | 67 s | 181 s |

- **A student who gives no orders loses the whole family in the first period**, every family of every class measured: the store
  runs out between day 8 and day 15, working about the place feeds the grown a little and the children nothing, the babies die
  first (about day 18-23) and the grown last. In real time at the Study pace (`hunger-1`, `hunger-2`): the first store empty
  54-56 minutes into the class, the first person starving 60-63, the first death 62-64 - about eight minutes of red, glowing
  and pulsing on the page before anybody dies. That is what the owner asked for - running out has to be managed - and it is
  harsher than anything in the game so far; see the open question in HANDOFF.md.
- **A student who farms, hunts and forages loses nobody at home**, in any of the four classes. On the road east a family with a
  big household and a wagon's load can still run out: three of the four classes lost small children on the road or at a refuge
  (2 to 7), one family each. The playing policy is the director's, which packs all the food that fits and does not fish or hunt
  on the road; a student who does has more.
- The real minute held in every death: the least time between a person being said to be starving and dying was 67 s idle and
  181 s playing, at the Study pace.
- `scripts/balance-measure.mjs` (the 210-class record, docs/BALANCE.md) measures families the director runs, which never starve
  (§6), so its numbers do not move and it was not run again.

## 8a. The owner's answers, 2026-09-30 (owner-decided; not released)

The three questions this document's first build put to the owner were answered the same day:

1. *A student who gives no orders loses the whole family in the first period* - **"Keep it".** Nothing changed: running out has
   to be managed, and the gauge, the rings and the "!" say so for minutes before anybody dies.
2. *Small children still die on the road east for a family that plays as the director does* - **"Keep it".** Nothing changed:
   fishing, hunting and trading on the road and at the refuges are there to be used.
3. *A family overtaken by a Mexican column loses its food with its goods, and then starves where it stands* - **"Leave a few
   days' food".** Built (branch `starvation-2`): the column still takes the wagon, the animals and everything in it, and leaves
   the people it lets go **three days of their own eating** (`LEFT_FOOD_DAYS` in sim/road.mjs `overtake`: what those let go eat
   in a day by their ages, `eatenADay`, times three, rounded up to a tenth), **never more than the family had** - a family down to
   half a food keeps half a food. The prisoners taken are not counted: they eat the column's rations. The family is told in the
   same sentence as the taking: *"They left the family 4.2 food, a few days' eating. The family went on on foot with that and
   nothing more."* After those days the family must forage, fish, hunt or trade, or it goes hungry by the ordinary rule. Invented;
   no source read gives what a column left a family (`FIC-GONZ-995`, as amended).

## 8b. A family handed to a student gets a few days' food (owner-decided 2026-09-30; not released)

Found by a proof builder: a family the director runs never starves (§6), so it can reach a student with little or no food - in a
winter class often none - and a student who took it over, joining late or coming back from being away, could lose people within
a few real minutes. The owner chose **"A few days' food"**.

- **What**: when a student takes a family over from the director, its store is topped up to **three days of its own eating**
  (`HANDOVER_DAYS = 3`, sim/hunger.mjs `feedOnHandover`: the family's day of eating as the gauge counts it, `dailyDraw`, times
  three, rounded up to a tenth) - the same measure a Mexican column leaves (§8a). **Never less than it has**: a family with more
  keeps what it has.
- **When** - every way a family passes to a student:
  - a **late join** into a family the director was running or nobody had played, including the family the computer already played
    that a late student names (server/app.mjs `/api/join`);
  - a student **back at the screen** of a family the director ran while they were away - after a claim from the away list, a
    family key, or the page simply opening again: all of these clear `absent` through sim/absence.mjs `setAbsent`, which tops up.
  A family whose student is gone for less than the absence grace was never the director's, and is not topped up.
- **No farming**: it tops up only a family **below** three days' eating - a family whose want is at risk - and **once a period**
  (`household.handoverFed`, the period number, kept in the save and never sent to the page). A student who closes the laptop for
  the two minutes that make a family absent and opens it again gets nothing more that period; a family that did not need it keeps
  the chance for later in the period. `ceiling:` a student away twice in one period and back both times to an empty store is fed
  only the first time (the minute before hunger can kill still holds for them); per handover, after the director has run the
  family for a while, is the way out if a class finds it.
- **Said plainly**, once, in the family's journal: *"There is food in the house for a few days: 4.2 in all."* The gauge shows the
  rest.
- Invented (`FIC-GONZ-998`, as amended). No save version: `handoverFed` is absent on every class saved before, which reads as not
  yet fed.

## 9. Evidence

- `tests/hunger.test.mjs` (19 tests since the column's food, §8a, and the handover, §8b), each seen failing under `npm run test:hunger-injections`:
  29 of 29 injections caught by the test written for them, 20 by that test alone ([record](evidence/hunger-injections.json)).
- `npm run test:hunger` ([record](evidence/hunger-browser.json)): the gauge at each level, the portraits, the "!" and the card,
  reduced motion, the fit at three sizes, and the first death after the minute; screenshots `docs/evidence/hunger-*.png`.

Same computer only: no Chromebook, LAN or classroom claim.
