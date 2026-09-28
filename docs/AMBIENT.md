# Ambient life and chatter

## The owner's words (2026-09-28, verbatim)

> "introduce "chatter" while you're at it. i don't want to see npc just standing around when they're idle. they should
> participate in various things to make them appear active. they should talk to each other too via chat bubbles over their
> heads, very short, easy to read sentences."

Built 2026-09-28 in a worktree branch (not released). Claims `FIC-GONZ-820` to `-823` in [HISTORY.md](../HISTORY.md).

## What a class sees

- **Nobody idle stands about.** Every person a page is sent who would otherwise be drawn standing idle is drawn at something
  of the place, the hour and the weather: whittling, mending harness or clothes, shelling corn, cleaning a rifle, washing (a
  bucket beside), tending a fire or cooking (the fire and the pot at their hands), carrying water or wood a few steps back and
  forth (a woodpile at one end), feeding the hens (two hens at their feet), a pipe, sitting a while, watching the road,
  standing guard, and in town sweeping the step, carrying goods in or counting the till. At night they sit or doze; a guard
  keeps watch in camp. Two near each other keep company: talking, sitting and talking, cards, dominoes, by the fire.
- **A keeper walks over to a neighbour.** In a town, a keeper sometimes walks (at a person's pace, never sliding) to a
  neighbouring door or to a family's person standing in the street, talks, and walks home again. At most two of a town are
  away at once.
- **Camps.** The men drawn in a camp (public/army-view.js) are at the fire, the pot, the cards, the wood, a rifle, on guard; in
  Houston's camp some drill. The volunteers of 1835 and 1836 wore their own clothes, so the cast's civilian men stand among
  the riflemen. Family men halted with the 1835 force are at camp activities while it stands in a camp, never while it
  marches. A Mexican column's camp is the regulars' own poses, and silent.
- **Refuges.** Where a family is camped at a refuge in the Runaway Scrape, six unnamed people of the families from the west sit
  round a fire a little off the town - a picture of the thousands at the crossings (`HIST-TEX-070`), never a count - seen by
  the families camped there and the Host.
- **They talk.** A pair keeping company sometimes says two short lines, the second after the first has faded: never more than
  eight words or 48 characters, plain words (a syllable bound), dashed bubbles because every word is reconstructed. About
  eighty exchanges: greetings by the hour, family, home, prices, coffee, the hens, the woodpile, the rain, a norther, the fog,
  the heat, pecans and cotton in the autumn, short days in winter, planting in the spring; camp talk (beef, sore feet, the
  drill, a man's corn at home); the road east (the next river, bread, the line at the ferry, what was left behind); and war
  news.

## The rules

1. **A picture, never a cause.** Everything is recomputed inside the projection from the class seed, the tick and what the page
   may see (`sim/ambient.mjs`, called at the end of `projectWorld`). Nothing is stored: no save version moved, a saved class
   opens the same, and a world projected every tick steps exactly like one never projected (tests/ambient.test.mjs). A visit
   is drawn, not lived: the keeper's `location` stays at the door (`ceiling:`).
2. **Only the idle.** Never the student's own person (the principal stands ready for an order), never anybody with work of
   their own on any page (they are drawn at the work, however the page draws work), never a rider or a runner, anybody hurt,
   sick, taken or in a fight, called aside by a child, listening to a rider, or posed by a town's dated scene. The family's own
   small children and babies are sim/childhood.mjs's and sim/babies.mjs's. A family's people are never given the hoe's swing
   or bare sowing, which read as work a student orders.
3. **Words.** Every line is `reconstructed` (`FIC-GONZ-821`) and said by a family's person, an invented townsperson
   (`FIC-GONZ-009`), a camp's unnamed man or a refuge's unnamed crowd. **No named historical person is ever given a line.**
4. **News only as far as people could know it.** A news line is said only when the viewing family has heard the topic (the Host
   hears what the speakers could say), every speaker of a family has heard it, and a townsperson or soldier has it only once
   word could have walked from where it happened at fifteen miles a day after a quarter of a day (`FIC-GONZ-822`; never the
   Host's public reports). A rumour is said as a rumour ("They say ...") until everyone at the table has it for sure.
5. **Pacing.** A student's page is sent at most two exchanges a tick, the Host's twelve (one a place). The page lets two
   exchanges run at once and draws at most three bubbles, each held 3.8 seconds; a bubble is never drawn over another, over
   the family's own bubbles, or over a mark asking the student something, and only for a speaker on the screen. None at
   night, none while the page watches a fight or a chase, none while a rider is talking with one of the family, and none in a
   town whose dated scene is talking (Gonzales before the fight).
6. **Sight.** The activities ride on the people the page is already sent (`amb` on each), the camps' men on the armies it is
   already sent, the crowd only to the families camped there: nothing is drawn that the page could not already see.

## Where it is

| Piece | File |
| --- | --- |
| Activities, company, visits, camps, crowd, talk, knowledge, readability | `sim/ambient.mjs` |
| The hook (`view.ambient`, `amb` on people) | `sim/world.mjs` `projectWorld` |
| Walking, pacing, turning to company, props, crowd, bubbles | `public/ambient.js` |
| The pose (`ambientClip`), carry while pacing | `public/motion.js` |
| Camp men's clips and heads | `public/army-view.js` (`man`, `onMan`, `prop`) |
| Page hooks | `public/app.js` (`townGround`, the two entity loops, the crowd, the army draw, the talk after the camps) |
| `measure` for a bubble's box | `public/speech.js` |

## Evidence

- `tests/ambient.test.mjs` (14): nobody a page would draw standing idle is drawn idle (checked through `public/motion.js`
  `entityClip` itself, on every page of a played class); visits; determinism and save; no effect on the world; every line
  short and plain; no named speaker; no leak of news; rumours hedged; pacing and quiet; the family's own; the busy left at their
  work; camps; the refuge crowd; poses held by the sheets. Injections: `node scripts/ambient-injections.mjs`
  (docs/evidence/ambient-injections.json).
- `npm run test:chatter`: a farm, a town (the Host at San Felipe) and the 1835 force's siege camp, each watched 45 s through the
  join flow; injections `npm run test:chatter-injections` (docs/evidence/chatter-browser.json, chatter-injections.json).
- Measured 2026-09-28: unit injections 16 of 16 caught (15 alone), browser 6 of 6 (6 alone); map draw p95 9.0 ms at the farm,
  7.0 in town, 13.6 in camp (7.5, 7.6 and 19.9 with ambient off), against the 50 ms gate. Same computer only.

## Decisions for the owner

Built on the recommended answer of each; each is one place to change.

1. **The student's own person** stands ready and is never put to an activity. Alternatives: (b) at an activity like everybody,
   (c) at an activity only when the student has not touched them for a minute.
2. **War news in chatter**: said, only as far as people could know it (above). Alternatives: (b) no war news at all, only
   weather and daily life; (c) news only from families, never from townspeople.
3. **The crowd at refuges**: six unnamed people round a fire. Alternatives: (b) none - only the families actually there; (c) a
   larger crowd at Lynch's ferry only.
4. **Mexican camps are silent.** Alternatives: (b) short Spanish lines with an English gloss under them, as the battles have.
5. **How much talk**: at most two exchanges a tick to a student and three bubbles at once. Alternatives: (b) half as much, (c)
   twice as much.
