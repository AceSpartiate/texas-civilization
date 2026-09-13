# Texas Revolution Family Simulation
## Astra Foundation Brief

> **Astra: open art requests are waiting (2026-09-12).** Read [docs/ART_REQUESTS.md](docs/ART_REQUESTS.md) before anything else — children, a second civilian cast, rider dismount/remount and north/south dialogue facings, with exact sheet layouts and the delivery contract. The game is drawing temporary stand-ins until they arrive.

Read `VISION.md` before beginning.

Your purpose is to create a technically strong foundation that Claude Code can expand aggressively afterward.

Do **not** attempt to complete the full Texas Revolution.

Do **not** measure success by feature count.

Measure success by whether the project's hardest architectural assumptions have been proven and protected by tests.

Astra owns **four sequential foundation gates**.

Do not begin a later gate until the current gate meets its exit criteria.

Low-fidelity placeholders are explicitly allowed. Integration proof matters more than polish.

---

# Gate A — Multiplayer, Networking, and Deployment

This is the first survival gate.

Before significant simulation work, prove that the classroom multiplayer architecture functions.

## Target flow

Teacher:

1. launches the host/server;
2. Host page opens;
3. students receive a local URL/QR/session code;
4. multiple browser clients join;
5. live state synchronizes.

## Required capabilities

Implement a minimal prototype demonstrating:

- authoritative server
- multiple browser clients
- live state synchronization
- session/client identity
- refresh without losing assigned household/session identity
- temporary disconnect and reconnect
- Pause/Resume broadcast
- session seed
- basic persistent session state

## School-network reality

Separate two questions:

### Architecture proof
Can multiple devices communicate correctly on an ordinary LAN?

### Deployment-environment proof
Can they communicate on the actual district/school Wi-Fi?

If the real district network is available, test it early.

If it is not available during development, do **not** block the entire project waiting for access.

Validate the LAN architecture, document the assumption, and mark actual district-network validation as a mandatory pre-classroom deployment gate.

If the actual network later blocks local hosting, document the specific restriction and choose the simplest viable alternative while preserving browser-based student access if possible.

## Launch architecture

Avoid foundations requiring teachers to:

- manually run Node
- type terminal commands
- discover IP addresses
- configure ports
- edit configuration files

A final polished launcher is not required now.

However, the architecture must reasonably support:

> launch one application → Host opens → students join

## Gate A objective exit criteria

Do not advance until all practical criteria pass:

- at least **5 browser clients** can connect simultaneously on the development LAN
- at least **100 sequential state updates** propagate correctly
- one client refresh restores the same session/household identity
- one disconnect/reconnect restores the same session/household identity
- Pause freezes authoritative simulation ticks
- Resume restarts them cleanly
- server and client start/run procedure is documented
- district-network validation status is explicitly recorded as PASS, FAIL, or NOT YET TESTED

## Regression tests

Where practical, add automated tests for:

- session identity
- reconnect
- pause/resume
- deterministic seed initialization
- persistence of assigned client/household identity

Every architectural invariant Astra proves should receive a regression test where practical.

---

# Gate B — Persistent Living World

Prove the physical-world architecture.

Do not build the whole map.

Build the smallest example that proves the model.

## Required pieces

Create:

- one household
- one local home/farm view
- several visible family members
- one principal character
- one or more simple animals
- one wagon or important property object
- one regional world view
- one second destination/local view
- one route connecting them

## Critical invariant

Regional and local views are **different renderings of one world**, not separate simulations.

Do not create separate regional and local copies of a character.

Example:

`Thomas` has one persistent entity ID.

The server stores his:

- true location
- travel state
- health
- current task
- household
- relevant property references
- relationships

The renderer decides how Thomas appears at each scale.

## Required demonstration

Thomas must be able to:

1. exist visibly at home
2. begin travel
3. leave the local view
4. move through the regional view
5. reach the destination
6. appear in the destination local view
7. remain the same entity throughout
8. save
9. reload
10. reconnect without duplication or reset

## Also establish

- persistent entity IDs
- authoritative World State
- basic Household State
- basic resources
- seeded randomness
- save/load
- Event Log

## Asset contract

Define technical art standards:

- camera angle
- sprite dimensions
- coordinate system
- animation naming
- atlas/file structure
- character proportions
- building scale
- terrain scale
- level-of-detail expectations
- renderer assumptions

Use placeholders.

Do not build the final art library.

## NPC simulation depth

Support multiple simulation depths from the beginning.

### Detailed
Player characters and important recurring NPCs.

### Moderate
Couriers, key neighbors, significant local characters.

### Aggregate/event-driven
Background society and ordinary military personnel.

Do not architect the game as though every visible person requires a full autonomous agent.

## Gate B objective exit criteria

Do not advance until:

- the same persistent character ID completes local → regional → local travel
- save/load preserves the character's correct location and state
- reconnect creates no duplicate entity
- one property object and one animal persist correctly through save/load
- seeded initialization reproduces the same starting state
- Event Log records departure, travel, and arrival
- the one-world/multiple-view invariant is protected by tests where practical

## Regression tests

Add tests where practical for:

- persistent IDs
- local/regional state continuity
- save/load
- duplicate prevention
- deterministic initialization

---

# Gate C — Information and Continuous Time

This gate proves two defining systems.

---

## C1. World State vs Household Knowledge State

The server maintains objective truth.

Each household separately maintains what it knows.

Implement the smallest proof.

Example:

- a historical/world event exists
- Household A observes or receives it
- Household B does not know yet
- a courier/report later delivers it to B

Demonstrate that:

- two clients correctly see different information
- neither client's UI changes objective World State
- information can age
- information can be rumor/unconfirmed/confirmed
- Host public knowledge is separate from private household knowledge

Keep player presentation simple.

Example:

> Mexican troops reported near Béxar.  
> Report received two days ago.

## C2. Inter-Chapter Resolver

Historical time must sometimes jump forward.

This cannot reset the story.

At a time jump:

1. enumerate persistent entities
2. identify routine assignments
3. identify significant commitments
4. resolve routine activity
5. preserve unresolved travel/service
6. update routine resources
7. progress minor health states
8. age information/rumors
9. preserve relationships
10. record meaningful changes
11. validate state consistency

## Critical rule

Time compression may summarize routine life.

It should not casually hide major principal-character events.

Do not produce routine outcomes like:

> Several weeks pass. Thomas died.

Major outcomes such as death, capture, severe injury, or major personal loss should generally be surfaced as active/dramatized events instead.

## Gate C objective exit criteria

Do not advance until:

- Household A knows an event that Household B does not
- courier/report delivery later updates B
- Host public knowledge remains independently controlled
- information age changes correctly over simulated time
- a time jump preserves unresolved character travel/service
- routine home activity progresses
- borrowed/away property does not magically return
- prior knowledge remains known while aging appropriately
- identical seed + identical inputs produce identical resolver output

## Regression tests

Add automated tests for:

- Knowledge State isolation
- courier/report delivery
- information aging
- Host/public knowledge separation
- Inter-Chapter Resolver determinism
- persistence of unresolved commitments
- preservation of relationships/property/knowledge

---

# Gate D — Thin Autonomous Gonzales Slice

Now prove the full causal loop once.

Do **not** build a polished classroom-ready experience.

Build the bones Claude will later turn into the game.

The required chain is:

> HISTORY → WORLD → INFORMATION → PRESSURE → CHOICE → PHYSICAL ACTION → CONSEQUENCE → MEMORY

## Explicit low-fidelity permission

Gate D may use:

- placeholder sprites
- crude terrain
- one hand-authored social interaction
- one or two basic resources
- scripted or semi-scripted battle phases
- simple formation movement
- three or fewer predetermined Host camera focus states
- temporary UI
- temporary sound or no sound

Do not spend Astra's limited time polishing Gonzales.

## Minimal slice

Start with one or several simple households.

Players can see:

- family
- home
- principal character
- simple property
- basic routine

Then:

### Historical situation develops
A Gonzales-related event enters World State.

### Information spreads
Different households learn at different times.

### Pressure appears
At least one household receives a believable community or personal request.

Avoid:

> QUEST: GO TO GONZALES

### Player chooses
Allow both:

- participate
- refuse

Refusal must be valid.

### Physical action
If a person is sent:

- they leave
- travel visibly
- join others

### Gathering
Show actual little people gathering rather than only incrementing a counter.

### Battle
Create a simple visible Battle of Gonzales sequence.

Use the future Battle Director pattern:

- aggregate formation state underneath
- miniature soldiers above
- historical outcome anchored

### Consequence
A player character experiences an understandable result.

### Memory
Record the result in Event Log and preserve it.

---

# Autonomous Host Foundation

Gate D must prove basic Host autonomy.

The Host should:

- display lobby
- show connected count
- start the game
- advance the historical sequence automatically
- show public knowledge
- control its own basic camera
- show the battle when appropriate
- pause/resume

The teacher should not manually trigger Gonzales.

A sophisticated Host Director is not required yet.

Establish the architecture.

---

# Student UI Foundation

Do not overbuild UI.

Prove that a student can determine:

- who is in the family
- what the important person is doing
- what important property/resources exist
- what happened
- how to issue a basic action

Use simple contextual verbs.

Claude will refine this later.

---

# Gate D objective exit criteria

Do not declare the gate complete until:

- at least one complete causal loop runs without manual server-state edits
- a player can refuse the request without the simulation breaking
- a participating character physically travels and remains the same entity
- the Battle of Gonzales sequence starts and resolves automatically
- the historical macro-outcome remains anchored
- at least one persistent consequence is recorded
- Host runs the sequence without manual event triggering
- pause/resume works during the slice
- reconnect restores player state
- save/load preserves the consequence
- Event Log contains the causal chain

## Regression tests

Add tests where practical for:

- historical anchor preservation
- refusal path
- persistent consequence
- battle-state resolution
- Host progression
- save/reload after consequence

---

# Developer Sandbox Foundation

Establish hooks for a private developer/debug mode.

Eventually it should support:

- one human plus bots
- seed selection
- time acceleration
- phase/event selection
- state inspection
- Knowledge State inspection
- bot strategies

Do not fully build it now.

Make sure the architecture supports it.

---

# Simulation Test Hooks

Create a headless or low-overhead way to run the simulation without rendering.

At minimum expose:

- deterministic seed
- player-count configuration
- world initialization
- simulation stepping
- metric/event extraction

Do not attempt final balancing during Astra's session.

---

# Internal Metrics Foundation

The classroom game does not need a public score.

Prepare the data model for internal measures such as:

### Household
- survival
- health
- food
- transportation
- family separation
- property/livestock loss
- evacuation state

### Story opportunity
- meaningful decisions per household
- inactive periods
- repeated request count
- inherited consequences

These are for later balancing by Claude.

---

# Documentation to Leave for Claude

Repository, not conversation history, is the source of truth.

Create or update:

## `VISION.md`
Project Constitution.

## `GAME.md`
Current gameplay/system design.

## `HISTORY.md`
Only the research currently needed for Gonzales, with sources and classifications.

Where practical, give implemented historical claims stable IDs such as:

`HIST-GONZ-001`

Each implemented claim should be traceable to:

- source/citation
- classification
- implementation note

## `TECH.md`
Document:

- networking
- persistent entity model
- one-world/multiple-view architecture
- asset contract
- World State
- Knowledge State
- Inter-Chapter Resolver
- Host foundation
- simulation-depth rules
- save/reconnect
- tests
- deployment assumptions

## `HANDOFF.md`
This is the most important operational document.

Record:

- what works
- what is partial
- what failed
- known bugs
- exact run commands
- exact test commands
- files Claude should inspect
- next five recommended tasks
- architectural invariants that should not be casually changed
- district-network validation status

Use maturity labels where useful:

- `PROTOTYPE`
- `PLAYABLE`
- `CLASSROOM READY`

A feature that technically runs is not automatically classroom ready.

## Optional `CLAUDE.md`
Keep it short.

Tell Claude to read:

1. `VISION.md`
2. `HANDOFF.md`
3. `TECH.md`
4. current phase brief

before substantial work.

---

# What Not to Spend Astra's Time On

Do not prioritize:

- complete Alamo
- complete Goliad
- complete Runaway Scrape
- complete San Jacinto
- final narration
- large asset library
- many household archetypes
- sophisticated personality AI
- final sound design
- elaborate weather
- numerous historical NPCs
- polished epilogues
- extensive cosmetics
- exhaustive research of the entire Revolution

Claude can build these afterward.

Astra should leave **strong foundations, not unfinished breadth**.

---

# Astra Final Success Test

The initial foundation session is successful if the repository can demonstrate approximately this:

A teacher launches the prototype.

At least five browser clients join.

A student sees a family at a physical property.

Thomas exists as one persistent character.

The server contains historical truth that different households do not all know.

News reaches one household.

A believable request appears.

The player may accept or refuse.

If accepted, Thomas physically leaves.

He travels through the regional world.

He reaches Gonzales.

Actual little people gather.

A simple visible battle occurs automatically.

The historical outcome remains anchored.

Thomas experiences an understandable consequence.

The consequence is recorded.

The Host handles the sequence automatically.

The session saves.

The client reconnects.

A time jump can occur without resetting the household.

The core architectural invariants are protected by regression tests.

Claude can read the documentation and continue immediately.

If that works, Astra has done its job.
