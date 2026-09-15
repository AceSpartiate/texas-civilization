# Gonzales town presentation

The detailed Gonzales view replaces the former handful of overlapping buildings with thirty illustrated structures: cabins of varied construction, sheds, outbuildings, the general store and ironworker's yard. Small delivery props, fences, selected trees and worn paths give the town recognizable working areas. The central commons stays open for the existing townspeople and encounters.

This is a scenic reconstruction, not a surveyed 1835 plan or a building census. `HIST-GONZ-011` describes a modest town of thirty-two structures by 1836; it does not establish this arrangement. The store and ironworking settings follow the existing fictional residents in `FIC-GONZ-009`. No church, modern monument, decorative cannon, new resident, troop formation or battle event was added.

`public/gonzales-art.js` exports stable scenery IDs and mile offsets around the existing Gonzales site. The normal renderer depth-sorts buildings and props with projected people. Its close-range treatment begins at camera scale 200; distant views retain the small town cluster. The Gonzales camera button frames the whole settlement instead of landing on an empty central close-up. Random prairie scatter and the former rectangular town tint are suppressed inside the detailed settlement; the authoritative river and travel routes are retained.

All pictures reuse the existing atlas originals. This does not add collision, change resident rounds, relocate entities, modify saves or expose hidden information. Future refinements must keep those invariants. The scene is currently specific to Gonzales, rather than changing the appearance of every town.

Verification: `scripts/gonzales-art-browser-proof.mjs` opens the real-map host, uses the Gonzales camera button, loads the art and checks page errors and phone width. Screenshots are written to `test-results/gonzales-in-game.png`; evidence is in `docs/evidence/gonzales-art-browser.json`. The full test suite is also run for this change.
