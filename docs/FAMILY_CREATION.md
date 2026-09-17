# Rolling a family

**Status: decided; steps 1, 3 and 4 built 2026-09-12** ([roll](evidence/family-roll.json), [effects and who answers](evidence/family-effects.json)). Step 2 needs art and step 5 needs a battle where people died; §6 says what each needs. Read this in full before
changing `sim/family.mjs`, the join flow, chores that depend on who does them, or anything that
decides who can be sent to fight.

---

## 1. What the owner asked for

> "when joining a game, players should be able to create their own family. they should be given
> dice to roll digitally. each family will start with a minimum of one parent. when they roll for
> family size they have to roll a four or greater to get both parents. three or less leaves the
> family with one parent and the associated number of kids. more than four are children. this
> won't be explained, rather a hidden stat. men are stronger and have more hp, thus making them
> the logical choice to send to battle. ages of children are decided randomly, but it has to make
> sense with how old the parents are. women should also be given an advantage that makes them
> naturally better at housework and less likely for them to be sent to battle. these will be
> hidden stats. players can choose to send the famiky's mom into battle for example. but it'll be
> a death sentence."
>
> — 2026-09-12

The owner then answered four questions the same day:

| Question | Owner's answer |
| --- | --- |
| How does the roll work? | ~~**The number rolled is the family's size.** One six-sided die.~~ **Amended 2026-09-14** (below). |
| Sending somebody badly suited to fight | **Hidden, and very likely fatal** — no warning, and not quite certain. |
| The hidden stats | **Different on average by sex, and dealt per person**, so an occasional mother is a good shot and an occasional father poor at housework. |
| Who can be sent to fight | **Parents, and children aged 16 or over.** |

---

## 2. The roll

**Amended by the owner, 2026-09-14:** *"when rolling for a family, it should be a 20 sided die."* Asked what the twenty faces
decide, the owner chose **bigger frontier families** and **fewer lone parents**:

| Roll (d20) | Parents | Children |
| --- | --- | --- |
| 1 | 1 | 0 |
| 2 | 1 | 1 |
| 3 | 1 | 2 |
| 4 | 1 | 3 |
| 5 | 1 | 4 |
| 6 | 2 | 0 |
| 7–8 | 2 | 1 |
| 9–10 | 2 | 2 |
| 11–13 | 2 | 3 |
| 14–15 | 2 | 4 |
| 16–17 | 2 | 5 |
| 18 | 2 | 6 |
| 19 | 2 | 7 |
| 20 | 2 | 8 |

- A lone parent on a quarter of rolls, both parents on three quarters; a family of one to ten. Two parents have 3.6 children
  on average, three to five most often.
- **What it is set against:** a white American woman bore about 6.55 children in 1830 and 6.14 in 1840 over her life, and
  about 217 in 1,000 white infants died in their first year (1850) — Haines, *Fertility and Mortality in the United States*,
  EH.net, Table 1. Parents here are 20 to 45 and their families still growing, so three to five living children is ordinary
  and seven or eight a large family. The table itself is invented (`FIC-GONZ-021`); no count of Texas colonists' children by
  family was found.
- **Consequences that follow without new rules:** a large family eats more, packs the same wagon, and is crowded in any house
  but the dog-run (which holds eight), so nine or ten are crowded everywhere.
- A roll on the server, shown as a twenty-sided die with its number. `household.die` is 20; a class rolled before has none, and
  its number is read on the six-sided table below, so it opens as it was and no save version moved.

*The six-sided table, 2026-09-12 to 2026-09-14, kept for classes rolled then:*

| Roll | Parents | Children |
| --- | --- | --- |
| 1 | 1 | 0 |
| 2 | 1 | 1 |
| 3 | 1 | 2 |
| 4 | 2 | 2 |
| 5 | 2 | 3 |
| 6 | 2 | 4 |

- **The rule is never explained in the game.** The student sees the dice and then the family; how
  one became the other is theirs to notice. The number rolled is not a secret, the mapping is.
- **A lone parent is a man or a woman with equal chance.** Not asked; change it on the owner's
  say-so. A lone parent is widowed, and the game says so in the family book rather than inventing
  a reason.
- **The principal is the father when there is one, and the lone parent otherwise.** Historical
  calls are put to the principal (`sim/world.mjs`), so a lone mother is the person the neighbour
  asks.
- **Once, before anything else happens to the family.** Rolling replaces the default household, so
  it is refused once a family has been renamed, set to work, or sent anywhere. A student who has
  joined and not rolled when the teacher presses Start is rolled for.
- **Deterministic.** The roll comes from the world's seed and the household, so a saved class
  reloads to the same family and a headless run replays exactly. The student cannot predict it,
  which is all "rolling" has to mean.
- **Households nobody joins keep the default shape**, two parents and two children, as does every
  class saved before this existed. No save version moves.

`VISION.md` §7 said a household holds "roughly 4–7" people. A roll of 1 is a household of one, and since 2026-09-14 a roll of 20 a household of ten.
**The owner's roll amends §7**, and the amendment is recorded there.

---

## 3. Ages

Visible, in the family book beside each name. Invented (`FIC-GONZ-021`), and required to make sense:

- A parent is 20 to 45. A second parent is within eight years of the first, and never under 18.
- A child is 0 to 17, **born when the mother was at least 17 and no older than 42.** For a lone
  father the children's mother is taken to have been two years younger than him.
- Children in one family have different ages. If the parents are too young for that many children
  to fit, the parents are older — a family is never generated that could not exist.

**Under ten is too young to be sent anywhere.** A person under ten cannot be given work, answer a
call or be sent on a journey, and the control says so. Every other rule about age waits on the
owner.

---

## 4. The hidden stats

Three numbers per person. **None of them ever reaches a client** — not the student's own family, not
another family, not the Host. They are for the simulation.

| Stat | What it is | Adults, on average |
| --- | --- | --- |
| `strength` | How much a person can lift, carry and fight with | Men higher than women |
| `health` | How much harm a person can take before it kills them — the owner's "hp" | Men higher than women |
| `housework` | How well a person keeps a house: food made to last, a home run while others are away | Women higher than men |

- **Dealt per person, around a mean that differs by sex.** The spread is wide enough that the ranges
  overlap: some women are stronger than some men, and some men keep a better house than some women.
  That is the owner's decision and it is also closer to the frontier record than a fixed bonus.
- **Children's strength and health grow with age** and reach adult values at 16. Housework grows
  more slowly.
- **Every number is invented** (`FIC-GONZ-021`) and tuned for play. Nothing in the game presents them
  as a claim about men and women in general, and nothing may.
- **Hidden means asserted hidden.** The same way trade and glory isolation are proved: plant a
  distinctive value and assert it appears in no serialised student or Host payload.

### What they do

| Stat | Effect | Step |
| --- | --- | --- |
| `housework` | The best housekeeper **at home** makes the family's food last longer. A family that sends its housekeeper away eats through its store faster. | 3 |
| `strength` | Heavy farm work — breaking ground, splitting rails, carrying the harvest — goes faster for a stronger person. | 3 |
| `health` and `strength` | Whether somebody sent into a battle where people died comes back. | 5 |

"Less likely to be sent to battle" is **not** a rule that stops anybody being sent. It is what the
housework effect produces: a family that needs its housekeeper at home has a reason not to send them.

---

## 5. Who can be sent to fight, and what it costs

- **Parents, and children aged 16 or over.** A younger child cannot be sent, and the control says so.
- **The student chooses who goes.** The food call is answered by any parent or child of sixteen or more, and
  the upriver march is put to whoever carried the food (step 4, built). Since 2026-09-16 every call is answered from one
  menu with a tick beside each person who may answer (`docs/FAMILY_PANEL.md` §11.2), and a settlement's call to turn out
  can take more than one of them; the roads on an ordinary errand are the family's **main person's** (§11.3 there).
- **The risk is hidden and very likely fatal for somebody weak or frail** (owner's decision). There
  is no warning on the control and no number anywhere. The outcome is resolved from that person's
  hidden `strength` and `health` with a seeded roll: very likely death for somebody low in both,
  unlikely for somebody high in both.

### Where death can happen

**Not at Gonzales.** No Texian was killed there, `HISTORY.md` excludes casualties for that clash, and
`FIC-GONZ-005` permits only fatigue or a minor condition. The upriver march keeps its stated,
recoverable cost. **At Concepción (built 2026-09-16) the owner bounded it** (`docs/COLONIES.md` §7a): about one in a hundred for
somebody in the fight, weighted by hidden strength and health — the record's one killed of ninety-two cannot carry "very
likely fatal". **Owner's correction, 2026-09-16** (`docs/COLONIES.md` §7d): there is no limit of one death in a class; every
battle rolls each fighter on their own at its documented share of killed and wounded, rounded (Concepción 1 and 2 in 100,
the storming of Béxar 2 and 8 in 100), so a deadly battle can take several of a class. Lethal risk belongs to battles where people did die — Béxar (built 2026-09-16), the Alamo, Goliad,
San Jacinto — and the last three do not exist yet. **Step 5 is therefore specified here and cannot be built until
the first of those arcs is.**

### This amends the project's rules, and the amendment is recorded

`FIC-GONZ-008` requires an outcome to resolve inside a risk the student could see before committing,
and `LIVING_INFORMATION.md` says hidden punitive randomness cannot manufacture the desired emotional
arc. A hidden, randomly resolved, very likely fatal risk is both, by the letter. **The owner chose it
on 2026-09-12**, and `VISION.md` §16 carries the amendment. What still binds:

- **No gore.** A death is reported, not shown (§16).
- **Glory never rewards it.** A casualty earns nothing beyond participation
  (`docs/MONEY_AND_GLORY.md` §4).
- **The epilogue tells it with dignity.** A family that lost a mother in a battle has that in its
  story, not as a punishment for a wrong answer.
- **It is the family's choice.** Nothing forces or nags a family to send anybody (§11).
- **A horse can die too** (owner, 2026-09-12). A horse taken into such a battle faces the same hidden,
  very likely fatal risk. A family that loses one goes without — slower on the road, less carried — or
  buys another in town, for coin (`docs/MONEY_AND_GLORY.md` §3). At Gonzales, as with people, nothing
  happens to it.

---

## 5a. What the parents look like (owner, 2026-09-12)

> "players sbould also get to choose what the parent(s) of their family look like. the children should be automated based on the parental choices."

Specified with the settling-in chapter, in [SETTLING_IN.md](SETTLING_IN.md) §7: the student chooses each parent's skin tone, hair colour, clothing colour and a hat, beard, bonnet or pinned hair; children are generated from the parents; appearance changes nothing else and is tested to; it needs layered people art, with a stand-in until then.

## 6. Build order

Each step is shippable and provable alone.

1. ~~**The roll and the family it makes.**~~ **Done 2026-09-12.** Dice in the lobby; composition, sexes, ages, names and kin
   from the roll; hidden stats dealt and asserted absent from every payload; the under-ten rule; the
   family book shows roles and ages. Unjoined households and old saves keep the default shape.
2. **Children drawn as children.** *Stand-in in place 2026-09-12:* figures are chosen by sex and age from the existing cast and children are drawn smaller by age (see [ART_REQUESTS.md](ART_REQUESTS.md) *Stand-ins in use*). Needs art: the renderer has one adult figure and no way to tell
   men, women or children apart. **Requested from Astra 2026-09-12** in [ART_REQUESTS.md](ART_REQUESTS.md): children, a second cast
   with a woman in the principal's rust, and what Claude wires on delivery.
3. ~~**Stats take effect at home.**~~ **Done 2026-09-12:** the best housekeeper at home cuts what the family eats by up to a quarter; strength scales heavy work from three quarters to one and a quarter of its time. Housework stretches food; strength speeds heavy work. Balanced so
   a household of one can still survive the afternoon.
4. ~~**The family chooses who answers a call.**~~ **Done 2026-09-12:** the food call and the rumor question show on every parent and child of sixteen or more, and the march is put to whoever carried the food. Any parent or child 16+, for the food call and the
   upriver march.
5. **Lethal risk in battle.** Hidden, seeded, from `strength` and `health`. Blocked until a battle
   where people died exists.

## 7. Gates

| Gate | What it means |
| --- | --- |
| The roll decides the family | Every roll 1–20 produces exactly the parents and children in §2 (and a class rolled on six sides still reads its old table), and the rule appears nowhere a student can read it. |
| Families that could exist | No child is older than a mother could have borne; no two children share an age; no parent is under 18. Checked over every seed a test can afford. |
| Hidden means hidden | A planted `strength`, `health` and `housework` appear in no student and no Host payload at any tick. |
| Averages differ, people overlap | Over a large sample, men average higher strength and health and women higher housework, **and** some woman is stronger than some man and some man keeps a better house than some woman. |
| Once, first | Rolling is refused after a rename, a chore or a journey, and is not offered twice. |
| Old classes open | A class saved before this opens with four people per household and no save version moves. |
| No death at Gonzales | Nothing in the Gonzales slice can kill anybody, whoever is sent. |
| Claims registered | Ages, stat means and spreads, and the lethality rule carry `FIC-GONZ-021`. |

## Amendment, 2026-09-16 — who is sent to the fighting

**Owner:** *"Women did not participate in battle. Actual combat shouldn't be a presented option for them."* Who may answer
a call is unchanged (a parent, or a son or daughter of sixteen or more, `canAnswerCalls`); who may be sent **to the
fighting** is a father or a son of sixteen or more (`canFight` in `sim/family.mjs`): turning out for a settlement's
force, riding upriver to Gonzales, enlisting in the regular army or the auxiliary volunteers, the garrison at Béxar, the
Matamoros expedition, the relief of the Alamo and Houston's army. A mother or a grown daughter is refused each in words on
the control and can still go to see, help at a gathering, take the family's goods to town, hunt, and lead the family east.
This supersedes the glory penalty for a woman sent to fight (`docs/MONEY_AND_GLORY.md` §4). Tests `tests/women.test.mjs`
(four, each proven by injection).