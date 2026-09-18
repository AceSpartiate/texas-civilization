# Houston's camp: what a man in the army does between joining and San Jacinto

**Status: owner's instruction 2026-09-16, built 2026-09-17.** Amends [COLONIES.md](COLONIES.md) §6p (Houston's army) in what a
man serving with Houston can be given to do, and [MONEY_AND_GLORY.md](MONEY_AND_GLORY.md) §4 in two supporting parts.
`sim/camp.mjs` (registered into the chore table through `registerChores`), `sim/houston.mjs` (the camp's dates, Groce's,
drill counting at San Jacinto), `sim/directors.mjs` (the two questions' moments), `sim/neighbours.mjs`, `sim/auto.mjs`,
`sim/host.mjs`, `public/family-panel.js` and `public/app.js`. Researched in `HISTORY.md` `HIST-TEX-075` to `-083`; the
game's own rules are `FIC-GONZ-053` to `-056`.

## 1. What the owner asked for

> "Soldiers in Houston's Army should have things to do too. Drilling, etc."
>
> — the owner, 2026-09-16, part of: "Players that are running during the Runaway Scrape, they need things to do besides just
> running … Historically accurate consequences."

Before this a man who joined General Houston's army (`join-houston`, COLONIES §6p) stood at the camp with one order on his
row - *Send for them to come home* - until the battle came or the family sent for him. The refugees' road is another
piece of work built the same day (`sim/scrape.mjs`, `sim/road.mjs`); this one is the camp.

## 2. Design choices made in the owner's absence

Each is **chosen by default; the owner may change it.** The historical grounding is the `HISTORY.md` row named.

| Choice | Chosen by default | Grounding |
| --- | --- | --- |
| What the camp's work is | Four chores on a serving man's row, in the shape every chore has (steps, a cost in days, a refusal in words): **Drill with the company**, **Go out for beef and corn**, **Stand guard**, **Ride out with the scouts**. Nothing else is offered a serving man - the thirty refusals saying he was away are off the channel. | Drill for a fortnight at Groce's (`HIST-TEX-075`); beef and corn from Groce's and the country the families left (`HIST-TEX-077`); the camp guard and the scouts (`HIST-TEX-083`). |
| What drilling comes to | Three days' drill make a man **steady in the line** (`DRILL_TO_STEADY`), said on his card and in the record; a fourth day is refused in words. At San Jacinto a steady man's weight in the battle's roll is **three quarters of his frailty** (`DRILLED_STEADINESS` 0.75, through `rollFates`' `weightOf`). **No new die**: the battle's one seeded roll is what it was; drilling moves the line it is read against. When the word of the battle comes the record says he was "steady in the line from the drill at the camp". | Erath: the delay at Groce's "had a good effect in disciplining us" (`HIST-TEX-075`). The number is the game's own (`FIC-GONZ-053`). The owner's rule that no choice is labelled by what it risks (COLONIES §7a) holds: the drill control says drilling counts, never a rate. |
| Foraging | A day out for the mess brings in "a beef and a sack of corn from the farms the families left", or from Groce's herd and cribs once the army is there. Said in the family's record; it feeds the camp, not the family's own stores, since he is away. | Groce supplied corn and beef; the abandoned farms stood full (`HIST-TEX-077`). |
| Guard duty and the scouts | A night on the camp guard, said and safe. A day with the scouts wants **a horse at the camp** (the family's horse he rode in on, `modeWith`), and **two outings in a hundred** bring him back slightly hurt (three days), by a hashed share of the outing, as the road's sickness and the massacre are rolled; the control says a scout can be hurt. | The camp guard left with the sick and the baggage; Deaf Smith's scouts; one man wounded in the skirmish of April 20 (`HIST-TEX-083`, `-067`). The share is the game's own. |
| Glory for the camp's work | One award, **`served`** (weight 1, like carrying supplies), the first time a man does any of the camp's work; never a second. Supporting, so it cannot rival the fight's `fought` (3). | MONEY_AND_GLORY §4: fighting weighted above supporting. |
| Leaving with the word of Goliad | On March 25 the army asks every man with Houston, on his card with a "!": *Does he go home?* The card says what leaving costs - an ordinary man starts home at once and whatever the army does next happens without him; an auxiliary's promise of land goes; **a regular who leaves has deserted** - and nothing of what staying risks. Leaving is the recall the winter already had. The question closes at dawn on March 28, when the army marches for the Brazos, and anybody unanswered is decided as auto decides. | "Many of the men left the army to see to their families"; about 1,400 fell to about 500 (`HIST-TEX-076`). The close and the words are the game's own (`FIC-GONZ-054`). |
| The fork of the road | At noon on April 16 the army asks every man which road he calls for: the right-hand road to Harrisburg and the enemy, or the left for Nacogdoches. The army goes right whatever he says - it did. A man who called for the right has a part in the record (**`forward`**, weight 2, like `willing`); the left changes nothing. Closes at noon on the 17th. | The Whichway Tree and "To the right boys, to the right"; who chose is disputed (`HIST-TEX-082`); the mood against Houston (`HIST-TEX-081`). The share and the award are the game's own (`FIC-GONZ-056`). |
| Families that do not choose | A man of a family nobody plays, of a family whose student has gone (HOST_PAGE §2.4) or on auto (FAMILY_PANEL §11.7) is set to the camp's work by the neighbours' director or by auto - mostly drill, a day in six out for the mess, a day in six on guard, one in twenty with the scouts, by a hashed share of the day - and answers the two questions the tick they are asked at the same shares: **half leave** with the word of Goliad, **three in four** call for the right-hand road. So nobody's man sits idle, and nobody's odds change with the switch. | The record's rates where it has them (`HIST-TEX-076`); the rest the game's own (`FIC-GONZ-055`). |
| The class's calendar | Holds at the farming scale while a **played** family has one of the two questions in front of it, never for the camp itself, and never for a family whose student has gone (answered at once). | COLONIES §5.7's rule, as the flight order and the army's November questions already keep it. |
| Groce's | The camp is at San Felipe from March 28, and from the evening of March 30 at **Groce's**, a place of its own on the west bank about fifteen miles up the river by the road the army marched (2026-09-17, `HIST-TEX-086`); the men with the army march there. A class saved before Groce's was a place keeps the camp at San Felipe and says **"Groce's, above San Felipe de Austin"**. | Groce's on the Brazos from March 30 (`HIST-TEX-066`, `-075`). |
| Over the Brazos (owner 2026-09-18) | At dawn on April 12 (`houston-brazos`, 282600) the story says **"The army is crossing the Brazos on the steamboat Yellow Stone. She came up the river for cotton under Captain John E. Ross, and General Houston has taken her to carry the men, the horses and the wagons over the flood."** and the camp moves to **Bernardo**, over Groce's ferry on the east bank (`HIST-TEX-088`); the men with the army cross with it. The Host reads **"with Houston's army at Bernardo, Groce's plantation"**, and a day out for the mess still comes back from Groce's herd and cribs. The army waits there until noon on April 18 and then marches for Harrisburg by the road east (`ceiling:` below). A class saved before Bernardo was a place keeps the army at Groce's until the 18th and marches as it always did, and is still told of the crossing. Words only: the boat is not drawn (docs/ART_REQUESTS.md). The hour is the game's own. | The crossing April 12-13, the camp "a few hundred yards east of Groce's residence" until the 14th (`HIST-TEX-089`). |
| The fork's place (owner 2026-09-18) | The fork is said **at Roberts', beyond Spring Creek**, the left-hand road going to the Trinity and Nacogdoches; it had been said "below Harrisburg", which it was not - Roberts' is some forty-five road miles above it. | `HIST-TEX-082`, `HIST-TEX-088`. |
| The camp's dates and the class's clock | `houstonCamp` now reads the record's dates against the class's clock (`campClock`: eighteen hours ahead of the timeline's midnight for a class that arrives at dawn on September 28), the way the director's milestones are read. It used to run eighteen hours ahead of the army, and for those hours a man at the old camp "had not reached the camp". Found by `tests/camp.test.mjs`. | `HIST-TEX-066`. |

## 3. As built

- **`sim/camp.mjs`**: `CAMP_CHORES`, `CAMP_SHARES`, `SCOUT_HURT`; `withHouston`; `campRefusal` (not with Houston, the battle
  fought, on the road, not at the camp, drilled enough, no horse for the scouts); the chores registered with `offered`,
  `refusal` and `run` (three hooks `sim/chores.mjs` now gives a chore kept in its own module: `choresFor` drops a chore whose
  `offered` says no, `choreAvailability` asks its `refusal`, and a step `{ run }` calls it); `campChoice` (the day's work for a
  family that does not choose); `advanceCamp` (a man whose army has marched leaves the camp's work off, said); `CAMP_QUESTIONS`
  (`leave`, `road`), `openCampQuestion`, `campQuestionRefusal`, `answerCampQuestion` (action **`houston-answer`** with
  `question` and `answer`), `closeCampQuestion`, `campQuestionOpen`; `campInvalid`. Stored on the service: `drilled`,
  `scouted`, `leave`, `road` - absent until earned or asked, so **no save version moved**.
- **`sim/houston.mjs`**: `campClock`, `houstonCamp` read against it, passing over a camp in `LATER_CAMPS` (`groces`,
  `bernardo`) the class's map lacks; the `bernardo` camp from April 12 and `HOUSTON_WORD.brazos` (2026-09-18); `GROCES_FROM`,
  `atGroces` (Bernardo counts), `campName` ("Bernardo, Groce's plantation"); `DRILL_TO_STEADY`,
  `DRILLED_STEADINESS`, `drilledSteady`; `fightSanJacinto` passes `weightOf: steadiness`; `tellSanJacinto` says a drilled man
  was steady. `sim/army.mjs` `rollFates` takes `weightOf` (frailty by default).
- **`sim/chores.mjs`**: the three hooks; somebody serving sees only `camp` chores; `registerChores` takes a registration made
  while the table is still loading (the import cycle winter → houston → scrape → host → directors → camp) and applies it
  when the table is made.
- **`sim/directors.mjs`**: TIMELINE `goliad-leave-close` (March 28, 6 a.m.), `houston-brazos` (April 12, 6 a.m., 2026-09-18),
  `which-road` (April 16, noon), `which-road-close` (April 17, noon); `advanceScrape` opens `leave` with `goliad-word` and
  `road` at the fork, and closes each; at `houston-brazos` it says the crossing and moves the men with the army to Bernardo.
- **`sim/winter.mjs`** `SERVING_ACTIONS` adds `chore`, `stop-chore`, `houston-answer`; `sim/world.mjs` runs `advanceCamp` before
  the chores, validates `campInvalid`, dispatches `houston-answer`, and projects `drilled`, `bound`, `leave: 'open'`,
  `road: 'open'` on the service (never a fate). `sim/clock.mjs` `deciding` holds for an open camp question of a played,
  present family. `sim/glory.mjs` `served` 1, `forward` 2; `sim/ending.mjs` names them.
- **`sim/neighbours.mjs`** sets a serving man to `campChoice` before the winter's choices and no longer tries to send him home;
  **`sim/auto.mjs`** does the same for a man on auto. **`sim/host.mjs`** `whereWords`: "with Houston's army at Groce's, above
  San Felipe de Austin: drilling with the company"; `waitingOn` counts the two questions.
- **Client**: `public/family-panel.js` - `PANEL_SUMMARIES` and `PANEL_ICONS` for the four (drawn glyphs, `stand-in:`),
  `CAMP_CHORES`, `panelActions` puts the camp's work before *Send for them* on a serving row (and *Call off the work* while
  he is at it), `isIdle` counts a serving man idle only with the camp's work open, `needsOf` kind **`camp`**
  (`NEED_KINDS`); `public/app.js` - `NEED_SECTIONS.camp` is the card, which says "with General Houston's army at …, drilled
  N days", and puts each open question with its two answers and the price of leaving (`houston-answer`).

## 4. Proof

- `tests/camp.test.mjs` (8): the camp's work on a serving row and nobody else's, three days to steady, a fourth refused, one
  award, a bad save refused; drilling counting at San Jacinto over a crowd of 3,000 and for the one father of `camp-class-7`
  whose roll falls between the two lines, said with the word; foraging, the guard and the scouts, the horse, the share;
  the word of Goliad - a "!" for a played family, at once for auto, unplayed and absent, leaving and deserting, the close, the
  calendar; the fork; the director, auto and absence, and the march breaking off the work; the Host's words and count; the
  panel. Every rule was proved by injecting its regression and watching only its test fail (the record is in the HANDOFF
  entry). Since 2026-09-18 (13): the crossing's milestone and the Bernardo camp at one moment, dawn on April 12; the
  crossing said once and the man with the army taken over to Bernardo, the camp's work open there, the mess from Groce's; the
  army waiting at Bernardo until noon on the 18th and marching east by the road to Harrisburg, clear of San Felipe, before
  Lynchburg; a map without Bernardo keeping the army at Groce's and still saying the crossing; the Host's "Bernardo, Groce's
  plantation"; the fork said at Roberts'.
- `tests/houston.test.mjs`, `tests/winter.test.mjs`, `tests/chores.test.mjs`, `tests/family-commands.test.mjs` amended: a test
  that wants its men at the battle keeps them in explicitly (`leave: 'no'`), a serving regular is offered nothing, the camp's
  chores are not on a farmer's list, `camp` is a need.
- `npm run test:camp` (`scripts/camp-browser-proof.mjs`, [evidence](evidence/camp-browser.json), same computer, 9 checks): a
  real class with the neighbours' director played in process to the army's camp on the Colorado; the father sent to join
  Houston from the panel and joining at Beeson's crossing; his row's five icons; drilling from the row, the glow, the card
  counting his day; the "!" with the word of Goliad opening the card at the question and its price, answered, the "!" gone;
  the Host's live page reading *with Houston's army at Beeson's crossing: drilling with the company*; nothing sideways at
  400 px; no page errors. Screenshots `camp-drilling.png`, `camp-goliad-question.png`, `camp-host-words.png`, `camp-phone.png`.
- `npm run test:whole-game` rerun.

## 5. Ceilings

- `ceiling:` no sickness in the camp. The record has the sick left opposite Harrisburg and the maladies of the spring rains
  (`HIST-TEX-078`); the road's sickness (`sim/scrape.mjs`) stays the road's. A daily roll at the road's rate for a man in
  camp, and being left with the camp guard when the army marches for the field, is the way out.
- ~~Groce's is words, not a place.~~ Done 2026-09-17: Groce's is the army's camp west of the Brazos (`HIST-TEX-086`).
  ~~The army leaves it for Harrisburg through San Felipe.~~ Done 2026-09-18: it crosses to Bernardo on April 12 and marches
  east from there (`HIST-TEX-088`, `-089`). `ceiling:` the army waits at Bernardo until noon on April 18 and then marches
  straight to Harrisburg. It really left on the evening of the 14th and went by Donoho's, McCarley's, the fork at Roberts'
  and Burnett's, which are points on the road, not places a camp can stand at; making them places, each with its night, is
  the way out - and would put the fork's question where the fork was.
- `ceiling:` a class saved before Bernardo was a place is told the army is crossing the Brazos while its map keeps the army
  at Groce's and marches it by San Felipe; its map has no ferry to cross by.
- `ceiling:` the crossing is words; the steamboat is not drawn (docs/ART_REQUESTS.md, the Yellow Stone).
- `ceiling:` the camp has no stores. A beef brought in is said, not counted; a camp mess that runs short when nobody forages
  would want a store the camp keeps and a hunger the men feel.
- `ceiling:` the fork's question changes nothing about where the army goes, which is the record; it is the man's part.
- `ceiling:` the scouts' risk is a hashed share of the outing, as the road's and the massacre's are - not the hunt's rule of
  no die at all. A scout's outing with a visible decision in it (how far out, whether to close with a patrol) is the way out.
