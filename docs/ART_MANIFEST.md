# Complete art manifest

Generated from the shipped library: **1706 usable sprites, 165 PNG atlases, 561 clips** (333 pose cycles; 4 layered rigs).

Read [ASSETS.md](ASSETS.md) for integration. The complete machine-readable inventory is [manifest.json](../public/assets/frontier-v1/manifest.json); every frame, clip, duration, anchor, direction, rig part, checksum, location kit and exclusion is indexed there. Rebuild with `npm run build:art`.

These are reusable prototype pieces, not completed later scenarios. Static buildings/props are intentional. Pending action coverage is explicit below. Open `/art-catalog.html` to play, scrub, pause and inspect every frame on different backgrounds.

Assemblies: [Béxar town](BEXAR_ASSEMBLY.md) and [complete Alamo](ALAMO_LAYOUT.md) share the same compound geometry. The machine-readable manifest includes every town building, tree, plaza, road and its Alamo transform.

## Atlas inventory

| Atlas | Frames | Size | PNG bytes |
| --- | ---: | --- | ---: |
| alamo-face-strips | 5 | 1659 × 948 | 928904 |
| alamo-funeral-pyre | 4 | 1254 × 1254 | 1841976 |
| cannon-18pdr | 4 | 1254 × 1254 | 1234709 |
| cannon-siege-battery | 4 | 1254 × 1254 | 1750288 |
| joe-story-actions | 4 | 1254 × 1254 | 787824 |
| famous-travis-still | 1 | 1536 × 1024 | 1367838 |
| flag-red-siege | 4 | 1254 × 1254 | 1003596 |
| smoke-column-far | 4 | 1254 × 1254 | 572269 |
| alamo-scaling-ladders | 4 | 1254 × 1254 | 995871 |
| regular-ladder-climb | 4 | 1254 × 1254 | 636351 |
| artillery-service | 16 | 1254 × 1254 | 1171440 |
| white-flag-regular | 4 | 1262 × 1246 | 786638 |
| white-flag-volunteer | 4 | 1262 × 1246 | 816882 |
| regular-bugler | 4 | 1262 × 1246 | 691857 |
| biome-ground-bexar | 16 | 1254 × 1254 | 2215982 |
| biome-trees-fields | 16 | 1254 × 1254 | 1966285 |
| canister-burst | 4 | 1254 × 1254 | 822977 |
| cannon-cartwheels | 4 | 1254 × 1254 | 1420895 |
| cannon-sixpounder | 4 | 1254 × 1254 | 1284112 |
| carreta-solid-wheels | 16 | 1254 × 1254 | 1525356 |
| cart-open | 4 | 1254 × 1254 | 1049202 |
| people-cast2-carry | 12 | 1254 × 1254 | 1294419 |
| people-cast2-dialogue | 16 | 1254 × 1254 | 867662 |
| people-cast2-care | 16 | 1254 × 1254 | 1382974 |
| people-cast2-search-trade | 16 | 1254 × 1254 | 1289372 |
| people-cast2-tasks | 16 | 1254 × 1254 | 1471967 |
| people-cast2-vertical | 16 | 1254 × 1254 | 816027 |
| people-cast2-walk | 16 | 1254 × 1254 | 1288383 |
| people-cast2-work | 16 | 1254 × 1254 | 1279315 |
| people-cast2-idle | 16 | 1254 × 1254 | 1103935 |
| icons-children | 6 | 1254 × 1254 | 874710 |
| people-children-vertical | 12 | 1254 × 1254 | 1163980 |
| people-children-idle | 16 | 1254 × 1254 | 1351105 |
| people-children-walk | 12 | 1254 × 1254 | 1127437 |
| people-children-care | 12 | 1254 × 1254 | 1425070 |
| land-clearing | 16 | 1254 × 1254 | 904975 |
| coleto-baggage-cart | 4 | 1254 × 1254 | 1333345 |
| icons-family-actions-1 | 16 | 1254 × 1254 | 2324769 |
| icons-family-actions-2 | 13 | 1254 × 1254 | 1706833 |
| icons-family-service | 16 | 1254 × 1254 | 1734840 |
| icons-family-subsistence | 8 | 1774 × 887 | 2248974 |
| famous-bonham | 16 | 1254 × 1254 | 1241019 |
| famous-almeron-dickinson | 16 | 1254 × 1254 | 905031 |
| famous-seguin | 16 | 1254 × 1254 | 1147292 |
| famous-susanna-dickinson | 16 | 1254 × 1254 | 1461496 |
| famous-angelina-dickinson | 4 | 1254 × 1254 | 1286027 |
| famous-alavez | 16 | 1254 × 1254 | 1276763 |
| famous-almonte | 16 | 1254 × 1254 | 1260800 |
| famous-ben | 16 | 1312 × 1199 | 1136424 |
| twin-sisters-limbered | 4 | 1254 × 1254 | 1010968 |
| famous-milam | 16 | 1254 × 1254 | 1519856 |
| famous-fannin | 16 | 1254 × 1254 | 1306380 |
| famous-burleson | 16 | 1254 × 1254 | 1243988 |
| famous-burleson-mounted | 4 | 1254 × 1254 | 1242276 |
| famous-castaneda | 16 | 1254 × 1254 | 1167969 |
| famous-castaneda-mounted | 4 | 1226 × 1283 | 1274697 |
| famous-castrillon | 4 | 1254 × 1254 | 925993 |
| famous-castrillon-fate | 4 | 1254 × 1254 | 975586 |
| famous-cos | 16 | 1254 × 1254 | 1237092 |
| famous-cos-mounted | 4 | 1226 × 1283 | 1307008 |
| famous-crockett-fate | 4 | 1254 × 1254 | 948322 |
| famous-esparza | 16 | 1254 × 1254 | 869799 |
| famous-houston-mounted | 4 | 1254 × 1254 | 1158924 |
| famous-santa-anna-mounted | 4 | 1226 × 1283 | 1192703 |
| famous-crockett | 16 | 1254 × 1254 | 1237962 |
| famous-travis | 16 | 1254 × 1254 | 1163935 |
| famous-bowie | 16 | 1254 × 1254 | 1280882 |
| famous-emily-west | 16 | 1254 × 1254 | 1334869 |
| famous-santa-anna | 16 | 1254 × 1254 | 1194798 |
| famous-houston | 16 | 1254 × 1254 | 1300269 |
| famous-emily-west-picnic | 4 | 1254 × 1254 | 1381954 |
| famous-santa-anna-picnic | 4 | 1254 × 1254 | 1236551 |
| famous-picnic-props | 4 | 1254 × 1254 | 1557526 |
| flag-come-and-take-it | 4 | 1254 × 1254 | 1140674 |
| goliad-prisoner | 16 | 1254 × 1254 | 1028392 |
| gonzales-cannon-buried | 1 | 1536 × 1024 | 1652878 |
| gonzales-log-breastwork | 1 | 1774 × 887 | 1221292 |
| gonzales-dugout-canoe | 1 | 1536 × 1024 | 2208839 |
| gonzales-ploughed-earth | 1 | 2172 × 724 | 1766959 |
| gonzales-flag-work-cloth | 1 | 1774 × 887 | 1835338 |
| gonzales-flag-work-painted | 1 | 1774 × 887 | 1777190 |
| people-gonzales-paint | 6 | 1024 × 1536 | 1715507 |
| house-modules | 16 | 1448 × 1086 | 1837997 |
| icons-gather-stock-carreta | 8 | 1774 × 887 | 2465242 |
| people-mounted-cast1-e | 16 | 1254 × 1254 | 1086305 |
| people-mounted-cast1-s | 16 | 1254 × 1254 | 1213409 |
| people-mounted-cast1-n | 16 | 1254 × 1254 | 1283689 |
| people-mounted-cast2-e | 16 | 1254 × 1254 | 1197211 |
| people-mounted-cast2-s | 16 | 1254 × 1254 | 1115115 |
| people-mounted-cast2-n | 16 | 1254 × 1254 | 1472500 |
| wildlife-mustang | 16 | 1254 × 1254 | 1311610 |
| steamboat-steam | 4 | 1254 × 1254 | 1044017 |
| steamboat-laden | 4 | 1254 × 1254 | 1151494 |
| town-mexican-river | 1 | 1426 × 1103 | 1719481 |
| presidio-spanish | 1 | 1536 × 1024 | 2103476 |
| village-irish-colony | 1 | 1536 × 1024 | 2454172 |
| ferry-landing | 1 | 1536 × 1024 | 2091884 |
| ox-packed | 16 | 1254 × 1254 | 1531260 |
| courier-dismount | 16 | 1254 × 1254 | 1219584 |
| courier-encounters-vertical | 16 | 1254 × 1254 | 1034014 |
| people-dialogue | 16 | 1254 × 1254 | 1237850 |
| ferry-flatboat | 3 | 1254 × 1254 | 203701 |
| steamboat-moored | 4 | 1254 × 1254 | 799173 |
| famous-seguin-ashes | 4 | 1230 × 1278 | 646296 |
| alamo-ash-sites-1837 | 4 | 1536 × 1024 | 2505356 |
| seguin-funeral-props | 4 | 1536 × 1024 | 2000785 |
| san-fernando-1936 | 4 | 1536 × 1024 | 2837215 |
| houses-settling | 16 | 1254 × 1254 | 1507240 |
| animal-stock | 16 | 1254 × 1254 | 946031 |
| home-furnishings | 16 | 1254 × 1254 | 1795581 |
| home-interiors | 4 | 1254 × 1254 | 1850877 |
| shop-blacksmith | 1 | 1536 × 1024 | 2331341 |
| shop-wheelwright | 1 | 1536 × 1024 | 2401248 |
| shop-tavern | 1 | 1536 × 1024 | 2369580 |
| shop-mill | 1 | 1536 × 1024 | 1832816 |
| shop-tanner | 1 | 1536 × 1024 | 2504300 |
| shop-weaver | 1 | 1536 × 1024 | 2294523 |
| shop-carpenter | 1 | 1536 × 1024 | 2437325 |
| shop-gunsmith | 1 | 1536 × 1024 | 2035238 |
| shop-doctor | 1 | 1536 × 1024 | 2118390 |
| shop-stockman | 1 | 1536 × 1024 | 1863839 |
| town-buildings-researched | 16 | 1254 × 1254 | 2122682 |
| travel-markers | 16 | 1254 × 1254 | 1343435 |
| trees-colonies-1 | 16 | 1254 × 1254 | 1626976 |
| trees-colonies-2 | 16 | 1254 × 1254 | 1902468 |
| twin-sisters-crew | 4 | 1254 × 1254 | 792510 |
| regular-drummer | 4 | 1262 × 1246 | 833370 |
| twin-sisters-painted | 4 | 1254 × 1254 | 1249122 |
| people-wagon-drivers | 16 | 1254 × 1254 | 1460212 |
| weather-norther | 5 | 1536 × 1024 | 1669037 |
| wildlife-bear-javelina | 16 | 1254 × 1254 | 1249275 |
| wildlife-bison-pronghorn | 16 | 1254 × 1254 | 1471318 |
| wildlife-geese-cattle | 16 | 1254 × 1254 | 1282538 |
| wildlife-turkey | 16 | 1254 × 1254 | 1247109 |
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
| alamo-face-limestone | alamo-face-strips | State artwork; no motion required |
| alamo-face-rooms | alamo-face-strips | State artwork; no motion required |
| alamo-face-gate | alamo-face-strips | State artwork; no motion required |
| alamo-face-convento | alamo-face-strips | State artwork; no motion required |
| alamo-face-church-south | alamo-face-strips | State artwork; no motion required |
| alamo-pyre-unlit | alamo-funeral-pyre | State artwork; no motion required |
| alamo-pyre-fire-1 | alamo-funeral-pyre | alamo-pyre-burning |
| alamo-pyre-fire-2 | alamo-funeral-pyre | alamo-pyre-burning |
| alamo-pyre-fire-3 | alamo-funeral-pyre | alamo-pyre-burning |
| cannon-18pdr-e | cannon-18pdr | cannon-18pdr-e-recoil |
| cannon-18pdr-recoil-e | cannon-18pdr | cannon-18pdr-e-recoil |
| cannon-18pdr-w | cannon-18pdr | cannon-18pdr-w-recoil |
| cannon-18pdr-recoil-w | cannon-18pdr | cannon-18pdr-w-recoil |
| cannon-siege-battery-e | cannon-siege-battery | cannon-siege-battery-e-recoil |
| cannon-siege-battery-recoil-e | cannon-siege-battery | cannon-siege-battery-e-recoil |
| cannon-siege-battery-w | cannon-siege-battery | cannon-siege-battery-w-recoil |
| cannon-siege-battery-recoil-w | cannon-siege-battery | cannon-siege-battery-w-recoil |
| joe-door-aim | joe-story-actions | joe-fire-door |
| joe-door-fire | joe-story-actions | joe-fire-door |
| joe-hurt-e | joe-story-actions | State artwork; no motion required |
| joe-hurt-s | joe-story-actions | State artwork; no motion required |
| travis-still-ramp | famous-travis-still | State artwork; no motion required |
| flag-red-still | flag-red-siege | flag-red-wind |
| flag-red-wind-1 | flag-red-siege | flag-red-wind |
| flag-red-wind-2 | flag-red-siege | flag-red-wind |
| flag-red-wind-3 | flag-red-siege | flag-red-wind |
| smoke-column-far-1 | smoke-column-far | smoke-column-far-rise |
| smoke-column-far-2 | smoke-column-far | smoke-column-far-rise |
| smoke-column-far-3 | smoke-column-far | smoke-column-far-rise |
| smoke-column-far-4 | smoke-column-far | smoke-column-far-rise |
| ladder-carried-e-1 | alamo-scaling-ladders | ladder-carried-e |
| ladder-carried-e-2 | alamo-scaling-ladders | ladder-carried-e |
| ladder-set-e | alamo-scaling-ladders | State artwork; no motion required |
| ladder-set-w | alamo-scaling-ladders | State artwork; no motion required |
| regular-climb-1 | regular-ladder-climb | regular-climb |
| regular-climb-2 | regular-ladder-climb | regular-climb |
| regular-climb-3 | regular-ladder-climb | regular-climb |
| regular-climb-4 | regular-ladder-climb | regular-climb |
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
| white-flag-regular-idle-e | white-flag-regular | State artwork; no motion required |
| white-flag-regular-idle-s | white-flag-regular | State artwork; no motion required |
| white-flag-regular-walk-e-1 | white-flag-regular | white-flag-regular-walk-e |
| white-flag-regular-walk-e-2 | white-flag-regular | white-flag-regular-walk-e |
| white-flag-volunteer-idle-e | white-flag-volunteer | State artwork; no motion required |
| white-flag-volunteer-idle-s | white-flag-volunteer | State artwork; no motion required |
| white-flag-volunteer-walk-e-1 | white-flag-volunteer | white-flag-volunteer-walk-e |
| white-flag-volunteer-walk-e-2 | white-flag-volunteer | white-flag-volunteer-walk-e |
| regular-bugler-idle | regular-bugler | regular-bugler-call |
| regular-bugler-raise | regular-bugler | regular-bugler-call |
| regular-bugler-sound | regular-bugler | regular-bugler-call |
| regular-bugler-lower | regular-bugler | regular-bugler-call |
| palmetto | biome-ground-bexar | State artwork; no motion required |
| cypress-knees | biome-ground-bexar | State artwork; no motion required |
| cane-1 | biome-ground-bexar | State artwork; no motion required |
| cane-2 | biome-ground-bexar | State artwork; no motion required |
| cane-wind | biome-ground-bexar | cane-wind |
| grass-tall | biome-ground-bexar | State artwork; no motion required |
| grass-tall-wind | biome-ground-bexar | grass-tall-wind |
| thicket-thorn-1 | biome-ground-bexar | State artwork; no motion required |
| thicket-thorn-2 | biome-ground-bexar | State artwork; no motion required |
| yucca | biome-ground-bexar | State artwork; no motion required |
| marsh-cordgrass | biome-ground-bexar | State artwork; no motion required |
| dune-grass | biome-ground-bexar | State artwork; no motion required |
| acequia-straight | biome-ground-bexar | State artwork; no motion required |
| acequia-bend | biome-ground-bexar | State artwork; no motion required |
| acequia-crossing | biome-ground-bexar | State artwork; no motion required |
| fence-brush | biome-ground-bexar | State artwork; no motion required |
| pine-longleaf-pole | biome-trees-fields | pine-longleaf-pole-wind |
| pine-longleaf-log | biome-trees-fields | pine-longleaf-log-wind |
| pine-longleaf-large | biome-trees-fields | pine-longleaf-large-wind |
| palm-sabal-pole | biome-trees-fields | palm-sabal-pole-wind |
| palm-sabal-log | biome-trees-fields | palm-sabal-log-wind |
| palm-sabal-large | biome-trees-fields | palm-sabal-large-wind |
| cypress-bald-pole | biome-trees-fields | cypress-bald-pole-wind |
| cypress-bald-log | biome-trees-fields | cypress-bald-log-wind |
| cypress-bald-large | biome-trees-fields | cypress-bald-large-wind |
| magnolia-log | biome-trees-fields | magnolia-log-wind |
| magnolia-large | biome-trees-fields | magnolia-large-wind |
| beech-log | biome-trees-fields | beech-log-wind |
| beech-large | biome-trees-fields | beech-large-wind |
| field-irrigated-young | biome-trees-fields | State artwork; no motion required |
| field-irrigated-mature | biome-trees-fields | State artwork; no motion required |
| field-fallow | biome-trees-fields | State artwork; no motion required |
| canister-burst-1 | canister-burst | canister-burst |
| canister-burst-2 | canister-burst | canister-burst |
| canister-burst-3 | canister-burst | canister-burst |
| canister-burst-4 | canister-burst | canister-burst |
| cannon-cartwheels-e | cannon-cartwheels | cannon-cartwheels-e-recoil |
| cannon-cartwheels-recoil-e | cannon-cartwheels | cannon-cartwheels-e-recoil |
| cannon-cartwheels-w | cannon-cartwheels | cannon-cartwheels-w-recoil |
| cannon-cartwheels-recoil-w | cannon-cartwheels | cannon-cartwheels-w-recoil |
| cannon-sixpounder-e | cannon-sixpounder | cannon-sixpounder-e-recoil |
| cannon-sixpounder-recoil-e | cannon-sixpounder | cannon-sixpounder-e-recoil |
| cannon-sixpounder-w | cannon-sixpounder | cannon-sixpounder-w-recoil |
| cannon-sixpounder-recoil-w | cannon-sixpounder | cannon-sixpounder-w-recoil |
| carreta-travel-e-1 | carreta-solid-wheels | carreta-travel-e |
| carreta-travel-e-2 | carreta-solid-wheels | carreta-travel-e |
| carreta-travel-e-3 | carreta-solid-wheels | carreta-travel-e |
| carreta-travel-e-4 | carreta-solid-wheels | carreta-travel-e |
| carreta-travel-s-1 | carreta-solid-wheels | carreta-travel-s |
| carreta-travel-s-2 | carreta-solid-wheels | carreta-travel-s |
| carreta-travel-s-3 | carreta-solid-wheels | carreta-travel-s |
| carreta-travel-s-4 | carreta-solid-wheels | carreta-travel-s |
| carreta-travel-n-1 | carreta-solid-wheels | carreta-travel-n |
| carreta-travel-n-2 | carreta-solid-wheels | carreta-travel-n |
| carreta-travel-n-3 | carreta-solid-wheels | carreta-travel-n |
| carreta-travel-n-4 | carreta-solid-wheels | carreta-travel-n |
| carreta-idle-e | carreta-solid-wheels | State artwork; no motion required |
| carreta-idle-s | carreta-solid-wheels | State artwork; no motion required |
| carreta-idle-n | carreta-solid-wheels | State artwork; no motion required |
| carreta-loaded-e | carreta-solid-wheels | State artwork; no motion required |
| cart-open-e | cart-open | State artwork; no motion required |
| cart-open-e-variant | cart-open | State artwork; no motion required |
| cart-open-s | cart-open | State artwork; no motion required |
| cart-open-n | cart-open | State artwork; no motion required |
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
| rust-woman-speak-1 | people-cast2-dialogue | rust-woman-speak |
| rust-woman-speak-2 | people-cast2-dialogue | rust-woman-speak |
| rust-woman-listen-s | people-cast2-dialogue | rust-woman-listen-s |
| rust-woman-listen-n | people-cast2-dialogue | rust-woman-listen-n |
| indigo-speak-1 | people-cast2-dialogue | indigo-speak |
| indigo-speak-2 | people-cast2-dialogue | indigo-speak |
| indigo-listen-s | people-cast2-dialogue | indigo-listen-s |
| indigo-listen-n | people-cast2-dialogue | indigo-listen-n |
| ochre-speak-1 | people-cast2-dialogue | ochre-speak |
| ochre-speak-2 | people-cast2-dialogue | ochre-speak |
| ochre-listen-s | people-cast2-dialogue | ochre-listen-s |
| ochre-listen-n | people-cast2-dialogue | ochre-listen-n |
| blue-girl-speak-1 | people-cast2-dialogue | blue-girl-speak |
| blue-girl-speak-2 | people-cast2-dialogue | blue-girl-speak |
| blue-girl-listen-s | people-cast2-dialogue | blue-girl-listen-s |
| blue-girl-listen-n | people-cast2-dialogue | blue-girl-listen-n |
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
| rust-woman-walk-s-1 | people-cast2-vertical | rust-woman-walk-s |
| rust-woman-walk-s-2 | people-cast2-vertical | rust-woman-walk-s |
| rust-woman-walk-n-1 | people-cast2-vertical | rust-woman-walk-n |
| rust-woman-walk-n-2 | people-cast2-vertical | rust-woman-walk-n |
| indigo-walk-s-1 | people-cast2-vertical | indigo-walk-s |
| indigo-walk-s-2 | people-cast2-vertical | indigo-walk-s |
| indigo-walk-n-1 | people-cast2-vertical | indigo-walk-n |
| indigo-walk-n-2 | people-cast2-vertical | indigo-walk-n |
| ochre-walk-s-1 | people-cast2-vertical | ochre-walk-s |
| ochre-walk-s-2 | people-cast2-vertical | ochre-walk-s |
| ochre-walk-n-1 | people-cast2-vertical | ochre-walk-n |
| ochre-walk-n-2 | people-cast2-vertical | ochre-walk-n |
| blue-girl-walk-s-1 | people-cast2-vertical | blue-girl-walk-s |
| blue-girl-walk-s-2 | people-cast2-vertical | blue-girl-walk-s |
| blue-girl-walk-n-1 | people-cast2-vertical | blue-girl-walk-n |
| blue-girl-walk-n-2 | people-cast2-vertical | blue-girl-walk-n |
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
| icon-child-play | icons-children | State artwork; no motion required |
| icon-child-kindling | icons-children | State artwork; no motion required |
| icon-child-birds | icons-children | State artwork; no motion required |
| icon-child-eggs | icons-children | State artwork; no motion required |
| icon-child-water | icons-children | State artwork; no motion required |
| icon-child-mind | icons-children | State artwork; no motion required |
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
| cart-baggage | coleto-baggage-cart | cart-baggage-tip |
| cart-baggage-tilt-1 | coleto-baggage-cart | cart-baggage-tip |
| cart-baggage-tilt-2 | coleto-baggage-cart | cart-baggage-tip |
| cart-tipped | coleto-baggage-cart | cart-baggage-tip |
| icon-survey-plot | icons-family-actions-1 | State artwork; no motion required |
| icon-cut-lane | icons-family-actions-1 | State artwork; no motion required |
| icon-dig-well | icons-family-actions-1 | State artwork; no motion required |
| icon-plant-field | icons-family-actions-1 | State artwork; no motion required |
| icon-harvest-field | icons-family-actions-1 | State artwork; no motion required |
| icon-clear-plot | icons-family-actions-1 | State artwork; no motion required |
| icon-fence-plot | icons-family-actions-1 | State artwork; no motion required |
| icon-build-house | icons-family-actions-1 | State artwork; no motion required |
| icon-help-raise | icons-family-actions-1 | State artwork; no motion required |
| icon-hunt-timber | icons-family-actions-1 | State artwork; no motion required |
| icon-hunt-land | icons-family-actions-1 | State artwork; no motion required |
| icon-practise-shooting | icons-family-actions-1 | State artwork; no motion required |
| icon-sell-cotton | icons-family-actions-1 | State artwork; no motion required |
| icon-fetch-powder | icons-family-actions-1 | State artwork; no motion required |
| icon-fetch-seed | icons-family-actions-1 | State artwork; no motion required |
| icon-sell-food | icons-family-actions-1 | State artwork; no motion required |
| icon-mend-hoe | icons-family-actions-2 | State artwork; no motion required |
| icon-replace-hoe | icons-family-actions-2 | State artwork; no motion required |
| icon-visit-shop | icons-family-actions-2 | State artwork; no motion required |
| icon-make-furniture | icons-family-actions-2 | State artwork; no motion required |
| icon-buy-furniture | icons-family-actions-2 | State artwork; no motion required |
| icon-fell-trees | icons-family-actions-2 | State artwork; no motion required |
| icon-haul-logs | icons-family-actions-2 | State artwork; no motion required |
| icon-travel-gonzales | icons-family-actions-2 | State artwork; no motion required |
| icon-travel-home | icons-family-actions-2 | State artwork; no motion required |
| icon-visit | icons-family-actions-2 | State artwork; no motion required |
| icon-work | icons-family-actions-2 | State artwork; no motion required |
| icon-rest | icons-family-actions-2 | State artwork; no motion required |
| icon-stop-chore | icons-family-actions-2 | State artwork; no motion required |
| icon-enlist-regular | icons-family-service | State artwork; no motion required |
| icon-enlist-auxiliary | icons-family-service | State artwork; no motion required |
| icon-join-garrison | icons-family-service | State artwork; no motion required |
| icon-join-matamoros | icons-family-service | State artwork; no motion required |
| icon-go-vote | icons-family-service | State artwork; no motion required |
| icon-winter-recall | icons-family-service | State artwork; no motion required |
| icon-join-relief | icons-family-service | State artwork; no motion required |
| icon-join-houston | icons-family-service | State artwork; no motion required |
| icon-camp-drill | icons-family-service | State artwork; no motion required |
| icon-camp-forage | icons-family-service | State artwork; no motion required |
| icon-camp-guard | icons-family-service | State artwork; no motion required |
| icon-camp-scout | icons-family-service | State artwork; no motion required |
| icon-hunt-road | icons-family-service | State artwork; no motion required |
| icon-tend-sick | icons-family-service | State artwork; no motion required |
| icon-trade-crossing | icons-family-service | State artwork; no motion required |
| icon-fetch-logs | icons-family-service | State artwork; no motion required |
| icon-take-small-game | icons-family-subsistence | State artwork; no motion required |
| icon-fish-the-water | icons-family-subsistence | State artwork; no motion required |
| icon-fish-road | icons-family-subsistence | State artwork; no motion required |
| icon-gather-oysters | icons-family-subsistence | State artwork; no motion required |
| icon-cut-bee-tree | icons-family-subsistence | State artwork; no motion required |
| icon-butcher-beef | icons-family-subsistence | State artwork; no motion required |
| icon-butcher-hog | icons-family-subsistence | State artwork; no motion required |
| icon-look-to-stock | icons-family-subsistence | State artwork; no motion required |
| bonham-walk-e-1 | famous-bonham | bonham-walk-e |
| bonham-walk-e-2 | famous-bonham | bonham-walk-e |
| bonham-walk-e-3 | famous-bonham | bonham-walk-e |
| bonham-walk-e-4 | famous-bonham | bonham-walk-e |
| bonham-walk-s-1 | famous-bonham | bonham-walk-s |
| bonham-walk-s-2 | famous-bonham | bonham-walk-s |
| bonham-walk-n-1 | famous-bonham | bonham-walk-n |
| bonham-walk-n-2 | famous-bonham | bonham-walk-n |
| bonham-idle | famous-bonham | State artwork; no motion required |
| bonham-speak | famous-bonham | State artwork; no motion required |
| bonham-point | famous-bonham | State artwork; no motion required |
| bonham-serve-gun | famous-bonham | State artwork; no motion required |
| bonham-aim | famous-bonham | State artwork; no motion required |
| bonham-fire | famous-bonham | State artwork; no motion required |
| bonham-reload | famous-bonham | State artwork; no motion required |
| bonham-still | famous-bonham | State artwork; no motion required |
| almeron-dickinson-walk-e-1 | famous-almeron-dickinson | almeron-dickinson-walk-e |
| almeron-dickinson-walk-e-2 | famous-almeron-dickinson | almeron-dickinson-walk-e |
| almeron-dickinson-walk-e-3 | famous-almeron-dickinson | almeron-dickinson-walk-e |
| almeron-dickinson-walk-e-4 | famous-almeron-dickinson | almeron-dickinson-walk-e |
| almeron-dickinson-walk-s-1 | famous-almeron-dickinson | almeron-dickinson-walk-s |
| almeron-dickinson-walk-s-2 | famous-almeron-dickinson | almeron-dickinson-walk-s |
| almeron-dickinson-walk-n-1 | famous-almeron-dickinson | almeron-dickinson-walk-n |
| almeron-dickinson-walk-n-2 | famous-almeron-dickinson | almeron-dickinson-walk-n |
| almeron-dickinson-idle | famous-almeron-dickinson | State artwork; no motion required |
| almeron-dickinson-speak | famous-almeron-dickinson | State artwork; no motion required |
| almeron-dickinson-command | famous-almeron-dickinson | State artwork; no motion required |
| almeron-dickinson-serve-gun | famous-almeron-dickinson | State artwork; no motion required |
| almeron-dickinson-shot-carry | famous-almeron-dickinson | State artwork; no motion required |
| almeron-dickinson-ram | famous-almeron-dickinson | State artwork; no motion required |
| almeron-dickinson-fire | famous-almeron-dickinson | State artwork; no motion required |
| almeron-dickinson-still | famous-almeron-dickinson | State artwork; no motion required |
| seguin-walk-e-1 | famous-seguin | seguin-walk-e |
| seguin-walk-e-2 | famous-seguin | seguin-walk-e |
| seguin-walk-e-3 | famous-seguin | seguin-walk-e |
| seguin-walk-e-4 | famous-seguin | seguin-walk-e |
| seguin-walk-s-1 | famous-seguin | seguin-walk-s |
| seguin-walk-s-2 | famous-seguin | seguin-walk-s |
| seguin-walk-n-1 | famous-seguin | seguin-walk-n |
| seguin-walk-n-2 | famous-seguin | seguin-walk-n |
| seguin-idle | famous-seguin | State artwork; no motion required |
| seguin-listen | famous-seguin | State artwork; no motion required |
| seguin-speak | famous-seguin | State artwork; no motion required |
| seguin-command | famous-seguin | State artwork; no motion required |
| seguin-mounted-e | famous-seguin | State artwork; no motion required |
| seguin-mounted-s | famous-seguin | State artwork; no motion required |
| seguin-dispatch-held | famous-seguin | State artwork; no motion required |
| seguin-dispatch-walk | famous-seguin | State artwork; no motion required |
| susanna-dickinson-walk-e-1 | famous-susanna-dickinson | susanna-dickinson-walk-e |
| susanna-dickinson-walk-e-2 | famous-susanna-dickinson | susanna-dickinson-walk-e |
| susanna-dickinson-walk-e-3 | famous-susanna-dickinson | susanna-dickinson-walk-e |
| susanna-dickinson-walk-e-4 | famous-susanna-dickinson | susanna-dickinson-walk-e |
| susanna-dickinson-walk-s-1 | famous-susanna-dickinson | susanna-dickinson-walk-s |
| susanna-dickinson-walk-s-2 | famous-susanna-dickinson | susanna-dickinson-walk-s |
| susanna-dickinson-walk-n-1 | famous-susanna-dickinson | susanna-dickinson-walk-n |
| susanna-dickinson-walk-n-2 | famous-susanna-dickinson | susanna-dickinson-walk-n |
| susanna-dickinson-idle | famous-susanna-dickinson | State artwork; no motion required |
| susanna-dickinson-listen | famous-susanna-dickinson | State artwork; no motion required |
| susanna-dickinson-speak | famous-susanna-dickinson | State artwork; no motion required |
| susanna-dickinson-nurse | famous-susanna-dickinson | State artwork; no motion required |
| susanna-dickinson-shelter-with-angelina | famous-susanna-dickinson | State artwork; no motion required |
| susanna-dickinson-hold-angelina | famous-susanna-dickinson | State artwork; no motion required |
| susanna-dickinson-carry-angelina | famous-susanna-dickinson | State artwork; no motion required |
| susanna-dickinson-rest-with-angelina | famous-susanna-dickinson | State artwork; no motion required |
| angelina-dickinson-sit | famous-angelina-dickinson | angelina-dickinson-reach |
| angelina-dickinson-reach | famous-angelina-dickinson | angelina-dickinson-reach |
| angelina-dickinson-step | famous-angelina-dickinson | State artwork; no motion required |
| angelina-dickinson-sleep | famous-angelina-dickinson | State artwork; no motion required |
| alavez-walk-e-1 | famous-alavez | alavez-walk-e |
| alavez-walk-e-2 | famous-alavez | alavez-walk-e |
| alavez-walk-e-3 | famous-alavez | alavez-walk-e |
| alavez-walk-e-4 | famous-alavez | alavez-walk-e |
| alavez-walk-s-1 | famous-alavez | alavez-walk-s |
| alavez-walk-s-2 | famous-alavez | alavez-walk-s |
| alavez-walk-n-1 | famous-alavez | alavez-walk-n |
| alavez-walk-n-2 | famous-alavez | alavez-walk-n |
| alavez-idle-e | famous-alavez | State artwork; no motion required |
| alavez-idle-s | famous-alavez | State artwork; no motion required |
| alavez-speak | famous-alavez | State artwork; no motion required |
| alavez-listen | famous-alavez | State artwork; no motion required |
| alavez-reach-door | famous-alavez | State artwork; no motion required |
| alavez-beckon | famous-alavez | State artwork; no motion required |
| alavez-guide | famous-alavez | State artwork; no motion required |
| alavez-rest | famous-alavez | State artwork; no motion required |
| almonte-walk-e-1 | famous-almonte | almonte-walk-e |
| almonte-walk-e-2 | famous-almonte | almonte-walk-e |
| almonte-walk-e-3 | famous-almonte | almonte-walk-e |
| almonte-walk-e-4 | famous-almonte | almonte-walk-e |
| almonte-walk-s-1 | famous-almonte | almonte-walk-s |
| almonte-walk-s-2 | famous-almonte | almonte-walk-s |
| almonte-walk-n-1 | famous-almonte | almonte-walk-n |
| almonte-walk-n-2 | famous-almonte | almonte-walk-n |
| almonte-idle | famous-almonte | State artwork; no motion required |
| almonte-journal | famous-almonte | State artwork; no motion required |
| almonte-command | famous-almonte | State artwork; no motion required |
| almonte-surrender | famous-almonte | State artwork; no motion required |
| almonte-offer-sword | famous-almonte | State artwork; no motion required |
| almonte-prisoner | famous-almonte | State artwork; no motion required |
| almonte-interpret | famous-almonte | State artwork; no motion required |
| almonte-listen | famous-almonte | State artwork; no motion required |
| ben-walk-e-1 | famous-ben | ben-walk-e |
| ben-walk-e-2 | famous-ben | ben-walk-e |
| ben-walk-e-3 | famous-ben | ben-walk-e |
| ben-walk-e-4 | famous-ben | ben-walk-e |
| ben-walk-s-1 | famous-ben | ben-walk-s |
| ben-walk-s-2 | famous-ben | ben-walk-s |
| ben-walk-n-1 | famous-ben | ben-walk-n |
| ben-walk-n-2 | famous-ben | ben-walk-n |
| ben-idle | famous-ben | State artwork; no motion required |
| ben-idle-s | famous-ben | State artwork; no motion required |
| ben-speak | famous-ben | State artwork; no motion required |
| ben-look-back | famous-ben | State artwork; no motion required |
| ben-pot-carry | famous-ben | State artwork; no motion required |
| ben-pot-set-down | famous-ben | State artwork; no motion required |
| ben-offer-water | famous-ben | State artwork; no motion required |
| ben-rest | famous-ben | State artwork; no motion required |
| twin-sisters-roll-1 | twin-sisters-limbered | twin-sisters-limbered |
| twin-sisters-roll-2 | twin-sisters-limbered | twin-sisters-limbered |
| twin-sisters-halt | twin-sisters-limbered | State artwork; no motion required |
| twin-sisters-turn | twin-sisters-limbered | State artwork; no motion required |
| milam-walk-e-1 | famous-milam | milam-walk-e |
| milam-walk-e-2 | famous-milam | milam-walk-e |
| milam-walk-e-3 | famous-milam | milam-walk-e |
| milam-walk-e-4 | famous-milam | milam-walk-e |
| milam-walk-s-1 | famous-milam | milam-walk-s |
| milam-walk-s-2 | famous-milam | milam-walk-s |
| milam-walk-n-1 | famous-milam | milam-walk-n |
| milam-walk-n-2 | famous-milam | milam-walk-n |
| milam-idle | famous-milam | State artwork; no motion required |
| milam-speak | famous-milam | State artwork; no motion required |
| milam-rally | famous-milam | State artwork; no motion required |
| milam-point | famous-milam | State artwork; no motion required |
| milam-cover | famous-milam | State artwork; no motion required |
| milam-advance | famous-milam | State artwork; no motion required |
| milam-fall | famous-milam | State artwork; no motion required |
| milam-still | famous-milam | State artwork; no motion required |
| fannin-walk-e-1 | famous-fannin | fannin-walk-e |
| fannin-walk-e-2 | famous-fannin | fannin-walk-e |
| fannin-walk-e-3 | famous-fannin | fannin-walk-e |
| fannin-walk-e-4 | famous-fannin | fannin-walk-e |
| fannin-walk-s-1 | famous-fannin | fannin-walk-s |
| fannin-walk-s-2 | famous-fannin | fannin-walk-s |
| fannin-walk-n-1 | famous-fannin | fannin-walk-n |
| fannin-walk-n-2 | famous-fannin | fannin-walk-n |
| fannin-idle | famous-fannin | State artwork; no motion required |
| fannin-map | famous-fannin | State artwork; no motion required |
| fannin-command | famous-fannin | State artwork; no motion required |
| fannin-speak | famous-fannin | State artwork; no motion required |
| fannin-cover | famous-fannin | State artwork; no motion required |
| fannin-injured-seated | famous-fannin | State artwork; no motion required |
| fannin-surrender | famous-fannin | State artwork; no motion required |
| fannin-prisoner-seated | famous-fannin | State artwork; no motion required |
| burleson-walk-e-1 | famous-burleson | burleson-walk-e |
| burleson-walk-e-2 | famous-burleson | burleson-walk-e |
| burleson-walk-e-3 | famous-burleson | burleson-walk-e |
| burleson-walk-e-4 | famous-burleson | burleson-walk-e |
| burleson-walk-s-1 | famous-burleson | burleson-walk-s |
| burleson-walk-s-2 | famous-burleson | burleson-walk-s |
| burleson-walk-n-1 | famous-burleson | burleson-walk-n |
| burleson-walk-n-2 | famous-burleson | burleson-walk-n |
| burleson-idle | famous-burleson | State artwork; no motion required |
| burleson-command | famous-burleson | State artwork; no motion required |
| burleson-point | famous-burleson | State artwork; no motion required |
| burleson-listen | famous-burleson | State artwork; no motion required |
| burleson-receive-sword | famous-burleson | State artwork; no motion required |
| burleson-sword-down | famous-burleson | State artwork; no motion required |
| burleson-read-note | famous-burleson | State artwork; no motion required |
| burleson-rest | famous-burleson | State artwork; no motion required |
| burleson-mounted-walk-e-1 | famous-burleson-mounted | burleson-mounted-walk-e |
| burleson-mounted-walk-e-2 | famous-burleson-mounted | burleson-mounted-walk-e |
| burleson-mounted-idle-e | famous-burleson-mounted | State artwork; no motion required |
| burleson-mounted-idle-s | famous-burleson-mounted | State artwork; no motion required |
| castaneda-walk-e-1 | famous-castaneda | castaneda-walk-e |
| castaneda-walk-e-2 | famous-castaneda | castaneda-walk-e |
| castaneda-walk-e-3 | famous-castaneda | castaneda-walk-e |
| castaneda-walk-e-4 | famous-castaneda | castaneda-walk-e |
| castaneda-walk-s-1 | famous-castaneda | castaneda-walk-s |
| castaneda-walk-s-2 | famous-castaneda | castaneda-walk-s |
| castaneda-walk-n-1 | famous-castaneda | castaneda-walk-n |
| castaneda-walk-n-2 | famous-castaneda | castaneda-walk-n |
| castaneda-idle | famous-castaneda | State artwork; no motion required |
| castaneda-halt | famous-castaneda | State artwork; no motion required |
| castaneda-parley | famous-castaneda | State artwork; no motion required |
| castaneda-read-orders | famous-castaneda | State artwork; no motion required |
| castaneda-listen | famous-castaneda | State artwork; no motion required |
| castaneda-withdraw | famous-castaneda | State artwork; no motion required |
| castaneda-look | famous-castaneda | State artwork; no motion required |
| castaneda-at-ease | famous-castaneda | State artwork; no motion required |
| castaneda-mounted-walk-e-1 | famous-castaneda-mounted | castaneda-mounted-walk-e |
| castaneda-mounted-walk-e-2 | famous-castaneda-mounted | castaneda-mounted-walk-e |
| castaneda-mounted-idle-e | famous-castaneda-mounted | State artwork; no motion required |
| castaneda-mounted-idle-s | famous-castaneda-mounted | State artwork; no motion required |
| castrillon-idle | famous-castrillon | State artwork; no motion required |
| castrillon-walk-e-1 | famous-castrillon | castrillon-walk-e |
| castrillon-walk-e-2 | famous-castrillon | castrillon-walk-e |
| castrillon-command | famous-castrillon | State artwork; no motion required |
| castrillon-turn-away | famous-castrillon-fate | castrillon-fall |
| castrillon-stumble | famous-castrillon-fate | castrillon-fall |
| castrillon-kneel | famous-castrillon-fate | castrillon-fall |
| castrillon-still | famous-castrillon-fate | State artwork; no motion required |
| cos-walk-e-1 | famous-cos | cos-walk-e |
| cos-walk-e-2 | famous-cos | cos-walk-e |
| cos-walk-e-3 | famous-cos | cos-walk-e |
| cos-walk-e-4 | famous-cos | cos-walk-e |
| cos-walk-s-1 | famous-cos | cos-walk-s |
| cos-walk-s-2 | famous-cos | cos-walk-s |
| cos-walk-n-1 | famous-cos | cos-walk-n |
| cos-walk-n-2 | famous-cos | cos-walk-n |
| cos-idle | famous-cos | State artwork; no motion required |
| cos-command | famous-cos | State artwork; no motion required |
| cos-point | famous-cos | State artwork; no motion required |
| cos-map | famous-cos | State artwork; no motion required |
| cos-sign-terms | famous-cos | State artwork; no motion required |
| cos-hand-document | famous-cos | State artwork; no motion required |
| cos-sword-down | famous-cos | State artwork; no motion required |
| cos-prisoner | famous-cos | State artwork; no motion required |
| cos-mounted-walk-e-1 | famous-cos-mounted | cos-mounted-walk-e |
| cos-mounted-walk-e-2 | famous-cos-mounted | cos-mounted-walk-e |
| cos-mounted-idle-e | famous-cos-mounted | State artwork; no motion required |
| cos-mounted-idle-s | famous-cos-mounted | State artwork; no motion required |
| crockett-captive-1 | famous-crockett-fate | crockett-captive |
| crockett-captive-2 | famous-crockett-fate | crockett-captive |
| crockett-still-side | famous-crockett-fate | State artwork; no motion required |
| crockett-still-turn | famous-crockett-fate | State artwork; no motion required |
| esparza-walk-e-1 | famous-esparza | esparza-walk-e |
| esparza-walk-e-2 | famous-esparza | esparza-walk-e |
| esparza-walk-e-3 | famous-esparza | esparza-walk-e |
| esparza-walk-e-4 | famous-esparza | esparza-walk-e |
| esparza-walk-s-1 | famous-esparza | esparza-walk-s |
| esparza-walk-s-2 | famous-esparza | esparza-walk-s |
| esparza-walk-n-1 | famous-esparza | esparza-walk-n |
| esparza-walk-n-2 | famous-esparza | esparza-walk-n |
| esparza-idle | famous-esparza | State artwork; no motion required |
| esparza-speak | famous-esparza | State artwork; no motion required |
| esparza-point | famous-esparza | State artwork; no motion required |
| esparza-serve-gun | famous-esparza | State artwork; no motion required |
| esparza-shot-carry | famous-esparza | State artwork; no motion required |
| esparza-aim | famous-esparza | State artwork; no motion required |
| esparza-fire | famous-esparza | State artwork; no motion required |
| esparza-still | famous-esparza | State artwork; no motion required |
| houston-mounted-walk-e-1 | famous-houston-mounted | houston-mounted-walk-e |
| houston-mounted-walk-e-2 | famous-houston-mounted | houston-mounted-walk-e |
| houston-mounted-idle-e | famous-houston-mounted | State artwork; no motion required |
| houston-mounted-walk-s | famous-houston-mounted | State artwork; no motion required |
| santa-anna-mounted-walk-e-1 | famous-santa-anna-mounted | santa-anna-mounted-walk-e |
| santa-anna-mounted-walk-e-2 | famous-santa-anna-mounted | santa-anna-mounted-walk-e |
| santa-anna-mounted-idle-e | famous-santa-anna-mounted | State artwork; no motion required |
| santa-anna-mounted-walk-s | famous-santa-anna-mounted | State artwork; no motion required |
| crockett-walk-e-1 | famous-crockett | crockett-walk-e |
| crockett-walk-e-2 | famous-crockett | crockett-walk-e |
| crockett-walk-e-3 | famous-crockett | crockett-walk-e |
| crockett-walk-e-4 | famous-crockett | crockett-walk-e |
| crockett-walk-s-1 | famous-crockett | crockett-walk-s |
| crockett-walk-s-2 | famous-crockett | crockett-walk-s |
| crockett-walk-n-1 | famous-crockett | crockett-walk-n |
| crockett-walk-n-2 | famous-crockett | crockett-walk-n |
| crockett-idle | famous-crockett | State artwork; no motion required |
| crockett-listen | famous-crockett | State artwork; no motion required |
| crockett-speak | famous-crockett | State artwork; no motion required |
| crockett-command | famous-crockett | State artwork; no motion required |
| crockett-aim | famous-crockett | State artwork; no motion required |
| crockett-fire | famous-crockett | State artwork; no motion required |
| crockett-reload | famous-crockett | State artwork; no motion required |
| crockett-rest-seated | famous-crockett | State artwork; no motion required |
| travis-walk-e-1 | famous-travis | travis-walk-e |
| travis-walk-e-2 | famous-travis | travis-walk-e |
| travis-walk-e-3 | famous-travis | travis-walk-e |
| travis-walk-e-4 | famous-travis | travis-walk-e |
| travis-walk-s-1 | famous-travis | travis-walk-s |
| travis-walk-s-2 | famous-travis | travis-walk-s |
| travis-walk-n-1 | famous-travis | travis-walk-n |
| travis-walk-n-2 | famous-travis | travis-walk-n |
| travis-idle | famous-travis | State artwork; no motion required |
| travis-speak | famous-travis | State artwork; no motion required |
| travis-command | famous-travis | State artwork; no motion required |
| travis-write | famous-travis | State artwork; no motion required |
| travis-ready | famous-travis | State artwork; no motion required |
| travis-aim | famous-travis | State artwork; no motion required |
| travis-fire | famous-travis | State artwork; no motion required |
| travis-wounded-kneel | famous-travis | State artwork; no motion required |
| bowie-walk-e-1 | famous-bowie | bowie-walk-e |
| bowie-walk-e-2 | famous-bowie | bowie-walk-e |
| bowie-walk-e-3 | famous-bowie | bowie-walk-e |
| bowie-walk-e-4 | famous-bowie | bowie-walk-e |
| bowie-walk-s-1 | famous-bowie | bowie-walk-s |
| bowie-walk-s-2 | famous-bowie | bowie-walk-s |
| bowie-walk-n-1 | famous-bowie | bowie-walk-n |
| bowie-walk-n-2 | famous-bowie | bowie-walk-n |
| bowie-idle | famous-bowie | State artwork; no motion required |
| bowie-speak | famous-bowie | State artwork; no motion required |
| bowie-command | famous-bowie | State artwork; no motion required |
| bowie-unwell | famous-bowie | State artwork; no motion required |
| bowie-sick-seated | famous-bowie | State artwork; no motion required |
| bowie-sick-bed | famous-bowie | State artwork; no motion required |
| bowie-still-bed | famous-bowie | State artwork; no motion required |
| bowie-rise-bed | famous-bowie | State artwork; no motion required |
| emily-west-walk-e-1 | famous-emily-west | emily-west-walk-e |
| emily-west-walk-e-2 | famous-emily-west | emily-west-walk-e |
| emily-west-walk-e-3 | famous-emily-west | emily-west-walk-e |
| emily-west-walk-e-4 | famous-emily-west | emily-west-walk-e |
| emily-west-walk-s-1 | famous-emily-west | emily-west-walk-s |
| emily-west-walk-s-2 | famous-emily-west | emily-west-walk-s |
| emily-west-walk-n-1 | famous-emily-west | emily-west-walk-n |
| emily-west-walk-n-2 | famous-emily-west | emily-west-walk-n |
| emily-west-idle | famous-emily-west | State artwork; no motion required |
| emily-west-speak | famous-emily-west | State artwork; no motion required |
| emily-west-listen | famous-emily-west | State artwork; no motion required |
| emily-west-stand-firm | famous-emily-west | State artwork; no motion required |
| emily-west-carry-tray | famous-emily-west | State artwork; no motion required |
| emily-west-set-tray | famous-emily-west | State artwork; no motion required |
| emily-west-sit-converse | famous-emily-west | State artwork; no motion required |
| emily-west-carry-bundle | famous-emily-west | State artwork; no motion required |
| santa-anna-walk-e-1 | famous-santa-anna | santa-anna-walk-e |
| santa-anna-walk-e-2 | famous-santa-anna | santa-anna-walk-e |
| santa-anna-walk-e-3 | famous-santa-anna | santa-anna-walk-e |
| santa-anna-walk-e-4 | famous-santa-anna | santa-anna-walk-e |
| santa-anna-walk-s-1 | famous-santa-anna | santa-anna-walk-s |
| santa-anna-walk-s-2 | famous-santa-anna | santa-anna-walk-s |
| santa-anna-walk-n-1 | famous-santa-anna | santa-anna-walk-n |
| santa-anna-walk-n-2 | famous-santa-anna | santa-anna-walk-n |
| santa-anna-idle | famous-santa-anna | State artwork; no motion required |
| santa-anna-speak | famous-santa-anna | State artwork; no motion required |
| santa-anna-command | famous-santa-anna | State artwork; no motion required |
| santa-anna-map | famous-santa-anna | State artwork; no motion required |
| santa-anna-disguised-walk | famous-santa-anna | State artwork; no motion required |
| santa-anna-disguised-idle | famous-santa-anna | State artwork; no motion required |
| santa-anna-disguised-seated | famous-santa-anna | State artwork; no motion required |
| santa-anna-disguised-speak | famous-santa-anna | State artwork; no motion required |
| houston-walk-e-1 | famous-houston | houston-walk-e |
| houston-walk-e-2 | famous-houston | houston-walk-e |
| houston-walk-e-3 | famous-houston | houston-walk-e |
| houston-walk-e-4 | famous-houston | houston-walk-e |
| houston-walk-s-1 | famous-houston | houston-walk-s |
| houston-walk-s-2 | famous-houston | houston-walk-s |
| houston-walk-n-1 | famous-houston | houston-walk-n |
| houston-walk-n-2 | famous-houston | houston-walk-n |
| houston-idle | famous-houston | State artwork; no motion required |
| houston-speak | famous-houston | State artwork; no motion required |
| houston-command | famous-houston | State artwork; no motion required |
| houston-map | famous-houston | State artwork; no motion required |
| houston-injured-seated | famous-houston | State artwork; no motion required |
| houston-injured-speak | famous-houston | State artwork; no motion required |
| houston-injured-rest | famous-houston | State artwork; no motion required |
| houston-injured-stand | famous-houston | State artwork; no motion required |
| emily-west-picnic-listen | famous-emily-west-picnic | emily-west-picnic-converse |
| emily-west-picnic-speak | famous-emily-west-picnic | emily-west-picnic-converse |
| emily-west-picnic-laugh | famous-emily-west-picnic | emily-west-picnic-converse |
| emily-west-picnic-alarm | famous-emily-west-picnic | State artwork; no motion required |
| santa-anna-picnic-listen | famous-santa-anna-picnic | santa-anna-picnic-converse |
| santa-anna-picnic-speak | famous-santa-anna-picnic | santa-anna-picnic-converse |
| santa-anna-picnic-notice | famous-santa-anna-picnic | santa-anna-picnic-alarm |
| santa-anna-picnic-rise | famous-santa-anna-picnic | santa-anna-picnic-alarm |
| picnic-command-tent | famous-picnic-props | State artwork; no motion required |
| picnic-blanket | famous-picnic-props | State artwork; no motion required |
| picnic-basket | famous-picnic-props | State artwork; no motion required |
| picnic-jug-cups | famous-picnic-props | State artwork; no motion required |
| flag-come-and-take-it | flag-come-and-take-it | flag-come-and-take-it-wind |
| flag-come-and-take-it-wind-1 | flag-come-and-take-it | flag-come-and-take-it-wind |
| flag-come-and-take-it-wind-2 | flag-come-and-take-it | flag-come-and-take-it-wind |
| flag-come-and-take-it-wind-3 | flag-come-and-take-it | flag-come-and-take-it-wind |
| prisoner-walk-e-1 | goliad-prisoner | prisoner-walk-e |
| prisoner-walk-e-2 | goliad-prisoner | prisoner-walk-e |
| prisoner-walk-e-3 | goliad-prisoner | prisoner-walk-e |
| prisoner-walk-e-4 | goliad-prisoner | prisoner-walk-e |
| prisoner-walk-s-1 | goliad-prisoner | prisoner-walk-s |
| prisoner-walk-s-2 | goliad-prisoner | prisoner-walk-s |
| prisoner-walk-n-1 | goliad-prisoner | prisoner-walk-n |
| prisoner-walk-n-2 | goliad-prisoner | prisoner-walk-n |
| prisoner-idle-e | goliad-prisoner | State artwork; no motion required |
| prisoner-idle-s | goliad-prisoner | State artwork; no motion required |
| prisoner-listen | goliad-prisoner | State artwork; no motion required |
| prisoner-look-back | goliad-prisoner | State artwork; no motion required |
| prisoner-run-e | goliad-prisoner | State artwork; no motion required |
| prisoner-duck | goliad-prisoner | State artwork; no motion required |
| prisoner-injured | goliad-prisoner | State artwork; no motion required |
| prisoner-still | goliad-prisoner | State artwork; no motion required |
| gonzales-cannon-buried | gonzales-cannon-buried | State artwork; no motion required |
| gonzales-log-breastwork | gonzales-log-breastwork | State artwork; no motion required |
| gonzales-dugout-canoe | gonzales-dugout-canoe | State artwork; no motion required |
| gonzales-ploughed-earth | gonzales-ploughed-earth | State artwork; no motion required |
| gonzales-flag-work-cloth | gonzales-flag-work-cloth | State artwork; no motion required |
| gonzales-flag-work-painted | gonzales-flag-work-painted | State artwork; no motion required |
| teal-paint-1 | people-gonzales-paint | teal-paint |
| teal-paint-2 | people-gonzales-paint | teal-paint |
| indigo-paint-1 | people-gonzales-paint | indigo-paint |
| indigo-paint-2 | people-gonzales-paint | indigo-paint |
| blue-girl-paint-1 | people-gonzales-paint | blue-girl-paint |
| blue-girl-paint-2 | people-gonzales-paint | blue-girl-paint |
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
| icon-take-small-game-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-fish-the-water-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-gather-oysters-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-cut-bee-tree-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-butcher-beef-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-butcher-hog-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-look-to-stock-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-make-carreta | icons-gather-stock-carreta | State artwork; no motion required |
| rust-ride-e-1 | people-mounted-cast1-e | rust-ride-e |
| rust-ride-e-2 | people-mounted-cast1-e | rust-ride-e |
| rust-ride-e-3 | people-mounted-cast1-e | rust-ride-e |
| rust-ride-e-4 | people-mounted-cast1-e | rust-ride-e |
| teal-ride-e-1 | people-mounted-cast1-e | teal-ride-e |
| teal-ride-e-2 | people-mounted-cast1-e | teal-ride-e |
| teal-ride-e-3 | people-mounted-cast1-e | teal-ride-e |
| teal-ride-e-4 | people-mounted-cast1-e | teal-ride-e |
| elder-ride-e-1 | people-mounted-cast1-e | elder-ride-e |
| elder-ride-e-2 | people-mounted-cast1-e | elder-ride-e |
| elder-ride-e-3 | people-mounted-cast1-e | elder-ride-e |
| elder-ride-e-4 | people-mounted-cast1-e | elder-ride-e |
| blue-ride-e-1 | people-mounted-cast1-e | blue-ride-e |
| blue-ride-e-2 | people-mounted-cast1-e | blue-ride-e |
| blue-ride-e-3 | people-mounted-cast1-e | blue-ride-e |
| blue-ride-e-4 | people-mounted-cast1-e | blue-ride-e |
| rust-ride-s-1 | people-mounted-cast1-s | rust-ride-s |
| rust-ride-s-2 | people-mounted-cast1-s | rust-ride-s |
| rust-ride-s-3 | people-mounted-cast1-s | rust-ride-s |
| rust-ride-s-4 | people-mounted-cast1-s | rust-ride-s |
| teal-ride-s-1 | people-mounted-cast1-s | teal-ride-s |
| teal-ride-s-2 | people-mounted-cast1-s | teal-ride-s |
| teal-ride-s-3 | people-mounted-cast1-s | teal-ride-s |
| teal-ride-s-4 | people-mounted-cast1-s | teal-ride-s |
| elder-ride-s-1 | people-mounted-cast1-s | elder-ride-s |
| elder-ride-s-2 | people-mounted-cast1-s | elder-ride-s |
| elder-ride-s-3 | people-mounted-cast1-s | elder-ride-s |
| elder-ride-s-4 | people-mounted-cast1-s | elder-ride-s |
| blue-ride-s-1 | people-mounted-cast1-s | blue-ride-s |
| blue-ride-s-2 | people-mounted-cast1-s | blue-ride-s |
| blue-ride-s-3 | people-mounted-cast1-s | blue-ride-s |
| blue-ride-s-4 | people-mounted-cast1-s | blue-ride-s |
| rust-ride-n-1 | people-mounted-cast1-n | rust-ride-n |
| rust-ride-n-2 | people-mounted-cast1-n | rust-ride-n |
| rust-ride-n-3 | people-mounted-cast1-n | rust-ride-n |
| rust-ride-n-4 | people-mounted-cast1-n | rust-ride-n |
| teal-ride-n-1 | people-mounted-cast1-n | teal-ride-n |
| teal-ride-n-2 | people-mounted-cast1-n | teal-ride-n |
| teal-ride-n-3 | people-mounted-cast1-n | teal-ride-n |
| teal-ride-n-4 | people-mounted-cast1-n | teal-ride-n |
| elder-ride-n-1 | people-mounted-cast1-n | elder-ride-n |
| elder-ride-n-2 | people-mounted-cast1-n | elder-ride-n |
| elder-ride-n-3 | people-mounted-cast1-n | elder-ride-n |
| elder-ride-n-4 | people-mounted-cast1-n | elder-ride-n |
| blue-ride-n-1 | people-mounted-cast1-n | blue-ride-n |
| blue-ride-n-2 | people-mounted-cast1-n | blue-ride-n |
| blue-ride-n-3 | people-mounted-cast1-n | blue-ride-n |
| blue-ride-n-4 | people-mounted-cast1-n | blue-ride-n |
| rust-woman-ride-e-1 | people-mounted-cast2-e | rust-woman-ride-e |
| rust-woman-ride-e-2 | people-mounted-cast2-e | rust-woman-ride-e |
| rust-woman-ride-e-3 | people-mounted-cast2-e | rust-woman-ride-e |
| rust-woman-ride-e-4 | people-mounted-cast2-e | rust-woman-ride-e |
| indigo-ride-e-1 | people-mounted-cast2-e | indigo-ride-e |
| indigo-ride-e-2 | people-mounted-cast2-e | indigo-ride-e |
| indigo-ride-e-3 | people-mounted-cast2-e | indigo-ride-e |
| indigo-ride-e-4 | people-mounted-cast2-e | indigo-ride-e |
| ochre-ride-e-1 | people-mounted-cast2-e | ochre-ride-e |
| ochre-ride-e-2 | people-mounted-cast2-e | ochre-ride-e |
| ochre-ride-e-3 | people-mounted-cast2-e | ochre-ride-e |
| ochre-ride-e-4 | people-mounted-cast2-e | ochre-ride-e |
| blue-girl-ride-e-1 | people-mounted-cast2-e | blue-girl-ride-e |
| blue-girl-ride-e-2 | people-mounted-cast2-e | blue-girl-ride-e |
| blue-girl-ride-e-3 | people-mounted-cast2-e | blue-girl-ride-e |
| blue-girl-ride-e-4 | people-mounted-cast2-e | blue-girl-ride-e |
| rust-woman-ride-s-1 | people-mounted-cast2-s | rust-woman-ride-s |
| rust-woman-ride-s-2 | people-mounted-cast2-s | rust-woman-ride-s |
| rust-woman-ride-s-3 | people-mounted-cast2-s | rust-woman-ride-s |
| rust-woman-ride-s-4 | people-mounted-cast2-s | rust-woman-ride-s |
| indigo-ride-s-1 | people-mounted-cast2-s | indigo-ride-s |
| indigo-ride-s-2 | people-mounted-cast2-s | indigo-ride-s |
| indigo-ride-s-3 | people-mounted-cast2-s | indigo-ride-s |
| indigo-ride-s-4 | people-mounted-cast2-s | indigo-ride-s |
| ochre-ride-s-1 | people-mounted-cast2-s | ochre-ride-s |
| ochre-ride-s-2 | people-mounted-cast2-s | ochre-ride-s |
| ochre-ride-s-3 | people-mounted-cast2-s | ochre-ride-s |
| ochre-ride-s-4 | people-mounted-cast2-s | ochre-ride-s |
| blue-girl-ride-s-1 | people-mounted-cast2-s | blue-girl-ride-s |
| blue-girl-ride-s-2 | people-mounted-cast2-s | blue-girl-ride-s |
| blue-girl-ride-s-3 | people-mounted-cast2-s | blue-girl-ride-s |
| blue-girl-ride-s-4 | people-mounted-cast2-s | blue-girl-ride-s |
| rust-woman-ride-n-1 | people-mounted-cast2-n | rust-woman-ride-n |
| rust-woman-ride-n-2 | people-mounted-cast2-n | rust-woman-ride-n |
| rust-woman-ride-n-3 | people-mounted-cast2-n | rust-woman-ride-n |
| rust-woman-ride-n-4 | people-mounted-cast2-n | rust-woman-ride-n |
| indigo-ride-n-1 | people-mounted-cast2-n | indigo-ride-n |
| indigo-ride-n-2 | people-mounted-cast2-n | indigo-ride-n |
| indigo-ride-n-3 | people-mounted-cast2-n | indigo-ride-n |
| indigo-ride-n-4 | people-mounted-cast2-n | indigo-ride-n |
| ochre-ride-n-1 | people-mounted-cast2-n | ochre-ride-n |
| ochre-ride-n-2 | people-mounted-cast2-n | ochre-ride-n |
| ochre-ride-n-3 | people-mounted-cast2-n | ochre-ride-n |
| ochre-ride-n-4 | people-mounted-cast2-n | ochre-ride-n |
| blue-girl-ride-n-1 | people-mounted-cast2-n | blue-girl-ride-n |
| blue-girl-ride-n-2 | people-mounted-cast2-n | blue-girl-ride-n |
| blue-girl-ride-n-3 | people-mounted-cast2-n | blue-girl-ride-n |
| blue-girl-ride-n-4 | people-mounted-cast2-n | blue-girl-ride-n |
| mustang-graze-1 | wildlife-mustang | mustang-graze |
| mustang-graze-2 | wildlife-mustang | mustang-graze |
| mustang-graze-3 | wildlife-mustang | mustang-graze |
| mustang-graze-4 | wildlife-mustang | mustang-graze |
| mustang-alert-1 | wildlife-mustang | mustang-alert |
| mustang-alert-2 | wildlife-mustang | mustang-alert |
| mustang-alert-3 | wildlife-mustang | mustang-alert |
| mustang-alert-4 | wildlife-mustang | mustang-alert |
| mustang-gallop-1 | wildlife-mustang | mustang-gallop |
| mustang-gallop-2 | wildlife-mustang | mustang-gallop |
| mustang-gallop-3 | wildlife-mustang | mustang-gallop |
| mustang-gallop-4 | wildlife-mustang | mustang-gallop |
| mustang-gallop-5 | wildlife-mustang | mustang-gallop |
| mustang-gallop-6 | wildlife-mustang | mustang-gallop |
| mustang-gallop-7 | wildlife-mustang | mustang-gallop |
| mustang-gallop-8 | wildlife-mustang | mustang-gallop |
| steamboat-steam-1 | steamboat-steam | steamboat-steam |
| steamboat-steam-2 | steamboat-steam | steamboat-steam |
| steamboat-steam-3 | steamboat-steam | steamboat-steam |
| steamboat-steam-4 | steamboat-steam | steamboat-steam |
| steamboat-laden-1 | steamboat-laden | steamboat-laden |
| steamboat-laden-2 | steamboat-laden | steamboat-laden |
| steamboat-laden-3 | steamboat-laden | steamboat-laden |
| steamboat-laden-4 | steamboat-laden | steamboat-laden |
| town-mexican-river | town-mexican-river | State artwork; no motion required |
| presidio-spanish | presidio-spanish | State artwork; no motion required |
| village-irish-colony | village-irish-colony | State artwork; no motion required |
| ferry-landing | ferry-landing | State artwork; no motion required |
| ox-packed-walk-e-1 | ox-packed | ox-packed-walk-e |
| ox-packed-walk-e-2 | ox-packed | ox-packed-walk-e |
| ox-packed-walk-e-3 | ox-packed | ox-packed-walk-e |
| ox-packed-walk-e-4 | ox-packed | ox-packed-walk-e |
| ox-packed-walk-s-1 | ox-packed | ox-packed-walk-s |
| ox-packed-walk-s-2 | ox-packed | ox-packed-walk-s |
| ox-packed-walk-s-3 | ox-packed | ox-packed-walk-s |
| ox-packed-walk-s-4 | ox-packed | ox-packed-walk-s |
| ox-packed-walk-n-1 | ox-packed | ox-packed-walk-n |
| ox-packed-walk-n-2 | ox-packed | ox-packed-walk-n |
| ox-packed-walk-n-3 | ox-packed | ox-packed-walk-n |
| ox-packed-walk-n-4 | ox-packed | ox-packed-walk-n |
| ox-packed-idle-e | ox-packed | ox-packed-idle-e |
| ox-packed-idle-s | ox-packed | ox-packed-idle-s |
| ox-packed-idle-n | ox-packed | ox-packed-idle-n |
| ox-packed-rest-e | ox-packed | State artwork; no motion required |
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
| ferry-flatboat | ferry-flatboat | ferry-flatboat-idle |
| ferry-flatboat-laden | ferry-flatboat | ferry-flatboat-laden-idle |
| ferry-post | ferry-flatboat | State artwork; no motion required |
| steamboat-moored-1 | steamboat-moored | steamboat-moored |
| steamboat-moored-2 | steamboat-moored | steamboat-moored |
| steamboat-moored-3 | steamboat-moored | steamboat-gangplank |
| steamboat-moored-4 | steamboat-moored | steamboat-cotton-moored |
| seguin-ashes-stand | famous-seguin-ashes | seguin-ashes-collect |
| seguin-ashes-kneel | famous-seguin-ashes | seguin-ashes-collect |
| seguin-ashes-gather | famous-seguin-ashes | seguin-ashes-collect |
| seguin-ashes-rise | famous-seguin-ashes | seguin-ashes-collect |
| ash-site-small-a | alamo-ash-sites-1837 | State artwork; no motion required |
| ash-site-small-b | alamo-ash-sites-1837 | State artwork; no motion required |
| ash-site-large | alamo-ash-sites-1837 | State artwork; no motion required |
| ash-site-scooped | alamo-ash-sites-1837 | State artwork; no motion required |
| funeral-coffin-closed | seguin-funeral-props | State artwork; no motion required |
| funeral-coffin-open | seguin-funeral-props | State artwork; no motion required |
| funeral-coffin-honors | seguin-funeral-props | State artwork; no motion required |
| funeral-coffin-church-floor | seguin-funeral-props | State artwork; no motion required |
| san-fernando-floor-intact | san-fernando-1936 | State artwork; no motion required |
| san-fernando-floor-open | san-fernando-1936 | State artwork; no motion required |
| san-fernando-box-found | san-fernando-1936 | State artwork; no motion required |
| san-fernando-marble-memorial | san-fernando-1936 | State artwork; no motion required |
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
| shop-blacksmith | shop-blacksmith | State artwork; no motion required |
| shop-wheelwright | shop-wheelwright | State artwork; no motion required |
| shop-tavern | shop-tavern | State artwork; no motion required |
| shop-mill | shop-mill | State artwork; no motion required |
| shop-tanner | shop-tanner | State artwork; no motion required |
| shop-weaver | shop-weaver | State artwork; no motion required |
| shop-carpenter | shop-carpenter | State artwork; no motion required |
| shop-gunsmith | shop-gunsmith | State artwork; no motion required |
| shop-doctor | shop-doctor | State artwork; no motion required |
| shop-stockman | shop-stockman | State artwork; no motion required |
| building-frame-one-storey | town-buildings-researched | State artwork; no motion required |
| building-frame-storey-half | town-buildings-researched | State artwork; no motion required |
| building-frame-two-storey | town-buildings-researched | State artwork; no motion required |
| whiteside-hotel | town-buildings-researched | State artwork; no motion required |
| round-top-house | town-buildings-researched | State artwork; no motion required |
| round-top-house-weathered | town-buildings-researched | State artwork; no motion required |
| jacal-upright-post | town-buildings-researched | State artwork; no motion required |
| jacal-broad | town-buildings-researched | State artwork; no motion required |
| jacal-poor | town-buildings-researched | State artwork; no motion required |
| jacal-ramada | town-buildings-researched | State artwork; no motion required |
| mina-stockade | town-buildings-researched | State artwork; no motion required |
| mina-stockade-open | town-buildings-researched | State artwork; no motion required |
| liberty-court-room | town-buildings-researched | State artwork; no motion required |
| liberty-court-room-side | town-buildings-researched | State artwork; no motion required |
| building-frame-shop | town-buildings-researched | State artwork; no motion required |
| building-frame-residence | town-buildings-researched | State artwork; no motion required |
| marker-pin-rust | travel-markers | State artwork; no motion required |
| marker-pin-ink | travel-markers | State artwork; no motion required |
| marker-pin-grey | travel-markers | State artwork; no motion required |
| marker-pin-slate | travel-markers | State artwork; no motion required |
| marker-dot-rust | travel-markers | State artwork; no motion required |
| marker-dot-ink | travel-markers | State artwork; no motion required |
| marker-dot-grey | travel-markers | State artwork; no motion required |
| marker-dot-slate | travel-markers | State artwork; no motion required |
| marker-end-rust | travel-markers | State artwork; no motion required |
| marker-end-ink | travel-markers | State artwork; no motion required |
| marker-end-grey | travel-markers | State artwork; no motion required |
| marker-end-slate | travel-markers | State artwork; no motion required |
| marker-hoof-rust | travel-markers | State artwork; no motion required |
| marker-hoof-ink | travel-markers | State artwork; no motion required |
| marker-hoof-grey | travel-markers | State artwork; no motion required |
| marker-hoof-slate | travel-markers | State artwork; no motion required |
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
| post-oak-pole | trees-colonies-2 | post-oak-pole-wind |
| post-oak-log | trees-colonies-2 | post-oak-log-wind |
| post-oak-large | trees-colonies-2 | post-oak-large-wind |
| blackjack-pole | trees-colonies-2 | blackjack-pole-wind |
| blackjack-log | trees-colonies-2 | blackjack-log-wind |
| blackjack-large | trees-colonies-2 | blackjack-large-wind |
| pecan-pole | trees-colonies-2 | pecan-pole-wind |
| pecan-log | trees-colonies-2 | pecan-log-wind |
| pecan-large | trees-colonies-2 | pecan-large-wind |
| hackberry-pole | trees-colonies-2 | hackberry-pole-wind |
| hackberry-log | trees-colonies-2 | hackberry-log-wind |
| hackberry-large | trees-colonies-2 | hackberry-large-wind |
| sweetgum-pole | trees-colonies-2 | sweetgum-pole-wind |
| sweetgum-log | trees-colonies-2 | sweetgum-log-wind |
| sweetgum-large | trees-colonies-2 | sweetgum-large-wind |
| log-fallen-hardwood | trees-colonies-2 | State artwork; no motion required |
| twin-crew-rammer-carry | twin-sisters-crew | twin-crew-gun-ram, twin-crew-gun-ready, twin-crew-gun-fire |
| twin-crew-ram | twin-sisters-crew | twin-crew-gun-ram |
| twin-crew-shot-carry | twin-sisters-crew | twin-crew-gun-shot-carry |
| twin-crew-fire | twin-sisters-crew | twin-crew-gun-fire |
| regular-drummer-idle | regular-drummer | regular-drummer-start |
| regular-drummer-raise | regular-drummer | regular-drummer-start |
| regular-drummer-beat-1 | regular-drummer | regular-drummer-start, regular-drummer-beat |
| regular-drummer-beat-2 | regular-drummer | regular-drummer-beat |
| twin-sister-painted-e | twin-sisters-painted | twin-sister-painted-e-recoil |
| twin-sister-painted-recoil-e | twin-sisters-painted | twin-sister-painted-e-recoil |
| twin-sister-painted-w | twin-sisters-painted | twin-sister-painted-w-recoil |
| twin-sister-painted-recoil-w | twin-sisters-painted | twin-sister-painted-w-recoil |
| rust-wagon-driver-s | people-wagon-drivers | rust-wagon-driver-s |
| rust-wagon-driver-e | people-wagon-drivers | rust-wagon-driver-e |
| rust-wagon-driver-w | people-wagon-drivers | rust-wagon-driver-w |
| rust-wagon-driver-n | people-wagon-drivers | rust-wagon-driver-n |
| teal-wagon-driver-s | people-wagon-drivers | teal-wagon-driver-s |
| teal-wagon-driver-e | people-wagon-drivers | teal-wagon-driver-e |
| teal-wagon-driver-w | people-wagon-drivers | teal-wagon-driver-w |
| teal-wagon-driver-n | people-wagon-drivers | teal-wagon-driver-n |
| elder-wagon-driver-s | people-wagon-drivers | elder-wagon-driver-s |
| elder-wagon-driver-e | people-wagon-drivers | elder-wagon-driver-e |
| elder-wagon-driver-w | people-wagon-drivers | elder-wagon-driver-w |
| elder-wagon-driver-n | people-wagon-drivers | elder-wagon-driver-n |
| blue-wagon-driver-s | people-wagon-drivers | blue-wagon-driver-s |
| blue-wagon-driver-e | people-wagon-drivers | blue-wagon-driver-e |
| blue-wagon-driver-w | people-wagon-drivers | blue-wagon-driver-w |
| blue-wagon-driver-n | people-wagon-drivers | blue-wagon-driver-n |
| oak-broad-wind | weather-norther | State artwork; no motion required |
| oak-spreading-wind | weather-norther | State artwork; no motion required |
| pecan-wind | weather-norther | State artwork; no motion required |
| grass-tuft-wind | weather-norther | State artwork; no motion required |
| smoke-streaming | weather-norther | smoke-streaming |
| bear-forage-1 | wildlife-bear-javelina | bear-forage |
| bear-forage-2 | wildlife-bear-javelina | bear-forage |
| bear-forage-3 | wildlife-bear-javelina | bear-forage |
| bear-forage-4 | wildlife-bear-javelina | bear-forage |
| bear-alert-bound-1 | wildlife-bear-javelina | bear-alert-bound |
| bear-alert-bound-2 | wildlife-bear-javelina | bear-alert-bound |
| bear-alert-bound-3 | wildlife-bear-javelina | bear-alert-bound |
| bear-alert-bound-4 | wildlife-bear-javelina | bear-alert-bound |
| javelina-forage-1 | wildlife-bear-javelina | javelina-forage |
| javelina-forage-2 | wildlife-bear-javelina | javelina-forage |
| javelina-forage-3 | wildlife-bear-javelina | javelina-forage |
| javelina-forage-4 | wildlife-bear-javelina | javelina-forage |
| javelina-alert-run-1 | wildlife-bear-javelina | javelina-alert-run |
| javelina-alert-run-2 | wildlife-bear-javelina | javelina-alert-run |
| javelina-alert-run-3 | wildlife-bear-javelina | javelina-alert-run |
| javelina-alert-run-4 | wildlife-bear-javelina | javelina-alert-run |
| bison-idle-1 | wildlife-bison-pronghorn | bison-idle |
| bison-idle-2 | wildlife-bison-pronghorn | bison-idle |
| bison-idle-3 | wildlife-bison-pronghorn | bison-idle |
| bison-idle-4 | wildlife-bison-pronghorn | bison-idle |
| bison-run-1 | wildlife-bison-pronghorn | bison-run |
| bison-run-2 | wildlife-bison-pronghorn | bison-run |
| bison-run-3 | wildlife-bison-pronghorn | bison-run |
| bison-run-4 | wildlife-bison-pronghorn | bison-run |
| pronghorn-idle-1 | wildlife-bison-pronghorn | pronghorn-idle |
| pronghorn-idle-2 | wildlife-bison-pronghorn | pronghorn-idle |
| pronghorn-idle-3 | wildlife-bison-pronghorn | pronghorn-idle |
| pronghorn-idle-4 | wildlife-bison-pronghorn | pronghorn-idle |
| pronghorn-bound-1 | wildlife-bison-pronghorn | pronghorn-bound |
| pronghorn-bound-2 | wildlife-bison-pronghorn | pronghorn-bound |
| pronghorn-bound-3 | wildlife-bison-pronghorn | pronghorn-bound |
| pronghorn-bound-4 | wildlife-bison-pronghorn | pronghorn-bound |
| geese-rest-1 | wildlife-geese-cattle | geese-rest |
| geese-rest-2 | wildlife-geese-cattle | geese-rest |
| geese-rest-3 | wildlife-geese-cattle | geese-rest |
| geese-rest-4 | wildlife-geese-cattle | geese-rest |
| geese-flight-1 | wildlife-geese-cattle | geese-flight |
| geese-flight-2 | wildlife-geese-cattle | geese-flight |
| geese-flight-3 | wildlife-geese-cattle | geese-flight |
| geese-flight-4 | wildlife-geese-cattle | geese-flight |
| wild-cattle-graze-1 | wildlife-geese-cattle | wild-cattle-graze |
| wild-cattle-graze-2 | wildlife-geese-cattle | wild-cattle-graze |
| wild-cattle-graze-3 | wildlife-geese-cattle | wild-cattle-graze |
| wild-cattle-graze-4 | wildlife-geese-cattle | wild-cattle-graze |
| wild-cattle-run-1 | wildlife-geese-cattle | wild-cattle-run |
| wild-cattle-run-2 | wildlife-geese-cattle | wild-cattle-run |
| wild-cattle-run-3 | wildlife-geese-cattle | wild-cattle-run |
| wild-cattle-run-4 | wildlife-geese-cattle | wild-cattle-run |
| turkey-forage-1 | wildlife-turkey | turkey-forage |
| turkey-forage-2 | wildlife-turkey | turkey-forage |
| turkey-forage-3 | wildlife-turkey | turkey-forage |
| turkey-forage-4 | wildlife-turkey | turkey-forage |
| turkey-alert-1 | wildlife-turkey | turkey-alert |
| turkey-alert-2 | wildlife-turkey | turkey-alert |
| turkey-alert-3 | wildlife-turkey | turkey-alert |
| turkey-alert-4 | wildlife-turkey | turkey-alert |
| turkey-bound-1 | wildlife-turkey | turkey-bound |
| turkey-bound-2 | wildlife-turkey | turkey-bound |
| turkey-bound-3 | wildlife-turkey | turkey-bound |
| turkey-bound-4 | wildlife-turkey | turkey-bound |
| turkey-display-1 | wildlife-turkey | turkey-display |
| turkey-display-2 | wildlife-turkey | turkey-display |
| turkey-display-3 | wildlife-turkey | turkey-display |
| turkey-display-4 | wildlife-turkey | turkey-display |
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
| alamo-pyre-burning | Pose cycle | 3 | 1080 | yes | elevation; orient with structure geometry |
| cannon-18pdr-e-recoil | Pose cycle | 3 | 770 | one-shot | east |
| cannon-18pdr-w-recoil | Pose cycle | 3 | 770 | one-shot | west |
| cannon-siege-battery-e-recoil | Pose cycle | 3 | 770 | one-shot | east |
| cannon-siege-battery-w-recoil | Pose cycle | 3 | 770 | one-shot | west |
| joe-fire-door | Pose cycle | 2 | 5200 | yes | east; mirror for west |
| flag-red-wind | Pose cycle | 4 | 1590 | yes | not applicable |
| smoke-column-far-rise | Pose cycle | 4 | 1760 | yes | not applicable |
| ladder-carried-e | Pose cycle | 2 | 660 | yes | east; mirror for west |
| regular-climb | Pose cycle | 4 | 880 | yes | north/up |
| volunteer-gun-ram | Pose cycle | 4 | 1160 | one-shot | east; west by mirroring |
| volunteer-gun-shot-carry | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| volunteer-gun-fire | Pose cycle | 2 | 1060 | one-shot | east; west by mirroring |
| regular-gun-ram | Pose cycle | 4 | 1160 | one-shot | east; west by mirroring |
| regular-gun-shot-carry | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| regular-gun-fire | Pose cycle | 2 | 1060 | one-shot | east; west by mirroring |
| regular-bugler-call | Pose cycle | 4 | 1340 | one-shot | east; mirror for west |
| white-flag-regular-walk-e | Pose cycle | 2 | 560 | yes | east |
| white-flag-volunteer-walk-e | Pose cycle | 2 | 560 | yes | east |
| cane-wind | Still state | 1 | 900 | yes | not applicable |
| grass-tall-wind | Still state | 1 | 900 | yes | not applicable |
| pine-longleaf-pole-wind | sway | 1 | 3800 | yes | not applicable |
| pine-longleaf-log-wind | sway | 1 | 3800 | yes | not applicable |
| pine-longleaf-large-wind | sway | 1 | 3800 | yes | not applicable |
| palm-sabal-pole-wind | sway | 1 | 3800 | yes | not applicable |
| palm-sabal-log-wind | sway | 1 | 3800 | yes | not applicable |
| palm-sabal-large-wind | sway | 1 | 3800 | yes | not applicable |
| cypress-bald-pole-wind | sway | 1 | 3800 | yes | not applicable |
| cypress-bald-log-wind | sway | 1 | 3800 | yes | not applicable |
| cypress-bald-large-wind | sway | 1 | 3800 | yes | not applicable |
| magnolia-log-wind | sway | 1 | 3800 | yes | not applicable |
| magnolia-large-wind | sway | 1 | 3800 | yes | not applicable |
| beech-log-wind | sway | 1 | 3800 | yes | not applicable |
| beech-large-wind | sway | 1 | 3800 | yes | not applicable |
| canister-burst | Pose cycle | 4 | 820 | one-shot | east; mirror for west |
| cannon-cartwheels-e-recoil | Pose cycle | 3 | 760 | one-shot | east |
| cannon-cartwheels-w-recoil | Pose cycle | 3 | 760 | one-shot | west |
| cannon-sixpounder-e-recoil | Pose cycle | 3 | 760 | one-shot | east |
| cannon-sixpounder-w-recoil | Pose cycle | 3 | 760 | one-shot | west |
| carreta-travel-e | Pose cycle | 4 | 980 | yes | east; west by mirroring |
| carreta-travel-s | Pose cycle | 4 | 980 | yes | south |
| carreta-travel-n | Pose cycle | 4 | 980 | yes | north |
| rust-woman-carry | Pose cycle | 4 | 760 | yes | east; west by mirroring |
| indigo-carry | Pose cycle | 4 | 760 | yes | east; west by mirroring |
| ochre-carry | Pose cycle | 4 | 760 | yes | east; west by mirroring |
| blue-girl-carry | Pose cycle | 4 | 760 | yes | east; west by mirroring |
| rust-woman-speak | Pose cycle | 2 | 1650 | yes | east; west by mirroring |
| rust-woman-listen-s | breathe | 1 | 2200 | yes | south |
| rust-woman-listen-n | breathe | 1 | 2200 | yes | north |
| indigo-speak | Pose cycle | 2 | 1650 | yes | east; west by mirroring |
| indigo-listen-s | breathe | 1 | 2200 | yes | south |
| indigo-listen-n | breathe | 1 | 2200 | yes | north |
| ochre-speak | Pose cycle | 2 | 1650 | yes | east; west by mirroring |
| ochre-listen-s | breathe | 1 | 2200 | yes | south |
| ochre-listen-n | breathe | 1 | 2200 | yes | north |
| blue-girl-speak | Pose cycle | 2 | 1650 | yes | east; west by mirroring |
| blue-girl-listen-s | breathe | 1 | 2200 | yes | south |
| blue-girl-listen-n | breathe | 1 | 2200 | yes | north |
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
| rust-woman-walk-s | Pose cycle | 2 | 440 | yes | south |
| rust-woman-walk-n | Pose cycle | 2 | 440 | yes | north |
| indigo-walk-s | Pose cycle | 2 | 440 | yes | south |
| indigo-walk-n | Pose cycle | 2 | 440 | yes | north |
| ochre-walk-s | Pose cycle | 2 | 440 | yes | south |
| ochre-walk-n | Pose cycle | 2 | 440 | yes | north |
| blue-girl-walk-s | Pose cycle | 2 | 440 | yes | south |
| blue-girl-walk-n | Pose cycle | 2 | 440 | yes | north |
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
| cart-baggage-tip | Pose cycle | 4 | 2650 | one-shot | east; mirror for west |
| bonham-walk-e | Pose cycle | 4 | 760 | yes | east |
| bonham-walk-s | Pose cycle | 2 | 580 | yes | south |
| bonham-walk-n | Pose cycle | 2 | 580 | yes | north |
| almeron-dickinson-walk-e | Pose cycle | 4 | 760 | yes | east |
| almeron-dickinson-walk-s | Pose cycle | 2 | 580 | yes | south |
| almeron-dickinson-walk-n | Pose cycle | 2 | 580 | yes | north |
| seguin-walk-e | Pose cycle | 4 | 760 | yes | east |
| seguin-walk-s | Pose cycle | 2 | 580 | yes | south |
| seguin-walk-n | Pose cycle | 2 | 580 | yes | north |
| susanna-dickinson-walk-e | Pose cycle | 4 | 760 | yes | east |
| susanna-dickinson-walk-s | Pose cycle | 2 | 580 | yes | south |
| susanna-dickinson-walk-n | Pose cycle | 2 | 580 | yes | north |
| angelina-dickinson-reach | Pose cycle | 2 | 1800 | yes | front / east |
| alavez-walk-e | Pose cycle | 4 | 760 | yes | east |
| alavez-walk-s | Pose cycle | 2 | 580 | yes | south |
| alavez-walk-n | Pose cycle | 2 | 580 | yes | north |
| almonte-walk-e | Pose cycle | 4 | 760 | yes | east |
| almonte-walk-s | Pose cycle | 2 | 580 | yes | south |
| almonte-walk-n | Pose cycle | 2 | 580 | yes | north |
| twin-sisters-limbered | Pose cycle | 2 | 600 | yes | east; mirror for west |
| ben-walk-e | Pose cycle | 4 | 760 | yes | east |
| ben-walk-s | Pose cycle | 2 | 580 | yes | south |
| ben-walk-n | Pose cycle | 2 | 580 | yes | north |
| milam-walk-e | Pose cycle | 4 | 760 | yes | east |
| milam-walk-s | Pose cycle | 2 | 580 | yes | south |
| milam-walk-n | Pose cycle | 2 | 580 | yes | north |
| fannin-walk-e | Pose cycle | 4 | 760 | yes | east |
| fannin-walk-s | Pose cycle | 2 | 580 | yes | south |
| fannin-walk-n | Pose cycle | 2 | 580 | yes | north |
| burleson-walk-e | Pose cycle | 4 | 760 | yes | east |
| burleson-walk-s | Pose cycle | 2 | 580 | yes | south |
| burleson-walk-n | Pose cycle | 2 | 580 | yes | north |
| burleson-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| castaneda-walk-e | Pose cycle | 4 | 760 | yes | east |
| castaneda-walk-s | Pose cycle | 2 | 580 | yes | south |
| castaneda-walk-n | Pose cycle | 2 | 580 | yes | north |
| castaneda-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| castrillon-walk-e | Pose cycle | 2 | 540 | yes | east |
| castrillon-fall | Pose cycle | 3 | 700 | one-shot | east; mirror for west |
| cos-walk-e | Pose cycle | 4 | 760 | yes | east |
| cos-walk-s | Pose cycle | 2 | 580 | yes | south |
| cos-walk-n | Pose cycle | 2 | 580 | yes | north |
| cos-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| crockett-captive | Pose cycle | 2 | 3100 | yes | east; mirror for west |
| esparza-walk-e | Pose cycle | 4 | 760 | yes | east |
| esparza-walk-s | Pose cycle | 2 | 580 | yes | south |
| esparza-walk-n | Pose cycle | 2 | 580 | yes | north |
| houston-mounted-walk-e | Pose cycle | 2 | 640 | yes | east |
| santa-anna-mounted-walk-e | Pose cycle | 2 | 640 | yes | east |
| crockett-walk-e | Pose cycle | 4 | 760 | yes | east |
| crockett-walk-s | Pose cycle | 2 | 580 | yes | south |
| crockett-walk-n | Pose cycle | 2 | 580 | yes | north |
| travis-walk-e | Pose cycle | 4 | 760 | yes | east |
| travis-walk-s | Pose cycle | 2 | 580 | yes | south |
| travis-walk-n | Pose cycle | 2 | 580 | yes | north |
| bowie-walk-e | Pose cycle | 4 | 760 | yes | east |
| bowie-walk-s | Pose cycle | 2 | 580 | yes | south |
| bowie-walk-n | Pose cycle | 2 | 580 | yes | north |
| emily-west-walk-e | Pose cycle | 4 | 760 | yes | east |
| emily-west-walk-s | Pose cycle | 2 | 580 | yes | south |
| emily-west-walk-n | Pose cycle | 2 | 580 | yes | north |
| santa-anna-walk-e | Pose cycle | 4 | 760 | yes | east |
| santa-anna-walk-s | Pose cycle | 2 | 580 | yes | south |
| santa-anna-walk-n | Pose cycle | 2 | 580 | yes | north |
| houston-walk-e | Pose cycle | 4 | 760 | yes | east |
| houston-walk-s | Pose cycle | 2 | 580 | yes | south |
| houston-walk-n | Pose cycle | 2 | 580 | yes | north |
| emily-west-picnic-converse | Pose cycle | 4 | 4300 | yes | west-facing at a camp table |
| santa-anna-picnic-converse | Pose cycle | 3 | 3450 | yes | east-facing at a camp chair |
| santa-anna-picnic-alarm | Pose cycle | 2 | 1750 | one-shot | east-facing; turns toward the battle |
| flag-come-and-take-it-wind | Pose cycle | 4 | 2700 | yes | not applicable |
| prisoner-walk-e | Pose cycle | 4 | 840 | yes | east |
| prisoner-walk-s | Pose cycle | 2 | 600 | yes | south |
| prisoner-walk-n | Pose cycle | 2 | 600 | yes | north |
| teal-paint | Pose cycle | 2 | 1520 | yes | east; west by mirroring |
| indigo-paint | Pose cycle | 2 | 1520 | yes | east; west by mirroring |
| blue-girl-paint | Pose cycle | 2 | 1520 | yes | east; west by mirroring |
| rust-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| teal-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| elder-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| blue-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| rust-ride-s | Pose cycle | 4 | 920 | yes | south |
| teal-ride-s | Pose cycle | 4 | 920 | yes | south |
| elder-ride-s | Pose cycle | 4 | 920 | yes | south |
| blue-ride-s | Pose cycle | 4 | 920 | yes | south |
| rust-ride-n | Pose cycle | 4 | 920 | yes | north |
| teal-ride-n | Pose cycle | 4 | 920 | yes | north |
| elder-ride-n | Pose cycle | 4 | 920 | yes | north |
| blue-ride-n | Pose cycle | 4 | 920 | yes | north |
| rust-woman-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| indigo-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| ochre-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| blue-girl-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| rust-woman-ride-s | Pose cycle | 4 | 920 | yes | south |
| indigo-ride-s | Pose cycle | 4 | 920 | yes | south |
| ochre-ride-s | Pose cycle | 4 | 920 | yes | south |
| blue-girl-ride-s | Pose cycle | 4 | 920 | yes | south |
| rust-woman-ride-n | Pose cycle | 4 | 920 | yes | north |
| indigo-ride-n | Pose cycle | 4 | 920 | yes | north |
| ochre-ride-n | Pose cycle | 4 | 920 | yes | north |
| blue-girl-ride-n | Pose cycle | 4 | 920 | yes | north |
| mustang-graze | Pose cycle | 4 | 2480 | yes | east; west by mirroring |
| mustang-alert | Pose cycle | 4 | 2080 | yes | east; west by mirroring |
| mustang-gallop | Pose cycle | 8 | 1080 | yes | east; west by mirroring |
| steamboat-steam | Pose cycle | 4 | 1320 | yes | east; west by mirroring |
| steamboat-laden | Pose cycle | 4 | 1440 | yes | east; west by mirroring |
| ox-packed-walk-e | Pose cycle | 4 | 960 | yes | east |
| ox-packed-idle-e | breathe | 1 | 2700 | yes | east |
| ox-packed-walk-s | Pose cycle | 4 | 960 | yes | south |
| ox-packed-idle-s | breathe | 1 | 2700 | yes | south |
| ox-packed-walk-n | Pose cycle | 4 | 960 | yes | north |
| ox-packed-idle-n | breathe | 1 | 2700 | yes | north |
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
| ferry-flatboat-idle | rock | 1 | 3400 | yes | east; west by mirroring |
| ferry-flatboat-laden-idle | rock | 1 | 3400 | yes | east; west by mirroring |
| steamboat-moored | Pose cycle | 2 | 2200 | yes | east; west by mirroring |
| steamboat-gangplank | Still state | 1 | 1600 | yes | east; west by mirroring |
| steamboat-cotton-moored | drift | 1 | 1600 | yes | east; west by mirroring |
| seguin-ashes-collect | Pose cycle | 4 | 3850 | one-shot | east; mirror for west |
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
| post-oak-pole-wind | sway | 1 | 3800 | yes | not applicable |
| post-oak-log-wind | sway | 1 | 3800 | yes | not applicable |
| post-oak-large-wind | sway | 1 | 3800 | yes | not applicable |
| blackjack-pole-wind | sway | 1 | 3800 | yes | not applicable |
| blackjack-log-wind | sway | 1 | 3800 | yes | not applicable |
| blackjack-large-wind | sway | 1 | 3800 | yes | not applicable |
| pecan-pole-wind | sway | 1 | 3800 | yes | not applicable |
| pecan-log-wind | sway | 1 | 3800 | yes | not applicable |
| pecan-large-wind | sway | 1 | 3800 | yes | not applicable |
| hackberry-pole-wind | sway | 1 | 3800 | yes | not applicable |
| hackberry-log-wind | sway | 1 | 3800 | yes | not applicable |
| hackberry-large-wind | sway | 1 | 3800 | yes | not applicable |
| sweetgum-pole-wind | sway | 1 | 3800 | yes | not applicable |
| sweetgum-log-wind | sway | 1 | 3800 | yes | not applicable |
| sweetgum-large-wind | sway | 1 | 3800 | yes | not applicable |
| twin-crew-gun-ram | Pose cycle | 3 | 1030 | one-shot | east; mirror for west |
| twin-crew-gun-shot-carry | Still state | 1 | 360 | one-shot | east; mirror for west |
| twin-crew-gun-ready | Still state | 1 | 360 | one-shot | east; mirror for west |
| twin-crew-gun-fire | Pose cycle | 3 | 860 | one-shot | east; mirror for west |
| regular-drummer-start | Pose cycle | 3 | 750 | one-shot | east; mirror for west |
| regular-drummer-beat | Pose cycle | 2 | 480 | yes | east; mirror for west |
| twin-sister-painted-e-recoil | Pose cycle | 3 | 760 | one-shot | east |
| twin-sister-painted-w-recoil | Pose cycle | 3 | 760 | one-shot | west |
| rust-wagon-driver-s | breathe | 1 | 2200 | yes | south |
| rust-wagon-driver-e | breathe | 1 | 2200 | yes | east |
| rust-wagon-driver-w | breathe | 1 | 2200 | yes | west |
| rust-wagon-driver-n | breathe | 1 | 2200 | yes | north |
| teal-wagon-driver-s | breathe | 1 | 2200 | yes | south |
| teal-wagon-driver-e | breathe | 1 | 2200 | yes | east |
| teal-wagon-driver-w | breathe | 1 | 2200 | yes | west |
| teal-wagon-driver-n | breathe | 1 | 2200 | yes | north |
| elder-wagon-driver-s | breathe | 1 | 2200 | yes | south |
| elder-wagon-driver-e | breathe | 1 | 2200 | yes | east |
| elder-wagon-driver-w | breathe | 1 | 2200 | yes | west |
| elder-wagon-driver-n | breathe | 1 | 2200 | yes | north |
| blue-wagon-driver-s | breathe | 1 | 2200 | yes | south |
| blue-wagon-driver-e | breathe | 1 | 2200 | yes | east |
| blue-wagon-driver-w | breathe | 1 | 2200 | yes | west |
| blue-wagon-driver-n | breathe | 1 | 2200 | yes | north |
| oak-broad-wind | sway | 1 | 3800 | yes | not applicable |
| oak-spreading-wind | sway | 1 | 3800 | yes | not applicable |
| pecan-wind | sway | 1 | 3800 | yes | not applicable |
| grass-tuft-wind | sway | 1 | 3800 | yes | not applicable |
| smoke-streaming | drift | 1 | 1100 | yes | not applicable |
| bear-forage | Pose cycle | 4 | 2080 | yes | east; west by mirroring |
| bear-alert-bound | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| javelina-forage | Pose cycle | 4 | 1920 | yes | east; west by mirroring |
| javelina-alert-run | Pose cycle | 4 | 680 | yes | east; west by mirroring |
| bison-idle | Pose cycle | 4 | 2880 | yes | east; west by mirroring |
| bison-run | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| pronghorn-idle | Pose cycle | 4 | 2720 | yes | east; west by mirroring |
| pronghorn-bound | Pose cycle | 4 | 660 | yes | east; west by mirroring |
| geese-rest | Pose cycle | 4 | 2240 | yes | east-oriented flock; state cycle, no translation |
| geese-flight | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| wild-cattle-graze | Pose cycle | 4 | 2720 | yes | east; west by mirroring |
| wild-cattle-run | Pose cycle | 4 | 760 | yes | east; west by mirroring |
| turkey-forage | Pose cycle | 4 | 1440 | yes | east; west by mirroring |
| turkey-alert | Pose cycle | 4 | 1440 | yes | east; west by mirroring |
| turkey-bound | Pose cycle | 4 | 600 | yes | east; west by mirroring |
| turkey-display | Pose cycle | 4 | 1040 | yes | east; west by mirroring |
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
| cottonwood-wind | sway | 1 | 3800 | yes | not applicable |
| sapling-wind | sway | 1 | 3800 | yes | not applicable |
| reeds-wind | sway | 1 | 3800 | yes | not applicable |
| scrub-wind | sway | 1 | 3800 | yes | not applicable |
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
- **Families and riders:** The rider dismounting, remounting and talking on foot beside a tethered horse (courier-dismount is delivered and not yet bound); seated ox-wagon driver layers for the second cast (rust-woman, indigo, ochre, blue-girl) and for the children, who are still the standing figure cut at the hip; a child on the family horse, which is still that same composite; layered people for the chosen looks.
- **Animals:** The rest of the game of 1836 (bear, javelina, antelope, buffalo, geese, wild cattle), which is words only until each lands; cream ox/grey horse/sheep/chicken locomotion, other livestock grazing and drinking, flight and load/harness behavior. Do not substitute a different coat mid-journey.
- **Cannons and soldiers:** Limber/unlimber, elevated aim, mounted firing and remounting. Gun recoil is whole-carriage translation, not an articulated barrel rig.
- **Buildings and environment:** Continuous door/gate hinge rig, construction/repair progression, crown-only tree rig, boat rowing/poling and ferry loading. The Yellow Stone under way landed 2026-09-21: the army-laden loop is drawn at the Brazos crossing, and the empty-deck loop is registered and drawn by nothing, because no projected state has her steaming light. Building stillness is intentional; condition changes require simulation state.
- **Production finish:** Generated pose proportions can drift between sheets. Hand-register additional transitions and final cast/period uniform variants as the game defines them. These are prototype assets, not exact historical portraits.

## Excluded art

The first cell of `fortifications.png` depicts a later rounded facade. It has no sprite ID and is never drawn. Use `roofless-church-shell` for a schematic 1836 Alamo. The unchanged source PNG is retained for provenance.
