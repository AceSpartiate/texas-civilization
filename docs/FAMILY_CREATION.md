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
| How does the roll work? | **The number rolled is the family's size.** One six-sided die. |
| Sending somebody badly suited to fight | **Hidden, and very likely fatal** — no warning, and not quite certain. |
| The hidden stats | **Different on average by sex, and dealt per person**, so an occasional mother is a good shot and an occasional father poor at housework. |
| Who can be sent to fight | **Parents, and children aged 16 or over.** |

---

## 2. The roll

One die, rolled on the server when the student asks to roll, shown to them as dice.

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

`VISION.md` §7 said a household holds "roughly 4–7" people. A roll of 1 is a household of one.
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
  the upriver march is put to whoever carried the food (step 4, built).
- **The risk is hidden and very likely fatal for somebody weak or frail** (owner's decision). There
  is no warning on the control and no number anywhere. The outcome is resolved from that person's
  hidden `strength` and `health` with a seeded roll: very likely death for somebody low in both,
  unlikely for somebody high in both.

### Where death can happen

**Not at Gonzales.** No Texian was killed there, `HISTORY.md` excludes casualties for that clash, and
`FIC-GONZ-005` permits only fatigue or a minor condition. The upriver march keeps its stated,
recoverable cost. Lethal risk belongs to battles where people did die — Béxar, the Alamo, Goliad,
San Jacinto — none of which exist yet. **Step 5 is therefore specified here and cannot be built until
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

---

## 6. Build order

Each step is shippable and provable alone.

1. ~~**The roll and the family it makes.**~~ **Done 2026-09-12.** Dice in the lobby; composition, sexes, ages, names and kin
   from the roll; hidden stats dealt and asserted absent from every payload; the under-ten rule; the
   family book shows roles and ages. Unjoined households and old saves keep the default shape.
2. **Children drawn as children.** Needs art: the renderer has one adult figure and no way to tell
   men, women or children apart. **Ask Astra** for child walk/idle/work cycles and distinguishable
   adult men and women, in the existing variants.
3. ~~**Stats take effect at home.**~~ **Done 2026-09-12:** the best housekeeper at home cuts what the family eats by up to a quarter; strength scales heavy work from three quarters to one and a quarter of its time. Housework stretches food; strength speeds heavy work. Balanced so
   a household of one can still survive the afternoon.
4. ~~**The family chooses who answers a call.**~~ **Done 2026-09-12:** the food call and the rumor question show on every parent and child of sixteen or more, and the march is put to whoever carried the food. Any parent or child 16+, for the food call and the
   upriver march.
5. **Lethal risk in battle.** Hidden, seeded, from `strength` and `health`. Blocked until a battle
   where people died exists.

## 7. Gates

| Gate | What it means |
| --- | --- |
| The roll is the size | Every roll 1–6 produces exactly the parents and children in §2, and the rule appears nowhere a student can read it. |
| Families that could exist | No child is older than a mother could have borne; no two children share an age; no parent is under 18. Checked over every seed a test can afford. |
| Hidden means hidden | A planted `strength`, `health` and `housework` appear in no student and no Host payload at any tick. |
| Averages differ, people overlap | Over a large sample, men average higher strength and health and women higher housework, **and** some woman is stronger than some man and some man keeps a better house than some woman. |
| Once, first | Rolling is refused after a rename, a chore or a journey, and is not offered twice. |
| Old classes open | A class saved before this opens with four people per household and no save version moves. |
| No death at Gonzales | Nothing in the Gonzales slice can kill anybody, whoever is sent. |
| Claims registered | Ages, stat means and spreads, and the lethality rule carry `FIC-GONZ-021`. |
