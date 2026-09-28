# Audit: how the parallel systems interact, and the edge cases — 2026-09-28

Scope: this audit looked only for problems and fixed none. It covers the systems that landed in the last week from separate builders, and what
happens where they meet. That is the battles and their staged fates, the children's talk and obedience, the babies, the diseases, the
Scrape's routes, chases and "¡Alto!", the lapsing questions, exclusive use of property, the milk cow, and save/reload. Tree:
`main` at `aa35088`. Everything was measured in process, on the same computer. No browser run was made. No product code was changed.

**How it was probed.** Throwaway scripts were kept out of the tree. Most start from the Scrape's own fixture:
`tests/support/scrape-spring.mjs` `spring()`, seed `road-1638`, 8 families on the colonies map, at the start of the third period
(tick 860). The fixture's families include hh-3 (parents and seven children, one of them a baby of 0), hh-4 (parents and daughters of 4, 3
and 1), hh-7 (a mother alone) and hh-8 (parents and eighteen children). Every family was marked played, with its lesson done, as
`tests/support/settled.mjs` `taught` does. The chase scenes come from `tests/support/scrape-scene.mjs` `sceneFor`. Some probes at home used
the babies test's own settled colonies world.

**What came up clean** is at the end: save/reload, NaN in projections, cross-family knowledge, a family with nobody left, and the
family of twenty.

Severity: **blocker** means a student cannot play part of the game as intended. **Serious** means play goes wrong in a common or
consequential case. **Minor** means it is wrong but cheap.

---

## Blocker

### B1. When the main person is serving, the family cannot answer anything on the Scrape: the order to leave, the route, the road's questions, "¡Alto!"

- **Repro.** Take `spring()`, family hh-1. Give the father `join-houston`, then step until the family is ordered out (tick 867). Send
  `flee` through the main person the page shows. It is refused: *"Gregorio is with General Houston's army at Gonzales, and can only be sent
  for."*
- **Chase repro.** Take `spring()`. Set the father to `service {kind:'houston', status:'serving'}`, then call
  `sceneFor(w, {kind:'cavalry', how:'wagon', ahead:1.2, householdId:'hh-1'})`. When "¡Alto!" is asked, the page's card is on the father,
  and `road-answer run` through him is refused. After 3 ticks the question **lapses**: the family halts and is **caught**.
- **What happens.**
  - `mainPersonId` (sim/family.mjs:620) skips the dead, the captured and the under-tens, but **not somebody serving**, and not a
    Fannin prisoner. The main person is the principal until the student stars somebody else, so on a new family it is the father.
  - The page draws the whole flight card only on that person (public/app.js `renderFlight`: `chosen.id !== main` hides it) and sends every
    button through him. That covers leave, the route editor, making for the timber, staying, the bog, the danger and "¡Alto!".
  - `applyOneAction` refuses all of them for anybody serving (sim/world.mjs:158, `SERVING_ACTIONS`).
  - `attended()` (sim/pursuit.mjs:297) still counts the family as answered for, so the soldiers stand and wait for an answer the page
    cannot send.
  - The order to leave is taken by auto after a day (`FLIGHT_PATIENCE`), and the road's questions lapse after 12 ticks.
- **Fuzz.** The fuzz sent `road-answer` and `flee` through any grown person, and across 8 runs hit this same refusal 22 times.
- **Why it breaks play.** The spring's defining act is the father going to Houston while the family runs. For such a family every
  Scrape decision is dead. The refusal text points at the soldier, not at the star, and "¡Alto!" turns silently into capture. The
  overtaken glory penalty is also charged to the serving father (sim/road.mjs, `awardGlory` with `mainPersonId`).
- **Direction.** Make `mainPersonId` skip `service.status` 'serving' or 'prisoner', and the page will follow it. Or resolve flight and
  road actions to any free person travelling with the family.

## Serious

### S1. Anybody away when the family leaves is left behind, with no word and no way offered to follow

- **Repro.** Take `spring()`, family hh-1. At the order (tick 861), send the 15-year-old son to Gonzales, then `flee` through the father.
  The son arrives at Gonzales at tick 867 and is still standing there, resting, at tick 1262. The family has reached San Felipe.
- **What happens.**
  - `flee` takes only `atHome` people who are not on a journey (sim/scrape.mjs:310), and `turnHome` does the same at the refuge.
    Anybody on a journey or in town is left: an errand to town, off-land timber, a visit, a man coming home from the army.
  - Nothing is recorded about who was left, and nothing sends them after the family.
  - Men who leave Houston with the word of Goliad (HOUSTON_CAMP.md: *"left the army to see to their families"*), and men the family
    sends for, walk to the **empty farm** (sim/winter.mjs:208, `homeSiteId`). They do not go to where the family is.
- **Fuzz.** In 8 fuzzed Scrapes, a member was still at the home site while the family was on the road or at its refuge in about 1
  family in 8. Two of them were then **taken prisoner at home** by foragers, among them hh-5's father, released from the army.
- **Why it breaks play.** The errand to town and the call to the army are core loops, and the order to leave comes whenever the
  word does. A student loses a child for the whole spring without being told.
- **Direction.** While the family is fled or refuged, have anybody who comes home, or is recalled, go on to the family's refuge by
  their own road, and record who was left.

### S2. Foragers and the enemy at home take every person prisoner at 50% each: babies, small children and women, independently

- **Repro.** Take `spring()`, set hh-3 to `flight.status 'stayed'`, and call `burnByForagers(w, h, {columnId:'sesma'}, {name:"Sesma's column"})`.
  - hh-3: the father, the mother, the 13-, 12- and 10-year-olds **and the 0-year-old baby** are taken. The 7-, 5- and 2-year-olds are
    left at the ashes.
  - hh-4: the 1-year-old is taken and both parents are left.
  - hh-8: the mother is taken and the 1-year-old stays, crawling.
- **What happens.** sim/scrape.mjs:246-252 (`burnByForagers`) and the invented-map equivalent near :497 roll `CAPTURED_AT_HOME` (0.5)
  separately for every person at home, whatever their age or sex. `overtake` on the road takes only grown men (sim/road.mjs:442), and the
  owner's firing rule spares women and children.
- **Why it breaks play.** Babies are separated from their mothers and families are left with children only (S3). Two systems
  disagree about whom the Mexican army takes.
- **Direction.** Use `overtake`'s rule (grown men only, the rest let go), and never split a baby from its carer.

### S3. A family with only children under ten left can do nothing, and nothing prevents it happening

- **Repro.** Take `spring()`, family hh-3, and mark everyone aged 10 or more captured (S2 produces exactly this).
  - Ordered out, every child's `flee` is refused: *"Rufino is too young to be sent."*
  - The page's main person falls back to the captured principal: `mainPersonId` is null, so `mainId` is absent. The principal's actions
    answer *"This person cannot act."*
  - After a day auto packs the wagon. The 7-, 5-, 2- and 0-year-olds go about 150 miles alone to Washington, and there the 2-year-old
    dies of the whooping cough.
- **Also reached by the owner's own rule.** A lone parent is half the time a father (sim/family.mjs:389, rolls 1-3). He can turn out,
  enlist or join Houston and leave children of 2 to 9 alone at home for weeks. hh-4 with the mother dead: the girls of 4 and 3 were
  alone from tick 860 to 1223, and then fled by themselves. Only babies are protected (`takeBabyAlong`), and that makes S4 instead.
- **Why it breaks play.** A student with no orderable person has no game, and the page gives them no way forward.
- **Direction.** Add a guardian rule: the last grown person at home cannot be sent away from children under ten, as with babies, except
  to the refuge. A children-only family gets a neighbour or relative, or is run by the director with a plain line to the student.

### S4. The last grown person at home carries the baby into the army

- **Repro.** Take `spring()`, family hh-4. Set the mother dead, then send the father `join-houston`.
  - At tick 861 the baby is carried (`carriedBy` the father).
  - It marches with Houston's army by Columbus crossing, Groce's, McCarley's and Burnett's.
  - It is set down at Lynchburg only because that happens to be the family's refuge.
  - At the word of San Jacinto he takes it up again: *"Elias took Rosa with them on their hip: there is nobody grown at home."*
- **What happens.** `takeBabyAlong` runs in `beginTravel` for every purpose, including `march`, enlisting and turning out
  (sim/babies.mjs:47, sim/world.mjs:440). `carryBabies` sets a baby down only when its carrier is at `placeOf(household)`. With a
  different refuge the baby would stand in the line at San Jacinto.
- **Direction.** Take the baby along only on journeys that come home, and refuse service to the last carer (see S3).

### S5. The man driving the wagon the small children ride in is fired on

- **Repro.** `sceneFor(spring(), {kind:'cavalry', how:'wagon', ahead:1.2, householdId:X})`, then answer "run". The shots fired:
  - hh-4 (the father drives; the girls of 4 and 3 ride; the baby is carried by the mother): **3 of 8 shots at the father**.
  - hh-1: 2 of 8.
  - hh-3: 3 of 7.
- **What happens.** `targetsOf` (sim/pursuit.mjs:62-72) spares a man whose `travel.rides` is a vehicle the women and children ride.
  The driver has `travel.drives`, so he is never spared. The owner's answer (2026-09-27) was *never … a man riding in the wagon or cart
  the women and children ride in*. A grown person hit is killed one time in five.
- **Direction.** Count `drives` as well as `rides` when deciding who is "with them".

### S6. A person "too sick to get up" keeps working, gets up to hold the baby, and is stopped by a child with nothing to do

- **Repro, working.** In a settled colonies world, set the father to `practise-shooting`, then make him very sick (`grave: true`). He goes
  on "shooting at the mark" for 6 ticks at activity `work`, and uses 2 powder.
- **Repro, the baby and the child.** In the babies test's family, make the mother very sick and let the baby cry. She takes it up
  (*"Hush now. Hush."*). The idle 6-year-old then goes to her too.
- **What happens.**
  - `sickRefusal` and `grave` are checked only when work or a journey begins (sim/chores.mjs:1330, sim/world.mjs:376).
  - `advanceChores` does not stop work in hand when a person turns very sick, and `activityOf` → `work` weights the day's death roll
    (`riskWeight`). A days-long chore (a house, clearing) runs on.
  - `whoComes` (sim/babies.mjs:124) and `talkTarget` (sim/childhood.mjs:167) do not skip the very sick.
- **Direction.** When a person turns very sick, stand or drop their chore. Skip `health.grave` in `whoComes` and `talkTarget`.

## Minor

### M1. One-tick contradictions from the tick order: the dead and the taken still talk and hum

- **Repro.** Take `spring()`, family hh-3. The mother is holding the baby and then talking with three idle children. She dies of
  sickness (`sicknessDay`, the path `advanceDisease` takes). That tick's projection shows **the dead mother replying**: *"I am watching.
  Now let me be."*
- **What happens.** `advanceDisease`, `advanceFlight` (captures at home) and `advanceDirectors` run after `advanceChildhood` and
  `advanceBabies`. `die` (sim/disease.mjs:377) and the captures do not call `leaveAside` or `endTalk`. `talkLines` and `babyLines` do
  not filter the gone. `validateWorld` accepts a dead person with `aside`.
- **The same shape elsewhere.** `flee`'s `setOut` and the army's march do not go through `beginTravel`, so a child is "talking with" a
  parent on the road for one tick. The fuzz saw this 8 times.
- **Direction.** Have death and capture let go of the family's little ones, and filter the gone out of both line builders.

### M2. After being overtaken or leaving the wagon, people keep seats on beasts they no longer have

- **Repro.** `sceneFor(..., {how:'mounted', householdId:'hh-4'})`, then answer "halt". The horses are "taken", with the column at
  Harrisburg. The mother and daughters still have `saddle: true, rides: <horse>`, so `inTheSaddle` (public/motion.js:140) draws them
  mounted.
- **Wagon repro.** `how:'wagon'`, hh-3: the 10-, 7-, 5- (sick) and 2-year-olds keep `rides: hh-3-wagon`.
- **Effect.** `activityOf` gives them `ride`, so they mend as riders and are not tired as walkers. The 2-year-old walks at the grown
  pace. `overtake` and `abandonWagon` (sim/road.mjs:446, :397) only set the mode and speed.
- **Direction.** Replan the seats (`setOut`) after either.

### M3. A lamed ox or horse is lamed only while that chase lasts

- **Code.** `beast.hurt` is read only in sim/pursuit.mjs.
- **Effect.** `riddenHorses` (sim/company.mjs:87) checks only `condition === 'sound'`, so a horse *"lamed: nobody can ride it"* is ridden
  on the next leg and home. The lamed ox's half pace is overwritten by the next leg, the ox's rest or `setPace`. Neither heals.

### M4. A man wounded in a chase is left at the refuge when the family turns home

- **Repro.** hh-1 refuged at Nacogdoches, the father wounded as `strike` writes it (`WOUND_DAYS` 21). At the word of San Jacinto the rest
  go home and he stays (`turnHome` excludes the wounded, sim/scrape.mjs:515).
- **Why only minor.** The class ends a few ticks later, so this mostly shows in the ending.

### M5. The family's record repeats itself

- **The danger warning.** *"Word along the road: Sesma's column is about 20 miles off…"* was written three times in nine ticks, as the
  danger toggled at the edge of the warning range (sim/road.mjs:514-524).
- **Children alone at home.** A child alone writes *"… set out: play as they please"* every 8 ticks or so. There were more than 60 such
  lines for the hh-4 girls. The `firstToday` guard covers only the "alone" line, not `beginChore`'s own.

---

## Checked and clean

- **Save and reload.** The world was round-tripped through JSON with `deriveUses`, `openSouth` and `openAdvancePlaces`, as
  server/storage.mjs `readSave` does. At 28 checkpoints of a fuzzed Scrape, and mid-chase in cavalry/wagon, infantry/mounted and
  infantry/wagon, stepping the reloaded copy and the live copy alike gave **zero divergence**.
- **Invariants.** `validateWorld` passed on every tick of 8 fuzzed Scrapes of about 900 to 1,000 ticks each, from tick 860 to the ending.
  In each, every family was played and a random student gave random orders, answers, auto switches and main-person choices.
- **Projections.** No NaN, `undefined` or "undefined" text appeared in any student or Host projection, checked every 5th tick.
- **Nobody in two places.** No person was travelling while also at a site. No carried baby was ever more than 0.01 mile from its
  carrier.
- **Cross-family knowledge.** No other family's health, work, sickness, talk or babies, and no private event, appeared in a student
  projection mid-Scrape.
- **A family with nobody left.** hh-7 dead: stepped to the ending, and every projection and the ending held.
- **The family of twenty.** hh-8 at Liberty has no refuge east, so it can go only by its own route. That is documented.
- **The chase matrix.** 96 scenes (cavalry and infantry, wagon, foot and mounted, four distances, four families) raised no invariant
  or projection failure.

_Probe scripts were kept out of the tree (`.probe/`, not committed). Every repro above is a few lines on the two fixtures named at
the top._
