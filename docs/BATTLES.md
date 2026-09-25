# Battles that happen where people can see them

**Owner direction, 2026-09-25** (after watching every conflict and finding "npc's just standing around … no one worried at
gonzales that the mexicans are coming … no group of women making the come and take it flag … the battle itself never
actually takes place … no smoke from the gunfire. this is true of every conflict i've looked at"):

> go ahead, build it for every conflict. wouldn't the mexican army be in rows, but the texians in unorganized chaos?
> shouldn't there be talking, orders given, taunting etc? it's okay to make battles last longer to show the full
> experience as long as it appears correct to the player. players that have a character there should get an alert to
> watch. if they sent a character, it needs to happen in such a way that their character arrives in time to participate
> and does participate. after each battle different things will happen for each battle. sometimes it might be
> appropriate for them to come home. other times, not. build it reasonably, and interactively for the player. players
> should walk away understanding what happened.

This is the go-ahead `docs/MILITARY_EXPERIENCE.md` step 2 was waiting for. It amends that plan's order (every conflict,
not the Alamo first) and `VISION.md` §16 is the binding frame: formations, marching, musket fire, artillery, advances,
retreat, surrender, soldiers falling and wounded carried; no gore; no general-purpose tactical war game; aggregate
forces that resolve visually into miniature people; player characters individually preserved.

## 1. What was there on 2026-09-25 (the finding)

- **Gonzales** was the only drawn battle: 12 sampled figures a side, `volunteer/regular-fire-reload` played **once** per
  phase (the clip does not loop, so the line froze in the ramrod pose), one puff of smoke for about two seconds, an
  exchange of 10–19 real seconds at Study pace. Formations jumped once a tick. The Host received no live battle; the
  spotlight framed the town, not the field.
- **Every later conflict** — Concepción, the Grass Fight, the storming of Béxar, San Patricio/Agua Dulce, the Alamo,
  Coleto, the Goliad massacre, San Jacinto — resolved in one `once(...)` call inside one campaign tick (~9.5 s), as
  words, a spotlight and `rollFates`. Nothing on the map.
- **Before a battle** nobody reacted: four invented Gonzales residents on a fixed round, no alarm, no flag, no muster.
- The art library already holds march / aim / fire / load / ramrod / injured / reclining / surrender for volunteers and
  regulars, dragoons, cannon with recoil, gun crews, `musket-smoke`, `cannon-smoke`, `muzzle-flash-e/w`, `dust-*`.

## 2. Decisions taken under "build it reasonably" (the owner may overturn any of them)

Put to the owner as multiple choice on 2026-09-25 and dismissed; the owner then said "build it reasonably". These are
the choices this build makes, each recorded so it can be reversed in one place.

1. **Who watches live.** The Host's screen shows every battle live and its spotlight frames the **field**. A student sees
   a battle live when one of their family is in it, or is at a place it can be seen or heard from (the town beside it).
   Nobody else sees it until word reaches them. Fog of war and server-filtered knowledge stand.
2. **How long.** While a battle's fighting phases run, the shared clock is held to small steps so the fighting plays
   for roughly **3–6 real minutes at Study pace** (scaled for Brisk/Quick), and the build-up is paced to be seen. The
   whole class shares one clock; no household gets a private timeline. The clock never runs *faster* during a battle.
3. **Falling.** In battles where people died, soldiers fall and lie still — no blood, no gore, no graphic bodies — and
   the wounded are carried off afterwards (`VISION.md` §16 names both). This reverses the earlier drawing choice in
   `public/motion.js` that no figure is ever drawn lying down, for battles only. Gonzales had no deaths: nobody falls.
4. **Order and disorder.** Each side is drawn as it fought, per engagement, from the research — not one rule for all.
   Mexican regulars generally in drilled ranks, firing by rank on command, officers and drums/bugles; Texian volunteers
   generally loose — scattered, at their own pace, each on his own reload, using cover. Where an engagement differs
   (the Alamo's defenders on the walls, Concepción's men under a riverbank, the Béxar street fighting through houses,
   San Jacinto's line that dissolved into a rout) the engagement's own staging wins.
5. **Talk.** Speech is drawn over the speaker. Three kinds, each labelled in data: **documented** words (with a claim
   ID, only where a source records them), **reconstructed** orders and calls typical of the force (Spanish commands on
   the Mexican side with an English gloss under them; drill words; generic shouts), and **reconstructed** taunts and
   worried talk, **never attributed to a named historical person** (`HISTORY.md` on the cannon's slogan: it is "not
   authorization to invent a spoken taunt or attribute one to a specific person"). A named person speaks only words a
   source gives them. Disputed words (Travis's line, the *degüello*) are labelled as tradition or dispute where shown.
6. **Arriving in time, and taking part.** A person a family sent to a fight is there before contact and is drawn in the
   force, doing what it does (firing, loading, advancing, falling back). If a route or an offer's timing would make
   them late, the offer, the departure or the pace changes — never the historical date. Their fate (where the battle
   had casualties) resolves at a staged moment inside the fighting, visible to those watching, not all at once in a
   tick. The fixed macro-outcome of each battle never depends on who came.
7. **The alert.** A family with somebody in or at a coming fight gets a card through a person before contact — "the
   Mexicans are coming / the army moves at dawn" — with **Watch**, which frames the camera on the field. It never steals
   the camera mid-drag or mid-command, never queues on top of an open decision, and is not sent to a family with nobody
   there.
8. **Afterwards, per battle.** Each battle ends in its own aftermath scene and its own consequences — some people come
   home, some cannot. The families who had somebody there get, through a person, an account in plain words of what
   happened, what their own person did, and why the battle ended as it did, and a choice where the history offered
   one. This is what "walk away understanding what happened" is held to.

## 3. The shared contract (what every engagement is built on)

- **`sim/battle-stage.mjs`** — the one engine. An engagement is data (`sim/battles/<id>.mjs`): its site, its start
  moment on the director's `TIMELINE`, its **phases** (`alarm → approach → contact … → fallback → aftermath`, the actual
  phases and their game-minute lengths from research), each side's **style** (`ranks`, `loose`, `wall`, `bank`,
  `street`, `column`, `mounted`, `rout`), each side's count (as documented; a drawn sample when it is large), the fire
  each phase carries, the lines spoken in each phase, the moments casualties fall, and the aftermath. State lives in
  `world.battles[id]` and is **recomputed from the clock where it can be** (as `moveFormations` re-anchors), so a save
  opens where the fight is; an old save with no `world.battles` defaults it empty — **no `saveVersion` bump**.
- **Pacing** goes through `sim/military-pacing.mjs` (`militaryMinutes`), not a new clock.
- **Projection** follows §2.1 and the existing knowledge rules; a household's view carries only what its people there
  could see; the Host gets it live. No future phases, no hidden fates before they fall.
- **`public/battle-view.js`** — the one renderer: figures placed by style with a stable per-figure seed; each figure on
  its own looping cycle (aim, fire, load, ramrod; ranks fire together on the officer's word); muzzle flashes; smoke that
  **accumulates, lingers and drifts with the day's wind** and thins when fire stops; cannon served by a crew; figures
  moving smoothly between server positions, never jumping; speech bubbles; falling and carrying; flags where documented.
  It replaces `drawFormations` in `public/app.js`.
- **Nothing in a formation is a person.** Sampled figures are pictures of a count (`FIC-GONZ-006`); a family's own
  people are the real entities, drawn in the force at their own positions.
- Missing art is requested in `docs/ART_REQUESTS.md` and stood in with `stand-in:` per `CLAUDE.md`; deliberate
  simplifications carry `ceiling:`. New claims get IDs in `HISTORY.md` (blocks reserved below).

## 4. Claim blocks reserved for this work

| Block | For |
| --- | --- |
| `HIST-TEX-460`–`-479`, `FIC-GONZ-410`–`-419` | Gonzales: the town before the fight, the flag, the muster, the parley, the fight |
| `HIST-TEX-480`–`-489`, `FIC-GONZ-420`–`-424` | Concepción and the Grass Fight |
| `HIST-TEX-490`–`-499`, `FIC-GONZ-425`–`-429` | The storming of Béxar |
| `HIST-TEX-500`–`-509`, `FIC-GONZ-430`–`-434` | The Alamo assault (the siege's own claims stay in the `-430`–`-449` block) |
| `HIST-TEX-510`–`-529`, `FIC-GONZ-435`–`-444` | San Patricio / Agua Dulce, Coleto, Goliad, San Jacinto |
| `FIC-GONZ-445`–`-449` | The engine itself: pacing, viewers, falling, talk rules |

## 5. Build order

1. The engine and renderer, rebuilt first on Gonzales's fight (with the arrival guarantee for the upriver march).
2. In parallel: Gonzales's town before the fight (alarm, the flag, the muster at the ford, the cannon), and a staging
   sheet per later engagement from the research already in `docs/battle-research/`.
3. The later engagements on the engine, each with its aftermath.
4. Released to live after each wave.
