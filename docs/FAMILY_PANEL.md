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
| Take small game (`take-small-game`, 2026-09-20, [BIOMES](BIOMES.md) §17.3) | An hour after squirrels and rabbits in the timber: one shot, and nobody comes home empty. |
| Fish the creek (`fish-the-water`, 2026-09-20) | Sit down at the water with a line and bring home what is on it, with no powder and no knack needed. |
| Gather oysters (`gather-oysters`, 2026-09-20) | Walk down to the beds along the shore and gather what can be carried home. **Only on the coast.** |
| Cut a bee tree (`cut-bee-tree`, 2026-09-20) | Take the axe to the tree the bees are working, and bring the honey home. |
| Put a line in the river (`fish-road`, 2026-09-20, [ROAD_EAST](ROAD_EAST.md)) | Sit at the water while the family waits at the crossing, and take food out of the river. **On the road east only.** |
| Kill a beef (`butcher-beef`, 2026-09-20, [STOCK](STOCK.md)) | Kill a beef: the family keeps what it can and the neighbours get the rest, because it will not keep. |
| Kill a hog (`butcher-hog`, 2026-09-20) | Kill a hog and salt it down, which is meat that keeps. |
| Ride the range after the stock (`look-to-stock`, 2026-09-20) | Ride the range and through the timber after the stock, and mark the calves. |
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
  icon is refused for one reason, shows that reason once instead of a row of dimmed pictures — in the bar at the bottom of
  the screen if they are the main person, and on their own row if they are not (**§14**, owner 2026-09-21).
  beside a person is kept clear of it when there is room. Somebody whose every icon is refused for one reason — somebody
  still on the road in, or an **infant under two** — shows that reason once instead of a row of dimmed pictures
  (`rowReason`). **Since 2026-09-21 a child of two to nine has a row of icons of their own** and is not collapsed: the
  children's six works (`sim/children.mjs`, [FAMILY_CREATION.md](FAMILY_CREATION.md) §3's amendment), and nothing else —
  a child's row never carries an adult's work, refused or otherwise.
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

---

## 12. The screen given back, and the guided start — owner 2026-09-21, built the same day

> "the ui covered too much of their screen. the abilities for each character needs to be hidden unless they're selected as
> the main. their abilities should be bottom middle of the screen and spaced out in such a way as to maximize the
> visibility of the screen."
>
> "we need to have the tutorial be an integrated forced part of the game ... one task at a time, guided by the ui and
> unavoidable."
>
> — after a real class played on Chromebooks, 2026-09-21

This amends §4, §7 and §11.1 in **where a person's work is drawn** and in **what the walk-through is**. Nothing about which
orders a person may be given has moved: that is still the server's (`world.household.mainId`, `applyAction`, §11.3).
`FIC-GONZ-220`, `FIC-GONZ-221`, `FIC-GONZ-222`.

### 12.1 What was measured, before and after

Measured in the browser at **1366×768** — the Chromebook the school buys — by rasterising every part of the page that
paints over the map and counting the covered pixels once (`npm run measure:screen`, `docs/evidence/screen-measure-*.json`).

| | Covered | The left column reaches |
| --- | --- | --- |
| Before, in the lobby | **33.4%** | **584 px**, and three of six family rows were hidden behind the walk-through card |
| After, in the lobby | **28.1%** | **264 px** (the family rows); 380 px counting the walk-through card, which is unchanged |
| After, with a lesson running and a person chosen | **27.7%** | 264 px, and **all six rows in sight** where three had been covered |
| After, with a lesson running and nobody chosen | **23.9%** | 264 px |
| After, folded (**Hide names**) | — | **102 px** |

Two of those rows are new since the first pass, and both are measured because both are real: whether the card beside a
person is open is the student's doing, not the interface's, so the last row is what a student who has just joined and
pressed nothing actually sees. The figures moved from 28.3 / 31.9 after the three faults in §12.8 were fixed — the bar's
second row went, and the card's journey block folded.

### 12.2 The ability bar

- **Only the main person's icons are drawn.** Every row still holds its own group in the page — so a row's icons are still
  that person's, to the page and to a screen reader — and the stylesheet draws only `.panel-row[data-focused=true]
  .panel-icons`. Choosing another main person (the star, a double press on a portrait) moves the bar to theirs.
- **Bottom middle**, centred on the screen, 48 px icons 10 px apart, wrapping upward when a principal's twenty will not fit
  in one line. **Nothing is drawn behind them**: a panel across the bottom would cover exactly the ground this was meant to
  give back, so each icon carries its own small shadow over the country instead.
- It rides **above** the map's own buttons rather than beside them: at 1366 px there is not room for both across the bottom,
  and the buttons are the older furniture.
- Everything §4 and §11 say still holds — the hover and focus popup, the server's refusal in its own words, the glow that is
  the projection's, the keyboard order, the sideways scroll on a phone.

### 12.3 Hide names

The `ceiling:` §7 wrote on 2026-09-16 is paid. **Hide names** folds every row to its portrait — which is what a glance down
the column is for, the idle mark and the "!" — and leaves the bar alone, because a fold that took the work away would leave
a student with nothing to press. Remembered per browser and nowhere else.

The star, the auto switch and House fold away with the rest of the row, so while the panel is folded the main person is
changed by the **double press on a portrait** §11.3 already gives (`chooseFocus`), and the "!" is still its own button over
the corner of the face. `ceiling:` a student who only ever folds the panel never meets the star; unfolding is one press and
the fold is remembered per browser, so nothing is lost for good.

### 12.4 The guided start

The lesson is the **server's**, and arrives whole on every snapshot:

```js
world.lesson = {
  step: 'arrive' | 'order' | 'house' | 'survey' | 'clear' | 'plant' | 'harvest' | 'sell' | 'hunt' | 'well' | 'done',
  index: 3, of: 10,
  title: 'Put somebody to work',
  says: 'One sentence telling the student what to do next.',
  did: 'What just happened, or null',
  allow: ['chore:build-house'],   // every action id the student may take now
  done: false,                    // when the lesson is over, `world.lesson` is absent entirely
}
```

- **The page decides nothing about it.** `public/lesson.js` has no memory, no timer and no Next — so the one thing a page
  must never do, tell a student they have finished something the world has not seen, it cannot do. There is no control on
  the strip at all; a test counts them and fails at one.
- **The strip** stands over the top middle of the map: the step's number, its title, its one sentence, a `✓` line for what
  just happened, and a run of pips filled to the step behind the one the world says we are on. The lines the page shouts —
  an error, a save fault — move below it while it stands.
- **What is shut.** Every icon on the bar that `allow` does not name is dimmed, carries `aria-disabled`, and its popup says
  *"Not this yet. …"* with the step's own sentence rather than a refusal. The one that is named gets a ring and a caret; the
  button itself never moves, because a control a student has to hit with a Chromebook touchpad must hold still.
- **An empty `allow` shuts everything** — that is the step where the only thing to do is watch the wagon come in. **A
  missing `allow` shuts nothing**: a server older than the contract, or one that has not decided, must not lock a student
  out on the page's guess, and the server refuses in words either way.
- Three spellings of an id are accepted (`chore:plant-field`, `order:rest`, a bare `travel-gonzales`), because the contract
  only worked one of them. Accepting more than the server sends cannot open anything the server refuses.
- **The card's own journey is shut by the same rule.** *Go there*, on the person's card, is the `visit` icon reached another
  way, so it reads `allow` too (`shutByLesson` in `public/app.js`): a student led to one step must not find a second way
  round it. What is a *question* rather than an order — a rider, a call, an army's question, work that has stopped to ask —
  is never shut: the lesson decides what a student may start, not what they may answer.
- **The older, skippable walk-through is not offered while a lesson stands.** Two lessons at once is worse than either.
- The Host has no family and is given no lesson; one sent anyway is not drawn.

### 12.5 Gates

| Gate | What it means |
| --- | --- |
| The map is the game | At 1366×768 the interface covers under a third of the screen and the left column reaches under 300 px; folded, under 110 px. |
| One person's work at a time | No icon belonging to anybody but the main person has a box on the screen; the star moves the bar. |
| Bottom middle, spaced out | The bar is centred within a pixel or two of the screen's middle, near its bottom, its icons at least 44 px and at least 6 px apart. |
| Folding keeps the work | With the names folded the faces and the bar are both still there. |
| The lesson is the world's | The strip is the server's words, carries no control, and goes the tick `world.lesson` does. |
| One thing to press | Under a step, exactly the icons `allow` names can be pressed; the rest are plainly shut and say the step's sentence; the one asked for is ringed. |
| Nothing new is decided in the page | `public/lesson.js` has no memory and no timer, and a shut icon sends nothing. |

### 12.6 What is not proved

`world.lesson` is **stubbed** in the proof (`scripts/support/lesson-stub.mjs`) because `projectWorld` does not carry it yet;
that side was being built in parallel on 2026-09-21. What is proved is that the page reads the contract and adds nothing to
it. Nothing here was seen on a real Chromebook, a touch screen or a classroom network: the proof is headless Chrome at the
same pixel size on the same computer.

### 12.7 Stand-ins

`stand-in:` the caret over the ringed icon, the ring itself and the lesson's pips are drawn in CSS, not art. The request is
in [ART_REQUESTS.md](ART_REQUESTS.md) (2026-09-21 — the guided start's marks) and listed there under *Stand-ins in use*.

### 12.8 Three things the first screenshots showed — 2026-09-21, the same day

The two halves of the guided start met on main and the first Chromebook screenshots of them together were read back. Three
faults, all of them the page's:

- **Two bars.** The row was capped at 58rem and wrapped: sixteen icons along the bottom and three floating above and left
  of them, one of them ringed. To a student that is two bars, which is the opposite of what §12.2 says. The row now never
  wraps, may use the whole width bar a gutter, and the icons give up a little size before anything else does
  (`flex: 0 1 48px` with a floor). Nineteen icons sit on one line at 48 px with 8 px between them, and the bar went from
  **9.4% of the screen to 4.8%**. The proof now asserts one line and **one group of icons on the screen at all**, which is
  the check that would have caught it: "nineteen icons" passed straight through two bars.
  `ceiling:` past about thirty-three icons on one person the floor is reached and the row would run off the screen edge at
  1366 px. The longest row this game deals is a principal's twenty-one.
- **The card pushed up under the step.** The guided start's strip was counted among the controls the card has to stay
  *above* — and it stands across the **top**, so the card was shoved to the top of the screen and straight under the one
  thing that has to stay readable. The strip is now **overhead** rather than underfoot in `placementBoxes`, and only the
  part of it the card would actually stand in front of counts, so a card out at the right edge is not pushed down for a
  strip that ends in the middle.
- **The card's journey block ate the right quarter.** *Going by* — three stamps and a paragraph — and the list of
  neighbours are the card's two tallest blocks. While a step is running the card opens **folded**: the person, their
  state and their questions, with *Going by, and the neighbours* one press away. **Nothing is shut.** `sim/lesson.mjs`
  puts `travel` on `ALWAYS` on purpose, so a student may wander mid-lesson; a page that put it out of reach would be
  stopping what the world permits. The card is **3.8% of the screen folded against 10.3% open**.

### 12.9 The id an icon carries is the id the server matches on

`actionIdOf` wrote `order:<key>` for everything that was not a chore. **The server sends no such id.** `actionId` in
`sim/lesson.mjs` writes a chore as `chore:<id>` and everything else as the action's own name, and the three journeys —
Travel to Gonzales, Return home, Go to a neighbour's homestead — are **one** action, `travel`. So the page dimmed every
journey, *Work about the place* and *Rest* on every step, although `ALWAYS` allows all of them throughout. The page now
spells an icon exactly as the server does, and a test walks every shape `panelIcon` builds and holds `actionIdOf` and the
server's own `actionId` to the same answer.

The bare key is still read as well, because `sim/lesson.mjs` writes some of its own steps that way. **See the handoff:**
six of those bare names are chores, and the gate cannot match them — the lesson refuses the very work the step asks for.
That is the server's to fix; the page needs no change when it lands.

### 12.10 Names that piled on each other

A family standing together round the wagon drew four names in the same few pixels. Each name is now placed where it asks
to be; one that would land on a name already placed **steps down a line**, up to three times, and is left undrawn if it
still has nowhere to sit. Nothing is lost by dropping one: the person is still there to press, still marked, and still
named on the family panel. `layOutCaptions` in `public/app.js`; what was drawn and what was dropped is on
`window.__labelsDrawn`, the same contract as `__viewEntities`.

### 12.11 What was drawn over what — owner 2026-09-21

Every piece of this interface is positioned on its own: a strip at the top, the column down the left, the bar across the
bottom middle, panels that open at `left:12px; top:64px`, a card that follows a person round the map. Nothing had ever
asked whether two of them land on the same pixels. `scripts/screen-overlap-study.mjs` asks the browser rather than the
stylesheet — for every control a student can press it samples the control's own points and asks `elementFromPoint` what
is on top — at 1366×768, 1024×768 and 390×844. Three things were wrong, and all three were invisible at the size the
class played on until the study was pointed at the other two.

- **The guided start stood on the family.** Centred, the strip covered the left-hand column at anything under about
  1180px wide: at 1024 it covered the father's star outright, and at a phone's width Chrome *refused a click* on
  "Choose a house" because the strip was over it. It is **top right** now, its left edge held clear of a column that is
  at most 19rem or 44% of a narrow screen, so the two cannot share a pixel at any width. A phone has no room beside the
  column, so there the column starts below the strip instead, by the strip's own measured height (`--lesson-room`).
- **A panel over the family never admitted it.** "Choose a house" covers the whole column — twenty-eight controls at
  1366×768 — while the step's own words say to assign a family member to build it. It still covers them, by the owner's
  decision, but honestly: the map behind goes **dim**, the panel says *"Your family is behind this. Close it when you
  want to give somebody an order."*, and the dim closes it. The strip stays above the dim, because it is the
  instruction. The two panels that ask for a place on the **map** are deliberately excluded: dimming the map there would
  cover the very thing the student has been told to tap.
  `#wagon-load` was given the dim too for a few hours and taken out again: it stands in the same corner and covers the
  same column, but it is a **lobby** step where no order can be given to anybody, so the dim had nothing to explain and
  cost the Journal. `npm run test:looks` caught it by pressing that button.
- **The names under the icons landed on the map's buttons.** While a lesson runs, each icon carries its name below it;
  the rightmost names sat on *Journal* and *Land*, and on a phone — where the bar scrolls sideways — they were clipped
  away entirely, because a box that scrolls shows nothing drawn outside it. The bar rides 30px higher while a lesson
  names its icons, and on a phone the box drops and pads back by 30px so the icons do not move and the names are inside
  what scrolls.

Evidence: `docs/evidence/screen-overlap.json`, `-1024.json`, `-390.json` (0 controls covered at both desktop sizes),
`docs/evidence/screen-overlap-injections.json` (4 of 4 caught, each by the check written for it).

**Still true and not fixed:** on a **phone only**, the docked person card covers a portrait's star. The classroom is
1366×768 Chromebooks, so it is recorded rather than chased. The study also does not yet reach `#site-choose`,
`#survey-choose`, `#encounter` or `#call-menu` in a real state — an earlier turn of it simply unhid them, and an empty
panel has almost no height, so it covered nothing and the run read as clean. That is worse than not asking, and it was
taken out rather than left to reassure.

## 13. The family-creation wizard as a thing on a screen — 2026-09-21

§12.11 asked what was drawn over what on the screen a student plays the *game* on. It stopped at the curtain. This is the
same question asked of the five steps in front of it — the title, the die, the family's last name, everybody's first
names, each parent's looks — and of the wagon that follows them, which is the first thing a finger in that classroom ever
meets. The order of the five steps is the owner's and is unchanged; nothing here is about what the wizard says or asks.

`scripts/creation-overlap-study.mjs` (`npm run study:creation`) reports what it finds; `scripts/creation-browser-proof.mjs`
(`npm run test:creation`) refuses to pass when it finds a fault. Both read from one instrument,
`scripts/support/creation-geometry.mjs`, so the numbers in the evidence and the numbers the gate holds to are the same
numbers. The family is rolled from a seed whose first household rolls a **twenty** — two parents and eight children, the
largest family the die makes — because the naming card is the one part of the wizard whose height is the family's.

### 13.1 What was measured, and what was wrong

At 1366×768, 1024×768 and 390×844, every step. **Nothing was covered and nothing was off the screen at any size** — the
one thing that was already right. Five things were not:

| What | Measured | Now |
| --- | --- | --- |
| The world behind the curtain was never sealed | Tab walked off **every** step onto `#world-map` and, from the last name onwards, **89** controls of a world the student cannot even see. `#surname`, `#names` and `#looks` each told a screen reader `aria-modal="true"`, and it was not true. | Everything of `.map-stage` that is not one of the wizard's own cards is `inert` while the curtain is up. **0** reachable at every step and every size. |
| Focus never arrived on a step's card | The die **disables its own button while it tumbles**, and a browser blurs a control it has just disabled: focus landed on nothing, with no way back but Tab from the top of the document. A screen reader was never given the step's heading. | The card takes focus when its step arrives, and is given it back whenever focus falls to nothing. Measured on the card at every step but the join form. |
| Targets under a finger | The last name's box **37px**, the naming card's boxes **36px**, Continue **43px**, the wagon's `+` and `−` **32px**, its stock rows **20px**. 22 targets under 44px at 1366×768. | **0** under 44px at all three sizes. |
| Two targets a finger cannot tell apart | The looks options **6px** apart; the wagon's two stock rows **4px**. | 8px everywhere. |
| The button that ends a step, below its own fold | **Done packing** sat **771px** down the wagon's list — a student had to scroll the whole load to find it. Continue was **137px** past the fold at a phone's height with a family of ten, and raising every box to 44px would have pushed it past on a Chromebook too. | `#names`, `#looks` and `#wagon-load` are a scrolling list with a **footer**: the button and the line that announces a refusal are outside what scrolls. Every step's button is on its card as the card opens, at every size. |

A **sticky** button was tried before the footer and is worth recording as a wrong answer: it sat on top of the last
child's name box, which is the fault it was meant to cure.

### 13.2 The instrument, and the ways it lied first

- **A hidden control has a box of zero size.** It overlaps nothing, is never off the screen and is never too small, so a
  card whose controls are all invisible reads as perfectly clean. Two guards: every stage asserts its own card is really
  drawn and big enough to be one (`real`), and every step names the smallest number of controls a student must be able to
  press. The seventh injection makes the looks options invisible, and it is the control count that catches it.
- **A `position:fixed` box is not clipped by an ancestor that scrolls**, so a naive ancestor walk reports clipping that
  does not happen. `clipBoxOf` stops its walk at the first `position:fixed` box for exactly that reason.
- A third, found by running it: **a control scrolled out of a box that scrolls is reachable, not covered.** The first run
  called 24 controls of the wagon covered or off the screen, and every one of them was the list simply scrolling. Points
  past the edge of the card, or of the list on it, are not sampled at all now. Every number here was checked against
  screenshots looked at by eye before any of it was believed (`test-results/creation-*.png`).

### 13.3 Gates

`npm run test:creation` is **4 checks** over **24 step-and-size measurements** (eight steps × three sizes), each holding
ten rules. Evidence `docs/evidence/creation-browser.json`; the study's own record is
`docs/evidence/creation-overlap.json`, `-1024.json` and `-390.json`. `docs/evidence/creation-overlap-injections.json` is
**7 of 7 caught, each by the check written for it** — and three of them first read as caught-by-another-check for a
reason worth keeping: the harness's failure-sentence pattern was greedy, so an assertion whose own sentence contained a
colon was recorded by whatever followed its *last* colon. `scripts/screen-overlap-injections.mjs` had the same latent
read and is fixed with it. `npm test` is **869**.

### 13.4 What is not proved

- **Same computer only.** No LAN and no district claim, and no classroom has met any of this.
- **No real assistive technology was run.** What is proved is that each card carries a heading that names it, carries a
  line with `role="alert"`, takes focus when its step arrives, and that Tab cannot leave it. NVDA, JAWS and ChromeVox
  have not been near it.
- **The join form is not focused on arrival**, at any size. It is the only step where focus starts on the page itself.
  The whole page at that moment *is* the form and its first box is the first thing Tab reaches, so it is recorded rather
  than chased.
- **The wagon is not focused when it opens by itself.** Pressing "Repack the wagon" focuses it; the wagon that comes up
  on its own after the curtain does not, so a student on a keyboard tabs past the map to reach it. It is a panel of the
  world rather than a card of the wizard, and it is left to whoever next opens `docs/SETTLING_IN.md`.
- **No claim ID was needed.** Nothing here invents or changes anything historical or fictional; it is only where things
  are drawn. `FIC-GONZ-250`–`259` and `HIST-TEX-350`–`359` were set aside for this work and none was spent.
- `ceiling:` the study walks the wizard once per size with one family. A family of one parent and no children — the other
  end of the die — is never measured, and neither is a name long enough to wrap a row.

### 13.5 Three gates that were already broken, and are not mine

Found while running the proofs around this work, and **checked against the tree before it** — each fails identically at
`4f96879`:

- `npm run test:family-panel`: *"the middle of a phone screen is not the map: DIV"*.
- `npm run test:family-commands`: *"only 2 people could be given work; this seed was chosen for a large family"*.
- `npm run test:furniture`: times out clicking `.panel-focus[data-focus="hh-1-elena"]`.

**All three repaired, 2026-09-21 — and in all three the proof was wrong, not the game.** §13.6 below has each one.

Two more had the same cause and **were** repaired here, because they are the family's own gates: `npm run test:looks`
and `npm run test:family` both clicked **Journal** through the dim that §12.11 put behind a covering panel, and Chrome
refuses a click through it — which is the dim working. Both put the wagon away first now; **8 checks** and **13**.
Eleven other proofs click `#journal-toggle` (`army`, `art`, `browser`, `farm`, `furniture`, `hunt`, `relay` ×3,
`trade-animation`, `travel`) and were not run here; any of them that reaches that line with the wagon open has the same
fault waiting.

### 13.6 Those three gates repaired, and a fourth — 2026-09-21

Each of the four was asked the same question first: **is the proof wrong, or is the game?** In all four the game was
right and the proof was measuring a rule the owner had already replaced, or a screen that had already moved under it.
Nothing in `sim/` or `public/` was changed for any of them. `npm test` **879**, unmoved, because nothing they touch is
in the suite.

- **`test:furniture` — the title curtain.** The proof joined and pressed straight at the family panel. Since
  2026-09-17 the title screen comes first, and `#creation-scene` — the canvas behind **Begin** — takes every click while
  it stands. The panel is drawn under it and reads to Chrome as *visible*, so the failure was a sixty-second timeout on
  a button nobody could have pressed. Every other proof walks `meetFamily`; this one never did. It does now, puts the
  wagon away as `test:looks` learned to, and **says out loud that no lesson stands on a family settled before the
  lesson existed** — so a gate can never be mistaken for a missing icon here. **5 checks.**

- **`test:family-commands` — §11 measured through the guided beginning.** "Only 2 people could be given work" was not a
  small family. The class is one whose cabins stand, and the family was still *arriving*, so `sim/lesson.mjs` started it
  at **arrive**; the first order finished **order**; **house** was already done because the cabin stands, so the family
  landed on **survey**, whose one allowed work wants a place chosen on the map — which this section deliberately never
  does. Every later press was refused in the lesson's own words: *"Not yet - first, stake out ten acres."* The game did
  exactly what [LESSON.md](LESSON.md) says. §11 is about the run of a farm a student already has, which is the state
  every student reaches, so the class is `taught` now (`tests/support/settled.mjs`, written for this) and the section
  **asserts that no lesson stands** before it counts. **23 checks; 7 of 10 people set to work.**
  *A real student is not caught by this:* in a real class the house does **not** stand on arrival, so the step after
  **order** is **house**, whose own sentence is "Set more than one of them to it and it goes faster". The whole family
  can be put to work there. Only a class with cabins raised before the wagons came in — which is a test world and not a
  game — skips over it.

- **`test:family-panel` — one point that stopped being over the map.** §7 says the panel on a phone "takes no more than
  the left portrait column and one row, so the map stays visible", and that was read at a **single point**, 60% across
  and 55% down. §12.11 gave a phone the guided start's strip across the top and started the column below it by the
  strip's own height (`--lesson-room`): the column moved down 220px and the one open row — which §7 allows — landed
  under the probe. The panel was taking **7.5%** of the screen the whole time. Where the column sits was never the rule.
  It is read on a **grid of 288 points** now: every point a *row* holds outside the column of faces must be inside the
  one open row, and below the strip the map must be the top thing at more than two fifths of what is left (it is at
  **57%**). The work bar and **Hide names** are counted rather than judged — they are §12's and the overlap study's.
  **14 checks.**
  Proven by injection, which is the only reason a bigger instrument is worth anything:
  `scripts/family-panel-phone-injections.mjs`, [evidence](evidence/family-panel-phone-injections.json) — **3 of 3
  caught, each by the check written for it**: every row opening at once (caught by `openRows`), a folded row drawing its
  face out over the map (by `strays`, with `openRows` still 1), and the work bar keeping desktop-sized icons and
  wrapping up the map — the fault §12 fixed on 2026-09-21 — (by the map's share, 18% against a floor of 40%).

- **`test:road` — two faults, neither the road's.** Reported failing "at a bog", and it was **two** things.
  (1) The proof waited **sixty seconds** for the wagon to stick. Stepped in process it sticks 35 ticks out — 52 seconds
  at a tick every second and a half — and *served to a browser it took 154*, because the bog is rolled once a day
  against the weather where the family actually is, so a student who spends a few ticks filling in the flee form is a
  different number of days along when each rain day comes. Which day it sticks on moves with how long somebody takes to
  press Confirm, **by whole days**. The wait is the ten minutes the pursuit below it already allowed, it watches the
  server's own world, and the flight is in the message instead of a bare `waitForFunction` timeout that said nothing.
  (2) Past the bog it pressed **Hunt from the camp** on a row that is not the main person's — §12 again, and this proof
  was not one of the ten given `asMain` on 2026-09-21. It chooses the hunter first now and puts the star back after,
  because the road's "!" is raised on the main person and the warning at San Felipe is pressed on them. **7 checks.**
  **The simulation was never at fault**: `stepWorld` bogs this family on a rain day exactly as
  [ROAD_EAST.md](ROAD_EAST.md) describes, every time it is asked.

### 13.5 What the merge of the two wizard passes cost, 2026-09-21

Both wizard passes were right on their own branch and wrong together, which is the whole reason they were merged by hand:

- **The looks card's last row of choices ended 2.7px above Done.** A 66×88 picture button with the end-of-step button
  directly under it is a mis-tap on a touchscreen. The card now keeps 14px under its list and the list 6px of its own.
- **The ability bar ran straight across "Done packing".** The bar is fixed to the bottom middle at `z-index:9`; the wagon
  panel was at 8, so the bar won, and its icons — which belong to a person nobody can give work to until the class starts —
  sat over the button that ends the step. The wagon step is above the bar now.
- **And the geometry instrument had a third trap in it.** A control clipped at the fold of a list that scrolls keeps its
  whole layout box, so a gap measured from it is a gap to a part of a button nobody can see or press. That is what the
  2.7px above was first read as, and no amount of margin moved the number, because the margin was never what the number
  was about. Gaps are cut to the clipping ancestor before they are measured. The two traps the instrument's author had
  already found and written down are (a) a hidden card has a box of zero size and reads as clean, and (b) a `position:
  fixed` box is not clipped by an ancestor that scrolls.

---

## 14. A person who can do nothing says why — owner 2026-09-21, built the same day

The owner, after playing:

> "When I switch characters, the action bar at the bottom should switch to that person's bar. It shouldn't (unless there's
> a good reason) stop another character from doing their action… This philosophy should be followed logically and
> dynamically throughout the experience of the game."

Asked what an empty bar should show, they chose, by multiple choice, **one line saying why, in the person's own terms** —
their example, *"Docia is under two; she is carried."* They rejected a row of greyed icons and they rejected leaving it
blank.

This is the `ceiling:` written into `public/style.css` on 2026-09-21 paid on the first day a class asked for it:

> the one-line reason a whole row is refused (`rowReason`, §7) lives inside the icon group, so a child under ten now
> shows a face and a name and no reason… The way out is a line of its own in `.panel-body`, if a class asks why a child
> has nothing.

### 14.1 Where the line goes

| Whose row | Where the line is | Why there |
| --- | --- | --- |
| The **main person** | in the bar at the bottom middle of the screen, in place of the icons (`.panel-reason`) | their icon group *is* the bar (§12.2); that is where a student is looking when they switch to somebody and nothing appears |
| **Everybody else** | on their own row, under their name (`.panel-why`) | their icon group is not drawn at all, so the row is the only place they have |

It is never in both at once: the main person's row stays quiet while the bar carries it.

### 14.2 The page writes none of the sentences

Every line is the server's own refusal, word for word — `tooYoungWhy` (`sim/family.mjs`), `servingWhy`
(`sim/winter.mjs`), and the per-chore `why` from `choreAvailability` (`sim/chores.mjs`). The page's only judgement is
**which** of them is the reason about *this person* rather than about a field or a hoe, and that is the one the server
put on **every** piece of work it offered them. `rowReason(icons, { offered, entity })` in `public/family-panel.js`:

1. Anything on the bar still open → **no line**. The icons are shown as they always were.
2. Otherwise, the reason shared by **every** work icon, if they share one.
3. With no work icons at all (somebody serving, whose row is one *Send for them*), the reason shared by every icon.
4. With no icons at all — the row `panelActions` empties, which is only somebody **dead or captured** — the reason the
   server sent with the work it refused them, read from `world.work[id]`.

The one refusal the server deliberately sends only once — the land hunt's, which rides on the timber hunt
(`sim/chores.mjs` `choresFor`) — is put back by `whyOf` before any of this, in the same place the icons read it, so the
row's line and the icon a student hovers can never disagree.

### 14.3 Every situation that leaves a bar empty, and the line it now shows

Found by sweeping a played class person by person and tick by tick, not by listing them from memory.

| Situation | The line comes from | What it reads |
| --- | --- | --- |
| A child under ten | `tooYoungWhy` | *"Simeon Proofwright is too young to be sent."* |
| An infant | `tooYoungWhy` — the same rule, not a second one | *"Delia Proofwright is too young to be sent."* |
| Dead, or captured | `choreAvailability` | *"This person cannot work."* |
| On the road anywhere | `choreAvailability` | *"Barnabas Proofwright is on the road."* |
| Away, carried faster than a student can follow (`sim/sight.mjs`) | `choreAvailability` | *"…is away on the road to Gonzales, about 12 miles off, and should be back…"* |
| Shut in the Alamo, or ridden for it | the serving row's own sentence (`panelActions`) | *"…is shut in the Alamo."* |
| Serving, and marching with the camp (`sim/houston.mjs` `followCamp`) | the camp's work, refused for the road | *"…is on the road."* |

Three situations named when this was asked for turn out **not** to leave a bar empty, and are left alone:

- **Serving in a garrison or with the army, at rest.** Their row has *Send for them*, which is open, so there is a bar.
- **Sick.** Sickness refuses no work at all (`sim/routines.mjs` sets the condition and nothing else); a sick person's bar
  is full, and the family panel is not where a sickness is read.
- **A family that has fled east.** Everybody old enough has the road's own chores (`sim/road.mjs`); only the children
  under ten go quiet, with the line they always have.

### 14.4 What is not said, and why

`ceiling:` **a row refused for several different reasons keeps its line of dimmed pictures.** One line cannot say two
things. The case that deals it is a family halted on the road east: the work at home is refused because the person is on
the road, the work on the road because the wagon is fast in the mud, and choosing between those two would be the page
deciding which of the server's sentences is truer. That row is not an *empty* bar — it is a full one, each icon carrying
its own reason on hover, which is where every refusal in this game is read.

`ceiling:` **the dead and the captured share one sentence that does not name them** — `choreAvailability`'s *"This person
cannot work."* Every other line here names the person. The way out is the server's own wording, not a sentence invented
in the page.

`ceiling:` **on a phone the line follows the body it lives in**, so only the opened row shows it
(`.panel-row:not([data-expanded=true]) .panel-body`). The screen this was built for is 1366x768.

### 14.5 The one thing that had to be told apart

The guided start **shuts** icons and the server **refuses** them, and on a screen those look the same. They are not the
same situation and must not get the same sentence. `sim/lesson.mjs` refuses in `applyAction` and leaves `world.work`
alone, so a step that shuts the whole bar leaves every icon `can: true` — and rule 1 above sends the line back null. A
student mid-lesson reads the step's own words on the icons and is never told there is nothing for that person to do,
while a child under ten **in the same tick** still gets their own line, because the server really did refuse them. Held
by *a bar the guided start has shut is not a person with nothing to do* in `tests/panel-silence.test.mjs` and by four
checks in the browser proof.

### 14.6 Gates

| Gate | What it means |
| --- | --- |
| The sentence is the server's | Every line shown is found word for word among the refusals the server sent for that person; swept over a played day. |
| A bar with anything open says nothing | Somebody at work keeps their glowing icon and their way to call it off — the one case where a whole bar really does share one reason. |
| A shut lesson bar is not an empty bar | With a step shutting everything the icons stay and no line appears, and a child the server refused still gets theirs in the same tick. |
| The main person's line is in the bar | And their own row stays quiet, so it is never said twice. |
| A row with no icons still speaks | Somebody dead or captured is read from `world.work`, not from icons they do not have. |

`npm test` (`tests/panel-silence.test.mjs`, ten tests); `node scripts/panel-silence-injections.mjs` — **8 of 8 caught**,
[docs/evidence/panel-silence-injections.json](evidence/panel-silence-injections.json); `npm run test:panel-silence` —
**39 checks** at 1366x768, [docs/evidence/panel-silence-screen.json](evidence/panel-silence-screen.json); and
`node scripts/panel-silence-browser-proof.mjs --inject` — **3 of 3 caught**,
[docs/evidence/panel-silence-screen-injections.json](evidence/panel-silence-screen-injections.json).
Claims `FIC-GONZ-310` to `-312`.
