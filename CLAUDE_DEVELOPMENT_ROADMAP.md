# Texas Revolution Family Simulation
## Claude Development Roadmap

**Owner update, 2026-09-10:** Read [docs/LIVING_INFORMATION.md](docs/LIVING_INFORMATION.md) before extending the news feed or later arcs. Required direction: physical messenger encounters and conversations, distance-dependent knowledge, regionally different opportunities, persistent Alamo/Goliad/evacuation consequences, feasible government roles and uncertainty about Houston's plans. Its production acceptance gates define the intended quality. Build one complete Gonzales encounter first; this update does not claim later campaigns exist. Read [docs/ASSETS.md](docs/ASSETS.md) and [docs/ALAMO_LAYOUT.md](docs/ALAMO_LAYOUT.md) for the delivered animation and full-compound construction foundation.

This roadmap exists so Astra understands what it is preparing the architecture to support.

Astra should **not** execute this roadmap beyond what is necessary for its four foundation gates.

Claude should read:

1. `VISION.md`
2. `HANDOFF.md`
3. `TECH.md`
4. the current phase brief

before substantial work.

The Project Constitution remains authoritative.

---

# Maturity Labels

Use these labels consistently in `HANDOFF.md` and project tracking:

## PROTOTYPE
Architecture or feature works technically but may be incomplete, ugly, poorly balanced, or unsuitable for students.

## PLAYABLE
Feature works end to end and can be meaningfully tested by a human.

## CLASSROOM READY
Feature is understandable, stable, historically vetted, sufficiently balanced, accessible, and resilient enough for classroom use.

Do not assume that a technically functioning feature is finished.

---

# Macro-Phase 1 — Complete the Core Game

This phase turns Astra's architectural proof into a compelling Gonzales experience and a usable core simulation.

## 1A. Complete Gonzales

Refine:

- household introduction
- principal/supporting characters
- routine work
- meaningful property
- information arrival
- social/community pressure
- refusal
- travel
- gathering
- Battle of Gonzales
- consequences
- Event Log
- Host presentation
- reconnect
- performance

Do not immediately begin the Alamo.

### Gonzales quality gate

Before aggressive expansion, test:

- Can students understand their family quickly?
- Can they identify principal characters?
- Does at least one person feel worth caring about?
- Does history enter naturally?
- Does information asymmetry make sense?
- Does the request feel human rather than gamified?
- Can a student refuse?
- Does watching someone leave feel meaningful?
- Is regional travel understandable?
- Are actual people gathering?
- Is the battle worth watching?
- Do consequences persist?
- Does Host operate unattended?
- Does reconnect work?
- Does the experience feel like one story?

If not, fix Gonzales.

Do not assume more famous history will rescue weak gameplay.

## 1B. Student UX quality gate

### Decided interface direction — map-first

**Largely built as of 2026-09-09.** One continuous full-screen map that follows the household, contextual verbs on whatever is clicked, no instruction text, costs on the controls that spend them, and an illustrated animated world rather than placeholder shapes. Reach was the last gap in this section and it is closed: the journal roster lists anyone standing with the household beside the family's own people, so every action — including offering a trade, which needs a neighbour selected — is reachable without a pointer.

Decided by the project owner on 2026-09-09, after watching the prototype on a phone. The verdict on the placeholder interface was that it "feels like a quiz in disguise." That is a judgement about the shape of the interface, not its polish, and art alone cannot answer it.

**The world is the interface.**

- **The student has exactly one map.** Not a regional panel and a local panel, and no control for choosing which place to look at. One continuous view that follows the student's own family: their land when everyone is home, the road when someone travels, the destination when they arrive. Picking a camera is a control, not a decision, and `VISION.md` §9 says students should struggle with decisions rather than controls.
- **The regional and public view belongs to the Host**, projected on the classroom's main screen. A student who wants the wider picture looks up at it. This also reinforces §10: the Host shows public knowledge, and a student's own map shows what their household can see.
- One large rendered view is the primary surface. Text panels are reduced to a status line and a news feed.
- **Nothing on screen explains how to play.** No hint text, no instruction strip, no tutorial captions. An affordance a student cannot work out unaided is a design fault to fix, not a caption to add. Costs belong on the control they apply to, not in prose.
- The student acts by clicking things in the world — a person, an animal, the wagon, a field, a building, a road, a neighbour's place — and receives contextual verbs on that thing.
- Selection is explicit and visible. The student must never have to ask which character they are directing.
- State belongs on the map wherever it can be shown there: who is present, who is absent, what is planted, what is damaged, where someone is travelling.
- Lists remain only as accessible text equivalents and as a fallback, never as the primary way to play.

Interaction conventions may follow familiar strategy-game practice — click an object, get its actions; hover for detail; a map that means something. **Scope must not.** `VISION.md` §1 and §16 stand: students guide one household, not Texas, not armies, not a tech tree, and this is not a tactical war game.

This direction depends on the world model being worth rendering. A map-first interface onto a six-column grid of identical homesteads with one town would still feel empty, so geography, multiple settlements, real distances, crops and woods are prerequisites, not follow-ups.

**Built as of 2026-09-09:** the single full-screen map, the following camera with drag, pinch and zoom, quick-jump controls, click-a-person selection with an instruction card anchored beside them, the `!` mark over a person with something waiting, and the status, news and teacher controls as overlays. Everything formerly in side panels is now a screen-reader text equivalent.

**Built since, all on 2026-09-09:** orders for every family member rather than the principal alone; chores on the farm as data steps — planting, harvesting, hunting, fetching seed; a hoe that wears out and must be mended or replaced; skills that differ between family members; trading with Gonzales residents and, face to face, with other households; and an illustrated animated sprite library in place of the procedurally drawn cabins, oaks and figures.

**Still to build here:** requests between households — a trade carries goods and no message, so there is no way to *ask* a neighbour for anything, only to offer them something.

### Comprehension target

Within approximately one minute, a student should understand:

- family members
- principal characters
- current work
- important resources/property
- nearby situation
- current information
- how to act

Refine:

- contextual action menus
- simple verbs
- selected-character state
- tooltips
- disabled-action explanations
- information age/confirmation display
- minimal onboarding
- responsive Chromebook layout

If students require constant teacher explanation of mechanics, simplify.

## 1C. Household and social depth

Expand carefully:

- principal/supporting characters
- household archetypes
- basic professions
- family opinions
- relationships
- reciprocity
- default routines
- noncombat agency

Avoid overbuilding character AI.

## 1D. Economy and physical attachment

**Partly built, 2026-09-09.** A household holds food and seed, one field of corn or cotton, and one hoe. Work is data rather than code — a chore is an ordered list of steps in `sim/chores.mjs` — so the way to add a resource or a job is to add a table entry. Every family member can be sent to work and each has a fixed aptitude for farming, hunting and handwork.

**Trade between households arrived on 2026-09-09** (`FIC-GONZ-010`, `sim/trade.mjs`). An offer is made face to face between two people standing in the same place, names what a family gives and what it wants, and is accepted, declined, withdrawn, or lapses when the two part. Any family member may strike it. Neither family ever learns the other's stores. Seed and food change hands; tools do not.

**Still missing, and deliberately so:** money, medicine, and livestock as a resource. There is one field, one tool and one crop, so aptitude changes only pace and yield, not what a person is uniquely able to do. Nothing can be lent — not a person, a tool or an ox — which is the pressure this section actually wants from a family with nobody handy. Balance is untuned: seed correctly runs dry and forces the town trip, but food accumulates when every family member works flat out, and no trade rate is enforced.

**The anti-optimisation rule still binds.** No system here may reward a correct build order. Widelands' Economy object — automatic supply/demand matching over a road network — was studied and explicitly refused for that reason; see [docs/REFERENCE_ARCHITECTURES.md](docs/REFERENCE_ARCHITECTURES.md).

Use a small economy.

Likely core categories:

- food
- money/trade goods
- livestock
- transportation
- medicine

Add another resource only if it clearly creates meaningful later consequences.

Improve physical representation:

- fields
- animals
- wagon
- buildings
- supplies
- repairs
- household activity

**It should feel like a farming life.** The owner's stated target on 2026-09-09: a student should be half-convinced this is a farming simulator — we are low on seed, so send someone to town; a tool broke, so repair it, replace it, or ask a neighbour. That daily work is what makes the Revolution land on someone with a farm to lose.

What it must not become is an optimisation game. There is no score, no efficiency rating, and no correct build. Every system here exists to create things students later care about losing, protecting, abandoning, or using — and to give them reasons to need each other.

### Crops and land

Land must be a place, not a texture.

A household's fields exist at real coordinates on its own land, are planted, tended and harvested against the historical calendar, and suffer when the people who work them are away.

Requirements:

- fields belong to a household and occupy visible ground at its home site
- planting, tending and harvest consume actual labor by named people
- absence has a cost; nobody home means the crop suffers
- a harvest feeds the existing food economy rather than creating a separate score
- a standing crop is something real to abandon during the Runaway Scrape

Do not build a farming simulator. Crop state should be legible in one sentence.

### Woods, hunting and foraging

Wooded ground exists on the map as terrain a person can travel to and work in, not as decoration.

Requirements:

- woods occupy real map locations at real distances from each household
- sending someone hunting is a travel-and-labor decision with time, distance and risk
- outcomes are food, and sometimes hides or trade goods, resolved inside a visible risk rather than by hidden punitive RNG
- hunting competes with farm labor, community requests and evacuation for the same people
- geography decides who has good hunting ground nearby; this is one of the ways place should matter

Hunting is a noncombat path with real consequences. It must not become the universally optimal strategy, and it must never require a marksmanship minigame.

## 1E. Social system and Pressure Director

Expand:

- neighbors
- relatives
- community groups
- requests
- reciprocity
- family disagreements
- memory

Historical Pressure Director should model regional/community pressure.

It must not harass students into participation.

Track story-opportunity parity.

Every household should receive several meaningful decisions across the game.

Do not force equal content.

Do prevent chronically uneventful households.

## 1F. Continuous time

Strengthen the Inter-Chapter Resolver.

Test:

- traveling character during time jump
- military service
- injury
- food shortage
- borrowed wagon
- damaged property
- unresolved relationship
- old rumor
- missing courier

Routine life may compress.

Major principal-character outcomes should normally be experienced rather than silently summarized.

---

# Macro-Phase 2 — Historical Expansion

Expand one researched historical arc at a time.

Before implementing each arc, expand the research perimeter specifically for that arc.

Do not create separate architectures for individual historical events.

Reuse the same World State, Knowledge State, Pressure Director, Battle Director, Host Director, travel, relationship, and Event Log systems.

## 2A. Late 1835 / Béxar

Add:

- broader mobilization
- political uncertainty
- military participation
- Siege/Battle of Béxar where appropriate
- return or continued absence of volunteers
- household consequences
- new information flows

## 2B. Alamo

Research deeply before implementation.

Suggested arc:

1. Mexican approach
2. siege
3. artillery
4. appeals/couriers
5. uncertain information
6. reinforcement decisions
7. final assault
8. silence
9. delayed confirmation

Nearby/connected households may experience it live.

Distant households should not receive omniscient knowledge.

Once the fall becomes public knowledge, Host may show a concise reconstruction for the class.

Use Host reconstructions sparingly.

## 2C. Goliad

Research carefully.

Reuse existing systems for:

- military movement
- travel
- information
- relationships
- battle
- surrender
- captivity
- aftermath

Represent Coleto, surrender, imprisonment, and massacre seriously but without graphic violence.

## 2D. Runaway Scrape

Invest heavily here.

This may become the **mechanical and emotional climax** for many households.

Use accumulated state:

- food
- standing crops and the land itself
- wagon
- horses/oxen
- livestock
- family health
- household size
- relationships
- earlier generosity/refusal
- geography
- information
- timing
- property
- weather where historically useful

Players may decide:

- when to leave
- who goes
- what is carried
- what is abandoned
- which animals travel
- who is helped
- which route is used

San Jacinto may be the historical military climax.

Runaway Scrape may be the player's hardest set of decisions.

## 2E. San Jacinto

Implement the military culmination with the Battle Director.

Keep the strategic outcome anchored.

Allow household-level variation around:

- military participation
- courier work
- logistics
- civilian experience
- information
- aftermath

San Jacinto resolves the military crisis.

It does not erase previous losses.

---

# Macro-Phase 3 — Completion, Balance, and Classroom Readiness

This phase turns the full historical simulation into a robust classroom product.

## 3A. Epilogue and Revelation

Build deterministic offline family endings.

Use Event Log metadata such as:

- importance
- involved characters
- cause/effect links
- emotional weight
- historical phase

Do not simply concatenate every event.

Select the most important causal threads.

Afterward remove fog of war and replay:

- actual army movement
- major battles
- refugee movement
- player travel
- information propagation

### Host debrief hooks

After Revelation, automatically surface a small number of noncompetitive discussion prompts or observations, such as:

- some households learned a major event earlier than the public Host
- different regions acted on different information
- some families faced military danger while others faced refugee/logistical crises
- two households made opposite decisions under different circumstances

Do not rank students.

Do not identify a "best patriot."

## 3B. Historical household expansion

Research and add several documented anchor households.

Do not make one family the singular protagonist.

Include the Ayres household where appropriate.

Where supported, Charles Edward Travis should exist naturally within the family rather than as a quest object.

Continue mixing documented families with clearly labeled plausible composites.

## 3C. Representation and content depth

Expand responsible portrayal of:

- Tejanos
- Mexican civilians
- Mexican soldiers
- immigrants
- free Black Texans
- enslaved people
- Indigenous nations
- women
- children
- refugees
- merchants
- laborers

Follow historical evidence and the fiction budget.

## 3D. Host Director polish

Improve autonomous projection behavior.

Rank presentation-worthy events using:

- historical importance
- public knowledge
- number of affected households
- novelty
- recency
- current camera state

Refine:

- camera dwell time
- smooth transitions
- geographic context
- public information
- battle presentation
- brief historical reconstructions
- narration
- transition timing

Normal teacher controls remain:

- Pause
- Resume
- End Game
- Settings

## 3E. Balance and story opportunity

Run many headless simulations at:

- 5
- 8
- 12
- 15
- 20
- 25
- 30 players

Track:

### Household outcomes
- survival
- health
- food shortage
- transportation
- property/livestock loss
- family separation
- evacuation success

### Participation
- military
- noncombat
- refugee assistance
- courier/logistics

### Story opportunity
- meaningful decisions per household
- inactivity
- regional opportunity inequality
- repeated pressure requests
- consequences inherited from earlier choices

### Strategy
- dominant strategies
- resource inflation
- overcommitment to combat
- trivial avoidance strategies

Tune difficulty without arbitrary punishment.

## 3F. Performance

Profile on realistic school hardware.

Prioritize:

- Chromebook responsiveness
- network traffic
- battle rendering
- regional-map rendering
- 30-client synchronization
- Host presentation

Use:

- aggregate NPC simulation
- formation-level battle logic
- level-of-detail
- client interpolation where appropriate

Do not simulate every visible background person as a sophisticated autonomous agent.

## 3G. Art and animation

Work inside Astra's asset contract.

Expand coherent assets for:

- civilians
- families
- soldiers
- Tejanos
- Mexican military
- children
- horses
- cattle
- oxen
- wagons
- buildings
- camps
- artillery
- terrain

The world should look like one game.

## 3H. Audio, narration, and accessibility

Add restrained Host-centered sound.

Possible:

- distant cannon
- rain
- horses
- wagon movement
- crowds
- musket volleys
- restrained music

Avoid 30 student devices creating classroom noise.

Narration should be concise, historically accurate, age appropriate, and supported by matching text.

The game must remain fully usable without audio.

Verify:

- readable typography
- strong contrast
- colorblind-safe communication
- icons plus words
- no color-only meaning
- responsive layouts
- generous interaction targets
- reduced precision-click requirements
- concise text

## 3I. Packaging and classroom release

Final teacher experience should approach:

1. launch one application
2. Host appears
3. students join
4. press Start

Avoid terminal use.

Test:

- Windows host
- actual school network
- browser compatibility
- Host reload
- server recovery where practical
- multiple class periods

Add `New Class`:

- save/archive previous session
- generate new seed/session code
- clear student assignments
- preserve settings
- return to lobby

---

# Cross-Cutting Requirements

These may be worked on whenever they become dependencies.

Do not wait for their nominal macro-phase if an obvious problem needs solving earlier.

## Historical claim traceability

Where practical, implemented historical claims should have stable IDs such as:

`HIST-ALAMO-014`

Each claim should be traceable to:

- citation/source
- classification
- implementation note

## Regression tests

Protect architectural invariants continuously.

Particularly:

- entity persistence
- Knowledge State isolation
- seeded determinism
- Inter-Chapter Resolver behavior
- historical invariants
- save/load
- reconnect
- Host progression

## Continuity tests

Automate tests ensuring:

- dead characters remain dead
- absent characters remain absent unless logically resolved
- injuries persist or heal logically
- relationships persist
- loans persist
- damaged property persists
- known information remains known but ages
- rumors age
- military service persists
- shortages persist
- previous choices influence later events

## Classroom failure tests

Repeatedly test:

- 30 simultaneous joins
- refresh
- temporary Wi-Fi loss
- duplicate names
- late arrivals
- browser closure
- Host reload
- pause during battle
- pause during travel
- pause during time compression
- abandoned household
- audio failure
- low-performance devices

Reliability outranks animation perfection.

---

# Claude's Engineering Rule

Phase order expresses **design priority**, not rigid implementation order.

Claude may pull forward performance, tooling, UI, asset, test, packaging, or architectural work when it unblocks the current feature.

Do not ignore obvious architectural problems merely because their nominal phase appears later.

When choosing between:

> adding another sophisticated independent subsystem

and

> making existing systems interact more meaningfully

prefer interaction.

The game becomes deep because:

- geography changes information
- information changes decisions
- decisions change movement
- movement changes household labor
- labor changes resources
- resources change evacuation
- relationships change later assistance
- earlier choices change later pressure

Build outward from that.

---

# Final Target

By the end of development, a student should be able to say something like:

> We started near Liberty. My older brother wanted to go west, but I kept him home at first. Later we sent our wagon to help another family. When everyone started fleeing, we didn't have it. The family we'd helped earlier stopped for us. We lost some of our animals, but everybody made it across the river. I thought the Mexican army was farther away than it really was. At the end, the map showed how close they had actually gotten.

That is the finished game.

Claude's job is to build that experience on the foundation Astra establishes.
