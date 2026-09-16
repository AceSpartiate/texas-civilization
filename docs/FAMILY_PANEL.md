# The family panel: managing a family's people

**Status: decided by the owner 2026-09-15; built 2026-09-16** ([evidence](evidence/family-panel-browser.json)). It amends
[SETTLING_IN.md](SETTLING_IN.md) in how a family's people are managed: the person panel's list of work and its travel, work
and rest buttons, and the family book's row of Rename buttons, are replaced by one panel on the left of the map. Read this
before changing how a student gives a person an order, the portrait or icon art, or renaming.

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
  beside them, as clicking them on the map does. A person who is being asked something, or whom a rider has stopped, has a
  mark on the portrait; the question itself is still answered on their card.
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
| Take the cotton to the store (`sell-cotton`) | Carry the cotton to the store in town and trade it for food or coin. |
| Buy powder and lead in town (`fetch-powder`) | Go to the store in town and buy powder and lead. |
| Fetch seed from town (`fetch-seed`) | Go to the store in town and buy seed. |
| Sell food at the store for coin (`sell-food`) | Carry spare food to the store in town and sell it for coin. |
| Mend the hoe (`mend-hoe`) | Set the worn hoe right again at home. |
| Buy a hoe in town (`replace-hoe`) | Go to the smith in town and buy a sound hoe for coin. |
| Fell trees (`fell-trees`) | Fell the trees at a place in timber you choose on the family's land. |
| Haul logs to the house (`haul-logs`) | Bring the felled logs lying out to the house. |

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
