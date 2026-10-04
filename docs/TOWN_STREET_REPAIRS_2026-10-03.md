# Town street scenery repairs — 2026-10-03

These are interpretive scenery corrections, not new historical measurements. The town research fixes street courses, bearings, anchors, public squares and documented dimensions. Positions finer than a block were already invented (`FIC-GONZ-042`); the changes below move those fine building anchors into adjacent lots. Every building ID, keeper association, sprite and height is preserved. Surveyed street coordinates are unchanged.

Coordinates below are feet in each town’s existing research frame unless marked miles.

| Building ID | Previous anchor | Revised anchor |
| --- | --- | --- |
| sf-austin-house | 300,1600 | 300,1535 |
| sf-parker-farm | 250,1330 | 250,1390 |
| sf-alcalde-office | 1590,1600 | 1590,1535 |
| sf-butler-hotel | 1700,1930 | 1700,1830 |
| sf-perry-store | 1210,1930 | 1210,1830 |
| mat-customhouse | 1750,4250 | 1815,4250 |
| mat-committee-room | 2600,3900 | 2670,3900 |
| col-tavern | 430,900 | 480,900 |
| lib-house-2 | 2010,1180 | 2010,1100 |
| wash-house-4 | 325,75 | 280,75 |
| brz-long-boarding-house | -190,16 | -190,80 |
| brz-hotel | 300,20 | 300,90 |
| brz-printing-office | -40,300 | -40,350 |
| brz-andrews-store | 160,300 | 160,350 |
| brz-bennett-sharp-store | -330,290 | -390,355 |
| brz-manson-store | 480,290 | 480,355 |
| brz-warehouse-1 | -280,-20 | -280,-75 |
| brz-warehouse-2 | 560,-20 | 615,85 |
| brz-courthouse | 270,560 | 270,630 |
| hbg-frame-2 | 420,-640 | 490,-640 |
| nac-smithy | 100,260 | 100,200 |
| nac-palisade-3 | -332,-3 | -390,-30 |
| nac-log-4 | 1159,450 | 1140,540 |
| gol-jacal-18 | 545,573 | 515,645 |

Brazoria warehouse 2 uses the inland side of its lot to preserve the existing river clearance check.

Béxar’s ten northern plaza frontage anchors change from `plaza.y - 70` (1770) to `plaza.y - 140` (1700), retaining every x coordinate. The reconstructed north lane stays at y1780.

Gonzales’s interpretive scenery paths are in miles from the site: the store-side waypoint changes from (-.16,-.13) to (-.205,-.125); the ironworker-side waypoint changes from (.18,.05) to (.22,.05). Building anchors and IDs stay in place. The paths still intersect the central road.

Anahuac receives one faint, 10-foot interpretive terrace path through (1100,-4000), (1030,-3550), (940,-3050), (900,-2550), (800,-2000), (700,-1500). It connects the existing Turtle Bayou track to the fort path across the previously blank 2,532-foot gap. The two original path fragments stay unchanged; this connector is not asserted to be a surveyed historic course.

Refugio’s deterministic filler huts alone receive a road clearance pass. For each axis, an anchor less than 65 feet from a `REF_LINES` survey line is moved to that same side at 65 feet, rounded to an integer. Named houses and the mission remain in place. IDs, count and generation order remain stable; the survey grid and its street widths stay unchanged. This adjusts huts 1,3,5,8,9,11,14,15,17,18,19.

Validation: `node --test tests/towns.test.mjs` passes all five tests, including river clearance, town frames, art registration, and keeper-to-building associations.
