# Texas Revolution Family Simulation
## Project Constitution

This document defines the permanent identity of the project.

All development agents should read it before substantial work. If a later implementation idea conflicts with this document, preserve this document unless testing demonstrates that the principle is technically impossible or materially harms the game.

---

## 1. Core Product

Build a locally hosted multiplayer classroom simulation of the Texas Revolution of 1835–1836.

Each student guides one household living through the Revolution.

Students do not control Texas, Mexico, or entire armies.

The intended experience is:

> **A living historical miniature world in which students guide one family continuously through the Texas Revolution.**

Target classroom length: **approximately 45 minutes**

Normal player count: **11–15**

Supported range: **5–30**

There is no normal solo mode.

---

## 2. Intended Player Experience

The player should begin by thinking:

> This is my family.

Then:

> This is our home, wagon, animals, food, neighbors, and responsibilities.

History gradually changes that world.

The student receives incomplete information.

Other people react.

Pressure develops.

The student decides what the household will do.

Actual characters physically carry out that decision.

Consequences persist.

Later choices inherit earlier consequences.

At the end, fog of war is removed and students see what was actually happening while their family knew only fragments.

The desired final reaction is:

> **You should hear what happened to my family.**

---

## 3. Governing Causal Loop

Every important system should reinforce:

**HISTORY → WORLD → INFORMATION → PRESSURE → CHOICE → PHYSICAL ACTION → CONSEQUENCES → MEMORY → REVELATION**

Depth should come primarily from these systems interacting.

Do not add complexity merely because a subsystem could be more sophisticated.

---

## 4. Tier 1 — Game Identity

These define the game and should not be sacrificed casually.

### Family perspective
Students control households, not governments or armies.

### Persistent people
Important family members remain recognizable individuals throughout the game.

### Visible physical world
People, animals, wagons, couriers, refugees, soldiers, and battles should visually resolve into actual miniature people and objects rather than primarily abstract counters.

At distant scales, clustering, formation rendering, and level-of-detail are allowed for performance as long as the visual language remains human rather than symbolic.

### Continuous story
The experience is one uninterrupted family story.

Historical chapters may exist internally, but they must not feel like separate levels.

### Geography matters
Where a household lives changes what it sees, knows, experiences, and can realistically do.

### Incomplete information
The server knows the real world state.

Households know only what they could plausibly learn.

### Meaningful autonomy
Do not force students toward one approved historical answer when real people had meaningful choices.

### Physical action
Important characters should visibly travel, work, help, fight, flee, and return.

Do not teleport important characters through the world.

### Persistent consequences
Relationships, injuries, deaths, promises, resources, property, absences, and knowledge should matter later.

### Legible causality
The simulation may be complex underneath, but important outcomes should usually have an understandable causal chain.

Randomness may resolve uncertainty inside a visible risk. Do not use hidden punitive RNG to create arbitrary tragedy.

### Visible history
Major historical events and battles should visibly occur.

### Historical macro-outcomes
Major documented outcomes remain historically anchored.

Player agency exists primarily at family and community scale.

### Autonomous Host
The teacher should be able to:

1. launch the game;
2. allow students to join;
3. press Start;
4. walk away from the computer.

The Host runs the experience automatically.

### Runaway Scrape payoff
Earlier decisions about transportation, food, property, relationships, health, and preparation should matter during the Runaway Scrape.

### Revelation
The ending removes fog of war and reveals what was actually happening.

---

## 5. Development Priority Hierarchy

When time, performance, or complexity forces a decision:

### Tier 1 — Identity
Protect the principles above.

### Tier 2 — Supporting Systems
Build only enough of these to support Tier 1:

- household economy
- travel
- regional/local views
- Knowledge State
- relationships
- Historical Pressure Director
- Historical Timeline
- Inter-Chapter Resolver
- Battle Director
- Host Director
- save/reconnect
- Event Log
- balance metrics

### Tier 3 — Enrichment
These may be delayed, simplified, or removed:

- extensive personality models
- complex weather
- many livestock types
- elaborate professions
- large dialogue systems
- advanced visual effects
- many unique animations
- numerous bespoke households
- sophisticated business simulation
- cosmetic customization

Never delay Tier 1 to perfect Tier 3.

---

## 6. One World, Multiple Views

The game may use:

### Regional view
For Texas, roads, rivers, settlements, armies, refugees, couriers, and long-distance travel.

### Local views
For homes, settlements, ferries, camps, battlefields, the Alamo, Goliad, and important crossings.

These are different visual presentations of **one underlying simulation**.

Do not create separate versions of the same character for different views.

A character has one persistent identity and one true location.

---

## 7. Character Depth

Households may contain roughly 4–7 visible named people.

Not every person requires equal simulation depth.

A smaller group of principal characters may receive deeper personality, relationships, travel, danger, and memory.

Supporting family members remain named, visible, human, and consequential, but can use simpler simulation.

This distinction exists to preserve family attachment without overbuilding character AI.

---

## 8. Noncombat Life Must Matter

Do not make military service the only interesting path.

Meaningful noncombat decisions may involve:

- farming
- ranching
- trade
- transportation
- food
- medicine
- shelter
- refugees
- communication
- caring for wounded people
- running households while others are absent
- evacuation
- choosing what to abandon
- choosing routes
- maintaining community relationships

A family that sends nobody to battle should still be capable of a compelling story.

---

## 9. Student UX

The simulation may be complex internally.

The student interface should be simple.

Within roughly one minute of joining, a student should understand:

- who is in the family;
- what important people are doing;
- what important resources/property exist;
- what is happening nearby;
- how to tell someone to do something.

Prefer simple contextual verbs such as:

- Work
- Help
- Travel
- Talk
- Trade
- Rest
- Prepare
- Carry
- Shelter
- Join
- Stay
- Leave

Students should struggle with decisions, not controls.

---

## 10. Knowledge and Fog of War

Maintain a distinction between:

### World State
What is actually happening.

### Household Knowledge State
What that household plausibly knows.

Information may arrive through observation, sound, couriers, letters, travelers, refugees, committees, merchants, soldiers, neighbors, official reports, and rumors.

Information may be old, incomplete, uncertain, confirmed, or contradicted.

Students may already know historical outcomes from class. That is acceptable.

The game only restricts what the household can act upon based on what it has actually learned.

Students may verbally share information with one another. The classroom itself becomes an informal communication network.

---

## 11. Pressure Without Forced Participation

Do not use:

- patriotism meters
- public shame
- forced military quests
- repeated coercive requests
- hidden rewards for compliance

*Amended 2026-09-12:* hidden **glory** for taking part in major historical events is an owner-approved exception (§20). It rewards participation of every kind, not obedience to a request, and no director may read it to decide what to ask of a family.

Pressure should emerge from geography, local needs, family opinions, neighbors, political beliefs, relationships, danger, economics, and visible community behavior.

The Historical Pressure Director should ask:

> What pressures exist in this place right now?

not:

> Has this student participated enough?

A refusal should normally reduce repeated identical requests.

---

## 12. Story Opportunity Parity

Different families should have different experiences.

They do not need identical content.

However, every household should receive several meaningful opportunities capable of changing its remembered story.

A meaningful decision is one that materially changes at least one of:

- character location
- safety or risk
- relationship
- important resource/property
- knowledge
- historical participation
- future options
- evacuation state
- the household's remembered story

Different should mean different.

Not boring.

---

## 13. Historical Invariants and Flex Space

Maintain a clear boundary.

### Historical invariants
Major documented outcomes normal classroom play cannot overturn.

Examples include:

- Gonzales occurs
- the Alamo falls
- Fannin's force is defeated
- the Goliad Massacre occurs
- the Runaway Scrape occurs
- San Jacinto reaches its documented strategic outcome

The precise invariant list must be research-based.

### Historical flex space
Player-scale outcomes may vary:

- who participates
- fictional household travel
- supplies
- local delays
- relationships
- personal injury
- plausible evacuation routes
- property losses
- rumor timing
- fictional refugees
- fictional personal requests

Macro-history remains historical.

Micro-history becomes personal.

---

## 14. Fiction Budget and Research Standard

Fiction may fill personal-scale gaps through composite households, fictional neighbors, plausible conversations, personal requests, and small procedural incidents.

Fiction may not:

- alter documented public chronology;
- invent historical quotations;
- assign unsupported motives to real historical figures as fact;
- invent major military outcomes;
- present fictional claims as documented history.

Research should expand alongside implementation.

Before implementing a major historical arc, research that arc thoroughly.

Prefer primary sources, Texas State Library and Archives Commission, Texas General Land Office, Texas State Historical Association / Handbook of Texas, Library of Congress, National Archives, reputable military histories, museums/archives, and scholarly works.

Internally classify important claims as:

- DOCUMENTED
- STRONGLY SUPPORTED
- PLAUSIBLE RECONSTRUCTION
- DISPUTED
- FICTIONAL FOR GAMEPLAY

Do not fabricate historical quotations.

---

## 15. Representation

Research and responsibly portray the variety of people living in Texas during the period, including where relevant:

- Tejanos
- Anglo settlers
- Mexican civilians
- Mexican soldiers
- immigrants
- free Black Texans
- enslaved people
- Indigenous nations
- women
- children
- merchants
- laborers
- refugees

Do not reduce the Revolution to a simplistic Americans-versus-Mexicans narrative.

Do not represent enslaved people as resource icons, bonuses, purchasable units, or inventory.


---

## 16. Battles

Major battles should visibly occur.

Students may see formations, marching, musket fire, artillery, advances, retreat, surrender, soldiers falling, and wounded people being carried.

No gore, dismemberment, or graphic corpses.

Do not build a general-purpose tactical war game.

Large formations may be simulated in aggregate while visually resolving into miniature people.

Individually preserve player characters, important historical figures where needed, and select meaningful NPCs.

---

## 17. Continuous Story and Time Compression

Historical chapters exist only as pacing machinery.

No level-complete screens, inventory resets, relationship resets, or convenient teleportation home.

Routine life may be compressed.

Important principal-character events normally should not disappear inside a time skip.

Avoid outcomes like:

> Several weeks pass. Thomas died.

Major irreversible events such as death, capture, severe injury, or major personal loss should generally be experienced directly or clearly dramatized.

Time compression may skip routine life.

It should not skip the important parts of the student's story.

---

## 18. Host

The Host is the projected public experience.

It should automatically handle historical time, pacing, public information, camera, major battles, transitions, and debrief.

Normal teacher controls:

- Pause
- Resume
- End Game
- Settings

The teacher should not need to trigger historical events or operate a presentation dashboard.

The Host reflects public knowledge, not omniscient server truth.

When major events occur before distant households could know about them, nearby players may experience them live. Later, once news becomes public, the Host may show a brief reconstruction where educationally necessary.

Use reconstructions sparingly.

---

## 19. Learning Priorities

Regardless of household, students should leave with these understandings:

1. **Geography mattered.**
2. **Information moved slowly and unevenly.**
3. **War affected civilians far beyond battlefields.**
4. **The Revolution depended on logistics and community participation as well as soldiers.**
5. **People made decisions without knowing how events would end.**

Major mechanics should reinforce one or more of these ideas.

---

## 20. Ending

Every household receives an offline deterministic epilogue based on its actual Event Log.

The epilogue should select important causal threads rather than merely concatenate events.

Then the game removes fog of war and reveals:

- actual army movements
- major battles
- refugee movements
- player journeys
- information delays

The Host should also surface a few discussion hooks showing how different households experienced different information and pressures.

No "best patriot."

### Amendment, 2026-09-12 — money, glory and a winner

*By the owner:* "i do want money. players should have to trade or spend money. winning the game at the end will be through a combination of who has the most money, multiplied by glory. glory will be attained by participating in major historical events. glory will be a hidden stat that players don't see. it's revealed at the end of the game."

This replaces the earlier rule **"No rankings."** The game now has a winner:

- Each household's final outcome is **money × (1 + glory)**.
- **Money** is visible throughout and must be used — traded or spent.
- **Glory** is hidden from every student and from the Host until the ending. It is earned by taking part in major historical events of **every kind**, with fighting weighted above supporting. A casualty never earns extra.
- At the ending each family sees its own money, its own glory and what earned each. The Host shows every family's numbers and **names the winner**, alongside the discussion hooks above.

What still binds: no virtue labels ("best patriot", "bravest", "most loyal"), §8's rule that a family that sends nobody to battle must still have a compelling story — and must be able to win, though winning without fighting should be difficult — and §11's rules against patriotism meters and repeated requests. Full specification and gates: `docs/MONEY_AND_GLORY.md`.

---

## 21. Final Development Rule

When choosing between:

> making existing systems interact more meaningfully

and

> creating another independent sophisticated subsystem

prefer deeper interaction.

The game should become rich because geography affects information, information affects decisions, decisions affect travel, travel affects labor, labor affects resources, resources affect flight, relationships affect later assistance, and earlier choices affect later crises.

That is the game's depth.

---

## 22. North Star

A student looks at the same farm their family has lived on since the beginning.

Some people are present.

Some are absent.

The animals and wagon they cared about earlier still matter.

A family member is hundreds of miles away, visible as an actual miniature person traveling with others.

A neighbor is preparing to flee.

Another player's wagon is carrying refugees.

The projected Host has incomplete information.

Some students know more than others.

The student may know from history class that the Alamo eventually falls.

Their household still does not know what is happening there right now.

Nobody asks:

> Choose the correct historical answer.

The world changes.

The student decides.

Their characters physically act.

The consequences remain.

Later decisions inherit earlier ones.

Eventually the military conflict ends.

The family's losses, relationships, and memories remain.

Then fog of war disappears.

The student sees the complete historical picture.

The intended reaction is:

> **You should hear what happened to my family.**

Build that game.
