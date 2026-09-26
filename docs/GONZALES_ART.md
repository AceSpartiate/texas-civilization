# Gonzales town presentation

The detailed Gonzales view replaces the former handful of overlapping buildings with thirty illustrated structures: cabins of varied construction, sheds, outbuildings, the general store and ironworker's yard. Small delivery props, fences, selected trees and worn paths give the town recognizable working areas. The central commons stays open for the existing townspeople and encounters.

This is a scenic reconstruction, not a surveyed 1835 plan or a building census. `HIST-GONZ-011` describes a modest town of thirty-two structures by 1836; it does not establish this arrangement. The store and ironworking settings follow the existing fictional residents in `FIC-GONZ-009`. No church, modern monument, decorative cannon, new resident, troop formation or battle event was added.

`public/gonzales-art.js` exports stable scenery IDs and mile offsets around the existing Gonzales site. The normal renderer depth-sorts buildings and props with projected people. Its close-range treatment begins at camera scale 200; distant views retain the small town cluster. The Gonzales camera button frames the whole settlement instead of landing on an empty central close-up. Random prairie scatter and the former rectangular town tint are suppressed inside the detailed settlement; the authoritative river and travel routes are retained.

All pictures reuse the existing atlas originals. This does not add collision, change resident rounds, relocate entities, modify saves or expose hidden information. Future refinements must keep those invariants. The scene is currently specific to Gonzales, rather than changing the appearance of every town.

Verification: `scripts/gonzales-art-browser-proof.mjs` opens the real-map host, uses the Gonzales camera button, loads the art and checks page errors and phone width. Screenshots are written to `test-results/gonzales-in-game.png`; evidence is in `docs/evidence/gonzales-art-browser.json`. The full test suite is also run for this change.

## The town before the fight (2026-09-25, owner's direction)

The second paragraph above records that the scene deliberately added no cannon, no new resident, no formation and no battle event. **The owner reversed that on 2026-09-25** ("there's no one worried at gonzales that the mexicans are coming. there's no group of women making the come and take it flag"; docs/BATTLES.md §5 step 2). From the arrival of Castañeda's detachment on the far bank at noon on September 29 to the men's return with the cannon on the afternoon of October 2 the drawn town is full of people doing what the record has them doing:

- **the street**: townspeople gathered, worried, turned to the river, talking it over (the cannon lent in 1831, the soldiers across the water, the riders gone for help, whether to give it up); Ruth Crandall walks there from her round, the tavern keeper and the storekeeper turn at their doors; the women and children watch the men go on the night of October 1 and wait for word on the 2nd;
- **the crossing**: six figures for the eighteen behind a breastwork with the canoes drawn up; Joseph D. Clements reading the town's refusal across the river at four on the 30th - the one line on record; the flatboat back at the landing and the men going over with the gun on the evening of October 1;
- **the far bank**: the dragoons' camp on the rise opposite, until they ride upriver on the morning of October 1;
- **the cannon**: the ploughed ground of the peach orchard, three men digging it up on the 30th, and the gun at the blacksmith's shop (the open shed at the town's north-west corner, not the invented ironworker's yard) being fitted to cotton-wagon wheels while chain is cut for shot;
- **the flag**: women at a table at a house on the north side of the town hemming and painting it from the afternoon of the 30th, carried to the men on the evening of October 1, over the river and back;
- **the commons**: the men riding in from Bastrop and the Colorado from the night of the 29th, a rider going out with the appeal for more, the decision, and the march down to the ferry;
- **families**: one loading its wagon for the Colorado and going, one going down into the river timber to hide.

What each shows, who is named and what is reconstructed is in `sim/town-scenes.mjs`, registered as `HIST-TEX-460` to `-469` (the research, docs/battle-research/gonzales-town.md) and `FIC-GONZ-410` to `-413` (the invention). The figures are a picture of the town, never a count, and each scene's card - opened by clicking it - says so. The stand-in art (the breastwork, the canoes, the gun in the ground and on its wheels, the flag, the poses for painting, digging, forging and looking hard across the river) is listed in `docs/ART_REQUESTS.md` under *Request 2026-09-25 — Gonzales before the fight*.

Everybody in the town now walks from one place to another at a person's pace (`TownWalker`, `FIC-GONZ-413`); the invented residents used to slide between the spots of their round in one tick.

Verification: `npm run test:gonzales-town` (scripts/gonzales-town-browser-proof.mjs, evidence in `docs/evidence/gonzales-town-browser.json`), `tests/town-scenes.test.mjs`, and `scripts/gonzales-town-injections.mjs` (`docs/evidence/gonzales-town-injections.json`).
