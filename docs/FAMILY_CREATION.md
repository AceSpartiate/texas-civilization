# Rolling a family

**Status: decided; steps 1, 3 and 4 built 2026-09-12** ([roll](evidence/family-roll.json), [effects and who answers](evidence/family-effects.json)). Step 2 needs art and step 5 needs a battle where people died; §6 says what each needs. Read this in full before
changing `sim/family.mjs`, the join flow, chores that depend on who does them, or anything that
decides who can be sent to fight.

**Since 2026-09-25 the die is thrown with a second one, for the family's means** (the amendment at the foot of this file, `sim/means.mjs`).

**Since 2026-09-29 a family has a start as well** - Anglo-American, Tejano at Victoria, or free Black near Liberty - dealt with its land, and its parents' skin tones are locked to the start's range (the last amendment, *The family's start*; `sim/starts.mjs`).

**The words on the wizard's screens were reviewed 2026-09-21** — the amendment at the foot of this file is the record of
what each screen must say, and `tests/creation-words.test.mjs` holds it. Read it before changing a sentence on
`#family-roll`, `#surname`, `#names`, `#looks` or `#wagon-load`.

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
| How does the roll work? | **The number rolled is the family's size.** One six-sided die. **Amended 2026-09-14** to twenty sides and a table of set families, and **2026-09-22** back to the size, on twenty sides (§2). |
| Sending somebody badly suited to fight | **Hidden, and very likely fatal** — no warning, and not quite certain. |
| The hidden stats | **Different on average by sex, and dealt per person**, so an occasional mother is a good shot and an occasional father poor at housework. |
| Who can be sent to fight | **Parents, and children aged 16 or over.** |

---

## 2. The roll

**Amended by the owner, 2026-09-22:** *"change the family rolls. if i roll a 20, there should be 18 kids. if i roll a 4 it's
two parents and 2 kids. each number over 4 is another kid."* Asked by multiple choice what a 1, 2 and 3 make, the owner chose
**"The roll is the family"**: the number rolled is how many people there are. It is the owner's first rule of 2026-09-12
(*"three or less leaves the family with one parent and the associated number of kids"*) carried up the twenty-sided die.

| Roll (d20) | Parents | Children | People |
| --- | --- | --- | --- |
| 1 | 1 | 0 | 1 |
| 2 | 1 | 1 | 2 |
| 3 | 1 | 2 | 3 |
| 4 | 2 | 2 | 4 |
| 5 | 2 | 3 | 5 |
| 6–19 | 2 | roll − 2 | the roll |
| 20 | 2 | 18 | 20 |

- **What it makes.** A lone parent on three rolls in twenty, both parents on seventeen; a family of one to twenty, ten and a
  half on average. Two parents have ten children on average, and seven rolls in twenty (14–20) give them twelve or more.
- **What it is set against, said plainly.** A white American woman bore about 6.55 children in 1830 and 6.14 in 1840 over her
  whole life, and about 217 in 1,000 white infants died in their first year (1850) — Haines, *Fertility and Mortality in the
  United States*, EH.net, Table 1. So a family of that time with its children still growing had three to five living at
  once, and seven or eight was a large family. **Ten or more children at home, which this table gives on about half its rolls,
  was rare; eighteen, all living and all under eighteen, is far outside anything the record describes.** It needs a birth
  every year for eighteen years and no child lost. The table is the owner's, for play, and is registered as invented
  (`FIC-GONZ-350`); nothing in the game presents it as what Texas families were. No count of Texas colonists' children by
  family was found.
- **Ages for a large family (§3, amended twice the same day).** *First:* eighteen different ages from 0 to 17, one child a
  year, to a mother of 34 to 42 (`FIC-GONZ-351`). *Then, on the owner's decisions of the same day* (the amendment of
  2026-09-22 at the foot of this file): births come at their own spacing and twins are possible, so eighteen births take
  about twenty years. **A 20 now makes the eldest 18 to 22, grown and still at home, the youngest a baby or small child,
  births fourteen to sixteen months apart on average and never evenly, a mother of 37 to 42 and a father of 41 to 45**, and
  twins in about one family in six (`FIC-GONZ-361` to `-363`).
- **Consequences that follow without new rules, stated rather than hidden:**
  - *More people who can be sent to fight.* Every child of sixteen or more may answer a call, and a son of sixteen or more may
    be sent to the fighting (§5). Since the second amendment a 20 has five to eight children of sixteen or more — about two
    and a half sons on average, from none to six — where it had exactly two (a sixteen- and a seventeen-year-old).
  - *More hands, and more mouths.* **Since 2026-09-22 a child eats by age** — a quarter, a half or three quarters of a grown
    share (the amendment at the foot of this file) — so a large family of young children eats well under its head count.
    Everybody of ten or more can be given the family's whole work.
  - ~~*The same wagon.* A large family packs the same wagon and brings the same stock (`docs/STOCK.md`) as a family of one.~~
    **Amended by the owner, 2026-09-25** (docs/SETTLING_IN.md §4a): *more wagons*. A family of nine to sixteen comes with two
    wagons and seventeen to twenty with three, an ox to each, and packs a wagon's worth of stores to each wagon. It still brings
    the same stock and the same one horse. **Amended again later on 2026-09-25** (the amendment at the foot of this file): in a
    class made since, the wagons come from the family's **means**, rolled on a second die, not from its size, and a large family
    with too few seats walks beside them (SETTLING_IN.md §4b).
  - *Crowded houses.* The four set houses hold three (jacal), four (the cabins) and eight (the dog-run), so a family of nine or
    more is crowded in every one of them, and sleeps at 80 in 100 of the rest a house gives (`CROWDED_SHARE`). A class that
    builds from pieces (`docs/WOODS_AND_BUILDING.md`) can build room for twenty on its plot — three log pens with lofts and a
    shed room, or four pens with lofts — at the logs and hours those pieces state.
  - *Longer lists.* The family panel scrolls down the left for twenty rows; every child is on it, and the tick sent to a
    family of twenty is about three times a family of four's (measured in `tests/family-roll.test.mjs`). `npm run
    test:family-twenty` ([record](evidence/family-twenty-browser.json)) shows the names card's twenty boxes and its Continue,
    and the panel scrolling to the youngest child with the map still on top, at 1366×768 and at a 400 px phone.
- **Evidence.** `node scripts/family-roll-injections.mjs`: 12 of 12 caught (24 of 24 since the amendment of 2026-09-22 at the foot) ([record](evidence/family-roll-injections.json)).
- A roll on the server, shown as a twenty-sided die with its number. `household.die` is 20 and `household.rollTable` is
  `'d20-size'`. A class rolled on the 2026-09-14 table below has `die` 20 and no `rollTable`, and a class rolled on six sides
  has neither; each is read on its own table (`tableOf` in `sim/family.mjs`), so every saved class opens as it was and no save
  version moved.

*The 2026-09-14 table, kept for classes rolled on it until 2026-09-22:* the owner said *"when rolling for a family, it should
be a 20 sided die"*, and asked what the twenty faces decide, chose **bigger frontier families** and **fewer lone parents**:

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

- On that table: a lone parent on a quarter of rolls, both parents on three quarters; a family of one to ten. Two parents had
  3.6 children on average, three to five most often — set against the same Haines figures, the ordinary living family of the
  time. `household.die` is 20 and there is no `rollTable`. The table was invented (`FIC-GONZ-021`).

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

`VISION.md` §7 said a household holds "roughly 4–7" people. A roll of 1 is a household of one; from 2026-09-14 a roll of 20 was a household of ten, and since 2026-09-22 it is a household of twenty.
**The owner's roll amends §7**, and the amendment is recorded there.

---

## 3. Ages

Visible, in the family book beside each name. Invented (`FIC-GONZ-021`), and required to make sense:

- A parent is 20 to 45. A second parent is within eight years of the first, and never under 18.
- A child is 0 to 17, **born when the mother was at least 17 and no older than 42.** For a lone
  father the children's mother is taken to have been two years younger than him.
- Children in one family have different ages. If the parents are too young for that many children
  to fit, the parents are older — a family is never generated that could not exist.
- **Amended 2026-09-22, for the eighteen children a 20 now makes** (`FIC-GONZ-351`): if the parents are too *old* for that
  many different ages to fit between the mother's 17th and 42nd years, both are made younger by the same amount; and a
  father is at least **18 at every child's birth** — checked only of the mother before, which a family of two or three never
  showed, but eighteen children to a mother of 34 and a father of 26 would have made him nine at the eldest's. Where he is
  too young, he alone is made older, to a year older than the mother at most, so the two stay within eight years. A 20 is
  therefore always children aged 17 down to 0, one a year, to a mother of 34 to 42. Twins were considered and not used:
  the rule that no two children share an age holds for every roll.
- **Amended again 2026-09-22, on the owner's decisions** (`FIC-GONZ-361` to `-363`; the amendment at the foot of this file
  says it in full). *Superseding the bullet above and "children in one family have different ages" for every new roll:*
  everybody has a birth date; births follow each other by 1.4 to 3 years, never closer than about ten months; one birth in a
  hundred is twins; and in a family whose births will not fit in eighteen years at that spacing, the eldest may be grown,
  18 to 22, and still at home. The mother's 17 to 42 and the father's 18 or more hold at every birth, reckoned date to date.
  A family rolled before keeps the ages it was dealt.

**Under ten is too young to be sent anywhere.** A person under ten cannot be given work, answer a
call or be sent on a journey, and the control says so. Every other rule about age waits on the
owner.

> **Amended 2026-09-21 — the first third of that rule is gone. See the amendment at the foot of this file,
> *What a child under ten can be set to*.** A child under ten now has works of their own — play, and five small jobs at
> the house — and the other two thirds stand: not on a road, and not to answer for the family.

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

- **Parents, and children aged 16 or over.** A younger child cannot be sent, and the control says so. **The owner kept the
  fighting age at 16 on 2026-09-27**, by multiple choice, when asked again; nothing changed.
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
| The roll decides the family | Every roll 1–20 produces exactly the parents and children in §2 (and a class rolled on the 2026-09-14 faces or on six sides still reads its own table), and the rule appears nowhere a student can read it. |
| Families that could exist | No child is older than a mother could have borne or a father of eighteen could have fathered; no two children share an age; no parent is under 18. Checked over every seed a test can afford, and a 20 checked on its own. |
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

## Amendment, 2026-09-17 — the family's last name and how the parents look, asked for after the roll

**Owner:** *"After rolling for a family, the player should see an interface pop up and ask them to name their family. It
shouldn't say 'Our family is called' it should say 'Family Last Name' and that last name should be added to the members of
the family as such."* Then: *"The How We Look section should have images for each section too. This should appear next. If
this is done correctly, we shouldn't need the Family button at the bottom any more."* Decided by multiple choice:

| Question | Decision |
| --- | --- |
| How the last name is kept | Separately: `household.surname`, and each person's first name as `entity.given`; `entity.name` is the two together, so every sentence in the game says "Tomás García". Renaming a person on the panel changes only the first name (`sim/family.mjs` `nameFamily`, `rename`). |
| What the class sees | "the García family" (`householdName`); a heading capitalises it. |
| The pop-ups | Required: the "Family Last Name" box comes up once *Meet your family* is pressed and cannot be closed until it is answered; then How We Look for each parent in turn, with every choice already set to the dealt default, so Done is enough. The class goes on underneath. |
| The pictures | A head-and-shoulders picture on every option and a larger one of the whole choice, drawn by Claude (`public/looks-art.js`, `stand-in:`; docs/ART_REQUESTS.md). |
| Changing them later | First names on the family panel only. The last name and the looks are set once (refused in words afterwards). |
| The journal | Keeps the news, belongings, neighbours, key and story; its "Who we are" says who is whose in sentences and edits nothing; the button reads **Journal**. |

A class saved before this keeps any family name it had; a rolled family with no name is asked the next time its page opens.
The director's families are not named. Tests `tests/surname.test.mjs` (4) and `tests/appearance.test.mjs`, each rule proven
by injection; browser `npm run test:looks` (7 checks, [evidence](evidence/looks-browser.json)).

## Amendment, 2026-09-17 — the title screen, and making the family before the world is seen

**Owner:** *"the rolling for a family, naming them, choosing the looks, should all happen before the world renders. the
experience in solo vs live class should be the same. before we see the character creation interface experience, we need an
intro screen. Name it 'Family: Texas 1835/36'. the intro screen should be a professional game introduction experience."*

`public/creation.js` puts one curtain over the page and walks five steps on it, the same in a class and in Play Solo
(`creationStep`, `tests/creation.test.mjs`, `scripts/looks-browser-proof.mjs`):

| Step | What is asked | Where |
| --- | --- | --- |
| Title | **Family: Texas 1835/36** over a painted frontier scene (`public/assets/creation-title-landscape.png`), with the class's join form on it, or **Make my family** for a page that arrives already joined | `#creation`, `#creation-begin` |
| The die | The twenty-sided die and *Meet your family*, as before | `#family-roll` |
| The last name | **Family Last Name**; everybody in the family carries it | `#surname` |
| Their names | Everybody on one card, filled in with the names the game dealt, kept or changed, and one **Continue** | `#names` |
| How they look | Each parent in turn, a picture on every choice; children take after their parents and are not asked | `#looks` |
| The family's key (added 2026-09-29, triage 2.4) | Shown **once, large**, with what it is for: *"This key brings you back to your family on any Chromebook…"*, and *I have written it down*. Only in a class (Play Solo has no way back in by a key), only on the page that made the family, and never again once put away; it stays in the journal | `#key-card` |

**The map is not drawn at all while the curtain is up** (`public/app.js` skips `drawWorld`), which is also what a slow
computer wants. Play Solo no longer rolls the family for the player: it deals the game running and leaves the die
(`newSoloGame` in `server/app.mjs`), which `rollRefusal` now allows for a family somebody plays that has never rolled. A
page opened later - another tab, another day - sees the title screen and then the world: a family whose parents have been
chosen for is already made. A family that has not rolled and may not, because the class began without it, waits in the
world as it always did and is asked its last name as soon as Start has rolled it.

`ceiling:` how far a page has got is kept in that tab's own `sessionStorage`, so the title screen shows again in a new tab;
the steps behind it do not.

## Amendment, 2026-09-18 — Play Solo holds its clock until the family is made

**Owner**, by multiple choice: *hold* - over letting a Solo family roll at any time. The world writes a family's arrival into
its record on the second tick, and `rollRefusal` closes the die once anything but the founding is there; a Play Solo page
slower than two ticks to open (a slow laptop, found by the navigation proof throttled 6x) was never offered the die, and its
family went on unrolled.

`familyMaking` (`sim/family.mjs`) is true while the player's family is still to be made and may yet be: not rolled but free
to roll, or rolled and without its last name, or with a parent whose looks are not chosen - what the curtain asks, less the
names card, which keeps the dealt names if nothing is changed. While it is, `tick` in `server/app.mjs` does not step a Play
Solo world at all, the neighbours included, as a class waits in its lobby; the status stays `running`, so the die, the name
and the looks are all taken. A class is unchanged: its Host's Start rolls every joined family that never rolled.

A family that has not rolled and can no longer - a Solo game kept from before the hold - is not held, or that world would
never move. `tests/solo.test.mjs` (the hold, and the family that cannot be made) and `npm run test:solo` (tick 0 after two
study-pace ticks and more, the die still offered, then the world going on once the family is made) each failed with the hold
taken out.

## Amendment, 2026-09-21 — the words and the choices of the wizard

The opening tutorial was repaired on 2026-09-21 ([TUTORIAL_USABILITY_HANDOFF.md](TUTORIAL_USABILITY_HANDOFF.md)) and its
last line said the wizard still had to be reviewed. This is that review, held to the same rule:

> The screen may not name a thing it cannot point at, may not rely on a prerequisite it has not said out loud, and may not
> say anything the simulation does not actually do.

**The five-step order is untouched** (title, die, last name, first names, looks) — it is the owner's, 2026-09-17. No rule
of the simulation moved, no number moved, and no save version moved. What changed is what the screen says, and one thing
the server sends so the screen can say it. Claims `FIC-GONZ-240` and `-241`.

### What was wrong, and what each screen says now

| Where | What was wrong | What it says now |
| --- | --- | --- |
| `#creation-begin` | *"After that the country is yours to work: the field, the timber, the town."* **Untrue since the day before**: `lessonRefusal` refuses every order that is not the family's current step, and the town is the eighth of ten. | The four steps of making the family, then: the game walks you through the farm one task at a time and will not let you jump ahead; the country is yours once that is done. The wagon is not promised here, because Play Solo has no wagon panel (below). |
| `#family-roll` | Eyebrow **BEFORE THE CLASS BEGINS** — there is no class in Play Solo, where the die is also rolled. The panel never said the roll is taken once. | **STEP 1 OF 4**; "The die decides how many are in your family and who they are. It is thrown once. There is no second roll." **The mapping is still written nowhere** (§2), and `tests/creation-words.test.mjs` refuses the words *parent*, *children* and *lone* on that panel. |

**Visual pass, 2026-09-26.** The roll screen is a 740px parchment card over the painted frontier backdrop recorded in [CREATION_ROLL_ART.md](CREATION_ROLL_ART.md). Two labelled die cards separate who the family is from what it brings; legacy single-die classes show only the first. The server's result sits below both, with one clear button. The backdrop remains while the rolled result waits, even if the underlying wizard step has advanced. The once-only rule and concealed die mapping above remain unchanged.

**Title pass, 2026-09-27.** The pre-roll step now has painted title art and a composed entry card rather than a flat canvas sketch and a paragraph-heavy box. It names all four creation steps, then leads directly to the die; the class join/rejoin cards share the same presentation. The title art's source, prompt and UI intent are in [CREATION_TITLE_ART.md](CREATION_TITLE_ART.md). This is a visual and wording change; no server roll rule or save format changed.
| `#surname` | `nameFamily` refuses a second last name and the box never said so; the list of names under the input had no label at all. | **STEP 2 OF 4**; "Everybody in the family carries it. It is chosen once and cannot be changed afterwards; first names can be changed at any time, on the family panel." The list is headed **Your family:**. |
| `#names` | Headed *"Name each of them"* over boxes that were already filled in — ten jobs where there were none. An emptied box was skipped silently, leaving a box showing a name nobody had. | "Step 3 of 4. They are already named: change any you like, or press Continue and keep them." An emptied box is put back to the dealt name. |
| `#looks` | Said appearance decides nothing (true, and kept), but not that it is **set once** (`appearanceRefusal`), nor that the children are not asked for. A second parent came up after Done with nothing having said a second screen existed — the same fault as the tutorial's hidden map click. | "Nothing about a person depends on how they look — it changes nothing in the game. Chosen once, and kept. The children are not asked for: they take after their parents." And a line: **Step 4 of 4. Parent 1 of 2. Done brings up the next parent.** The total counts every parent, not the ones still waiting, so it does not shrink. |
| `#wagon-stock` | Offered the acres and the two wagon spaces and **never said the family arrives with animals**. Since 2026-09-20 the choice brings `OPENING_HERD` — six cattle and twelve hogs that feed themselves and feed the family ([STOCK.md](STOCK.md) §3) — which is the larger half of what the choice does. | `grantProjection` now sends `stockChoice.herd`, and the panel prints the server's numbers: the acres, "about 26 times as much land", the two wagon spaces, and "The family arrives with 6 cattle and 12 hogs, which feed themselves on the range and feed the family." Nothing is written into the page. |
| `#wagon-load` | *"Anything left out is not coming."* Every town keeps a blacksmith selling the axe, broadaxe, froe and auger, and the store sells seed and powder (`sim/shops.mjs`) — the item lines on this very panel already said *"more has to be bought in Gonzales"*. And the panel never said the choice closes when the teacher presses Start. | "What you load is what the family arrives with. Tools, seed and powder can be bought in a town later, if there is coin; the things for the house cannot be bought anywhere." Plus: "You can change all of this until your teacher presses Start." |
| The load buttons | A loaded thing's button read **Loaded** — a state, not an action — and pressing it took the thing out. A hidden second interaction. | It reads **Take out**. The screen-reader label was already right and is unchanged. |
| `stockChoice.why` | Projected and never displayed; the two radios were greyed with no reason given. | Shown in `#wagon-stock-why`. Marked `ceiling:` — `stockRefusal` asked without an answer cannot refuse while the panel is up, so it is unreachable today and is wired so the next refusal does not arrive invisible. |

### What was found and deliberately not changed

- **Play Solo never packs the wagon and never chooses its land.** Measured: `wagonProjection` and `grantProjection` both
  send nothing once `world.status !== 'lobby'`, and a Solo game opens `running` (`newSoloGame`, and the 2026-09-18 hold
  keeps its *clock* at zero, not its status). So a Solo player gets `defaultLoad`, no stock, and **a labor of 177 acres**
  where a class student may hold 4,606. This is a real divergence from the owner's *"the experience in solo vs live class
  should be the same"* (2026-09-17), but closing it means inventing a lobby, or a ready gate, for a game that has none —
  a design decision, not a wording one. It is written up in `HANDOFF.md` as the next thing to ask about. Until then the
  title card does not promise a wagon step, because in Solo there is none.
- **A class whose Host presses Start early loses the choice in silence.** The panel now says when it closes; it does not
  warn as the moment approaches, and it vanishes rather than saying it has gone.
- **The die still explains nothing about the number.** That is §2 and is the owner's.

### Evidence

`npm test`: **876 passed, zero failed** (869 before). Seven new tests in `tests/creation-words.test.mjs`, each proven by
injecting the mistake it guards: `node scripts/creation-words-injections.mjs`, **16 of 16 caught**,
[record](evidence/creation-words-injections.json). The harness converts its patterns to the working copy's CRLF before
matching and throws unless each is found exactly once.

Browser: `npm run test:creation` (`scripts/creation-browser-proof.mjs`, new — it was referenced by
`tests/creation.test.mjs` and `scripts/support/meet-family.mjs` and had never been written). **9 checks at 1366×768**,
[record](evidence/creation-browser.json), screenshots `creation-title.png`, `-die`, `-surname`, `-names`, `-looks`,
`-wagon`. Every check runs with the panel it measures visible and refuses an element with an empty box, because a hidden
element overlaps nothing and would pass against broken code. Break-drilled three ways — the old **Loaded** label, an
over-wide wagon panel, and a display-none step line — and it failed each time. Same computer only; no LAN or district
claim, and Play Solo is not covered.

## Amendment, 2026-09-21 — what a child under ten can be set to

**Owner:** *"Children should have action bars too. They should be able to play, and other things that kids would do."* And
the principle it comes from, the same day: *"When I switch characters, the action bar at the bottom should switch to that
person's bar. It shouldn't (unless there's a good reason) stop another character from doing their action… This philosophy
should be followed logically and dynamically throughout the experience of the game."*

**What the 2026-09-12 rule now is.** §3 said a person under ten may "not to work, not on a road, not to answer for the
family". **The first third is amended; the other two stand.** A child under ten is still never sent on a road and still
cannot answer for the family — not a call, not a march, not a vote, not a rumor, and not the fighting (§5, which stays at
sixteen). What they now have is **works of their own**: play, and the small jobs a frontier child really did close to the
house.

**Why.** Under the old rule a child could do nothing at all. `choreAvailability` refused every chore and `applyAction`
refused every order but a rename, a rest and a word with a rider, so a child's row on the family panel collapsed to one
line saying they were too young (`rowReason`). The owner switched to a child, found an empty bar, and asked for this. The
owner then chose **"play, and the small jobs a frontier child really did close to the house"** by multiple choice, over
*play only* and over *everything an adult does, more slowly* — **explicitly because an eight-year-old should not be put on
the axe or the rifle.**

### The six works, and the ages

`sim/children.mjs`, a module of its own, registered into the one chore table through `registerChores` exactly as
`sim/camp.mjs` and `sim/road.mjs` are. Claims `FIC-GONZ-300` to `-305`; the history is `HIST-TEX-400` to `-403`.

| From | Work | What it is | What it adds to the family's store |
| --- | --- | --- | --- |
| **2** | **Play** (`child-play`) | An hour that is theirs: the creek, a stick horse, the other children. | **Nothing, on purpose** — and it writes the child's hour into the family's record, in one of six lines. |
| **5** | **Gather kindling** (`child-kindling`) | An hour round the yard and the wood pile after bark, chips and dead sticks. **No axe: nothing is cut, only picked up.** | Nothing. |
| **5** | **Keep the birds off the corn** (`child-birds`) | Two hours at the edge of the field with a stick and a loud voice. Offered only while a crop is standing. | Nothing — deliberately; see below. |
| **5** | **Gather the eggs** (`child-eggs`) | Twenty minutes round the yard and under the house after the hens' nests. | **Food.** Three tenths at five, rising to half a food at nine. **Once a day.** |
| **7** | **Carry water** (`child-water`) | An hour with a pail between the water and the house. | Nothing. |
| **7** | **Mind the younger ones** (`child-mind`) | Two hours with the little ones. Offered only where somebody smaller is at home. | **Lifts the baby off the parents** while it lasts — `BABY_BURDEN`, the relief a cradle gives. |

- ~~**An infant under two has nothing, and that is the decision, not an oversight.**~~ **Superseded by the owner on
  2026-09-26** ("babies can crawl around and cry for attention too"; [CHILDREN.md](CHILDREN.md) §6): an infant is still given
  no work, but crawls, cries, is held and sung to, and naps, and its row says which. What follows is kept as it was written.
  Their row keeps the adult works, every
  one refused for the same reason, which is what `rowReason` collapses into one line. **The wording of that line is a
  separate hand's** (2026-09-21) and is deliberately not touched here; what this amendment guarantees is that the row a
  line is needed for still *has* one reason to say, and that every other age has icons instead.
- **Ten closes all six.** At ten the family's whole work opens (`SENT_FROM_AGE`) and the game does not offer a
  fifteen-year-old on this frontier an afternoon off.
- **Every threshold is invented** (`FIC-GONZ-301`). `HIST-TEX-400` puts children at small jobs from about four or five and
  at more of them from six or seven, and that is as fine as any source read gets. Two thresholds rather than five, because
  a table nobody can hold in their head is not a rule.
- Somebody the game knows **no age for** — the founding four's children — is passed over exactly as `tooYoung` passes over
  them. No class saved before ages existed gains or loses a thing.

### Does a child's work produce anything, and why

**Two of the six do; four do not, and each of those four says so on its own control.**

- `food`, `seed`, `powder`, `cotton`, `money` and `logs` are the whole ledger. Of the six works **only the eggs are any of
  them**, and eggs are food, which is what they are. Water carried, kindling brought in and birds driven off the corn have
  no column, and **inventing `water` and `kindling` so a child could add to a number would be inventing a resource where
  none is needed** — and a number no rule reads is exactly the freight this codebase has been bitten by before.
- **Minding is the second, and it invented nothing at all.** The simulation already had the effect and already had the
  number: a parent with a baby under two at home and no cradle does heavy work at home at `BABY_BURDEN` of the time. A
  child set to minding cancels it while they are at it, the same as a cradle. An existing effect gained a second way of
  being relieved.
- **The corn is the deliberate omission.** Birds off a standing crop is a real effect and `harvestShare` is where it would
  go. It is left out because a harvest that depended on a child at the field edge would make a child's work **compulsory**,
  and the owner asked for something a child *can* do, not a post the family has to staff.
- **The eggs are held small on purpose:** half a food a day at most, for the whole family, against a household that eats
  about three a person. No family is ever better off putting its eight-year-old on the eggs than its father in the timber.

### What this does not change

Nothing about the roll, the names, the looks, the hidden stats, who answers a call, who may be sent to fight, or the
housekeeping and strength effects of §4. **No number of the simulation moved and no save version moved**:
`household.eggsDay` is absent until a family's children have gathered eggs, and absent reads as "not today".

### Gates

| Gate | What it means |
| --- | --- |
| The ladder decides | Every age 0–17 gets exactly the works in the table, and nobody else gets any. |
| The bar switches | A child of eight sees their own works and no adult work; an infant sees the adult works refused, all for one reason, so their row still has something to say. |
| Nobody is stopped | Setting a child to their own work changes nothing about what anybody else in the family may be set to, and does not call their work off. |
| The server holds the gate | An order for a work above a child's age is refused **in words** even when it was never on their row. |
| Off the land, and armed | No child's work has a travel step, and none costs powder or needs the axe or the hoe. |
| Four add nothing | Measured against an identical family stepped the same number of ticks: play, kindling, the birds and the water move no resource at all. |
| The eggs | Exactly `eggsFor` reaches the house, once a day, more for an older child, and the second try is refused in words. |
| Minding | The parents' baby burden lifts while a child minds, and comes back the tick the minding stops. |
| The lesson | The guided beginning never refuses a child their own work. |
| Claims registered | `FIC-GONZ-300` to `-305`, `HIST-TEX-400` to `-403`. |

### Evidence

`npm test`: **890 passed, zero failed** (880 before). Ten new tests in `tests/children.test.mjs`, each named for a rule
rather than an event. Injections: `node scripts/children-injections.mjs`, **24 of 24 caught**,
[record](evidence/children-injections.json). The harness converts its patterns to the working copy's CRLF before matching
and throws unless each is found exactly once. Two of the twenty-four first read as **MISSED** and both were real gaps in
the tests, not in the harness: the play line was being checked against the bare *"finished:"* event every chore writes,
so a work that told the family nothing still looked told; and the replay check compared **one** hour, which a draw from
`Math.random()` matches one time in six — it compares four hours now.

**Not proven.** No browser proof was run: the six icons are Claude-drawn glyph stand-ins
([ART_REQUESTS.md](ART_REQUESTS.md), request 2026-09-21) and nothing about the panel's layout changed, but *that a real
child's row renders its six icons on a 1366×768 Chromebook has not been seen*. Same computer only in any case; no LAN and
no district claim.

---

## Amendment, 2026-09-26 — kinds of play, obedience, a child's own automation, and babies

Owner-decided 2026-09-26 and built the same day; the whole of it is [CHILDREN.md](CHILDREN.md). What it changes here:

- **§3's ladder has more rungs.** Seven kinds of play beside `child-play` (a stick horse and a doll from two, tag from three,
  hide-and-seek and a toy cart from four, a hoop and marbles from five), and scattering corn for the hens from three; the stick
  horse and the hens are left behind at seven. Every play is drawn as what it is.
- **§4 has a fourth hidden stat, `obedience`: a d20 rolled for every son and daughter** when the family is rolled, hashed from the
  seed and the child's id, never on any wire. It decides how often a child of two to nine dawdles before a job, wanders off from
  one to play, and switches their own automation off. A child rolled before it has the roll their seed and id make, never
  written back; **no save version moved.**
- **A child of two or more may be put on their own automation**, which lasts a time scaled by obedience and goes off by itself.
- **The 2026-09-21 rule that an infant under two has nothing is superseded** (above): babies crawl, cry and are held.

---

## Amendment, 2026-09-22 — what a family eats by age, birth dates and twins

### What the owner decided

> "Children's food consumption: ages 0–2 use 25% of an adult portion, 3–9 use 50%, 10–15 use 75%, and 16+ use 100%.
> Preserve fractional totals. Allow seed-deterministic twins at approximately 1% of births."
>
> — the owner, 2026-09-22

Astra's handoff of the same day (`docs/HOUSE_SELECTION_HANDOFF.md`) adds: *"Food is game balance in adult-equivalent units
... Preserve fractional consumption; aggregate before rounding, preferably using fixed-point quarters. These are tuning
values, not nutritional advice"*; *"Permit twins at a proposed 1% of births, seed-deterministic; give both their own
identities and the same birth date. Remove artificial one-child-per-year spacing in generated histories without requiring
twins."*

### Food by age (`FIC-GONZ-360`)

| Age on the world's date | Share of a grown person's food | Quarters | Food a day |
| --- | --- | --- | --- |
| 0–2 | a quarter | 1 | 0.0875 |
| 3–9 | a half | 2 | 0.175 |
| 10–15 | three quarters | 3 | 0.2625 |
| 16 and over | all of it | 4 | 0.35 |
| no stated age (the founding four, townspeople) | all of it, as before | 4 | 0.35 |

- **Quarters, summed first.** A household's quarters are added as whole numbers and turned into food once
  (`quartersEaten`, `mouthsOf`, `eatenADay` in `sim/family.mjs`): four babies are exactly one grown share, and a baby, a
  child of five and a youth of twelve are exactly one and a half. The best housekeeper's saving and the table's twentieth
  come after, as they always did; the store is rounded to four places once a tick, as it always was.
- **One function, everywhere a family eats:** the day at home (`sim/routines.mjs`), the winter nobody plays
  (`sim/periods.mjs`), the road east (`sim/scrape.mjs`), and the neighbours' director deciding what it keeps back and when it
  is down to its last day or two (`mouthsAt` in `sim/neighbours.mjs`, `FIC-GONZ-364`). **Nothing else eats**: the Alamo, the
  army and Houston's camp feed their men without touching the family's store, and no screen shows a student or the Host
  "days of food left" — so there was nothing else to change.
- **Age is the age today.** Everybody rolled since 2026-09-22 has a birth date (`born`), and a child moves up a band on the
  birthday (`ageNow`). A person rolled before has an age and no date; the date is worked out from that age on the class's
  first day and a hashed day of the year, and never written back (`bornOf`). No per-person cost is stored, and no save
  version moved.
- **What a birthday does not yet change.** The age *shown* in the family panel and the ages that decide who may be sent
  (ten) and who may fight (sixteen) are still the age the person was dealt. Only eating reads the birthday. See *What the
  owner may want to decide*.
- **These are the owner's tuning values for play, not nutritional advice**, and nothing in the game presents them as what
  children ate in 1835.

### Birth dates, natural spacing and twins (`FIC-GONZ-361` to `-363`)

- **Each birth follows the one before by 1.4 to 3 years**, never closer than about ten months. The mother's 17 to 42 and the
  father's 18 or more hold at every birth, reckoned from the dates. The old rule that no two children share an age is gone.
- **Twins at one birth in a hundred.** Whether a child is the twin of the one before is `share(seed, child's id, 'twin')`
  — the seed and nothing else, never a random stream (`FIC-GONZ-008`) — taken at 1% × n/(n−1) in a family of n children, so
  that one delivery in a hundred is twins whatever the family's size (measured: 0.95 in 100 over about 170,000 births, in
  `tests/rations.test.mjs`, with bounds of 0.85 to 1.15). Each twin is their own person: their own id, their own name (the
  next card, so no two in a family share a first name), their own hidden stats, and the same birth date. Never three at once.
- **Fitting eighteen children honestly.** In order, least surprising first: the parents made older (up to 45); made younger if
  the mother is too old for her youngest to be under eighteen; **the eldest grown and still at home, 18 to 22**
  (`GROWN_AT_HOME`); closer births; and only if nothing else fits, parents past 45. Measured over 40,000 rolls: every family of
  seven children or fewer is under eighteen as before; one family of eight in a hundred has a grown eldest; a third of
  families of nine; most of ten; nearly all larger.

### What a roll of 20 looks like now

Two parents and eighteen children: **a father of 41 to 45 and a mother of 37 to 42; the eldest 18 to 22, grown and still at
home, the youngest a baby or a small child; births about fourteen to sixteen months apart on average and never evenly**, so
the ages skip a year here and there; **twins in about one family in six.** It is never again the stair of seventeen down to
nought. Five to eight of the eighteen are sixteen or more — **about two and a half sons of fighting age on average (none to
six), where it had exactly two sixteen- and seventeen-year-olds before.** An example, seed `a`: father 42, mother 40,
children 22, 21, 20, 18, 17, 16, 15, 14, 12, 11, 10, 9, 7, 6, 5, 4, 3, 1.

It is still the edge of what a mother could bear, and far past what the record describes (§2); it is what the owner's roll
makes.

### What changed in play, and which tests moved

- A family of young children eats well under its head count: two parents and four children under three eat as three grown
  people, not six.
- The director keeps back food and kills stock by grown shares, so a family nobody plays with small children trades food
  away sooner and butchers later.
- Tests changed because their expectation genuinely changed (each says so beside it): `tests/family-roll.test.mjs` (the
  stair of ages and "no two share an age" replaced by birth-date checks; the 20's shape); `tests/periods.test.mjs` (the
  winter eaten by age); and three fixtures whose seeded class's history moved when its families did —
  `tests/camp.test.mjs` (a skilled man stands a one-tick guard, so "at work 7 of 12" became "never idle a whole think"; the
  scouts' loop stops when the army marches; what else a family has waiting is its own), `tests/houston.test.mjs` (two men of
  two families, since a big family now has grown sons), `tests/winter.test.mjs` (a son of ten to fifteen, since a daughter is
  refused for the other rule).

### Evidence

`npm test`: **949 passed, 0 failed** (940 before; nine new in `tests/rations.test.mjs`). Injections: `node
scripts/family-roll-injections.mjs`, **24 of 24 caught** ([record](evidence/family-roll-injections.json)); the tolerance of
the twin-rate test is stated in the test (0.85 to 1.15 in 100 over about 170,000 births). Browser: `npm run
test:family-panel` (17 checks) and `npm run test:family-twenty` (9 checks) pass at desktop sizes and a 400 px phone. Same
computer only; no LAN and no district claim.

### What the owner may want to decide

1. **Should a birthday change the shown age and the rules of ten and sixteen too?** Now only eating reads it; a child who
   turns ten in the game still may not be sent until the next class.
2. ~~**Grown children at home, to 22,**~~ **Decided by the owner, 2026-09-27, by multiple choice: grown children at home
   stay up to 22**, as built. It was the least surprising honest way to give eighteen children natural spacing, and it gives
   large families more sons who can be sent to fight. The other honest choices were eighteen births in eighteen years
   (a birth every twelve months, which reads as the old stair) or more twins than the owner's one in a hundred.
3. **The twin rate** is per delivery. A family whose roll gives it one child can never have twins.

## Amendment, 2026-09-24 — the founding four are drawn as who their role says

Not an owner decision; a bug found on the Host's map. A household nobody joins keeps the founding four (§2), and they have a
`kin.role` but no `sex` or `age`. The projections sent only the stated fields, so the page drew each by a hash of the id
from a pool of a woman, a man and a boy: the far family's mother *Antonia* (`hh-9-elena`) was an old man and her son *Jonas*
a woman, on the Host's map and on any student's page that met them. Nothing hidden was involved.

- **Sex is read from the role the world authored**, never from a name: a father or son is a man, a mother or daughter a
  woman (`sexOf` in `sim/family.mjs`, as sim/appearance.mjs, sim/alamo.mjs and sim/winter.mjs already read it).
- **Band:** a founding parent is drawn grown; a founding son or daughter as an adolescent (`bandOf`, `youth`). `ceiling:` they
  have no age, so this is the game's choice — the band whose rules they already follow (given work; not answering a call).
- **What travels:** `seenAs` in `sim/town.mjs` sends a glance (`sex`, `band`) to the family's own page, to whoever meets
  them and to the Host. The hidden stats (§4) are not read by it and reach no payload.
- A rolled person is unchanged. No save version moved: a class saved before rolling is drawn right as it opens.
- **Evidence:** `tests/figures-match-people.test.mjs` (every face of the die, a lone father and a lone mother, two parents
  alone, the founding four and every town's keepers, in every student's own and observed view and the Host's).

## Amendment, 2026-09-25 — the family's means, rolled on a second die

**Owner:** *"introduce rolling for starting wealth. tie it into the extra wagons. part of wealth will be number of wagons. if a
family doesn't have enough wagons, older family members walk. have this potentially affect travelling speed."*

**Status: built the same day** (`sim/means.mjs`, `sim/company.mjs`; `sim/family.mjs` `meansRoll`; [tests](../tests/means.test.mjs),
[injections](evidence/means-injections.json), [browser](evidence/means-browser.json)). Claims `HIST-TEX-442` (the research),
`FIC-GONZ-393` (the bands), `FIC-GONZ-394` (who rides), `FIC-GONZ-395` (the pace). It amends §2 (the roll), the 2026-09-25 note there
(*more wagons*, now by means and not by size) and the wizard's first step; who rides and who walks is
[SETTLING_IN.md §4b](SETTLING_IN.md). No save version moved.

### The second die

- **Thrown by the same press as the first.** *Roll the die* on `#family-roll` throws two twenty-sided dice: the family's, and a green
  one beside it for what the family has to start with. Both tumble and stop on the server's numbers; the line under them reads
  *"You rolled a 7 for your family and a 12 for what it has."* and below it the server's words for the means - *"Modest. A wagon and
  an ox to draw it, and the family's horse. 5 ride and 4 walk beside the wagon."* The step count and the other screens are unchanged:
  it is still **Step 1 of 4**, and the panel still says the roll is thrown once and there is no second roll, which is true of the
  two dice together. One press was chosen over a fifth step so the five-step walk the owner set on 2026-09-17 is unchanged and every
  browser proof that walks it still walks it; the rolling is real - the server throws the second die on that press
  (`rollFamily` in sim/world.mjs calls `applyMeans`), nothing is decided earlier and revealed.
- **Seeded like the first**: `meansRoll(seed, householdId)` hashes the class and the household on a question of its own, so a saved
  class reloads to the same means and the two dice do not run together (measured over 400 seeds in the test).
- **What the number gives is shown, as the band.** Unlike the family's die, whose mapping the owner keeps hidden (§2), the means are
  things a family can see it has - its cart or wagons and its oxen - so the band's name and what it brings are said at once. **The
  table itself is written nowhere a student reads it**, only its result.
- **Nothing hidden is read.** The bands do not touch the hidden stats (§4); who rides is decided from age and sickness, both of which
  the family already sees. Tested by planting values in the stats and finding them in no payload.

### The bands (`FIC-GONZ-393`)

| Roll | Means | Comes with |
| --- | --- | --- |
| 1–6 | Poor | a **cart** and one ox |
| 7–14 | Modest | a wagon and an ox |
| 15–18 | Comfortable | two wagons, an ox to each |
| 19–20 | Well-to-do | three wagons, an ox to each |

- **From the record** (`HIST-TEX-441`, `-442`): Harris's father put their neighbours into three classes by what they hauled with -
  wagons the aristocracy, carts the second class, a sleigh the lower - and even that lower class had oxen and a horse. So every family
  keeps its horse, and the poorest have a cart. **No count** of how many families were of each sort was found; the shares of the die
  are the game's own, weighted to the middle.
- **A cart** is the family's one vehicle, *Family cart*, with **12** spaces to a wagon's 16 and three quarters of a wagon's room in
  the flight east, and room for its driver and two more (§4b). Everywhere else the work asks for "the wagon" - a harvest that wants
  one, fetching logs, the ford - the cart serves and is still called the wagon there (`ceiling:`, as `HIST-TEX-441` already had every
  vehicle counted and drawn as the wagon). It is drawn with the wagon's art (`stand-in:`, docs/ART_REQUESTS.md).
- **The load** is packed a wagon's worth of stores to each wagon, as the size rule did, and for a cart trimmed to its room a barrel of
  meal at a time down to one, then the powder to one shot; never the hoe, the axe or the seed, which the first steps need
  (docs/LESSON.md). A student repacks it as they like until Start.
- **Five days of food at the least** (`FIC-GONZ-396`, added the same day after the first poor arrival was looked at: a family of
  twelve in a cart came in with 4 food). Every family, of any means and size, arrives with at least five days of food for its
  eaters; where the cart or wagon holds less, the rest is carried on foot beside it, "in sacks and bundles" - said on the pack
  screen and in the arrival line, and kept apart from the load so repacking moves only what the vehicle holds. Five days is the
  first period at Gonzales with the guided start inside it (4.7 days, measured). `ceiling:` no amount in the record read.
- ~~**No band brings coin.**~~ **Superseded the same evening** (the second amendment below): the owner chose starting coin of 3 to 10
  reales on every face of the die. Drafted as 0, 2, 6 and 15 reales and withheld until then, because the ending is built and counts
  the coin in the house (`finalNumber` in sim/ending.mjs); how the ending should count it is still **open for the owner**
  (docs/MONEY_AND_GLORY.md, the amendment of 2026-09-25). A class that rolled on this first table keeps no coin.
- **Slaveholding** was part of some Anglo families' wealth in the record (TSHA, *Old Three Hundred*). The families of this game are not
  slaveholders (docs/ALAMO_FATES.md; VISION.md: enslaved people are never property), and no band carries it. Noted for the owner.

### Who gets means, and when

- A family somebody plays: on its roll, as above. **Start**, which rolls a joined family that never rolled, throws both dice.
- **Families nobody plays** are given their means on the class's first running tick, before anything moves (`settleMeans`), so they
  come in with a cart or with wagons like anybody. Nothing is written into their record, so a student who joins one later can still
  roll it (`rollRefusal`).
- **A class made before** (`world.meansRoll` absent): no means, and the wagons it had - one a family, or a wagon for every eight
  people in a class made earlier on 2026-09-25 (`world.wagonsBySize`, which that class keeps: `FIC-GONZ-391` is retired for new
  classes only).

### Gates

| Gate | What it means |
| --- | --- |
| The die is the seed's | The same means every time for a class and a household; every face and every band reached; the two dice not in step. |
| Bands give what they say | Every band on three family sizes: its vehicles, an ox to each, one horse, the cart's room, the stores per wagon, the hoe, axe and seed kept, no coin. |
| Nobody plays, still rolled | Every family nobody plays has means after the first tick, of more than one band, and comes in. |
| Old classes open | A class made before rolls no means, seats nobody, and goes at the ox's pace; a new class saved reopens with its means. |
| Hidden means hidden | Planted hidden stats reach no family, family book or Host payload. |

## Amendment, 2026-09-25 (evening) — starting coin, a family with no vehicle, the carreta, and the horse ridden

**Owner** (the four answers, verbatim): *"families should get some starting coin, starting with a minimum of 3 coin, and a maximum of
10 coin. this should be a structured part of the wealth d20 roll. yes, it should be possible to start with no wagon. it shouldn't
block gameplay, but some things might have to happen slower. what was the cart thing that tejanos used? maybe we could use that? have
it be something families can make at home? could work the same, just with reduced carrying capacity? yes, the horse should carry a
rider."*

**Status: built the same evening** (`sim/means.mjs` `MEANS_TABLE`, `MEANS_COIN`; `sim/company.mjs` `riddenHorses`; `sim/carreta.mjs`;
[tests](../tests/afoot.test.mjs), [carreta tests](../tests/carreta.test.mjs), [injections](evidence/afoot-injections.json),
[browser](evidence/means-browser.json)). Claims `FIC-GONZ-397` (the table, the coin, on foot), `FIC-GONZ-398` (the carreta),
`HIST-TEX-443` (the carreta's record); `FIC-GONZ-393` and `-394` amended. It amends the first amendment above for every class made
since: such a class carries `world.meansRoll = 2`, the **second table**; a class made that afternoon (`true`) keeps the first. No save
version moved.

### The second table: five bands, and coin on every face

| Roll | Means | Comes with | Coin, face by face |
| --- | --- | --- | --- |
| 1–2 | **Hard up** | **no vehicle**; the family's one ox carries the packs | 3, 3 |
| 3–6 | Poor | a cart and one ox | 3, 3, 4, 4 |
| 7–14 | Modest | a wagon and an ox | 5, 5, 5, 5, 6, 6, 6, 6 |
| 15–18 | Comfortable | two wagons, an ox to each | 7, 7, 8, 8 |
| 19–20 | Well-to-do | three wagons, an ox to each | 9, 10 |

- **The odds** are 10, 20, 40, 20 and 10 in a hundred. Every band keeps the family's horse.
- **The coin is a structured part of the roll**, as the owner asked: each face gives a fixed number of reales (`MEANS_COIN`), never
  less than the face below it, the least 3 and the most 10, every sum between reached, and no band's least below the band under it
  (hard up 3; poor 3-4; modest 5-6; comfortable 7-8; well-to-do 9-10). Its mean over the die is 5.65 reales. It is in the house from
  the roll (`household.resources.money`), kept on the means record (`household.means.coin`, checked against the face on every save),
  and **said with the band in the creation walk**: *"Poor. A cart and one ox to draw it, the family's horse, and 4 reales. 4 ride and
  8 walk beside the cart."* The sentence above the dice says the die gives "a cart, wagons or nothing to haul with, the oxen, and a
  few reales". Families nobody plays get theirs on the first running tick.
- **Invented**: no source read says what coin a family brought ("none who have much money", Holley, `HIST-TEX-442`), so the amounts
  are the owner's range, spread by the game. The ending counts it as it counts all coin in the house - **owner-decided
  2026-09-25: coin held, not coin gained; starting rich is an advantage, as it was historically** (docs/MONEY_AND_GLORY.md). The ending's account lists it first: *"The family came with 4 reales."*
- **The guided start** counts a sale by coin over what was in the house when the step began, so the coin a family came with is not
  taken for a crop sold (sim/lesson.mjs `sold`).

### A family with no vehicle (hard up)

- **The kit on the ox, the food on their backs.** The ox's packs hold **7** spaces (`PACK_SPACE`): the hoe, the felling axe, the seed
  of the first planting and a shot of powder, and for a corn family the pot. The family's five days of food (`FIC-GONZ-396`) is
  carried by its own people, *"in sacks and bundles"*; five a person of ten and over (`carriedOnFoot`, `MODES.foot.carry`) carries
  it for every family the die can roll (measured on sizes 1-20, the least margin one food). The pack screen says *"Pack the ox's
  packs"*, *"No wagon or cart. The ox's packs: 7 of 7 space filled"* and *"The family carries its food itself: 11 food on foot, in
  sacks and bundles."*
- **The road in is walked**, over the ground as a walker goes it, at the pace of the slowest walker, with **one on the horse** (below):
  *"1 rides the horse and 7 walk."* The walkers are drawn in a file; the ox walks behind under its packs (`ceiling:` at the walkers'
  pace, as the family's oxen do in the flight on foot). The arrival line: *"They carried 11 food on their backs, in sacks and bundles,
  and the ox carried the rest."*
- **Slower, never blocked** (the owner's words): the lesson's every step can be done (tested: arrive, the house, survey, clear, buying
  the seed on foot, plant, harvest, sell on foot, hunt); a crop that would want the wagon is **carried in by hand**, the cutting and
  as long again (`HAND_CARRY_TICKS`, sim/chores.mjs `byHand`), where a family whose wagon is only away is still told to fetch it; a
  load more than the horse carries to town is refused with *"... Your family has no wagon. Send a smaller load, and go again for
  the rest."*; logs are hauled from the family's own trees on the shoulder or behind the ox as ever, and **fetching logs from timber off
  the land still wants a vehicle** (`ceiling:`; a family there makes a carreta first); the flight east is on foot with what its grown
  people carry; stock cannot come in when the packs are full, in the packs' words.
- **It can make a carreta** (docs/WOODS_AND_BUILDING.md §6.6), the family's first vehicle, and buy a wagon from the wheelwright.

### The horse carries a rider

On every journey the family makes together - the road in, the move to the site, the flight east and the way home - **every sound
horse going with it is one more seat**, dealt after the vehicles' seats and in the same order: **the sick first, then the youngest**
(sim/company.mjs `seatPlan`). A family with room in its wagons leaves the horse without a rider; one short of seats puts on it the
next who would have walked - often a small child who would otherwise hold everybody back; a family with no vehicle puts its sick or
its youngest up and walks the rest. A baby goes up in its carrier's arms. The rider is tired as a rider (`saddle`) and drawn in the
saddle, and the horse is not drawn again by itself. Harris: in 1833 "Mother, sister, and myself rode in the cart" while the men
"traveled on horseback" (`HIST-TEX-442`). `ceiling:` one rider a horse whatever their size, and nobody is chosen for being able to
ride.

### The cart and the carreta

The game does not tell a Tejano family from an Anglo one - every name pool mixes both (sim/family.mjs `NAME_POOLS`) - so **the poor
band's cart stays one kind of cart**, and the carreta is a thing **any** family can make at home. If the owner wants families of
origins, the poor band's vehicle could be a carreta for a Tejano family and a cart for an Anglo one; nothing here decides that.

### Gates

| Gate | What it means |
| --- | --- |
| Coin by face | Every face 3 to 10, never falling, each band's spread as the table; in the house, on the record, said with the band. |
| First table kept | A class of `meansRoll` true rolls four bands, a cart at 1-6, no coin, the horse led; saved and opened as it was. |
| On foot, fed | A hard-up family has no vehicle, one ox, the kit in its packs, five days of food on its backs within what it can carry. |
| Never blocked | It does the whole lesson, brings in a big crop by hand and slower, goes to town twice for a big load, flees on foot. |
| The horse ridden | One seat a horse after the vehicles', the sick then the youngest; a baby in arms; tired and drawn as a rider. |
| Hidden hidden | Planted hidden stats reach no payload; another family's rider, coin and carreta reach no student. |

## Amendment, 2026-09-28 — a child of seven or more may act for the family

Owner, 2026-09-28, by multiple choice: **"The oldest child steps up"** - a child of about seven or older can act for the family in an
emergency (flee, fetch water, mind the little ones, go for help), as frontier children really did; with none, the student follows a
neighbour family that takes them in. This amends §3's "not on a road, not to answer for the family" for one case only: **when nobody
grown is with the family**, the oldest child of seven or more answers its own decisions - the order to leave, the route, staying,
the road's questions and "¡Alto!" - and may run to the nearest neighbours for help. Who may be sent to fight, who answers a call and
who may be sent on the family's other roads are unchanged. The rule and its evidence are docs/FAMILY_PANEL.md §20 (`FIC-GONZ-730`,
`-731`); a man sent to the war with only children under ten at home is told so first (`FIC-GONZ-733`).

## Amendment, 2026-09-29 — the lone parent's path

**Owner-decided, 2026-09-29. Built the same day (not released).** `sim/courtship.mjs`, `public/courtship.js`; claims
`HIST-TEX-740` (marriage by bond) and `FIC-GONZ-950` (everything invented). This amends §2's lone parent: a family rolled with one
parent is no longer only "widowed" for the whole class.

> "at the start of the game. if a player is unlucky enough to have a lone parent, the following path is made available. a special
> ability appears when they reach their land. this ability should be highlighted and special looking. it will send them, with
> their children to visit other nearby farms to ask neighbors for help in raising their house. travel is skipped, and we see the
> family visit and talk to a family. on the 2nd family they meet a family that has a son of eligible marriage age. the age will be
> the same as our lone parent. light flirting occurs. travel is skipped again and we see the couple with the families gathered at
> our farm for a marriage. a short ceremony is shown and afterwards we find our new family with two parents. a basic house is also
> prebuilt for the player to make up for lost time with this series of things going on."
>
> "take your time with this. use fades to black to smooth transitions. carefully build this, and any new placeholder art needed.
> it should feel special" - and: "be creative and feel free to improve on my plan if it needs to"
>
> — the owner, 2026-09-29

| Question | Owner's answer, 2026-09-29 |
| --- | --- |
| A lone father? | **The mirrored path**: the second family has a **daughter** his age. |
| Who are the two families? | **Invented families nobody plays**, made for the scene near the player's land. No other student's family is touched or seen. |
| Forced, or offered? | **Offered, and can be declined**: it waits, highlighted, until pressed; it stays until the family builds a house itself or uses it. |
| The new spouse? | **Rolled like a parent**: hidden stats on the same dice; looks and name **chosen automatically**; renamed later the usual way. |

### Who is offered it, and when

- **A student's own family rolled with one parent** (§2: a 1, 2 or 3), that has **reached its land** and has **no roof of its own**
  (`pathShown`). Not on the road in, not in the lobby, not to a family with two parents, not once the family has raised a house.
- **The computer never takes it.** A family nobody plays, and a played family whose student has gone (`absent`, run by the
  director), is neither offered it nor allowed it (`pathRefusal`: "Only the family's own student can take this path."). A student
  who comes back finds it still waiting. Auto never presses it. **Owner-decided, 2026-09-29: never.**
- **On the real land, the house site first.** While the family is still choosing where its house will stand, the ability is shown and
  says *"Choose where your house will stand first, so the neighbours know where to raise it."* - it cannot be pressed until then.
- **Refused in words**, never hidden, when the parent is away from home, very sick, the class is paused, or the family is on the
  road east.

### The day away (travel is skipped)

Pressed (`ask-neighbours`), everybody of the family at home sets out together; whatever they were at is left, and a child who had
stopped a parent to talk goes with them. **The family is away four hours of the calendar** (`AWAY_MINUTES`, 240; the second farm an
hour and a half in): its people are refused work, roads and trades in their own names (*"... is away with the family at the
neighbours' farms, home by about half past eleven in the morning."*), drawn nowhere on the family's own map, seen by no other
family standing on the land, and the children do not idle at home (sim/childhood.mjs skips a family away). At the hour they come home
married, with the house raised. The scenes are the student's to walk at their own pace meanwhile; each is lit and headed by the hour
the class's clock gives it (`partOfDay`), so a family that sets out at seven is married before noon and one that sets out at three by
lamplight, and nothing on the screen contradicts the clock. `ceiling:` the courtship is one day, as a house goes up in hours
(SETTLING_IN.md §5); the scenes never say how long the two have known each other. `ceiling:` a rider who reaches the land while the
family is away finds its people there (the server keeps them at home; only orders and the family's own drawing know they are away).

### The neighbours

Two invented families, dealt from the seed: the first from one kind of farmstead (a log cabin with a porch) and the second from the
other (a jacal under a brush ramada), so the two visits are two different homes - Ashby, Tolliver, Kittredge or Whitlow; Salcedo,
Montañez, Treviño or Villa, never the family's own name, their people named from the game's own pools (`FIC-GONZ-017`'s terms: not
real colonists). The second has the grown son or daughter. **They are not households**: they live in `household.courtship.neighbours`
with stable ids (`hh-3-nb-1`, `hh-3-nb-1-p1` ...), are never in `world.households`, never a contender, never counted as a class family,
run by no director and drawn on nobody's map.

### The new parent

- **Id `<household>-spouse`**, new and stable. **The lone parent's own age** (the owner), born on a day of that year of their own.
- **Rolled like a parent**: `dealTraits` on the parent's dice for their sex and age - hidden, sent to no page (the stored record is
  kept out of the household's projection; tested with a planted value). **Looks dealt and kept** as a parent's are when nobody
  chooses (`lookChosen`), so the student is not asked; a first name dealt from the pool for the role, not one the family already uses.
- **The second parent**: `kin.role` father or mother, married both ways (`kin.spouse`), second in the family's order after the
  parent they married. Everything that reads parents sees them: the panel (father, mother, children), who may answer a call and who
  may be sent to the fighting (a new husband like any father), what the family eats, the ending and the flashback.
- **The children's step-parent** (`kin.stepchildren`): the family book says *"Married to Bernarda. Stepfather to Delia and Soledad.
  Born a Kittredge, of the farm down the creek."* `ceiling:` the children's own `kin.parents` do not change, so how they look (taken
  after their parents, sim/appearance.mjs) does not change on the wedding day, and a child calls the new parent by name.
- **The family takes the husband's name — owner-decided, 2026-09-29 ("His name").** When a lone mother marries, the family takes the
  surname the new husband was born to, as a bride did in 1835: `household.surname` becomes his, every member is called by it, and
  so the page's heading, the family book, the Host's rows and the ending read *the Whitlow family*. The name it had is kept
  (`courtship.formerName`, `formerSurname`): the book's `formerly`, the mother's line (*"... Mother to Lavinia and Obed. Until the
  wedding, the Hollister family."*) and one line in the family's story (*"The family took Amos's name, Whitlow. Until the wedding it
  was the Hollister family."*). This is the one change to a last name §*The family's last name* allows after it is set. **Only names
  change**: every person's id and the household's id stay as they were. When a lone father marries he keeps his name and his wife
  takes it.
- **The new husband leads — owner-decided, 2026-09-29 ("New husband leads").** A new husband becomes the family's **principal**
  (`household.principalId`, `principal: true`), to whom the settlement's calls and the war's questions are put, and its **main
  person** (the star; a main person the mother had chosen before the wedding is let go, so the main person is the principal), and
  so the one who answers the family's own decisions while he is with it (sim/acting.mjs `actingFor`). A new wife does not lead: a lone
  father stays the principal. (This is §2's "the principal is the father when there is one", kept.)
- **Victoria: by bond — owner-decided, 2026-09-29.** A family of De León's colony marries by bond like every other, as built.
- **The computer: never — owner-decided, 2026-09-29.** A family nobody plays, or whose student has gone, is never taken down the
  path, as built.
- The rolled family's size check allows the one person more (`marriedIn`); nothing else about the roll changes.

### The wedding: by bond (`HIST-TEX-740`)

In Mexican Texas only a priest could marry a couple and there was no civil ceremony; the church sent one resident priest to the
Anglo colonies (Muldoon, 1831-32), and in 1835 there were two secular priests in all Texas. Couples who could not reach one signed a
**bond** before the local authority and witnesses, binding themselves to be married by a priest when one came - a Brazoria County bond
of 1829 was made "before the commissioner for the precinct". **Every start a family can have is an empresario colony with no
resident priest in the sources read, and the game models no family's faith, so every wedding here is by bond**, before an invented,
unnamed commissioner of the precinct; the vows are written for the scene after the bond's form, never quoted, and the scene carries one
documented line under it. `ceiling:` a Victoria family (De León's colony, whose empresario brought priests from La Bahía, Nacogdoches
and Béxar, undated) may have waited for a priest instead - the owner chose **by bond** for Victoria too (2026-09-29); `RITES` is where a church wedding would go. NOT FOUND: a bond made in
DeWitt's colony.

### The page

- **The ability**: a card at the head of the family's column, gold and rose on warm paper, breathing a slow glow, with its icon in a
  halo: *"A path open to you. Ask the neighbours for help. Take the children to the farms nearby and ask the neighbours to help Asa
  raise a house. The family is away about 4 hours."*, **Go and ask** and **Not now**, which folds it to its glowing icon (remembered
  in the browser). On the map, a warm glow on the family's land and the icon over it. In the column's own flow, it covers nothing
  (`test:overlap`), and the tip at first meeting keeps clear of it.
- **The scenes** (`#courtship`): the whole screen, four scenes - the first farm, the second, the wedding at the family's own land,
  afterwards - each a drawn yard with the family and its neighbours in it, the speaker's name over their head and a warm ring at their
  feet, their words in a strip along the foot (dashed edge: invented; solid: the record). **Continue is the only way on.** Every change
  of place is a **fade to black and back** (1.1 s), the travel said on the black ("On past the ford, to the Salcedo place."); where
  less motion is asked for, a fade of 0.28 s - shorter, never a cut. The wedding and afterwards have their own tune (*The Bond at the
  Cabin*, a slow waltz written for the game, public/audio-music.js) and motes of warm light. A reload takes the scenes up at the
  same line; walked to the end, the server keeps them as watched and sends them no more.

### The scenes' words

Server-written (`courtshipScript`), gentle and short, for a middle-school class: shy glances, a compliment, a laugh, joined hands.
With a lone mother Bernarda, two daughters, the Montañez family and the Kittredges' son Ignacio:

1. *The Montañez farm, across the bottom. Morning.* Ramón: "Good morning! You must be the new family on the creek. Come in, come in."
   Bernarda: "We are. I'm Bernarda, and these are Delia and Soledad. We've no house yet, and only my two hands to raise one." Patience:
   "Then you won't raise it alone. Nobody should sleep under the sky with neighbours this near." Ramón: "We'll come with our axes. And
   go and ask the Kittredges, down the creek. They have strong arms, and good hearts." Teodoro: "Will you come back and play, Delia?
   We have a new calf." Delia: "If Ma says so!" Bernarda: "We'll come back. Thank you, both of you."
2. *The Kittredge place, down the creek.* Cipriano: "Welcome! Sit down and rest. Teodoro and Prudence ran over to say you'd be coming."
   Bernarda: "Then you know why we've come. I'm asking for a day's help with a house." Serafina: "You'll have it. And you'll have
   Ignacio too - the best hand with an axe on this creek." Ignacio (shy): "Mother says that about everybody." Bernarda (laughing):
   "Then I hope she's right about you." Serafina: "Ignacio hasn't taken his eyes off you since you came through the gate." Ignacio:
   "Mother!" Delia: "I like him." Ignacio: "I'll fetch my axe and come right behind you, Bernarda."
3. *Your own land.* "By midday a cabin stands where you camped." Ramón: "There - walls up and the roof on. You'll sleep dry tonight."
   Ignacio: "I've worked beside you today, Bernarda, and I'd gladly work beside you every day after, if you'll have me." Bernarda:
   "I will." The commissioner: "There is no priest in the colony to marry you. So make your promises before these witnesses, and sign
   the bond to be married by a priest as soon as one comes." Ignacio: "I take you, Bernarda, to be my wife, and I will keep faith
   with you alone." Bernarda: "I take you, Ignacio, to be my husband, and I will keep faith with you alone." Soledad: "Can I sign
   too?" The commissioner: "You can watch, and remember it. That is what witnesses are for." ... "Then sign here, and your neighbours
   will sign as witnesses. You are married by bond." Cipriano: "The Montañez family brought cornbread and a ham, and we brought
   tamales. Let's eat - and somebody find the fiddle!" *From the record:* "In Mexican Texas only a Catholic priest could marry a
   couple, and priests were few. Couples in the colonies often signed a bond like this before a local officer and witnesses,
   promising to be married by a priest when one came."
4. *Afterwards.* Soledad: "Is this our house now?" Bernarda: "It is. Ours - all of us." Ignacio: "And a good one. The Montañez family
   and my family built it to last." *"Ignacio is one of the family now, and Bernarda and the children take his name. The Kittredge family has two parents again, a roof of its own,
   and two families of neighbours who will not forget this day."*

### Where this goes beyond the owner's plan (each the owner's to keep or cut)

1. **A reason for each visit**: the first family sends them to the second ("they have strong arms, and good hearts"); the first
   family's children ran over to say they were coming. *Why:* the second visit is a consequence, not a coincidence.
2. **The children's part**: an invitation to play and a new calf; "I like him"; "Can I sign too?" - "That is what witnesses are for";
   "Is this our house now?". *Why:* the owner's "with their children", and the children are the students' too.
3. **A proposal before the ceremony**, spoken while the house is raised. *Why:* a same-day wedding needs a moment of asking.
4. **The house raised by both families on the wedding day**, a frontier house-raising (SETTLING_IN.md §6) - the "prebuilt" house
   given a reason; and **a house the family had begun is finished for it** rather than thrown away for a round-log cabin.
5. **What the neighbours bring**: cornbread and a ham, tamales, a fiddle. Invented (`FIC-GONZ-950`); no source names a supper.
6. **The one line of history** under the wedding, and **the wedding by bond** itself. *Why:* it teaches something true about 1835.
7. **A lasting tie**: the new parent's book line names the family they were born to and where it lives; the family's flashback has
   the wedding as one of its moments (sim/flashback.mjs), and does not put the new parent on the road in.
8. **The time of day** carried into the scenes, the map's glow on the family's land, the scenes' own tune, and **Not now**.

### Not built, on purpose

- **No glory changes.** The owner has **a separate plan, not yet built, for how a family that does not fight can win**; nothing here
  touches glory, coin or the ending's ranking beyond the new parent being one of the family.
- No church wedding (above). No second marriage for a family that loses a parent later: this is the lone parent rolled at the start.

### Gates

| Gate | What it means |
| --- | --- |
| Offered, never pressed on them | Only a student's own lone-parent family on its land with no roof; declinable, waits, folds; never the computer's. |
| Travel skipped, time kept | The family is away `AWAY_MINUTES` of the calendar, refused work and roads, drawn and seen nowhere, home at its hour. |
| Rolled like a parent | The new parent: stable id, the lone parent's age, `dealTraits`, looks dealt and kept, second parent in every reader. |
| Nobody else | No other family, and not the Host, is sent anything of it; the neighbours are no households and no entities. |
| A house | The plainest house raised (or the family's own finished), lived in, and seen as built by the house work and the tips. |
| Honest | By bond, before an invented officer, the priest's marriage promised; one documented line; nothing uncertain as fact. |
| Special | A glowing ability; scenes with fades to black (shorter, never cut, with less motion); a tune; Continue the only way on. |
| His name, and he leads | A lone mother's family takes the husband's surname (ids unchanged, the old name in the book) and he is principal and main person; a lone father keeps both. |
| Old classes open | Absent `courtship` is a family that has not taken it; no save version moved. |

**Evidence.** `tests/courtship.test.mjs` (16 tests; the last three for the owner's answers of 2026-09-29, the husband's name and his leading), each proved by `node scripts/lone-parent-injections.mjs`
([record](evidence/lone-parent-injections.json)); `npm run test:lone-parent` ([record](evidence/lone-parent-browser.json)), with a
screenshot of every scene and a fade (`docs/evidence/lone-parent-*.png`). Same computer only: no Chromebook, LAN or classroom claim.

## Amendment, 2026-09-29 — the family's start: Anglo-American, Tejano and free Black

**Owner, 2026-09-29, verbatim:** *"build all of these as possible starts except for the native american options. those are too
different and will require too much work for now. ensure that skin tone options based on the race of the characters is locked to
what is realistic."* And, of the Black family's start: *"Free Black family"* - a free Black family, as some lived in Texas (the
Ashworths); enslaved and escaping people appear on the road east as people nobody plays. The options were the triage's D13
(docs/audits/2026-09-29-triage.md; design audit S30).

**Status: designed, researched and built the same day (not released).** `sim/starts.mjs`, `sim/tejano.mjs`, `sim/start-story.mjs`;
claims `HIST-TEX-780` to `-789` (the record) and `FIC-GONZ-980` to `-986` (the game's own). It amends §5a and SETTLING_IN.md §7
(every skin tone offered to every family), COLONIES.md §5.1 (Victoria left to the numbers), the carreta paragraph above (the game
did not tell a Tejano family from an Anglo one) and the lone parent's path (its neighbours and new spouse). No save version moved:
a class made before carries no `world.starts` and plays exactly as it did.

### The research (each line's claim is in HISTORY.md)

- **De León's colony** (`HIST-TEX-780`): founded on "forty-one Mexican families", with sixteen non-Mexican families later; "the only
  predominantly Mexican colony in Texas"; about 300 people by 1834; each settler a town lot, a league of grazing land and a labor
  of farmland; "Settlers farmed and raised horses and cattle". Victoria sent volunteers, supplies and arms in 1835, was occupied
  by Urrea after Coleto, and after the war the De León family was "forced to flee to Louisiana and Mexico, their lands and
  livestock taken". **Not found:** cotton in the colony.
- **A Tejano family's wedding** (`HIST-TEX-781`): only a priest could marry a couple; the bond is recorded as the practice of
  "Anglo-Texans unwilling or unable to seek a priest"; in 1836 all Texas had two priests; Victoria's church had no resident priest,
  and a priest came from La Bahía (Father Valdez, taken prisoner by Fannin in February 1836). **Not found:** any Tejano couple's bond.
- **Seguín's company** (`HIST-TEX-782`): thirty-seven men raised under Austin's commission, joined on the Salado; scouted and
  supplied the siege and fought in the storming; given leave to guard their families; formed again at Gonzales in March; Houston's
  rear guard; the one Tejano company at San Jacinto, twenty-two men; white pasteboard on hats and chests (one officer's memory).
  Victoria's own rancheros rode under Plácido Benavides in the autumn, and Benavides would not support independence.
- **The Ashworths** (`HIST-TEX-783`): free people of colour from Calcasieu Parish, Louisiana, to Zavala's colony in 1831 and 1833;
  land ordered surveyed but not located before the offices closed; a Beaumont committee's warning against free Black immigrants in
  1835; William sent a substitute to the army in 1836; white neighbours petitioned for them; the Ashworth Act of 1840.
- **Free Black Texans and the law** (`HIST-TEX-784`): full citizens under Mexico, able to hold land; the General Council's
  ordinance of January 5, 1836 barred new arrivals and let those here stay; the 1836 constitution barred free people of African
  descent from living in the Republic without Congress's consent and made none a citizen; an 1837 act let those here at the
  Declaration stay; the 1840 expulsion act was postponed; about 400 by the mid-1830s.
- **Free Black men in the Revolution** (`HIST-TEX-785`): Samuel McCulloch Jr. (wounded at Goliad, October 1835), Greenbury Logan
  (Concepción; wounded at Béxar), Hendrick Arnold (guide at Béxar; San Jacinto), Peter Allen (executed at Goliad). The McCullochs
  fled in April 1836 like their neighbours.
- **Enslaved people on the road east** (`HIST-TEX-787`, `-788`): about 5,000 in 1836; Dilue Harris saw "The planters from Brazoria
  and Columbia with their slaves were crossing" at Lynchburg; enslaved people escaped during the Scrape, some toward the Mexican
  army (a scholar's reading of the primary sources); Santa Anna wrote that under Mexico's laws they "should be free"; the Treaty of
  Velasco required the return of those who had taken refuge with the army. The October 1835 "rising" on the Brazos rests on a
  third-hand letter of the enslavers' rumour and the punishments; it is not in the game.
- **Names and dress** (`HIST-TEX-786`, `-789`): Tejano given names of real people of 1835-36; ranchero dress from Gregg's
  description of New Mexico, read for the art as an interpretation only.

### How families are dealt (`FIC-GONZ-980`) - built, and the owner's to change

- **Dealt with the land, when the class is made** - not a third die. A start is where a family is as well as who it is (a Tejano
  family in De León's colony, a free Black family near Liberty), and the land is dealt before anybody joins. The student reads it
  on the card before the dice (*A TEJANO FAMILY · "Autumn 1835. Your family is Tejano: Mexican Texans ..."*); the dice still decide
  the family's size and means.
- **Victoria is seated** with Gonzales and Liberty, and every family dealt there is Tejano: one in a class of 5 to 20, two in 25 or
  30. In a class of **ten or more** (two or more families at Liberty, so the owner's own Liberty family can stay Anglo in a small
  class) **one of Liberty's is a free Black family**. All the rest are Anglo-American families.
- **Played, not left over:** students join families in order, and a class is dealt thirty by default. So the first Tejano family
  and the free Black family are moved to a place among the **first six** to join, by exchanging land with a family **on the same
  side of the burn zone** - every family's land and every side the zone deals stand, whoever decides the zone (the burn-zone
  shuffle by seed, D12, is a concurrent change and composes with this).
- **Against 1835:** in the game's country (the colonies, with Béxar and Goliad, which are not starts) Tejanos were about a quarter
  of the people and free Black Texans a few hundred in all; enslaved people perhaps one in eight, who are never a start. So the deal
  **guarantees variety** rather than matching proportions: a class of 15 has one Tejano family (7%) and one free Black family (7%);
  a class of 30 two (7%) and one (3%). Matching the record would give a class of 30 about seven Tejano families and none free Black.
- **The teacher cannot set it** - built the conservative way (below, question 3).
- **Only the start's own modules read it** (tested): the names, the tones, the card, the story's lines, a Tejano family's corn and
  Seguín's company, and the lone parent's neighbours. No price, trade, work, fate, director or hidden stat reads a family's start.

### Skin tones, locked (`FIC-GONZ-981`)

Of the game's nine tones (fair, light, warm light, olive, tan, copper, brown, dark brown, deep brown):

| Start | The tones a parent may be given | Why |
| --- | --- | --- |
| Anglo-American | fair to tan (5) | colonists from the United States and Europe, sun-browned |
| Tejano | light to brown (6) | Spanish, Mexican and Indigenous descent: some as light as their Anglo neighbours |
| free Black | olive to deep brown (6) | African descent, many free people of colour of African and European descent both |

- **Overlap where history had it**: olive and tan are in all three; light to tan in Anglo and Tejano; olive to brown in Tejano and
  free Black. The ranges are the game's judgement, not a measurement.
- **The looks screen** offers only the range (the server's `choices`); the default is dealt within it; a tone outside it is refused
  in words, and a saved one does not open. **Hair, clothes and head are offered to every family** as before (question 4).
- **Children** take a tone between their parents, so inside the range. **Her children's figures are dyed now**: until today the
  `girl`, `boy` and `smallchild` figures were drawn as painted whatever their parents looked like, which would have drawn a free
  Black family's children light-skinned; `public/person-palette.js` measures their colours as it does the grown cast's.
- **A lone parent's new husband or wife** is dealt within the family's range, from the start's own names, born to a family of the
  same start (below). Hidden stats are untouched and sent nowhere.

### What each start plays like

**An Anglo-American family** (most of the class): as before, but its names come from Anglo-American pools and its parents' tones
from fair to tan. The card: *"Autumn 1835. Your family has come from the United States to land of its own near San Felipe de Austin,
in Austin's colony. Texas is part of Mexico, and most of its new settlers, like you, came from the United States."*

**A Tejano family of De León's colony, at Victoria:**
- Tejano names (José, Refugia, Teodoro, Soledad ...), tones light to brown, and it plants **corn**.
- The whole core loop, the same as any family. Victoria's own town, shops and road are as built.
- **Seguín's company.** When the word of Gonzales reaches Victoria, its man's choice is *"Go: ride for Gonzales, to join the Tejano
  volunteers (Seguín's company)"* or stay home. He goes with the army as any volunteer; when the army is on the Salado his family is
  told *"On the Salado, Juan Seguín's company of Tejano volunteers, thirty-seven men from the ranchos of the San Antonio River,
  joined the army. Rafael rides with them now: they scout round Béxar and bring in beef and corn for the army."*; after Béxar,
  that Seguín's men were given leave to guard their families. **In the spring** a Tejano man may *"Go and join Seguín's company in
  Houston's army"* (beside joining Houston's army), and is told it marches as the army's rear guard; at San Jacinto his family's
  account adds that he was with the one Tejano company and that its men wore white pasteboard on their hats and chests so no Texian
  would take them for Santa Anna's soldiers.
- In the spring Victoria is Urrea's road, and the family flees or stays as any family does. The ending's last line: *"After the war
  many Tejano families of De León's colony, the De Leóns among them, were forced from their land and their cattle taken. Some came
  back years later to find their land in others' hands."*
- **The wedding** on the lone parent's path is still by bond (the owner's decision for Victoria of 2026-09-29), with Tejano
  neighbours; the line under it now says what is and is not known (question 1).

**A free Black family near Liberty:**
- Names from the Anglo-American pools on a deck of its own (the free Black Texans of the record were Aaron, Abner, Moses, William,
  Greenbury, Hendrick), tones olive to deep brown.
- The card: *"Autumn 1835. Your family is free and Black. You have come west from Louisiana to land of your own near Liberty, in
  the Galveston Bay and Texas Land Company grant, as the Ashworths did a few years before you. Under Mexico's laws a free Black
  family may own land like any other. Not every neighbour is glad you came."*
- **Everything any family can do**, because in 1835-36 it could: farm, trade, travel, and its men may turn out and serve (as
  McCulloch, Logan and Arnold did). The game refuses it nothing.
- **Its journal is told the law as it changed**: on January 10, 1836 the council's ordinance (no more free Black people may come in;
  those here may stay), and on March 22 the constitution (no free person of African descent may live in the Republic without the
  consent of its Congress, and no Black person is made a citizen; *"Under Mexico, your family were citizens."*).
- The ending's last line: the Republic let free Black families here before independence stay but not vote; when the 1840 law
  ordered free Black people out, the Ashworths' white neighbours petitioned and the Ashworth Act let them and every free Black
  family here before independence remain.
- On the lone parent's path its first neighbours are Anglo-American neighbours who help raise the house, and its new spouse comes
  from a free Black family (the Tanners or the Bledsoes, invented).

### The people of the road east (`FIC-GONZ-985`)

- **Half a day into its flight** a family passes a planter's wagons halted by the road, and the people he held in slavery resting
  beside them - five figures, drawn where the family was, seen on the family's own page while it is within two miles and by the
  Host, for eight hours. Its journal: *"On the road the family passed a planter's wagons halted to rest, and beside them the people
  he held in slavery: men, women and children, taken east with everything else he owned. They had no say in where they went."*
- **At the first river it waits at**, a group of them waits among the families at the crossing, and the family hears *"that some
  enslaved people had slipped away in the confusion and gone toward the Mexican army, hoping to be free."*
- **Never a mechanic.** They are in no household, have no words put in their mouths, cannot be spoken to, traded with, ordered,
  helped for a reward or used, and appear in no count. Every family meets them, whatever its start.

### Art (docs/ART_REQUESTS.md, request 2026-09-29)

Astra's art wins (public/art-subjects.js). The cast is used, recoloured by the palette; four requests: the people of the road east
and a planter's halted wagon; a Tejano ranchero family's dress; faces and hair painted for the darker tones; `icon-join-seguin`.
Each has a stand-in marked `stand-in:` and a row under *Stand-ins in use*.

### Open, for the owner (built the conservative way; recommended first)

1. **A Tejano family's wedding.** The record has the bond as the Anglo colonists' way; a Catholic family of De León's colony would
   more likely have waited for the priest from La Bahía. (a) *A priest's wedding* for a Tejano family - the priest who came from La
   Bahía marries them at the family's land, the rest of the day as built; (b) keep the bond, with the line saying what is known (as
   built); (c) a betrothal on the day and the wedding when the priest comes.
2. **A Béxar start.** Tejano ranch families on the San Antonio River below Béxar were the heart of Seguín's company, and Béxar was
   the largest Tejano town. (a) Keep Victoria the one Tejano start (as built): every family's premise (new land, title pending) holds
   there; (b) add ranchos below Béxar as a start, amending the owner's "only the empresario colonies are starts" of 2026-09-14;
   (c) a Béxar family only in a class of 20 or more.
3. **The teacher and the deal.** (a) No control (as built); (b) a lobby switch on the Host's page to deal only Anglo-American
   families; (c) the Host chooses how many of each.
4. **Hair locked too?** Only skin was asked. (a) Leave hair open (as built); (b) limit the defaults, not the choices; (c) lock hair
   by start as skin is.
5. **Seguín's company in the winter's garrison.** About fifteen of his men went into the Alamo and most left after he rode out on
   February 25 (when, disputed). (a) Leave it out (as built): a Tejano man at home in the winter, as the record's leave had him;
   (b) let a Tejano man join the garrison with Seguín and leave the Alamo with Seguín's men after the 25th.
6. **The Tejano poor band's cart as a carreta.** (a) Keep "cart" (as built: the record's word for the Mexican ox cart too);
   (b) name and draw it as the carreta for a Tejano family.

### Not built, on purpose

- No Indigenous start (the owner: "too different and will require too much work for now"); no enslaved family a student plays;
  no slaveholding family (VISION.md §15).
- No kidnapping, whipping or violence against enslaved or free Black people is shown; the record of the 1835 Brazos punishments and
  the 1856 violence against the Ashworths' community is not in the game.

### Gates

| Gate | What it means |
| --- | --- |
| Dealt, and played | Victoria seated and Tejano; one free Black family at Liberty from ten families; the first of each among the first six; the zone's sides kept. |
| Old classes open | A class made before deals no starts, offers every tone, deals the mixed names; no save version moved. |
| Tones locked | Each start's range offered, dealt, refused outside, not opened outside; children between the parents; the spouse within. |
| Nothing else reads it | Only the start's own modules read a family's start. |
| Told once, at its moment | The law's two lines to a free Black family only; the Salado, the leave, the spring's company; the road's two lines; the ending's line. |
| Never a mechanic | The people of the road east are no household or entity, speak no words, and are seen only where the family is. |
| Knowledge | The start is on the family's own book, not the tick, and never on another family's page. |
## Amendment, 2026-09-29 — ages advance with the calendar (owner-decided; not released)

**The ask.** Triage D11 (the design audit's M8): *ages never advance* - a boy who turns sixteen before San Jacinto could never go,
and a baby was a baby all game; eligibility read the stored age and only eating used `ageNow`. The owner chose, by multiple choice,
**"Advance with calendar"** (`FIC-GONZ-965`).

**As built** (`sim/ages.mjs` `advanceAges`, run by `stepWorld` before anything is asked or set):

- **The birth date is the truth.** Everybody rolled since 2026-09-22 has `born`; anybody older has the one `bornOf` has always
  derived - the stored `age` as the age on the class's first day, and a birthday hashed from the class seed and the person's id, the
  same every time the class opens. Each tick counts the birthdays that fell between the minute the ages were last brought up to
  (`world.agesMinute`) and now - one day's tick, or the weeks skipped between two periods - and adds them to the stored `age`,
  writing a derived date down as `born` first (so it is never derived again from an age that has moved). Counting the birthdays
  that pass, rather than setting `age` to the calendar's, moves only what a birthday moves: an age set any other way (a test's
  fixture, a family rolled mid-class on its own day) is carried on from, never overwritten.
- **Everything that reads an age follows at once**, because it reads `age`: sent anywhere at ten (`tooYoung`), answering a call and
  going to the fighting at sixteen (`canAnswerCalls`, `canFight`), the oldest child of seven stepping up (sim/acting.mjs), a baby
  put down to walk at two (sim/babies.mjs `isBaby`), the children's works by age (sim/children.mjs), what each eats, how they are
  drawn (`ageBand`), and the age on the family panel (the page shows the tick's age over the family book fetched earlier, and
  fetches the book again when an age changes).
- **Said in the journal**: a child's birthday (*"It is Sam's birthday: 8 years old today."*), and the two that change what the
  family may do (*"… is ten today, and old enough now to be sent on errands and set to any work of the place."*; *"… is sixteen
  today, and old enough now to answer for the family and to go to the fighting if he is sent."*). A grown person's passes quietly.
- **At ten** a child's own automation (sim/childhood.mjs, for children under ten) is put away: from then on they are set to work as
  anybody grown is. **At two** the baby's own state is put away.
- A baby being carried who turns two stays in the arms that carry them until set down; only their baby state waits for that.
- **Old saves**: no save version. A class saved before this has no `agesMinute`: the first tick after it opens sets it to that
  minute, so nobody's age jumps on opening, and counts on from there; its birth dates are the ones `bornOf` derives, stable.
- **Why `age` moves rather than every reader asking `ageNow`**: about 140 places read `age`, many with no world to ask the
  calendar; moving the stored age on each birthday made all of them follow with one change, and kept `sim/family.mjs` untouched for
  the other work in it.

Tested in `tests/owner-rules.test.mjs` (a boy of fifteen can fight after his sixteenth birthday and is told so once, and the page
shows sixteen over the book's fifteen; a baby of one and a child of nine turn two and ten by the class's own ticks; an old save's
derived date is stable and written down, and opening it again moves nothing), each seen failing by injection
(`npm run test:owner-rules-injections`).

## Amendment, 2026-09-29/30 — the owner's answers on the family's start

**The owner answered all six questions of *The family's start*** (2026-09-29, the first four; 2026-09-30, the last two). Built on
branch `starts-2` (not released). Claims `HIST-TEX-790`, `-791`, `FIC-GONZ-987` to `-990`; `HIST-TEX-781` and `-782` amended.

| Question | Owner's answer | What is built |
| --- | --- | --- |
| 1. A Tejano family's wedding | **"Priest from La Bahía"** | On the lone parent's path a Tejano family is married by an unnamed priest come up from La Bahía to say Mass in the colony, before its neighbours, with no bond (sim/courtship.mjs `riteFor`, `rite: 'priest'`). The line under it says only what is documented: De León's colony had a log church and no priest of its own; a priest came from La Bahía when he could; Anglo colonists signed a bond instead. Anglo-American and free Black families keep the bond. `FIC-GONZ-987`. |
| 2. A Béxar start | **"Béxar at 20+"** | Below. It amends the owner's rule of 2026-09-14 that only empresario colonies are starts (COLONIES.md §5.1). |
| 3. The teacher and the deal | **"No control"** | As built. |
| 4. Hair | **"Open"** | As built. |
| 5. Seguín's men in the winter garrison | **"Join, then leave"** | Below. `FIC-GONZ-989`. |
| 6. The Tejano poor band's cart | **"i could have sworn i saw astra make that already. if not then yes."** | Astra has drawn the carreta (`carreta-travel-e/-n/-s`, `carreta-idle-*`, `carreta-loaded-e`, delivered 2026-09-26; public/art-subjects.js lets hers win). A Tejano family of the poorest means comes with the **family carreta**: named so, said so on the pack screen and in the arrival, drawn with her frames. It holds, carries and seats as the cart does - the start never changes what a family can do. No stand-in or request to retire: her carreta was already drawn for the carreta made at home. `FIC-GONZ-994`. |

### The family on a rancho near Béxar (`FIC-GONZ-988`; `HIST-TEX-790`, `-791`)

**The research**, in brief (HISTORY.md has the quotations): a belt of Tejano ranchos ran down the San Antonio River from Béxar to
Goliad, and families held the old mission lands. Juan Seguín raised his company at the ranchos, starting with a meeting at Salvador
Flores's. Cos's garrison held the town and was hard on suspected rebels; families split between the sides. The Texian army came to
the missions (Concepción, October 28), Flores's riders burned the grass (November 14), the storming took the town (December 5-9) and
the capitulation protected the people's persons and property. In mid-February 1836 Tejano riders warned of Santa Anna, and the
Seguín and Flores families went east with oxcarts and sheep before he took the town on February 23. Mexican detachments collected corn
and cattle from the ranchos. In March Houston sent Flores to guard the lower ranchos, and Flores protected fleeing families in the
Scrape. Seguín took back Béxar on June 4, and families came home to ranchos wasted by both armies and, in the years after, lost land
to newcomers.

**How it is dealt.** In a class of **twenty or more**, one family - taken from the colonies' deal (`startCounts`) - is a Tejano family on
a rancho 2 to 12 miles from Béxar by the San Antonio River, at least a mile and a half from the army's camps at Concepción and Espada
(so its farm is never on a battle's ground), **always inside the burn zone** (Santa Anna came to Béxar), and moved among the first six
families to join on its side of the zone. There is room near Béxar for exactly one family inside the zone, which is why it is one.
Measured: the land comes out 3 to 4 miles from the town, north or south of it on the river; the card says "near Béxar", not "below". **Since the owner's "Downriver only" (2026-09-30), south only: 3.1 to 4.4 miles down the river toward Goliad.**

**What it plays like, and when** (every day and hour is the game's; the events are the record's):

| When | What the family has |
| --- | --- |
| September 28 | The card: *"Your family is Tejano: Mexican Texans. You are taking up a rancho on the San Antonio River near Béxar, the oldest town in Texas ... A Mexican garrison holds the town, and your neighbours do not all take the same side."* A store and a carpenter at Béxar (invented) serve it. |
| Early October | The fight at Gonzales by rider, as every family. |
| October 19-20 (the army leaves the Cibolo) | **Seguín's call, from home**: *"Juan Seguín of Béxar is going from rancho to rancho ... raising a company of Tejano volunteers ... Does somebody from your family ride with him?"* - *Go: ride with Seguín's company to the army* - and he rides from the family's land to wherever the army is, and is Seguín's (the Salado, the leave after Béxar, the spring's company, San Jacinto's pasteboard, as for Victoria's Tejano). |
| October 28 | *"Early this morning the family heard guns up the river toward Mission Concepción ..."* |
| November 14 | Flores's riders burning the grass toward the Medina. |
| December 5 | The storming's cannon, day after day. |
| December 11 | The capitulation's terms: the people of Béxar protected in their persons and property, nobody troubled for the side he took. |
| Mid-February | Herrera's warning, heard at the rancho (sim/surprise.mjs). |
| February 23 | The bell of San Fernando and the town emptying, seen from the rancho. |
| February 26 | Mexican soldiers riding to the ranchos for corn and cattle; *"the families who stood with the Texians keep out of their way."* Nothing is taken from the family's own stores (`ceiling:`). |
| March 6 | Heavy firing from the Alamo before dawn, then quiet; by afternoon the word down the river that it has been stormed - **what the family knows**, the day it happened, so the fate of its own man there (if any) is told from it. |
| March 14 | **The word to leave, from Seguín's men**: *"the families of the ranchos who stood with the Texians are going east, and Salvador Flores's riders will see them along the road."* The Scrape as any family's, from the far west of it, with two days before Santa Anna's foragers reach the farm (Sesma's column went out from Béxar on March 11). A family that does not answer in time loses the house to **Santa Anna's foragers**, not the Texas army, which was a hundred miles off. |
| The ending | *"After San Jacinto, Juan Seguín took back Béxar for Texas on June 4, 1836. The families of the ranchos who came home found them wasted by both armies, and in the years after many Tejano families of Béxar lost their land to newcomers."* |

**Survivable for a class.** The family is never inside a battle: its land is off the missions and 3 miles or more from the town, and
the fights it hears are journal lines. A member at Béxar on February 23 is shut in the Alamo, as anybody of any family is; a man of
the family in the garrison is one of Seguín's and rides out on the 25th (below). The order to leave comes with two days' warning.

### Seguín's men in the winter garrison (`FIC-GONZ-989`)

A Tejano family's man of sixteen or more who joins the garrison at Béxar (the winter's *Join the garrison at Béxar*, any Tejano
family) is told *"Juan Seguín and some of his Tejanos are in Béxar this winter with the garrison, and Rafael is with them."* If the
Mexican army shuts the garrison in on February 23 he is inside; on **the night of February 25** - when Travis sent Seguín and Antonio
Cruz out as couriers (`HIST-TEX-431`) - he **rides out with them** for Gonzales, released as a courier is, before Travis's own riders
are chosen that night, and the family is told: *"... Rafael, one of Seguín's men, rode out with them and is riding for Gonzales. Most
of Seguín's men left the Alamo in those days; exactly when is not known."* When the Alamo's fall reaches the family, it is told he
had ridden out with Seguín and was not inside when it fell. A woman of the family shut in the Alamo is not one of Seguín's men.

### Forks the owner may want to decide (built the conservative way; recommended first)

1. **The Béxar family's wedding.** Béxar had its own parish priest at San Fernando (Refugio de la Garza), a Mexican loyalist inside the
   town through the siege. (a) The priest from La Bahía, as for every Tejano family (as built - the owner's words); (b) the parish
   priest of Béxar for the Béxar family.
2. **What the Mexican foragers take.** (a) Said, not taken (as built); (b) a share of the family's corn and a few head of its cattle
   taken on February 26, and said.
3. **Taken prisoner at home.** A Béxar family that stays when the foragers reach the rancho is taken as any family is (sim/scrape.mjs's
   rule, unchanged). The record read does not say Tejano rancho families were taken. (a) Keep the one rule for every family (as built);
   (b) a Béxar family that stays is not taken, only its farm burned.
4. **The Béxar family's rancho on the map.** (a) Near Béxar, where the land allows (as built, 3-4 miles, north or south); (b) only down
   the river toward Goliad, where the ranchos of the record lay, which may need the land rule loosened.

**Owner-decided, 2026-09-30:** 1 **"Priest from La Bahía"**, 2 **"Mentioned only"** and 3 **"Taken prisoner"**, all as built; 4
**"Downriver only"**, built on branch `starts-3` (not released): the rancho lies at least 3 miles down the line from Béxar toward
Goliad (sim/starts.mjs `downriver`), keeping the burn zone, the missions' clearance and the join slots. The land rule did not need
loosening: in 25 seeds of 20-30 families every class had its Béxar family, 3.1 to 4.4 miles down the river between Concepción and
Espada; a map with none would give the seat back to its colony (`colonySeatFor`). The measurements are docs/COLONIES.md §5.1's.
