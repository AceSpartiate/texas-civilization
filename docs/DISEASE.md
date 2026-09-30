# Disease — which sicknesses, where, and what rest does

**Status: built 2026-09-27 (not released).** Written 2026-09-27 for the owner's request of that day; the owner answered §7
the same day, by multiple choice; build steps 0–9 (§6) are built, as §9 says, with what differs from the plan said there.
The plan (§1–§6) is kept as it was written, so the reasoning stays readable; where it and §9 disagree, §9 is what the game does.

> "also, plan for diseases. keep it historical as to which ones. stopping to rest should help characters recover."
> — the owner, 2026-09-27

Read with: `VISION.md` §4 (*Legible causality*: "Do not use hidden punitive RNG to create arbitrary tragedy"; *Persistent
consequences*; *Runaway Scrape payoff*) and §16 (no gore), `docs/SCRAPE.md`, `docs/ROAD_EAST.md` §2 (nursing),
`docs/CHILDREN.md` §6–7 (sick babies, the sick child let over first), `docs/WEATHER.md` §10.5 (the cold weight),
`docs/HOUSTON_CAMP.md` §5 (the `ceiling:` of no sickness in camp), `docs/FAMILY_CREATION.md` §4–5 (hidden strength and
health), and `docs/COLONIES.md` L1072 (the owner's "sickness, rarely fatal … around one person in a hundred over the
whole flight").

---

## 1. What exists today

Checked against `main` at `ed4147b` on 2026-09-27. There is **one sickness**, `health.condition === 'sick'` with a
`recoversAt` minute. It has no name and no stages. The student sees the word "sick", and it can be caused in two places.

### 1.1 How somebody falls sick

| Where | Code | Rule |
| --- | --- | --- |
| **On the road east** (`flight.status` fled, refuged, returning) | `sim/scrape.mjs` L393–418 (`advanceFlight`), constants L82–86 | Once per calendar day, each living member with the family (not a man serving with the army, L387–391) who is `well` or `tired` falls sick at `1 − (1 − SICK_PER_DAY)^weight`, where `SICK_PER_DAY = 0.004`. The draw is the hashed `share(world, id, 'sick:<day>')`, so a class replays the same way. |
| **On the family's own land in a norther with no roof up** | `sim/routines.mjs` L108–150 (`coldAtHome`) | Same rule, same constants, once a day: only a family whose shelter is a camp (`shelterOf(...).kind === 'camp'`), only on a norther day (`coldSky`), with `cold: true` in the weight. The comment at L115–117 sets a deliberate `ceiling:`: "there is no sickness at home in any other weather". |

**The weight** is `sicknessWeight` (`sim/scrape.mjs` L111–112). It is `frailty(person)`
(`sim/army.mjs` L511–516: 0.4–1.6 from hidden strength and health), ×2 for a child under six, ×2 when the family is out
of food, and ×2 (`COLD_WEIGHT`, L102) in a norther with no roof and no camp fire (`fireKept`, `sim/flight-work.mjs`
L149–150, `FIC-GONZ-488`). A child's strength and health grow toward adult values until sixteen, with a health floor of
0.3 (`sim/family.mjs` L235–247). So age already shapes risk twice: through frailty and through the under-six doubling.
Worked through: a grown man of average traits weighs about 0.8, and a toddler about 3.

Rain is left out on purpose (L94–96: "doubling the sickness for half the spring as well would make the road a lottery").

### 1.2 Mending and death

- **On the road**, a sick person turns `well` at `recoversAt`, which is `SICK_DAYS = 5` days after falling sick
  (L412, L414). On each day sick they die at `1 − (1 − DEATH_PER_SICK_DAY)^weight`, with `DEATH_PER_SICK_DAY = 0.02`
  (L408–411). That is about 10 in 100 over a five-day sickness at a weight of 1, and about 26 in 100 at a weight of 3.
  The death is told plainly: "*X died of the sickness on the road, and was buried where they fell.*" (`HIST-TEX-065`).
  Nothing is drawn. `STILL_CONDITIONS` in `public/motion.js` L97 draws no casualty.
- **Nursing** (`tend-sick`, `sim/road.mjs` L602–615, `FIC-GONZ-052`): one person of the family nurses for a day and the
  family halts (`halts: true`). On that day nobody sick dies (`sim/scrape.mjs` L403–408, `tended`). When the day's six
  work-steps are done, every sick person with the family has their `recoversAt` brought a day nearer. It is refused
  when nobody is sick (L543) and is offered only on the road or at the refuge.
- **Invalid state**: `roadInvalid` refuses "A sickness with no mending", meaning `sick` with no finite `recoversAt`
  (`sim/scrape.mjs` L591).

### 1.3 What else reads "sick"

| Reader | Code | Effect |
| --- | --- | --- |
| Who rides | `sim/company.mjs` L93, L108 (`FIC-GONZ-394`) | The seats in the wagon and cart, and the family's horse, go to the sick first and then the youngest. The plan is made once when the family sets out (`ceiling:` L31), so somebody who falls sick on the way does not move into a seat. |
| The crossing | `sim/flight-work.mjs` L72–73, L157–162 (`HIST-TEX-639`, `FIC-GONZ-489`) | A family with a sick child under ten waits half as long at a flooded crossing. |
| Babies | `sim/babies.mjs` L57–60, L209–249, L286–291, L328, L374–382 (`FIC-GONZ-483`) | A sick baby cries twice as often, is held a tick longer (`SICK_COMFORT_TICKS` 3), is never capped by the carer's daily limit, and its row reads "Sick. …". |
| Houston's baggage | `sim/houston.mjs` L208–228; `sim/san-jacinto.mjs` L268–269 (`HIST-TEX-083`, `FIC-GONZ-442`) | A man who is sick or hurt at Harrisburg stays with the baggage and is not in the line. |
| The Host's words | `sim/host.mjs` L58–93 | Every place-phrase gets the prefix "*sick, …*". |
| Automatic families | `sim/neighbours.mjs` L244–252 | On the road, the sick are never sent to work, and somebody is sent to `tend-sick` whenever anyone is sick. |
| Work at home | `sim/routines.mjs` L55 | Only `well` people count as workers who bring in the day's food. A sick person eats and brings nothing in. |
| Chores | `sim/chores.mjs` L1302 | Only dead or captured people are refused. **A sick person can be sent to any chore** and pays nothing extra for it. |
| The doctor | `sim/shops.mjs` L177–189 | The doctor sets a tired person right and halves the time left on a hurt. **The doctor refuses a sick person** ("*X is well, and the doctor has nothing to do*", because the refusal checks only `tired` and `minor-injury`). |
| Drawing | `public/motion.js` L100–102 | `sick` is an `ORDINARY_CONDITION`, drawn doing whatever the person is doing. "A sick pose is nobody's request yet." The delivered `injured-rest` clip is used for pose `sick` only in battle scenes (`public/battle-view.js` L1228). `tests/motion-binding.test.mjs` fails if `sim/` names a condition this list does not classify. |

### 1.4 Rest today

Rest mends **tiredness only**. `restAndTire` (`sim/routines.mjs` L74–106) lowers `exertion` while `task === 'rest'` and
the person is not travelling, scaled by the shelter (`restShare`: 0.85–1.15 by house, lower in a camp) and furniture.
**Rest does nothing for a sickness.** A sick person on the road mends at the same speed whether the family is moving,
halted, or camped at its refuge. Only the day of nursing shortens it.

### 1.5 A bug found while writing this: sickness away from the road never mends

`advanceRoutine` mends only `minor-injury` and `wounded` when their `recoversAt` passes (`sim/routines.mjs` L68–70).
`sick` is mended **only** inside `advanceFlight`'s loop (`sim/scrape.mjs` L412), and that loop runs only for a family on
its flight and only for members who are not serving. So:

- **Somebody made sick at home by a norther (`coldAtHome`) stays sick until the family flees in the third period**, or
  for the rest of the class if it never does. Checked 2026-09-27 with a scratch script (not committed): a
  `createGonzalesWorld('sick-home', 8, { map: 'colonies' })` class settled with `tests/support/settled.mjs`, one person set
  `sick` with `recoversAt` two days ahead, stepped eight calendar days. The person was **still `sick` six days after
  `recoversAt`**, standing at home. While that lasts they bring in no food (§1.3), and a sick baby cries double without
  end.
- The period boundaries do not clear it either. `sim/periods.mjs` L93–94 clears only wounds.
- The same is true for **a man serving with the army**. He is excluded from the road's roll (L387–391), so a `sick` state
  he carries into service never ends. `BAGGAGE_CONDITIONS` then reads it at Harrisburg.
- No test covers mending away from the road. `tests/cold.test.mjs` counts people falling sick and never checks that
  they get well.

Build step 0 (§6) fixes this, whatever the owner decides about the rest of this plan.

### 1.6 What the record behind today's model is

The model today is "rain, cold and hunger", which is `HIST-TEX-065`'s "disease, cold, rain and hunger" with the disease
left unnamed. The owner's decision behind the numbers is `docs/COLONIES.md` L1072: "Sickness, rarely fatal … around one
person in a hundred over the whole flight, so a family's preparation matters." The rates are `FIC-GONZ-046`, the nursing
is `FIC-GONZ-052`, and the cold is `FIC-GONZ-135`.

`HIST-TEX-029` sets a limit that must hold: **no disease deaths should be rolled for the siege of Béxar, November 2 to
December 4**, because none were found in the record.

---

## 2. What the record says: the diseases of Texas, 1835–36

Research done 2026-09-27. "Read" means the words were read in the source's own text: Dilue Rose Harris in the
*Quarterly of the TSHA* vol. 4 (archive.org djvu text of `quarterlyoftexas4190texa`), Smithwick's *Evolution of a State*
(archive.org `evolutionofstat00smit`), and Austin's letters of November 1835 (archive.org `jstor-30243051`). "Summary"
means a page read through a fetching tool that returns a model's summary; its wording must be checked before it is
quoted to a class, which is this repository's standing rule. The classifications are the ones `HISTORY.md` uses.

### 2.1 The table

| Disease (period names) | Who, where and when in 1835–36 | Evidence | Recommendation |
| --- | --- | --- | --- |
| **Measles** | **Refugees at the Trinity, late March–April 1836**: "Measles, sore eyes, whooping cough, and every other disease that man, woman, or child is heir to, broke out among us" (Harris, read). **Houston's army, April 1836**: "Because the measles had broken out in the army, I deemed it prudent to give permits to those afflicted to go to their homes, and some eight men were discharged", near Roberts' in heavy rain about April 16, where he gave a measles patient his own cloak (Labadie, *Texas Almanac* 1859, summary of the sonsofdewittcolony transcription). About one man in ten at Groce's had measles (Hardin, *Texian Iliad* p. 188, known only through notes on a Wikipedia talk page and not read). | **DOCUMENTED** for the Scrape and the army. **The one-in-ten figure is unchecked.** | **In.** The Scrape's disease. |
| **Whooping cough** | Refugees at the Trinity (Harris, read). Harris's little sister "was very sick" and "in convulsions", and she "died and was buried in the cemetery at Liberty". The sister's disease is not named. Also among the army at Groce's (Hardin via the talk page, unchecked). | **DOCUMENTED** (Trinity). The sister's disease is **not stated**. | **In**, for children. |
| **Chills and fever, the ague** (intermittent or remittent fever, "bilious fever"; malaria as we know it now) | Newcomers every summer and autumn, worst in the river bottoms. *Texas Gazette*, October 13, 1829, says "newcomers have been troubled with chills and fevers, and a few cases have occurred of severe bilious attacks", with no deaths in Austin's settlement (quoted by a secondary post, not read). Smithwick, 1827–28: "exposure … brought on fever and I was bedridden for weeks", nursed by his host, "in the intervals between relapses of the fever I made the gin irons"; the Brazos bottom's moss "swarming with mosquitoes and pregnant of malaria"; settlers had "to build on the lowlands along the rivers and take chances on overflows and ague". Lemuel Blakey's father "died of fever at Brazoria within a few weeks" of arriving in 1832. In January 1836: "I was taken down with fever while in Bastrop, but was convalescent when Crockett came on" (all Smithwick, read). | **STRONGLY SUPPORTED** as the settlers' common disease. The 1835 season itself is **not documented**. Smithwick's Bastrop fever is **DOCUMENTED** but not named as ague. | **In**, for the first period's autumn on bottomland, with winter relapses. |
| **Camp flux** (diarrhoea, dysentery, "bloody flux") | **Béxar siege, November 1835**: Austin, "My health which has been very bad from severe dysentery since the army left the Cibolo, has improved within the last few days" (read; `HIST-TEX-029`), with "no medicine in camp". Austin was also "salivated", meaning dosed with mercury (Bryan, October 26; `docs/battle-research/concepcion.md` §3.3). **Houston's army**: "cramps, colics and diarrhoea" on the march from the Trinity to the Colorado (Labadie, March 1836). At Groce's, "a great deal of sickness prevailed among the men" and "the increase of diarrhoea in the army" brought "great discontent" (Labadie, summary). Santa Anna's recruits: dysentery on the march (Wikipedia), which `docs/battle-research/winter-1835-36.md` L135 partly corrects. | **DOCUMENTED** in both Texian camps. | **In**, for crowded camps. **No deaths in the Béxar window** (`HIST-TEX-029`). |
| **Lung fever, a chill on the chest** (pneumonia, pleurisy, "exposure") | The army at Groce's: "most of those stricken with maladies brought on by their almost constant exposure to spring rains gradually improved" (Hardin, `HIST-TEX-078`). Refugees in the Trinity bottom spent a night "without fire or anything to eat" and were found "cold, wet, and hungry" (Harris, read). Bowie's "disease of a peculiar nature" has been called pneumonia (`HIST-TEX-542`; the diagnosis is DISPUTED). Pneumonia is also the usual killer that follows measles (CDC, *Measles: clinical overview*, checked 2026-09-27: "respiratory and neurologic complications"). | **STRONGLY SUPPORTED**. The period wording is generic ("maladies", "exposure"). | **In.** It is today's sickness, given a name. |
| **Sore eyes** (conjunctivitis) | Refugees at the Trinity (Harris, read). "Pink eye" at Groce's (Hardin, unchecked). | **DOCUMENTED** | **Words only.** One line, no mechanic. |
| **Mumps, influenza ("flue"), colds** | Groce's (Hardin p. 188 via the talk page). | **Unchecked secondary** | **Words only**, if at all. |
| **Cholera** | **1833–34, not 1835–36.** Brazoria, February 16, 1833: three cases in one family newly arrived from the United States. The paper printed a card from Drs. Parrott and Cox "expressing their opinion that the disease was not contagious" (TSHA *Parrott, Thomas F. L.*, summary). Velasco, April 1833: of about twenty people, most were sick and several died (`docs/town-research/velasco.md` L823). In 1834 Velasco was left at about 100 people (TSHA *Velasco, TX*, summary). Goliad and Victoria were struck in 1834 (J. Villasana Haggard, "Epidemic Cholera in Texas, 1833–1834", *SWHQ* July 1937, via a newspaper summary: 91 deaths at Goliad and 25 at Victoria). Brazoria was held "sickly" afterward, and the courts moved to Columbia (`docs/town-research/columbia.md` L445). TSHA *Epidemic Diseases*: "cholera appeared in 1833 and caused some deaths". **No cholera was found in Texas in 1835 or 1836.** | **DOCUMENTED** for 1833–34. **Not found** for 1835–36. | **Out** as a disease. **In** as memory: the talk of Brazoria, Velasco, Goliad and Victoria (§3.9). |
| **Yellow fever** | TSHA *Yellow Fever* (Penny Clark, summary): the best-known early epidemic is Galveston, 1839. John R. Harris died of yellow fever in New Orleans in 1829 (`docs/town-research/harrisburg.md` L77). An editor's note to Harris says a Mrs. King died of it "in Houston in 1836". Houston was founded in August 1836, so the date is doubtful. | **Not found** in Texas 1835–36. **DISPUTED** (the Harris note). | **Out.** |
| **Smallpox** | Inoculation in Béxar in 1806, and a Mexican decree of 1830 giving aid to smallpox sufferers (TSHA *Public Health*, Robert Bernstein, summary). Boards of health formed at San Felipe (1831), then Béxar, Goliad and Nacogdoches. | **DOCUMENTED** before 1831. **Not found** in 1835–36. | **Out.** |
| **Typhoid** ("typhus", slow or nervous fever) | Not told apart from typhus until the later 1830s. The only link to this period is one of the diagnoses offered for Bowie ("typhoid pneumonia", DISPUTED, `HIST-TEX-542`). | **Not found** | **Out.** A long "fever" in the record is left to the ague and lung fever. |
| **Consumption** (tuberculosis) | Christmas 1836: "a Mr. Gordon died with consumption" (Harris, read). Offered as the likelier cause of Bowie's illness (DISPUTED). | **DOCUMENTED** as present. It is a chronic disease. | **Out.** It is too slow for a class. |
| **Scurvy** | Nothing found in any source read. | **Not found** | **Out.** |

### 2.2 How it looked then, and how we understand it now

| | People in 1835 thought it spread by… | We know it spreads by… | How long, from the record and modern medicine | Who died of it |
| --- | --- | --- | --- | --- |
| Measles | "Catching", which families knew from experience. Labadie sent the sick men home. | A virus in the air, from about 4 days before the rash to 4 days after. The rash comes about 14 days after exposure (CDC, checked 2026-09-27). Having it once protects for life. | About 10–14 days before anyone knows, then about a week sick and more weeks weak. | Babies and small children, and grown people who never had it as children (CDC: at highest risk are those "<5 years" and adults over 20). The deaths were mostly from lung complications, and far more among the hungry and the cold. In the Union army, 1861–65, over 4,000 of about 67,000 men who took it died, roughly 6 in 100 (Essential Civil War Curriculum and Hektoen summaries of the *Medical and Surgical History*). That is a guide to soldiers in camp, not a Texas count. |
| Whooping cough | "Catching" among children. | Bacteria, from coughing. | Weeks: a cold for 1–2 weeks, then 1–6 weeks of coughing fits with the whoop, then 2–3 weeks of mending (CDC). The "hundred-day cough". | Babies under a year, above all under six months (CDC). Older children almost never. |
| Ague | Miasma, the "bad air" of bottoms and swamps. Mosquitoes were noticed as a torment and not as the cause (Smithwick). Newcomers were "seasoned". | Anopheles mosquitoes breeding in standing water, biting at night (CDC). Transmission stops with a hard frost. The common American form (vivax) comes back months later. | Fits of shaking chill and burning fever, often every other day. Laid up for days to weeks (Smithwick: "bedridden for weeks"), then relapses. | Seldom grown people (*Gazette* 1829: no deaths "from that cause"). Sometimes a newcomer (Blakey), a small child, or anybody already worn down. |
| Flux | Bad water, bad food, the foul air of a camp. | Germs from human waste reaching water and food, carried by flies and hands. Worst where many camp together with no latrines. | Days to a couple of weeks. Can drag on. | Small children and the weakened, from losing water. Among Union soldiers the several forms of flux killed 44,558 (same summaries). That is a camp disease at its worst. |
| Lung fever | A chill, being wet and cold. | Usually germs taking hold in lungs already weakened by cold, hunger, exhaustion or measles. | About a week to two. | The very young, the old, and the frail. |

### 2.3 Treatment and nursing in 1835–36

These are shown and never endorsed. §3.8 has what the game does with them.

- **Calomel** (mercurous chloride, a mercury compound), **quinine or "the bark"** (Peruvian bark), **tartar emetic**
  (an antimony salt that makes a person vomit), and **bleeding**. Smithwick's medicine chest was "for the most part …
  calomel, quinine, and tartar emetic", and he saw doses that left patients "dry and shrunken" and "bleeding" used as a
  cure (read). Austin was "salivated" in October 1835, which is mercury poisoning from calomel given as a treatment.
  After the battles, "doctors … administered calomel, quinine, opium, ipecac, and other drugs" (TSHA *Health and
  Medicine*, Chester R. Burns, summary). Ashbel Smith used bleeding and opium at Galveston in 1839 (TSHA *Yellow Fever*).
- **What we know now**: **quinine really does act on the ague** (malaria). Calomel, tartar emetic and bleeding did harm:
  they poisoned, emptied the body of water, and weakened the patient. The doctors of Brazoria told the public that
  cholera "was not contagious", which was wrong.
- **Nursing was the family's.** "Mothers nursed their infants and attended their sick children and husbands" (TSHA
  *Health and Medicine*). Harris's mother "had nursed an infant and the sick child until she was compelled to rest"
  (read, `HIST-TEX-072`). Smithwick was nursed through weeks of fever by the judge who took him in, then by the
  Fulshears, "burning with fever, tormented with gnats and mosquitoes" (read).
- **Sick-food was kept back.** Harris's mother kept "rice, tea, dried apples and white sugar … for hard times and
  sickness" (read, 1833–34).
- **Rest, in the record's own words.** On the Scrape, "After resting a few days our party continued their journey"
  (Harris, read, at Liberty). At Groce's the sick "gradually improved" during the army's two weeks in camp (`HIST-TEX-078`).
  Smithwick tried to travel too soon, "had miscalculated my strength", and "was again prostrated", so his companion
  "waited for me to rest up" (read). **The owner's rule is the record's rule.**
- **Most sickness was not fatal.** Harris again: the families who went on from Liberty had had "a great deal of sickness,
  but no deaths" (read).

---

## 3. The proposed design

### 3.1 The principles

1. **Every sickness has a cause the family can see**, named on the row and in the record: "*Mary has the measles. Her
   brother had it at the Trinity.*" There is no sickness from nowhere, and no death without a visible stage first.
2. **There is still a die**, the hashed share `sim/shares.mjs` already uses. It is the owner-approved "randomness
   inside a visible risk" of VISION §4. Each chance is **stated**: "*Very sick. She could die if she is not nursed and
   kept warm.*"
3. **Nobody dies from `sick`.** Death is possible only from **very sick**, a stage the student sees and has at least one
   day to answer. Nursing on that day still means nobody dies that day (`FIC-GONZ-052`, kept).
4. **Rest is the cure the game offers, as the record does.** Resting mends faster and makes getting worse less likely.
   Travelling on foot and working do the opposite. Riding is in between.
5. **One rule, one place.** All of it lives in one new `sim/disease.mjs` that the road, home, the camp and the refuge
   all call. This is the lesson of `sicknessWeight` (`sim/scrape.mjs` L104–110): "they must not drift apart".

### 3.2 The diseases in the game

The day-counts are calendar days (`sim/clock.mjs`: "**Days** … a wound mending … are read off the calendar"). At the
campaign pace a day of 1836 is about two ticks, roughly 19 real seconds. A week-long measles therefore passes in about
two real minutes: long enough to see and answer, too short to be a chore.

| Id | Name on the row | Where and when it can start | How it spreads in the game | Days sick (base) | Can it turn very sick? | Rest matters? |
| --- | --- | --- | --- | --- | --- | --- |
| `measles` | "has the measles" | Period 3: the crowded places of the record while the record has it there (§3.4). From one member to the rest of the family. From a man sent home from the army's camp with it (Labadie). | Contact: within the family, and at the listed crowded places on the listed days | 7, then weak (§3.3) | Yes. Most for under-twos, never-had grown people, the hungry and the cold | Strongly |
| `whooping-cough` | "has the whooping cough" | Period 3: the same crowded places. From child to child in a family. | Contact, among children under ten | 21 (it is long) | Babies under one only (*since §9.5: babies most, and small children under five*) | Yes. A sick baby also needs holding (existing rule) |
| `ague` | "has the chills and fever" | Period 1, from arrival to the first hard norther after November 1 (the frost), for a family whose house stands in `bottomland` or `bottomland-cane` (`sim/woods.mjs` `standAt`), and much less on the prairie. Relapses in period 2. | Not between people (mosquitoes, unknown to them). The game says "*the fever of the river bottoms*". | 6, with one relapse chance in the next 60 days | Seldom. Small children only | Yes |
| `flux` | "has the flux" | Any crowded camp after two days in it: Houston's camp, a refuge, a long wait at a crossing among many families (Lynch's ferry, the Trinity), and the siege of Béxar (**no deaths there**, `HIST-TEX-029`). | "*The camp's water is fouled*": the crowd and the days in it. Moving on, or camping apart, clears it. | 5 | Small children and the weakened | Yes |
| `lung-fever` | "has a chill on the chest" | Today's causes, unchanged: a norther with no roof and no fire, hunger, and the road. Also the usual way measles turns very sick. | Exposure, not between people | 5 (today's `SICK_DAYS`) | Yes, as today's sickness can kill | Yes |

"Sore eyes" (and, if the owner wants them, mumps and influenza) are **words only**. They are one line in a crowded
place's news, with no state.

**What the owner's diseases do not include, and why** (§2.1): cholera (none found in 1835–36), yellow fever (none found
in Texas then), smallpox (none found then), typhoid (not identified), scurvy (not found), consumption (chronic).

### 3.3 Stages

`health.condition` stays `'sick'` throughout. Every reader in §1.3 keeps working unchanged, and
`tests/motion-binding.test.mjs` gets no new condition to classify. New fields sit beside it:

```
health: { condition: 'sick', recoversAt, disease: 'measles', grave: true?, since, relapse? }
```

- **Sick**: mending toward `recoversAt`. Each day it may **turn very sick** at the day's worsening chance (§3.5).
- **Very sick** (`grave: true`): the row reads "*Very sick — could die without nursing and warmth.*" Each day not
  nursed carries the disease's death chance (§3.6). After two days very sick, and on any day nursed while resting,
  it falls back to *sick*. There is no further worsening that day.
- **Mending** is the last third of the days, and the row says "*mending, about N days*". A measles or whooping-cough
  patient is **weak** for three days after getting well. That is a plain rider on `tired` (existing: it walks slower
  and hunts worse) and needs no new state.
- A **death** is told as it is today, one plain line with a disease name and place: "*Sarah died of the measles at
  Liberty, and was buried there.*" This is Harris's own shape: "died and was buried in the cemetery at Liberty". Nothing
  is drawn. `STILL_CONDITIONS` already shows none.

### 3.4 Where and when: the crowded places

The record puts measles and whooping cough in named places on named days. The game keys exposure to those places,
not to a model of infection running between players. That keeps it historical, reproducible and explainable.

| Place (map site) | Days of 1836 (to be fixed against `SETTLEMENT_DAYS` and the road's calendar) | What goes round | Source |
| --- | --- | --- | --- |
| The Trinity crossing and Liberty | From about March 25 into April | Measles, whooping cough, sore eyes | Harris (`HIST-TEX-639`, `-072`) |
| Lynch's ferry (Lynchburg) | While the crowd waits (`HIST-TEX-070`, five thousand) | Measles, whooping cough, flux | Harris (the crowd). Disease at Lynch's is **RECONSTRUCTED** from the Trinity's. |
| Any refuge or crossing where more than a set number of families are camped | Any day of period 3 | Flux, after two days | Labadie (the army's flux), applied to a crowd |
| Houston's camp at Groce's, Bernardo and the march east | April 1–20 | Measles, flux | Labadie; `HIST-TEX-078`; Hardin (unchecked) |
| The siege lines before Béxar | November 1835 | Flux, **never fatal** | Austin (`HIST-TEX-029`) |

Word of it travels as word does (`docs/LIVING_INFORMATION.md`): "*There is measles among the families at the Trinity.*"
A family can then choose to cross elsewhere, camp apart, or hurry through. That is a real choice with a real cost, and
it is the Runaway Scrape payoff VISION §4 asks for.

**Within a family**: when a member takes measles or whooping cough, every member who can take it is **exposed**, and
the record says so plainly: "*Measles is in the family. Anyone who has not had it may take it in about ten days.*" Each
exposed person takes it on a hashed day 10–12 days on, at the disease's household chance (measles 9 in 10 of those who
can take it). Modern attack rates in a household are about that; the exact figure is `FIC`.

**Who has had measles.** It is **shown, not hidden**. A family knew who had had the measles, and showing it makes the
risk legible. It is dealt once from the class seed and the person's id, as obedience was for old saves
(`docs/CHILDREN.md` §4), and grows more likely with age: few young children, most grown people. The person's card
says "*Had the measles as a child*". A person who takes it gets `had: ['measles']` written. When the field is absent,
the dealt value applies, so no old save changes.

### 3.5 What shapes the risk: body, age, and what the family does

The daily chance of **falling sick** (for the non-contagious ones) and of **turning very sick** are both
`1 − (1 − base)^weight`, with the same shape as today. The weight is today's `sicknessWeight` extended:

| Factor | Multiplier | Visible to the student? |
| --- | --- | --- |
| Frailty (hidden strength and health) | 0.4–1.6, as today | **No**, as today. This is the owner-approved hidden stat (`docs/FAMILY_CREATION.md` §4). |
| Age | Per disease: measles and lung fever ×3 under two, ×2 under six, ×2 for a never-had grown person. Whooping cough ×6 under one, ×2 under five, and nothing to fear over ten. | Yes. Age is on the card. |
| Out of food | ×2, as today | Yes. The food count |
| Cold with no roof and no fire | ×2 (`COLD_WEIGHT`), as today | Yes. The weather and the fire |
| **What the sick person is doing** | **Resting ×0.5 · riding ×1 · walking or working ×2** | **Yes. This is the owner's lever.** |

So a toddler with the measles, hungry, walking in a norther weighs about 3 × 3 × 2 × 2 × 2 = 72 in the worsening roll,
and the same toddler fed, warm and resting weighs about 4.5. That is sixteen times safer. Every step of the difference
is something the family chose and the row showed.

### 3.6 Deaths, honest by age and bounded by the owner

The record gives **no count** for the Scrape ("many persons died", `HIST-TEX-065`; "a great deal of sickness, but no
deaths", Harris). The owner has set the bound: **about one person in a hundred over the whole flight** (`docs/COLONIES.md`
L1072). The proposal keeps that as the whole-class figure **for all diseases together**. It then distributes deaths by
age the way history did, which is **mostly babies and small children**:

| Disease | Death chance per day **very sick and not nursed** (base; × weight) | Target per case, for a family that rests, feeds and nurses | Target per case, for a family that pushes on hungry and cold |
| --- | --- | --- | --- |
| Measles | 0.03 | under two: about 1 in 100; others: nearly none | under two: about 8 in 100; never-had grown: about 3 in 100 |
| Whooping cough | 0.03, **babies under one only** | under one: about 2 in 100 | under one: about 10 in 100 |
| Ague | 0.01, under six only | nearly none | about 1 in 100 under six |
| Flux | 0.02 | under five: about 1 in 100 | under five: about 5 in 100 |
| Lung fever | 0.02 (today's) | as today, about halved | as today |

These are `FICTIONAL FOR GAMEPLAY` numbers, **tuned rather than claimed**, and set against the owner's bound by a
measurement script (build step 8). If the measured whole-flight figure goes over the bound, the base rates come down
and the ratios between ages stay.

**No sickness deaths in the siege of Béxar** (`HIST-TEX-029`), and none in the first period at all unless the owner says
otherwise. The ague of 1835 had "not one single instance of death" in Austin's settlement in 1829.

### 3.7 Rest: what it does, where, and what it costs

The owner's sentence is the design: **stopping to rest helps characters recover.** Rest works in two ways, and the row
shows both. It **speeds mending** and it **lowers the chance of getting worse**.

| What the sick person is doing | Days of mending a calendar day counts as | Worsening weight (§3.5) | Where this is |
| --- | --- | --- | --- |
| **Resting in bed**: `task: 'rest'`, no chore, not travelling | **2** (Q3 option A) | ×0.5 | At home. At the refuge. In a halted family's camp. In Houston's camp, relieved of duty. |
| Resting under a roof (a house or a town's tavern), or by a fire kept tonight | 2, and no cold weight | ×0.5 | As above, warm |
| Riding in the wagon or cart, or on the horse | 1 | ×1 | The family moving, the sick in the seats (`sim/company.mjs`) |
| Walking, or at any chore or work | 0.5 | ×2 | Anywhere |
| Nursed today (`tend-sick`, done) | +1 on top | and no death today, as now | Anywhere nursing is offered (§3.8) |

**Rest in the game's existing words.** At home the idle state *is* rest (`task: 'rest'`, `docs/FAMILY_PANEL.md` §11:
"Resting counts as idle"). So **a sick person the student leaves alone mends at the rested speed.** The clock never
punishes a student for not noticing. The choice the student makes is to **not** rest: send the sick person to a chore,
keep the family moving, or leave the refuge.

**On the road, stopping is the choice.** The family moving means everybody sick is riding or walking. So:

- **A new road chore, `rest-road`, "*Stop and rest a day*"** (`halts: true`, anyone of ten or more, offered only when
  somebody is sick or tired). The family halts a calendar day. Everyone sick counts as resting in bed, and everyone
  tired rests as at home. It is the Harris party "resting a few days" at Liberty, and Smithwick's companion who "waited
  for me to rest up".
- **Every other halt counts too.** A sick person who is not the one doing the work rests while the family waits at a
  crossing, digs out of a bog, hunts, fishes or nurses. Waiting is rest. The record's families were stopped for days at
  the Trinity and at Lynch's.
- **At the refuge** a family is camped and still, so its sick rest. This is Harris's mother "compelled to rest" at
  Liberty.

**What rest costs**, and the card says it before the choice:

- **Miles not made.** The Mexican columns do not halt (`sim/road.mjs`'s `tend-sick` text already says so). A family that
  rests inside `WARNING_MILES` risks being overtaken, with its existing consequences.
- **Food eaten** with nothing gained: a day's `eatenADay` for everyone.
- **Work not done**: at home, a resting person brings no food in (`sim/routines.mjs` L55 already), and a chore waits.
  In Houston's camp, a man resting does not drill, which is the steady-in-the-line cost (`DRILL_TO_STEADY`).
- **Crowded places cut both ways.** Resting at the Trinity, where measles is going round, exposes the family longer.
  The row and the news say so, and the family weighs one risk against the other.

**Working while sick** is **allowed with a warning**, not refused (Q4): "*Mary is sick. Working slows her mending and she
may get worse.*" **Very sick** people are refused every chore and journey ("*Mary is too sick to get up.*"). They can
still be carried, as the sick are today.

### 3.8 Nursing, warmth, food, water and the period remedies

- **Nursing** stays `tend-sick` (`FIC-GONZ-052`) with its day and its promise, and gains two things. It is offered
  **at home and in Houston's camp too** (at home it does not halt anybody, because nobody is travelling), and a
  nursed very-sick person steps back to sick. The nurse must be someone of ten or more. The babies' rule
  (`FIC-GONZ-483`) is unchanged: a sick baby is held longer and more often, and **holding a sick baby for a whole day
  counts as that baby's nursing**. That is a small bridge: the carer is doing it already.
- **Warmth**: a roof or a fire kept (`camp-fire`, `FIC-GONZ-488`) removes the cold weight, as now, from every disease.
- **Food**: out of food doubles the weight, as now. Keeping back **sick-food** is Harris's rice and tea, as an option
  (Q7): a family that bought "*a little rice and tea for sickness*" at the store (`sim/shops.mjs`) can give one sick
  person a day of it, which counts that day as nursed for mending (not for death). This is flavour with a small effect,
  and it can be left out.
- **Clean water**: nobody in 1836 knew it mattered, so the game does not give the student a modern boiling order. What
  the period **did** do is move off a foul campground and camp apart from a crowd. The game gives exactly that: the
  flux clears from a family that leaves the crowded place. The line reads "*The camp's water is fouled. The family
  moved upstream, away from the crowd.*"
- **The doctor** (`sim/shops.mjs` L177–189) sees the sick, not only the tired. Q6 decides what the doctor does. The
  recommendation, option B, is honest and small:
  - **For the ague**, "*the bark*" (quinine) **really helps**: the days left are halved and a relapse is prevented.
    This is true, so the game can let it be true.
  - **For everything else**, the doctor gives calomel or bleeds. The record line tells it plainly ("*The doctor gave
    James calomel, as doctors did, and bled him*") and it has **no benefit**. Under Q6 option C it also leaves the
    patient **weak** for two days. A short *What we know now* line in the ending's revelation says calomel was mercury
    and bleeding weakened people, so the game shows the period without teaching it as medicine.
  - The doctor's advice is to rest, and resting is what helps.

### 3.9 Cholera, yellow fever and smallpox as words

They are not diseases in play (§2.1). They belong in the **living information** as talk: the Brazoria and Velasco
families' memory of 1833 ("*Brazoria was a sickly place after the cholera*"), Goliad's losses of 1834, and a board of
health at San Felipe. These are one or two lines in the town talk (`docs/TOWNS.md`), each with a claim ID. They are
optional (Q1).

### 3.10 What the student sees and chooses

- **The row** (`docs/FAMILY_PANEL.md`): the person's line becomes, for example, "*Has the measles — resting, mending in
  about 5 days*", "*Has the chills and fever — walking; resting would mend it sooner*", or "*Very sick — nurse her, keep
  her warm*". The words carry the sickness, as the family panel's rule has always been.
- **An icon**: a small sick badge on the portrait (a stand-in drawn from the existing `tend-sick` glyph, "a figure under
  a blanket with a cup", `public/family-panel.js` L664). A **"!"** appears when somebody turns very sick, because that
  is the moment to answer. The badge's real art is a new request in `docs/ART_REQUESTS.md` in its contract format, and
  the stand-in is marked `stand-in:` in code and listed under *Stand-ins in use* (CLAUDE.md, missing art).
- **The drawn figure**: a sick person resting is drawn lying down, using the delivered `injured-rest` clip that battles
  already bind to pose `sick` (`public/battle-view.js` L1228). A sick person riding or walking is drawn as they are, as
  today. This replaces the `ceiling:` in `public/motion.js` L100–101.
- **The family's record** holds every step with its cause and claim ID: exposed, fell sick, very sick, nursed, mending,
  well, or died.
- **The choices**: rest or push on, nurse or not, fire or not, camp at the crowded crossing or apart, go to the doctor,
  and who sits in the wagon. On the seats, the plan is made once today (`ceiling:` `sim/company.mjs` L31). The way out
  named there, re-planning when somebody falls sick, becomes worth building here (build step 2).

### 3.11 Automatic families

The families nobody plays (`sim/neighbours.mjs`), absent students' families (`docs/HOST_PAGE.md`) and people on auto
(`sim/auto.mjs`) follow the documented middle course:

- They never send a sick person to work, at home or on the road (today they do this only on the road, L244).
- They nurse whenever somebody is sick (as L252 does now) and **rest the family a day (`rest-road`) whenever somebody is
  very sick**, unless a Mexican column is within warning. A warned family "does nothing but go", as today.
- They use the doctor for the ague when in a town with coin.
- They do not avoid crowded places. The record's families mostly did not either.

Their rolls are the same shares as a played family's, so a family's odds never change when its student leaves
(`docs/HOUSTON_CAMP.md`'s rule).

### 3.12 The Host's view

- `sim/host.mjs`'s prefix names the disease: "*sick with the measles, at Liberty, fled from home*" or "*very sick, …*".
- **The class panel** counts it in words: "*Measles among the families at the Trinity: 4 sick.*"
- **The Rumor Mill** (`docs/HOST_PAGE.md`) carries the going-round news as it reaches the families, with its claim.
- **The spotlight never goes to a disease death**, and above all not a child's (§4). A played family's "very sick" may
  be spotlighted only if the owner wants it (Q8).
- **The ending's revelation** adds the *What we know now* lines (mosquitoes, germs, calomel) and the record's honest
  "no count of the dead".

### 3.13 Save compatibility: no `saveVersion` bump

Every new field has a correct empty value (CLAUDE.md's `sim/trade.mjs` rule):

| Field | Absent means |
| --- | --- |
| `health.disease` | The generic sickness every class has today. It is shown as "*sick*" and mends as lung fever does. |
| `health.grave` | Not very sick |
| `health.since`, `health.relapse` | Nothing to relapse. `since` is read only for the record. |
| `person.had` | The dealt value (§3.4) |
| `household.exposed` (disease → the day it takes, per person) | Nobody exposed |
| `household.flight.restDay` (the `rest-road` day) | Not resting |
| `world.goingRound` (optional cache of §3.4's table) | Computed from the calendar |

`roadInvalid` (`sim/scrape.mjs` L591) and `validateWorld` check each new field **only when present**: a known disease
id, a boolean `grave`, finite minutes. A class saved today opens, and its sick mend (build step 0) as generic sickness.

---

## 4. Classroom tone

- **Plain and not gruesome.** The words are the period's everyday ones: *sick*, *very sick*, *the measles*, *the
  whooping cough*, *the chills and fever*, *the flux*, *a chill on the chest*. There are no symptoms beyond one plain
  word where it teaches something ("*the whoop*", "*shaking with the chill*"), and never anything about bodily fluids.
  "The flux" is the period word and stays unexplained on the row. Its *What we know now* line says "a sickness of the
  stomach from fouled water".
- **Deaths from disease were the commonest deaths of the time, and mostly children's.** Pretending otherwise would
  falsify the Scrape: Harris's sister and Rabb's baby are the record's two named deaths. The recommendation (Q2,
  option A) is **children can die of disease, at the rates of §3.6, told as the record tells it, in one plain sentence
  with no drawing, no spotlight and no public announcement on the Host.** The death appears in that family's record
  and on its row (as every death already does) and in the Host's class panel only as a count. It is never on the
  projector as a name. A child's death **never** costs or earns glory (`docs/MONEY_AND_GLORY.md`: "A casualty never
  earns extra").
- **The game already lets children die of the road's sickness.** Today's loop has no age limit, and a child under six
  weighs double (§1.1). Q2 asks the owner to confirm this deliberately. It was never asked on its own.
- **Teacher note** (for `docs/HOST_PAGE.md` or the launcher's teacher guide): the class may see a family member die of
  illness. It is historical and it is told briefly. A teacher who wants a gentler class can choose Q2 option B or C for
  that class, **if** the owner wants a Host setting (Q9).
- **Rest and nursing are the student's power**, and the design makes sure a careful family almost never loses anyone.
  The lesson is that preparation, food, shelter and care mattered, which is VISION §4's Scrape payoff. It is not that
  children died at random.

---

## 5. Proposed `HISTORY.md` rows

**IDs**: `HISTORY.md` at `ed4147b` has its highest IDs at `HIST-TEX-650` and `FIC-GONZ-632`. Other branches are open
the same day (`tests/history-registry.test.mjs` records a collision of exactly this kind on 2026-09-27). So these rows
take a **deliberately distant block, `HIST-TEX-700`–`-706` and `FIC-GONZ-700`–`-706`**. They are **to be renumbered to
the next free IDs when registered**, and the registry test will catch a clash. They are proposed here only and are not
in `HISTORY.md`.

**Registered 2026-09-27, renumbered twice**: `HIST-TEX-700`–`706` are `HIST-TEX-669`–`675` and `FIC-GONZ-700`–`706` are
`FIC-GONZ-669`–`675`, in the same order; `FIC-GONZ-676` is new (rice and tea at the store). They were first renumbered to
`-661`–`-667` (and `FIC-GONZ-668`), which the Scrape's routes and chases had registered the same day (`HIST-TEX-660`–`-668`,
`FIC-GONZ-660`–`-667`, docs/SCRAPE.md §11–§16); on merging the two the Scrape kept its numbers and these moved on by eight. The rows as registered are in
`HISTORY.md`, amended from these where the build differs (§9).

| Stable ID | Exact historical claim | Classification and direct citation | Implementation note |
| --- | --- | --- | --- |
| **HIST-TEX-700** | **Measles and diarrhoea in Houston's army, March–April 1836.** On the march from the Trinity to the Colorado Labadie treated "cramps, colics and diarrhoea"; at Groce's "a great deal of sickness prevailed" and "the increase of diarrhoea" brought discontent; about April 16, near Roberts', "the measles had broken out in the army" and "some eight men were discharged" to go home; he gave a measles patient his cloak in the rain. | **DOCUMENTED** — N. D. Labadie, "San Jacinto Campaign", *Texas Almanac* 1859, transcribed at [sonsofdewittcolony.org/sanjacintolabadie.htm](http://www.sonsofdewittcolony.org/sanjacintolabadie.htm); read 2026-09-27 through a fetching tool that returns summaries, **wording to be checked before it is quoted to a class**. Upgrades `HIST-TEX-078`'s "measles … in search summaries only". | Measles and flux in Houston's camp (§3.4); a man sent home sick carries measles to his family (build step 4). |
| **HIST-TEX-701** | **The sickness at Groce's by kind.** About one man in ten had measles; others influenza, whooping cough, pink eye, mumps, diarrhoea and colds; Groce's house was the surgeons' hospital. | **STRONGLY SUPPORTED, unchecked** — Stephen L. Hardin, *Texian Iliad* (1994), p. 188, **known only through reading notes on Wikipedia's *Talk:Texas Revolution/Hardin*** (read 2026-09-27). The book was not read. | Not to be quoted or used for a number until the page is read. |
| **HIST-TEX-702** | **Sickness without deaths, and rest, on the Scrape.** The families who went on from Liberty had had "a great deal of sickness, but no deaths"; "After resting a few days our party continued their journey"; "Mother was sick" on the road east after Liberty. In 1833–34 Harris's mother kept "rice, tea, dried apples and white sugar … for hard times and sickness". | **DOCUMENTED** — Dilue Rose Harris, "Reminiscences", *Quarterly of the TSHA* 4 (1900–01), pp. 167–168, read 2026-09-27 in the archive.org djvu text `quarterlyoftexas4190texa`; the sick-food in part I (`jstor-30242653`). | Rest mends (§3.7); most sickness is not fatal (§3.6); sick-food (§3.8, optional). |
| **HIST-TEX-703** | **Chills and fever: the settlers' common disease, worst in the bottoms, with relapses and long lying-up.** Smithwick: "exposure … brought on fever and I was bedridden for weeks", nursed by his host; "relapses of the fever"; the Brazos bottom "pregnant of malaria"; settlers had "to build on the lowlands along the rivers and take chances on overflows and ague"; Lemuel Blakey's father "died of fever at Brazoria within a few weeks" of arriving (1832); Smithwick himself "taken down with fever while in Bastrop" in the winter of 1836 and "convalescent when Crockett came on". The *Texas Gazette*, October 13, 1829: "newcomers have been troubled with chills and fevers", no deaths in Austin's settlement. | **DOCUMENTED** (Smithwick, *The Evolution of a State*, 1900, archive.org `evolutionofstat00smit`, read 2026-09-27); **STRONGLY SUPPORTED** (the *Gazette*, seen only as quoted by a secondary post). **That there was ague in the autumn of 1835 is RECONSTRUCTED.** | The ague of period 1 on bottomland, with relapses into period 2 (§3.2). |
| **HIST-TEX-704** | **Cholera in Texas was 1833–34.** Three cases in one newly arrived family at Brazoria, February 1833, with doctors Parrott and Cox publishing their opinion "that the disease was not contagious"; Velasco struck in April 1833; Velasco left at about 100 people in 1834; Goliad and Victoria struck in 1834; **no cholera found in 1835 or 1836**. | **DOCUMENTED** — TSHA *Parrott, Thomas F. L.*; TSHA *Velasco, TX*; TSHA *Epidemic Diseases* ("cholera appeared in 1833 and caused some deaths"); J. Villasana Haggard, *SWHQ* July 1937 (via a newspaper summary for the Goliad and Victoria counts, **unchecked**); read 2026-09-27 as summaries. | Words only: the towns' memory (§3.9). No cholera in play. |
| **HIST-TEX-705** | **The period's remedies.** A settler's medicine chest "for the most part … calomel, quinine, and tartar emetic", and bleeding as a cure (Smithwick, of the late 1820s); Austin "salivated" (mercury) in October 1835; after the battles doctors gave "calomel, quinine, opium, ipecac"; nursing was the family's ("Mothers nursed their infants and attended their sick children and husbands"). | **DOCUMENTED** — Smithwick (read); Bryan, October 26, 1835 (`docs/battle-research/concepcion.md` §3.3); TSHA *Health and Medicine* (Chester R. Burns), summary, 2026-09-27. | The doctor's remedies (§3.8): the bark helps the ague, which is true; calomel and bleeding do not help, which is shown and not endorsed. |
| **HIST-TEX-706** | **Diseases not found in Texas in 1835–36**: yellow fever (earliest documented Texas epidemic Galveston 1839; a Harris editor's note of a death "in Houston in 1836" is doubtful, Houston being founded that August); smallpox (aid decreed 1830; boards of health 1831 on); typhoid (not identified); scurvy (not found). | **Not found / DISPUTED** — TSHA *Yellow Fever* (Penny Clark); TSHA *Public Health* (Robert Bernstein); Harris, *Quarterly* 4, p. 170 note by Adele B. Looscan (read); 2026-09-27. | Why these are out (§2.1). |
| **FIC-GONZ-700** | **FICTIONAL FOR GAMEPLAY** | **The five diseases and their stages** (`sim/disease.mjs`, docs/DISEASE.md §3.2–3.3): measles, whooping cough, ague, flux and lung fever; sick, very sick, mending; death only from very sick; the day-counts. | |
| **FIC-GONZ-701** | **FICTIONAL FOR GAMEPLAY** | **Where it goes round**: exposure keyed to the record's places and days (§3.4), with Lynch's ferry RECONSTRUCTED from the Trinity; within a family, the 10–12 day wait and the household chance; who has had the measles, dealt by age and shown. | |
| **FIC-GONZ-702** | **FICTIONAL FOR GAMEPLAY** | **Rest**: resting counts two days of mending and halves the worsening weight; riding one and ×1; walking or working a half and ×2; every halt is rest; `rest-road` (§3.7). The owner's "stopping to rest should help characters recover" (2026-09-27), and Harris's "after resting a few days". | |
| **FIC-GONZ-703** | **FICTIONAL FOR GAMEPLAY** | **The death rates by age and disease** (§3.6), tuned to the owner's bound of about one in a hundred over the flight, with none in the siege of Béxar (`HIST-TEX-029`). | |
| **FIC-GONZ-704** | **FICTIONAL FOR GAMEPLAY** | **Nursing extended** (amends `FIC-GONZ-052`): nursing at home and in camp; a nursed very-sick person steps back to sick; a whole day's holding of a sick baby is its nursing. | |
| **FIC-GONZ-705** | **FICTIONAL FOR GAMEPLAY** | **The doctor and the remedies** (§3.8): the bark halves the ague; calomel and bleeding give no benefit (and, if chosen, two days weak). | |
| **FIC-GONZ-706** | **FICTIONAL FOR GAMEPLAY** | **Flux and the fouled camp**: flux after two days camped in a crowd; moving on or camping apart clears the risk. | |

`HIST-TEX-078`'s implementation note changes from "**Not built**: no sickness in the camp" to point at
`HIST-TEX-700` and §3.4 when build step 4 lands.

---

## 6. Build steps, in order

Each step is a commit that passes `npm test`. Every new test is **seen failing first**: inject the exact regression it
guards, watch that test and only that test fail, then remove the injection (CLAUDE.md). Where a step changes what a
student or the Host sees, it gets a same-computer browser proof in the repository's pattern (a
`scripts/*-browser-proof.mjs` with evidence JSON under `docs/evidence/` and screenshots). No step claims physical LAN or
district acceptance.

0. **Sickness mends everywhere** (bug §1.5, independent of every owner question).
   - Change: `advanceRoutine` mends `sick` at `recoversAt` for anybody not in a flight's loop: at home, in town, in
     service. The flight keeps its own loop, and a person must not be mended twice in a day.
   - Tests: (a) a person sick at home is `well` the day after `recoversAt` (**fails today**, verified by the scratch run
     in §1.5); (b) a serving man sick in Houston's camp mends; (c) a person made sick by `coldAtHome` mends; (d) the road
     still mends exactly once. Injections: remove the new branch → (a)–(c) fail; mend in both places → (d) fails.
   - No browser proof. This is a sim-only change.
1. **`sim/disease.mjs`, names only.** The disease table, the `health.disease` field, today's two causes labelled
   `lung-fever` (cold) and generic, the row, record and Host words naming it, and validation of the new fields when
   present.
   - Tests: vocabulary (every id has a name, a line and a claim); an old save with bare `sick` opens and mends; an
     unknown disease id is refused by `validateWorld`. Injections for each.
   - Browser proof: a sick person's row and the Host's live page read "*sick with a chill on the chest*". Phone width
     at 400 px with nothing sideways, and no page errors.
2. **Rest.** The activity factor (§3.7) on mending and worsening; the **very sick** stage and "death only from very
   sick"; `rest-road`; every halt counts as rest; working while sick warned and very sick refused; the `injured-rest`
   pose for the resting sick; re-seating the sick on the road (lifting the `sim/company.mjs` L31 `ceiling:`).
   - Tests: the pure function gives exactly 2 / 1 / 0.5 days and ×0.5 / ×1 / ×2 (injection: swap two factors); a
     resting patient is well in half the days of a walking one over a real `stepWorld` run; nobody dies from `sick`
     (search the seed space for a share that would have killed under today's rule and assert no death); a nursed
     very-sick patient steps back to sick; `rest-road` halts the family and a column still advances; a class saved
     mid-sickness keeps its `recoversAt`.
   - Browser proof: a family on the road with a sick child; the row says "*walking; resting would mend it sooner*";
     *Stop and rest a day* from the row, the icon's glow and the family halted; the row then says "*resting, mending in
     about N days*"; the sick figure drawn lying down; the "!" on turning very sick; the Host's words; 400 px; no
     errors.
3. **Measles and whooping cough within a family.** Exposure, the 10–12 day wait, `had`, and whooping cough for under
   tens only.
   - Tests: an exposed sibling takes it on a day inside the window and not before; a person who has had measles never
     takes it; a grown person's dealt `had` share matches its table over a large sample; an old save with no `had`
     deals without writing. Injections for each.
   - Browser proof: the card's "*Had the measles as a child*"; the record line "*Measles is in the family …*".
4. **The crowded places** (§3.4), including Houston's camp (lifting the `ceiling:` in `docs/HOUSTON_CAMP.md` §5), flux
   at crowded camps, the Béxar siege's non-fatal flux, and a man discharged home with measles.
   - Tests: a family camped at the Trinity in the window can take measles and one outside it cannot; flux after two
     days in a crowd and not after one; **no sickness death between Nov 2 and Dec 4 1835** (`HIST-TEX-029`, injection:
     remove the guard); the news line reaches a family by the ordinary word system and not before it could.
   - Browser proof: the Rumor Mill line, the class panel count, and a family choosing to camp apart.
5. **The ague of period 1**: bottomland homes, the frost ending it, and relapses in period 2.
   - Tests: a bottomland family can take it in October and a prairie family much less (measured over seeds); none after
     the first hard norther past November 1; a relapse only for someone who had it.
6. **The doctor and the remedies** (after Q6): the bark for the ague, and calomel or bleeding as decided.
   - Tests: the doctor now accepts the sick (**fails today**, `sim/shops.mjs` refuses them); the bark halves the ague's
     days and nothing else; the calomel line and its effect exactly as the owner chose.
   - Browser proof: the doctor's shop card for a sick person.
7. **Automatic families and the Host** (§3.11–3.12).
   - Tests: an auto family never sends a sick person to work at home; it rests a day when somebody is very sick and not
     when a column is within warning; its odds match a played family's over the same seeds; the spotlight never lands on
     a disease death.
   - Browser proof: the Host page's words and class panel.
8. **Measurement.** A `scripts/disease-study.mjs` in the manner of `scripts/rifle-food-study.mjs`: many seeded classes
   through period 3 with auto families, reporting deaths per hundred by age and by disease, for careful and careless
   families. Evidence goes in `docs/evidence/disease-study.json`. The base rates are set so the whole-flight figure
   meets the owner's bound (Q5). Then `npm run test:whole-game`.
9. **Documentation**: `HISTORY.md` rows (renumbered), `HANDOFF.md`, `GAME.md`, `TECH.md`, `docs/ROAD_EAST.md` §2,
   `docs/HOUSTON_CAMP.md` §5, `docs/CHILDREN.md` §6, `docs/FAMILY_PANEL.md` (the row's words and the badge), and
   `docs/ART_REQUESTS.md` (the sick badge and a lying-sick figure for the road, with their stand-ins).

---

## 7. Questions for the owner — answered 2026-09-27

**The owner answered by multiple choice on 2026-09-27.** The answers, in the owner's order (the numbering of the questions
below is the plan's):

1. **Diseases**: **the five the record supports** — measles, whooping cough, camp dysentery (the flux), chills and fever (the
   ague) and a chill on the chest; cholera, smallpox and yellow fever only as the memory of earlier years (Q1 A).
2. **Children can die of disease**: **yes, told plainly** — one plain sentence to the family; not drawn, not spotlighted, no name
   on the Host's projector (Q2 A).
3. **Rest**: **twice the mending, half the risk**; an idle sick person counts as resting (Q3 A).
4. **Spread between families**: **only at the record's places and dates** (the Trinity, Liberty, Lynch's ferry, Houston's
   camp …), announced as news so a family can choose to camp apart; within a family, anywhere (Q8 A).
5. **A sick person can work**: **yes, with a warning** (slower mending, higher risk); a very sick person can't get up (Q4 A).
6. **Deaths**: **about 3 in 100 over the whole flight** for all diseases together — the owner chose the harsher option over the
   recommended 1 in 100 — mostly babies and small children, as history had it; none at the Béxar siege per the history notes
   (Q5 C). This replaces the "one in a hundred" of `docs/COLONIES.md` L1072, which now says so.
7. **Remedies**: **quinine helps chills and fever; calomel and bleeding leave the patient weak for two days**, shown plainly and
   never endorsed (Q6 C).
8. **The ague**: **in the first period, on river-bottom land**, until the first hard norther after November 1, with relapses into
   the winter (Q10 A).
9. The recommended answers taken, and recorded as such: **rice and tea kept "for sickness"** (Harris) as a small store item that
   helps mending (Q7 B); **no Host setting** for a gentler class (Q9 A).

What was built from them is §9 below. The questions as they were put follow, unchanged.

1. **Which diseases?**
   (A) **Recommended**: measles, whooping cough, chills and fever (ague), camp flux and lung fever in play; sore eyes as
   words; cholera, smallpox and yellow fever only as the towns' memory of earlier years, because none was found in
   1835–36.
   (B) Only measles and whooping cough, the two the Scrape's record names, plus today's exposure sickness.
   (C) All of (A), plus cholera in play despite the record.

2. **Can children die of disease?** (The game already lets them today, §1.1 and §4.)
   (A) **Recommended**: yes, at the §3.6 rates, mostly babies and small children, as history had it; one plain
   sentence; no drawing, no spotlight, no name on the projector; and a careful family almost never loses anyone.
   (B) Only grown people can die of disease; children fall sick and always mend.
   (C) Nobody dies of disease; very sick is the worst it gets.

3. **How strong is rest?**
   (A) **Recommended**: resting counts **two days** of mending a day and **halves** the chance of getting worse; walking
   or working counts half and doubles it.
   (B) Gentler: 1.5 days and ×0.75.
   (C) Rest is required: no mending at all unless resting (or riding).

4. **Can a sick person work?**
   (A) **Recommended**: yes, with a warning, and they mend slower and may get worse; a very sick person cannot get up.
   (B) Nobody sick can work or travel on their own feet.
   (C) As today: sickness changes nothing about work.

5. **How many deaths?**
   (A) **Recommended**: keep your bound of **about one in a hundred over the whole flight**, now for all diseases
   together, with none at Béxar and none in period 1.
   (B) Fewer: about one in two hundred.
   (C) Nearer the record's "many persons died": about three in a hundred, still weighted to the small and the
   uncared-for.

6. **The period remedies.**
   (A) Flavour only: the doctor's words, no effect.
   (B) **Recommended**: the bark (quinine) really helps the ague, because it did; calomel and bleeding are told plainly
   and do nothing; the ending says what we know now.
   (C) As (B), and calomel or bleeding also leaves the patient weak for two days, showing that they did harm.

7. **Harris's sick-food** (rice and tea kept "for sickness").
   (A) Leave it out.
   (B) **Recommended**: a small store item that counts one day as nursed for mending.

8. **Can sickness spread between families at crowded places?**
   (A) **Recommended**: yes, but **only at the record's places and days** (the Trinity, Liberty, Lynch's ferry,
   Houston's camp), announced as news, so a family can choose; never computed player to player.
   (B) Yes, freely: a sick family can infect any family camped beside it, anywhere.
   (C) No: only within a family.

9. **A Host setting for sickness?**
   (A) **Recommended**: no setting; one experience for every class, as the owner has preferred.
   (B) A launcher switch between Q2 (A) and Q2 (C) for a class that needs gentler handling.

10. **The ague in period 1.**
    (A) **Recommended**: yes, on bottomland, until the first hard norther after November 1, never fatal to anyone over
    six, with a relapse chance in period 2 (Smithwick's winter fever at Bastrop).
    (B) No disease in period 1 at all; disease belongs to the Scrape.

---

## 8. Sources (all checked 2026-09-27)

- Dilue Rose Harris, "The Reminiscences of Mrs. Dilue Harris", *Quarterly of the Texas State Historical Association*
  4 (1900–01). Read in full text: archive.org `quarterlyoftexas4190texa` (parts II–III) and `jstor-30242653` (part I).
  Transcription at [sonsofdewittcolony.org/roseharris.htm](http://www.sonsofdewittcolony.org/roseharris.htm).
- Noah Smithwick, *The Evolution of a State* (1900). Read in full text: archive.org `evolutionofstat00smit`.
- Stephen F. Austin's letters, November 1835. Read in full text: archive.org `jstor-30243051`.
- N. D. Labadie, "San Jacinto Campaign", *Texas Almanac* 1859. Read as a summary of
  [sonsofdewittcolony.org/sanjacintolabadie.htm](http://www.sonsofdewittcolony.org/sanjacintolabadie.htm).
- Mary Crownover Rabb, *Reminiscences*. Read as a summary of
  [txgenwebcounties.com/burnet/CrownoverMary.html](https://www.txgenwebcounties.com/burnet/CrownoverMary.html). The baby's
  death on the road is given with no cause.
- *Handbook of Texas* (TSHA), all read as summaries: *Epidemic Diseases* (Burns, rev. Wooten); *Yellow Fever* (Clark);
  *Health and Medicine* (Burns); *Public Health* (Bernstein); *Military Medicine* (Bernstein); *Labadie, Nicholas
  Descomps* (Henson); *Parrott, Thomas F. L.*; *Velasco, TX*; *Groce, Jared Ellison* and *Bernardo Plantation* (the
  hospital at Groce's, via a search summary).
- Stephen L. Hardin, *Texian Iliad* (1994), p. 188, **not read**; seen only via
  [Wikipedia, Talk:Texas Revolution/Hardin](https://en.wikipedia.org/wiki/Talk:Texas_Revolution/Hardin). Hardin, "The
  Generalship of Sam Houston", at
  [sonsofdewittcolony.org](http://www.sonsofdewittcolony.org/adp/archives/feature/hardin.html) (the spring rains).
- J. Villasana Haggard, "Epidemic Cholera in Texas, 1833–1834", *SWHQ* 40 (July 1937). Seen via a newspaper summary
  ([southtexasnews.com](https://www.southtexasnews.com/beeville_bee_picayune/news/features/cholera-in-texas-in-1833-in-san-antonio-and-goliad-et-al/article_be2a7bc2-8fa3-11ea-ba61-0f580f772ffb.html)).
- *Texas Gazette*, October 13, 1829. Seen only as quoted by a secondary post (Traces of Texas); **unchecked**.
- CDC, *Measles: clinical overview*; *Pertussis: clinical signs*; *About malaria*. Read as summaries, for how the
  diseases work as we know now.
- Union army measles and flux counts: Essential Civil War Curriculum and Hektoen International summaries of the *Medical
  and Surgical History of the War of the Rebellion*. Used as a guide to camp disease, not as a Texas figure.
- In this repository: `HISTORY.md` rows `HIST-TEX-029`, `-065`, `-070`, `-072`, `-078`, `-083`, `-542`, `-639`, `-642`,
  `-643`, `FIC-GONZ-046`, `-052`, `-135`, `-394`, `-483`, `-488`, `-489`; `docs/battle-research/concepcion.md` §3.3,
  `grass-fight.md` §3.4, `winter-1835-36.md` L135, `famous-people.md` (Bowie); `docs/town-research/velasco.md`,
  `columbia.md`, `goliad.md`, `victoria.md`, `refugio.md`, `harrisburg.md`.

**Not reached**: Pat Ireland Nixon, *The Medical Story of Early Texas, 1528–1853* (1946); Anson Jones's *Memoranda*;
Alexander Ewing's reports; Houston's camp orders of April 1836; Haggard's article itself; the unexpurgated Harris
notebooks. Reading Nixon and Haggard would firm up §2.1's ague and cholera rows. Hardin p. 188 must be read before
`HIST-TEX-701` (registered as `HIST-TEX-670`) is used for anything.

---

## 9. As built — 2026-09-27 (not released)

Built on a worktree branch from `main` `e937b72` for the owner's answers of §7. Everything is `sim/disease.mjs` except the
hooks named here; the plan's §3 is what was built unless this section says otherwise.

### 9.1 What was built, step by step

0. **Sickness mends everywhere.** `mendSickness` (called by `stepWorld` straight after the roads move) mends everybody sick in a
   family, wherever they are; the road's own loop no longer mends anybody. Seen failing first on `main`: somebody sick at home
   stayed sick; a serving man stayed sick; somebody sick of the cold at home stayed sick.
1. **The names.** `DISEASES`: measles (7 days), whooping cough (21, children under ten), the chills and fever (6), the flux (5),
   a chill on the chest (5). A sickness saved before today has no name and mends and worsens as a chill on the chest, shown as
   plain "Sick". The cold at home and the road's rain-cold-hunger roll give a chill on the chest. `health.disease`, `grave`,
   `graveDay`, `since`, `day`, `nursed`, `credited`, `barked`, `relapse`; `person.had`, `exposed`, `caughtAt`, `relapse`;
   `household.sickFood`; `flight.apart`; `world.diseaseDay` - each checked by `diseaseInvalid` only when present. **No save
   version moved.**
2. **Rest.** `MEND` 2 / 1 / 0.5 and `RISK` 0.5 / 1 / 2 for resting / riding / walking or working (`activityOf`); every halt of
   the family is rest for all but whoever is at the work; idle is rest; **somebody working about the place goes to bed when the
   sickness comes**. `sicknessDay`: a sick person may turn **very sick** (`worse` at the day's chance raised to the weight: frailty
   × the disease's age multiplier × hunger × cold × `RISK`), is told so with a "!", and **only a very sick person can die** - on
   a day after the one it was seen, not nursed that day or the day before, and never in the first period; after two days, or on
   a day nursed while resting, the worst is past. "Stop and rest a day" (`rest-road`): two ticks, a day at the road's pace, the
   family halted; a very sick person refuses every work and journey ("too sick to get up"); every work icon of somebody sick
   carries the server's warning. The resting sick are drawn lying down (`restingSick`, stand-in: `-injured-rest`).
3. **Within a family.** Measles and whooping cough expose everybody together with the sick one who can take them (9 in 10,
   8 in 10), each on a hashed day ten to twelve days on (`person.exposed`); "Measles is in the family …" said when it reaches
   somebody new. Who has had the measles is dealt by age from the class seed (`hadShare`: 2 in 100 under two to 85 over thirty),
   shown on the card, and written (`had`) only when taken. Whooping cough is taken only under ten and turns only babies very sick.
4. **The crowded places.** The Trinity (the Atascosito crossing and Liberty, March 25 to April 30) and Lynch's ferry (March 22 to
   April 22, **RECONSTRUCTED**): a family camped there, not apart, may catch measles (1 in 10 a day) or whooping cough (8 in 100)
   for those who can take them. The flux after two days camped at a refuge (2 in 100 a day at a weight of one). *(Since §9.5:
   measles 15 in 100, whooping cough 30 in 100, the flux half a one in 100.)* Houston's camp,
   April 1 to 20: measles and the flux; a sick man there does no camp work. The siege of Béxar: the flux, and nobody dies of any
   sickness in the first period. "Camp apart from the crowd" (`camp-apart`) keeps a family out of all of it at that place, costs
   its trading there and, at a crossing, half a day of its turn. **Word** of the Trinity's and Lynch's sickness goes along the
   road at fifteen miles a day (`WORD_MILES_A_DAY`) into the families' journals, `confirmed` at the place and `unconfirmed` off
   it, and so into the Rumor Mill.
5. **The ague.** In the first period, at a house on river-bottom land (`bottomland`, `bottomland-cane` under the grid's woods
   rules), until the first norther on or after November 1 there: 12 in 1,000 a day at a weight of one (a child under six twice).
   Four in ten have it again thirty to ninety days on (the winter); a relapse whose day fell in the unplayed weeks comes in the
   first twenty days of the winter.
6. **The doctor and the rice and tea.** The doctor sees the sick: the bark halves the days of the chills and fever left and stops
   its coming back; for anything else calomel and bleeding, two days further from mending, said plainly. The store sells "a
   little rice and tea, for sickness" (one real, three portions); a portion is given on a day nobody nursed the sick person and
   is a day nearer mending; it keeps nobody alive.
7. **Automatic families and the Host.** Families nobody plays and people on auto never send the sick to work at home or in the
   camp; a family nobody plays nurses the sick at home (`nurse-home`) and on the road (`tend-sick`, as before), and rests a day
   for the very sick unless a column is close behind. The Host's words name the sickness; the class panel counts the class's
   sick in words; **a child who died of a sickness is never named on the projector** (left out of the family's people, counted
   as "A child of this family died of sickness."), and the dead of a sickness are drawn nowhere and never spotlighted.
8. **The measurement** (below).
9. **The documents**: `HISTORY.md` (`HIST-TEX-669`–`675`, `FIC-GONZ-669`–`676`; `HIST-TEX-078` and `FIC-GONZ-052` amended),
   `docs/COLONIES.md` (the one in a hundred replaced), `docs/HOUSTON_CAMP.md` §5, `docs/ROAD_EAST.md`, `docs/CHILDREN.md` §6,
   `docs/FAMILY_PANEL.md` §19, `docs/HOST_PAGE.md` §2.6, `docs/ART_REQUESTS.md` (request 2026-09-27, three stand-ins), `GAME.md`,
   `TECH.md`, `HANDOFF.md`.

### 9.2 The measurement (`scripts/disease-study.mjs`, docs/evidence/disease-study.json)

Six classes of fifteen rolled families nobody plays on the colonies, the autumn and winter played once each, the spring twice
from the same winter on two seeds: **twelve flights, 1,956 people**. Each spring is a **mixed class**: half the families see to
their sick as the director does (nurse, rest a day for the very sick, never send the sick to work) and half never nurse or rest,
the halves swapped between the two springs so every family is measured both ways - the owner's option C, "still weighted to the
small and the uncared-for".

**As measured now** (2026-09-28, on the tree with the Scrape's routes and chases merged in, the rates retuned on the owner's
answers of §9.5, and `origin/main`'s balance answers merged - the evidence file is this run):

| | People | Fell sick (episodes) | Very sick | Died | In a hundred |
| --- | --- | --- | --- | --- | --- |
| **The whole flight** | 1,956 | 1,038 | 199 | **54** | **2.76** |
| Families that saw to their sick | 978 | | | 5 | 0.51 |
| Families that did not | 978 | | | 49 | 5.01 |
| Under two | 140 | 160 | 50 | 6 | 4.3 |
| Two to five | 348 | 342 | 86 | 31 | 8.9 |
| Six to fifteen | 788 | 371 | 37 | 12 | 1.5 |
| Sixteen and over | 680 | 165 | 26 | 5 | 0.7 |

Of the 54 deaths, **37 were children under six** (69 in 100). By disease: **the measles 251 cases, 87 very sick, 28 died; the
whooping cough 174, 61, 14**; a chill on the chest 419, 37, 6; the flux 194, 14, 6. The twelve flights ran from 0 to 8.1 in a
hundred. In the autumns: 207 cases of the chills and fever among about 1,000 people, 12 of the siege's flux, 8 chills on the
chest, **nobody dead of a sickness**; in the winters, 32 relapses. (Tuned before the balance merge, the same rates measured 2.97:
58 deaths, the measles 30, the whooping cough 14, a chill 8, the flux 6; careful 0.51, careless 5.42.)

**On the merged tree before the retuning** (the rates as first built, the Scrape's routes, halts and chases in): 2.97 in a hundred
again (58 of 1,956); careful 0.41, careless 5.52; under two 8.6, two to five 9.8, six to fifteen 0.9, grown 0.7; the flux 41
deaths, a chill on the chest 12, the measles 5, the whooping cough 0 - within a death or two of the first measurement below, so
the routes and chases, which families nobody plays do not choose and which are rare, moved nothing that could be seen.

**As first measured** (before the merge, the rates as first built):

| | People | Fell sick (episodes) | Very sick | Died | In a hundred |
| --- | --- | --- | --- | --- | --- |
| **The whole flight** | 1,956 | 1,378 | 180 | **58** | **2.97** |
| Families that saw to their sick | 978 | | | 4 | 0.41 |
| Families that did not | 978 | | | 54 | 5.52 |
| Under two | 140 | 198 | 35 | 11 | 7.9 |
| Two to five | 348 | 432 | 84 | 35 | 10.1 |
| Six to fifteen | 788 | 493 | 36 | 7 | 0.9 |
| Sixteen and over | 680 | 255 | 25 | 5 | 0.7 |

Of the 58 deaths, **46 were children under six** (79 in 100). By disease: the flux 708 cases, 104 very sick, 43 died; a chill
on the chest 417, 47, 10; the measles 187, 28, 5; the whooping cough 66, 1, 0. The twelve flights ran from 0.7 to 5.7 in a
hundred. In the autumns: 205 cases of the chills and fever among about 1,000 people (23 to 49 a class), 12 of the siege's flux,
**nobody dead of a sickness**; in the winters, 32 relapses.

**Injections** (`scripts/disease-injections.mjs`, docs/evidence/disease-injections.json): 47 of 47 caught by exactly the tests each
names; **48 of 48** after the merge and the retuning of §9.5 (one added: the whooping cough dangerous to babies only). Rest and
the chase are held by tests/scrape-pursuit.test.mjs and its own injections (docs/SCRAPE.md; HANDOFF.md). The one guard not injected - that nobody dies the day they are seen very sick - is held twice over by the shape of
`sicknessDay`, and taking it out changes nothing; the script says so.

`tests/disease.test.mjs` step 8 reads the evidence and fails if the rates it was measured against (`studiedRates`) are not the
module's, so the measurement cannot go stale silently. **Rest's effect**, measured: over a real `stepWorld` run an adult four days
from mending is well in **2.0 days resting and 8.0 working** (tests, step 2); on the road in the browser proof the days to mending
fell **2.0 a day through "Stop and rest a day" and 0.5 a day walking** after it (docs/evidence/disease-browser.json).

### 9.3 Where the build differs from the plan

- **Death only from very sick, and nursing** as planned: nobody nursed that day or the day before dies (`FIC-GONZ-673`). The
  owner's three in a hundred is therefore met by the families that do not nurse: a careful family lost 0.4 in a hundred, a
  careless one 5.5. The plan's per-case targets (§3.6) were not used; the whole-flight figure was.
- **Re-seating the sick on the road** (plan step 2, lifting `sim/company.mjs`'s `ceiling:`) was **not built**: another builder
  was rebuilding the flight that day, and the seat plan stays made once when the family sets out. `ceiling:` somebody who falls
  sick on the road keeps their seat or their feet; a halt, "Stop and rest a day", or nursing is the family's answer.
- **The men Labadie discharged home with the measles** were not built: `ceiling:` in docs/HOUSTON_CAMP.md §5.
- **Nursing in Houston's camp** was not built: a sick man there rests, and nobody nurses him.
- **"Weak" after the measles and whooping cough** is `tired` with 30 miles of weariness, which rest mends in hours, not the
  plan's three days.
- **Cholera, smallpox and yellow fever as words in the towns' talk** (§3.9) were not written: they are out of play, as decided,
  and `HIST-TEX-673`/`675` say why. Town lines are the way to add them.
- **The flux killed most** as first built (43 of 58): families sit at their refuges for weeks, and the flux is the camp's. The
  record's named killers of the Scrape are the measles and whooping cough; the owner chose that they lead (§9.5), and the rates
  were moved.

### 9.4 For the owner

- The whole-flight figure is **2.97 in a hundred** in a class where half the families neglect their sick; a class that nurses
  and rests loses about **0.4 in a hundred**. Whether the owner's "about three in a hundred" was meant for a careless class, a
  mixed one (as measured) or a careful one decides whether the rates should move. **Answered: a mixed class (§9.5).**
- Nursing is still a certainty for the day (the old `FIC-GONZ-052` promise). Making it a strong reduction rather than a
  certainty would raise the careful families' losses toward the whole-flight figure. *Still open.*

### 9.5 The owner's answers, 2026-09-27, by multiple choice (built the same night, not released)

1. **"3 in 100" describes a mixed class** - half the families seeing to their sick, half not - as measured. Kept.
2. **"Yes, measles and cough lead."** The measles and whooping cough are the Scrape's leading killers, as the record names them
   (`HIST-TEX-639`), with the whole flight still about three in a hundred in a mixed class. What moved (`sim/disease.mjs`, tuned
   against scripts/disease-study.mjs, not claimed):

   | | Was | Now |
   | --- | --- | --- |
   | The measles: turning very sick / dying, a day at a weight of one | 0.03 / 0.2 | **0.09 / 0.6** |
   | The whooping cough: the same | 0.02 / 0.2 | **0.07 / 0.8** |
   | The whooping cough: who it turns very sick | babies under one | **babies under one (six times), under two (three), under five (one and a half)** - RECONSTRUCTED: with no vaccine, small children too |
   | Taking them among the crowds, a day (`CROWD_CATCH`) | measles 0.1, whooping cough 0.08 | **0.15, 0.3** |
   | The flux in a fouled camp, a day (`FLUX_PER_DAY`) | 0.02 | **0.005** |
   | The flux: turning very sick / dying | 0.03 / 0.16 | **0.015 / 0.06** |
   | A chill on the chest: the same | 0.02 / 0.16 | **0.012 / 0.08** |

   Measured (§9.2): **2.76 in a hundred**; the measles 28 of the 54 deaths, the whooping cough 14, a chill on the chest 6, the
   flux 6; careful families 0.51, careless 5.01; 37 of the 54 under six. `tests/disease.test.mjs` step 8 now also fails unless the
   measles and the whooping cough each killed more than every other sickness in the evidence (seen failing against the first
   build's rates and evidence: "lung-fever killed 10, measles 5").

## 10. Amendment, 2026-09-28 — very sick means in bed (not released)

docs/audits/2026-09-28-interactions.md S6, docs/audits/2026-09-28-design.md S34 and S36; `FIC-GONZ-734`. "Too sick to get up" was
checked only when work or a journey began, so a man turned very sick at the mark went on shooting and a very sick woman was sent
to a crying baby. Now, last in the tick (sim/babies.mjs `settleTheUnable`): somebody very sick or lying wounded stops their work in
hand at home at once ("Gregorio is too sick to go on with practice at the mark, and has gone to bed."), sets down a baby they held
and lets go a child talking with them; nobody very sick or wounded is brought to a crying baby or talked to by an idle child. The
very sick person's "!" opens their card at **who can nurse them** - one button for each of the family who could, sending them to
`nurse-home` (or `tend-sick` on the road) - instead of their own work, all refused (docs/FAMILY_PANEL.md §19). Somebody on a road
goes on to where they were going; the road east carries its sick in the wagon.

## 11. Amendment, 2026-09-29 — a minute to nurse the very sick (owner-decided; not released)

**The ask.** Triage 2.1 (the design audit's S21): *a very sick child can die within 10–20 real seconds in period 2* - a day of the
calendar passes that fast there, and death can follow the day after the child is said to be very sick. The owner chose, by multiple
choice on the triage's C4, **"60 s minimum"**: *"cannot die within about 60 real seconds, and the time is shown on the '!'"*
(`FIC-GONZ-960`). Option B, holding the calendar, was not chosen.

**As built.**

- Somebody very sick in a **played family at its screen** cannot die of it until **sixty real seconds** have passed since they were
  said to be very sick (`sim/decision-budget.mjs` `QUESTION_BUDGETS.grave`, `graveOnLimit`, `graveHeld`). The seconds are the other
  questions' real ones (docs/audits/2026-09-29-triage.md C2): suspended while the Host has paused, kept in the save
  (`world.decisionClock`), the first tick after Resume counting nothing, and a tick stepped in process counting one at the Study pace.
- **The very sick days wait with the minute** (`sicknessDay`): on a day's roll inside it nobody dies, and the day very sick is counted
  again from that day, so when the minute is out the person has the two days very sick the rates give (§3.6), each with its chance,
  and then eases - the minute comes in front of the days, not out of them. Where a day of the calendar is longer than a real minute
  nothing changes; it matters where the days run fast.
- **Nursing still works at once**: nursed and resting, they are past the worst on the day's roll, minute or no minute.
- **Shown**: the row's sickness carries `leftMs` while the minute runs, and the "!" (`needsOf`, kind `sick`) and the story card
  count it down on the page's clock - *"About 40s left to nurse them."* Once it is out, no countdown is shown; the risk is the
  ordinary one.
- **Not held**: for a family nobody plays or whose student has gone (no reader to give a minute to), and in the first period, where
  nobody dies of a sickness at all (`deathsAllowed`). The calendar is never held for it.

Tested in `tests/owner-rules.test.mjs` (the same day's roll that kills a child nobody plays kills nobody inside the minute; the
days wait; after the minute the chance applies; the clock starts, is shown on the "!" and the card, runs out, and is held for
nobody at no screen), each seen failing by injection (`npm run test:owner-rules-injections`).

## 12. Amendment, 2026-09-30 — hunger can kill (owner-decided; not released)

> "player characters *can* die of starvation. players should have to ensure there's enough food." — the owner, 2026-09-30

Until today hunger only doubled the weight of a sickness (§3.5, `homeContext`, `sicknessWeight`), and nobody died of hunger at home.
That doubling stays; **hunger now also kills on its own**, in stages - hungry, weak, starving, dead after sixteen days of want for a
grown person and sooner for the young, the old and the sick - with the very sick's real minute (§11) before any death by it.
A death by hunger follows this document's death by sickness: one plain sentence, nothing drawn, and a child never named on the
projector (`diedAChild` now counts `health.starved`). The design, the timings and the measurement are [HUNGER.md](HUNGER.md);
the code is `sim/hunger.mjs`.
