# The family panel: managing a family's people

**Status: decided by the owner 2026-09-15; built 2026-09-16** ([evidence](evidence/family-panel-browser.json)). It amends
[SETTLING_IN.md](SETTLING_IN.md) in how a family's people are managed: the person panel's list of work and its travel, work
and rest buttons, and the family book's row of Rename buttons, are replaced by one panel on the left of the map. Read this
before changing how a student gives a person an order, the portrait or icon art, or renaming.

**Amended by the owner 2026-09-16 and built the same day** ([evidence](evidence/family-commands-browser.json)): an "!" on a
row for anybody who needs the student, that takes the camera to them and opens what waits; idle shown; and one person the
student chooses as their main one. See §11, which wins where it and the sections before it differ.

---

## 1. What the owner asked for

> "i'm not a fan of how we currently manage our characters. i'd prefer an interface on the left side of the screen father at
> the top, then mother, then kids descending by age. there'd be a small picture of the character's face, and a list extending
> to the right of icons. each icon will have a picture of an action. if the player hovers over the action, there's a small
> popup that appears giving a one sentence summary of the action. when the player clicks an action it becomes the action the
> character is now doing and the icon glows until the character is done with the action. by clicking on the portrait, the
> camera moves to and zooms in on the character. when renaming family members, the player should be able to change all of
> the names and it shoukd auto save. there should be no need of a bunch of rename buttons."
>
> — 2026-09-15

Nothing in the request changes a rule of the world, and nothing here does: no new action, no new simulation rule, no new
field on the save, no save version moved. The panel sends the orders the page already sent and draws what the server's
projection already says.

---

## 2. The order of the rows

**Father, then mother, then the children oldest first.** Read from the family's own book (`/api/family`, each person's
`role` and `age`), never guessed from a name or a figure.

| Family | Rows |
| --- | --- |
| Two parents and children | father, mother, children by age, oldest at the top |
| A lone mother (a roll of 1–5 can make one) | mother, then the children; there is no empty father row |
| A lone father | father, then the children |
| No children | the parent or parents alone |
| Two children of one age | cannot be rolled (`docs/FAMILY_CREATION.md` §3); if it ever happens, the household's own order decides |
| A person with no stated age (the founding four of a class nobody rolled, a class saved before rolling) | parents first, then the rest in the household's own order, which is father, mother, daughter, son |
| A person with no role at all | after everybody who has one, in the household's order |
| Before `/api/family` has arrived | no panel yet: the book is what says whether the family has been rolled and who is who |

The principal is marked (a rust edge on the portrait, the colour the map already reserves for them), not moved: a lone
mother who is principal is already first.

---

## 3. A row

- **The portrait**, a small picture of the person's face (§6 for the art). A button: pressing it chooses the person and
  **the camera goes to them and zooms in**, using the camera's existing "watch this person" (`watchedId` in `public/app.js`,
  the same follow a name in the journal's roster already starts): it centres on where they are drawn, zooms to at least
  55 in 100 of the closest zoom, and walks with them until the student pans, zooms or presses Follow. The person's card opens
  beside them, as clicking them on the map does. A person who is being asked something, or whom a rider has stopped, has an
  "!" over the corner of the portrait that is a button of its own (§11); the question itself is still answered on their card.
- **The name**, an input labelled with the person's role and age (§5).
- **The icons**, one per action the server offers that person now, in a row extending to the right; on a wide screen a long
  row (a principal has twenty or so) wraps to a second line so nothing is out of sight, and on a phone it scrolls sideways.

---

## 4. The icons

Every icon is a button whose accessible name is the action and its one-sentence summary. Hovering or focusing it shows a
small popup with the summary; when the server refuses the action for this person now, the popup also gives the server's
reason, and when the server quotes a price or a haul for it (*2 seed*; *brings home 4 food of 9*), the popup says that too.
A refused icon stays visible and dimmed, as a refused chore always has (`CLAUDE.md`: valid refusal). Which icons a row has
comes from the projection: `world.work[personId]` for work, `world.travelModes` for how they go, and whether the person is
the principal for the orders only a principal may be given (`applyAction` in `sim/world.mjs`).

### Work: offered to anybody old enough, when `world.work` lists it

| Action (`chore` id) | Summary shown |
| --- | --- |
| Survey ten acres (`survey-plot`) | Walk out to a place you choose on your land and stake out ten acres. |
| Cut the lane to the road (`cut-lane`) | Cut the brush and timber out of the lane between the house and the road. |
| Dig a well (`dig-well`) | Dig down by the house until there is water, so nobody has to carry it from the creek. |
| Plant the field (`plant-field`) | Turn the rows of every cleared plot and put in seed. |
| Bring in the crop (`harvest-field`) | Cut the ripe crop on every planted plot and carry it in. |
| Clear a staked plot (`clear-plot`) | Grub, cut and break a staked plot you choose on the map so it can be planted. |
| Fence a cleared plot (`fence-plot`) | Split rails and fence a cleared plot you choose on the map against the loose stock. |
| Work on the house (`build-house`) | Put work into the house the family has chosen until it stands. |
| Help raise the walls (`help-raise`) | Help the neighbours here raise the walls of the house going up on their land. |
| Hunt in the timber (`hunt-timber`) | Go out to the nearest timber or brush to hunt, and carry home what they can. |
| Hunt on our land (`hunt-land`) | Hunt at a place you choose on the family's own land, and carry home what they can. |
| Practise at the mark (`practise-shooting`) | Spend an afternoon and two powder shooting at a mark to steady their aim. |
| Mend the hoe (`mend-hoe`) | Set the worn hoe right again at home. |
| Fell trees (`fell-trees`) | Fell the trees at a place in timber you choose on the family's land. |
| Haul logs to the house (`haul-logs`) | Bring the felled logs lying out to the house. |
| Fetch logs from the timber (`fetch-logs`, 2026-09-19, [BIOME_GAMEPLAY](BIOME_GAMEPLAY.md) §3.2) | Take the ox and wagon to the nearest timber, off your land if need be, and bring six logs home. |

The five town errands - fetch seed, buy powder, sell food, take the cotton, buy a hoe - left this table on 2026-09-17:
each of them walked a person to a counter the **Go to a shop** order already reaches, so they are the store's own trades
now (`docs/TOWNS.md` §4). A family nobody plays is still sent on them by its director.
The five that need a place (`survey-plot`, `clear-plot`, `fence-plot`, `hunt-land`, `fell-trees`) start choosing the place on
the map when pressed, exactly as their buttons did; the order is sent with the place. A chore the family's land has no use
for today is not offered at all, and two refusals that are not choices (a sound hoe cannot be mended, a corn family has no
cotton) are hidden, as before.

### Orders only the principal may be given

| Action | Sent as | Summary shown |
| --- | --- | --- |
| Travel to Gonzales | `travel`, `destination: gonzales` | Go into the town of Gonzales and stay there until sent somewhere else. |
| Return home | `travel`, `destination` the family's home | Come back to the family's own land. |
| Go to a neighbour's homestead | opens the card's neighbour list, then `travel` | Choose a neighbour's homestead and go there, to trade or to help raise their walls. |
| Work about the place | `work` | Do the everyday work about the homestead, which brings in a little food each day. |
| Rest | `rest` | Sit still at home, which is the only thing that mends tiredness. |

### While somebody is at work

| Action | Sent as | Summary shown |
| --- | --- | --- |
| Call off the work | `stop-chore` | Stop what they are doing and come away; what is already done stays done. |

**What stays on the person's card, and why.** The card that opens beside a person keeps what is a *question* rather than an
order, or needs more than one press: a call to answer (`#selection-call`), a rider to listen to, work that has stopped to ask
something and its answers, how the person travels (*Going by*: on foot, the ox, the wagon, the horse — remembered per person
and sent with the next icon that starts a journey; a way somebody else in the family is using is shut and says who has it,
*"Maria has the horse."*, and the server refuses it however the order is sent — 2026-09-16, `sim/keeping.mjs`), which neighbour's homestead to go to, and trading with somebody standing
there. The army's "send for" control and every call are unchanged; they were never icons of their own.

### What a person has become

Under the name, in a line of its own: **a steady shot**, **the best shot on this land**, **steady in the line**. The first
two are the hunting hand (2 and 3), the third is a man who has drilled his three days at the camp. Added 2026-09-17 after
the owner played: an afternoon at the mark costs two powder and an afternoon, the story said so, and then nothing about the
person showed it. None of it is a hidden stat revealed - a steady hand is already written on the hunt's own controls and the
drill is already said at San Jacinto - it is the same fact where a student looks first. Nothing is shown for a person who
has neither, so the line is earned rather than worn by everybody. `standing` in `public/family-panel.js`; the row keeps its
own line so a phone wraps it instead of pushing the star off the row.
### The glow

An icon glows while **the server's projection says that person is doing that action**, and stops the tick it says they are
not. Nothing is remembered in the page about what was pressed.

| Icon | Glows while |
| --- | --- |
| A work icon | `entity.chore.id` is that chore — including while they walk out to it and back, and while it has stopped to ask something |
| Travel to Gonzales / Return home | they have no chore and `entity.travel.to` is Gonzales / their home (so the drive in to the land at the start of a class glows *Return home*, which is what it is) |
| Go to a neighbour's homestead | they have no chore and `entity.travel.to` is another homestead |
| Work about the place / Rest | they have no chore, are not on the road, and `entity.task` is `work` / `rest` |
| Call off the work | never: it is an order, not a thing anybody is doing |

A glowing icon's popup says *Doing this now.* rather than the busy refusal. A chore that finishes sets the person back to resting on the server, so the chore's icon stops glowing and the principal's
*Rest* glows. An icon that is glowing is shown even if the server has stopped offering that chore, so nobody is doing an
action the panel cannot show. Everything else on the row is refused while a chore is going ("Rosa is already hoeing"),
and says so.

---

## 5. Names: every name editable, saved without a button

- Every person's name is a text input on their row, labelled with their role and age ("daughter, 12"). The family's own name
  and every person's name are also inputs in the family book in the journal; both places save the same way.
- **There are no Rename buttons.** A name is saved when the student leaves the box (blur), presses Enter, or stops typing
  for 1.5 seconds. Only a changed, non-blank name is sent. It goes through the same `rename` command as before, and the server
  still cleans it and has the last word.
- **A refusal is shown**: the server's sentence appears in the page's error line and on the input (`aria-invalid`), and the
  box goes back to the name the world holds once the student leaves it.
- A box being typed in is never overwritten by a tick.
- `ceiling:` every save writes a line into the family's story ("Rosa is called Winnie now"). Saving after a pause rather than
  on every key keeps a slow typist to a line or two; a name typed with long pauses between letters writes more. Undo only if a
  class's story fills with half-names.

---

## 6. Art

Neither exists, and neither blocks the panel (`CLAUDE.md`, missing art). Both are requested in
[ART_REQUESTS.md](ART_REQUESTS.md) and listed there under *Stand-ins in use*.

- **Portraits — stand-in:** the head and shoulders of the person's own figure, cropped from the atlas the map already draws
  them with: the same cast figure `castVariant` chooses (the principal in `rust`, women and girls in `teal`, men in `elder`,
  boys of ten and over in `blue`) and the delivered `girl`, `boy`, `smallchild` and `infant` for children, standing facing
  south. Before the sheets load, or if they fail, a drawn head-and-shoulders silhouette in the same colours.
- **Icons — stand-in:** the nearest thing the library already draws (a survey stake for survey, a rail for fencing, a young
  and a ripe corn plant for planting and harvest, a bucket for the well, a stump for felling and the lane, a fallen log for
  hauling, walls going up for the house, sacks, barrels and crates for the store, tools for mending, a trading house for
  Gonzales, a cabin for home and a wide cabin for a neighbour, a bedroll for rest, a man with a hoe for work), fitted into the
  icon; and a simple drawn glyph where nothing is near: a deer's head for hunting the land, a target for practice, a hoe for
  buying one, a cross for calling off.

---

## 7. Where it sits, and small screens

- **Wide screens:** a column down the left of the map under the status lines, every row showing portrait, name and icons, at
  most 36rem wide. It scrolls inside itself when a large family does not fit, and never covers the map's buttons; the card
  beside a person is kept clear of it when there is room. A child under ten, or somebody still on the road in, whose every
  icon is refused for one reason, shows that reason once instead of a row of dimmed pictures.
  `ceiling:` the panel covers the left of the map on a wide screen, and a family of ten fills its height; a collapse control
  (portraits only, as on a phone) is the way out if the covered ground turns out to matter in play.
- **A phone (under 760 px wide):** the panel collapses to a column of portraits. The chosen person's row opens beside it with
  their name and a strip of icons that scrolls sideways. It takes no more than the left portrait column and one row, so the
  map stays visible.
- **Keyboard:** portraits and icons are buttons in reading order; the summary popup shows on focus as on hover; the name
  inputs are labelled. Escape closes a popup.
- **The Host** has no family and sees no panel.

## 8. What it replaces, and what stays

| Was | Now |
| --- | --- |
| The work list on the person's card (`#selection-work` buttons) | Work icons on the person's row |
| *Travel to Gonzales*, *Return home*, *Work* and *Rest* on the card | Icons on the principal's row |
| *Call off the work* on the card for a chore that is not asking anything | An icon on the row (it stays on the card beside a chore's question) |
| A Rename button beside each name and the family name in the book | Every name box saves itself |
| Nothing: there was no way to jump to a person except finding them in the journal | The portrait |

**Stays:** the card beside a person (§4), the journal's roster of the family (a second, text way in; the browser proofs use
it), clicking a person on the map, the Host view, refusal lines, calls, rider meetings, trading and the tutorial.

## 9. Build order

1. ~~**The panel, the icons, the glow, the portrait camera and names that save themselves**, with the stand-ins.~~
   **Done 2026-09-16.**
2. **Portrait and icon art** when Astra delivers it: register it, replace the stand-ins, delete their rows.

## 10. Gates

| Gate | What it means |
| --- | --- |
| The order is the family's | Father, mother, children oldest first, for every shape of rolled family, from the family's book. |
| Every action has an icon and a sentence | Every chore in `CHORES` and every principal order has an icon and exactly one sentence; a chore added without one fails a test. |
| The glow is the server's | An icon glows exactly while the projection says the person is doing it, and stops when it says they are done. |
| Nothing new is decided in the page | The panel sends the same commands the card sent; refusals are the server's sentences. |
| No rename buttons | Names save on blur, Enter or a pause, survive a reload, and a refused name says why. |
| The map stays visible | At about 400 px wide the panel is a portrait column and one row. |
| Stand-ins listed | Both art requests written; both stand-ins marked `stand-in:` and listed. |

---

## 11. Commands, the "!" and the main person — as built 2026-09-16

> "Ideally, I should be able to use the Family icons and action bars on the left to quickly give characters commands as to
> what to do. If they need my attention (for example a rider is trying to talk to them) then there should be an exclamation
> point there for me to click on. This exclamation point if clicked on would take my camera to that character and begin the
> interaction that they need me for. I should also be able to select one character to be focused on. That way I can quickly
> give all my characters commands, see that they're all busy, while also using the main one to do more specific tasks like
> decorating in the house, fight in a battle, etc."
>
> — the owner, 2026-09-16

Everything the "!" reads was already sent to the family. **Amended the same day by the owner's two answers (§11.5):** the main
person is the world's — a household field, `set-main`, and the one person the server lets travel, rest and work about the
place — and a call's "!" opens one menu with a tick for everybody who may answer, which the settlement's call can take more
than one of. No save version moved: a class saved without a main person opens with the principal as one. The rules are in
`public/family-panel.js` (`needsOf`, `isIdle`, `focusFor`, `callMenu`, `callPlan`), `sim/family.mjs` (`mainPersonId`),
`sim/world.mjs` (`set-main`, the gate) and `sim/calls.mjs` (`volunteersOf`), tested against the simulation in
`tests/family-commands.test.mjs` and `tests/calls.test.mjs`; the browser proof is `npm run test:family-commands`.

### 11.1 Quick commands

The icons of §4 were already one press each on every row, without finding anybody on the map; that stays. What was missing was
seeing, down the column, who has nothing to do:

- **Idle** is shown on a row as an *Idle* tag beside the name and the word *idle* on a dimmed portrait (so a phone's column of
  faces shows it too). A person is idle when they are alive, not at a chore, not on a road, not with the army, the server's
  `task` for them is resting (not `work` about the place, not `help` where a call sent them), **and** at least one icon on their
  row is open. A child under ten, or somebody every order is refused to, is not called idle: there is nothing to give them.
- Resting counts as idle, including a principal told to *Rest*, whose *Rest* icon still glows. `ceiling:` the server cannot
  tell a rest the student chose from the rest a chore ends in; a separate "resting on purpose" is the way out if students find
  their resting principal nagged.
- **Who may be ordered what.** Every person old enough is offered the chores; travelling, working about the place and resting
  are the **main person's** (§11.3; `applyAction`, "Only your main person can be asked that. Choose them with the star on their
  row."). They were the principal's until the owner answered §11.5. The journeys, the yard and rest are on the main person's
  row and nobody else's, from the same field the server refuses by.

### 11.2 The "!"

A round "!" over the top corner of the portrait, its own button (a button cannot hold a button), bobbing gently unless the
student has asked for reduced motion. Its accessible name says who wants what ("Ned Falk has stopped to speak with Jasper. And
1 more. Go to Jasper and answer."). It is shown while the projection says something waits on that person, and gone the tick it
does not. What raises it, most pressing first — a person with several shows the first:

| Need | Read from the family's own projection | Pressing the "!" opens |
| --- | --- | --- |
| A rider standing with them (a slate "!": a rider will not wait for ever) | `world.encounter`, open, `listenerId` is this person | the conversation, with its questions and *Let them ride on* |
| A question from the army they are with | `world.army.ours[]` for this person: `detachment` open, or a question whose `answer` is open | their card at the army's question and its two answers |
| A call, march or rumour's question they may answer | `world.request`, open, with this person in its `answerers` | **the call's one menu** (below): a row per person who may answer, with a tick |
| Work that has stopped to ask | `entity.chore.ask` | their card at the question and its answers |
| An offer another family made to them | `world.offers[]`, `direction: 'received'`, `ourEntityId` this person | their card at the offer, *Accept* / *No thank you* |

- A call the whole family may answer marks **every** person who may answer it, as the map's own mark over their heads already
  did; answering clears all of them. The map's mark and the "!" read one rule (`requestFor`, `meetingFor`).
- **The call's one menu** (owner, 2026-09-16: *"The ! should appear on anyone that can answer. When it's clicked on however,
  a single interactable menu should appear that lets the player make the choice for each applicable person. Say a series of
  checkmarks so the player can send who they want quickly and easily."*). Pressing any of those "!"s goes to that person and
  opens `#call-menu`: the call's words, then a row for every person in `request.answerers` who is alive — a tick, their name,
  who they are (*Father, 41*), and the server's own note for sending them or its reason they cannot be — then **Send them** and
  **Nobody goes: …** (the keeping answer, in the call's own words). `callMenu(request, { people, entities })` builds it;
  `callPlan(menu, ticked, clickedId)` turns the ticks into the same per-person commands the card's buttons send
  (`turn-out`, `help`, `go-see`, `go-upriver`; `stay-put`, `stay`, `stay-home`, `stay-in-town`), top to bottom, one at a
  time, each carrying how that person travels. Confirm takes the camera to the first person sent; a refusal is said in the
  server's words under the menu and on the error line, everybody already sent stays sent, and the menu stays open for the rest
  until it is closed. Sent without refusal, the menu goes, and the "!" goes from everybody the tick the server says the call is
  answered. On a phone the menu is docked under the top bar and scrolls inside itself.
- **Which calls take several.** A settlement's call (`sim/calls.mjs`) does: once somebody has turned out it is accepted and
  stands for the rest of the family to follow while the class runs (`call.actorIds`, each with the powder and the ride, each
  said to arrive; `actorId` stays the first, which is what a class saved before this reads). Staying is the family's whole
  answer and closes it; once somebody has gone, staying is no longer a question — those not sent simply stay — and somebody
  who has gone is refused a second time in words. The food call, the rumour and the march are put to one person, so their menu
  is a single choice (radio buttons, "One of the family answers this"). `ceiling:` the food call and the rumour could take a
  second person the way the settlement's call does; their settling (`settleHelp`) is written for one, and the card still
  offers the accepted settlement call to nobody, so a second volunteer is sent from the menu at the moment the family answers.
- Pressing the "!" chooses the person, takes the camera to them (the portrait's watch), opens what waits on them and puts the
  keyboard on the first open answer — the first tick for a call, or the conversation panel for a rider, whose questions are
  redrawn every tick.
- The words say who and what, never what an answer risks (`docs/COLONIES.md` §7a).
- **Server-filtered knowledge:** the rule reads only what the server sent this family, so another family's offers, riders and
  questions cannot raise an "!" (tested: another family's projection marks nobody of this one). The Host has no panel.
- What the family rather than a person must decide (the wagon load, the house plan, the house site) is not a person's need and
  has no "!"; those open their own panels.

### 11.3 The main person

- Every row has a star button. Pressing a hollow star makes that person the student's **main person** and goes to them;
  pressing the main person's filled star takes the camera back to them. A double press on a portrait also makes them the main
  person.
- The main person's portrait and row have a gold edge and a star in the corner. Until one is chosen it is the principal.
- **The world's, not the browser's** (owner, 2026-09-16: *"If any character (that's old enough) is selected as the main person
  (only one at a time) then they can be sent on travelling. I should be able to select the dad of the family as the main, send
  him off to war, then switch the main person to the mom so that I can have her take something into town … Let's say that the
  Dad dies at the Alamo, and I have an older son that's old enough, so I select him as the main person and send him to join Sam
  Houston once a rider arrives and it's appropriate."*). The star and the double press send **`set-main`**, which the server
  keeps as `household.mainId` — one at a time; anybody of the family who can act and is old enough to be sent (`tooYoung`),
  refused otherwise in the words every order gets (*"… is too young to be sent."*, *"This person cannot act."*). Nothing is
  kept in the browser any more: the panel reads `world.household.mainId`, sent when the main person is not the principal
  (absent means the principal, so a class that has chosen nobody sends nothing new on the tick).
- **What being main means:** travelling, working about the place and resting are theirs alone (`applyAction`: *"Only your main
  person can be asked that."*); their row alone has those icons; with nobody else chosen the card that opens is theirs, with
  their detailed controls — *Going by*, a neighbour's homestead, trading, the army's question in a battle; and only their row
  has **House**, which opens the rooms of the family's house (`docs/SETTLING_IN.md` step 7). Somebody in the army or on a
  road can be main — that is how their army questions are the student's detailed work — and the chores stay everybody's.
- **Switching recalls nobody.** Choosing the mother while the father marches leaves him marching; choosing him back while she
  is on the road to town leaves her walking. Only who may be given the next order moves (tested).
- **When the main person is gone:** the server resolves it on every read (`mainPersonId`): a chosen person dead or captured
  gives way to the principal if they can act, otherwise to the oldest living member old enough to be sent (with no ages, the
  household's own order), and to nobody only when nobody is left — so a family with anybody in it is never without one, and
  the panel's star moves the same tick. Rolling the family clears a choice made among the founding four.

### 11.4 On a slow computer

The panel is redrawn on each snapshot, not each animation frame, and rows, icons, "!", star and House are kept and changed in
place: an attribute is written only when its value changes. Measured in the browser proof over sixteen quiet ticks: no nodes
added and no attributes changed across ten rows (before the last fix, every row rewrote its name box's `data-current` every
tick).

### 11.5 Answered by the owner (2026-09-16)

- *Should the other grown people also be able to go to town, go home, rest and work about the place from their rows?* — The
  main person can, whoever is chosen, one at a time: §11.3. Built the same day, as a rule of the world (`set-main`, the gate
  in `applyAction`), not of the panel.
- *Should a call any grown person may answer show its "!" on all of them, or only on the main person?* — On all of them, and
  any of them opens one menu with a tick per person: §11.2. Built the same day.

### 11.6 Gates

| Gate | What it means |
| --- | --- |
| The "!" is the server's | Raised only by a need the family's projection carries, on exactly the person it concerns, gone the tick it is answered, never for another family. |
| One press to the interaction | The "!" takes the camera to the person and opens the rider, the question, the call's menu or the offer with the keyboard on it. |
| One menu for a call | Any "!" for a call opens the one menu: a tick per person the server lets answer, their name and age, the server's price or reason; confirm sends one command per tick in order, refusals in the server's words leave it open for the rest; the settlement's call takes several. |
| Idle is visible | A person with something open to them and nothing to do is marked on the row and the portrait; a child too young is not. |
| The main person is the server's | Chosen by the star or a double press (`set-main`), held on the household, refused for the too young and the gone, the only one who travels, rests and works about the place, the card's default, the row with House; falls back to the principal, then the oldest old enough; switching recalls nobody. |
| Cheap | No DOM rewritten on a tick where nothing changed. |
| Stand-ins listed | The "!", star, idle and auto marks are type; requested in `docs/ART_REQUESTS.md` (2026-09-16) and listed. |
| Auto is the server's | The word "auto" on a row sends `set-auto`; the row shows pressed only from the projection's `auto`; on, the person's questions are answered the tick they are asked and their last hunt repeated, with no "!" ever raised on them; off, the game's own windows stand and then auto decides that one question (§11.7). |

### 11.7 Auto — as built 2026-09-16

The owner (2026-09-16): *"for all combat, and hunting, the player should be able to let it automatically happen (autohunt, or
autofight) but the player should have the ability to micromanage their character during hunting or battle. if they fail to
make the character's choices in a timely manner then eventually the auto should take over."* Put to the owner by multiple
choice the same day and answered: **one switch per person**, and a person on auto **repeats the last order given them**;
**auto-fight answers only what the army asks of somebody already in the ranks** (who enlists, turns out, joins Houston or
comes home stays the player's order); **auto-hunt decides only the shot** (the player still sends the hunter); a player by hand
keeps **the game's own windows** and then auto decides that one question; and in the Runaway Scrape, where the family moves as
one behind the parent, **the main person's switch** decides, a family by hand being waited for a day.

- **The switch.** The word *auto* on every row's tools, beside the star, hidden on a row that can be given nothing (a child too
  young). Pressing it sends **`set-auto`** (`sim/auto.mjs`), held on the person as `entity.auto` — absent when off, so no
  saved class changes and no save version moves — and shown back as `auto` on the projection, which is the only thing the
  pressed state is drawn from. Its accessible name says what a press does (`autoLabel` in `public/family-panel.js`). The
  switch is written into the family's record either way.
- **What auto decides, and where.** Each question is decided where it lives, at the share families nobody plays use
  (`FIC-GONZ-040`, `FIC-GONZ-048`), so the switch changes *when* a question is answered and never the odds:
  - *the shot* (`autoChoice`, `sim/chores.mjs`): taken when the hand is steady or the rifle has been put in order, waited for
    when it is not; every other question work stops to ask falls to the family's own fallback; nothing impossible is chosen.
  - *the army's questions* (storm, pledge, the pack train, winter quarters, Milam, the reinforcement) and *the detachment*
    (`sim/army.mjs`): answered the tick they are asked, and what the answer does is done (not pledging starts home).
  - *Travis's couriers* (`sim/alamo.mjs`, `COURIER_OFFERED`, about a third offer): answered the moment Travis asks.
  - *the wagon* (`autoFlee`, `sim/scrape.mjs`): if the main person is on auto the family packs as a neighbour packs — food,
    then seed, cotton, powder, for the nearest refuge east — and goes the tick after the order.
- **The repeat.** Hunting only (`REPEATED`): the order last given from the panel is remembered on the person (`entity.order`,
  with the ground for a hunt on the family's land) and, on auto, taken up again the tick they are home and free — with a shot
  in the house, as a neighbour hunts; without one, or refused for any other reason, the reason is written down once and tried
  again each tick. Off, the hunt in hand finishes and nobody goes again. `ceiling:` only the hunts repeat; felling, hauling,
  the field and the errands each change what the family has in a way a student should see before the next.
- **By hand, and the windows.** Nothing changes until the window closes: a hunt's question stands `ASK_PATIENCE` (two hours,
  about a minute at the Study pace), an army question until its dated close with the calendar held, a courier ask until the
  riders go, the wagon `FLIGHT_PATIENCE` (a day). Then **auto decides that one question**, said so in the record (*"Nobody
  answered for … in time, and it was decided for them."*) — where silence used to count as a no, a stay, or the first fallback.
  So a class saved before this rule may still carry `'silent'` answers; none are made now.
- **Refusing to go is an answer.** Since silence now packs the wagon after a day, a family that means to stay says so: *Stay,
  and take the risk* on the flight card (`flight-stay`, `sim/scrape.mjs` `stayHome`), which releases the calendar, keeps the
  farm to be burned when the army passes and the family at risk when the enemy comes, and leaves the road east open.
- **Proof.** `tests/auto.test.mjs` (six tests, each proven by injection: fourteen regressions, each failing only its test) and
  `npm run test:auto` (`scripts/auto-browser-proof.mjs`, same computer): the word pressed, the server holding it, a hunt from
  the panel decided alone with no "!" and repeated, off and nobody going again, nothing scrolling sideways at 400 px.
