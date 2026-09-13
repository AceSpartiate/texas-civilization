# Reference architectures: what was studied, what was taken, what was refused

Prepared 2026-09-09 at the owner's request, after reading six existing projects against this codebase: the Colyseus + Phaser multiplayer tutorial, Mozilla's BrowserQuest, Widelands, 0 A.D., ponytail, and OmniRoute.

**The last two are not games.** They were read on 2026-09-09, also at the owner's request, and belong to a different category — one is a coding-agent plugin, the other an LLM gateway — so §5 and §6 open by saying what each actually is, because a reader expecting another engine will otherwise mis-read the verdicts.

**This is a decision record, not a survey.** Each finding ends in a verdict, and the verdicts that say *no* matter as much as the ones that say *yes* — three of the four projects are real-time engines solving latency and throughput problems that a twenty-minute tick does not have. Every substantive claim below was checked against primary source; where a claim could not be verified it is marked.

**The measurement that settles most of it:** a student's per-tick projection was **1.91 KB** when this review was written and is **3.74 KB** now that there is farm work and shared observation — call it 112 KB per tick across thirty devices, once every few seconds. Any argument for adopting a framework to save bandwidth has to start from that number. The table under BrowserQuest tracks how it moved and why.

---

## 1. Colyseus + Phaser — rejected on three independent grounds

| Question | Finding | Verdict |
| --- | --- | --- |
| Transport | WebSockets, uWebSockets.js, WebTransport, Bun WebSockets. **No SSE, no long-polling.** | **REJECT** — no path that keeps HTTP + SSE |
| Dependencies | `@colyseus/core` alone pulls `msgpackr`, `nanoid`, `debug`; the tutorial client is Vite + TypeScript | **REJECT** — breaks zero-dependency and no-build-step |
| Per-client filtering | `@filter`/`@filterChildren` were experimental and were replaced by `StateView` in 0.16 | **REJECT** — see below |
| Delta encoding | Binary schema patches; 100 entities = 2671 bytes full, 9 bytes for a one-entity move | **REJECT** — amortises a cost we do not pay |
| Fixed tick / prediction / interpolation | 60 Hz simulation, input replay, `Phaser.Math.Linear` smoothing of other players | **REJECT** — nothing to predict |
| Phaser | Ships a dependency-free single-file browser build | **REJECT on fit, not packaging** |

**The filtering finding is the one that mattered**, because fog of war here is a correctness requirement rather than an optimisation. The `StateView` documentation says, verbatim:

> "Avoid relying on `StateView` for large datasets: it is not optimized for that yet."

Resting a correctness property on a framework's newest subsystem, self-flagged as unoptimised, having replaced a previous API within two majors, would be a downgrade from computing the projection ourselves. ([docs.colyseus.io/state/view](https://docs.colyseus.io/state/view), [transport](https://docs.colyseus.io/server/transport) — both fetched and verified.)

**On interpolation, this record has to be corrected against the code.** What was rejected above is Colyseus's *prediction*: replaying local input and extrapolating past the last known server state to hide latency. That stays rejected, because a client guessing ahead of a twenty-minute tick would be inventing world state.

What has since shipped in `public/motion.js` is a different thing wearing a similar name. `ProjectionMotion` interpolates **between two positions the server has already sent**, along the route the server itself computed, and never past the newer of the two. It refuses to run when ticks are not consecutive, when the session changed, or when the viewer asked for reduced motion. A person who walked a mile of road between two ticks really was on that road, so sliding them along it asserts less than teleporting them does.

The sentence this paragraph replaces said flatly that interpolating a wagon "would be the renderer asserting something untrue". That was too broad: it was aimed at extrapolation and caught honest tweening as well. The rule worth keeping is narrower — **the renderer may draw between two facts, and may never draw beyond the last one.**

**Kept without the dependency:** `allowReconnection` names a distinction this project does not currently make — *briefly dropped* versus *gone*. Colyseus's own implementation is worse for our purposes (a ~15-second window and a client-stored token, against our cookie plus save-lock that survives a server restart), but `HANDOFF.md` records that a backgrounded phone tab drops the stream within seconds, and the Host's `connected` count cannot presently tell that from a student leaving. **Not yet implemented.**

---

## 2. BrowserQuest — a 2012 reference, and two of its reputation's claims are false

Two things commonly said about BrowserQuest, including in the brief that commissioned this review, are wrong:

- **It does not use Redis.** Verified from `package.json`: `underscore, log, bison, websocket, websocket-server, sanitizer, memcache`. `memcache` aggregates player counts across processes. Player progress lives in browser `localStorage`; Mozilla's own announcement says so. A reconnect creates a new player with a fresh connection-scoped id. **It has no server-side persistence at all** — nothing to transplant, because it never attempted the problem.
- **Client and server do not share entity definitions.** Only `shared/js/gametypes.js`, a numeric enum, is shared. The client and server entity classes are written separately and merely use the same field names.

**Its zone system is not fog of war.** This is the load-bearing finding. The world is cut into 28×12-tile zones and an entity's visible set is its own zone plus eight neighbours — but that only throttles *unsolicited broadcasts*. Requests are ungated. Verified in `server/js/player.js`:

```js
else if(action === Types.Messages.HIT) {
    var mob = self.server.getEntityById(message[1]);
```

Any entity id the client sends is accepted; the only check is whether the entity exists. For a 2012 arcade demo with no adversarial incentive that is a reasonable trade. **A classroom laptop with devtools open is a more adversarial environment than that demo ever faced**, and our spec forbids exactly this shape.

| Idea | Verdict |
| --- | --- |
| `id` (instance) vs `kind` (content) as separate fields | **ALREADY DONE** — `entity.kind` is `person`/`animal`/`wagon` |
| **LIST → WHO**: server lists visible ids, client asks only for ids it lacks | **HOLD** — the right pattern, at the wrong time (below) |
| Per-tick batching of queued outbound messages | **ALREADY DONE** by an SSE-per-tick design |
| Connection-scoped ephemeral ids | **REJECT** — breaks reconnect and save/reload identity |
| Positional-array wire format | **REJECT** — a 50 Hz optimisation that costs the debuggability a teacher-facing tool needs |
| Client-proposed movement, coordinate-only validation | **REJECT** — the server has *no pathfinding code at all*; ours computes the path |

**Why LIST→WHO is on hold rather than rejected:** it is tick-rate independent and genuinely good, and it is not needed yet.

Visibility has since broadened — a household now sees whoever is standing where its own people are — and the per-tick payload was measured again at each step:

| | per client per tick |
| --- | --- |
| Before farm work | 1.91 KB |
| With the chore table on the tick | 6.82 KB |
| Chore catalogue moved to `/api/chores` | **3.74 KB** |
| Standing in a crowded town, seven people observed | ~6.7 KB |

The growth came from **static text**, not from observation, and the fix was the pattern this project keeps relearning: static content does not belong on a per-tick channel. Observed people cost roughly 0.4 KB each and only while you are standing with them.

So LIST→WHO stays on hold. It becomes worth building when visibility broadens again — when neighbours are visible across a distance rather than only at arm's length, or when the observed set stops turning over every time somebody walks away.

---

## 3. Widelands — the one with directly transplantable value, and it is now implemented

**A chore is data, not code.** Verified verbatim from `data/tribes/workers/barbarians/farmer/init.lua`:

```lua
plant = { "findspace=size:any radius:2 space", "walk=coords",
          "animate=plant duration:6s", "plant=attrib:seed_wheat", "return" }
```

Walk there, do a thing for a duration, produce a result, come back. No engine code per job. **This is implemented in [`sim/chores.mjs`](../sim/chores.mjs)**, where a chore is a table entry with a `steps` array and the runner is one small interpreter over it. Adding work means adding data.

**Different step-lists per person is what "different family members have different skills" means** — no separate skill system was needed.

### The negative findings were as valuable

- The barbarian lumberjack's hut declares **no `working` animation at all**. The smelting works declares one whose definition is literally `basename = "idle", -- TODO(GunChleoc): No animation yet` — twenty years into the project. **The sense of life comes from the worker visibly leaving and returning**, not from animating the building.
- Carriers have **no idle animation**; when there is nothing to carry they call `start_task_waitforcapacity()` and stand still. Even Widelands does not animate idleness. Do not spend budget on idle fidgets.

### Rejected, deliberately

| System | Why |
| --- | --- |
| The **Economy** object (connected flags, supply/demand matching, lazy split/merge with A* confirmation) | This *is* the spreadsheet the design forbids. Our households are units of consumption, not routing nodes. Reachability on a small graph is one Dijkstra run. |
| Flag capacity, road carrier slots, the road **wallet** that saves up to buy a pack animal | Its entire payoff is transport efficiency — the optimisation surface `CLAUDE_DEVELOPMENT_ROADMAP.md` §1D rules out |
| Multi-tier production chains (ore → metal → tool) | Assumes hours of play. A 45–60 minute class supports **one hop**: broken tool → town → sound tool |

---

## 4. 0 A.D. — it validates the Battle Director rather than challenging it

**0 A.D. simulates every soldier individually; there are no unit stacks.** A formation is a *separate invisible controller entity* owning a roster of member ids. Verified: `Formation.js`'s `variablesToSerialize` contains `members`, `offsets`, `memberPositions` — a roster and a slot map, never a count.

It pays that per-tick cost for one reason: a player might click any individual soldier. **Our students never click an anonymous soldier — they command one family.** So this is evidence *not to go further*: a count-plus-position aggregate with decorative sample figures is the right call, and the strongest engine in this space paying the opposite cost for a reason we do not share is the argument for it.

**Two patterns worth borrowing.**

**Derive the aggregate from something real.** Verified in `ComputeMotionParameters`:

```js
minSpeed = Math.min(minSpeed, cmpUnitMotion.GetWalkSpeed());
minSpeed *= this.GetSpeedMultiplier();
```

A formation moves at its **slowest member's** pace — capped by its worst real constituent rather than carrying an invented aggregate stat. **Verdict amended 2026-09-12: rejected for historical battles.** The timing of Gonzales is `HIST-GONZ-003` and its outcome `HIST-GONZ-004`, and neither may depend on who turned up, so a formation's pace cannot be derived from the players who joined it. What was taken instead is the other half of the pattern: the people who joined move *with* the formation (`formationMembers` and `standWithTheForce` in `sim/directors.mjs`), and the server records who took part. A fictional engagement with no fixed timing could still use the slowest-member rule.

**Membership in an aggregate must not replace individual identity.** When a unit joins a formation, 0 A.D. wraps its `UnitAI` in a `FORMATIONMEMBER` state that delegates most substates straight back to `INDIVIDUAL.*` (`"IDLE": "INDIVIDUAL.IDLE"`). The soldier keeps thinking for itself; the formation intercepts only movement orders, and on leaving falls back to `INDIVIDUAL.IDLE` cleanly.

That is the implementation shape of this project's hardest invariant — *"detailed principals and aggregate formations are distinct concepts; render samples must never become alternate copies of player characters."*

**Pathfinding: reject, unambiguously.** The hierarchical layer is a *reachability oracle* for open 2D grids; on a graph, reachability is free from a single Dijkstra run. The vertex pathfinder regenerates a visibility graph per request solely to weave between *moving units*, of which a turn-paced sim has none. Every layer amortises a cost our road graph does not have.

**Scenario scripting: borrow the layering, and note it does not solve our problem.** Campaigns are a thin JSON sequencer (`Levels`, `Requires`, `Order`) carrying **no state between levels**; forced events live in per-map trigger scripts scheduling `DoAfterDelay(ms, "method", arg)` over a freely running simulation. But 0 A.D. never faces our constraint: nothing there guarantees *a documented aggregate outcome while leaving named individual fates genuinely open*, because its scenarios are not reenacting battles with known casualties. Take the two-layer separation; there is no solution here to copy.

**Entity templates compose by merge** — a child declares `parent=` and overrides only what differs, with explicit delete and filter semantics. `HANDOFF.md` next-task 4 wants household variety instead of fifteen copies of the same four names. A JSON household template with `extends` is that, without duplicating a person record per variant. **Not yet implemented.**

---

---

## 5. ponytail — a plugin for the agent, not code for the game

[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail). MIT. 133,415 stars, ~2 MB, created 2026-06-12, last pushed 2026-09-07. **It contains no application code.** It is a set of instruction files plus three small Node lifecycle hooks that install into a coding agent — Claude Code, Codex, Copilot, Cursor and about sixteen others — and change how that agent writes code. There is nothing in it to transplant into a simulation, and the question it actually poses is whether the person building this project should run it.

**What it says.** A ladder, stopped at the first rung that holds: does this need to exist at all; is it already in the codebase; does the standard library do it; does a native platform feature cover it; does an already-installed dependency solve it; can it be one line; only then, the minimum code that works. Roughly 1,300 tokens are injected at every session start.

**Rungs 3 through 5 are already this project's hard constraint**, and not by choice: zero runtime dependencies, no build step and no bundler are a deployment requirement, because a teacher runs one `.vbs` launcher. A skill telling an agent to prefer the standard library is telling this repository something the repository already enforces.

**Two things are worth having anyway.** Rung 1 — *does this need to exist* — is the rung this codebase's own limitation list keeps proving it skipped: twenty-three unused sprites prepared for arcs that do not exist, a chore catalogue retransmitted to every student every tick. And its comment convention — mark a deliberate simplification with the ceiling it accepts and the upgrade path, `# ponytail: global lock, per-account locks if throughput matters` — is what this project already writes in prose and had no consistent marker for. It is adopted here as `ceiling:` rather than `ponytail:`, because the marker should not name a tool this repository does not run; grep for it to find every corner that was cut on purpose.

**Where it is wrong for this repository, and it is wrong in two specific places.** Its output rule says that if the explanation is longer than the code, delete the explanation. This project's `CLAUDE.md` requires the opposite: documentation, dated evidence and historical claim IDs kept current, because the deliverable includes a handoff a stranger can act on. ponytail does carve out "explanation the user explicitly asked for", which covers it — but the default cuts against the house style. And its testing rule — one runnable check, "no frameworks, no fixtures, no per-function suites unless asked" — is not this repository's standard, which is 61 `node:test` suites behind an `npm test` gate.

| Question | Finding | Verdict |
| --- | --- | --- |
| Transplantable code | None. Agent instructions plus install hooks | **N/A** |
| The `ponytail:` ceiling-and-upgrade-path comment | Names the corner a simplification cuts, and what would justify undoing it | **ADOPT the convention** |
| Rung 1, YAGNI | The rung this project's own limitation list shows it skipping | **Worth having** |
| Rungs 3–5, stdlib and no new dependencies | Already a deployment constraint here, enforced by reality rather than by prompt | **Already true** |
| "Delete the explanation" default | Contradicts this project's documentation and evidence requirements | **Overridden by `CLAUDE.md`** |
| "No frameworks, no per-function suites" | Contradicts the `npm test` gate | **Overridden by `CLAUDE.md`** |
| Installing it | A decision about the owner's tooling, not about this codebase | **Owner's call — see the caveat** |

**The caveat that matters if it is installed.** The headline is "~54% less code · ~20% cheaper · ~27% faster". The repository is unusually honest about where that comes from: twelve feature tasks, **n=4, on Haiku 4.5**, and it states plainly that a reasoning model spending thinking tokens on the ladder "can go the other way (on GPT-5.5 it does)". An earlier "80–94% less code" claim was corrected downward after [issue #126](https://github.com/DietrichGebert/ponytail/issues/126) pointed out that the baseline padded its answers with prose. **The code reduction is measured; the cost and speed savings are not established for the model this project is actually built with**, and should not be repeated as though they were.

---

## 6. OmniRoute — nothing to route, and two ideas worth taking anyway

[diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute). MIT. 63,535 stars, 591 pages of contributors, ~530 MB, created 2026-02-13, pushed daily. It is a local-first gateway presenting one OpenAI-compatible endpoint and routing to 356 upstream model providers with quota-aware fallback, token compression, circuit breakers and a dashboard.

**This game contains no LLM call anywhere**, and by design cannot: it runs offline on a classroom LAN with zero runtime dependencies. There is no request for a gateway to route. **Rejected as software, without qualification.**

**As a personal tool it is a real question, and it is the owner's to answer**, because the benefit and the cost are the same fact: routing coding work through 150-plus free provider tiers means sending source to those providers, and free tiers are commonly the ones that reserve the right to train on what they receive. Its own documentation also notes coding agents needing a V8 heap well above 1 GiB. That is a decision about data, not about architecture, and not one to make on somebody's behalf.

**Its authentication and resilience layers were read as architecture, and two things came out of them.** Both closed limitations this repository had already written down.

**A recovery credential can be derived instead of stored.** OmniRoute authenticates API keys as *HMAC-signed with CRC validation* — a key proves itself against a secret rather than being looked up in a table. Translated here: a household's family key is `HMAC-SHA256(hostKey, sessionId + ':' + householdId)`, rendered as eight Crockford base32 symbols. Nothing new is saved, so `saveVersion` did not move; the key cannot be forged without the class secret; and because `new-class` rotates `sessionId`, every key from an archived class stops working by construction rather than by a cleanup step. **A check character was considered and dropped**: verification is "does this match a derived key", so a typo and a stranger's guess already produce the same refusal, and a check symbol would only have changed the wording.

**Three layers of resilience, of which this project needed the middle one.** OmniRoute's stack is circuit breaker → connection cooldown → model lockout. A twenty-minute tick has nothing to trip a breaker, but *connection cooldown* is precisely the distinction `HANDOFF.md` recorded as missing: a backgrounded phone drops the SSE stream within seconds, and the Host's `connected` count could not tell that from a student who left. The Host now reads `here` and `away` across a ninety-second grace window. **Colyseus's `allowReconnection` named the same gap in §1 and had been on hold since**; two unrelated projects arriving at the same missing piece is what moved it off the shelf. The failed-attempt cooldown on `/api/rejoin` is the same pattern turned on guessing: five wrong keys from an address, then thirty seconds.

| Idea | Finding | Verdict |
| --- | --- | --- |
| The gateway itself | Nothing in this game calls a model | **REJECT** — no problem to solve |
| Free-tier routing as a personal tool | Real benefit, real data exposure, the owner's decision | **NOT MINE TO MAKE** |
| Derived, self-verifying credential (HMAC key auth) | Recovery with no new saved state and no migration | **IMPLEMENTED** — family keys |
| Connection cooldown, the middle resilience layer | *Away* is not *gone*; a locked phone is not a student leaving | **IMPLEMENTED** — here/away presence |
| Failed-attempt cooldown | Makes guessing a forty-bit key expensive | **IMPLEMENTED** |
| Token compression, PII masking, prompt-injection guards | Presuppose a model in the loop | **N/A** |
| Circuit breakers, model lockout | Amortise failure rates a turn-paced local server does not have | **REJECT** |

---

---

## 7. Farming and settlement games — studied for travel depth, and one of their lessons was a refusal

Read on the owner's instruction to "research farming games that are similar and include more depth",
after the complaint that characters moved too fast. The complaint turned out to be about the class
clock rather than about speed (§`docs/evidence/pace.json`), but the question underneath it — what
should travel *cost* — is one this genre has answered many times.

### What was taken

**A journey has a mode, and the mode is the trade-off.** The pattern across the genre is that the
interesting decision is not *whether* to go but *how*: fast and light, or slow and loaded. That is
now `sim/travel.mjs`. What made it adoptable here is that the three ways a colony family actually
had are naturally non-dominating — walking is free and always possible, the horse is fast and
carries nothing, the wagon is slow and carries everything — so no balance had to be invented to stop
one of them from simply winning.

**Rivalrous property as the source of pressure, rather than a resource counter.** A family has one
ox, one wagon and one horse between four people, and the thing you take is somewhere else while you
have it. This is the same shape as Widelands' single-worker-per-building constraint in §3, applied
to a family's belongings instead of its jobs, and it costs nothing to simulate: the ox is rivalrous
because it has a location, not because anything holds a lock.

**Capacity as a cap on what a trip brings home, not as an inventory.** The kill is the kill; how much
of it reaches the family is the decision made when they set out. This keeps the whole system inside
`FIC-GONZ-008`'s rule that outcomes resolve inside a visible risk — the number is on the button
before it is pressed, and the shortfall is said out loud afterwards.

### Rejected, deliberately — animal upkeep as a recurring chore

The obvious next step from "the family owns an ox" is a feeding schedule, and it is the thing to
avoid. Ostriv's animal upkeep is the most consistently complained-about part of an otherwise admired
game, and the complaint is always the same: it converts a piece of the world the player cares about
into a recurring alarm. The failure mode is general, and this project has a rule for it already —
VISION.md §3, *"Do not add complexity merely because a subsystem could be more sophisticated"*, and
§21, *prefer deeper interaction over another independent subsystem*.

The idea a feeding chore is reaching for — **that an animal is a responsibility and not a stat** —
is better delivered by the thing already built: the ox is *away from the farm while you are using
it*. That is one fact, it costs no upkeep loop, and it produces the decision a feeding schedule only
gestures at. If barns are built, they should hold the same line: a barn is a place animals are,
which makes where they are legible, not a meter that empties.

### Not taken, and why

| Idea | Verdict |
| --- | --- |
| Seasons and a crop calendar | **Refused.** The whole simulated slice is one afternoon. `RIPEN_TICKS` is already a lesson rhythm and says so. |
| Weather affecting travel and yield | **Refused for now** — VISION.md Tier 3 lists complex weather explicitly. High water at the ford is the one weather-shaped idea worth keeping in view, because it is about the river being a barrier rather than about weather as a system. |
| Stamina bars, hunger bars, needs meters | **Refused.** Exertion already exists, is measured in miles, and surfaces as a condition in words — "Thomas is tired after 23 miles on the road" — not as a bar. |
| Tool and equipment tiers | **Refused.** One hoe, sound or worn, is the whole tool model and it is enough to make a household with nobody handy go into town. |
| Buildable structures placed by the player | **Held.** It is the open question for barns and is a Tier 3 decision, not a Tier 1 one. |
| Livestock breeding, herd growth, many animal types | **Refused.** VISION.md Tier 3 names "many livestock types". |

### Access limitation

Unlike §§1–4, this section was **not written from a checkout or from source**. These are commercial
games without public source, and the verdicts above are design judgements about patterns rather than
claims about any particular implementation. The characterisation of Ostriv's animal upkeep as its
most-complained-about system comes from general familiarity with public discussion of the game and
**was not independently surveyed here**; it is recorded because it shaped a decision, and the
decision stands on VISION.md §3 and §21 regardless of whether that characterisation is exactly right.


---

## 8. Total War — three quarters of it is the thing VISION.md forbids, and two of its ideas are exactly right

Read on the owner's question: *"maybe there's some things we could use from total war that'd help us with
hunting, and battles."* The honest shape of the answer is that this is the one studied project whose
**core loop cannot be adopted at all**, and whose *peripheral* ideas are among the best taken so far.

### The central refusal: the unit is not the object of control

Total War's entire grammar is *select a unit, issue an order*. A unit is the atom; the individuals inside
it are a rendering of it. VISION.md §2 and §4 put the atom somewhere else entirely — a household, and
named people who stay recognisable — and §16 says outright: *"Do not build a general-purpose tactical war
game."* Adopting unit selection would not be a feature here; it would replace the game.

This matters beyond battles. It is the reason a hunt is *one person deciding*, and why the answer to
"should the student command the militia" is no in every form it will be asked.

### Taken: a shot costs something finite

Total War's missile troops carry ammunition and, when it runs out, have only their hands. That is the one
mechanic in the game that is about **scarcity a player must plan around rather than tactics**, and it
transplants perfectly — because here it is not an army's logistics, it is a household's shelf.

Powder and lead is now a household resource. A shot spends one; an empty house is said so on the control
before the answer is pressed; somebody deciding alone with nothing to fire comes away rather than firing.
It is bought in town for food and an afternoon, and it can be traded to a neighbour.

**It is also the material tie the owner had been reaching for between hunting and taking part.** The
volunteers at Gonzales were settlers who brought their own arms (`HIST-GONZ-020`), so the powder that goes
upriver is the powder in the family's house — the same powder a hunt spends. It changes **nothing** about
the battle, whose outcome `HIST-GONZ-004` fixes; what it changes is the family afterwards, which is the
only scale at which this game lets anything turn on a student's choice.

### Taken: a fight ends because a side stops, not because it is destroyed

Total War's most celebrated system is morale — units waver, break, rout, shatter — and the design lesson
underneath it is that **pre-modern battles ended when one side decided to stop**. That is historically
right and pedagogically valuable, and it was missing here in a small but real way: the Host's captions
narrated the phases without ever saying *why* the phase changed, which reads as a script advancing.

Taken as **explanation, not simulation**. The outcome is a documented invariant and no morale model may
touch it, so what changed is two sentences: the exchange now says neither side is destroyed and both are
deciding whether to go on, and the withdrawal says the detachment was not beaten down — it broke off.
A caption is the whole of it, and it is the right size for this idea in this game.

### Already here, and from better sources

| Total War idea | Verdict |
| --- | --- |
| Fatigue degrading what a unit can do | **Already implemented, and better integrated.** Here fatigue comes from the roads a family chose and reaches all the way to whether a hunter can make a shot. Total War's is a battlefield timer; ours is a consequence of geography. |
| Aggregate formations that resolve into individuals | **Already implemented**, taken from 0 A.D. in §4 and guarded by `tests/aggregate-identity.test.mjs`. |
| A camera that drops to ground level among the people | **Already implemented** — the map is miniature people at every zoom, per VISION.md §4. |
| Pause and speed control during a battle | **Already implemented** — the Host's Study/Brisk/Quick, which is about a lesson rather than a fight. |
| A deployment phase: choose before an uncontrollable process runs | **Already the shape of the march.** A family decides whether to go, and then it happens to them. Worth naming rather than building. |
| An after-action report | **Already specified and better** — VISION.md §20's epilogue is built from the family's own event log, not a casualty table. |

### Refused, deliberately

| Total War idea | Verdict |
| --- | --- |
| Flanking, facing, formation shape, high ground | **Refused.** This is the tactical war game §16 forbids by name. |
| Unit cards and unit selection | **Refused** — see the central refusal above. It would replace the family perspective. |
| Veterancy: units improve with use | **Still refused as written — and amended the next day, which is why the refusal is worth reading twice.** *(Original verdict, 2026-09-12: tempting, because a hunter who got steadier would make the hunt a literal tutorial; refused because skill is fixed at founding so a household without the handy member must ask a neighbour, and veterancy would let a lucky family snowball inside one lesson.)* **The owner then asked whether a family could practise shooting at home, and that turned out to be a different thing.** Veterancy is getting better at what you were already doing, free, as a reward for repetition. Practice is a decision that costs: an afternoon nobody spends planting, and two powder out of a house that holds three — the very thing the skill is for. It snowballs nothing, because the cost rises against the benefit. And it removes no pressure: the argument above is about `hands` and the hoe, and **hunting has never had anything to do with the town.** So hunting can be practised and farming and hands cannot, which is the line the original refusal was actually drawing without saying so. `FIC-GONZ-018`. |
| Battlefield line of sight as a per-soldier system | **Held, not refused.** Who sees what is already the game's central idea; applying it *within* a battle — somebody at the camp sees a different fight from somebody who stayed in town — is a real future step and belongs to the Battle Director. |
| Campaign-map empire management | **Refused.** Students guide households, not governments (VISION.md §2). |

### Access limitation

Like §7, this was **not written from source** — Total War is commercial and closed. The mechanics above
were checked against the series' own published manual and wiki material through search (the morale ladder
of *eager / steady / wavering / routing*, the distinction between **broken** and **shattered**, casualties
and fatigue and flanking as morale inputs, and missile units falling back to melee when ammunition is
spent). Those are accurate as descriptions of the games; nothing here is a claim about how they are
implemented, and no code was read.


## What was actually taken


| Idea | Source | Status |
| --- | --- | --- |
| Chores as data programs; skills as different step-lists | Widelands | **Implemented** — `sim/chores.mjs` |
| Residents with visible rounds, so a place looks inhabited | Widelands | **Implemented** — `sim/town.mjs` |
| Separate the static catalogue from the per-tick channel | (learned here, twice) | **Implemented** — `/api/map`, `/api/chores` |
| Aliveness comes from the worker's journey, not building animation | Widelands | **Implemented** — people walk out to the field and back; no idle fidgets were built |
| Aggregate membership must not replace individual identity | 0 A.D. | Already an invariant; **now covered by a test** |
| Derive an aggregate's pace from its real slowest constituent | 0 A.D. | Not implemented |
| LIST → WHO incremental visible-set sync | BrowserQuest | Hold until visibility broadens (next-task 2) |
| Template inheritance with `extends` for household variety | 0 A.D. | Hold (next-task 4) |
| An explicit reconnection grace window | Colyseus, and independently OmniRoute | **Implemented** — the Host reads `here` and `away` |
| A recovery credential derived rather than stored | OmniRoute | **Implemented** — family keys and `/api/rejoin` |
| Mark a deliberate simplification with its ceiling and upgrade path | ponytail | **Adopted** as a `ceiling:` comment — two in `server/app.mjs` |
| The gateway, the compression, the provider routing | OmniRoute | **Rejected** — nothing here calls a model |
| Interpolating between two server-known positions (never past the last) | Colyseus, narrowed | **Implemented** — `public/motion.js`; §1 corrected |
| Client-side prediction and input replay | Colyseus | **Still rejected** — a client must not guess ahead of a twenty-minute tick |
| A journey has a mode, and the mode carries the trade-off | Farming/settlement games | **Implemented** — `sim/travel.mjs` |
| Rivalrous property: the ox is somewhere, so it is scarce | Farming/settlement games, and Widelands narrowed | **Implemented** — `borrowedBy` and a real location |
| Capacity as a cap on what a trip brings home | Farming/settlement games | **Implemented** — the `produce` clamp in `sim/chores.mjs` |
| Animal upkeep as a recurring feeding chore | Ostriv | **Rejected** — "the ox is away while you use it" delivers the idea without the alarm clock |
| Seasons, weather, needs meters, equipment tiers | Farming/settlement games | **Rejected** — VISION.md Tier 3, and exertion already speaks in words |
| A shot costs something finite, and running out changes what you can do | Total War, narrowed to a household | **Implemented** — powder and lead in `sim/chores.mjs`; `HIST-GONZ-020`, `FIC-GONZ-016` |
| A fight ends because a side stops, not because it is destroyed | Total War's morale, as explanation | **Implemented** — two Host captions; never a model, because the outcome is a documented invariant |
| The unit as the object of control | Total War | **Rejected outright** — it would replace the family perspective, not extend it |
| Flanking, facing, formations, high ground | Total War | **Rejected** — VISION.md §16 forbids a general-purpose tactical war game by name |
| Veterancy: people improve with use | Total War | **Rejected** — skill is fixed at founding so a family without the handy member must ask a neighbour; veterancy would let one snowball inside a lesson |

## Access limitations

- 0 A.D.'s canonical repository moved to `gitea.wildfiregames.com` in Aug 2024; that host and the old Trac wiki are behind bot protection. Source claims come from the read-only GitHub mirror frozen at that move — the same codebase, receiving no new commits. The `RegisterTrigger` signature and the Petra AI module breakdown came through search cache only and are **not independently verified**.
- Phaser 4.x minified bundle size could not be retrieved; the commonly cited ~345 KB figure is from the older v3 line.
- Colyseus wire-byte counts are the `@colyseus/schema` README's own benchmark table, not independently reproduced.
- ponytail's stars, size, dates and licence were read from the GitHub API on 2026-09-09; its instruction text, hooks and benchmark write-ups were read from a checkout of `main`. **Its benchmark was not re-run here**, and its own README's disclosure of the GPT-5.5 reversal is why its cost and speed figures are not repeated as this project's own.
- OmniRoute was read from its README, `SECURITY.md` and the GitHub API rather than a checkout; at roughly 530 MB, cloning it to confirm architecture claims that were never going to be adopted would have been the expensive route to the same verdict. Its provider counts, compression ratios and free-token totals are **the project's own figures, unverified here**, and nothing in this repository depends on whether they are right.
