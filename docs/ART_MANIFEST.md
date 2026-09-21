# Complete art manifest

Generated from the shipped library: **783 usable sprites, 53 PNG atlases, 330 clips** (166 pose cycles; 4 layered rigs).

Read [ASSETS.md](ASSETS.md) for integration. The complete machine-readable inventory is [manifest.json](../public/assets/frontier-v1/manifest.json); every frame, clip, duration, anchor, direction, rig part, checksum, location kit and exclusion is indexed there. Rebuild with `npm run build:art`.

These are reusable prototype pieces, not completed later scenarios. Static buildings/props are intentional. Pending action coverage is explicit below. Open `/art-catalog.html` to play, scrub, pause and inspect every frame on different backgrounds.

Assemblies: [Béxar town](BEXAR_ASSEMBLY.md) and [complete Alamo](ALAMO_LAYOUT.md) share the same compound geometry. The machine-readable manifest includes every town building, tree, plaza, road and its Alamo transform.

## Atlas inventory

| Atlas | Frames | Size | PNG bytes |
| --- | ---: | --- | ---: |
| artillery-service | 16 | 1254 × 1254 | 1171440 |
| people-cast2-carry | 12 | 1254 × 1254 | 1294419 |
| people-cast2-care | 16 | 1254 × 1254 | 1382974 |
| people-cast2-search-trade | 16 | 1254 × 1254 | 1289372 |
| people-cast2-tasks | 16 | 1254 × 1254 | 1471967 |
| people-cast2-walk | 16 | 1254 × 1254 | 1288383 |
| people-cast2-work | 16 | 1254 × 1254 | 1279315 |
| people-cast2-idle | 16 | 1254 × 1254 | 1103935 |
| people-children-vertical | 12 | 1254 × 1254 | 1163980 |
| people-children-idle | 16 | 1254 × 1254 | 1351105 |
| people-children-walk | 12 | 1254 × 1254 | 1127437 |
| people-children-care | 12 | 1254 × 1254 | 1425070 |
| land-clearing | 16 | 1254 × 1254 | 904975 |
| house-modules | 16 | 1448 × 1086 | 1837997 |
| courier-dismount | 16 | 1254 × 1254 | 1219584 |
| courier-encounters-vertical | 16 | 1254 × 1254 | 1034014 |
| people-dialogue | 16 | 1254 × 1254 | 1237850 |
| houses-settling | 16 | 1254 × 1254 | 1507240 |
| animal-stock | 16 | 1254 × 1254 | 946031 |
| home-furnishings | 16 | 1254 × 1254 | 1795581 |
| home-interiors | 4 | 1254 × 1254 | 1850877 |
| trees-colonies-1 | 16 | 1254 × 1254 | 1626976 |
| wildlife-deer | 16 | 1254 × 1254 | 1223203 |
| courier-encounters | 16 | 1254 × 1254 | 1697901 |
| alamo-facades | 4 | 1254 × 1254 | 1715808 |
| alamo-interiors | 16 | 1254 × 1254 | 1988444 |
| joe-poses | 16 | 1254 × 1254 | 1043930 |
| people-search-trade | 16 | 1254 × 1254 | 1188777 |
| courier-mounted | 16 | 1254 × 1254 | 1299408 |
| animal-graze | 16 | 1254 × 1254 | 1596224 |
| alamo-modules | 16 | 1254 × 1254 | 1839015 |
| people-vertical | 16 | 1254 × 1254 | 1057922 |
| animal-vertical | 16 | 1254 × 1254 | 1349444 |
| military-vertical | 16 | 1254 × 1254 | 1064974 |
| people-care | 16 | 1254 × 1254 | 1344487 |
| civilians | 16 | 1254 × 1254 | 1115100 |
| people-walk | 16 | 1254 × 1254 | 1124449 |
| people-work | 16 | 1254 × 1254 | 1172863 |
| people-carry | 16 | 1254 × 1254 | 1331105 |
| people-tasks | 16 | 1254 × 1254 | 1549734 |
| animal-motion | 16 | 1254 × 1254 | 1386608 |
| military-motion | 16 | 1254 × 1254 | 1347677 |
| military-actions | 16 | 1254 × 1254 | 860321 |
| equipment | 16 | 1254 × 1254 | 1756185 |
| fortifications | 15 | 1254 × 1254 | 1961688 |
| architecture-extra | 4 | 1254 × 1254 | 1649064 |
| wagon-rig | 4 | 1254 × 1254 | 1284638 |
| nature | 16 | 1254 × 1254 | 1862182 |
| buildings | 16 | 1254 × 1254 | 1820468 |
| transport | 16 | 1254 × 1254 | 1711298 |
| military | 16 | 1226 × 1283 | 1070135 |
| household | 16 | 1254 × 1254 | 1428380 |
| effects | 16 | 1254 × 1254 | 1038676 |

## Every usable piece

| Sprite ID | Atlas | Animation clips |
| --- | --- | --- |
| volunteer-rammer-carry-1 | artillery-service | volunteer-gun-ram |
| volunteer-rammer-carry-2 | artillery-service | volunteer-gun-ram |
| volunteer-ram-1 | artillery-service | volunteer-gun-ram |
| volunteer-ram-2 | artillery-service | volunteer-gun-ram |
| volunteer-roundshot-lift | artillery-service | volunteer-gun-shot-carry |
| volunteer-roundshot-carry | artillery-service | volunteer-gun-shot-carry |
| volunteer-lanyard-pull | artillery-service | volunteer-gun-fire |
| volunteer-cover-ears | artillery-service | volunteer-gun-fire |
| regular-rammer-carry-1 | artillery-service | regular-gun-ram |
| regular-rammer-carry-2 | artillery-service | regular-gun-ram |
| regular-ram-1 | artillery-service | regular-gun-ram |
| regular-ram-2 | artillery-service | regular-gun-ram |
| regular-roundshot-lift | artillery-service | regular-gun-shot-carry |
| regular-roundshot-carry | artillery-service | regular-gun-shot-carry |
| regular-lanyard-pull | artillery-service | regular-gun-fire |
| regular-cover-ears | artillery-service | regular-gun-fire |
| rust-woman-carry-1 | people-cast2-carry | rust-woman-carry |
| rust-woman-carry-2 | people-cast2-carry | rust-woman-carry |
| rust-woman-carry-3 | people-cast2-carry | rust-woman-carry |
| indigo-carry-1 | people-cast2-carry | indigo-carry |
| indigo-carry-2 | people-cast2-carry | indigo-carry |
| indigo-carry-3 | people-cast2-carry | indigo-carry |
| ochre-carry-1 | people-cast2-carry | ochre-carry |
| ochre-carry-2 | people-cast2-carry | ochre-carry |
| ochre-carry-3 | people-cast2-carry | ochre-carry |
| blue-girl-carry-1 | people-cast2-carry | blue-girl-carry |
| blue-girl-carry-2 | people-cast2-carry | blue-girl-carry |
| blue-girl-carry-3 | people-cast2-carry | blue-girl-carry |
| rust-woman-rest-pose | people-cast2-care | rust-woman-rest |
| rust-woman-injured-pose | people-cast2-care | rust-woman-injured-rest |
| rust-woman-care-1 | people-cast2-care | rust-woman-care |
| rust-woman-care-2 | people-cast2-care | rust-woman-care |
| indigo-rest-pose | people-cast2-care | indigo-rest |
| indigo-injured-pose | people-cast2-care | indigo-injured-rest |
| indigo-care-1 | people-cast2-care | indigo-care |
| indigo-care-2 | people-cast2-care | indigo-care |
| ochre-rest-pose | people-cast2-care | ochre-rest |
| ochre-injured-pose | people-cast2-care | ochre-injured-rest |
| ochre-care-1 | people-cast2-care | ochre-care |
| ochre-care-2 | people-cast2-care | ochre-care |
| blue-girl-rest-pose | people-cast2-care | blue-girl-rest |
| blue-girl-injured-pose | people-cast2-care | blue-girl-injured-rest |
| blue-girl-care-1 | people-cast2-care | blue-girl-care |
| blue-girl-care-2 | people-cast2-care | blue-girl-care |
| rust-woman-search-1 | people-cast2-search-trade | rust-woman-search |
| rust-woman-search-2 | people-cast2-search-trade | rust-woman-search |
| rust-woman-trade-1 | people-cast2-search-trade | rust-woman-trade |
| rust-woman-trade-2 | people-cast2-search-trade | rust-woman-trade |
| indigo-search-1 | people-cast2-search-trade | indigo-search |
| indigo-search-2 | people-cast2-search-trade | indigo-search |
| indigo-trade-1 | people-cast2-search-trade | indigo-trade |
| indigo-trade-2 | people-cast2-search-trade | indigo-trade |
| ochre-search-1 | people-cast2-search-trade | ochre-search |
| ochre-search-2 | people-cast2-search-trade | ochre-search |
| ochre-trade-1 | people-cast2-search-trade | ochre-trade |
| ochre-trade-2 | people-cast2-search-trade | ochre-trade |
| blue-girl-search-1 | people-cast2-search-trade | blue-girl-search |
| blue-girl-search-2 | people-cast2-search-trade | blue-girl-search |
| blue-girl-trade-1 | people-cast2-search-trade | blue-girl-trade |
| blue-girl-trade-2 | people-cast2-search-trade | blue-girl-trade |
| rust-woman-sow-1 | people-cast2-tasks | rust-woman-sow |
| rust-woman-sow-2 | people-cast2-tasks | rust-woman-sow |
| rust-woman-repair-1 | people-cast2-tasks | rust-woman-repair |
| rust-woman-repair-2 | people-cast2-tasks | rust-woman-repair |
| indigo-sow-1 | people-cast2-tasks | indigo-sow |
| indigo-sow-2 | people-cast2-tasks | indigo-sow |
| indigo-repair-1 | people-cast2-tasks | indigo-repair |
| indigo-repair-2 | people-cast2-tasks | indigo-repair |
| ochre-sow-1 | people-cast2-tasks | ochre-sow |
| ochre-sow-2 | people-cast2-tasks | ochre-sow |
| ochre-repair-1 | people-cast2-tasks | ochre-repair |
| ochre-repair-2 | people-cast2-tasks | ochre-repair |
| blue-girl-sow-1 | people-cast2-tasks | blue-girl-sow |
| blue-girl-sow-2 | people-cast2-tasks | blue-girl-sow |
| blue-girl-repair-1 | people-cast2-tasks | blue-girl-repair |
| blue-girl-repair-2 | people-cast2-tasks | blue-girl-repair |
| rust-woman-walk-1 | people-cast2-walk | rust-woman-walk |
| rust-woman-walk-2 | people-cast2-walk | rust-woman-walk |
| rust-woman-walk-3 | people-cast2-walk | rust-woman-walk |
| rust-woman-walk-4 | people-cast2-walk | rust-woman-walk |
| indigo-walk-1 | people-cast2-walk | indigo-walk |
| indigo-walk-2 | people-cast2-walk | indigo-walk |
| indigo-walk-3 | people-cast2-walk | indigo-walk |
| indigo-walk-4 | people-cast2-walk | indigo-walk |
| ochre-walk-1 | people-cast2-walk | ochre-walk |
| ochre-walk-2 | people-cast2-walk | ochre-walk |
| ochre-walk-3 | people-cast2-walk | ochre-walk |
| ochre-walk-4 | people-cast2-walk | ochre-walk |
| blue-girl-walk-1 | people-cast2-walk | blue-girl-walk |
| blue-girl-walk-2 | people-cast2-walk | blue-girl-walk |
| blue-girl-walk-3 | people-cast2-walk | blue-girl-walk |
| blue-girl-walk-4 | people-cast2-walk | blue-girl-walk |
| rust-woman-work-1 | people-cast2-work | rust-woman-work |
| rust-woman-work-2 | people-cast2-work | rust-woman-work |
| rust-woman-work-3 | people-cast2-work | rust-woman-work |
| rust-woman-work-4 | people-cast2-work | rust-woman-work |
| indigo-work-1 | people-cast2-work | indigo-work |
| indigo-work-2 | people-cast2-work | indigo-work |
| indigo-work-3 | people-cast2-work | indigo-work |
| indigo-work-4 | people-cast2-work | indigo-work |
| ochre-work-1 | people-cast2-work | ochre-work |
| ochre-work-2 | people-cast2-work | ochre-work |
| ochre-work-3 | people-cast2-work | ochre-work |
| ochre-work-4 | people-cast2-work | ochre-work |
| blue-girl-work-1 | people-cast2-work | blue-girl-work |
| blue-girl-work-2 | people-cast2-work | blue-girl-work |
| blue-girl-work-3 | people-cast2-work | blue-girl-work |
| blue-girl-work-4 | people-cast2-work | blue-girl-work |
| rust-woman-idle-s | people-cast2-idle | rust-woman-idle-s |
| rust-woman-idle-e | people-cast2-idle | rust-woman-idle-e |
| rust-woman-idle-w | people-cast2-idle | rust-woman-idle-w |
| rust-woman-idle-n | people-cast2-idle | rust-woman-idle-n |
| indigo-idle-s | people-cast2-idle | indigo-idle-s |
| indigo-idle-e | people-cast2-idle | indigo-idle-e |
| indigo-idle-w | people-cast2-idle | indigo-idle-w |
| indigo-idle-n | people-cast2-idle | indigo-idle-n |
| ochre-idle-s | people-cast2-idle | ochre-idle-s |
| ochre-idle-e | people-cast2-idle | ochre-idle-e |
| ochre-idle-w | people-cast2-idle | ochre-idle-w |
| ochre-idle-n | people-cast2-idle | ochre-idle-n |
| blue-girl-idle-s | people-cast2-idle | blue-girl-idle-s |
| blue-girl-idle-e | people-cast2-idle | blue-girl-idle-e |
| blue-girl-idle-w | people-cast2-idle | blue-girl-idle-w |
| blue-girl-idle-n | people-cast2-idle | blue-girl-idle-n |
| girl-walk-s-1 | people-children-vertical | girl-walk-s |
| girl-walk-s-2 | people-children-vertical | girl-walk-s |
| girl-walk-n-1 | people-children-vertical | girl-walk-n |
| girl-walk-n-2 | people-children-vertical | girl-walk-n |
| boy-walk-s-1 | people-children-vertical | boy-walk-s |
| boy-walk-s-2 | people-children-vertical | boy-walk-s |
| boy-walk-n-1 | people-children-vertical | boy-walk-n |
| boy-walk-n-2 | people-children-vertical | boy-walk-n |
| smallchild-walk-s-1 | people-children-vertical | smallchild-walk-s |
| smallchild-walk-s-2 | people-children-vertical | smallchild-walk-s |
| smallchild-walk-n-1 | people-children-vertical | smallchild-walk-n |
| smallchild-walk-n-2 | people-children-vertical | smallchild-walk-n |
| girl-idle-s | people-children-idle | girl-idle-s |
| girl-idle-e | people-children-idle | girl-idle-e |
| girl-idle-w | people-children-idle | girl-idle-w |
| girl-idle-n | people-children-idle | girl-idle-n |
| boy-idle-s | people-children-idle | boy-idle-s |
| boy-idle-e | people-children-idle | boy-idle-e |
| boy-idle-w | people-children-idle | boy-idle-w |
| boy-idle-n | people-children-idle | boy-idle-n |
| smallchild-idle-s | people-children-idle | smallchild-idle-s |
| smallchild-idle-e | people-children-idle | smallchild-idle-e |
| smallchild-idle-w | people-children-idle | smallchild-idle-w |
| smallchild-idle-n | people-children-idle | smallchild-idle-n |
| infant-awake | people-children-idle | infant-idle-s |
| infant-asleep | people-children-idle | infant-rest |
| infant-idle-w | people-children-idle | infant-idle-w |
| infant-idle-e | people-children-idle | infant-idle-e |
| girl-walk-1 | people-children-walk | girl-walk |
| girl-walk-2 | people-children-walk | girl-walk |
| girl-walk-3 | people-children-walk | girl-walk |
| girl-walk-4 | people-children-walk | girl-walk |
| boy-walk-1 | people-children-walk | boy-walk |
| boy-walk-2 | people-children-walk | boy-walk |
| boy-walk-3 | people-children-walk | boy-walk |
| boy-walk-4 | people-children-walk | boy-walk |
| smallchild-walk-1 | people-children-walk | smallchild-walk |
| smallchild-walk-2 | people-children-walk | smallchild-walk |
| smallchild-walk-3 | people-children-walk | smallchild-walk |
| smallchild-walk-4 | people-children-walk | smallchild-walk |
| girl-rest-s-pose | people-children-care | girl-rest, girl-rest-s |
| girl-rest-e-pose | people-children-care | girl-rest-e |
| girl-injured-s-pose | people-children-care | girl-injured-rest, girl-injured-rest-s |
| girl-injured-e-pose | people-children-care | girl-injured-rest-e |
| boy-rest-s-pose | people-children-care | boy-rest, boy-rest-s |
| boy-rest-e-pose | people-children-care | boy-rest-e |
| boy-injured-s-pose | people-children-care | boy-injured-rest, boy-injured-rest-s |
| boy-injured-e-pose | people-children-care | boy-injured-rest-e |
| smallchild-rest-s-pose | people-children-care | smallchild-rest, smallchild-rest-s |
| smallchild-rest-e-pose | people-children-care | smallchild-rest-e |
| smallchild-injured-s-pose | people-children-care | smallchild-injured-rest, smallchild-injured-rest-s |
| smallchild-injured-e-pose | people-children-care | smallchild-injured-rest-e |
| stump-post-oak | land-clearing | State artwork; no motion required |
| stump-hollow-oak | land-clearing | State artwork; no motion required |
| stump-cottonwood | land-clearing | State artwork; no motion required |
| stump-cottonwood-small | land-clearing | State artwork; no motion required |
| survey-stake | land-clearing | State artwork; no motion required |
| survey-blazed-post | land-clearing | State artwork; no motion required |
| survey-stone-corner | land-clearing | State artwork; no motion required |
| survey-tied-stake | land-clearing | State artwork; no motion required |
| clearing-smoulder-1 | land-clearing | clearing-smoulder |
| clearing-smoulder-2 | land-clearing | clearing-smoulder |
| clearing-smoulder-3 | land-clearing | clearing-smoulder |
| clearing-smoulder-4 | land-clearing | clearing-smoulder |
| clearing-brush-green | land-clearing | State artwork; no motion required |
| clearing-brush-dry | land-clearing | State artwork; no motion required |
| clearing-ash | land-clearing | State artwork; no motion required |
| clearing-branches | land-clearing | State artwork; no motion required |
| house-round-sill | house-modules | State artwork; no motion required |
| house-round-low-walls | house-modules | State artwork; no motion required |
| house-round-full-walls | house-modules | State artwork; no motion required |
| house-round-roof-partial | house-modules | State artwork; no motion required |
| house-hewn-sill | house-modules | State artwork; no motion required |
| house-hewn-low-walls | house-modules | State artwork; no motion required |
| house-hewn-full-walls | house-modules | State artwork; no motion required |
| house-hewn-roof-finished | house-modules | State artwork; no motion required |
| house-passage-floor | house-modules | State artwork; no motion required |
| house-passage-roof | house-modules | State artwork; no motion required |
| house-porch | house-modules | State artwork; no motion required |
| house-shed-room | house-modules | State artwork; no motion required |
| house-chimney-stick-building | house-modules | State artwork; no motion required |
| house-chimney-stick | house-modules | State artwork; no motion required |
| house-chimney-stone | house-modules | State artwork; no motion required |
| house-floor-loft | house-modules | State artwork; no motion required |
| courier-dismount-1 | courier-dismount | courier-dismount |
| courier-dismount-2 | courier-dismount | courier-dismount |
| courier-dismount-3 | courier-dismount | courier-dismount |
| courier-dismount-4 | courier-dismount | courier-dismount |
| courier-remount-1 | courier-dismount | courier-remount |
| courier-remount-2 | courier-dismount | courier-remount |
| courier-remount-3 | courier-dismount | courier-remount |
| courier-remount-4 | courier-dismount | courier-remount |
| courier-onfoot-1 | courier-dismount | courier-onfoot-listen, courier-onfoot-idle |
| courier-onfoot-2 | courier-dismount | courier-onfoot-listen |
| courier-onfoot-3 | courier-dismount | courier-onfoot-speak |
| courier-onfoot-4 | courier-dismount | courier-onfoot-speak |
| courier-horse-wait-1 | courier-dismount | courier-horse-wait |
| courier-horse-wait-2 | courier-dismount | courier-horse-wait |
| courier-horse-wait-3 | courier-dismount | courier-horse-wait |
| courier-horse-wait-4 | courier-dismount | courier-horse-wait |
| mounted-courier-listen-s-1 | courier-encounters-vertical | mounted-courier-listen-s |
| mounted-courier-listen-s-2 | courier-encounters-vertical | mounted-courier-listen-s |
| mounted-courier-listen-s-3 | courier-encounters-vertical | mounted-courier-listen-s |
| mounted-courier-listen-s-4 | courier-encounters-vertical | mounted-courier-listen-s |
| mounted-courier-speak-s-1 | courier-encounters-vertical | mounted-courier-speak-s |
| mounted-courier-speak-s-2 | courier-encounters-vertical | mounted-courier-speak-s |
| mounted-courier-speak-s-3 | courier-encounters-vertical | mounted-courier-speak-s |
| mounted-courier-speak-s-4 | courier-encounters-vertical | mounted-courier-speak-s |
| mounted-courier-listen-n-1 | courier-encounters-vertical | mounted-courier-listen-n |
| mounted-courier-listen-n-2 | courier-encounters-vertical | mounted-courier-listen-n |
| mounted-courier-listen-n-3 | courier-encounters-vertical | mounted-courier-listen-n |
| mounted-courier-listen-n-4 | courier-encounters-vertical | mounted-courier-listen-n |
| mounted-courier-speak-n-1 | courier-encounters-vertical | mounted-courier-speak-n |
| mounted-courier-speak-n-2 | courier-encounters-vertical | mounted-courier-speak-n |
| mounted-courier-speak-n-3 | courier-encounters-vertical | mounted-courier-speak-n |
| mounted-courier-speak-n-4 | courier-encounters-vertical | mounted-courier-speak-n |
| rust-speak-e-1 | people-dialogue | rust-speak-e, rust-speak |
| rust-speak-e-2 | people-dialogue | rust-speak-e, rust-speak |
| rust-listen-s-pose | people-dialogue | rust-listen-s |
| rust-listen-n-pose | people-dialogue | rust-listen-n |
| teal-speak-e-1 | people-dialogue | teal-speak-e, teal-speak |
| teal-speak-e-2 | people-dialogue | teal-speak-e, teal-speak |
| teal-listen-s-pose | people-dialogue | teal-listen-s |
| teal-listen-n-pose | people-dialogue | teal-listen-n |
| elder-speak-e-1 | people-dialogue | elder-speak-e, elder-speak |
| elder-speak-e-2 | people-dialogue | elder-speak-e, elder-speak |
| elder-listen-s-pose | people-dialogue | elder-listen-s |
| elder-listen-n-pose | people-dialogue | elder-listen-n |
| blue-speak-e-1 | people-dialogue | blue-speak-e, blue-speak |
| blue-speak-e-2 | people-dialogue | blue-speak-e, blue-speak |
| blue-listen-s-pose | people-dialogue | blue-listen-s |
| blue-listen-n-pose | people-dialogue | blue-listen-n |
| house-round-log-site | houses-settling | State artwork; no motion required |
| house-round-log-walls | houses-settling | State artwork; no motion required |
| house-round-log-roofing | houses-settling | State artwork; no motion required |
| house-round-log | houses-settling | State artwork; no motion required |
| house-hewn-log-site | houses-settling | State artwork; no motion required |
| house-hewn-log-walls | houses-settling | State artwork; no motion required |
| house-hewn-log-roofing | houses-settling | State artwork; no motion required |
| house-hewn-log | houses-settling | State artwork; no motion required |
| house-dog-run-site | houses-settling | State artwork; no motion required |
| house-dog-run-walls | houses-settling | State artwork; no motion required |
| house-dog-run-roofing | houses-settling | State artwork; no motion required |
| house-dog-run | houses-settling | State artwork; no motion required |
| house-jacal-site | houses-settling | State artwork; no motion required |
| house-jacal-walls | houses-settling | State artwork; no motion required |
| house-jacal-roofing | houses-settling | State artwork; no motion required |
| house-jacal | houses-settling | State artwork; no motion required |
| cattle-longhorn-red-1 | animal-stock | cattle-longhorn-red-idle, cattle-longhorn-red-graze |
| cattle-longhorn-red-2 | animal-stock | cattle-longhorn-red-graze |
| cattle-longhorn-red-3 | animal-stock | cattle-longhorn-red-graze |
| cattle-longhorn-red-4 | animal-stock | cattle-longhorn-red-graze |
| cattle-longhorn-pied-1 | animal-stock | cattle-longhorn-pied-idle, cattle-longhorn-pied-graze |
| cattle-longhorn-pied-2 | animal-stock | cattle-longhorn-pied-graze |
| cattle-longhorn-pied-3 | animal-stock | cattle-longhorn-pied-graze |
| cattle-longhorn-pied-4 | animal-stock | cattle-longhorn-pied-graze |
| cattle-longhorn-dun-1 | animal-stock | cattle-longhorn-dun-idle, cattle-longhorn-dun-graze |
| cattle-longhorn-dun-2 | animal-stock | cattle-longhorn-dun-graze |
| cattle-longhorn-dun-3 | animal-stock | cattle-longhorn-dun-graze |
| cattle-longhorn-dun-4 | animal-stock | cattle-longhorn-dun-graze |
| hog-1 | animal-stock | hog-idle, hog-root |
| hog-2 | animal-stock | hog-root |
| hog-3 | animal-stock | hog-root |
| hog-4 | animal-stock | hog-root |
| home-table | home-furnishings | State artwork; no motion required |
| home-bench | home-furnishings | State artwork; no motion required |
| home-bedstead | home-furnishings | State artwork; no motion required |
| home-shelves | home-furnishings | State artwork; no motion required |
| home-cradle | home-furnishings | home-cradle-rock |
| home-bedding | home-furnishings | State artwork; no motion required |
| home-iron-pot | home-furnishings | State artwork; no motion required |
| home-chest | home-furnishings | home-chest-opening |
| home-spinning-wheel | home-furnishings | State artwork; no motion required |
| home-books | home-furnishings | State artwork; no motion required |
| home-mosquito-bars | home-furnishings | State artwork; no motion required |
| home-tinware | home-furnishings | State artwork; no motion required |
| home-chair-packed | home-furnishings | State artwork; no motion required |
| home-chair | home-furnishings | State artwork; no motion required |
| home-chest-open | home-furnishings | home-chest-opening |
| home-stool | home-furnishings | State artwork; no motion required |
| interior-round-log | home-interiors | State artwork; no motion required |
| interior-hewn-log | home-interiors | State artwork; no motion required |
| interior-dog-run | home-interiors | State artwork; no motion required |
| interior-jacal | home-interiors | State artwork; no motion required |
| pine-loblolly-pole | trees-colonies-1 | pine-loblolly-pole-wind |
| pine-loblolly-log | trees-colonies-1 | pine-loblolly-log-wind |
| pine-loblolly-large | trees-colonies-1 | pine-loblolly-large-wind |
| stump-pine-loblolly | trees-colonies-1 | State artwork; no motion required |
| cedar-pole | trees-colonies-1 | cedar-pole-wind |
| cedar-log | trees-colonies-1 | cedar-log-wind |
| cedar-large | trees-colonies-1 | cedar-large-wind |
| mesquite-pole | trees-colonies-1 | mesquite-pole-wind |
| mesquite-log | trees-colonies-1 | mesquite-log-wind |
| mesquite-large | trees-colonies-1 | mesquite-large-wind |
| live-oak-pole | trees-colonies-1 | live-oak-pole-wind |
| live-oak-log | trees-colonies-1 | live-oak-log-wind |
| live-oak-large | trees-colonies-1 | live-oak-large-wind |
| elm-pole | trees-colonies-1 | elm-pole-wind |
| elm-log | trees-colonies-1 | elm-log-wind |
| elm-large | trees-colonies-1 | elm-large-wind |
| deer-idle-1 | wildlife-deer | deer-idle |
| deer-idle-2 | wildlife-deer | deer-idle |
| deer-idle-3 | wildlife-deer | deer-idle |
| deer-idle-4 | wildlife-deer | deer-idle |
| deer-alert-1 | wildlife-deer | deer-alert |
| deer-alert-2 | wildlife-deer | deer-alert |
| deer-alert-3 | wildlife-deer | deer-alert |
| deer-alert-4 | wildlife-deer | deer-alert |
| deer-bound-1 | wildlife-deer | deer-bound |
| deer-bound-2 | wildlife-deer | deer-bound |
| deer-bound-3 | wildlife-deer | deer-bound |
| deer-bound-4 | wildlife-deer | deer-bound |
| deer-drink-1 | wildlife-deer | deer-drink |
| deer-drink-2 | wildlife-deer | deer-drink |
| deer-drink-3 | wildlife-deer | deer-drink |
| deer-drink-4 | wildlife-deer | deer-drink |
| mounted-courier-listen-1 | courier-encounters | mounted-courier-listen |
| mounted-courier-listen-2 | courier-encounters | mounted-courier-listen |
| mounted-courier-listen-3 | courier-encounters | mounted-courier-listen |
| mounted-courier-listen-4 | courier-encounters | mounted-courier-listen |
| mounted-courier-speak-1 | courier-encounters | mounted-courier-speak |
| mounted-courier-speak-2 | courier-encounters | mounted-courier-speak |
| mounted-courier-speak-3 | courier-encounters | mounted-courier-speak |
| mounted-courier-speak-4 | courier-encounters | mounted-courier-speak |
| mounted-courier-letter-1 | courier-encounters | mounted-courier-letter |
| mounted-courier-letter-2 | courier-encounters | mounted-courier-letter |
| mounted-courier-letter-3 | courier-encounters | mounted-courier-letter |
| mounted-courier-letter-4 | courier-encounters | mounted-courier-letter |
| mounted-courier-point-1 | courier-encounters | mounted-courier-point |
| mounted-courier-point-2 | courier-encounters | mounted-courier-point |
| mounted-courier-point-3 | courier-encounters | mounted-courier-point |
| mounted-courier-point-4 | courier-encounters | mounted-courier-point |
| alamo-church-front-1836 | alamo-facades | State artwork; no motion required |
| alamo-church-front-inside | alamo-facades | State artwork; no motion required |
| alamo-church-front-cracked | alamo-facades | State artwork; no motion required |
| alamo-church-buttress-wall | alamo-facades | State artwork; no motion required |
| alamo-cot-blanket | alamo-interiors | State artwork; no motion required |
| alamo-cot-empty | alamo-interiors | State artwork; no motion required |
| alamo-table | alamo-interiors | State artwork; no motion required |
| alamo-stool | alamo-interiors | State artwork; no motion required |
| alamo-chest-closed | alamo-interiors | alamo-chest-opening |
| alamo-chest-open | alamo-interiors | alamo-chest-opening |
| alamo-straw-pallet | alamo-interiors | State artwork; no motion required |
| alamo-crates | alamo-interiors | State artwork; no motion required |
| alamo-pot | alamo-interiors | State artwork; no motion required |
| alamo-water-jar | alamo-interiors | State artwork; no motion required |
| alamo-bucket | alamo-interiors | State artwork; no motion required |
| alamo-firewood | alamo-interiors | State artwork; no motion required |
| alamo-roof-panel | alamo-interiors | State artwork; no motion required |
| alamo-floor-limestone | alamo-interiors | State artwork; no motion required |
| alamo-floor-earth | alamo-interiors | State artwork; no motion required |
| alamo-stones | alamo-interiors | State artwork; no motion required |
| joe-walk-1 | joe-poses | joe-walk |
| joe-walk-2 | joe-poses | joe-walk |
| joe-walk-3 | joe-poses | joe-walk |
| joe-walk-4 | joe-poses | joe-walk |
| joe-walk-s-1 | joe-poses | joe-walk-s |
| joe-walk-s-2 | joe-poses | joe-walk-s |
| joe-walk-n-1 | joe-poses | joe-walk-n |
| joe-walk-n-2 | joe-poses | joe-walk-n |
| joe-hide-1 | joe-poses | joe-hide |
| joe-hide-2 | joe-poses | joe-hide, joe-emerge |
| joe-rise | joe-poses | joe-emerge |
| joe-cautious | joe-poses | joe-emerge |
| joe-idle | joe-poses | joe-idle |
| joe-speak-1 | joe-poses | joe-speak |
| joe-speak-2 | joe-poses | joe-speak |
| joe-rest-pose | joe-poses | joe-rest |
| rust-search-1 | people-search-trade | rust-search |
| rust-search-2 | people-search-trade | rust-search |
| rust-trade-1 | people-search-trade | rust-trade |
| rust-trade-2 | people-search-trade | rust-trade |
| teal-search-1 | people-search-trade | teal-search |
| teal-search-2 | people-search-trade | teal-search |
| teal-trade-1 | people-search-trade | teal-trade |
| teal-trade-2 | people-search-trade | teal-trade |
| elder-search-1 | people-search-trade | elder-search |
| elder-search-2 | people-search-trade | elder-search |
| elder-trade-1 | people-search-trade | elder-trade |
| elder-trade-2 | people-search-trade | elder-trade |
| blue-search-1 | people-search-trade | blue-search |
| blue-search-2 | people-search-trade | blue-search |
| blue-trade-1 | people-search-trade | blue-trade |
| blue-trade-2 | people-search-trade | blue-trade |
| mounted-courier-e-1 | courier-mounted | mounted-courier-e |
| mounted-courier-e-2 | courier-mounted | mounted-courier-e |
| mounted-courier-e-3 | courier-mounted | mounted-courier-e |
| mounted-courier-e-4 | courier-mounted | mounted-courier-e |
| mounted-courier-s-1 | courier-mounted | mounted-courier-s |
| mounted-courier-s-2 | courier-mounted | mounted-courier-s |
| mounted-courier-s-3 | courier-mounted | mounted-courier-s |
| mounted-courier-s-4 | courier-mounted | mounted-courier-s |
| mounted-courier-n-1 | courier-mounted | mounted-courier-n |
| mounted-courier-n-2 | courier-mounted | mounted-courier-n |
| mounted-courier-n-3 | courier-mounted | mounted-courier-n |
| mounted-courier-n-4 | courier-mounted | mounted-courier-n |
| mounted-courier-graze-1 | courier-mounted | mounted-courier-graze |
| mounted-courier-graze-2 | courier-mounted | mounted-courier-graze |
| mounted-courier-graze-3 | courier-mounted | mounted-courier-graze |
| mounted-courier-graze-4 | courier-mounted | mounted-courier-graze |
| ox-graze-1 | animal-graze | ox-graze |
| ox-graze-2 | animal-graze | ox-graze |
| ox-graze-3 | animal-graze | ox-graze |
| ox-graze-4 | animal-graze | ox-graze |
| horse-graze-1 | animal-graze | horse-graze |
| horse-graze-2 | animal-graze | horse-graze |
| horse-graze-3 | animal-graze | horse-graze |
| horse-graze-4 | animal-graze | horse-graze |
| cow-graze-1 | animal-graze | cow-graze |
| cow-graze-2 | animal-graze | cow-graze |
| cow-graze-3 | animal-graze | cow-graze |
| cow-graze-4 | animal-graze | cow-graze |
| pig-graze-1 | animal-graze | pig-graze |
| pig-graze-2 | animal-graze | pig-graze |
| pig-graze-3 | animal-graze | pig-graze |
| pig-graze-4 | animal-graze | pig-graze |
| alamo-wall-intact | alamo-modules | alamo-wall-collapse |
| alamo-wall-cracked | alamo-modules | alamo-wall-collapse |
| alamo-wall-breach | alamo-modules | alamo-wall-collapse |
| alamo-wall-rubble | alamo-modules | alamo-wall-collapse |
| alamo-wall-doorway | alamo-modules | State artwork; no motion required |
| alamo-wall-window | alamo-modules | State artwork; no motion required |
| alamo-wall-cutaway | alamo-modules | State artwork; no motion required |
| alamo-wall-corner | alamo-modules | State artwork; no motion required |
| alamo-door-closed | alamo-modules | alamo-door-opening |
| alamo-door-open | alamo-modules | alamo-door-opening |
| alamo-palisade | alamo-modules | State artwork; no motion required |
| alamo-palisade-broken | alamo-modules | State artwork; no motion required |
| alamo-earth-ramp | alamo-modules | State artwork; no motion required |
| alamo-stairs | alamo-modules | State artwork; no motion required |
| alamo-beam | alamo-modules | State artwork; no motion required |
| alamo-buttress | alamo-modules | State artwork; no motion required |
| rust-walk-s-1 | people-vertical | rust-walk-s |
| rust-walk-s-2 | people-vertical | rust-walk-s |
| rust-walk-n-1 | people-vertical | rust-walk-n |
| rust-walk-n-2 | people-vertical | rust-walk-n |
| teal-walk-s-1 | people-vertical | teal-walk-s |
| teal-walk-s-2 | people-vertical | teal-walk-s |
| teal-walk-n-1 | people-vertical | teal-walk-n |
| teal-walk-n-2 | people-vertical | teal-walk-n |
| elder-walk-s-1 | people-vertical | elder-walk-s |
| elder-walk-s-2 | people-vertical | elder-walk-s |
| elder-walk-n-1 | people-vertical | elder-walk-n |
| elder-walk-n-2 | people-vertical | elder-walk-n |
| blue-walk-s-1 | people-vertical | blue-walk-s |
| blue-walk-s-2 | people-vertical | blue-walk-s |
| blue-walk-n-1 | people-vertical | blue-walk-n |
| blue-walk-n-2 | people-vertical | blue-walk-n |
| ox-walk-s-1 | animal-vertical | ox-walk-s |
| ox-walk-s-2 | animal-vertical | ox-walk-s |
| ox-walk-n-1 | animal-vertical | ox-walk-n |
| ox-walk-n-2 | animal-vertical | ox-walk-n |
| horse-walk-s-1 | animal-vertical | horse-walk-s |
| horse-walk-s-2 | animal-vertical | horse-walk-s |
| horse-walk-n-1 | animal-vertical | horse-walk-n |
| horse-walk-n-2 | animal-vertical | horse-walk-n |
| cow-walk-s-1 | animal-vertical | cow-walk-s |
| cow-walk-s-2 | animal-vertical | cow-walk-s |
| cow-walk-n-1 | animal-vertical | cow-walk-n |
| cow-walk-n-2 | animal-vertical | cow-walk-n |
| pig-walk-s-1 | animal-vertical | pig-walk-s |
| pig-walk-s-2 | animal-vertical | pig-walk-s |
| pig-walk-n-1 | animal-vertical | pig-walk-n |
| pig-walk-n-2 | animal-vertical | pig-walk-n |
| volunteer-march-s-1 | military-vertical | volunteer-march-s |
| volunteer-march-s-2 | military-vertical | volunteer-march-s |
| volunteer-march-n-1 | military-vertical | volunteer-march-n |
| volunteer-march-n-2 | military-vertical | volunteer-march-n |
| regular-march-s-1 | military-vertical | regular-march-s |
| regular-march-s-2 | military-vertical | regular-march-s |
| regular-march-n-1 | military-vertical | regular-march-n |
| regular-march-n-2 | military-vertical | regular-march-n |
| courier-march-s-1 | military-vertical | courier-march-s |
| courier-march-s-2 | military-vertical | courier-march-s |
| courier-march-n-1 | military-vertical | courier-march-n |
| courier-march-n-2 | military-vertical | courier-march-n |
| dragoon-march-s-1 | military-vertical | dragoon-march-s |
| dragoon-march-s-2 | military-vertical | dragoon-march-s |
| dragoon-march-n-1 | military-vertical | dragoon-march-n |
| dragoon-march-n-2 | military-vertical | dragoon-march-n |
| rust-rest-pose | people-care | rust-rest |
| rust-injured-pose | people-care | rust-injured-rest |
| rust-care-1 | people-care | rust-care |
| rust-care-2 | people-care | rust-care |
| teal-rest-pose | people-care | teal-rest |
| teal-injured-pose | people-care | teal-injured-rest |
| teal-care-1 | people-care | teal-care |
| teal-care-2 | people-care | teal-care |
| elder-rest-pose | people-care | elder-rest |
| elder-injured-pose | people-care | elder-injured-rest |
| elder-care-1 | people-care | elder-care |
| elder-care-2 | people-care | elder-care |
| blue-rest-pose | people-care | blue-rest |
| blue-injured-pose | people-care | blue-injured-rest |
| blue-care-1 | people-care | blue-care |
| blue-care-2 | people-care | blue-care |
| rust-idle-s | civilians | rust-idle-s |
| rust-idle-e | civilians | rust-idle-e |
| rust-idle-w | civilians | rust-idle-w |
| rust-idle-n | civilians | rust-idle-n |
| teal-idle-s | civilians | teal-idle-s |
| teal-idle-e | civilians | teal-idle-e |
| teal-idle-w | civilians | teal-idle-w |
| teal-idle-n | civilians | teal-idle-n |
| elder-idle-s | civilians | elder-idle-s |
| elder-idle-e | civilians | elder-idle-e |
| elder-idle-w | civilians | elder-idle-w |
| elder-idle-n | civilians | elder-idle-n |
| blue-idle-s | civilians | blue-idle-s |
| blue-idle-e | civilians | blue-idle-e |
| blue-idle-w | civilians | blue-idle-w |
| blue-idle-n | civilians | blue-idle-n |
| rust-walk-1 | people-walk | rust-walk |
| rust-walk-2 | people-walk | rust-walk |
| rust-walk-3 | people-walk | rust-walk |
| rust-walk-4 | people-walk | rust-walk |
| teal-walk-1 | people-walk | teal-walk |
| teal-walk-2 | people-walk | teal-walk |
| teal-walk-3 | people-walk | teal-walk |
| teal-walk-4 | people-walk | teal-walk |
| elder-walk-1 | people-walk | elder-walk |
| elder-walk-2 | people-walk | elder-walk |
| elder-walk-3 | people-walk | elder-walk |
| elder-walk-4 | people-walk | elder-walk |
| blue-walk-1 | people-walk | blue-walk |
| blue-walk-2 | people-walk | blue-walk |
| blue-walk-3 | people-walk | blue-walk |
| blue-walk-4 | people-walk | blue-walk |
| rust-work-1 | people-work | rust-work |
| rust-work-2 | people-work | rust-work |
| rust-work-3 | people-work | rust-work |
| rust-work-4 | people-work | rust-work |
| teal-work-1 | people-work | teal-work |
| teal-work-2 | people-work | teal-work |
| teal-work-3 | people-work | teal-work |
| teal-work-4 | people-work | teal-work |
| elder-work-1 | people-work | elder-work |
| elder-work-2 | people-work | elder-work |
| elder-work-3 | people-work | elder-work |
| elder-work-4 | people-work | elder-work |
| blue-work-1 | people-work | blue-work |
| blue-work-2 | people-work | blue-work |
| blue-work-3 | people-work | blue-work |
| blue-work-4 | people-work | blue-work |
| rust-carry-1 | people-carry | rust-carry |
| rust-carry-2 | people-carry | rust-carry |
| rust-carry-3 | people-carry | rust-carry |
| rust-carry-4 | people-carry | rust-carry |
| teal-carry-1 | people-carry | teal-carry |
| teal-carry-2 | people-carry | teal-carry |
| teal-carry-3 | people-carry | teal-carry |
| teal-carry-4 | people-carry | teal-carry |
| elder-carry-1 | people-carry | elder-carry |
| elder-carry-2 | people-carry | elder-carry |
| elder-carry-3 | people-carry | elder-carry |
| elder-carry-4 | people-carry | elder-carry |
| blue-carry-1 | people-carry | blue-carry |
| blue-carry-2 | people-carry | blue-carry |
| blue-carry-3 | people-carry | blue-carry |
| blue-carry-4 | people-carry | blue-carry |
| rust-sow-1 | people-tasks | rust-sow |
| rust-sow-2 | people-tasks | rust-sow |
| rust-repair-1 | people-tasks | rust-repair |
| rust-repair-2 | people-tasks | rust-repair |
| teal-sow-1 | people-tasks | teal-sow |
| teal-sow-2 | people-tasks | teal-sow |
| teal-repair-1 | people-tasks | teal-repair |
| teal-repair-2 | people-tasks | teal-repair |
| elder-sow-1 | people-tasks | elder-sow |
| elder-sow-2 | people-tasks | elder-sow |
| elder-repair-1 | people-tasks | elder-repair |
| elder-repair-2 | people-tasks | elder-repair |
| blue-sow-1 | people-tasks | blue-sow |
| blue-sow-2 | people-tasks | blue-sow |
| blue-repair-1 | people-tasks | blue-repair |
| blue-repair-2 | people-tasks | blue-repair |
| ox-walk-1 | animal-motion | ox-walk |
| ox-walk-2 | animal-motion | ox-walk |
| ox-walk-3 | animal-motion | ox-walk |
| ox-walk-4 | animal-motion | ox-walk |
| horse-walk-1 | animal-motion | horse-walk |
| horse-walk-2 | animal-motion | horse-walk |
| horse-walk-3 | animal-motion | horse-walk |
| horse-walk-4 | animal-motion | horse-walk |
| cow-walk-1 | animal-motion | cow-walk |
| cow-walk-2 | animal-motion | cow-walk |
| cow-walk-3 | animal-motion | cow-walk |
| cow-walk-4 | animal-motion | cow-walk |
| pig-walk-1 | animal-motion | pig-walk |
| pig-walk-2 | animal-motion | pig-walk |
| pig-walk-3 | animal-motion | pig-walk |
| pig-walk-4 | animal-motion | pig-walk |
| volunteer-march-1 | military-motion | volunteer-march |
| volunteer-march-2 | military-motion | volunteer-march |
| volunteer-march-3 | military-motion | volunteer-march |
| volunteer-march-4 | military-motion | volunteer-march |
| regular-march-1 | military-motion | regular-march |
| regular-march-2 | military-motion | regular-march |
| regular-march-3 | military-motion | regular-march |
| regular-march-4 | military-motion | regular-march |
| courier-march-1 | military-motion | courier-march |
| courier-march-2 | military-motion | courier-march |
| courier-march-3 | military-motion | courier-march |
| courier-march-4 | military-motion | courier-march |
| dragoon-march-1 | military-motion | dragoon-march |
| dragoon-march-2 | military-motion | dragoon-march |
| dragoon-march-3 | military-motion | dragoon-march |
| dragoon-march-4 | military-motion | dragoon-march |
| volunteer-aim | military-actions | volunteer-fire-reload |
| volunteer-fire | military-actions | volunteer-fire-reload |
| volunteer-load | military-actions | volunteer-fire-reload |
| volunteer-ramrod | military-actions | volunteer-fire-reload |
| regular-aim | military-actions | regular-fire-reload |
| regular-fire | military-actions | regular-fire-reload |
| regular-load | military-actions | regular-fire-reload |
| regular-ramrod | military-actions | regular-fire-reload |
| volunteer-surrender-1 | military-actions | volunteer-surrender |
| volunteer-surrender-2 | military-actions | volunteer-surrender |
| volunteer-injured | military-actions | volunteer-injured-rest |
| volunteer-reclining | military-actions | State artwork; no motion required |
| regular-surrender-1 | military-actions | regular-surrender |
| regular-surrender-2 | military-actions | regular-surrender |
| regular-injured | military-actions | regular-injured-rest |
| regular-reclining | military-actions | State artwork; no motion required |
| cannon-iron-w | equipment | cannon-iron-w-recoil |
| cannon-iron-e | equipment | cannon-iron-e-recoil |
| cannon-bronze-w | equipment | cannon-bronze-w-recoil |
| cannon-bronze-e | equipment | cannon-bronze-e-recoil |
| cannon-iron-n | equipment | State artwork; no motion required |
| cannon-iron-s | equipment | State artwork; no motion required |
| limber | equipment | State artwork; no motion required |
| roundshot | equipment | State artwork; no motion required |
| barrel | equipment | State artwork; no motion required |
| crate | equipment | State artwork; no motion required |
| sacks | equipment | State artwork; no motion required |
| tools | equipment | State artwork; no motion required |
| fence-rail | equipment | State artwork; no motion required |
| fence-corner | equipment | State artwork; no motion required |
| bucket | equipment | State artwork; no motion required |
| bedroll | equipment | State artwork; no motion required |
| long-barrack | fortifications | State artwork; no motion required |
| earth-rampart | fortifications | State artwork; no motion required |
| palisade | fortifications | State artwork; no motion required |
| church-generic | fortifications | State artwork; no motion required |
| courtyard-house | fortifications | State artwork; no motion required |
| stone-tile-house | fortifications | State artwork; no motion required |
| arcade | fortifications | State artwork; no motion required |
| brick-bastion | fortifications | State artwork; no motion required |
| brick-breach | fortifications | State artwork; no motion required |
| brick-barracks-ruin | fortifications | State artwork; no motion required |
| wharf | fortifications | State artwork; no motion required |
| timber-hall | fortifications | State artwork; no motion required |
| timber-shop | fortifications | State artwork; no motion required |
| wall-breach | fortifications | State artwork; no motion required |
| log-barricade | fortifications | State artwork; no motion required |
| roofless-church-shell | architecture-extra | State artwork; no motion required |
| stone-long-barrack | architecture-extra | State artwork; no motion required |
| frame-hall | architecture-extra | State artwork; no motion required |
| brick-fort-ruin | architecture-extra | State artwork; no motion required |
| wagon-body-covered | wagon-rig | wagon-travel, wagon-idle |
| wagon-body-empty | wagon-rig | wagon-empty-travel |
| wagon-wheel | wagon-rig | wagon-travel, wagon-idle, wagon-empty-travel, wagon-loaded-travel |
| wagon-body-loaded | wagon-rig | wagon-loaded-travel |
| oak-broad | nature | oak-broad-wind |
| oak-spreading | nature | oak-spreading-wind |
| cottonwood | nature | cottonwood-wind |
| pecan | nature | pecan-wind |
| sapling | nature | sapling-wind |
| log-fallen | nature | State artwork; no motion required |
| stump | nature | State artwork; no motion required |
| rocks | nature | State artwork; no motion required |
| grass-tuft | nature | grass-tuft-wind |
| reeds | nature | reeds-wind |
| prickly-pear | nature | State artwork; no motion required |
| scrub | nature | scrub-wind |
| corn-young | nature | corn-young-wind |
| corn-mature | nature | corn-mature-wind |
| cotton-young | nature | cotton-young-wind |
| cotton-mature | nature | cotton-mature-wind |
| cabin-small | buildings | State artwork; no motion required |
| cabin-wide | buildings | State artwork; no motion required |
| shed-open | buildings | State artwork; no motion required |
| storehouse | buildings | State artwork; no motion required |
| adobe-flat | buildings | State artwork; no motion required |
| adobe-tile | buildings | State artwork; no motion required |
| trading-house | buildings | State artwork; no motion required |
| chapel | buildings | State artwork; no motion required |
| wall-straight | buildings | State artwork; no motion required |
| wall-corner | buildings | State artwork; no motion required |
| gate | buildings | State artwork; no motion required |
| barracks | buildings | State artwork; no motion required |
| tent | buildings | State artwork; no motion required |
| lean-to | buildings | State artwork; no motion required |
| cabin-weathered | buildings | State artwork; no motion required |
| cabin-ruin | buildings | State artwork; no motion required |
| ox-brown | transport | ox-brown-idle |
| ox-cream | transport | ox-cream-idle |
| horse-chestnut | transport | horse-chestnut-idle |
| horse-grey | transport | horse-grey-idle |
| cow | transport | cow-idle |
| pig | transport | pig-idle |
| sheep | transport | sheep-idle |
| chicken | transport | chicken-idle |
| wagon-empty | transport | State artwork; no motion required |
| wagon-loaded | transport | State artwork; no motion required |
| wagon-covered | transport | State artwork; no motion required |
| wagon-broken | transport | State artwork; no motion required |
| ox-cart | transport | State artwork; no motion required |
| horse-cart | transport | State artwork; no motion required |
| skiff | transport | skiff-float |
| ferry-raft | transport | ferry-float |
| volunteer-s | military | volunteer-idle-s |
| volunteer-w | military | volunteer-idle-w |
| volunteer-e | military | volunteer-idle-e |
| volunteer-n | military | volunteer-idle-n |
| regular-s | military | regular-idle-s |
| regular-w | military | regular-idle-w |
| regular-e | military | regular-idle-e |
| regular-n | military | regular-idle-n |
| courier-s | military | courier-idle-s |
| courier-w | military | courier-idle-w |
| courier-e | military | courier-idle-e |
| courier-n | military | courier-idle-n |
| dragoon-s | military | dragoon-idle-s |
| dragoon-w | military | dragoon-idle-w |
| dragoon-e | military | dragoon-idle-e |
| dragoon-n | military | dragoon-idle-n |
| householder-step-e-1 | household | State artwork; no motion required |
| householder-step-e-2 | household | State artwork; no motion required |
| householder-hoe | household | State artwork; no motion required |
| householder-rest | household | State artwork; no motion required |
| caregiver-step-e-1 | household | State artwork; no motion required |
| caregiver-step-e-2 | household | State artwork; no motion required |
| caregiver-basket | household | State artwork; no motion required |
| caregiver-aid | household | State artwork; no motion required |
| child-step-e | household | State artwork; no motion required |
| child-rest | household | State artwork; no motion required |
| householder-carry | household | State artwork; no motion required |
| caregiver-blanket | household | State artwork; no motion required |
| cooking-pot | household | State artwork; no motion required |
| packed-belongings | household | State artwork; no motion required |
| bandage-roll | household | State artwork; no motion required |
| ox-yoke | household | State artwork; no motion required |
| smoke-small | effects | musket-smoke |
| smoke-growing | effects | musket-smoke |
| smoke-dense | effects | cannon-smoke |
| smoke-dispersing | effects | musket-smoke, cannon-smoke |
| muzzle-flash-w | effects | State artwork; no motion required |
| muzzle-flash-e | effects | State artwork; no motion required |
| dust-small | effects | road-dust |
| dust-large | effects | road-dust |
| water-ripple | effects | water-motion |
| water-splash | effects | State artwork; no motion required |
| campfire | effects | fire-flicker |
| chimney-smoke | effects | smoke-rise |
| crop-stubble | effects | State artwork; no motion required |
| corn-dry | effects | State artwork; no motion required |
| cotton-dry | effects | State artwork; no motion required |
| fence-broken | effects | State artwork; no motion required |

## Animation families

| Clip | Method | Frames | Duration (ms) | Loop | Direction |
| --- | --- | ---: | ---: | --- | --- |
| volunteer-gun-ram | Pose cycle | 4 | 1160 | one-shot | east; west by mirroring |
| volunteer-gun-shot-carry | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| volunteer-gun-fire | Pose cycle | 2 | 1060 | one-shot | east; west by mirroring |
| regular-gun-ram | Pose cycle | 4 | 1160 | one-shot | east; west by mirroring |
| regular-gun-shot-carry | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| regular-gun-fire | Pose cycle | 2 | 1060 | one-shot | east; west by mirroring |
| rust-woman-carry | Pose cycle | 4 | 760 | yes | east; west by mirroring |
| indigo-carry | Pose cycle | 4 | 760 | yes | east; west by mirroring |
| ochre-carry | Pose cycle | 4 | 760 | yes | east; west by mirroring |
| blue-girl-carry | Pose cycle | 4 | 760 | yes | east; west by mirroring |
| rust-woman-rest | breathe | 1 | 2500 | yes | east; west by mirroring |
| rust-woman-injured-rest | breathe | 1 | 3000 | yes | east; west by mirroring |
| rust-woman-care | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| rust-woman-search | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| rust-woman-trade | Pose cycle | 2 | 1200 | yes | east; west by mirroring |
| indigo-rest | breathe | 1 | 2500 | yes | east; west by mirroring |
| indigo-injured-rest | breathe | 1 | 3000 | yes | east; west by mirroring |
| indigo-care | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| indigo-search | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| indigo-trade | Pose cycle | 2 | 1200 | yes | east; west by mirroring |
| ochre-rest | breathe | 1 | 2500 | yes | east; west by mirroring |
| ochre-injured-rest | breathe | 1 | 3000 | yes | east; west by mirroring |
| ochre-care | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| ochre-search | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| ochre-trade | Pose cycle | 2 | 1200 | yes | east; west by mirroring |
| blue-girl-rest | breathe | 1 | 2500 | yes | east; west by mirroring |
| blue-girl-injured-rest | breathe | 1 | 3000 | yes | east; west by mirroring |
| blue-girl-care | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| blue-girl-search | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| blue-girl-trade | Pose cycle | 2 | 1200 | yes | east; west by mirroring |
| rust-woman-sow | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| rust-woman-repair | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| indigo-sow | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| indigo-repair | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| ochre-sow | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| ochre-repair | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| blue-girl-sow | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| blue-girl-repair | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| rust-woman-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| indigo-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| ochre-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| blue-girl-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| rust-woman-work | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| indigo-work | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| ochre-work | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| blue-girl-work | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| rust-woman-idle-s | breathe | 1 | 2200 | yes | south |
| rust-woman-idle-w | breathe | 1 | 2200 | yes | west |
| rust-woman-idle-e | breathe | 1 | 2200 | yes | east |
| rust-woman-idle-n | breathe | 1 | 2200 | yes | north |
| indigo-idle-s | breathe | 1 | 2200 | yes | south |
| indigo-idle-w | breathe | 1 | 2200 | yes | west |
| indigo-idle-e | breathe | 1 | 2200 | yes | east |
| indigo-idle-n | breathe | 1 | 2200 | yes | north |
| ochre-idle-s | breathe | 1 | 2200 | yes | south |
| ochre-idle-w | breathe | 1 | 2200 | yes | west |
| ochre-idle-e | breathe | 1 | 2200 | yes | east |
| ochre-idle-n | breathe | 1 | 2200 | yes | north |
| blue-girl-idle-s | breathe | 1 | 2200 | yes | south |
| blue-girl-idle-w | breathe | 1 | 2200 | yes | west |
| blue-girl-idle-e | breathe | 1 | 2200 | yes | east |
| blue-girl-idle-n | breathe | 1 | 2200 | yes | north |
| girl-walk-s | Pose cycle | 2 | 460 | yes | south |
| girl-walk-n | Pose cycle | 2 | 460 | yes | north |
| boy-walk-s | Pose cycle | 2 | 460 | yes | south |
| boy-walk-n | Pose cycle | 2 | 460 | yes | north |
| smallchild-walk-s | Pose cycle | 2 | 460 | yes | south |
| smallchild-walk-n | Pose cycle | 2 | 460 | yes | north |
| girl-idle-s | breathe | 1 | 2200 | yes | south |
| girl-idle-e | breathe | 1 | 2200 | yes | east |
| girl-idle-w | breathe | 1 | 2200 | yes | west |
| girl-idle-n | breathe | 1 | 2200 | yes | north |
| girl-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| girl-rest | breathe | 1 | 2500 | yes | south |
| girl-rest-s | breathe | 1 | 2500 | yes | south |
| girl-rest-e | breathe | 1 | 2500 | yes | east; west by mirroring |
| girl-injured-rest | breathe | 1 | 3000 | yes | south |
| girl-injured-rest-s | breathe | 1 | 3000 | yes | south |
| girl-injured-rest-e | breathe | 1 | 3000 | yes | east; west by mirroring |
| boy-idle-s | breathe | 1 | 2200 | yes | south |
| boy-idle-e | breathe | 1 | 2200 | yes | east |
| boy-idle-w | breathe | 1 | 2200 | yes | west |
| boy-idle-n | breathe | 1 | 2200 | yes | north |
| boy-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| boy-rest | breathe | 1 | 2500 | yes | south |
| boy-rest-s | breathe | 1 | 2500 | yes | south |
| boy-rest-e | breathe | 1 | 2500 | yes | east; west by mirroring |
| boy-injured-rest | breathe | 1 | 3000 | yes | south |
| boy-injured-rest-s | breathe | 1 | 3000 | yes | south |
| boy-injured-rest-e | breathe | 1 | 3000 | yes | east; west by mirroring |
| smallchild-idle-s | breathe | 1 | 2200 | yes | south |
| smallchild-idle-e | breathe | 1 | 2200 | yes | east |
| smallchild-idle-w | breathe | 1 | 2200 | yes | west |
| smallchild-idle-n | breathe | 1 | 2200 | yes | north |
| smallchild-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| smallchild-rest | breathe | 1 | 2500 | yes | south |
| smallchild-rest-s | breathe | 1 | 2500 | yes | south |
| smallchild-rest-e | breathe | 1 | 2500 | yes | east; west by mirroring |
| smallchild-injured-rest | breathe | 1 | 3000 | yes | south |
| smallchild-injured-rest-s | breathe | 1 | 3000 | yes | south |
| smallchild-injured-rest-e | breathe | 1 | 3000 | yes | east; west by mirroring |
| infant-idle-s | breathe | 1 | 3000 | yes | south |
| infant-rest | breathe | 1 | 3000 | yes | south |
| infant-idle-w | breathe | 1 | 3000 | yes | west |
| infant-idle-e | breathe | 1 | 3000 | yes | east |
| clearing-smoulder | Pose cycle | 4 | 2000 | yes | stationary |
| courier-dismount | Pose cycle | 4 | 2050 | one-shot | east; west by mirroring |
| courier-remount | Pose cycle | 4 | 2050 | one-shot | east; west by mirroring |
| courier-onfoot-listen | Pose cycle | 3 | 2050 | yes | east; west by mirroring |
| courier-onfoot-speak | Pose cycle | 2 | 1350 | yes | east; west by mirroring |
| courier-onfoot-idle | breathe | 1 | 2200 | yes | east; west by mirroring |
| courier-horse-wait | Pose cycle | 4 | 3800 | yes | east; west by mirroring |
| mounted-courier-listen-s | Pose cycle | 4 | 2500 | yes | south |
| mounted-courier-speak-s | Pose cycle | 4 | 2500 | yes | south |
| mounted-courier-listen-n | Pose cycle | 4 | 2500 | yes | north |
| mounted-courier-speak-n | Pose cycle | 4 | 2500 | yes | north |
| rust-speak-e | Pose cycle | 2 | 1400 | yes | east; west by mirroring |
| rust-speak | Pose cycle | 2 | 1400 | yes | east; west by mirroring |
| rust-listen-s | breathe | 1 | 2200 | yes | south |
| rust-listen-n | breathe | 1 | 2200 | yes | north |
| teal-speak-e | Pose cycle | 2 | 1400 | yes | east; west by mirroring |
| teal-speak | Pose cycle | 2 | 1400 | yes | east; west by mirroring |
| teal-listen-s | breathe | 1 | 2200 | yes | south |
| teal-listen-n | breathe | 1 | 2200 | yes | north |
| elder-speak-e | Pose cycle | 2 | 1400 | yes | east; west by mirroring |
| elder-speak | Pose cycle | 2 | 1400 | yes | east; west by mirroring |
| elder-listen-s | breathe | 1 | 2200 | yes | south |
| elder-listen-n | breathe | 1 | 2200 | yes | north |
| blue-speak-e | Pose cycle | 2 | 1400 | yes | east; west by mirroring |
| blue-speak | Pose cycle | 2 | 1400 | yes | east; west by mirroring |
| blue-listen-s | breathe | 1 | 2200 | yes | south |
| blue-listen-n | breathe | 1 | 2200 | yes | north |
| cattle-longhorn-red-idle | breathe | 1 | 2200 | yes | east; west by mirroring |
| cattle-longhorn-red-graze | Pose cycle | 6 | 5100 | yes | east; west by mirroring |
| cattle-longhorn-pied-idle | breathe | 1 | 2200 | yes | east; west by mirroring |
| cattle-longhorn-pied-graze | Pose cycle | 6 | 5100 | yes | east; west by mirroring |
| cattle-longhorn-dun-idle | breathe | 1 | 2200 | yes | east; west by mirroring |
| cattle-longhorn-dun-graze | Pose cycle | 6 | 5100 | yes | east; west by mirroring |
| hog-idle | breathe | 1 | 2200 | yes | east; west by mirroring |
| hog-root | Pose cycle | 6 | 5100 | yes | east; west by mirroring |
| home-chest-opening | Pose cycle | 2 | 1000 | one-shot | east; west by mirroring |
| home-cradle-rock | rock | 1 | 2000 | yes | east; west by mirroring |
| pine-loblolly-pole-wind | sway | 1 | 3800 | yes | not applicable |
| pine-loblolly-log-wind | sway | 1 | 3800 | yes | not applicable |
| pine-loblolly-large-wind | sway | 1 | 3800 | yes | not applicable |
| cedar-pole-wind | sway | 1 | 3800 | yes | not applicable |
| cedar-log-wind | sway | 1 | 3800 | yes | not applicable |
| cedar-large-wind | sway | 1 | 3800 | yes | not applicable |
| mesquite-pole-wind | sway | 1 | 3800 | yes | not applicable |
| mesquite-log-wind | sway | 1 | 3800 | yes | not applicable |
| mesquite-large-wind | sway | 1 | 3800 | yes | not applicable |
| live-oak-pole-wind | sway | 1 | 3800 | yes | not applicable |
| live-oak-log-wind | sway | 1 | 3800 | yes | not applicable |
| live-oak-large-wind | sway | 1 | 3800 | yes | not applicable |
| elm-pole-wind | sway | 1 | 3800 | yes | not applicable |
| elm-log-wind | sway | 1 | 3800 | yes | not applicable |
| elm-large-wind | sway | 1 | 3800 | yes | not applicable |
| deer-idle | Pose cycle | 4 | 2800 | yes | east; west by mirroring |
| deer-alert | Pose cycle | 4 | 2600 | yes | east; west by mirroring |
| deer-bound | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| deer-drink | Pose cycle | 4 | 2800 | yes | east; west by mirroring |
| mounted-courier-listen | Pose cycle | 4 | 1600 | yes | east; west by mirroring |
| mounted-courier-speak | Pose cycle | 4 | 1600 | yes | east; west by mirroring |
| mounted-courier-letter | Pose cycle | 4 | 1600 | one-shot | east; west by mirroring |
| mounted-courier-point | Pose cycle | 4 | 1600 | one-shot | east; west by mirroring |
| joe-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| joe-walk-n | Pose cycle | 2 | 440 | yes | north |
| joe-walk-s | Pose cycle | 2 | 440 | yes | south |
| joe-hide | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| joe-emerge | Pose cycle | 3 | 1400 | one-shot | east; west by mirroring |
| joe-speak | Pose cycle | 2 | 1650 | yes | east; west by mirroring |
| joe-idle | breathe | 1 | 2400 | yes | east; west by mirroring |
| joe-rest | breathe | 1 | 2600 | yes | east; west by mirroring |
| alamo-wall-collapse | Pose cycle | 4 | 1800 | one-shot | elevation; orient with structure geometry |
| alamo-door-opening | Pose cycle | 2 | 1000 | one-shot | elevation; orient with structure geometry |
| alamo-chest-opening | Pose cycle | 2 | 1000 | one-shot | elevation; orient with structure geometry |
| rust-search | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| rust-trade | Pose cycle | 2 | 1200 | yes | east; west by mirroring |
| rust-walk-s | Pose cycle | 2 | 440 | yes | south |
| rust-walk-n | Pose cycle | 2 | 440 | yes | north |
| rust-care | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| rust-rest | breathe | 1 | 2500 | yes | east; west by mirroring |
| rust-injured-rest | breathe | 1 | 3000 | yes | east; west by mirroring |
| rust-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| rust-work | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| rust-carry | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| rust-sow | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| rust-repair | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| rust-idle-s | breathe | 1 | 2200 | yes | south |
| rust-idle-e | breathe | 1 | 2200 | yes | east |
| rust-idle-w | breathe | 1 | 2200 | yes | west |
| rust-idle-n | breathe | 1 | 2200 | yes | north |
| teal-search | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| teal-trade | Pose cycle | 2 | 1200 | yes | east; west by mirroring |
| teal-walk-s | Pose cycle | 2 | 440 | yes | south |
| teal-walk-n | Pose cycle | 2 | 440 | yes | north |
| teal-care | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| teal-rest | breathe | 1 | 2500 | yes | east; west by mirroring |
| teal-injured-rest | breathe | 1 | 3000 | yes | east; west by mirroring |
| teal-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| teal-work | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| teal-carry | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| teal-sow | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| teal-repair | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| teal-idle-s | breathe | 1 | 2200 | yes | south |
| teal-idle-e | breathe | 1 | 2200 | yes | east |
| teal-idle-w | breathe | 1 | 2200 | yes | west |
| teal-idle-n | breathe | 1 | 2200 | yes | north |
| elder-search | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| elder-trade | Pose cycle | 2 | 1200 | yes | east; west by mirroring |
| elder-walk-s | Pose cycle | 2 | 440 | yes | south |
| elder-walk-n | Pose cycle | 2 | 440 | yes | north |
| elder-care | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| elder-rest | breathe | 1 | 2500 | yes | east; west by mirroring |
| elder-injured-rest | breathe | 1 | 3000 | yes | east; west by mirroring |
| elder-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| elder-work | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| elder-carry | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| elder-sow | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| elder-repair | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| elder-idle-s | breathe | 1 | 2200 | yes | south |
| elder-idle-e | breathe | 1 | 2200 | yes | east |
| elder-idle-w | breathe | 1 | 2200 | yes | west |
| elder-idle-n | breathe | 1 | 2200 | yes | north |
| blue-search | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| blue-trade | Pose cycle | 2 | 1200 | yes | east; west by mirroring |
| blue-walk-s | Pose cycle | 2 | 440 | yes | south |
| blue-walk-n | Pose cycle | 2 | 440 | yes | north |
| blue-care | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| blue-rest | breathe | 1 | 2500 | yes | east; west by mirroring |
| blue-injured-rest | breathe | 1 | 3000 | yes | east; west by mirroring |
| blue-walk | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| blue-work | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| blue-carry | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| blue-sow | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| blue-repair | Pose cycle | 2 | 720 | yes | east; west by mirroring |
| blue-idle-s | breathe | 1 | 2200 | yes | south |
| blue-idle-e | breathe | 1 | 2200 | yes | east |
| blue-idle-w | breathe | 1 | 2200 | yes | west |
| blue-idle-n | breathe | 1 | 2200 | yes | north |
| ox-graze | Pose cycle | 4 | 3700 | yes | east; west by mirroring |
| ox-walk | Pose cycle | 4 | 840 | yes | east; west by mirroring |
| ox-walk-s | Pose cycle | 2 | 480 | yes | south |
| ox-walk-n | Pose cycle | 2 | 480 | yes | north |
| horse-graze | Pose cycle | 4 | 3700 | yes | east; west by mirroring |
| horse-walk | Pose cycle | 4 | 840 | yes | east; west by mirroring |
| horse-walk-s | Pose cycle | 2 | 480 | yes | south |
| horse-walk-n | Pose cycle | 2 | 480 | yes | north |
| cow-graze | Pose cycle | 4 | 3700 | yes | east; west by mirroring |
| cow-walk | Pose cycle | 4 | 840 | yes | east; west by mirroring |
| cow-walk-s | Pose cycle | 2 | 480 | yes | south |
| cow-walk-n | Pose cycle | 2 | 480 | yes | north |
| pig-graze | Pose cycle | 4 | 3700 | yes | east; west by mirroring |
| pig-walk | Pose cycle | 4 | 840 | yes | east; west by mirroring |
| pig-walk-s | Pose cycle | 2 | 480 | yes | south |
| pig-walk-n | Pose cycle | 2 | 480 | yes | north |
| mounted-courier-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| mounted-courier-s | Pose cycle | 4 | 920 | yes | south |
| mounted-courier-n | Pose cycle | 4 | 920 | yes | north |
| mounted-courier-graze | Pose cycle | 4 | 2800 | yes | east; west by mirroring |
| volunteer-march-s | Pose cycle | 2 | 440 | yes | south |
| volunteer-march-n | Pose cycle | 2 | 440 | yes | north |
| volunteer-march | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| volunteer-idle-s | breathe | 1 | 2400 | yes | south |
| volunteer-idle-w | breathe | 1 | 2400 | yes | west |
| volunteer-idle-e | breathe | 1 | 2400 | yes | east |
| volunteer-idle-n | breathe | 1 | 2400 | yes | north |
| regular-march-s | Pose cycle | 2 | 440 | yes | south |
| regular-march-n | Pose cycle | 2 | 440 | yes | north |
| regular-march | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| regular-idle-s | breathe | 1 | 2400 | yes | south |
| regular-idle-w | breathe | 1 | 2400 | yes | west |
| regular-idle-e | breathe | 1 | 2400 | yes | east |
| regular-idle-n | breathe | 1 | 2400 | yes | north |
| courier-march-s | Pose cycle | 2 | 440 | yes | south |
| courier-march-n | Pose cycle | 2 | 440 | yes | north |
| courier-march | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| courier-idle-s | breathe | 1 | 2400 | yes | south |
| courier-idle-w | breathe | 1 | 2400 | yes | west |
| courier-idle-e | breathe | 1 | 2400 | yes | east |
| courier-idle-n | breathe | 1 | 2400 | yes | north |
| dragoon-march-s | Pose cycle | 2 | 440 | yes | south |
| dragoon-march-n | Pose cycle | 2 | 440 | yes | north |
| dragoon-march | Pose cycle | 4 | 800 | yes | east; west by mirroring |
| dragoon-idle-s | breathe | 1 | 2400 | yes | south |
| dragoon-idle-w | breathe | 1 | 2400 | yes | west |
| dragoon-idle-e | breathe | 1 | 2400 | yes | east |
| dragoon-idle-n | breathe | 1 | 2400 | yes | north |
| volunteer-fire-reload | Pose cycle | 4 | 2470 | one-shot | east; west by mirroring |
| volunteer-surrender | Pose cycle | 2 | 1300 | one-shot | east; west by mirroring |
| volunteer-injured-rest | breathe | 1 | 2700 | yes | east; west by mirroring |
| regular-fire-reload | Pose cycle | 4 | 2470 | one-shot | east; west by mirroring |
| regular-surrender | Pose cycle | 2 | 1300 | one-shot | east; west by mirroring |
| regular-injured-rest | breathe | 1 | 2700 | yes | east; west by mirroring |
| oak-broad-wind | sway | 1 | 3800 | yes | not applicable |
| oak-spreading-wind | sway | 1 | 3800 | yes | not applicable |
| cottonwood-wind | sway | 1 | 3800 | yes | not applicable |
| pecan-wind | sway | 1 | 3800 | yes | not applicable |
| sapling-wind | sway | 1 | 3800 | yes | not applicable |
| reeds-wind | sway | 1 | 3800 | yes | not applicable |
| scrub-wind | sway | 1 | 3800 | yes | not applicable |
| grass-tuft-wind | sway | 1 | 3800 | yes | not applicable |
| corn-young-wind | sway | 1 | 3800 | yes | not applicable |
| corn-mature-wind | sway | 1 | 3800 | yes | not applicable |
| cotton-young-wind | sway | 1 | 3800 | yes | not applicable |
| cotton-mature-wind | sway | 1 | 3800 | yes | not applicable |
| ox-brown-idle | breathe | 1 | 2900 | yes | east; west by mirroring |
| ox-cream-idle | breathe | 1 | 2900 | yes | east; west by mirroring |
| horse-chestnut-idle | breathe | 1 | 2900 | yes | east; west by mirroring |
| horse-grey-idle | breathe | 1 | 2900 | yes | east; west by mirroring |
| cow-idle | breathe | 1 | 2900 | yes | east; west by mirroring |
| pig-idle | breathe | 1 | 2900 | yes | east; west by mirroring |
| sheep-idle | breathe | 1 | 2900 | yes | east; west by mirroring |
| chicken-idle | breathe | 1 | 2900 | yes | east; west by mirroring |
| wagon-travel | Layered rig | 1 | 850 | yes | west; east by mirroring |
| wagon-idle | Layered rig | 1 | 850 | yes | west; east by mirroring |
| skiff-float | rock | 1 | 3100 | yes | east; west by mirroring |
| ferry-float | rock | 1 | 3400 | yes | east; west by mirroring |
| cannon-iron-e-recoil | recoil | 1 | 900 | one-shot | east |
| cannon-iron-w-recoil | recoil | 1 | 900 | one-shot | west |
| cannon-bronze-e-recoil | recoil | 1 | 900 | one-shot | east |
| cannon-bronze-w-recoil | recoil | 1 | 900 | one-shot | west |
| musket-smoke | Pose cycle | 3 | 1140 | one-shot | not applicable |
| cannon-smoke | Pose cycle | 2 | 1300 | one-shot | east |
| road-dust | Pose cycle | 2 | 600 | one-shot | not applicable |
| water-motion | pulse | 1 | 1800 | yes | not applicable |
| fire-flicker | pulse | 1 | 500 | yes | not applicable |
| smoke-rise | drift | 1 | 2100 | yes | not applicable |
| wagon-empty-travel | Layered rig | 1 | 850 | yes | west; east by mirroring |
| wagon-loaded-travel | Layered rig | 1 | 850 | yes | west; east by mirroring |

## Further production work

- **Wagons/carts:** N/S wagon/carts, articulated hitch/yoke and crew pushing/loading. Current oblique rig translates along any route without pretending to turn in 3D.
- **People:** N/S work/dialogue action poses, turns, climbing, swimming, assisted walking/stretcher pairs, individual civilian riding/dismounting and final mounted cross-sheet registration. Dedicated mounted courier and dragoon travel already exist.
- **Families and riders:** Requested 2026-09-12 in docs/ART_REQUESTS.md: children (girl, boy, small child, an infant in a basket), a second cast (a woman in the principal rust, a second woman, a younger man, an adolescent girl), the rider dismounting, remounting and talking on foot beside a tethered horse, and N/S dialogue facings for riders and the existing cast.
- **Animals:** Cream ox/grey horse/sheep/chicken locomotion, other livestock grazing and drinking, flight and load/harness behavior. Do not substitute a different coat mid-journey.
- **Cannons and soldiers:** Limber/unlimber, elevated aim, mounted firing and remounting. Gun recoil is whole-carriage translation, not an articulated barrel rig.
- **Buildings and environment:** Continuous door/gate hinge rig, construction/repair progression, crown-only tree rig, boat rowing/poling and ferry loading. Building stillness is intentional; condition changes require simulation state.
- **Production finish:** Generated pose proportions can drift between sheets. Hand-register additional transitions and final cast/period uniform variants as the game defines them. These are prototype assets, not exact historical portraits.

## Excluded art

The first cell of `fortifications.png` depicts a later rounded facade. It has no sprite ID and is never drawn. Use `roofless-church-shell` for a schematic 1836 Alamo. The unchanged source PNG is retained for provenance.
