# Complete art manifest

Generated from the shipped library: **6383 usable sprites, 456 PNG atlases, 2102 clips** (1693 pose cycles; 4 layered rigs).

Read [ASSETS.md](ASSETS.md) for integration. The complete machine-readable inventory is [manifest.json](../public/assets/frontier-v1/manifest.json); every frame, clip, duration, anchor, direction, rig part, checksum, location kit and exclusion is indexed there. Rebuild with `npm run build:art`.

These are reusable prototype pieces, not completed later scenarios. Static buildings/props are intentional. Pending action coverage is explicit below. Open `/art-catalog.html` to play, scrub, pause and inspect every frame on different backgrounds.

Assemblies: [Béxar town](BEXAR_ASSEMBLY.md) and [complete Alamo](ALAMO_LAYOUT.md) share the same compound geometry. The machine-readable manifest includes every town building, tree, plaza, road and its Alamo transform.

## Atlas inventory

| Atlas | Frames | Size | PNG bytes |
| --- | ---: | --- | ---: |
| alamo-parapet-service | 16 | 1445 × 1088 | 875186 |
| people-alamo-travis-service | 16 | 1536 × 1024 | 1708385 |
| alamo-volunteer-trot | 12 | 1448 × 1086 | 1426623 |
| alamo-upright-lancer-e | 8 | 1536 × 1024 | 2200872 |
| alamo-upright-lancer-s | 8 | 1536 × 1024 | 1961648 |
| alamo-upright-lancer-n | 8 | 1536 × 1024 | 1819250 |
| alamo-battery-guns | 8 | 1774 × 887 | 1370425 |
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
| army-camp-props | 8 | 1774 × 887 | 1426807 |
| army-camp-pennants | 4 | 1254 × 1254 | 853822 |
| artillery-service | 16 | 1254 × 1254 | 1171440 |
| volunteer-bank-actions | 6 | 1536 × 1024 | 1560397 |
| white-flag-regular | 4 | 1262 × 1246 | 786638 |
| white-flag-volunteer | 4 | 1262 × 1246 | 816882 |
| regular-bugler | 4 | 1262 × 1246 | 691857 |
| regular-loophole-actions | 4 | 1536 × 1024 | 1487360 |
| bexar-townsfolk | 16 | 1264 × 1244 | 1190200 |
| bexar-san-fernando | 1 | 1536 × 1024 | 2150927 |
| bexar-governors-palace | 1 | 1774 × 887 | 1812505 |
| biome-ground-bexar | 16 | 1254 × 1254 | 2215982 |
| biome-species | 6 | 1024 × 1536 | 2927386 |
| biome-species-gales | 12 | 1536 × 1024 | 3061669 |
| biome-pine-palm-gale | 12 | 1445 × 1089 | 873328 |
| biome-cypress-gale | 6 | 1024 × 1536 | 2205619 |
| biome-broadleaf-gale | 8 | 1774 × 887 | 1022515 |
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
| cast2-drivers-women | 16 | 1254 × 1254 | 1167338 |
| cast2-drivers-youth | 16 | 1254 × 1254 | 1067911 |
| people-cast2-walk | 16 | 1254 × 1254 | 1288383 |
| people-cast2-work | 16 | 1254 × 1254 | 1279315 |
| people-cast2-idle | 16 | 1254 × 1254 | 1103935 |
| dragoon-carbine-actions | 4 | 1278 × 1230 | 1451179 |
| lancer-charge | 4 | 1536 × 1024 | 2066034 |
| child-passenger-girl | 6 | 1024 × 1536 | 1794084 |
| child-passenger-boy | 6 | 1024 × 1536 | 1728330 |
| child-passenger-smallchild | 6 | 1024 × 1536 | 1718795 |
| children-dialogue | 12 | 1448 × 1086 | 933507 |
| icons-children | 6 | 1254 × 1254 | 874710 |
| people-children-vertical | 12 | 1254 × 1254 | 1163980 |
| people-children-idle | 16 | 1254 × 1254 | 1351105 |
| people-children-walk | 12 | 1254 × 1254 | 1127437 |
| people-children-care | 12 | 1254 × 1254 | 1425070 |
| land-clearing | 16 | 1254 × 1254 | 904975 |
| coleto-baggage-cart | 4 | 1254 × 1254 | 1333345 |
| regular-prone-actions | 4 | 1536 × 1024 | 1506423 |
| colony-hardwoods | 8 | 1774 × 887 | 2641448 |
| colony-oak-gales | 8 | 1774 × 887 | 2716648 |
| colony-compound-gales | 6 | 1024 × 1536 | 3090731 |
| concepcion-mission | 1 | 1254 × 1254 | 1786319 |
| concepcion-bank-terrain | 6 | 1448 × 1086 | 2158290 |
| concepcion-limber-riders | 12 | 1448 × 1086 | 1475077 |
| concepcion-aftercare | 12 | 1448 × 1086 | 881095 |
| conifer-gale | 12 | 1448 × 1086 | 1381008 |
| fallen-transport | 8 | 1536 × 1024 | 1987719 |
| icons-family-actions-1 | 16 | 1254 × 1254 | 2324769 |
| icons-family-actions-2 | 13 | 1254 × 1254 | 1706833 |
| icons-family-service | 16 | 1254 × 1254 | 1771565 |
| icons-family-subsistence | 8 | 1774 × 887 | 2248974 |
| people-family-mother-scarf | 16 | 1254 × 1254 | 1353965 |
| people-family-father-straw | 16 | 1254 × 1254 | 1351306 |
| people-family-father-beard | 16 | 1254 × 1254 | 1206234 |
| people-family-father-moustache | 16 | 1254 × 1254 | 1208170 |
| people-family-mother-braid | 16 | 1254 × 1254 | 1282847 |
| people-family-mother-loose | 16 | 1254 × 1254 | 1288223 |
| people-family-mother-straw | 16 | 1254 × 1254 | 1437175 |
| people-family-youth-boy | 16 | 1254 × 1254 | 1278306 |
| people-family-youth-girl | 16 | 1254 × 1254 | 1537178 |
| people-family-father-hat | 16 | 1254 × 1254 | 1292458 |
| family-panel-marks | 6 | 1286 × 1223 | 985678 |
| family-portraits | 12 | 1448 × 1086 | 1237816 |
| rig-adult-male-locomotion | 96 | 1254 × 1254 | 1165962 |
| rig-adult-male-work | 128 | 1254 × 1254 | 1059244 |
| rig-adult-male-service | 128 | 1254 × 1254 | 1155951 |
| rig-adult-male-saddle | 96 | 1254 × 1254 | 1258300 |
| rig-adult-female-locomotion | 96 | 1254 × 1254 | 958938 |
| rig-adult-female-work | 128 | 1254 × 1254 | 656543 |
| rig-adult-female-service | 128 | 1254 × 1254 | 676105 |
| rig-adult-female-saddle | 96 | 1254 × 1254 | 1249516 |
| rig-youth-male-locomotion | 36 | 1254 × 1254 | 865420 |
| rig-youth-male-work | 48 | 1254 × 1254 | 1164474 |
| rig-youth-male-service | 48 | 1254 × 1254 | 1218231 |
| rig-youth-male-saddle | 36 | 1536 × 1024 | 1849444 |
| rig-youth-female-locomotion | 36 | 1254 × 1254 | 1086252 |
| rig-youth-female-work | 48 | 1254 × 1254 | 1290503 |
| rig-youth-female-service | 48 | 1254 × 1254 | 772752 |
| rig-youth-female-saddle | 36 | 1254 × 1254 | 1444093 |
| rig-child-male-locomotion | 24 | 1254 × 1254 | 904071 |
| rig-child-male-work | 32 | 1254 × 1254 | 706233 |
| rig-child-male-service | 32 | 1254 × 1254 | 1288694 |
| rig-child-male-saddle | 24 | 1402 × 1122 | 1069566 |
| rig-child-female-locomotion | 24 | 1254 × 1254 | 1102872 |
| rig-child-female-work | 32 | 1254 × 1254 | 1117097 |
| rig-child-female-service | 32 | 1254 × 1254 | 1254149 |
| rig-child-female-saddle | 24 | 1254 × 1254 | 1487559 |
| rig-smallchild-locomotion | 24 | 1448 × 1086 | 976296 |
| rig-smallchild-work | 32 | 1254 × 1254 | 715296 |
| rig-smallchild-service | 32 | 1254 × 1254 | 1223881 |
| rig-infant-body | 24 | 1254 × 1254 | 1142277 |
| rig-heads-cast1 | 16 | 1254 × 1254 | 1570747 |
| rig-heads-cast2 | 16 | 1254 × 1254 | 1345830 |
| rig-heads-fathers | 16 | 1254 × 1254 | 1427967 |
| rig-heads-mothers | 16 | 1254 × 1254 | 853732 |
| rig-heads-young | 16 | 1254 × 1254 | 1508461 |
| rig-heads-little | 8 | 1774 × 887 | 1094619 |
| rig-covered-patients | 60 | 1254 × 1254 | 1020502 |
| family-transport-components | 264 | 1774 × 887 | 1241143 |
| rig-camp-grown | 88 | 1254 × 1254 | 1271291 |
| rig-camp-children | 32 | 1254 × 1254 | 1216730 |
| rig-adult-male-mounted-service | 96 | 1254 × 1254 | 1058362 |
| rig-adult-female-mounted-service | 96 | 1254 × 1254 | 628277 |
| rig-youth-male-mounted-service | 36 | 1536 × 1024 | 1576577 |
| rig-youth-female-mounted-service | 36 | 1254 × 1254 | 1080631 |
| rig-capture-poses | 60 | 1254 × 1254 | 1014174 |
| rig-sow-poses | 60 | 1254 × 1254 | 713981 |
| rig-harvest-poses | 60 | 1254 × 1254 | 1305832 |
| adult-passengers-cast1 | 24 | 1215 × 1295 | 813456 |
| adult-passengers-cast2 | 24 | 1263 × 1246 | 858586 |
| family-infant-walk-rust-woman | 12 | 1448 × 1086 | 977086 |
| family-infant-walk-indigo | 12 | 1536 × 1024 | 1904698 |
| family-infant-walk-ochre | 12 | 1536 × 1024 | 1813025 |
| family-infant-walk-blue-girl | 12 | 1536 × 1024 | 1903942 |
| family-infant-walk-rust | 12 | 1536 × 1024 | 1866164 |
| wagon-cover-drawn-back | 8 | 1774 × 887 | 840373 |
| famous-bonham | 16 | 1254 × 1254 | 1241019 |
| famous-almeron-dickinson | 16 | 1254 × 1254 | 905031 |
| famous-seguin | 16 | 1254 × 1254 | 1147292 |
| famous-susanna-dickinson | 16 | 1254 × 1254 | 1461496 |
| famous-angelina-dickinson | 4 | 1254 × 1254 | 1286027 |
| famous-alavez | 16 | 1254 × 1254 | 1276763 |
| famous-almonte | 16 | 1254 × 1254 | 1260800 |
| famous-austin | 16 | 1254 × 1254 | 1051380 |
| famous-barragan | 16 | 1254 × 1254 | 1356807 |
| famous-ben | 16 | 1312 × 1199 | 1136424 |
| twin-sisters-limbered | 4 | 1254 × 1254 | 1010968 |
| famous-milam | 16 | 1254 × 1254 | 1519856 |
| famous-fannin | 16 | 1254 × 1254 | 1306380 |
| famous-burleson | 16 | 1254 × 1254 | 1243988 |
| famous-burleson-mounted | 4 | 1254 × 1254 | 1242276 |
| famous-castaneda | 16 | 1254 × 1254 | 1167969 |
| famous-castaneda-mounted | 4 | 1226 × 1283 | 1274697 |
| famous-castrillon-cardinal | 4 | 1254 × 1254 | 874785 |
| famous-castrillon-crate | 4 | 1254 × 1254 | 1019844 |
| famous-castrillon | 4 | 1254 × 1254 | 925993 |
| famous-castrillon-fate | 4 | 1254 × 1254 | 975586 |
| famous-condelle | 16 | 1254 × 1254 | 1294935 |
| famous-cos | 16 | 1254 × 1254 | 1237092 |
| famous-cos-mounted | 4 | 1226 × 1283 | 1307008 |
| famous-crockett-fate | 4 | 1254 × 1254 | 948322 |
| famous-deaf-smith | 16 | 1254 × 1254 | 1316988 |
| famous-deaf-smith-mounted | 4 | 1254 × 1254 | 1298123 |
| famous-esparza | 16 | 1254 × 1254 | 869799 |
| famous-travis-foot-cardinal-v2 | 4 | 1266 × 1242 | 806349 |
| famous-crockett-foot-cardinal-v2 | 4 | 1254 × 1254 | 940486 |
| famous-bowie-foot-cardinal-v2 | 4 | 1254 × 1254 | 789172 |
| famous-fannin-foot-cardinal-v2 | 4 | 1254 × 1254 | 845083 |
| famous-milam-foot-cardinal-v2 | 4 | 1254 × 1254 | 1102668 |
| famous-ben-foot-cardinal-v2 | 4 | 1254 × 1254 | 891817 |
| famous-neill-field-gestures | 4 | 1254 × 1254 | 1112678 |
| famous-karnes-field-gestures | 4 | 1310 × 1201 | 977747 |
| famous-hockley-field-gestures | 4 | 1287 × 1222 | 985605 |
| famous-lamar-field-gestures | 4 | 1312 × 1199 | 851184 |
| famous-sherman-field-gestures | 4 | 1240 × 1269 | 1063729 |
| famous-rusk-field-gestures | 4 | 1312 × 1199 | 946322 |
| famous-travis-gestures | 4 | 1254 × 1254 | 882290 |
| famous-houston-gestures | 4 | 1254 × 1254 | 891705 |
| famous-santa-anna-gestures | 4 | 1254 × 1254 | 896923 |
| famous-austin-gestures | 4 | 1254 × 1254 | 845901 |
| famous-moore-gestures | 4 | 1254 × 1254 | 1032551 |
| famous-almonte-gestures | 4 | 1254 × 1254 | 960703 |
| famous-burleson-gestures | 4 | 1254 × 1254 | 1055005 |
| famous-cos-gestures | 4 | 1254 × 1254 | 934593 |
| famous-urrea-gestures | 4 | 1254 × 1254 | 835148 |
| famous-castaneda-gestures | 4 | 1254 × 1254 | 929899 |
| famous-grant | 16 | 1225 × 1284 | 1191949 |
| famous-grant-mounted | 4 | 1254 × 1254 | 1312009 |
| famous-grant-gallop | 4 | 1254 × 1254 | 1154800 |
| famous-hockley | 16 | 1246 × 1262 | 904693 |
| famous-johnson | 16 | 1312 × 1199 | 1121505 |
| famous-karnes | 16 | 1246 × 1263 | 1230841 |
| famous-karnes-mounted | 4 | 1246 × 1263 | 1175856 |
| famous-lamar | 16 | 1312 × 1199 | 847578 |
| famous-lamar-mounted | 4 | 1312 × 1199 | 1099794 |
| famous-mcculloch | 16 | 1330 × 1182 | 1041853 |
| famous-moore | 16 | 1254 × 1254 | 1092408 |
| famous-smither-mounted-cardinal | 4 | 1254 × 1254 | 869960 |
| famous-jw-smith-mounted-cardinal | 4 | 1254 × 1254 | 852204 |
| famous-horton-mounted-cardinal | 4 | 1254 × 1254 | 865057 |
| famous-kimbell-mounted-cardinal | 4 | 1254 × 1254 | 932698 |
| famous-martin-mounted-cardinal | 4 | 1254 × 1254 | 934699 |
| famous-cos-mounted-cardinal | 4 | 1226 × 1283 | 874302 |
| famous-urrea-mounted-cardinal | 4 | 1226 × 1283 | 766765 |
| famous-castaneda-mounted-cardinal | 4 | 1226 × 1283 | 826716 |
| famous-houston-mounted-cardinal | 4 | 1254 × 1254 | 899605 |
| famous-santa-anna-mounted-cardinal | 4 | 1226 × 1283 | 825560 |
| famous-burleson-mounted-cardinal | 4 | 1254 × 1254 | 840561 |
| famous-grant-mounted-cardinal | 4 | 1254 × 1254 | 885057 |
| famous-houston-mounted | 4 | 1254 × 1254 | 1158924 |
| famous-santa-anna-mounted | 4 | 1226 × 1283 | 1192703 |
| famous-neill | 16 | 1246 × 1263 | 1260451 |
| famous-crockett | 16 | 1254 × 1254 | 1237962 |
| famous-travis | 16 | 1254 × 1254 | 1163935 |
| famous-bowie | 16 | 1254 × 1254 | 1280882 |
| famous-emily-west | 16 | 1254 × 1254 | 1334869 |
| famous-santa-anna | 16 | 1254 × 1254 | 1194798 |
| famous-houston | 16 | 1254 × 1254 | 1300269 |
| famous-emily-west-picnic | 4 | 1254 × 1254 | 1381954 |
| famous-santa-anna-picnic | 4 | 1254 × 1254 | 1236551 |
| famous-picnic-props | 4 | 1254 × 1254 | 1557526 |
| famous-jw-smith | 16 | 1254 × 1254 | 1449196 |
| famous-jw-smith-mounted | 4 | 1254 × 1254 | 1287878 |
| famous-horton | 16 | 1254 × 1254 | 1431695 |
| famous-horton-mounted | 4 | 1254 × 1254 | 1366983 |
| famous-kimbell | 16 | 1254 × 1254 | 1435124 |
| famous-kimbell-mounted | 4 | 1254 × 1254 | 1330420 |
| famous-martin | 16 | 1254 × 1254 | 1408204 |
| famous-martin-mounted | 4 | 1254 × 1254 | 1461956 |
| famous-rusk | 16 | 1312 × 1199 | 1052054 |
| famous-rusk-mounted | 4 | 1312 × 1199 | 1471219 |
| famous-sanchez-navarro | 16 | 1254 × 1254 | 1303243 |
| famous-deaf-smith-mounted-cardinal | 4 | 1254 × 1254 | 857178 |
| famous-karnes-mounted-cardinal | 4 | 1246 × 1263 | 791766 |
| famous-lamar-mounted-cardinal | 4 | 1312 × 1199 | 733744 |
| famous-sherman-mounted-cardinal | 4 | 1240 × 1269 | 813963 |
| famous-rusk-mounted-cardinal | 4 | 1312 × 1199 | 775666 |
| famous-seguin-mounted-motion | 4 | 1254 × 1254 | 1217137 |
| famous-seguin-mounted-ns | 4 | 1254 × 1254 | 798415 |
| famous-sherman | 16 | 1239 × 1269 | 1115350 |
| famous-sherman-mounted | 4 | 1240 × 1269 | 1426561 |
| famous-smither | 16 | 1254 × 1254 | 1300657 |
| famous-smither-mounted | 4 | 1254 × 1254 | 1401379 |
| famous-fannin-story-actions | 4 | 1254 × 1254 | 1048552 |
| famous-milam-story-actions | 4 | 1254 × 1254 | 1203673 |
| famous-crockett-story-actions | 4 | 1254 × 1254 | 1215175 |
| famous-bowie-story-actions | 4 | 1254 × 1254 | 1263291 |
| famous-alavez-story-actions | 4 | 1254 × 1254 | 1133152 |
| famous-ben-story-actions | 4 | 1312 × 1199 | 865048 |
| famous-esparza-story-actions | 4 | 1254 × 1254 | 777418 |
| famous-almeron-dickinson-story-actions | 4 | 1254 × 1254 | 850453 |
| famous-urrea | 16 | 1254 × 1254 | 955697 |
| famous-urrea-mounted | 4 | 1226 × 1283 | 1293956 |
| famous-wp-smith | 16 | 1254 × 1254 | 1120598 |
| timber-felled | 4 | 1448 × 1086 | 641371 |
| flag-come-and-take-it | 4 | 1254 × 1254 | 1140674 |
| goliad-prisoner-second | 16 | 1254 × 1254 | 1116777 |
| goliad-prisoner | 16 | 1254 × 1254 | 1028392 |
| gonzales-cannon-buried | 1 | 1536 × 1024 | 1652878 |
| gonzales-log-breastwork | 1 | 1774 × 887 | 1221292 |
| gonzales-dugout-canoe | 1 | 1536 × 1024 | 2208839 |
| people-gonzales-bundle-ns | 16 | 1254 × 1254 | 667017 |
| people-gonzales-bundle-walk | 16 | 1254 × 1254 | 936355 |
| people-gonzales-digging | 12 | 1448 × 1086 | 774818 |
| gonzales-flag-variants | 8 | 1774 × 887 | 1089563 |
| gonzales-ploughed-earth | 1 | 2172 × 724 | 1766959 |
| gonzales-flag-work-cloth | 1 | 1774 × 887 | 1835338 |
| gonzales-flag-work-painted | 1 | 1774 × 887 | 1777190 |
| people-gonzales-letter-reading | 12 | 1254 × 1254 | 984871 |
| people-gonzales-paint | 6 | 1024 × 1536 | 1715507 |
| people-gonzales-river-cast-east | 8 | 1774 × 887 | 738523 |
| people-gonzales-river-final-east | 8 | 1774 × 887 | 615222 |
| people-gonzales-river-final-ns | 16 | 1267 × 1241 | 771406 |
| people-river-gestures | 8 | 1774 × 887 | 1213332 |
| people-gonzales-river-north | 16 | 1267 × 1241 | 696900 |
| people-gonzales-river-south | 16 | 1267 × 1241 | 903349 |
| people-gonzales-seated-paint | 12 | 1254 × 1254 | 1247274 |
| people-gonzales-smiths | 16 | 1254 × 1254 | 1257016 |
| gonzales-smith-props | 4 | 1254 × 1254 | 1582180 |
| grass-creek-terrain | 8 | 1774 × 887 | 1416265 |
| mule-packed-grass | 16 | 1254 × 1254 | 1717695 |
| ground-fog-banks | 4 | 1774 × 887 | 1018893 |
| mesquite-liveoak-gale | 12 | 1536 × 1024 | 2225195 |
| elm-gale | 6 | 1243 × 1265 | 1228004 |
| home-tools | 6 | 1024 × 1536 | 1685412 |
| horse-herds | 8 | 1774 × 887 | 1516208 |
| house-construction-complete | 8 | 1774 × 887 | 1134794 |
| house-modules | 16 | 1448 × 1086 | 1837997 |
| house-back-views | 6 | 1448 × 1086 | 787018 |
| house-end-views | 4 | 1536 × 1024 | 2128992 |
| icons-gather-stock-carreta | 8 | 1774 × 887 | 2465242 |
| infant-wagon-passenger | 6 | 1024 × 1536 | 2003734 |
| lesson-marks | 4 | 1254 × 1254 | 782966 |
| live-oak-mott | 4 | 1774 × 887 | 2439144 |
| ground-roads | 4 | 1536 × 1536 | 1774179 |
| homestead-local-1 | 6 | 1024 × 1536 | 1308207 |
| homestead-local-2 | 4 | 1024 × 1024 | 572804 |
| hunt-fields-local-1 | 4 | 3680 × 2200 | 12023286 |
| hunt-fields-local-2 | 1 | 1840 × 1100 | 2768009 |
| hunt-fields-local-3 | 1 | 1840 × 1100 | 2655810 |
| hunt-rifle-local | 1 | 1100 × 1100 | 272583 |
| scenes-local-1 | 4 | 2240 × 1400 | 4768867 |
| scenes-local-2 | 4 | 2240 × 1400 | 4614709 |
| scenes-local-3 | 4 | 2240 × 1400 | 4292950 |
| marsh-edge | 8 | 2172 × 724 | 1222516 |
| marsh-wading | 8 | 1774 × 887 | 1112271 |
| military-camp-life | 16 | 1254 × 1254 | 1457813 |
| volunteer-engineer-actions | 16 | 1254 × 1254 | 1490159 |
| volunteer-bearers | 4 | 1254 × 1254 | 1164328 |
| regular-bearers | 4 | 1254 × 1254 | 852040 |
| dragoon-wounded-led | 4 | 1774 × 887 | 1322772 |
| volunteer-mounted | 16 | 1226 × 1283 | 1337896 |
| field-cover-camp-props | 16 | 1254 × 1254 | 1651891 |
| house-loopholed | 4 | 1536 × 1024 | 2777417 |
| volunteer-loophole-actions | 4 | 1254 × 1254 | 989282 |
| people-mounted-children-e | 16 | 1254 × 1254 | 1147224 |
| people-mounted-children-s | 16 | 1254 × 1254 | 1191765 |
| people-mounted-children-n | 16 | 1254 × 1254 | 1104874 |
| people-mounted-cast1-e | 16 | 1254 × 1254 | 1086305 |
| people-mounted-cast1-s | 16 | 1254 × 1254 | 1213409 |
| people-mounted-cast1-n | 16 | 1254 × 1254 | 1283689 |
| people-mounted-cast2-e | 16 | 1254 × 1254 | 1197211 |
| people-mounted-cast2-s | 16 | 1254 × 1254 | 1115115 |
| people-mounted-cast2-n | 16 | 1254 × 1254 | 1472500 |
| wildlife-mustang | 16 | 1254 × 1254 | 1311610 |
| steamboat-steam | 4 | 1254 × 1254 | 1044017 |
| steamboat-laden | 4 | 1254 × 1254 | 1151494 |
| named-jw-smith-trot | 12 | 1448 × 1086 | 1324080 |
| named-jw-smith-mounted-dispatch | 8 | 1774 × 887 | 1404634 |
| named-horton-trot | 12 | 1536 × 1024 | 2102594 |
| named-horton-mounted-dispatch | 8 | 1774 × 887 | 1526613 |
| named-kimbell-trot | 12 | 1448 × 1086 | 1374233 |
| named-kimbell-mounted-dispatch | 8 | 1774 × 887 | 1436147 |
| named-martin-trot | 12 | 1448 × 1086 | 1544575 |
| named-martin-mounted-dispatch | 8 | 1774 × 887 | 884204 |
| named-milam-fire-service | 16 | 1254 × 1254 | 934347 |
| named-relief-fates | 4 | 1254 × 1254 | 1038660 |
| nature-gales | 4 | 1774 × 887 | 1030716 |
| night-settlement-lights | 16 | 1254 × 1254 | 1713707 |
| norther-ground | 6 | 1024 × 1536 | 2216491 |
| oak-gale | 12 | 1448 × 1086 | 1964372 |
| cart-open-complete | 20 | 1402 × 1122 | 1382518 |
| cart-open-loaded-travel | 12 | 1448 × 1086 | 1151276 |
| town-mexican-river | 1 | 1426 × 1103 | 1719481 |
| presidio-spanish | 1 | 1536 × 1024 | 2103476 |
| village-irish-colony | 1 | 1536 × 1024 | 2454172 |
| ferry-landing | 1 | 1536 × 1024 | 2091884 |
| ox-packed | 16 | 1254 × 1254 | 1531260 |
| ox-wagon-composite-e | 8 | 1774 × 887 | 1057460 |
| ox-wagon-composite-s | 8 | 1774 × 887 | 1416731 |
| ox-wagon-composite-n | 8 | 1774 × 887 | 1020000 |
| people-child-wagon-drivers | 16 | 1254 × 1254 | 1745715 |
| regular-crowbar-vertical | 8 | 1774 × 887 | 1004859 |
| regular-engineer-actions | 16 | 1254 × 1254 | 1448705 |
| pecan-hackberry-gale | 12 | 1448 × 1086 | 1526598 |
| sweetgum-gale | 6 | 1254 × 1254 | 1081732 |
| courier-dismount | 16 | 1254 × 1254 | 1219584 |
| courier-encounters-vertical | 16 | 1254 × 1254 | 1034014 |
| people-dialogue | 16 | 1254 × 1254 | 1237850 |
| ferry-flatboat | 3 | 1254 × 1254 | 203701 |
| steamboat-moored | 4 | 1254 × 1254 | 799173 |
| house-roof-joins | 3 | 1448 × 1086 | 1332934 |
| interior-saddlebag | 1 | 1860 × 846 | 1858682 |
| people-sj-camp-cast1 | 16 | 1254 × 1254 | 821534 |
| people-sj-camp-cast2 | 16 | 1254 × 1254 | 1561543 |
| people-sj-camp-children | 12 | 1448 × 1086 | 1507110 |
| people-sj-camp-heads1 | 16 | 1254 × 1254 | 1301389 |
| people-sj-camp-heads2 | 16 | 1402 × 1122 | 1254182 |
| people-sj-camp-heads3 | 8 | 1774 × 887 | 1343922 |
| people-sj-camp-infant | 4 | 1254 × 1254 | 2014675 |
| sj-mounted-reload-e | 16 | 1536 × 1024 | 1729165 |
| sj-mounted-reload-s | 16 | 1536 × 1024 | 1583212 |
| sj-mounted-reload-n | 16 | 1536 × 1024 | 1580452 |
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
| trees-shortleaf | 12 | 1448 × 1086 | 870477 |
| southern-volunteer-mounted-actions | 8 | 1774 × 887 | 1152242 |
| southern-dragoon-mounted-actions | 8 | 1774 × 887 | 1092208 |
| southern-lancer-charge | 8 | 1774 × 887 | 967185 |
| famous-susanna-child-travel | 4 | 1254 × 1254 | 1207824 |
| famous-susanna-child-cardinal | 4 | 1254 × 1254 | 1204335 |
| gonzales-settler-rammer | 4 | 1254 × 1254 | 892360 |
| gonzales-settler-charge | 4 | 1254 × 1254 | 892184 |
| gonzales-settler-igniter | 4 | 1254 × 1254 | 1022312 |
| town-buildings-researched | 16 | 1254 × 1254 | 2122682 |
| town-fort-velasco | 1 | 1536 × 1024 | 2512585 |
| town-harrisburg-steam-mill | 1 | 1536 × 1024 | 2368526 |
| town-nacogdoches-stone-house | 1 | 1536 × 1024 | 2816554 |
| town-mill-smoke | 4 | 1254 × 1254 | 726832 |
| travel-markers | 16 | 1254 × 1254 | 1343435 |
| trees-colonies-1 | 16 | 1254 × 1254 | 1626976 |
| trees-colonies-2 | 16 | 1254 × 1254 | 1902468 |
| twin-sisters-crew | 4 | 1254 × 1254 | 792510 |
| regular-drummer | 4 | 1262 × 1246 | 833370 |
| twin-sisters-painted | 4 | 1254 × 1254 | 1249122 |
| volunteer-crowbar-vertical | 8 | 1774 × 887 | 994951 |
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
| joe-poses | 16 | 1254 × 1254 | 1066368 |
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
| volunteer-parapet-e-aim | alamo-parapet-service | volunteer-parapet-fire-e |
| volunteer-parapet-e-fire | alamo-parapet-service | volunteer-parapet-fire-e |
| volunteer-parapet-e-load | alamo-parapet-service | volunteer-parapet-fire-e |
| volunteer-parapet-e-ramrod | alamo-parapet-service | volunteer-parapet-fire-e |
| volunteer-parapet-w-aim | alamo-parapet-service | volunteer-parapet-fire-w |
| volunteer-parapet-w-fire | alamo-parapet-service | volunteer-parapet-fire-w |
| volunteer-parapet-w-load | alamo-parapet-service | volunteer-parapet-fire-w |
| volunteer-parapet-w-ramrod | alamo-parapet-service | volunteer-parapet-fire-w |
| volunteer-parapet-n-aim | alamo-parapet-service | volunteer-parapet-fire-n |
| volunteer-parapet-n-fire | alamo-parapet-service | volunteer-parapet-fire-n |
| volunteer-parapet-n-load | alamo-parapet-service | volunteer-parapet-fire-n |
| volunteer-parapet-n-ramrod | alamo-parapet-service | volunteer-parapet-fire-n |
| volunteer-parapet-s-aim | alamo-parapet-service | volunteer-parapet-fire-s |
| volunteer-parapet-s-fire | alamo-parapet-service | volunteer-parapet-fire-s |
| volunteer-parapet-s-load | alamo-parapet-service | volunteer-parapet-fire-s |
| volunteer-parapet-s-ramrod | alamo-parapet-service | volunteer-parapet-fire-s |
| travis-battery-e-aim | people-alamo-travis-service | travis-battery-fire-e |
| travis-battery-e-fire | people-alamo-travis-service | travis-battery-fire-e |
| travis-battery-e-load | people-alamo-travis-service | travis-battery-fire-e |
| travis-battery-e-ramrod | people-alamo-travis-service | travis-battery-fire-e |
| travis-battery-w-aim | people-alamo-travis-service | travis-battery-fire-w |
| travis-battery-w-fire | people-alamo-travis-service | travis-battery-fire-w |
| travis-battery-w-load | people-alamo-travis-service | travis-battery-fire-w |
| travis-battery-w-ramrod | people-alamo-travis-service | travis-battery-fire-w |
| travis-battery-n-aim | people-alamo-travis-service | travis-battery-fire-n |
| travis-battery-n-fire | people-alamo-travis-service | travis-battery-fire-n |
| travis-battery-n-load | people-alamo-travis-service | travis-battery-fire-n |
| travis-battery-n-ramrod | people-alamo-travis-service | travis-battery-fire-n |
| travis-battery-s-aim | people-alamo-travis-service | travis-battery-fire-s |
| travis-battery-s-fire | people-alamo-travis-service | travis-battery-fire-s |
| travis-battery-s-load | people-alamo-travis-service | travis-battery-fire-s |
| travis-battery-s-ramrod | people-alamo-travis-service | travis-battery-fire-s |
| volunteer-trot-e-1 | alamo-volunteer-trot | volunteer-trot-e |
| volunteer-trot-e-2 | alamo-volunteer-trot | volunteer-trot-e |
| volunteer-trot-e-3 | alamo-volunteer-trot | volunteer-trot-e |
| volunteer-trot-e-4 | alamo-volunteer-trot | volunteer-trot-e |
| volunteer-trot-s-1 | alamo-volunteer-trot | volunteer-trot-s |
| volunteer-trot-s-2 | alamo-volunteer-trot | volunteer-trot-s |
| volunteer-trot-s-3 | alamo-volunteer-trot | volunteer-trot-s |
| volunteer-trot-s-4 | alamo-volunteer-trot | volunteer-trot-s |
| volunteer-trot-n-1 | alamo-volunteer-trot | volunteer-trot-n |
| volunteer-trot-n-2 | alamo-volunteer-trot | volunteer-trot-n |
| volunteer-trot-n-3 | alamo-volunteer-trot | volunteer-trot-n |
| volunteer-trot-n-4 | alamo-volunteer-trot | volunteer-trot-n |
| lancer-upright-march-e-1 | alamo-upright-lancer-e | lancer-upright-march-e |
| lancer-upright-march-e-2 | alamo-upright-lancer-e | lancer-upright-march-e |
| lancer-upright-march-e-3 | alamo-upright-lancer-e | lancer-upright-march-e |
| lancer-upright-march-e-4 | alamo-upright-lancer-e | lancer-upright-march-e |
| lancer-upright-idle-e-1 | alamo-upright-lancer-e | lancer-upright-idle-e |
| lancer-upright-idle-e-2 | alamo-upright-lancer-e | lancer-upright-idle-e |
| lancer-upright-idle-e-3 | alamo-upright-lancer-e | lancer-upright-idle-e |
| lancer-upright-idle-e-4 | alamo-upright-lancer-e | lancer-upright-idle-e |
| lancer-upright-march-s-1 | alamo-upright-lancer-s | lancer-upright-march-s |
| lancer-upright-march-s-2 | alamo-upright-lancer-s | lancer-upright-march-s |
| lancer-upright-march-s-3 | alamo-upright-lancer-s | lancer-upright-march-s |
| lancer-upright-march-s-4 | alamo-upright-lancer-s | lancer-upright-march-s |
| lancer-upright-idle-s-1 | alamo-upright-lancer-s | lancer-upright-idle-s |
| lancer-upright-idle-s-2 | alamo-upright-lancer-s | lancer-upright-idle-s |
| lancer-upright-idle-s-3 | alamo-upright-lancer-s | lancer-upright-idle-s |
| lancer-upright-idle-s-4 | alamo-upright-lancer-s | lancer-upright-idle-s |
| lancer-upright-march-n-1 | alamo-upright-lancer-n | lancer-upright-march-n |
| lancer-upright-march-n-2 | alamo-upright-lancer-n | lancer-upright-march-n |
| lancer-upright-march-n-3 | alamo-upright-lancer-n | lancer-upright-march-n |
| lancer-upright-march-n-4 | alamo-upright-lancer-n | lancer-upright-march-n |
| lancer-upright-idle-n-1 | alamo-upright-lancer-n | lancer-upright-idle-n |
| lancer-upright-idle-n-2 | alamo-upright-lancer-n | lancer-upright-idle-n |
| lancer-upright-idle-n-3 | alamo-upright-lancer-n | lancer-upright-idle-n |
| lancer-upright-idle-n-4 | alamo-upright-lancer-n | lancer-upright-idle-n |
| cannon-alamo-north-e | alamo-battery-guns | cannon-alamo-north-e-recoil |
| cannon-alamo-north-e-kick | alamo-battery-guns | cannon-alamo-north-e-recoil |
| cannon-alamo-north-w | alamo-battery-guns | cannon-alamo-north-w-recoil |
| cannon-alamo-north-w-kick | alamo-battery-guns | cannon-alamo-north-w-recoil |
| cannon-alamo-church-e | alamo-battery-guns | cannon-alamo-church-e-recoil |
| cannon-alamo-church-e-kick | alamo-battery-guns | cannon-alamo-church-e-recoil |
| cannon-alamo-church-w | alamo-battery-guns | cannon-alamo-church-w-recoil |
| cannon-alamo-church-w-kick | alamo-battery-guns | cannon-alamo-church-w-recoil |
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
| camp-wedge-cream-1 | army-camp-props | camp-wedge-cream |
| camp-wedge-cream-2 | army-camp-props | camp-wedge-cream |
| camp-wedge-gray-1 | army-camp-props | camp-wedge-gray |
| camp-wedge-gray-2 | army-camp-props | camp-wedge-gray |
| camp-cookfire-1 | army-camp-props | camp-cookfire |
| camp-cookfire-2 | army-camp-props | camp-cookfire |
| camp-cookfire-3 | army-camp-props | camp-cookfire |
| camp-cookfire-4 | army-camp-props | camp-cookfire |
| camp-pennant-ochre-1 | army-camp-pennants | camp-pennant-ochre |
| camp-pennant-ochre-2 | army-camp-pennants | camp-pennant-ochre |
| camp-pennant-rust-1 | army-camp-pennants | camp-pennant-rust |
| camp-pennant-rust-2 | army-camp-pennants | camp-pennant-rust |
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
| volunteer-bank-climb-1 | volunteer-bank-actions | volunteer-bank-climb |
| volunteer-bank-climb-2 | volunteer-bank-actions | volunteer-bank-climb |
| volunteer-bank-climb-3 | volunteer-bank-actions | volunteer-bank-climb |
| volunteer-bank-climb-4 | volunteer-bank-actions | volunteer-bank-climb |
| volunteer-bank-climb-5 | volunteer-bank-actions | volunteer-bank-climb |
| volunteer-bank-climb-6 | volunteer-bank-actions | volunteer-bank-climb |
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
| regular-loophole-aim | regular-loophole-actions | regular-loophole-fire-reload |
| regular-loophole-fire | regular-loophole-actions | regular-loophole-fire-reload |
| regular-loophole-load | regular-loophole-actions | regular-loophole-fire-reload |
| regular-loophole-ram | regular-loophole-actions | regular-loophole-fire-reload |
| bexar-woman-walk-1 | bexar-townsfolk | bexar-woman-walk |
| bexar-woman-walk-2 | bexar-townsfolk | bexar-woman-walk |
| bexar-woman-walk-3 | bexar-townsfolk | bexar-woman-walk |
| bexar-woman-walk-4 | bexar-townsfolk | bexar-woman-walk |
| bexar-elder-walk-1 | bexar-townsfolk | bexar-elder-walk |
| bexar-elder-walk-2 | bexar-townsfolk | bexar-elder-walk |
| bexar-elder-walk-3 | bexar-townsfolk | bexar-elder-walk |
| bexar-elder-walk-4 | bexar-townsfolk | bexar-elder-walk |
| bexar-child-walk-1 | bexar-townsfolk | bexar-child-walk |
| bexar-child-walk-2 | bexar-townsfolk | bexar-child-walk |
| bexar-child-walk-3 | bexar-townsfolk | bexar-child-walk |
| bexar-child-walk-4 | bexar-townsfolk | bexar-child-walk |
| bexar-older-woman-walk-1 | bexar-townsfolk | bexar-older-woman-walk |
| bexar-older-woman-walk-2 | bexar-townsfolk | bexar-older-woman-walk |
| bexar-older-woman-walk-3 | bexar-townsfolk | bexar-older-woman-walk |
| bexar-older-woman-walk-4 | bexar-townsfolk | bexar-older-woman-walk |
| bexar-san-fernando-1836 | bexar-san-fernando | State artwork; no motion required |
| bexar-governors-palace-1836 | bexar-governors-palace | State artwork; no motion required |
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
| tree-anacua | biome-species | State artwork; no motion required |
| tree-texas-ebony | biome-species | State artwork; no motion required |
| tree-water-tupelo | biome-species | State artwork; no motion required |
| tree-cedar-elm | biome-species | State artwork; no motion required |
| tree-black-willow | biome-species | State artwork; no motion required |
| tree-black-willow-pole | biome-species | State artwork; no motion required |
| tree-anacua-gale-1 | biome-species-gales | tree-anacua-gale |
| tree-anacua-gale-2 | biome-species-gales | tree-anacua-gale |
| tree-texas-ebony-gale-1 | biome-species-gales | tree-texas-ebony-gale |
| tree-texas-ebony-gale-2 | biome-species-gales | tree-texas-ebony-gale |
| tree-water-tupelo-gale-1 | biome-species-gales | tree-water-tupelo-gale |
| tree-water-tupelo-gale-2 | biome-species-gales | tree-water-tupelo-gale |
| tree-cedar-elm-gale-1 | biome-species-gales | tree-cedar-elm-gale |
| tree-cedar-elm-gale-2 | biome-species-gales | tree-cedar-elm-gale |
| tree-black-willow-gale-1 | biome-species-gales | tree-black-willow-gale |
| tree-black-willow-gale-2 | biome-species-gales | tree-black-willow-gale |
| tree-black-willow-pole-gale-1 | biome-species-gales | tree-black-willow-pole-gale |
| tree-black-willow-pole-gale-2 | biome-species-gales | tree-black-willow-pole-gale |
| pine-longleaf-pole-gale-1 | biome-pine-palm-gale | pine-longleaf-pole-gale |
| pine-longleaf-pole-gale-2 | biome-pine-palm-gale | pine-longleaf-pole-gale |
| palm-sabal-pole-gale-1 | biome-pine-palm-gale | palm-sabal-pole-gale |
| palm-sabal-pole-gale-2 | biome-pine-palm-gale | palm-sabal-pole-gale |
| pine-longleaf-log-gale-1 | biome-pine-palm-gale | pine-longleaf-log-gale |
| pine-longleaf-log-gale-2 | biome-pine-palm-gale | pine-longleaf-log-gale |
| palm-sabal-log-gale-1 | biome-pine-palm-gale | palm-sabal-log-gale |
| palm-sabal-log-gale-2 | biome-pine-palm-gale | palm-sabal-log-gale |
| pine-longleaf-large-gale-1 | biome-pine-palm-gale | pine-longleaf-large-gale |
| pine-longleaf-large-gale-2 | biome-pine-palm-gale | pine-longleaf-large-gale |
| palm-sabal-large-gale-1 | biome-pine-palm-gale | palm-sabal-large-gale |
| palm-sabal-large-gale-2 | biome-pine-palm-gale | palm-sabal-large-gale |
| cypress-bald-pole-gale-1 | biome-cypress-gale | cypress-bald-pole-gale |
| cypress-bald-pole-gale-2 | biome-cypress-gale | cypress-bald-pole-gale |
| cypress-bald-log-gale-1 | biome-cypress-gale | cypress-bald-log-gale |
| cypress-bald-log-gale-2 | biome-cypress-gale | cypress-bald-log-gale |
| cypress-bald-large-gale-1 | biome-cypress-gale | cypress-bald-large-gale |
| cypress-bald-large-gale-2 | biome-cypress-gale | cypress-bald-large-gale |
| magnolia-log-gale-1 | biome-broadleaf-gale | magnolia-log-gale |
| magnolia-log-gale-2 | biome-broadleaf-gale | magnolia-log-gale |
| beech-log-gale-1 | biome-broadleaf-gale | beech-log-gale |
| beech-log-gale-2 | biome-broadleaf-gale | beech-log-gale |
| magnolia-large-gale-1 | biome-broadleaf-gale | magnolia-large-gale |
| magnolia-large-gale-2 | biome-broadleaf-gale | magnolia-large-gale |
| beech-large-gale-1 | biome-broadleaf-gale | beech-large-gale |
| beech-large-gale-2 | biome-broadleaf-gale | beech-large-gale |
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
| rust-woman-wagon-driver-s-1 | cast2-drivers-women | rust-woman-wagon-driver-s |
| rust-woman-wagon-driver-s-2 | cast2-drivers-women | rust-woman-wagon-driver-s |
| indigo-wagon-driver-s-1 | cast2-drivers-women | indigo-wagon-driver-s |
| indigo-wagon-driver-s-2 | cast2-drivers-women | indigo-wagon-driver-s |
| rust-woman-wagon-driver-e-1 | cast2-drivers-women | rust-woman-wagon-driver-e |
| rust-woman-wagon-driver-e-2 | cast2-drivers-women | rust-woman-wagon-driver-e |
| indigo-wagon-driver-e-1 | cast2-drivers-women | indigo-wagon-driver-e |
| indigo-wagon-driver-e-2 | cast2-drivers-women | indigo-wagon-driver-e |
| rust-woman-wagon-driver-w-1 | cast2-drivers-women | rust-woman-wagon-driver-w |
| rust-woman-wagon-driver-w-2 | cast2-drivers-women | rust-woman-wagon-driver-w |
| indigo-wagon-driver-w-1 | cast2-drivers-women | indigo-wagon-driver-w |
| indigo-wagon-driver-w-2 | cast2-drivers-women | indigo-wagon-driver-w |
| rust-woman-wagon-driver-n-1 | cast2-drivers-women | rust-woman-wagon-driver-n |
| rust-woman-wagon-driver-n-2 | cast2-drivers-women | rust-woman-wagon-driver-n |
| indigo-wagon-driver-n-1 | cast2-drivers-women | indigo-wagon-driver-n |
| indigo-wagon-driver-n-2 | cast2-drivers-women | indigo-wagon-driver-n |
| ochre-wagon-driver-s-1 | cast2-drivers-youth | ochre-wagon-driver-s |
| ochre-wagon-driver-s-2 | cast2-drivers-youth | ochre-wagon-driver-s |
| blue-girl-wagon-driver-s-1 | cast2-drivers-youth | blue-girl-wagon-driver-s |
| blue-girl-wagon-driver-s-2 | cast2-drivers-youth | blue-girl-wagon-driver-s |
| ochre-wagon-driver-e-1 | cast2-drivers-youth | ochre-wagon-driver-e |
| ochre-wagon-driver-e-2 | cast2-drivers-youth | ochre-wagon-driver-e |
| blue-girl-wagon-driver-e-1 | cast2-drivers-youth | blue-girl-wagon-driver-e |
| blue-girl-wagon-driver-e-2 | cast2-drivers-youth | blue-girl-wagon-driver-e |
| ochre-wagon-driver-w-1 | cast2-drivers-youth | ochre-wagon-driver-w |
| ochre-wagon-driver-w-2 | cast2-drivers-youth | ochre-wagon-driver-w |
| blue-girl-wagon-driver-w-1 | cast2-drivers-youth | blue-girl-wagon-driver-w |
| blue-girl-wagon-driver-w-2 | cast2-drivers-youth | blue-girl-wagon-driver-w |
| ochre-wagon-driver-n-1 | cast2-drivers-youth | ochre-wagon-driver-n |
| ochre-wagon-driver-n-2 | cast2-drivers-youth | ochre-wagon-driver-n |
| blue-girl-wagon-driver-n-1 | cast2-drivers-youth | blue-girl-wagon-driver-n |
| blue-girl-wagon-driver-n-2 | cast2-drivers-youth | blue-girl-wagon-driver-n |
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
| dragoon-fire-1 | dragoon-carbine-actions | dragoon-fire |
| dragoon-fire-2 | dragoon-carbine-actions | dragoon-fire |
| dragoon-carbine-lower | dragoon-carbine-actions | dragoon-fire |
| dragoon-carbine-rest | dragoon-carbine-actions | dragoon-fire |
| lancer-charge-1 | lancer-charge | lancer-charge |
| lancer-charge-2 | lancer-charge | lancer-charge |
| lancer-charge-3 | lancer-charge | lancer-charge |
| lancer-charge-4 | lancer-charge | lancer-charge |
| girl-wagon-passenger-e-1 | child-passenger-girl | girl-wagon-passenger-e |
| girl-wagon-passenger-e-2 | child-passenger-girl | girl-wagon-passenger-e |
| girl-wagon-passenger-s-1 | child-passenger-girl | girl-wagon-passenger-s |
| girl-wagon-passenger-s-2 | child-passenger-girl | girl-wagon-passenger-s |
| girl-wagon-passenger-n-1 | child-passenger-girl | girl-wagon-passenger-n |
| girl-wagon-passenger-n-2 | child-passenger-girl | girl-wagon-passenger-n |
| boy-wagon-passenger-e-1 | child-passenger-boy | boy-wagon-passenger-e |
| boy-wagon-passenger-e-2 | child-passenger-boy | boy-wagon-passenger-e |
| boy-wagon-passenger-s-1 | child-passenger-boy | boy-wagon-passenger-s |
| boy-wagon-passenger-s-2 | child-passenger-boy | boy-wagon-passenger-s |
| boy-wagon-passenger-n-1 | child-passenger-boy | boy-wagon-passenger-n |
| boy-wagon-passenger-n-2 | child-passenger-boy | boy-wagon-passenger-n |
| smallchild-wagon-passenger-e-1 | child-passenger-smallchild | smallchild-wagon-passenger-e |
| smallchild-wagon-passenger-e-2 | child-passenger-smallchild | smallchild-wagon-passenger-e |
| smallchild-wagon-passenger-s-1 | child-passenger-smallchild | smallchild-wagon-passenger-s |
| smallchild-wagon-passenger-s-2 | child-passenger-smallchild | smallchild-wagon-passenger-s |
| smallchild-wagon-passenger-n-1 | child-passenger-smallchild | smallchild-wagon-passenger-n |
| smallchild-wagon-passenger-n-2 | child-passenger-smallchild | smallchild-wagon-passenger-n |
| girl-speak-1 | children-dialogue | girl-speak |
| girl-speak-2 | children-dialogue | girl-speak |
| girl-listen-s | children-dialogue | girl-listen-s |
| girl-listen-n | children-dialogue | girl-listen-n |
| boy-speak-1 | children-dialogue | boy-speak |
| boy-speak-2 | children-dialogue | boy-speak |
| boy-listen-s | children-dialogue | boy-listen-s |
| boy-listen-n | children-dialogue | boy-listen-n |
| smallchild-speak-1 | children-dialogue | smallchild-speak |
| smallchild-speak-2 | children-dialogue | smallchild-speak |
| smallchild-listen-s | children-dialogue | smallchild-listen-s |
| smallchild-listen-n | children-dialogue | smallchild-listen-n |
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
| regular-prone-lie | regular-prone-actions | State artwork; no motion required |
| regular-prone-aim | regular-prone-actions | regular-prone-fire-reload |
| regular-prone-fire | regular-prone-actions | regular-prone-fire-reload |
| regular-prone-lock | regular-prone-actions | regular-prone-fire-reload |
| tree-water-oak | colony-hardwoods | State artwork; no motion required |
| tree-bur-oak | colony-hardwoods | State artwork; no motion required |
| tree-white-oak | colony-hardwoods | State artwork; no motion required |
| tree-texas-oak | colony-hardwoods | State artwork; no motion required |
| tree-hickory | colony-hardwoods | State artwork; no motion required |
| tree-walnut | colony-hardwoods | State artwork; no motion required |
| tree-ash | colony-hardwoods | State artwork; no motion required |
| stump-pecan | colony-hardwoods | State artwork; no motion required |
| tree-water-oak-gale-1 | colony-oak-gales | tree-water-oak-gale |
| tree-water-oak-gale-2 | colony-oak-gales | tree-water-oak-gale |
| tree-bur-oak-gale-1 | colony-oak-gales | tree-bur-oak-gale |
| tree-bur-oak-gale-2 | colony-oak-gales | tree-bur-oak-gale |
| tree-white-oak-gale-1 | colony-oak-gales | tree-white-oak-gale |
| tree-white-oak-gale-2 | colony-oak-gales | tree-white-oak-gale |
| tree-texas-oak-gale-1 | colony-oak-gales | tree-texas-oak-gale |
| tree-texas-oak-gale-2 | colony-oak-gales | tree-texas-oak-gale |
| tree-hickory-gale-1 | colony-compound-gales | tree-hickory-gale |
| tree-hickory-gale-2 | colony-compound-gales | tree-hickory-gale |
| tree-walnut-gale-1 | colony-compound-gales | tree-walnut-gale |
| tree-walnut-gale-2 | colony-compound-gales | tree-walnut-gale |
| tree-ash-gale-1 | colony-compound-gales | tree-ash-gale |
| tree-ash-gale-2 | colony-compound-gales | tree-ash-gale |
| mission-concepcion | concepcion-mission | State artwork; no motion required |
| riverbank-cut-e | concepcion-bank-terrain | State artwork; no motion required |
| riverbank-cut-w | concepcion-bank-terrain | State artwork; no motion required |
| river-bend-1 | concepcion-bank-terrain | river-bend |
| river-bend-2 | concepcion-bank-terrain | river-bend |
| river-bend-3 | concepcion-bank-terrain | river-bend |
| river-bend-4 | concepcion-bank-terrain | river-bend |
| limber-mules-e-1 | concepcion-limber-riders | limber-mules-walk-e |
| limber-mules-e-2 | concepcion-limber-riders | limber-mules-walk-e |
| limber-mules-e-3 | concepcion-limber-riders | limber-mules-walk-e |
| limber-mules-e-4 | concepcion-limber-riders | limber-mules-walk-e |
| limber-mules-s-1 | concepcion-limber-riders | limber-mules-walk-s |
| limber-mules-s-2 | concepcion-limber-riders | limber-mules-walk-s |
| limber-mules-s-3 | concepcion-limber-riders | limber-mules-walk-s |
| limber-mules-s-4 | concepcion-limber-riders | limber-mules-walk-s |
| limber-mules-n-1 | concepcion-limber-riders | limber-mules-walk-n |
| limber-mules-n-2 | concepcion-limber-riders | limber-mules-walk-n |
| limber-mules-n-3 | concepcion-limber-riders | limber-mules-walk-n |
| limber-mules-n-4 | concepcion-limber-riders | limber-mules-walk-n |
| padre-walk-1 | concepcion-aftercare | padre-walk |
| padre-walk-2 | concepcion-aftercare | padre-walk |
| padre-walk-3 | concepcion-aftercare | padre-walk |
| padre-walk-4 | concepcion-aftercare | padre-walk |
| casualty-cart-wounded-1 | concepcion-aftercare | casualty-cart-wounded |
| casualty-cart-wounded-2 | concepcion-aftercare | casualty-cart-wounded |
| casualty-cart-wounded-3 | concepcion-aftercare | casualty-cart-wounded |
| casualty-cart-wounded-4 | concepcion-aftercare | casualty-cart-wounded |
| casualty-cart-covered-1 | concepcion-aftercare | casualty-cart-covered |
| casualty-cart-covered-2 | concepcion-aftercare | casualty-cart-covered |
| casualty-cart-covered-3 | concepcion-aftercare | casualty-cart-covered |
| casualty-cart-covered-4 | concepcion-aftercare | casualty-cart-covered |
| pine-loblolly-pole-gale-1 | conifer-gale | pine-loblolly-pole-gale |
| pine-loblolly-pole-gale-2 | conifer-gale | pine-loblolly-pole-gale |
| cedar-pole-gale-1 | conifer-gale | cedar-pole-gale |
| cedar-pole-gale-2 | conifer-gale | cedar-pole-gale |
| pine-loblolly-log-gale-1 | conifer-gale | pine-loblolly-log-gale |
| pine-loblolly-log-gale-2 | conifer-gale | pine-loblolly-log-gale |
| cedar-log-gale-1 | conifer-gale | cedar-log-gale |
| cedar-log-gale-2 | conifer-gale | cedar-log-gale |
| pine-loblolly-large-gale-1 | conifer-gale | pine-loblolly-large-gale |
| pine-loblolly-large-gale-2 | conifer-gale | pine-loblolly-large-gale |
| cedar-large-gale-1 | conifer-gale | cedar-large-gale |
| cedar-large-gale-2 | conifer-gale | cedar-large-gale |
| volunteer-fallen-carry-1 | fallen-transport | volunteer-fallen-carry |
| volunteer-fallen-carry-2 | fallen-transport | volunteer-fallen-carry |
| volunteer-fallen-carry-3 | fallen-transport | volunteer-fallen-carry |
| volunteer-fallen-carry-4 | fallen-transport | volunteer-fallen-carry |
| regular-fallen-carry-1 | fallen-transport | regular-fallen-carry |
| regular-fallen-carry-2 | fallen-transport | regular-fallen-carry |
| regular-fallen-carry-3 | fallen-transport | regular-fallen-carry |
| regular-fallen-carry-4 | fallen-transport | regular-fallen-carry |
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
| mother-scarf-walk-e-1 | people-family-mother-scarf | mother-scarf-walk |
| mother-scarf-walk-e-2 | people-family-mother-scarf | mother-scarf-walk |
| mother-scarf-walk-e-3 | people-family-mother-scarf | mother-scarf-walk |
| mother-scarf-walk-e-4 | people-family-mother-scarf | mother-scarf-walk |
| mother-scarf-walk-s-1 | people-family-mother-scarf | mother-scarf-walk-s |
| mother-scarf-walk-s-2 | people-family-mother-scarf | mother-scarf-walk-s |
| mother-scarf-walk-n-1 | people-family-mother-scarf | mother-scarf-walk-n |
| mother-scarf-walk-n-2 | people-family-mother-scarf | mother-scarf-walk-n |
| mother-scarf-idle-s | people-family-mother-scarf | mother-scarf-idle-s, mother-scarf-listen-s |
| mother-scarf-idle-e | people-family-mother-scarf | mother-scarf-idle-e, mother-scarf-speak |
| mother-scarf-idle-n | people-family-mother-scarf | mother-scarf-idle-n, mother-scarf-listen-n |
| mother-scarf-work-1 | people-family-mother-scarf | mother-scarf-work |
| mother-scarf-work-2 | people-family-mother-scarf | mother-scarf-work |
| mother-scarf-rest | people-family-mother-scarf | mother-scarf-rest |
| mother-scarf-injured-rest | people-family-mother-scarf | mother-scarf-injured-rest |
| mother-scarf-quiet | people-family-mother-scarf | State artwork; no motion required |
| father-straw-walk-e-1 | people-family-father-straw | father-straw-walk |
| father-straw-walk-e-2 | people-family-father-straw | father-straw-walk |
| father-straw-walk-e-3 | people-family-father-straw | father-straw-walk |
| father-straw-walk-e-4 | people-family-father-straw | father-straw-walk |
| father-straw-walk-s-1 | people-family-father-straw | father-straw-walk-s |
| father-straw-walk-s-2 | people-family-father-straw | father-straw-walk-s |
| father-straw-walk-n-1 | people-family-father-straw | father-straw-walk-n |
| father-straw-walk-n-2 | people-family-father-straw | father-straw-walk-n |
| father-straw-idle-s | people-family-father-straw | father-straw-idle-s, father-straw-listen-s |
| father-straw-idle-e | people-family-father-straw | father-straw-idle-e, father-straw-speak |
| father-straw-idle-n | people-family-father-straw | father-straw-idle-n, father-straw-listen-n |
| father-straw-work-1 | people-family-father-straw | father-straw-work |
| father-straw-work-2 | people-family-father-straw | father-straw-work |
| father-straw-rest | people-family-father-straw | father-straw-rest |
| father-straw-injured-rest | people-family-father-straw | father-straw-injured-rest |
| father-straw-quiet | people-family-father-straw | State artwork; no motion required |
| father-beard-walk-e-1 | people-family-father-beard | father-beard-walk |
| father-beard-walk-e-2 | people-family-father-beard | father-beard-walk |
| father-beard-walk-e-3 | people-family-father-beard | father-beard-walk |
| father-beard-walk-e-4 | people-family-father-beard | father-beard-walk |
| father-beard-walk-s-1 | people-family-father-beard | father-beard-walk-s |
| father-beard-walk-s-2 | people-family-father-beard | father-beard-walk-s |
| father-beard-walk-n-1 | people-family-father-beard | father-beard-walk-n |
| father-beard-walk-n-2 | people-family-father-beard | father-beard-walk-n |
| father-beard-idle-s | people-family-father-beard | father-beard-idle-s, father-beard-listen-s |
| father-beard-idle-e | people-family-father-beard | father-beard-idle-e, father-beard-speak |
| father-beard-idle-n | people-family-father-beard | father-beard-idle-n, father-beard-listen-n |
| father-beard-work-1 | people-family-father-beard | father-beard-work |
| father-beard-work-2 | people-family-father-beard | father-beard-work |
| father-beard-rest | people-family-father-beard | father-beard-rest |
| father-beard-injured-rest | people-family-father-beard | father-beard-injured-rest |
| father-beard-quiet | people-family-father-beard | State artwork; no motion required |
| father-moustache-walk-e-1 | people-family-father-moustache | father-moustache-walk |
| father-moustache-walk-e-2 | people-family-father-moustache | father-moustache-walk |
| father-moustache-walk-e-3 | people-family-father-moustache | father-moustache-walk |
| father-moustache-walk-e-4 | people-family-father-moustache | father-moustache-walk |
| father-moustache-walk-s-1 | people-family-father-moustache | father-moustache-walk-s |
| father-moustache-walk-s-2 | people-family-father-moustache | father-moustache-walk-s |
| father-moustache-walk-n-1 | people-family-father-moustache | father-moustache-walk-n |
| father-moustache-walk-n-2 | people-family-father-moustache | father-moustache-walk-n |
| father-moustache-idle-s | people-family-father-moustache | father-moustache-idle-s, father-moustache-listen-s |
| father-moustache-idle-e | people-family-father-moustache | father-moustache-idle-e, father-moustache-speak |
| father-moustache-idle-n | people-family-father-moustache | father-moustache-idle-n, father-moustache-listen-n |
| father-moustache-work-1 | people-family-father-moustache | father-moustache-work |
| father-moustache-work-2 | people-family-father-moustache | father-moustache-work |
| father-moustache-rest | people-family-father-moustache | father-moustache-rest |
| father-moustache-injured-rest | people-family-father-moustache | father-moustache-injured-rest |
| father-moustache-quiet | people-family-father-moustache | State artwork; no motion required |
| mother-braid-walk-e-1 | people-family-mother-braid | mother-braid-walk |
| mother-braid-walk-e-2 | people-family-mother-braid | mother-braid-walk |
| mother-braid-walk-e-3 | people-family-mother-braid | mother-braid-walk |
| mother-braid-walk-e-4 | people-family-mother-braid | mother-braid-walk |
| mother-braid-walk-s-1 | people-family-mother-braid | mother-braid-walk-s |
| mother-braid-walk-s-2 | people-family-mother-braid | mother-braid-walk-s |
| mother-braid-walk-n-1 | people-family-mother-braid | mother-braid-walk-n |
| mother-braid-walk-n-2 | people-family-mother-braid | mother-braid-walk-n |
| mother-braid-idle-s | people-family-mother-braid | mother-braid-idle-s, mother-braid-listen-s |
| mother-braid-idle-e | people-family-mother-braid | mother-braid-idle-e, mother-braid-speak |
| mother-braid-idle-n | people-family-mother-braid | mother-braid-idle-n, mother-braid-listen-n |
| mother-braid-work-1 | people-family-mother-braid | mother-braid-work |
| mother-braid-work-2 | people-family-mother-braid | mother-braid-work |
| mother-braid-rest | people-family-mother-braid | mother-braid-rest |
| mother-braid-injured-rest | people-family-mother-braid | mother-braid-injured-rest |
| mother-braid-quiet | people-family-mother-braid | State artwork; no motion required |
| mother-loose-walk-e-1 | people-family-mother-loose | mother-loose-walk |
| mother-loose-walk-e-2 | people-family-mother-loose | mother-loose-walk |
| mother-loose-walk-e-3 | people-family-mother-loose | mother-loose-walk |
| mother-loose-walk-e-4 | people-family-mother-loose | mother-loose-walk |
| mother-loose-walk-s-1 | people-family-mother-loose | mother-loose-walk-s |
| mother-loose-walk-s-2 | people-family-mother-loose | mother-loose-walk-s |
| mother-loose-walk-n-1 | people-family-mother-loose | mother-loose-walk-n |
| mother-loose-walk-n-2 | people-family-mother-loose | mother-loose-walk-n |
| mother-loose-idle-s | people-family-mother-loose | mother-loose-idle-s, mother-loose-listen-s |
| mother-loose-idle-e | people-family-mother-loose | mother-loose-idle-e, mother-loose-speak |
| mother-loose-idle-n | people-family-mother-loose | mother-loose-idle-n, mother-loose-listen-n |
| mother-loose-work-1 | people-family-mother-loose | mother-loose-work |
| mother-loose-work-2 | people-family-mother-loose | mother-loose-work |
| mother-loose-rest | people-family-mother-loose | mother-loose-rest |
| mother-loose-injured-rest | people-family-mother-loose | mother-loose-injured-rest |
| mother-loose-quiet | people-family-mother-loose | State artwork; no motion required |
| mother-straw-walk-e-1 | people-family-mother-straw | mother-straw-walk |
| mother-straw-walk-e-2 | people-family-mother-straw | mother-straw-walk |
| mother-straw-walk-e-3 | people-family-mother-straw | mother-straw-walk |
| mother-straw-walk-e-4 | people-family-mother-straw | mother-straw-walk |
| mother-straw-walk-s-1 | people-family-mother-straw | mother-straw-walk-s |
| mother-straw-walk-s-2 | people-family-mother-straw | mother-straw-walk-s |
| mother-straw-walk-n-1 | people-family-mother-straw | mother-straw-walk-n |
| mother-straw-walk-n-2 | people-family-mother-straw | mother-straw-walk-n |
| mother-straw-idle-s | people-family-mother-straw | mother-straw-idle-s, mother-straw-listen-s |
| mother-straw-idle-e | people-family-mother-straw | mother-straw-idle-e, mother-straw-speak |
| mother-straw-idle-n | people-family-mother-straw | mother-straw-idle-n, mother-straw-listen-n |
| mother-straw-work-1 | people-family-mother-straw | mother-straw-work |
| mother-straw-work-2 | people-family-mother-straw | mother-straw-work |
| mother-straw-rest | people-family-mother-straw | mother-straw-rest |
| mother-straw-injured-rest | people-family-mother-straw | mother-straw-injured-rest |
| mother-straw-quiet | people-family-mother-straw | State artwork; no motion required |
| youth-boy-walk-e-1 | people-family-youth-boy | youth-boy-walk |
| youth-boy-walk-e-2 | people-family-youth-boy | youth-boy-walk |
| youth-boy-walk-e-3 | people-family-youth-boy | youth-boy-walk |
| youth-boy-walk-e-4 | people-family-youth-boy | youth-boy-walk |
| youth-boy-walk-s-1 | people-family-youth-boy | youth-boy-walk-s |
| youth-boy-walk-s-2 | people-family-youth-boy | youth-boy-walk-s |
| youth-boy-walk-n-1 | people-family-youth-boy | youth-boy-walk-n |
| youth-boy-walk-n-2 | people-family-youth-boy | youth-boy-walk-n |
| youth-boy-idle-s | people-family-youth-boy | youth-boy-idle-s, youth-boy-listen-s |
| youth-boy-idle-e | people-family-youth-boy | youth-boy-idle-e, youth-boy-speak |
| youth-boy-idle-n | people-family-youth-boy | youth-boy-idle-n, youth-boy-listen-n |
| youth-boy-work-1 | people-family-youth-boy | youth-boy-work |
| youth-boy-work-2 | people-family-youth-boy | youth-boy-work |
| youth-boy-rest | people-family-youth-boy | youth-boy-rest |
| youth-boy-injured-rest | people-family-youth-boy | youth-boy-injured-rest |
| youth-boy-quiet | people-family-youth-boy | State artwork; no motion required |
| youth-girl-walk-e-1 | people-family-youth-girl | youth-girl-walk |
| youth-girl-walk-e-2 | people-family-youth-girl | youth-girl-walk |
| youth-girl-walk-e-3 | people-family-youth-girl | youth-girl-walk |
| youth-girl-walk-e-4 | people-family-youth-girl | youth-girl-walk |
| youth-girl-walk-s-1 | people-family-youth-girl | youth-girl-walk-s |
| youth-girl-walk-s-2 | people-family-youth-girl | youth-girl-walk-s |
| youth-girl-walk-n-1 | people-family-youth-girl | youth-girl-walk-n |
| youth-girl-walk-n-2 | people-family-youth-girl | youth-girl-walk-n |
| youth-girl-idle-s | people-family-youth-girl | youth-girl-idle-s, youth-girl-listen-s |
| youth-girl-idle-e | people-family-youth-girl | youth-girl-idle-e, youth-girl-speak |
| youth-girl-idle-n | people-family-youth-girl | youth-girl-idle-n, youth-girl-listen-n |
| youth-girl-work-1 | people-family-youth-girl | youth-girl-work |
| youth-girl-work-2 | people-family-youth-girl | youth-girl-work |
| youth-girl-rest | people-family-youth-girl | youth-girl-rest |
| youth-girl-injured-rest | people-family-youth-girl | youth-girl-injured-rest |
| youth-girl-quiet | people-family-youth-girl | State artwork; no motion required |
| father-hat-walk-e-1 | people-family-father-hat | father-hat-walk |
| father-hat-walk-e-2 | people-family-father-hat | father-hat-walk |
| father-hat-walk-e-3 | people-family-father-hat | father-hat-walk |
| father-hat-walk-e-4 | people-family-father-hat | father-hat-walk |
| father-hat-walk-s-1 | people-family-father-hat | father-hat-walk-s |
| father-hat-walk-s-2 | people-family-father-hat | father-hat-walk-s |
| father-hat-walk-n-1 | people-family-father-hat | father-hat-walk-n |
| father-hat-walk-n-2 | people-family-father-hat | father-hat-walk-n |
| father-hat-idle-s | people-family-father-hat | father-hat-idle-s, father-hat-listen-s |
| father-hat-idle-e | people-family-father-hat | father-hat-idle-e, father-hat-speak |
| father-hat-idle-n | people-family-father-hat | father-hat-idle-n, father-hat-listen-n |
| father-hat-work-1 | people-family-father-hat | father-hat-work |
| father-hat-work-2 | people-family-father-hat | father-hat-work |
| father-hat-rest | people-family-father-hat | father-hat-rest |
| father-hat-injured-rest | people-family-father-hat | father-hat-injured-rest |
| father-hat-quiet | people-family-father-hat | State artwork; no motion required |
| mark-need | family-panel-marks | State artwork; no motion required |
| mark-need-rider | family-panel-marks | State artwork; no motion required |
| mark-main | family-panel-marks | State artwork; no motion required |
| mark-idle | family-panel-marks | State artwork; no motion required |
| mark-auto-off | family-panel-marks | State artwork; no motion required |
| mark-auto-on | family-panel-marks | State artwork; no motion required |
| portrait-rust | family-portraits | State artwork; no motion required |
| portrait-teal | family-portraits | State artwork; no motion required |
| portrait-elder | family-portraits | State artwork; no motion required |
| portrait-blue | family-portraits | State artwork; no motion required |
| portrait-rust-woman | family-portraits | State artwork; no motion required |
| portrait-indigo | family-portraits | State artwork; no motion required |
| portrait-ochre | family-portraits | State artwork; no motion required |
| portrait-blue-girl | family-portraits | State artwork; no motion required |
| portrait-girl | family-portraits | State artwork; no motion required |
| portrait-boy | family-portraits | State artwork; no motion required |
| portrait-smallchild | family-portraits | State artwork; no motion required |
| portrait-infant | family-portraits | State artwork; no motion required |
| rig-body-adult-male-idle-s | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-idle-e | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-idle-n | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-idle-w | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-walk-e-1 | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-walk-e-2 | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-walk-e-3 | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-walk-e-4 | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-walk-s-1 | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-walk-s-2 | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-walk-n-1 | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-walk-n-2 | rig-adult-male-locomotion | State artwork; no motion required |
| rig-body-adult-male-dig-1 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-dig-2 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-hoe-1 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-hoe-2 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-chop-1 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-chop-2 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-hammer-1 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-hammer-2 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-carry-1 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-carry-2 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-trade-1 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-trade-2 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-care-1 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-care-2 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-search-1 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-search-2 | rig-adult-male-work | State artwork; no motion required |
| rig-body-adult-male-aim | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-fire | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-load | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-ramrod | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-horse-e-1 | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-horse-e-2 | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-passenger-e-1 | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-passenger-e-2 | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-passenger-s-1 | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-passenger-s-2 | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-passenger-n-1 | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-passenger-n-2 | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-wounded-1 | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-wounded-2 | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-fall | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-still | rig-adult-male-service | State artwork; no motion required |
| rig-body-adult-male-saddle-e-1 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-e-2 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-wounded-e-1 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-wounded-e-2 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-s-1 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-s-2 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-wounded-s-1 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-wounded-s-2 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-n-1 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-n-2 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-wounded-n-1 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-male-saddle-wounded-n-2 | rig-adult-male-saddle | State artwork; no motion required |
| rig-body-adult-female-idle-s | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-idle-e | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-idle-n | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-idle-w | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-walk-e-1 | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-walk-e-2 | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-walk-e-3 | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-walk-e-4 | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-walk-s-1 | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-walk-s-2 | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-walk-n-1 | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-walk-n-2 | rig-adult-female-locomotion | State artwork; no motion required |
| rig-body-adult-female-dig-1 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-dig-2 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-hoe-1 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-hoe-2 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-chop-1 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-chop-2 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-hammer-1 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-hammer-2 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-carry-1 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-carry-2 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-trade-1 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-trade-2 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-care-1 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-care-2 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-search-1 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-search-2 | rig-adult-female-work | State artwork; no motion required |
| rig-body-adult-female-aim | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-fire | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-load | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-ramrod | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-horse-e-1 | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-horse-e-2 | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-passenger-e-1 | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-passenger-e-2 | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-passenger-s-1 | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-passenger-s-2 | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-passenger-n-1 | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-passenger-n-2 | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-wounded-1 | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-wounded-2 | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-fall | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-still | rig-adult-female-service | State artwork; no motion required |
| rig-body-adult-female-saddle-e-1 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-e-2 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-wounded-e-1 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-wounded-e-2 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-s-1 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-s-2 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-wounded-s-1 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-wounded-s-2 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-n-1 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-n-2 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-wounded-n-1 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-adult-female-saddle-wounded-n-2 | rig-adult-female-saddle | State artwork; no motion required |
| rig-body-youth-male-idle-s | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-idle-e | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-idle-n | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-idle-w | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-walk-e-1 | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-walk-e-2 | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-walk-e-3 | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-walk-e-4 | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-walk-s-1 | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-walk-s-2 | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-walk-n-1 | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-walk-n-2 | rig-youth-male-locomotion | State artwork; no motion required |
| rig-body-youth-male-dig-1 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-dig-2 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-hoe-1 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-hoe-2 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-chop-1 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-chop-2 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-hammer-1 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-hammer-2 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-carry-1 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-carry-2 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-trade-1 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-trade-2 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-care-1 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-care-2 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-search-1 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-search-2 | rig-youth-male-work | State artwork; no motion required |
| rig-body-youth-male-aim | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-fire | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-load | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-ramrod | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-horse-e-1 | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-horse-e-2 | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-passenger-e-1 | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-passenger-e-2 | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-passenger-s-1 | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-passenger-s-2 | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-passenger-n-1 | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-passenger-n-2 | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-wounded-1 | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-wounded-2 | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-fall | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-still | rig-youth-male-service | State artwork; no motion required |
| rig-body-youth-male-saddle-e-1 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-e-2 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-wounded-e-1 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-wounded-e-2 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-s-1 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-s-2 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-wounded-s-1 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-wounded-s-2 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-n-1 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-n-2 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-wounded-n-1 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-male-saddle-wounded-n-2 | rig-youth-male-saddle | State artwork; no motion required |
| rig-body-youth-female-idle-s | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-idle-e | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-idle-n | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-idle-w | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-walk-e-1 | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-walk-e-2 | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-walk-e-3 | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-walk-e-4 | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-walk-s-1 | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-walk-s-2 | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-walk-n-1 | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-walk-n-2 | rig-youth-female-locomotion | State artwork; no motion required |
| rig-body-youth-female-dig-1 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-dig-2 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-hoe-1 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-hoe-2 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-chop-1 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-chop-2 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-hammer-1 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-hammer-2 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-carry-1 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-carry-2 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-trade-1 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-trade-2 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-care-1 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-care-2 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-search-1 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-search-2 | rig-youth-female-work | State artwork; no motion required |
| rig-body-youth-female-aim | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-fire | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-load | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-ramrod | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-horse-e-1 | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-horse-e-2 | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-passenger-e-1 | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-passenger-e-2 | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-passenger-s-1 | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-passenger-s-2 | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-passenger-n-1 | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-passenger-n-2 | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-wounded-1 | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-wounded-2 | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-fall | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-still | rig-youth-female-service | State artwork; no motion required |
| rig-body-youth-female-saddle-e-1 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-e-2 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-wounded-e-1 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-wounded-e-2 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-s-1 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-s-2 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-wounded-s-1 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-wounded-s-2 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-n-1 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-n-2 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-wounded-n-1 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-youth-female-saddle-wounded-n-2 | rig-youth-female-saddle | State artwork; no motion required |
| rig-body-child-male-idle-s | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-idle-e | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-idle-n | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-idle-w | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-walk-e-1 | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-walk-e-2 | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-walk-e-3 | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-walk-e-4 | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-walk-s-1 | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-walk-s-2 | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-walk-n-1 | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-walk-n-2 | rig-child-male-locomotion | State artwork; no motion required |
| rig-body-child-male-dig-1 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-dig-2 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-hoe-1 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-hoe-2 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-chop-1 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-chop-2 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-hammer-1 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-hammer-2 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-carry-1 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-carry-2 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-trade-1 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-trade-2 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-care-1 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-care-2 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-search-1 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-search-2 | rig-child-male-work | State artwork; no motion required |
| rig-body-child-male-comfort-1 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-comfort-2 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-rest-1 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-rest-2 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-horse-e-1 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-horse-e-2 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-passenger-e-1 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-passenger-e-2 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-passenger-s-1 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-passenger-s-2 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-passenger-n-1 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-passenger-n-2 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-wounded-1 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-wounded-2 | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-fall | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-still | rig-child-male-service | State artwork; no motion required |
| rig-body-child-male-saddle-e-1 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-e-2 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-wounded-e-1 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-wounded-e-2 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-s-1 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-s-2 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-wounded-s-1 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-wounded-s-2 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-n-1 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-n-2 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-wounded-n-1 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-male-saddle-wounded-n-2 | rig-child-male-saddle | State artwork; no motion required |
| rig-body-child-female-idle-s | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-idle-e | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-idle-n | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-idle-w | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-walk-e-1 | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-walk-e-2 | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-walk-e-3 | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-walk-e-4 | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-walk-s-1 | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-walk-s-2 | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-walk-n-1 | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-walk-n-2 | rig-child-female-locomotion | State artwork; no motion required |
| rig-body-child-female-dig-1 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-dig-2 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-hoe-1 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-hoe-2 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-chop-1 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-chop-2 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-hammer-1 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-hammer-2 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-carry-1 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-carry-2 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-trade-1 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-trade-2 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-care-1 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-care-2 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-search-1 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-search-2 | rig-child-female-work | State artwork; no motion required |
| rig-body-child-female-comfort-1 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-comfort-2 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-rest-1 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-rest-2 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-horse-e-1 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-horse-e-2 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-passenger-e-1 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-passenger-e-2 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-passenger-s-1 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-passenger-s-2 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-passenger-n-1 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-passenger-n-2 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-wounded-1 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-wounded-2 | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-fall | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-still | rig-child-female-service | State artwork; no motion required |
| rig-body-child-female-saddle-e-1 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-e-2 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-wounded-e-1 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-wounded-e-2 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-s-1 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-s-2 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-wounded-s-1 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-wounded-s-2 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-n-1 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-n-2 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-wounded-n-1 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-child-female-saddle-wounded-n-2 | rig-child-female-saddle | State artwork; no motion required |
| rig-body-smallchild-idle-s | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-idle-e | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-idle-n | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-idle-w | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-walk-e-1 | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-walk-e-2 | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-walk-e-3 | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-walk-e-4 | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-walk-s-1 | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-walk-s-2 | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-walk-n-1 | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-walk-n-2 | rig-smallchild-locomotion | State artwork; no motion required |
| rig-body-smallchild-dig-1 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-dig-2 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-hoe-1 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-hoe-2 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-chop-1 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-chop-2 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-hammer-1 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-hammer-2 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-carry-1 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-carry-2 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-trade-1 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-trade-2 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-care-1 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-care-2 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-search-1 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-search-2 | rig-smallchild-work | State artwork; no motion required |
| rig-body-smallchild-comfort-1 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-comfort-2 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-rest-1 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-rest-2 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-horse-e-1 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-horse-e-2 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-passenger-e-1 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-passenger-e-2 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-passenger-s-1 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-passenger-s-2 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-passenger-n-1 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-passenger-n-2 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-wounded-1 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-wounded-2 | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-fall | rig-smallchild-service | State artwork; no motion required |
| rig-body-smallchild-still | rig-smallchild-service | State artwork; no motion required |
| rig-body-infant-idle-s | rig-infant-body | State artwork; no motion required |
| rig-body-infant-idle-e | rig-infant-body | State artwork; no motion required |
| rig-body-infant-idle-n | rig-infant-body | State artwork; no motion required |
| rig-body-infant-idle-w | rig-infant-body | State artwork; no motion required |
| rig-body-infant-rest-e-1 | rig-infant-body | State artwork; no motion required |
| rig-body-infant-rest-e-2 | rig-infant-body | State artwork; no motion required |
| rig-body-infant-rest-s-1 | rig-infant-body | State artwork; no motion required |
| rig-body-infant-rest-s-2 | rig-infant-body | State artwork; no motion required |
| rig-body-infant-care-1 | rig-infant-body | State artwork; no motion required |
| rig-body-infant-care-2 | rig-infant-body | State artwork; no motion required |
| rig-body-infant-wounded-1 | rig-infant-body | State artwork; no motion required |
| rig-body-infant-wounded-2 | rig-infant-body | State artwork; no motion required |
| rig-head-rust-e | rig-heads-cast1 | State artwork; no motion required |
| rig-head-teal-e | rig-heads-cast1 | State artwork; no motion required |
| rig-head-elder-e | rig-heads-cast1 | State artwork; no motion required |
| rig-head-blue-e | rig-heads-cast1 | State artwork; no motion required |
| rig-head-rust-s | rig-heads-cast1 | State artwork; no motion required |
| rig-head-teal-s | rig-heads-cast1 | State artwork; no motion required |
| rig-head-elder-s | rig-heads-cast1 | State artwork; no motion required |
| rig-head-blue-s | rig-heads-cast1 | State artwork; no motion required |
| rig-head-rust-n | rig-heads-cast1 | State artwork; no motion required |
| rig-head-teal-n | rig-heads-cast1 | State artwork; no motion required |
| rig-head-elder-n | rig-heads-cast1 | State artwork; no motion required |
| rig-head-blue-n | rig-heads-cast1 | State artwork; no motion required |
| rig-head-rust-closed | rig-heads-cast1 | State artwork; no motion required |
| rig-head-teal-closed | rig-heads-cast1 | State artwork; no motion required |
| rig-head-elder-closed | rig-heads-cast1 | State artwork; no motion required |
| rig-head-blue-closed | rig-heads-cast1 | State artwork; no motion required |
| rig-head-rust-woman-e | rig-heads-cast2 | State artwork; no motion required |
| rig-head-indigo-e | rig-heads-cast2 | State artwork; no motion required |
| rig-head-ochre-e | rig-heads-cast2 | State artwork; no motion required |
| rig-head-blue-girl-e | rig-heads-cast2 | State artwork; no motion required |
| rig-head-rust-woman-s | rig-heads-cast2 | State artwork; no motion required |
| rig-head-indigo-s | rig-heads-cast2 | State artwork; no motion required |
| rig-head-ochre-s | rig-heads-cast2 | State artwork; no motion required |
| rig-head-blue-girl-s | rig-heads-cast2 | State artwork; no motion required |
| rig-head-rust-woman-n | rig-heads-cast2 | State artwork; no motion required |
| rig-head-indigo-n | rig-heads-cast2 | State artwork; no motion required |
| rig-head-ochre-n | rig-heads-cast2 | State artwork; no motion required |
| rig-head-blue-girl-n | rig-heads-cast2 | State artwork; no motion required |
| rig-head-rust-woman-closed | rig-heads-cast2 | State artwork; no motion required |
| rig-head-indigo-closed | rig-heads-cast2 | State artwork; no motion required |
| rig-head-ochre-closed | rig-heads-cast2 | State artwork; no motion required |
| rig-head-blue-girl-closed | rig-heads-cast2 | State artwork; no motion required |
| rig-head-father-hat-e | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-beard-e | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-moustache-e | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-straw-e | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-hat-s | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-beard-s | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-moustache-s | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-straw-s | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-hat-n | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-beard-n | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-moustache-n | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-straw-n | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-hat-closed | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-beard-closed | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-moustache-closed | rig-heads-fathers | State artwork; no motion required |
| rig-head-father-straw-closed | rig-heads-fathers | State artwork; no motion required |
| rig-head-mother-braid-e | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-loose-e | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-scarf-e | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-straw-e | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-braid-s | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-loose-s | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-scarf-s | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-straw-s | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-braid-n | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-loose-n | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-scarf-n | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-straw-n | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-braid-closed | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-loose-closed | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-scarf-closed | rig-heads-mothers | State artwork; no motion required |
| rig-head-mother-straw-closed | rig-heads-mothers | State artwork; no motion required |
| rig-head-youth-boy-e | rig-heads-young | State artwork; no motion required |
| rig-head-youth-girl-e | rig-heads-young | State artwork; no motion required |
| rig-head-girl-e | rig-heads-young | State artwork; no motion required |
| rig-head-boy-e | rig-heads-young | State artwork; no motion required |
| rig-head-youth-boy-s | rig-heads-young | State artwork; no motion required |
| rig-head-youth-girl-s | rig-heads-young | State artwork; no motion required |
| rig-head-girl-s | rig-heads-young | State artwork; no motion required |
| rig-head-boy-s | rig-heads-young | State artwork; no motion required |
| rig-head-youth-boy-n | rig-heads-young | State artwork; no motion required |
| rig-head-youth-girl-n | rig-heads-young | State artwork; no motion required |
| rig-head-girl-n | rig-heads-young | State artwork; no motion required |
| rig-head-boy-n | rig-heads-young | State artwork; no motion required |
| rig-head-youth-boy-closed | rig-heads-young | State artwork; no motion required |
| rig-head-youth-girl-closed | rig-heads-young | State artwork; no motion required |
| rig-head-girl-closed | rig-heads-young | State artwork; no motion required |
| rig-head-boy-closed | rig-heads-young | State artwork; no motion required |
| rig-head-smallchild-e | rig-heads-little | State artwork; no motion required |
| rig-head-infant-e | rig-heads-little | State artwork; no motion required |
| rig-head-smallchild-s | rig-heads-little | State artwork; no motion required |
| rig-head-infant-s | rig-heads-little | State artwork; no motion required |
| rig-head-smallchild-n | rig-heads-little | State artwork; no motion required |
| rig-head-infant-n | rig-heads-little | State artwork; no motion required |
| rig-head-smallchild-closed | rig-heads-little | State artwork; no motion required |
| rig-head-infant-closed | rig-heads-little | State artwork; no motion required |
| rig-body-adult-male-covered-1 | rig-covered-patients | State artwork; no motion required |
| rig-body-adult-male-covered-2 | rig-covered-patients | State artwork; no motion required |
| rig-body-adult-female-covered-1 | rig-covered-patients | State artwork; no motion required |
| rig-body-adult-female-covered-2 | rig-covered-patients | State artwork; no motion required |
| rig-body-youth-male-covered-1 | rig-covered-patients | State artwork; no motion required |
| rig-body-youth-male-covered-2 | rig-covered-patients | State artwork; no motion required |
| rig-body-youth-female-covered-1 | rig-covered-patients | State artwork; no motion required |
| rig-body-youth-female-covered-2 | rig-covered-patients | State artwork; no motion required |
| rig-body-child-male-covered-1 | rig-covered-patients | State artwork; no motion required |
| rig-body-child-male-covered-2 | rig-covered-patients | State artwork; no motion required |
| rig-body-child-female-covered-1 | rig-covered-patients | State artwork; no motion required |
| rig-body-child-female-covered-2 | rig-covered-patients | State artwork; no motion required |
| rig-body-smallchild-covered-1 | rig-covered-patients | State artwork; no motion required |
| rig-body-smallchild-covered-2 | rig-covered-patients | State artwork; no motion required |
| rig-body-infant-covered-1 | rig-covered-patients | State artwork; no motion required |
| rig-body-infant-covered-2 | rig-covered-patients | State artwork; no motion required |
| rig-kit-horse-led-1 | family-transport-components | State artwork; no motion required |
| rig-kit-horse-led-2 | family-transport-components | State artwork; no motion required |
| rig-kit-horse-led-3 | family-transport-components | State artwork; no motion required |
| rig-kit-horse-led-4 | family-transport-components | State artwork; no motion required |
| rig-kit-blanket-bearers-1 | family-transport-components | State artwork; no motion required |
| rig-kit-blanket-bearers-2 | family-transport-components | State artwork; no motion required |
| rig-kit-blanket-bearers-3 | family-transport-components | State artwork; no motion required |
| rig-kit-blanket-bearers-4 | family-transport-components | State artwork; no motion required |
| rig-body-adult-male-camp-rest-1 | rig-camp-grown | State artwork; no motion required |
| rig-body-adult-male-camp-rest-2 | rig-camp-grown | State artwork; no motion required |
| rig-body-adult-male-camp-sleep-1 | rig-camp-grown | State artwork; no motion required |
| rig-body-adult-male-camp-sleep-2 | rig-camp-grown | State artwork; no motion required |
| rig-body-adult-female-camp-rest-1 | rig-camp-grown | State artwork; no motion required |
| rig-body-adult-female-camp-rest-2 | rig-camp-grown | State artwork; no motion required |
| rig-body-adult-female-camp-sleep-1 | rig-camp-grown | State artwork; no motion required |
| rig-body-adult-female-camp-sleep-2 | rig-camp-grown | State artwork; no motion required |
| rig-body-youth-male-camp-rest-1 | rig-camp-grown | State artwork; no motion required |
| rig-body-youth-male-camp-rest-2 | rig-camp-grown | State artwork; no motion required |
| rig-body-youth-male-camp-sleep-1 | rig-camp-grown | State artwork; no motion required |
| rig-body-youth-male-camp-sleep-2 | rig-camp-grown | State artwork; no motion required |
| rig-body-youth-female-camp-rest-1 | rig-camp-grown | State artwork; no motion required |
| rig-body-youth-female-camp-rest-2 | rig-camp-grown | State artwork; no motion required |
| rig-body-youth-female-camp-sleep-1 | rig-camp-grown | State artwork; no motion required |
| rig-body-youth-female-camp-sleep-2 | rig-camp-grown | State artwork; no motion required |
| rig-body-child-female-camp-rest-1 | rig-camp-children | State artwork; no motion required |
| rig-body-child-female-camp-rest-2 | rig-camp-children | State artwork; no motion required |
| rig-body-child-female-camp-sleep-1 | rig-camp-children | State artwork; no motion required |
| rig-body-child-female-camp-sleep-2 | rig-camp-children | State artwork; no motion required |
| rig-body-child-male-camp-rest-1 | rig-camp-children | State artwork; no motion required |
| rig-body-child-male-camp-rest-2 | rig-camp-children | State artwork; no motion required |
| rig-body-child-male-camp-sleep-1 | rig-camp-children | State artwork; no motion required |
| rig-body-child-male-camp-sleep-2 | rig-camp-children | State artwork; no motion required |
| rig-body-smallchild-camp-rest-1 | rig-camp-children | State artwork; no motion required |
| rig-body-smallchild-camp-rest-2 | rig-camp-children | State artwork; no motion required |
| rig-body-smallchild-camp-sleep-1 | rig-camp-children | State artwork; no motion required |
| rig-body-smallchild-camp-sleep-2 | rig-camp-children | State artwork; no motion required |
| rig-body-infant-camp-rest-1 | rig-camp-children | State artwork; no motion required |
| rig-body-infant-camp-rest-2 | rig-camp-children | State artwork; no motion required |
| rig-body-infant-camp-sleep-1 | rig-camp-children | State artwork; no motion required |
| rig-body-infant-camp-sleep-2 | rig-camp-children | State artwork; no motion required |
| rig-body-adult-male-mounted-e-aim | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-e-fire | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-e-load | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-e-ramrod | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-s-aim | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-s-fire | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-s-load | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-s-ramrod | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-n-aim | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-n-fire | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-n-load | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-male-mounted-n-ramrod | rig-adult-male-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-e-aim | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-e-fire | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-e-load | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-e-ramrod | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-s-aim | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-s-fire | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-s-load | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-s-ramrod | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-n-aim | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-n-fire | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-n-load | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-adult-female-mounted-n-ramrod | rig-adult-female-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-e-aim | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-e-fire | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-e-load | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-e-ramrod | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-s-aim | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-s-fire | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-s-load | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-s-ramrod | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-n-aim | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-n-fire | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-n-load | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-male-mounted-n-ramrod | rig-youth-male-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-e-aim | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-e-fire | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-e-load | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-e-ramrod | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-s-aim | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-s-fire | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-s-load | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-s-ramrod | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-n-aim | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-n-fire | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-n-load | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-youth-female-mounted-n-ramrod | rig-youth-female-mounted-service | State artwork; no motion required |
| rig-body-adult-male-surrender-1 | rig-capture-poses | State artwork; no motion required |
| rig-body-adult-male-surrender-2 | rig-capture-poses | State artwork; no motion required |
| rig-body-adult-female-surrender-1 | rig-capture-poses | State artwork; no motion required |
| rig-body-adult-female-surrender-2 | rig-capture-poses | State artwork; no motion required |
| rig-body-youth-male-surrender-1 | rig-capture-poses | State artwork; no motion required |
| rig-body-youth-male-surrender-2 | rig-capture-poses | State artwork; no motion required |
| rig-body-youth-female-surrender-1 | rig-capture-poses | State artwork; no motion required |
| rig-body-youth-female-surrender-2 | rig-capture-poses | State artwork; no motion required |
| rig-body-child-male-surrender-1 | rig-capture-poses | State artwork; no motion required |
| rig-body-child-male-surrender-2 | rig-capture-poses | State artwork; no motion required |
| rig-body-child-female-surrender-1 | rig-capture-poses | State artwork; no motion required |
| rig-body-child-female-surrender-2 | rig-capture-poses | State artwork; no motion required |
| rig-body-smallchild-surrender-1 | rig-capture-poses | State artwork; no motion required |
| rig-body-smallchild-surrender-2 | rig-capture-poses | State artwork; no motion required |
| rig-body-infant-surrender-1 | rig-capture-poses | State artwork; no motion required |
| rig-body-infant-surrender-2 | rig-capture-poses | State artwork; no motion required |
| rig-body-adult-male-sow-1 | rig-sow-poses | State artwork; no motion required |
| rig-body-adult-male-sow-2 | rig-sow-poses | State artwork; no motion required |
| rig-body-adult-female-sow-1 | rig-sow-poses | State artwork; no motion required |
| rig-body-adult-female-sow-2 | rig-sow-poses | State artwork; no motion required |
| rig-body-youth-male-sow-1 | rig-sow-poses | State artwork; no motion required |
| rig-body-youth-male-sow-2 | rig-sow-poses | State artwork; no motion required |
| rig-body-youth-female-sow-1 | rig-sow-poses | State artwork; no motion required |
| rig-body-youth-female-sow-2 | rig-sow-poses | State artwork; no motion required |
| rig-body-child-male-sow-1 | rig-sow-poses | State artwork; no motion required |
| rig-body-child-male-sow-2 | rig-sow-poses | State artwork; no motion required |
| rig-body-child-female-sow-1 | rig-sow-poses | State artwork; no motion required |
| rig-body-child-female-sow-2 | rig-sow-poses | State artwork; no motion required |
| rig-body-smallchild-sow-1 | rig-sow-poses | State artwork; no motion required |
| rig-body-smallchild-sow-2 | rig-sow-poses | State artwork; no motion required |
| rig-body-infant-sow-1 | rig-sow-poses | State artwork; no motion required |
| rig-body-infant-sow-2 | rig-sow-poses | State artwork; no motion required |
| rig-body-adult-male-harvest-1 | rig-harvest-poses | State artwork; no motion required |
| rig-body-adult-male-harvest-2 | rig-harvest-poses | State artwork; no motion required |
| rig-body-adult-female-harvest-1 | rig-harvest-poses | State artwork; no motion required |
| rig-body-adult-female-harvest-2 | rig-harvest-poses | State artwork; no motion required |
| rig-body-youth-male-harvest-1 | rig-harvest-poses | State artwork; no motion required |
| rig-body-youth-male-harvest-2 | rig-harvest-poses | State artwork; no motion required |
| rig-body-youth-female-harvest-1 | rig-harvest-poses | State artwork; no motion required |
| rig-body-youth-female-harvest-2 | rig-harvest-poses | State artwork; no motion required |
| rig-body-child-male-harvest-1 | rig-harvest-poses | State artwork; no motion required |
| rig-body-child-male-harvest-2 | rig-harvest-poses | State artwork; no motion required |
| rig-body-child-female-harvest-1 | rig-harvest-poses | State artwork; no motion required |
| rig-body-child-female-harvest-2 | rig-harvest-poses | State artwork; no motion required |
| rig-body-smallchild-harvest-1 | rig-harvest-poses | State artwork; no motion required |
| rig-body-smallchild-harvest-2 | rig-harvest-poses | State artwork; no motion required |
| rig-body-infant-harvest-1 | rig-harvest-poses | State artwork; no motion required |
| rig-body-infant-harvest-2 | rig-harvest-poses | State artwork; no motion required |
| rust-wagon-passenger-e-1 | adult-passengers-cast1 | rust-wagon-passenger-e |
| teal-wagon-passenger-e-1 | adult-passengers-cast1 | teal-wagon-passenger-e |
| elder-wagon-passenger-e-1 | adult-passengers-cast1 | elder-wagon-passenger-e |
| blue-wagon-passenger-e-1 | adult-passengers-cast1 | blue-wagon-passenger-e |
| rust-wagon-passenger-e-2 | adult-passengers-cast1 | rust-wagon-passenger-e |
| teal-wagon-passenger-e-2 | adult-passengers-cast1 | teal-wagon-passenger-e |
| elder-wagon-passenger-e-2 | adult-passengers-cast1 | elder-wagon-passenger-e |
| blue-wagon-passenger-e-2 | adult-passengers-cast1 | blue-wagon-passenger-e |
| rust-wagon-passenger-s-1 | adult-passengers-cast1 | rust-wagon-passenger-s |
| teal-wagon-passenger-s-1 | adult-passengers-cast1 | teal-wagon-passenger-s |
| elder-wagon-passenger-s-1 | adult-passengers-cast1 | elder-wagon-passenger-s |
| blue-wagon-passenger-s-1 | adult-passengers-cast1 | blue-wagon-passenger-s |
| rust-wagon-passenger-s-2 | adult-passengers-cast1 | rust-wagon-passenger-s |
| teal-wagon-passenger-s-2 | adult-passengers-cast1 | teal-wagon-passenger-s |
| elder-wagon-passenger-s-2 | adult-passengers-cast1 | elder-wagon-passenger-s |
| blue-wagon-passenger-s-2 | adult-passengers-cast1 | blue-wagon-passenger-s |
| rust-wagon-passenger-n-1 | adult-passengers-cast1 | rust-wagon-passenger-n |
| teal-wagon-passenger-n-1 | adult-passengers-cast1 | teal-wagon-passenger-n |
| elder-wagon-passenger-n-1 | adult-passengers-cast1 | elder-wagon-passenger-n |
| blue-wagon-passenger-n-1 | adult-passengers-cast1 | blue-wagon-passenger-n |
| rust-wagon-passenger-n-2 | adult-passengers-cast1 | rust-wagon-passenger-n |
| teal-wagon-passenger-n-2 | adult-passengers-cast1 | teal-wagon-passenger-n |
| elder-wagon-passenger-n-2 | adult-passengers-cast1 | elder-wagon-passenger-n |
| blue-wagon-passenger-n-2 | adult-passengers-cast1 | blue-wagon-passenger-n |
| rust-woman-wagon-passenger-e-1 | adult-passengers-cast2 | rust-woman-wagon-passenger-e |
| indigo-wagon-passenger-e-1 | adult-passengers-cast2 | indigo-wagon-passenger-e |
| ochre-wagon-passenger-e-1 | adult-passengers-cast2 | ochre-wagon-passenger-e |
| blue-girl-wagon-passenger-e-1 | adult-passengers-cast2 | blue-girl-wagon-passenger-e |
| rust-woman-wagon-passenger-e-2 | adult-passengers-cast2 | rust-woman-wagon-passenger-e |
| indigo-wagon-passenger-e-2 | adult-passengers-cast2 | indigo-wagon-passenger-e |
| ochre-wagon-passenger-e-2 | adult-passengers-cast2 | ochre-wagon-passenger-e |
| blue-girl-wagon-passenger-e-2 | adult-passengers-cast2 | blue-girl-wagon-passenger-e |
| rust-woman-wagon-passenger-s-1 | adult-passengers-cast2 | rust-woman-wagon-passenger-s |
| indigo-wagon-passenger-s-1 | adult-passengers-cast2 | indigo-wagon-passenger-s |
| ochre-wagon-passenger-s-1 | adult-passengers-cast2 | ochre-wagon-passenger-s |
| blue-girl-wagon-passenger-s-1 | adult-passengers-cast2 | blue-girl-wagon-passenger-s |
| rust-woman-wagon-passenger-s-2 | adult-passengers-cast2 | rust-woman-wagon-passenger-s |
| indigo-wagon-passenger-s-2 | adult-passengers-cast2 | indigo-wagon-passenger-s |
| ochre-wagon-passenger-s-2 | adult-passengers-cast2 | ochre-wagon-passenger-s |
| blue-girl-wagon-passenger-s-2 | adult-passengers-cast2 | blue-girl-wagon-passenger-s |
| rust-woman-wagon-passenger-n-1 | adult-passengers-cast2 | rust-woman-wagon-passenger-n |
| indigo-wagon-passenger-n-1 | adult-passengers-cast2 | indigo-wagon-passenger-n |
| ochre-wagon-passenger-n-1 | adult-passengers-cast2 | ochre-wagon-passenger-n |
| blue-girl-wagon-passenger-n-1 | adult-passengers-cast2 | blue-girl-wagon-passenger-n |
| rust-woman-wagon-passenger-n-2 | adult-passengers-cast2 | rust-woman-wagon-passenger-n |
| indigo-wagon-passenger-n-2 | adult-passengers-cast2 | indigo-wagon-passenger-n |
| ochre-wagon-passenger-n-2 | adult-passengers-cast2 | ochre-wagon-passenger-n |
| blue-girl-wagon-passenger-n-2 | adult-passengers-cast2 | blue-girl-wagon-passenger-n |
| rust-woman-infant-walk-e-1 | family-infant-walk-rust-woman | rust-woman-infant-walk-e |
| rust-woman-infant-walk-e-2 | family-infant-walk-rust-woman | rust-woman-infant-walk-e |
| rust-woman-infant-walk-e-3 | family-infant-walk-rust-woman | rust-woman-infant-walk-e |
| rust-woman-infant-walk-e-4 | family-infant-walk-rust-woman | rust-woman-infant-walk-e |
| rust-woman-infant-walk-s-1 | family-infant-walk-rust-woman | rust-woman-infant-walk-s |
| rust-woman-infant-walk-s-2 | family-infant-walk-rust-woman | rust-woman-infant-walk-s |
| rust-woman-infant-walk-s-3 | family-infant-walk-rust-woman | rust-woman-infant-walk-s |
| rust-woman-infant-walk-s-4 | family-infant-walk-rust-woman | rust-woman-infant-walk-s |
| rust-woman-infant-walk-n-1 | family-infant-walk-rust-woman | rust-woman-infant-walk-n |
| rust-woman-infant-walk-n-2 | family-infant-walk-rust-woman | rust-woman-infant-walk-n |
| rust-woman-infant-walk-n-3 | family-infant-walk-rust-woman | rust-woman-infant-walk-n |
| rust-woman-infant-walk-n-4 | family-infant-walk-rust-woman | rust-woman-infant-walk-n |
| indigo-infant-walk-e-1 | family-infant-walk-indigo | indigo-infant-walk-e |
| indigo-infant-walk-e-2 | family-infant-walk-indigo | indigo-infant-walk-e |
| indigo-infant-walk-e-3 | family-infant-walk-indigo | indigo-infant-walk-e |
| indigo-infant-walk-e-4 | family-infant-walk-indigo | indigo-infant-walk-e |
| indigo-infant-walk-s-1 | family-infant-walk-indigo | indigo-infant-walk-s |
| indigo-infant-walk-s-2 | family-infant-walk-indigo | indigo-infant-walk-s |
| indigo-infant-walk-s-3 | family-infant-walk-indigo | indigo-infant-walk-s |
| indigo-infant-walk-s-4 | family-infant-walk-indigo | indigo-infant-walk-s |
| indigo-infant-walk-n-1 | family-infant-walk-indigo | indigo-infant-walk-n |
| indigo-infant-walk-n-2 | family-infant-walk-indigo | indigo-infant-walk-n |
| indigo-infant-walk-n-3 | family-infant-walk-indigo | indigo-infant-walk-n |
| indigo-infant-walk-n-4 | family-infant-walk-indigo | indigo-infant-walk-n |
| ochre-infant-walk-e-1 | family-infant-walk-ochre | ochre-infant-walk-e |
| ochre-infant-walk-e-2 | family-infant-walk-ochre | ochre-infant-walk-e |
| ochre-infant-walk-e-3 | family-infant-walk-ochre | ochre-infant-walk-e |
| ochre-infant-walk-e-4 | family-infant-walk-ochre | ochre-infant-walk-e |
| ochre-infant-walk-s-1 | family-infant-walk-ochre | ochre-infant-walk-s |
| ochre-infant-walk-s-2 | family-infant-walk-ochre | ochre-infant-walk-s |
| ochre-infant-walk-s-3 | family-infant-walk-ochre | ochre-infant-walk-s |
| ochre-infant-walk-s-4 | family-infant-walk-ochre | ochre-infant-walk-s |
| ochre-infant-walk-n-1 | family-infant-walk-ochre | ochre-infant-walk-n |
| ochre-infant-walk-n-2 | family-infant-walk-ochre | ochre-infant-walk-n |
| ochre-infant-walk-n-3 | family-infant-walk-ochre | ochre-infant-walk-n |
| ochre-infant-walk-n-4 | family-infant-walk-ochre | ochre-infant-walk-n |
| blue-girl-infant-walk-e-1 | family-infant-walk-blue-girl | blue-girl-infant-walk-e |
| blue-girl-infant-walk-e-2 | family-infant-walk-blue-girl | blue-girl-infant-walk-e |
| blue-girl-infant-walk-e-3 | family-infant-walk-blue-girl | blue-girl-infant-walk-e |
| blue-girl-infant-walk-e-4 | family-infant-walk-blue-girl | blue-girl-infant-walk-e |
| blue-girl-infant-walk-s-1 | family-infant-walk-blue-girl | blue-girl-infant-walk-s |
| blue-girl-infant-walk-s-2 | family-infant-walk-blue-girl | blue-girl-infant-walk-s |
| blue-girl-infant-walk-s-3 | family-infant-walk-blue-girl | blue-girl-infant-walk-s |
| blue-girl-infant-walk-s-4 | family-infant-walk-blue-girl | blue-girl-infant-walk-s |
| blue-girl-infant-walk-n-1 | family-infant-walk-blue-girl | blue-girl-infant-walk-n |
| blue-girl-infant-walk-n-2 | family-infant-walk-blue-girl | blue-girl-infant-walk-n |
| blue-girl-infant-walk-n-3 | family-infant-walk-blue-girl | blue-girl-infant-walk-n |
| blue-girl-infant-walk-n-4 | family-infant-walk-blue-girl | blue-girl-infant-walk-n |
| rust-infant-walk-e-1 | family-infant-walk-rust | rust-infant-walk-e |
| rust-infant-walk-e-2 | family-infant-walk-rust | rust-infant-walk-e |
| rust-infant-walk-e-3 | family-infant-walk-rust | rust-infant-walk-e |
| rust-infant-walk-e-4 | family-infant-walk-rust | rust-infant-walk-e |
| rust-infant-walk-s-1 | family-infant-walk-rust | rust-infant-walk-s |
| rust-infant-walk-s-2 | family-infant-walk-rust | rust-infant-walk-s |
| rust-infant-walk-s-3 | family-infant-walk-rust | rust-infant-walk-s |
| rust-infant-walk-s-4 | family-infant-walk-rust | rust-infant-walk-s |
| rust-infant-walk-n-1 | family-infant-walk-rust | rust-infant-walk-n |
| rust-infant-walk-n-2 | family-infant-walk-rust | rust-infant-walk-n |
| rust-infant-walk-n-3 | family-infant-walk-rust | rust-infant-walk-n |
| rust-infant-walk-n-4 | family-infant-walk-rust | rust-infant-walk-n |
| wagon-open-cover-e-1 | wagon-cover-drawn-back | wagon-open-cover-e |
| wagon-open-cover-w-1 | wagon-cover-drawn-back | wagon-open-cover-w |
| wagon-open-cover-s-1 | wagon-cover-drawn-back | wagon-open-cover-s |
| wagon-open-cover-n-1 | wagon-cover-drawn-back | wagon-open-cover-n |
| wagon-open-cover-e-2 | wagon-cover-drawn-back | wagon-open-cover-e |
| wagon-open-cover-w-2 | wagon-cover-drawn-back | wagon-open-cover-w |
| wagon-open-cover-s-2 | wagon-cover-drawn-back | wagon-open-cover-s |
| wagon-open-cover-n-2 | wagon-cover-drawn-back | wagon-open-cover-n |
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
| austin-walk-e-1 | famous-austin | austin-walk-e |
| austin-walk-e-2 | famous-austin | austin-walk-e |
| austin-walk-e-3 | famous-austin | austin-walk-e |
| austin-walk-e-4 | famous-austin | austin-walk-e |
| austin-walk-s-1 | famous-austin | austin-walk-s |
| austin-walk-s-2 | famous-austin | austin-walk-s |
| austin-walk-n-1 | famous-austin | austin-walk-n |
| austin-walk-n-2 | famous-austin | austin-walk-n |
| austin-idle | famous-austin | State artwork; no motion required |
| austin-command | famous-austin | State artwork; no motion required |
| austin-point | famous-austin | State artwork; no motion required |
| austin-speak | famous-austin | State artwork; no motion required |
| austin-read-letter | famous-austin | State artwork; no motion required |
| austin-write | famous-austin | State artwork; no motion required |
| austin-map | famous-austin | State artwork; no motion required |
| austin-rest | famous-austin | State artwork; no motion required |
| barragan-walk-e-1 | famous-barragan | barragan-walk-e |
| barragan-walk-e-2 | famous-barragan | barragan-walk-e |
| barragan-walk-e-3 | famous-barragan | State artwork; no motion required |
| barragan-walk-e-4 | famous-barragan | State artwork; no motion required |
| barragan-walk-s-1 | famous-barragan | barragan-walk-s |
| barragan-walk-s-2 | famous-barragan | barragan-walk-s |
| barragan-walk-n-1 | famous-barragan | barragan-walk-n |
| barragan-walk-n-2 | famous-barragan | barragan-walk-n |
| barragan-idle | famous-barragan | State artwork; no motion required |
| barragan-stop | famous-barragan | barragan-intervene |
| barragan-protect | famous-barragan | barragan-intervene |
| barragan-guide | famous-barragan | State artwork; no motion required |
| barragan-speak | famous-barragan | State artwork; no motion required |
| barragan-listen | famous-barragan | State artwork; no motion required |
| barragan-point | famous-barragan | State artwork; no motion required |
| barragan-rest | famous-barragan | State artwork; no motion required |
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
| castrillon-walk-s-1 | famous-castrillon-cardinal | castrillon-walk-s |
| castrillon-walk-s-2 | famous-castrillon-cardinal | castrillon-walk-s |
| castrillon-walk-n-1 | famous-castrillon-cardinal | castrillon-walk-n |
| castrillon-walk-n-2 | famous-castrillon-cardinal | castrillon-walk-n |
| castrillon-crate-command-1 | famous-castrillon-crate | castrillon-crate-command |
| castrillon-crate-command-2 | famous-castrillon-crate | castrillon-crate-command |
| castrillon-crate-step-down | famous-castrillon-crate | State artwork; no motion required |
| castrillon-crate-ground | famous-castrillon-crate | State artwork; no motion required |
| castrillon-idle | famous-castrillon | State artwork; no motion required |
| castrillon-walk-e-1 | famous-castrillon | castrillon-walk-e |
| castrillon-walk-e-2 | famous-castrillon | castrillon-walk-e |
| castrillon-command | famous-castrillon | State artwork; no motion required |
| castrillon-turn-away | famous-castrillon-fate | castrillon-fall |
| castrillon-stumble | famous-castrillon-fate | castrillon-fall |
| castrillon-kneel | famous-castrillon-fate | castrillon-fall |
| castrillon-still | famous-castrillon-fate | State artwork; no motion required |
| condelle-walk-e-1 | famous-condelle | condelle-walk-e |
| condelle-walk-e-2 | famous-condelle | condelle-walk-e |
| condelle-walk-e-3 | famous-condelle | condelle-walk-e |
| condelle-walk-e-4 | famous-condelle | condelle-walk-e |
| condelle-walk-s-1 | famous-condelle | condelle-walk-s |
| condelle-walk-s-2 | famous-condelle | condelle-walk-s |
| condelle-walk-n-1 | famous-condelle | condelle-walk-n |
| condelle-walk-n-2 | famous-condelle | condelle-walk-n |
| condelle-idle | famous-condelle | State artwork; no motion required |
| condelle-command-palm | famous-condelle | condelle-command |
| condelle-point | famous-condelle | condelle-command |
| condelle-read-map | famous-condelle | State artwork; no motion required |
| condelle-speak | famous-condelle | State artwork; no motion required |
| condelle-listen | famous-condelle | State artwork; no motion required |
| condelle-saber-low | famous-condelle | State artwork; no motion required |
| condelle-rest | famous-condelle | State artwork; no motion required |
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
| deaf-smith-walk-e-1 | famous-deaf-smith | deaf-smith-walk-e |
| deaf-smith-walk-e-2 | famous-deaf-smith | deaf-smith-walk-e |
| deaf-smith-walk-e-3 | famous-deaf-smith | deaf-smith-walk-e |
| deaf-smith-walk-e-4 | famous-deaf-smith | deaf-smith-walk-e |
| deaf-smith-walk-s-1 | famous-deaf-smith | deaf-smith-walk-s |
| deaf-smith-walk-s-2 | famous-deaf-smith | deaf-smith-walk-s |
| deaf-smith-walk-n-1 | famous-deaf-smith | deaf-smith-walk-n |
| deaf-smith-walk-n-2 | famous-deaf-smith | deaf-smith-walk-n |
| deaf-smith-idle | famous-deaf-smith | State artwork; no motion required |
| deaf-smith-report | famous-deaf-smith | State artwork; no motion required |
| deaf-smith-point | famous-deaf-smith | State artwork; no motion required |
| deaf-smith-read-dispatch | famous-deaf-smith | State artwork; no motion required |
| deaf-smith-track | famous-deaf-smith | State artwork; no motion required |
| deaf-smith-wounded-seated | famous-deaf-smith | State artwork; no motion required |
| deaf-smith-axe-ready | famous-deaf-smith | deaf-smith-axe-work |
| deaf-smith-axe-chop | famous-deaf-smith | deaf-smith-axe-work |
| deaf-smith-mounted-walk-e-1 | famous-deaf-smith-mounted | deaf-smith-mounted-walk-e |
| deaf-smith-mounted-walk-e-2 | famous-deaf-smith-mounted | deaf-smith-mounted-walk-e |
| deaf-smith-mounted-idle-e | famous-deaf-smith-mounted | State artwork; no motion required |
| deaf-smith-mounted-idle-s | famous-deaf-smith-mounted | State artwork; no motion required |
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
| travis-foot-walk-s-v2-1 | famous-travis-foot-cardinal-v2 | travis-foot-walk-s-v2 |
| travis-foot-walk-s-v2-2 | famous-travis-foot-cardinal-v2 | travis-foot-walk-s-v2 |
| travis-foot-walk-n-v2-1 | famous-travis-foot-cardinal-v2 | travis-foot-walk-n-v2 |
| travis-foot-walk-n-v2-2 | famous-travis-foot-cardinal-v2 | travis-foot-walk-n-v2 |
| crockett-foot-walk-s-v2-1 | famous-crockett-foot-cardinal-v2 | crockett-foot-walk-s-v2 |
| crockett-foot-walk-s-v2-2 | famous-crockett-foot-cardinal-v2 | crockett-foot-walk-s-v2 |
| crockett-foot-walk-n-v2-1 | famous-crockett-foot-cardinal-v2 | crockett-foot-walk-n-v2 |
| crockett-foot-walk-n-v2-2 | famous-crockett-foot-cardinal-v2 | crockett-foot-walk-n-v2 |
| bowie-foot-walk-s-v2-1 | famous-bowie-foot-cardinal-v2 | bowie-foot-walk-s-v2 |
| bowie-foot-walk-s-v2-2 | famous-bowie-foot-cardinal-v2 | bowie-foot-walk-s-v2 |
| bowie-foot-walk-n-v2-1 | famous-bowie-foot-cardinal-v2 | bowie-foot-walk-n-v2 |
| bowie-foot-walk-n-v2-2 | famous-bowie-foot-cardinal-v2 | bowie-foot-walk-n-v2 |
| fannin-foot-walk-s-v2-1 | famous-fannin-foot-cardinal-v2 | fannin-foot-walk-s-v2 |
| fannin-foot-walk-s-v2-2 | famous-fannin-foot-cardinal-v2 | fannin-foot-walk-s-v2 |
| fannin-foot-walk-n-v2-1 | famous-fannin-foot-cardinal-v2 | fannin-foot-walk-n-v2 |
| fannin-foot-walk-n-v2-2 | famous-fannin-foot-cardinal-v2 | fannin-foot-walk-n-v2 |
| milam-foot-walk-s-v2-1 | famous-milam-foot-cardinal-v2 | milam-foot-walk-s-v2 |
| milam-foot-walk-s-v2-2 | famous-milam-foot-cardinal-v2 | milam-foot-walk-s-v2 |
| milam-foot-walk-n-v2-1 | famous-milam-foot-cardinal-v2 | milam-foot-walk-n-v2 |
| milam-foot-walk-n-v2-2 | famous-milam-foot-cardinal-v2 | milam-foot-walk-n-v2 |
| ben-foot-walk-s-v2-1 | famous-ben-foot-cardinal-v2 | ben-foot-walk-s-v2 |
| ben-foot-walk-s-v2-2 | famous-ben-foot-cardinal-v2 | ben-foot-walk-s-v2 |
| ben-foot-walk-n-v2-1 | famous-ben-foot-cardinal-v2 | ben-foot-walk-n-v2 |
| ben-foot-walk-n-v2-2 | famous-ben-foot-cardinal-v2 | ben-foot-walk-n-v2 |
| neill-field-command-1 | famous-neill-field-gestures | neill-field-command |
| neill-field-command-2 | famous-neill-field-gestures | neill-field-command |
| neill-field-conversation-1 | famous-neill-field-gestures | neill-field-conversation |
| neill-field-conversation-2 | famous-neill-field-gestures | neill-field-conversation |
| karnes-field-command-1 | famous-karnes-field-gestures | karnes-field-command |
| karnes-field-command-2 | famous-karnes-field-gestures | karnes-field-command |
| karnes-field-conversation-1 | famous-karnes-field-gestures | karnes-field-conversation |
| karnes-field-conversation-2 | famous-karnes-field-gestures | karnes-field-conversation |
| hockley-field-command-1 | famous-hockley-field-gestures | hockley-field-command |
| hockley-field-command-2 | famous-hockley-field-gestures | hockley-field-command |
| hockley-field-conversation-1 | famous-hockley-field-gestures | hockley-field-conversation |
| hockley-field-conversation-2 | famous-hockley-field-gestures | hockley-field-conversation |
| lamar-field-command-1 | famous-lamar-field-gestures | lamar-field-command |
| lamar-field-command-2 | famous-lamar-field-gestures | lamar-field-command |
| lamar-field-conversation-1 | famous-lamar-field-gestures | lamar-field-conversation |
| lamar-field-conversation-2 | famous-lamar-field-gestures | lamar-field-conversation |
| sherman-field-command-1 | famous-sherman-field-gestures | sherman-field-command |
| sherman-field-command-2 | famous-sherman-field-gestures | sherman-field-command |
| sherman-field-conversation-1 | famous-sherman-field-gestures | sherman-field-conversation |
| sherman-field-conversation-2 | famous-sherman-field-gestures | sherman-field-conversation |
| rusk-field-command-1 | famous-rusk-field-gestures | rusk-field-command |
| rusk-field-command-2 | famous-rusk-field-gestures | rusk-field-command |
| rusk-field-conversation-1 | famous-rusk-field-gestures | rusk-field-conversation |
| rusk-field-conversation-2 | famous-rusk-field-gestures | rusk-field-conversation |
| travis-command-gesture-1 | famous-travis-gestures | travis-command-cycle |
| travis-command-gesture-2 | famous-travis-gestures | travis-command-cycle |
| travis-conversation-gesture-1 | famous-travis-gestures | travis-conversation-cycle |
| travis-conversation-gesture-2 | famous-travis-gestures | travis-conversation-cycle |
| houston-command-gesture-1 | famous-houston-gestures | houston-command-cycle |
| houston-command-gesture-2 | famous-houston-gestures | houston-command-cycle |
| houston-conversation-gesture-1 | famous-houston-gestures | houston-conversation-cycle |
| houston-conversation-gesture-2 | famous-houston-gestures | houston-conversation-cycle |
| santa-anna-command-gesture-1 | famous-santa-anna-gestures | santa-anna-command-cycle |
| santa-anna-command-gesture-2 | famous-santa-anna-gestures | santa-anna-command-cycle |
| santa-anna-conversation-gesture-1 | famous-santa-anna-gestures | santa-anna-conversation-cycle |
| santa-anna-conversation-gesture-2 | famous-santa-anna-gestures | santa-anna-conversation-cycle |
| austin-command-gesture-1 | famous-austin-gestures | austin-command-cycle |
| austin-command-gesture-2 | famous-austin-gestures | austin-command-cycle |
| austin-conversation-gesture-1 | famous-austin-gestures | austin-conversation-cycle |
| austin-conversation-gesture-2 | famous-austin-gestures | austin-conversation-cycle |
| moore-command-gesture-1 | famous-moore-gestures | moore-command-cycle |
| moore-command-gesture-2 | famous-moore-gestures | moore-command-cycle |
| moore-conversation-gesture-1 | famous-moore-gestures | moore-conversation-cycle |
| moore-conversation-gesture-2 | famous-moore-gestures | moore-conversation-cycle |
| almonte-command-gesture-1 | famous-almonte-gestures | almonte-command-cycle |
| almonte-command-gesture-2 | famous-almonte-gestures | almonte-command-cycle |
| almonte-conversation-gesture-1 | famous-almonte-gestures | almonte-conversation-cycle |
| almonte-conversation-gesture-2 | famous-almonte-gestures | almonte-conversation-cycle |
| burleson-command-gesture-1 | famous-burleson-gestures | burleson-command-cycle |
| burleson-command-gesture-2 | famous-burleson-gestures | burleson-command-cycle |
| burleson-conversation-gesture-1 | famous-burleson-gestures | burleson-conversation-cycle |
| burleson-conversation-gesture-2 | famous-burleson-gestures | burleson-conversation-cycle |
| cos-command-gesture-1 | famous-cos-gestures | cos-command-cycle |
| cos-command-gesture-2 | famous-cos-gestures | cos-command-cycle |
| cos-conversation-gesture-1 | famous-cos-gestures | cos-conversation-cycle |
| cos-conversation-gesture-2 | famous-cos-gestures | cos-conversation-cycle |
| urrea-command-gesture-1 | famous-urrea-gestures | urrea-command-cycle |
| urrea-command-gesture-2 | famous-urrea-gestures | urrea-command-cycle |
| urrea-conversation-gesture-1 | famous-urrea-gestures | urrea-conversation-cycle |
| urrea-conversation-gesture-2 | famous-urrea-gestures | urrea-conversation-cycle |
| castaneda-command-gesture-1 | famous-castaneda-gestures | castaneda-command-cycle |
| castaneda-command-gesture-2 | famous-castaneda-gestures | castaneda-command-cycle |
| castaneda-conversation-gesture-1 | famous-castaneda-gestures | castaneda-conversation-cycle |
| castaneda-conversation-gesture-2 | famous-castaneda-gestures | castaneda-conversation-cycle |
| grant-walk-e-1 | famous-grant | grant-walk-e |
| grant-walk-e-2 | famous-grant | grant-walk-e |
| grant-walk-e-3 | famous-grant | grant-walk-e |
| grant-walk-e-4 | famous-grant | grant-walk-e |
| grant-walk-s-1 | famous-grant | grant-walk-s |
| grant-walk-s-2 | famous-grant | grant-walk-s |
| grant-walk-n-1 | famous-grant | grant-walk-n |
| grant-walk-n-2 | famous-grant | grant-walk-n |
| grant-idle | famous-grant | State artwork; no motion required |
| grant-point-herd | famous-grant | State artwork; no motion required |
| grant-read-map | famous-grant | State artwork; no motion required |
| grant-satchel | famous-grant | State artwork; no motion required |
| grant-call | famous-grant | State artwork; no motion required |
| grant-track | famous-grant | State artwork; no motion required |
| grant-bandaged-seated | famous-grant | State artwork; no motion required |
| grant-arm-sling | famous-grant | State artwork; no motion required |
| grant-mounted-walk-e-1 | famous-grant-mounted | grant-mounted-walk-e |
| grant-mounted-walk-e-2 | famous-grant-mounted | grant-mounted-walk-e |
| grant-mounted-idle-e | famous-grant-mounted | State artwork; no motion required |
| grant-mounted-idle-s | famous-grant-mounted | State artwork; no motion required |
| grant-mounted-gallop-e-1 | famous-grant-gallop | grant-mounted-gallop-e |
| grant-mounted-gallop-e-2 | famous-grant-gallop | grant-mounted-gallop-e |
| grant-mounted-gallop-e-3 | famous-grant-gallop | grant-mounted-gallop-e |
| grant-mounted-gallop-e-4 | famous-grant-gallop | grant-mounted-gallop-e |
| hockley-walk-e-1 | famous-hockley | hockley-walk-e |
| hockley-walk-e-2 | famous-hockley | hockley-walk-e |
| hockley-walk-e-3 | famous-hockley | hockley-walk-e |
| hockley-walk-e-4 | famous-hockley | hockley-walk-e |
| hockley-walk-s-1 | famous-hockley | hockley-walk-s |
| hockley-walk-s-2 | famous-hockley | hockley-walk-s |
| hockley-walk-n-1 | famous-hockley | hockley-walk-n |
| hockley-walk-n-2 | famous-hockley | hockley-walk-n |
| hockley-idle | famous-hockley | State artwork; no motion required |
| hockley-point | famous-hockley | hockley-battery-command |
| hockley-fire-signal | famous-hockley | hockley-battery-command |
| hockley-observe | famous-hockley | State artwork; no motion required |
| hockley-brace | famous-hockley | hockley-battery-command |
| hockley-reload-signal | famous-hockley | State artwork; no motion required |
| hockley-plan | famous-hockley | State artwork; no motion required |
| hockley-speak | famous-hockley | State artwork; no motion required |
| johnson-walk-e-1 | famous-johnson | johnson-walk-e |
| johnson-walk-e-2 | famous-johnson | johnson-walk-e |
| johnson-walk-e-3 | famous-johnson | johnson-walk-e |
| johnson-walk-e-4 | famous-johnson | johnson-walk-e |
| johnson-walk-s-1 | famous-johnson | johnson-walk-s |
| johnson-walk-s-2 | famous-johnson | johnson-walk-s |
| johnson-walk-n-1 | famous-johnson | johnson-walk-n |
| johnson-walk-n-2 | famous-johnson | johnson-walk-n |
| johnson-idle | famous-johnson | State artwork; no motion required |
| johnson-point | famous-johnson | johnson-command |
| johnson-gather | famous-johnson | johnson-command |
| johnson-map | famous-johnson | State artwork; no motion required |
| johnson-escape-e-1 | famous-johnson | johnson-escape-e |
| johnson-escape-e-2 | famous-johnson | johnson-escape-e |
| johnson-door-crouch | famous-johnson | State artwork; no motion required |
| johnson-look-back | famous-johnson | State artwork; no motion required |
| karnes-walk-e-1 | famous-karnes | karnes-walk-e |
| karnes-walk-e-2 | famous-karnes | karnes-walk-e |
| karnes-walk-e-3 | famous-karnes | karnes-walk-e |
| karnes-walk-e-4 | famous-karnes | karnes-walk-e |
| karnes-walk-s-1 | famous-karnes | karnes-walk-s |
| karnes-walk-s-2 | famous-karnes | karnes-walk-s |
| karnes-walk-n-1 | famous-karnes | karnes-walk-n |
| karnes-walk-n-2 | famous-karnes | karnes-walk-n |
| karnes-idle | famous-karnes | State artwork; no motion required |
| karnes-command | famous-karnes | State artwork; no motion required |
| karnes-aim | famous-karnes | State artwork; no motion required |
| karnes-fire | famous-karnes | State artwork; no motion required |
| karnes-crowbar-set | famous-karnes | karnes-crowbar-work |
| karnes-crowbar-lever | famous-karnes | karnes-crowbar-work |
| karnes-listen | famous-karnes | State artwork; no motion required |
| karnes-rest | famous-karnes | State artwork; no motion required |
| karnes-mounted-walk-e-1 | famous-karnes-mounted | karnes-mounted-walk-e |
| karnes-mounted-walk-e-2 | famous-karnes-mounted | karnes-mounted-walk-e |
| karnes-mounted-idle-e | famous-karnes-mounted | State artwork; no motion required |
| karnes-mounted-idle-s | famous-karnes-mounted | State artwork; no motion required |
| lamar-walk-e-1 | famous-lamar | lamar-walk-e |
| lamar-walk-e-2 | famous-lamar | lamar-walk-e |
| lamar-walk-e-3 | famous-lamar | lamar-walk-e |
| lamar-walk-e-4 | famous-lamar | lamar-walk-e |
| lamar-walk-s-1 | famous-lamar | lamar-walk-s |
| lamar-walk-s-2 | famous-lamar | lamar-walk-s |
| lamar-walk-n-1 | famous-lamar | lamar-walk-n |
| lamar-walk-n-2 | famous-lamar | lamar-walk-n |
| lamar-idle | famous-lamar | State artwork; no motion required |
| lamar-command | famous-lamar | State artwork; no motion required |
| lamar-salute | famous-lamar | State artwork; no motion required |
| lamar-saber-low | famous-lamar | State artwork; no motion required |
| lamar-reach | famous-lamar | State artwork; no motion required |
| lamar-withdraw-signal | famous-lamar | State artwork; no motion required |
| lamar-listen | famous-lamar | State artwork; no motion required |
| lamar-rest | famous-lamar | State artwork; no motion required |
| lamar-mounted-walk-e-1 | famous-lamar-mounted | lamar-mounted-walk-e |
| lamar-mounted-walk-e-2 | famous-lamar-mounted | lamar-mounted-walk-e |
| lamar-mounted-idle-e | famous-lamar-mounted | State artwork; no motion required |
| lamar-mounted-rescue-e | famous-lamar-mounted | State artwork; no motion required |
| mcculloch-walk-e-1 | famous-mcculloch | mcculloch-walk-e |
| mcculloch-walk-e-2 | famous-mcculloch | mcculloch-walk-e |
| mcculloch-walk-e-3 | famous-mcculloch | mcculloch-walk-e |
| mcculloch-walk-e-4 | famous-mcculloch | mcculloch-walk-e |
| mcculloch-walk-s-1 | famous-mcculloch | mcculloch-walk-s |
| mcculloch-walk-s-2 | famous-mcculloch | mcculloch-walk-s |
| mcculloch-walk-n-1 | famous-mcculloch | mcculloch-walk-n |
| mcculloch-walk-n-2 | famous-mcculloch | mcculloch-walk-n |
| mcculloch-idle | famous-mcculloch | State artwork; no motion required |
| mcculloch-hold-shot | famous-mcculloch | mcculloch-gun-service |
| mcculloch-ram | famous-mcculloch | mcculloch-gun-service |
| mcculloch-step-back | famous-mcculloch | State artwork; no motion required |
| mcculloch-inspect | famous-mcculloch | State artwork; no motion required |
| mcculloch-brace | famous-mcculloch | mcculloch-gun-service |
| mcculloch-powder-pouch | famous-mcculloch | State artwork; no motion required |
| mcculloch-listen | famous-mcculloch | State artwork; no motion required |
| moore-walk-e-1 | famous-moore | moore-walk-e |
| moore-walk-e-2 | famous-moore | moore-walk-e |
| moore-walk-e-3 | famous-moore | moore-walk-e |
| moore-walk-e-4 | famous-moore | moore-walk-e |
| moore-walk-s-1 | famous-moore | moore-walk-s |
| moore-walk-s-2 | famous-moore | moore-walk-s |
| moore-walk-n-1 | famous-moore | moore-walk-n |
| moore-walk-n-2 | famous-moore | moore-walk-n |
| moore-idle | famous-moore | State artwork; no motion required |
| moore-point | famous-moore | State artwork; no motion required |
| moore-parley | famous-moore | State artwork; no motion required |
| moore-listen | famous-moore | State artwork; no motion required |
| moore-command | famous-moore | State artwork; no motion required |
| moore-read-note | famous-moore | State artwork; no motion required |
| moore-field-glass | famous-moore | State artwork; no motion required |
| moore-at-ease | famous-moore | State artwork; no motion required |
| smither-mounted-walk-s-1 | famous-smither-mounted-cardinal | smither-mounted-walk-s |
| smither-mounted-walk-s-2 | famous-smither-mounted-cardinal | smither-mounted-walk-s |
| smither-mounted-walk-n-1 | famous-smither-mounted-cardinal | smither-mounted-walk-n |
| smither-mounted-walk-n-2 | famous-smither-mounted-cardinal | smither-mounted-walk-n |
| jw-smith-mounted-walk-s-1 | famous-jw-smith-mounted-cardinal | jw-smith-mounted-walk-s |
| jw-smith-mounted-walk-s-2 | famous-jw-smith-mounted-cardinal | jw-smith-mounted-walk-s |
| jw-smith-mounted-walk-n-1 | famous-jw-smith-mounted-cardinal | jw-smith-mounted-walk-n |
| jw-smith-mounted-walk-n-2 | famous-jw-smith-mounted-cardinal | jw-smith-mounted-walk-n |
| horton-mounted-walk-s-1 | famous-horton-mounted-cardinal | horton-mounted-walk-s |
| horton-mounted-walk-s-2 | famous-horton-mounted-cardinal | horton-mounted-walk-s |
| horton-mounted-walk-n-1 | famous-horton-mounted-cardinal | horton-mounted-walk-n |
| horton-mounted-walk-n-2 | famous-horton-mounted-cardinal | horton-mounted-walk-n |
| kimbell-mounted-walk-s-1 | famous-kimbell-mounted-cardinal | kimbell-mounted-walk-s |
| kimbell-mounted-walk-s-2 | famous-kimbell-mounted-cardinal | kimbell-mounted-walk-s |
| kimbell-mounted-walk-n-1 | famous-kimbell-mounted-cardinal | kimbell-mounted-walk-n |
| kimbell-mounted-walk-n-2 | famous-kimbell-mounted-cardinal | kimbell-mounted-walk-n |
| martin-mounted-walk-s-1 | famous-martin-mounted-cardinal | martin-mounted-walk-s |
| martin-mounted-walk-s-2 | famous-martin-mounted-cardinal | martin-mounted-walk-s |
| martin-mounted-walk-n-1 | famous-martin-mounted-cardinal | martin-mounted-walk-n |
| martin-mounted-walk-n-2 | famous-martin-mounted-cardinal | martin-mounted-walk-n |
| cos-mounted-walk-s-1 | famous-cos-mounted-cardinal | cos-mounted-walk-s |
| cos-mounted-walk-s-2 | famous-cos-mounted-cardinal | cos-mounted-walk-s |
| cos-mounted-walk-n-1 | famous-cos-mounted-cardinal | cos-mounted-walk-n |
| cos-mounted-walk-n-2 | famous-cos-mounted-cardinal | cos-mounted-walk-n |
| urrea-mounted-walk-s-1 | famous-urrea-mounted-cardinal | urrea-mounted-walk-s |
| urrea-mounted-walk-s-2 | famous-urrea-mounted-cardinal | urrea-mounted-walk-s |
| urrea-mounted-walk-n-1 | famous-urrea-mounted-cardinal | urrea-mounted-walk-n |
| urrea-mounted-walk-n-2 | famous-urrea-mounted-cardinal | urrea-mounted-walk-n |
| castaneda-mounted-walk-s-1 | famous-castaneda-mounted-cardinal | castaneda-mounted-walk-s |
| castaneda-mounted-walk-s-2 | famous-castaneda-mounted-cardinal | castaneda-mounted-walk-s |
| castaneda-mounted-walk-n-1 | famous-castaneda-mounted-cardinal | castaneda-mounted-walk-n |
| castaneda-mounted-walk-n-2 | famous-castaneda-mounted-cardinal | castaneda-mounted-walk-n |
| houston-mounted-walk-s-1 | famous-houston-mounted-cardinal | houston-mounted-walk-s |
| houston-mounted-walk-s-2 | famous-houston-mounted-cardinal | houston-mounted-walk-s |
| houston-mounted-walk-n-1 | famous-houston-mounted-cardinal | houston-mounted-walk-n |
| houston-mounted-walk-n-2 | famous-houston-mounted-cardinal | houston-mounted-walk-n |
| santa-anna-mounted-walk-s-1 | famous-santa-anna-mounted-cardinal | santa-anna-mounted-walk-s |
| santa-anna-mounted-walk-s-2 | famous-santa-anna-mounted-cardinal | santa-anna-mounted-walk-s |
| santa-anna-mounted-walk-n-1 | famous-santa-anna-mounted-cardinal | santa-anna-mounted-walk-n |
| santa-anna-mounted-walk-n-2 | famous-santa-anna-mounted-cardinal | santa-anna-mounted-walk-n |
| burleson-mounted-walk-s-1 | famous-burleson-mounted-cardinal | burleson-mounted-walk-s |
| burleson-mounted-walk-s-2 | famous-burleson-mounted-cardinal | burleson-mounted-walk-s |
| burleson-mounted-walk-n-1 | famous-burleson-mounted-cardinal | burleson-mounted-walk-n |
| burleson-mounted-walk-n-2 | famous-burleson-mounted-cardinal | burleson-mounted-walk-n |
| grant-mounted-walk-s-1 | famous-grant-mounted-cardinal | grant-mounted-walk-s |
| grant-mounted-walk-s-2 | famous-grant-mounted-cardinal | grant-mounted-walk-s |
| grant-mounted-walk-n-1 | famous-grant-mounted-cardinal | grant-mounted-walk-n |
| grant-mounted-walk-n-2 | famous-grant-mounted-cardinal | grant-mounted-walk-n |
| houston-mounted-walk-e-1 | famous-houston-mounted | houston-mounted-walk-e |
| houston-mounted-walk-e-2 | famous-houston-mounted | houston-mounted-walk-e |
| houston-mounted-idle-e | famous-houston-mounted | State artwork; no motion required |
| houston-mounted-walk-s | famous-houston-mounted | State artwork; no motion required |
| santa-anna-mounted-walk-e-1 | famous-santa-anna-mounted | santa-anna-mounted-walk-e |
| santa-anna-mounted-walk-e-2 | famous-santa-anna-mounted | santa-anna-mounted-walk-e |
| santa-anna-mounted-idle-e | famous-santa-anna-mounted | State artwork; no motion required |
| santa-anna-mounted-walk-s | famous-santa-anna-mounted | State artwork; no motion required |
| neill-walk-e-1 | famous-neill | neill-walk-e |
| neill-walk-e-2 | famous-neill | neill-walk-e |
| neill-walk-e-3 | famous-neill | neill-walk-e |
| neill-walk-e-4 | famous-neill | neill-walk-e |
| neill-walk-s-1 | famous-neill | neill-walk-s |
| neill-walk-s-2 | famous-neill | neill-walk-s |
| neill-walk-n-1 | famous-neill | neill-walk-n |
| neill-walk-n-2 | famous-neill | neill-walk-n |
| neill-idle | famous-neill | State artwork; no motion required |
| neill-command | famous-neill | State artwork; no motion required |
| neill-rammer | famous-neill | neill-gun-service |
| neill-sight | famous-neill | neill-gun-service |
| neill-brace | famous-neill | neill-gun-service |
| neill-pass-shot | famous-neill | State artwork; no motion required |
| neill-wounded-seated | famous-neill | State artwork; no motion required |
| neill-recover | famous-neill | State artwork; no motion required |
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
| jw-smith-walk-e-1 | famous-jw-smith | jw-smith-walk-e |
| jw-smith-walk-e-2 | famous-jw-smith | jw-smith-walk-e |
| jw-smith-walk-e-3 | famous-jw-smith | State artwork; no motion required |
| jw-smith-walk-e-4 | famous-jw-smith | State artwork; no motion required |
| jw-smith-walk-s-1 | famous-jw-smith | jw-smith-walk-s |
| jw-smith-walk-s-2 | famous-jw-smith | jw-smith-walk-s |
| jw-smith-walk-n-1 | famous-jw-smith | jw-smith-walk-n |
| jw-smith-walk-n-2 | famous-jw-smith | jw-smith-walk-n |
| jw-smith-idle | famous-jw-smith | State artwork; no motion required |
| jw-smith-parley | famous-jw-smith | State artwork; no motion required |
| jw-smith-point | famous-jw-smith | State artwork; no motion required |
| jw-smith-listen | famous-jw-smith | State artwork; no motion required |
| jw-smith-dispatch | famous-jw-smith | State artwork; no motion required |
| jw-smith-read | famous-jw-smith | State artwork; no motion required |
| jw-smith-satchel | famous-jw-smith | State artwork; no motion required |
| jw-smith-rest | famous-jw-smith | State artwork; no motion required |
| jw-smith-mounted-walk-e-1 | famous-jw-smith-mounted | jw-smith-mounted-walk-e |
| jw-smith-mounted-walk-e-2 | famous-jw-smith-mounted | jw-smith-mounted-walk-e |
| jw-smith-mounted-idle-e | famous-jw-smith-mounted | State artwork; no motion required |
| jw-smith-mounted-idle-s | famous-jw-smith-mounted | State artwork; no motion required |
| horton-walk-e-1 | famous-horton | horton-walk-e |
| horton-walk-e-2 | famous-horton | horton-walk-e |
| horton-walk-e-3 | famous-horton | State artwork; no motion required |
| horton-walk-e-4 | famous-horton | State artwork; no motion required |
| horton-walk-s-1 | famous-horton | horton-walk-s |
| horton-walk-s-2 | famous-horton | horton-walk-s |
| horton-walk-n-1 | famous-horton | horton-walk-n |
| horton-walk-n-2 | famous-horton | horton-walk-n |
| horton-idle | famous-horton | State artwork; no motion required |
| horton-parley | famous-horton | State artwork; no motion required |
| horton-point | famous-horton | State artwork; no motion required |
| horton-listen | famous-horton | State artwork; no motion required |
| horton-dispatch | famous-horton | State artwork; no motion required |
| horton-read | famous-horton | State artwork; no motion required |
| horton-satchel | famous-horton | State artwork; no motion required |
| horton-rest | famous-horton | State artwork; no motion required |
| horton-mounted-walk-e-1 | famous-horton-mounted | horton-mounted-walk-e |
| horton-mounted-walk-e-2 | famous-horton-mounted | horton-mounted-walk-e |
| horton-mounted-idle-e | famous-horton-mounted | State artwork; no motion required |
| horton-mounted-idle-s | famous-horton-mounted | State artwork; no motion required |
| kimbell-walk-e-1 | famous-kimbell | kimbell-walk-e |
| kimbell-walk-e-2 | famous-kimbell | kimbell-walk-e |
| kimbell-walk-e-3 | famous-kimbell | State artwork; no motion required |
| kimbell-walk-e-4 | famous-kimbell | State artwork; no motion required |
| kimbell-walk-s-1 | famous-kimbell | kimbell-walk-s |
| kimbell-walk-s-2 | famous-kimbell | kimbell-walk-s |
| kimbell-walk-n-1 | famous-kimbell | kimbell-walk-n |
| kimbell-walk-n-2 | famous-kimbell | kimbell-walk-n |
| kimbell-idle | famous-kimbell | State artwork; no motion required |
| kimbell-parley | famous-kimbell | State artwork; no motion required |
| kimbell-point | famous-kimbell | State artwork; no motion required |
| kimbell-listen | famous-kimbell | State artwork; no motion required |
| kimbell-dispatch | famous-kimbell | State artwork; no motion required |
| kimbell-read | famous-kimbell | State artwork; no motion required |
| kimbell-satchel | famous-kimbell | State artwork; no motion required |
| kimbell-rest | famous-kimbell | State artwork; no motion required |
| kimbell-mounted-walk-e-1 | famous-kimbell-mounted | kimbell-mounted-walk-e |
| kimbell-mounted-walk-e-2 | famous-kimbell-mounted | kimbell-mounted-walk-e |
| kimbell-mounted-idle-e | famous-kimbell-mounted | State artwork; no motion required |
| kimbell-mounted-idle-s | famous-kimbell-mounted | State artwork; no motion required |
| martin-walk-e-1 | famous-martin | martin-walk-e |
| martin-walk-e-2 | famous-martin | martin-walk-e |
| martin-walk-e-3 | famous-martin | State artwork; no motion required |
| martin-walk-e-4 | famous-martin | State artwork; no motion required |
| martin-walk-s-1 | famous-martin | martin-walk-s |
| martin-walk-s-2 | famous-martin | martin-walk-s |
| martin-walk-n-1 | famous-martin | martin-walk-n |
| martin-walk-n-2 | famous-martin | martin-walk-n |
| martin-idle | famous-martin | State artwork; no motion required |
| martin-parley | famous-martin | State artwork; no motion required |
| martin-point | famous-martin | State artwork; no motion required |
| martin-listen | famous-martin | State artwork; no motion required |
| martin-dispatch | famous-martin | State artwork; no motion required |
| martin-read | famous-martin | State artwork; no motion required |
| martin-satchel | famous-martin | State artwork; no motion required |
| martin-rest | famous-martin | State artwork; no motion required |
| martin-mounted-walk-e-1 | famous-martin-mounted | martin-mounted-walk-e |
| martin-mounted-walk-e-2 | famous-martin-mounted | martin-mounted-walk-e |
| martin-mounted-idle-e | famous-martin-mounted | State artwork; no motion required |
| martin-mounted-idle-s | famous-martin-mounted | State artwork; no motion required |
| rusk-walk-e-1 | famous-rusk | rusk-walk-e |
| rusk-walk-e-2 | famous-rusk | rusk-walk-e |
| rusk-walk-e-3 | famous-rusk | rusk-walk-e |
| rusk-walk-e-4 | famous-rusk | rusk-walk-e |
| rusk-walk-s-1 | famous-rusk | rusk-walk-s |
| rusk-walk-s-2 | famous-rusk | rusk-walk-s |
| rusk-walk-n-1 | famous-rusk | rusk-walk-n |
| rusk-walk-n-2 | famous-rusk | rusk-walk-n |
| rusk-idle | famous-rusk | State artwork; no motion required |
| rusk-command | famous-rusk | State artwork; no motion required |
| rusk-stop-one | famous-rusk | rusk-stop |
| rusk-stop-both | famous-rusk | rusk-stop |
| rusk-reach | famous-rusk | State artwork; no motion required |
| rusk-read | famous-rusk | State artwork; no motion required |
| rusk-write | famous-rusk | State artwork; no motion required |
| rusk-rest | famous-rusk | State artwork; no motion required |
| rusk-mounted-walk-e-1 | famous-rusk-mounted | rusk-mounted-walk-e |
| rusk-mounted-walk-e-2 | famous-rusk-mounted | rusk-mounted-walk-e |
| rusk-mounted-idle-e | famous-rusk-mounted | State artwork; no motion required |
| rusk-mounted-stop-e | famous-rusk-mounted | State artwork; no motion required |
| sanchez-navarro-walk-e-1 | famous-sanchez-navarro | sanchez-navarro-walk-e |
| sanchez-navarro-walk-e-2 | famous-sanchez-navarro | sanchez-navarro-walk-e |
| sanchez-navarro-walk-e-3 | famous-sanchez-navarro | State artwork; no motion required |
| sanchez-navarro-walk-e-4 | famous-sanchez-navarro | State artwork; no motion required |
| sanchez-navarro-walk-s-1 | famous-sanchez-navarro | sanchez-navarro-walk-s |
| sanchez-navarro-walk-s-2 | famous-sanchez-navarro | sanchez-navarro-walk-s |
| sanchez-navarro-walk-n-1 | famous-sanchez-navarro | sanchez-navarro-walk-n |
| sanchez-navarro-walk-n-2 | famous-sanchez-navarro | sanchez-navarro-walk-n |
| sanchez-navarro-idle | famous-sanchez-navarro | State artwork; no motion required |
| sanchez-navarro-parley | famous-sanchez-navarro | sanchez-navarro-parley |
| sanchez-navarro-listen | famous-sanchez-navarro | sanchez-navarro-parley |
| sanchez-navarro-dispatch | famous-sanchez-navarro | State artwork; no motion required |
| sanchez-navarro-read | famous-sanchez-navarro | State artwork; no motion required |
| sanchez-navarro-offer | famous-sanchez-navarro | State artwork; no motion required |
| sanchez-navarro-point | famous-sanchez-navarro | State artwork; no motion required |
| sanchez-navarro-rest | famous-sanchez-navarro | State artwork; no motion required |
| deaf-smith-mounted-walk-s-1 | famous-deaf-smith-mounted-cardinal | deaf-smith-mounted-walk-s |
| deaf-smith-mounted-walk-s-2 | famous-deaf-smith-mounted-cardinal | deaf-smith-mounted-walk-s |
| deaf-smith-mounted-walk-n-1 | famous-deaf-smith-mounted-cardinal | deaf-smith-mounted-walk-n |
| deaf-smith-mounted-walk-n-2 | famous-deaf-smith-mounted-cardinal | deaf-smith-mounted-walk-n |
| karnes-mounted-walk-s-1 | famous-karnes-mounted-cardinal | karnes-mounted-walk-s |
| karnes-mounted-walk-s-2 | famous-karnes-mounted-cardinal | karnes-mounted-walk-s |
| karnes-mounted-walk-n-1 | famous-karnes-mounted-cardinal | karnes-mounted-walk-n |
| karnes-mounted-walk-n-2 | famous-karnes-mounted-cardinal | karnes-mounted-walk-n |
| lamar-mounted-walk-s-1 | famous-lamar-mounted-cardinal | lamar-mounted-walk-s |
| lamar-mounted-walk-s-2 | famous-lamar-mounted-cardinal | lamar-mounted-walk-s |
| lamar-mounted-walk-n-1 | famous-lamar-mounted-cardinal | lamar-mounted-walk-n |
| lamar-mounted-walk-n-2 | famous-lamar-mounted-cardinal | lamar-mounted-walk-n |
| sherman-mounted-walk-s-1 | famous-sherman-mounted-cardinal | sherman-mounted-walk-s |
| sherman-mounted-walk-s-2 | famous-sherman-mounted-cardinal | sherman-mounted-walk-s |
| sherman-mounted-walk-n-1 | famous-sherman-mounted-cardinal | sherman-mounted-walk-n |
| sherman-mounted-walk-n-2 | famous-sherman-mounted-cardinal | sherman-mounted-walk-n |
| rusk-mounted-walk-s-1 | famous-rusk-mounted-cardinal | rusk-mounted-walk-s |
| rusk-mounted-walk-s-2 | famous-rusk-mounted-cardinal | rusk-mounted-walk-s |
| rusk-mounted-walk-n-1 | famous-rusk-mounted-cardinal | rusk-mounted-walk-n |
| rusk-mounted-walk-n-2 | famous-rusk-mounted-cardinal | rusk-mounted-walk-n |
| seguin-mounted-walk-e-1 | famous-seguin-mounted-motion | seguin-mounted-walk-e |
| seguin-mounted-walk-e-2 | famous-seguin-mounted-motion | seguin-mounted-walk-e |
| seguin-mounted-canter-e-1 | famous-seguin-mounted-motion | seguin-mounted-canter-e |
| seguin-mounted-canter-e-2 | famous-seguin-mounted-motion | seguin-mounted-canter-e |
| seguin-mounted-walk-s-1 | famous-seguin-mounted-ns | seguin-mounted-walk-s |
| seguin-mounted-walk-s-2 | famous-seguin-mounted-ns | seguin-mounted-walk-s |
| seguin-mounted-walk-n-1 | famous-seguin-mounted-ns | seguin-mounted-walk-n |
| seguin-mounted-walk-n-2 | famous-seguin-mounted-ns | seguin-mounted-walk-n |
| sherman-walk-e-1 | famous-sherman | sherman-walk-e |
| sherman-walk-e-2 | famous-sherman | sherman-walk-e |
| sherman-walk-e-3 | famous-sherman | sherman-walk-e |
| sherman-walk-e-4 | famous-sherman | sherman-walk-e |
| sherman-walk-s-1 | famous-sherman | sherman-walk-s |
| sherman-walk-s-2 | famous-sherman | sherman-walk-s |
| sherman-walk-n-1 | famous-sherman | sherman-walk-n |
| sherman-walk-n-2 | famous-sherman | sherman-walk-n |
| sherman-idle | famous-sherman | State artwork; no motion required |
| sherman-command | famous-sherman | State artwork; no motion required |
| sherman-rally | famous-sherman | State artwork; no motion required |
| sherman-glass | famous-sherman | State artwork; no motion required |
| sherman-folded-banner | famous-sherman | State artwork; no motion required |
| sherman-point | famous-sherman | State artwork; no motion required |
| sherman-listen | famous-sherman | State artwork; no motion required |
| sherman-rest | famous-sherman | State artwork; no motion required |
| sherman-mounted-walk-e-1 | famous-sherman-mounted | sherman-mounted-walk-e |
| sherman-mounted-walk-e-2 | famous-sherman-mounted | sherman-mounted-walk-e |
| sherman-mounted-idle-e | famous-sherman-mounted | State artwork; no motion required |
| sherman-mounted-rally-e | famous-sherman-mounted | State artwork; no motion required |
| smither-walk-e-1 | famous-smither | smither-walk-e |
| smither-walk-e-2 | famous-smither | smither-walk-e |
| smither-walk-e-3 | famous-smither | State artwork; no motion required |
| smither-walk-e-4 | famous-smither | State artwork; no motion required |
| smither-walk-s-1 | famous-smither | smither-walk-s |
| smither-walk-s-2 | famous-smither | smither-walk-s |
| smither-walk-n-1 | famous-smither | smither-walk-n |
| smither-walk-n-2 | famous-smither | smither-walk-n |
| smither-idle | famous-smither | State artwork; no motion required |
| smither-stop | famous-smither | State artwork; no motion required |
| smither-speak | famous-smither | State artwork; no motion required |
| smither-listen | famous-smither | State artwork; no motion required |
| smither-dispatch | famous-smither | State artwork; no motion required |
| smither-read | famous-smither | State artwork; no motion required |
| smither-satchel | famous-smither | State artwork; no motion required |
| smither-rest | famous-smither | State artwork; no motion required |
| smither-mounted-walk-e-1 | famous-smither-mounted | smither-mounted-walk-e |
| smither-mounted-walk-e-2 | famous-smither-mounted | smither-mounted-walk-e |
| smither-mounted-idle-e | famous-smither-mounted | State artwork; no motion required |
| smither-mounted-idle-s | famous-smither-mounted | State artwork; no motion required |
| fannin-story-command-1 | famous-fannin-story-actions | fannin-story-command |
| fannin-story-command-2 | famous-fannin-story-actions | fannin-story-command |
| fannin-story-surrender-1 | famous-fannin-story-actions | fannin-story-surrender |
| fannin-story-surrender-2 | famous-fannin-story-actions | fannin-story-surrender |
| milam-story-rally-1 | famous-milam-story-actions | milam-story-rally |
| milam-story-rally-2 | famous-milam-story-actions | milam-story-rally |
| milam-story-point-1 | famous-milam-story-actions | milam-story-point |
| milam-story-point-2 | famous-milam-story-actions | milam-story-point |
| crockett-story-command-1 | famous-crockett-story-actions | crockett-story-command |
| crockett-story-command-2 | famous-crockett-story-actions | crockett-story-command |
| crockett-story-rest-1 | famous-crockett-story-actions | crockett-story-rest |
| crockett-story-rest-2 | famous-crockett-story-actions | crockett-story-rest |
| bowie-story-command-1 | famous-bowie-story-actions | bowie-story-command |
| bowie-story-command-2 | famous-bowie-story-actions | bowie-story-command |
| bowie-story-sick-1 | famous-bowie-story-actions | bowie-story-sick |
| bowie-story-sick-2 | famous-bowie-story-actions | bowie-story-sick |
| alavez-story-beckon-1 | famous-alavez-story-actions | alavez-story-beckon |
| alavez-story-beckon-2 | famous-alavez-story-actions | alavez-story-beckon |
| alavez-story-guide-1 | famous-alavez-story-actions | alavez-story-guide |
| alavez-story-guide-2 | famous-alavez-story-actions | alavez-story-guide |
| ben-story-pot-walk-1 | famous-ben-story-actions | ben-story-pot-walk |
| ben-story-pot-walk-2 | famous-ben-story-actions | ben-story-pot-walk |
| ben-story-conversation-1 | famous-ben-story-actions | ben-story-conversation |
| ben-story-conversation-2 | famous-ben-story-actions | ben-story-conversation |
| esparza-story-ram-1 | famous-esparza-story-actions | esparza-story-ram |
| esparza-story-ram-2 | famous-esparza-story-actions | esparza-story-ram |
| esparza-story-shot-carry-1 | famous-esparza-story-actions | esparza-story-shot-carry |
| esparza-story-shot-carry-2 | famous-esparza-story-actions | esparza-story-shot-carry |
| almeron-dickinson-story-ram-1 | famous-almeron-dickinson-story-actions | almeron-dickinson-story-ram |
| almeron-dickinson-story-ram-2 | famous-almeron-dickinson-story-actions | almeron-dickinson-story-ram |
| almeron-dickinson-story-shot-carry-1 | famous-almeron-dickinson-story-actions | almeron-dickinson-story-shot-carry |
| almeron-dickinson-story-shot-carry-2 | famous-almeron-dickinson-story-actions | almeron-dickinson-story-shot-carry |
| urrea-walk-e-1 | famous-urrea | urrea-walk-e |
| urrea-walk-e-2 | famous-urrea | urrea-walk-e |
| urrea-walk-e-3 | famous-urrea | urrea-walk-e |
| urrea-walk-e-4 | famous-urrea | urrea-walk-e |
| urrea-walk-s-1 | famous-urrea | urrea-walk-s |
| urrea-walk-s-2 | famous-urrea | urrea-walk-s |
| urrea-walk-n-1 | famous-urrea | urrea-walk-n |
| urrea-walk-n-2 | famous-urrea | urrea-walk-n |
| urrea-idle | famous-urrea | State artwork; no motion required |
| urrea-command | famous-urrea | State artwork; no motion required |
| urrea-point | famous-urrea | State artwork; no motion required |
| urrea-map | famous-urrea | State artwork; no motion required |
| urrea-dispatch | famous-urrea | State artwork; no motion required |
| urrea-address | famous-urrea | State artwork; no motion required |
| urrea-receive-paper | famous-urrea | State artwork; no motion required |
| urrea-rest | famous-urrea | State artwork; no motion required |
| urrea-mounted-walk-e-1 | famous-urrea-mounted | urrea-mounted-walk-e |
| urrea-mounted-walk-e-2 | famous-urrea-mounted | urrea-mounted-walk-e |
| urrea-mounted-idle-e | famous-urrea-mounted | State artwork; no motion required |
| urrea-mounted-idle-s | famous-urrea-mounted | State artwork; no motion required |
| wp-smith-walk-e-1 | famous-wp-smith | wp-smith-walk-e |
| wp-smith-walk-e-2 | famous-wp-smith | wp-smith-walk-e |
| wp-smith-walk-e-3 | famous-wp-smith | State artwork; no motion required |
| wp-smith-walk-e-4 | famous-wp-smith | State artwork; no motion required |
| wp-smith-walk-s-1 | famous-wp-smith | wp-smith-walk-s |
| wp-smith-walk-s-2 | famous-wp-smith | wp-smith-walk-s |
| wp-smith-walk-n-1 | famous-wp-smith | wp-smith-walk-n |
| wp-smith-walk-n-2 | famous-wp-smith | wp-smith-walk-n |
| wp-smith-idle | famous-wp-smith | State artwork; no motion required |
| wp-smith-speak | famous-wp-smith | wp-smith-address |
| wp-smith-exhort | famous-wp-smith | wp-smith-address |
| wp-smith-listen | famous-wp-smith | State artwork; no motion required |
| wp-smith-book | famous-wp-smith | State artwork; no motion required |
| wp-smith-read | famous-wp-smith | State artwork; no motion required |
| wp-smith-point | famous-wp-smith | State artwork; no motion required |
| wp-smith-rest | famous-wp-smith | State artwork; no motion required |
| timber-felled-e | timber-felled | timber-felled-e |
| timber-felled-n | timber-felled | timber-felled-n |
| timber-trimmed-e | timber-felled | timber-trimmed-e |
| timber-stack | timber-felled | timber-stack |
| flag-come-and-take-it | flag-come-and-take-it | flag-come-and-take-it-wind |
| flag-come-and-take-it-wind-1 | flag-come-and-take-it | flag-come-and-take-it-wind |
| flag-come-and-take-it-wind-2 | flag-come-and-take-it | flag-come-and-take-it-wind |
| flag-come-and-take-it-wind-3 | flag-come-and-take-it | flag-come-and-take-it-wind |
| prisoner2-walk-e-1 | goliad-prisoner-second | prisoner2-walk-e |
| prisoner2-walk-e-2 | goliad-prisoner-second | prisoner2-walk-e |
| prisoner2-walk-e-3 | goliad-prisoner-second | prisoner2-walk-e |
| prisoner2-walk-e-4 | goliad-prisoner-second | prisoner2-walk-e |
| prisoner2-walk-s-1 | goliad-prisoner-second | prisoner2-walk-s |
| prisoner2-walk-s-2 | goliad-prisoner-second | prisoner2-walk-s |
| prisoner2-walk-n-1 | goliad-prisoner-second | prisoner2-walk-n |
| prisoner2-walk-n-2 | goliad-prisoner-second | prisoner2-walk-n |
| prisoner2-idle-e | goliad-prisoner-second | State artwork; no motion required |
| prisoner2-idle-s | goliad-prisoner-second | State artwork; no motion required |
| prisoner2-listen | goliad-prisoner-second | State artwork; no motion required |
| prisoner2-look-back | goliad-prisoner-second | State artwork; no motion required |
| prisoner2-run-e | goliad-prisoner-second | State artwork; no motion required |
| prisoner2-duck | goliad-prisoner-second | State artwork; no motion required |
| prisoner2-injured | goliad-prisoner-second | State artwork; no motion required |
| prisoner2-still | goliad-prisoner-second | State artwork; no motion required |
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
| teal-bundle-walk-s-1 | people-gonzales-bundle-ns | teal-bundle-walk-s |
| teal-bundle-walk-s-2 | people-gonzales-bundle-ns | teal-bundle-walk-s |
| teal-bundle-walk-n-1 | people-gonzales-bundle-ns | teal-bundle-walk-n |
| teal-bundle-walk-n-2 | people-gonzales-bundle-ns | teal-bundle-walk-n |
| indigo-bundle-walk-s-1 | people-gonzales-bundle-ns | indigo-bundle-walk-s |
| indigo-bundle-walk-s-2 | people-gonzales-bundle-ns | indigo-bundle-walk-s |
| indigo-bundle-walk-n-1 | people-gonzales-bundle-ns | indigo-bundle-walk-n |
| indigo-bundle-walk-n-2 | people-gonzales-bundle-ns | indigo-bundle-walk-n |
| blue-girl-bundle-walk-s-1 | people-gonzales-bundle-ns | blue-girl-bundle-walk-s |
| blue-girl-bundle-walk-s-2 | people-gonzales-bundle-ns | blue-girl-bundle-walk-s |
| blue-girl-bundle-walk-n-1 | people-gonzales-bundle-ns | blue-girl-bundle-walk-n |
| blue-girl-bundle-walk-n-2 | people-gonzales-bundle-ns | blue-girl-bundle-walk-n |
| elder-bundle-walk-s-1 | people-gonzales-bundle-ns | elder-bundle-walk-s |
| elder-bundle-walk-s-2 | people-gonzales-bundle-ns | elder-bundle-walk-s |
| elder-bundle-walk-n-1 | people-gonzales-bundle-ns | elder-bundle-walk-n |
| elder-bundle-walk-n-2 | people-gonzales-bundle-ns | elder-bundle-walk-n |
| teal-bundle-walk-1 | people-gonzales-bundle-walk | teal-bundle-walk |
| teal-bundle-walk-2 | people-gonzales-bundle-walk | teal-bundle-walk |
| teal-bundle-walk-3 | people-gonzales-bundle-walk | teal-bundle-walk |
| teal-bundle-walk-4 | people-gonzales-bundle-walk | teal-bundle-walk |
| indigo-bundle-walk-1 | people-gonzales-bundle-walk | indigo-bundle-walk |
| indigo-bundle-walk-2 | people-gonzales-bundle-walk | indigo-bundle-walk |
| indigo-bundle-walk-3 | people-gonzales-bundle-walk | indigo-bundle-walk |
| indigo-bundle-walk-4 | people-gonzales-bundle-walk | indigo-bundle-walk |
| blue-girl-bundle-walk-1 | people-gonzales-bundle-walk | blue-girl-bundle-walk |
| blue-girl-bundle-walk-2 | people-gonzales-bundle-walk | blue-girl-bundle-walk |
| blue-girl-bundle-walk-3 | people-gonzales-bundle-walk | blue-girl-bundle-walk |
| blue-girl-bundle-walk-4 | people-gonzales-bundle-walk | blue-girl-bundle-walk |
| elder-bundle-walk-1 | people-gonzales-bundle-walk | elder-bundle-walk |
| elder-bundle-walk-2 | people-gonzales-bundle-walk | elder-bundle-walk |
| elder-bundle-walk-3 | people-gonzales-bundle-walk | elder-bundle-walk |
| elder-bundle-walk-4 | people-gonzales-bundle-walk | elder-bundle-walk |
| elder-dig-1 | people-gonzales-digging | elder-dig |
| elder-dig-2 | people-gonzales-digging | elder-dig |
| elder-dig-3 | people-gonzales-digging | elder-dig |
| elder-dig-4 | people-gonzales-digging | elder-dig |
| ochre-dig-1 | people-gonzales-digging | ochre-dig |
| ochre-dig-2 | people-gonzales-digging | ochre-dig |
| ochre-dig-3 | people-gonzales-digging | ochre-dig |
| ochre-dig-4 | people-gonzales-digging | ochre-dig |
| blue-dig-1 | people-gonzales-digging | blue-dig |
| blue-dig-2 | people-gonzales-digging | blue-dig |
| blue-dig-3 | people-gonzales-digging | blue-dig |
| blue-dig-4 | people-gonzales-digging | blue-dig |
| flag-come-and-take-it-no-star-wind-1 | gonzales-flag-variants | flag-come-and-take-it-no-star-wind |
| flag-come-and-take-it-no-star-wind-2 | gonzales-flag-variants | flag-come-and-take-it-no-star-wind |
| flag-come-and-take-it-no-star-wind-3 | gonzales-flag-variants | flag-come-and-take-it-no-star-wind |
| flag-come-and-take-it-no-star-wind-4 | gonzales-flag-variants | flag-come-and-take-it-no-star-wind |
| gonzales-flag-work-half-star | gonzales-flag-variants | State artwork; no motion required |
| gonzales-flag-work-done-star | gonzales-flag-variants | State artwork; no motion required |
| gonzales-flag-work-half-no-star | gonzales-flag-variants | State artwork; no motion required |
| gonzales-flag-work-done-no-star | gonzales-flag-variants | State artwork; no motion required |
| gonzales-ploughed-earth | gonzales-ploughed-earth | State artwork; no motion required |
| gonzales-flag-work-cloth | gonzales-flag-work-cloth | State artwork; no motion required |
| gonzales-flag-work-painted | gonzales-flag-work-painted | State artwork; no motion required |
| elder-read-letter-1 | people-gonzales-letter-reading | elder-read-letter |
| elder-read-letter-2 | people-gonzales-letter-reading | elder-read-letter |
| elder-read-letter-3 | people-gonzales-letter-reading | elder-read-letter |
| elder-read-letter-4 | people-gonzales-letter-reading | elder-read-letter |
| ochre-read-letter-1 | people-gonzales-letter-reading | ochre-read-letter |
| ochre-read-letter-2 | people-gonzales-letter-reading | ochre-read-letter |
| ochre-read-letter-3 | people-gonzales-letter-reading | ochre-read-letter |
| ochre-read-letter-4 | people-gonzales-letter-reading | ochre-read-letter |
| blue-read-letter-1 | people-gonzales-letter-reading | blue-read-letter |
| blue-read-letter-2 | people-gonzales-letter-reading | blue-read-letter |
| blue-read-letter-3 | people-gonzales-letter-reading | blue-read-letter |
| blue-read-letter-4 | people-gonzales-letter-reading | blue-read-letter |
| teal-paint-1 | people-gonzales-paint | teal-paint |
| teal-paint-2 | people-gonzales-paint | teal-paint |
| indigo-paint-1 | people-gonzales-paint | indigo-paint |
| indigo-paint-2 | people-gonzales-paint | indigo-paint |
| blue-girl-paint-1 | people-gonzales-paint | blue-girl-paint |
| blue-girl-paint-2 | people-gonzales-paint | blue-girl-paint |
| indigo-river-watch-1 | people-gonzales-river-cast-east | indigo-river-watch |
| indigo-river-watch-2 | people-gonzales-river-cast-east | indigo-river-watch |
| indigo-river-point-1 | people-gonzales-river-cast-east | indigo-river-point |
| indigo-river-point-2 | people-gonzales-river-cast-east | indigo-river-point |
| blue-river-watch-1 | people-gonzales-river-cast-east | blue-river-watch |
| blue-river-watch-2 | people-gonzales-river-cast-east | blue-river-watch |
| blue-river-point-1 | people-gonzales-river-cast-east | blue-river-point |
| blue-river-point-2 | people-gonzales-river-cast-east | blue-river-point |
| ochre-river-watch-1 | people-gonzales-river-final-east | ochre-river-watch |
| ochre-river-watch-2 | people-gonzales-river-final-east | ochre-river-watch |
| ochre-river-point-1 | people-gonzales-river-final-east | ochre-river-point |
| ochre-river-point-2 | people-gonzales-river-final-east | ochre-river-point |
| blue-girl-river-watch-1 | people-gonzales-river-final-east | blue-girl-river-watch |
| blue-girl-river-watch-2 | people-gonzales-river-final-east | blue-girl-river-watch |
| blue-girl-river-point-1 | people-gonzales-river-final-east | blue-girl-river-point |
| blue-girl-river-point-2 | people-gonzales-river-final-east | blue-girl-river-point |
| ochre-river-watch-s-1 | people-gonzales-river-final-ns | ochre-river-watch-s |
| ochre-river-watch-s-2 | people-gonzales-river-final-ns | ochre-river-watch-s |
| ochre-river-point-s-1 | people-gonzales-river-final-ns | ochre-river-point-s |
| ochre-river-point-s-2 | people-gonzales-river-final-ns | ochre-river-point-s |
| blue-girl-river-watch-s-1 | people-gonzales-river-final-ns | blue-girl-river-watch-s |
| blue-girl-river-watch-s-2 | people-gonzales-river-final-ns | blue-girl-river-watch-s |
| blue-girl-river-point-s-1 | people-gonzales-river-final-ns | blue-girl-river-point-s |
| blue-girl-river-point-s-2 | people-gonzales-river-final-ns | blue-girl-river-point-s |
| ochre-river-watch-n-1 | people-gonzales-river-final-ns | ochre-river-watch-n |
| ochre-river-watch-n-2 | people-gonzales-river-final-ns | ochre-river-watch-n |
| ochre-river-point-n-1 | people-gonzales-river-final-ns | ochre-river-point-n |
| ochre-river-point-n-2 | people-gonzales-river-final-ns | ochre-river-point-n |
| blue-girl-river-watch-n-1 | people-gonzales-river-final-ns | blue-girl-river-watch-n |
| blue-girl-river-watch-n-2 | people-gonzales-river-final-ns | blue-girl-river-watch-n |
| blue-girl-river-point-n-1 | people-gonzales-river-final-ns | blue-girl-river-point-n |
| blue-girl-river-point-n-2 | people-gonzales-river-final-ns | blue-girl-river-point-n |
| teal-river-watch-1 | people-river-gestures | teal-river-watch |
| teal-river-watch-2 | people-river-gestures | teal-river-watch |
| teal-river-point-1 | people-river-gestures | teal-river-point |
| teal-river-point-2 | people-river-gestures | teal-river-point |
| elder-river-watch-1 | people-river-gestures | elder-river-watch |
| elder-river-watch-2 | people-river-gestures | elder-river-watch |
| elder-river-point-1 | people-river-gestures | elder-river-point |
| elder-river-point-2 | people-river-gestures | elder-river-point |
| teal-river-watch-n-1 | people-gonzales-river-north | teal-river-watch-n |
| teal-river-watch-n-2 | people-gonzales-river-north | teal-river-watch-n |
| teal-river-point-n-1 | people-gonzales-river-north | teal-river-point-n |
| teal-river-point-n-2 | people-gonzales-river-north | teal-river-point-n |
| indigo-river-watch-n-1 | people-gonzales-river-north | indigo-river-watch-n |
| indigo-river-watch-n-2 | people-gonzales-river-north | indigo-river-watch-n |
| indigo-river-point-n-1 | people-gonzales-river-north | indigo-river-point-n |
| indigo-river-point-n-2 | people-gonzales-river-north | indigo-river-point-n |
| elder-river-watch-n-1 | people-gonzales-river-north | elder-river-watch-n |
| elder-river-watch-n-2 | people-gonzales-river-north | elder-river-watch-n |
| elder-river-point-n-1 | people-gonzales-river-north | elder-river-point-n |
| elder-river-point-n-2 | people-gonzales-river-north | elder-river-point-n |
| blue-river-watch-n-1 | people-gonzales-river-north | blue-river-watch-n |
| blue-river-watch-n-2 | people-gonzales-river-north | blue-river-watch-n |
| blue-river-point-n-1 | people-gonzales-river-north | blue-river-point-n |
| blue-river-point-n-2 | people-gonzales-river-north | blue-river-point-n |
| teal-river-watch-s-1 | people-gonzales-river-south | teal-river-watch-s |
| teal-river-watch-s-2 | people-gonzales-river-south | teal-river-watch-s |
| teal-river-point-s-1 | people-gonzales-river-south | teal-river-point-s |
| teal-river-point-s-2 | people-gonzales-river-south | teal-river-point-s |
| indigo-river-watch-s-1 | people-gonzales-river-south | indigo-river-watch-s |
| indigo-river-watch-s-2 | people-gonzales-river-south | indigo-river-watch-s |
| indigo-river-point-s-1 | people-gonzales-river-south | indigo-river-point-s |
| indigo-river-point-s-2 | people-gonzales-river-south | indigo-river-point-s |
| elder-river-watch-s-1 | people-gonzales-river-south | elder-river-watch-s |
| elder-river-watch-s-2 | people-gonzales-river-south | elder-river-watch-s |
| elder-river-point-s-1 | people-gonzales-river-south | elder-river-point-s |
| elder-river-point-s-2 | people-gonzales-river-south | elder-river-point-s |
| blue-river-watch-s-1 | people-gonzales-river-south | blue-river-watch-s |
| blue-river-watch-s-2 | people-gonzales-river-south | blue-river-watch-s |
| blue-river-point-s-1 | people-gonzales-river-south | blue-river-point-s |
| blue-river-point-s-2 | people-gonzales-river-south | blue-river-point-s |
| teal-seated-paint-1 | people-gonzales-seated-paint | teal-seated-paint |
| teal-seated-paint-2 | people-gonzales-seated-paint | teal-seated-paint |
| teal-seated-paint-3 | people-gonzales-seated-paint | teal-seated-paint |
| teal-seated-paint-4 | people-gonzales-seated-paint | teal-seated-paint |
| indigo-seated-paint-1 | people-gonzales-seated-paint | indigo-seated-paint |
| indigo-seated-paint-2 | people-gonzales-seated-paint | indigo-seated-paint |
| indigo-seated-paint-3 | people-gonzales-seated-paint | indigo-seated-paint |
| indigo-seated-paint-4 | people-gonzales-seated-paint | indigo-seated-paint |
| blue-girl-seated-paint-1 | people-gonzales-seated-paint | blue-girl-seated-paint |
| blue-girl-seated-paint-2 | people-gonzales-seated-paint | blue-girl-seated-paint |
| blue-girl-seated-paint-3 | people-gonzales-seated-paint | blue-girl-seated-paint |
| blue-girl-seated-paint-4 | people-gonzales-seated-paint | blue-girl-seated-paint |
| elder-smith-hammer-1 | people-gonzales-smiths | elder-smith-hammer |
| elder-smith-hammer-2 | people-gonzales-smiths | elder-smith-hammer |
| elder-smith-hammer-3 | people-gonzales-smiths | elder-smith-hammer |
| elder-smith-hammer-4 | people-gonzales-smiths | elder-smith-hammer |
| elder-smith-chain-1 | people-gonzales-smiths | elder-smith-chain |
| elder-smith-chain-2 | people-gonzales-smiths | elder-smith-chain |
| elder-smith-chain-3 | people-gonzales-smiths | elder-smith-chain |
| elder-smith-chain-4 | people-gonzales-smiths | elder-smith-chain |
| ochre-smith-hammer-1 | people-gonzales-smiths | ochre-smith-hammer |
| ochre-smith-hammer-2 | people-gonzales-smiths | ochre-smith-hammer |
| ochre-smith-hammer-3 | people-gonzales-smiths | ochre-smith-hammer |
| ochre-smith-hammer-4 | people-gonzales-smiths | ochre-smith-hammer |
| ochre-smith-chain-1 | people-gonzales-smiths | ochre-smith-chain |
| ochre-smith-chain-2 | people-gonzales-smiths | ochre-smith-chain |
| ochre-smith-chain-3 | people-gonzales-smiths | ochre-smith-chain |
| ochre-smith-chain-4 | people-gonzales-smiths | ochre-smith-chain |
| gonzales-forge-cold | gonzales-smith-props | State artwork; no motion required |
| gonzales-forge-lit | gonzales-smith-props | State artwork; no motion required |
| gonzales-anvil-stump | gonzales-smith-props | State artwork; no motion required |
| gonzales-chain-tools | gonzales-smith-props | State artwork; no motion required |
| creek-bed-dry | grass-creek-terrain | State artwork; no motion required |
| creek-bed-curve | grass-creek-terrain | State artwork; no motion required |
| creek-ditch-dry | grass-creek-terrain | State artwork; no motion required |
| creek-bed-end | grass-creek-terrain | State artwork; no motion required |
| creek-ford-1 | grass-creek-terrain | creek-ford |
| creek-ford-2 | grass-creek-terrain | creek-ford |
| creek-ford-3 | grass-creek-terrain | creek-ford |
| creek-ford-4 | grass-creek-terrain | creek-ford |
| mule-packed-grass-walk-e-1 | mule-packed-grass | mule-packed-grass-walk-e |
| mule-packed-grass-walk-e-2 | mule-packed-grass | mule-packed-grass-walk-e |
| mule-packed-grass-walk-e-3 | mule-packed-grass | mule-packed-grass-walk-e |
| mule-packed-grass-walk-e-4 | mule-packed-grass | mule-packed-grass-walk-e |
| mule-packed-grass-walk-s-1 | mule-packed-grass | mule-packed-grass-walk-s |
| mule-packed-grass-walk-s-2 | mule-packed-grass | mule-packed-grass-walk-s |
| mule-packed-grass-walk-s-3 | mule-packed-grass | mule-packed-grass-walk-s |
| mule-packed-grass-walk-s-4 | mule-packed-grass | mule-packed-grass-walk-s |
| mule-packed-grass-walk-n-1 | mule-packed-grass | mule-packed-grass-walk-n |
| mule-packed-grass-walk-n-2 | mule-packed-grass | mule-packed-grass-walk-n |
| mule-packed-grass-walk-n-3 | mule-packed-grass | mule-packed-grass-walk-n |
| mule-packed-grass-walk-n-4 | mule-packed-grass | mule-packed-grass-walk-n |
| mule-packed-grass-idle-e | mule-packed-grass | State artwork; no motion required |
| mule-packed-grass-idle-s | mule-packed-grass | State artwork; no motion required |
| mule-packed-grass-idle-n | mule-packed-grass | State artwork; no motion required |
| grass-bundle-cut | mule-packed-grass | State artwork; no motion required |
| fog-bank-dense-1 | ground-fog-banks | fog-bank-dense |
| fog-bank-dense-2 | ground-fog-banks | fog-bank-dense |
| fog-bank-thin-1 | ground-fog-banks | fog-bank-thin |
| fog-bank-thin-2 | ground-fog-banks | fog-bank-thin |
| mesquite-pole-gale-1 | mesquite-liveoak-gale | mesquite-pole-gale |
| mesquite-pole-gale-2 | mesquite-liveoak-gale | mesquite-pole-gale |
| live-oak-pole-gale-1 | mesquite-liveoak-gale | live-oak-pole-gale |
| live-oak-pole-gale-2 | mesquite-liveoak-gale | live-oak-pole-gale |
| mesquite-log-gale-1 | mesquite-liveoak-gale | mesquite-log-gale |
| mesquite-log-gale-2 | mesquite-liveoak-gale | mesquite-log-gale |
| live-oak-log-gale-1 | mesquite-liveoak-gale | live-oak-log-gale |
| live-oak-log-gale-2 | mesquite-liveoak-gale | live-oak-log-gale |
| mesquite-large-gale-1 | mesquite-liveoak-gale | mesquite-large-gale |
| mesquite-large-gale-2 | mesquite-liveoak-gale | mesquite-large-gale |
| live-oak-large-gale-1 | mesquite-liveoak-gale | live-oak-large-gale |
| live-oak-large-gale-2 | mesquite-liveoak-gale | live-oak-large-gale |
| elm-pole-gale-1 | elm-gale | elm-pole-gale |
| elm-pole-gale-2 | elm-gale | elm-pole-gale |
| elm-log-gale-1 | elm-gale | elm-log-gale |
| elm-log-gale-2 | elm-gale | elm-log-gale |
| elm-large-gale-1 | elm-gale | elm-large-gale |
| elm-large-gale-2 | elm-gale | elm-large-gale |
| home-hoe | home-tools | State artwork; no motion required |
| home-felling-axe | home-tools | State artwork; no motion required |
| home-broadaxe | home-tools | State artwork; no motion required |
| home-froe | home-tools | State artwork; no motion required |
| home-auger | home-tools | State artwork; no motion required |
| home-froe-club | home-tools | State artwork; no motion required |
| herd-drove-1 | horse-herds | herd-drove |
| herd-drove-2 | horse-herds | herd-drove |
| herd-drove-3 | horse-herds | herd-drove |
| herd-drove-4 | horse-herds | herd-drove |
| herd-scatter-1 | horse-herds | herd-scatter |
| herd-scatter-2 | horse-herds | herd-scatter |
| herd-scatter-3 | horse-herds | herd-scatter |
| herd-scatter-4 | horse-herds | herd-scatter |
| house-jacal-posts | house-construction-complete | State artwork; no motion required |
| house-jacal-wattle | house-construction-complete | State artwork; no motion required |
| house-jacal-daub-walls | house-construction-complete | State artwork; no motion required |
| house-jacal-thatch-roof | house-construction-complete | State artwork; no motion required |
| house-shed-frame | house-construction-complete | State artwork; no motion required |
| house-chimney-double | house-construction-complete | State artwork; no motion required |
| house-puncheon-floor | house-construction-complete | State artwork; no motion required |
| house-half-loft | house-construction-complete | State artwork; no motion required |
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
| house-round-back-sill | house-back-views | State artwork; no motion required |
| house-round-back-low-walls | house-back-views | State artwork; no motion required |
| house-round-back-full-walls | house-back-views | State artwork; no motion required |
| house-hewn-back-sill | house-back-views | State artwork; no motion required |
| house-hewn-back-low-walls | house-back-views | State artwork; no motion required |
| house-hewn-back-full-walls | house-back-views | State artwork; no motion required |
| house-passage-floor-end | house-end-views | State artwork; no motion required |
| house-passage-roof-end | house-end-views | State artwork; no motion required |
| house-porch-end | house-end-views | State artwork; no motion required |
| house-shed-room-end | house-end-views | State artwork; no motion required |
| icon-take-small-game-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-fish-the-water-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-gather-oysters-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-cut-bee-tree-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-butcher-beef-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-butcher-hog-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-look-to-stock-alt | icons-gather-stock-carreta | State artwork; no motion required |
| icon-make-carreta | icons-gather-stock-carreta | State artwork; no motion required |
| infant-wagon-passenger-e-1 | infant-wagon-passenger | infant-wagon-passenger-e |
| infant-wagon-passenger-e-2 | infant-wagon-passenger | infant-wagon-passenger-e |
| infant-wagon-passenger-s-1 | infant-wagon-passenger | infant-wagon-passenger-s |
| infant-wagon-passenger-s-2 | infant-wagon-passenger | infant-wagon-passenger-s |
| infant-wagon-passenger-n-1 | infant-wagon-passenger | infant-wagon-passenger-n |
| infant-wagon-passenger-n-2 | infant-wagon-passenger | infant-wagon-passenger-n |
| lesson-point | lesson-marks | State artwork; no motion required |
| lesson-ring | lesson-marks | State artwork; no motion required |
| lesson-pip | lesson-marks | State artwork; no motion required |
| lesson-pip-done | lesson-marks | State artwork; no motion required |
| live-oak-mott-dense-1 | live-oak-mott | live-oak-mott-dense-wind |
| live-oak-mott-dense-2 | live-oak-mott | live-oak-mott-dense-wind |
| live-oak-mott-open-1 | live-oak-mott | live-oak-mott-open-wind |
| live-oak-mott-open-2 | live-oak-mott | live-oak-mott-open-wind |
| road-tile-wagon | ground-roads | State artwork; no motion required |
| road-tile-street | ground-roads | State artwork; no motion required |
| road-tile-path | ground-roads | State artwork; no motion required |
| road-tile-verge | ground-roads | State artwork; no motion required |
| homestead-tent | homestead-local-1 | State artwork; no motion required |
| garden-beds | homestead-local-1 | State artwork; no motion required |
| garden-beds-winter | homestead-local-1 | State artwork; no motion required |
| wash-line | homestead-local-1 | State artwork; no motion required |
| wash-kettle-1 | homestead-local-1 | State artwork; no motion required |
| wash-kettle-2 | homestead-local-1 | State artwork; no motion required |
| wood-pile-1 | homestead-local-2 | State artwork; no motion required |
| wood-pile-2 | homestead-local-2 | State artwork; no motion required |
| wood-pile-3 | homestead-local-2 | State artwork; no motion required |
| wood-pile-4 | homestead-local-2 | State artwork; no motion required |
| hunt-field-timber | hunt-fields-local-1 | State artwork; no motion required |
| hunt-field-timber-winter | hunt-fields-local-1 | State artwork; no motion required |
| hunt-field-brush | hunt-fields-local-1 | State artwork; no motion required |
| hunt-field-brush-winter | hunt-fields-local-1 | State artwork; no motion required |
| hunt-field-open | hunt-fields-local-2 | State artwork; no motion required |
| hunt-field-open-winter | hunt-fields-local-3 | State artwork; no motion required |
| hunt-rifle | hunt-rifle-local | State artwork; no motion required |
| scene-street-gonzales | scenes-local-1 | State artwork; no motion required |
| scene-street-texian | scenes-local-1 | State artwork; no motion required |
| scene-street-tejano | scenes-local-1 | State artwork; no motion required |
| scene-camp-volunteers | scenes-local-1 | State artwork; no motion required |
| scene-road-prairie | scenes-local-2 | State artwork; no motion required |
| scene-road-woods | scenes-local-2 | State artwork; no motion required |
| scene-ford | scenes-local-2 | State artwork; no motion required |
| scene-yard-night | scenes-local-2 | State artwork; no motion required |
| scene-alamo-plaza | scenes-local-3 | State artwork; no motion required |
| courtship-yard-morning | scenes-local-3 | State artwork; no motion required |
| courtship-yard-noon | scenes-local-3 | State artwork; no motion required |
| courtship-yard-evening | scenes-local-3 | State artwork; no motion required |
| marsh-edge-dense-1 | marsh-edge | marsh-edge-dense |
| marsh-edge-dense-2 | marsh-edge | marsh-edge-dense |
| marsh-edge-dense-3 | marsh-edge | marsh-edge-dense |
| marsh-edge-dense-4 | marsh-edge | marsh-edge-dense |
| marsh-edge-sparse-1 | marsh-edge | marsh-edge-sparse |
| marsh-edge-sparse-2 | marsh-edge | marsh-edge-sparse |
| marsh-edge-sparse-3 | marsh-edge | marsh-edge-sparse |
| marsh-edge-sparse-4 | marsh-edge | marsh-edge-sparse |
| volunteer-wade-1 | marsh-wading | volunteer-wade |
| volunteer-wade-2 | marsh-wading | volunteer-wade |
| volunteer-wade-3 | marsh-wading | volunteer-wade |
| volunteer-wade-4 | marsh-wading | volunteer-wade |
| regular-wade-1 | marsh-wading | regular-wade |
| regular-wade-2 | marsh-wading | regular-wade |
| regular-wade-3 | marsh-wading | regular-wade |
| regular-wade-4 | marsh-wading | regular-wade |
| volunteer-rest-sit-1 | military-camp-life | volunteer-rest-sit |
| volunteer-rest-sit-2 | military-camp-life | volunteer-rest-sit |
| volunteer-sleep-1 | military-camp-life | volunteer-sleep |
| volunteer-sleep-2 | military-camp-life | volunteer-sleep |
| volunteer-camp-drink-1 | military-camp-life | volunteer-camp-drink |
| volunteer-camp-drink-2 | military-camp-life | volunteer-camp-drink |
| volunteer-camp-clean-1 | military-camp-life | volunteer-camp-clean |
| volunteer-camp-clean-2 | military-camp-life | volunteer-camp-clean |
| regular-rest-sit-1 | military-camp-life | regular-rest-sit |
| regular-rest-sit-2 | military-camp-life | regular-rest-sit |
| regular-sleep-1 | military-camp-life | regular-sleep |
| regular-sleep-2 | military-camp-life | regular-sleep |
| regular-camp-drink-1 | military-camp-life | regular-camp-drink |
| regular-camp-drink-2 | military-camp-life | regular-camp-drink |
| regular-camp-clean-1 | military-camp-life | regular-camp-clean |
| regular-camp-clean-2 | military-camp-life | regular-camp-clean |
| volunteer-dig-1 | volunteer-engineer-actions | volunteer-dig |
| volunteer-dig-2 | volunteer-engineer-actions | volunteer-dig |
| volunteer-dig-3 | volunteer-engineer-actions | volunteer-dig |
| volunteer-dig-4 | volunteer-engineer-actions | volunteer-dig |
| volunteer-crowbar-1 | volunteer-engineer-actions | volunteer-crowbar |
| volunteer-crowbar-2 | volunteer-engineer-actions | volunteer-crowbar |
| volunteer-crowbar-3 | volunteer-engineer-actions | volunteer-crowbar |
| volunteer-crowbar-4 | volunteer-engineer-actions | volunteer-crowbar |
| volunteer-sandbag-carry-1 | volunteer-engineer-actions | volunteer-sandbag-carry |
| volunteer-sandbag-carry-2 | volunteer-engineer-actions | volunteer-sandbag-carry |
| volunteer-sandbag-carry-3 | volunteer-engineer-actions | volunteer-sandbag-carry |
| volunteer-sandbag-carry-4 | volunteer-engineer-actions | volunteer-sandbag-carry |
| volunteer-sandbag-fill-1 | volunteer-engineer-actions | volunteer-sandbag-fill |
| volunteer-sandbag-fill-2 | volunteer-engineer-actions | volunteer-sandbag-fill |
| volunteer-sandbag-fill-3 | volunteer-engineer-actions | volunteer-sandbag-fill |
| volunteer-sandbag-fill-4 | volunteer-engineer-actions | volunteer-sandbag-fill |
| bearers-carry-1 | volunteer-bearers | bearers-carry |
| bearers-carry-2 | volunteer-bearers | bearers-carry |
| bearers-carry-3 | volunteer-bearers | bearers-carry |
| bearers-carry-4 | volunteer-bearers | bearers-carry |
| regular-bearers-carry-1 | regular-bearers | regular-bearers-carry |
| regular-bearers-carry-2 | regular-bearers | regular-bearers-carry |
| regular-bearers-carry-3 | regular-bearers | regular-bearers-carry |
| regular-bearers-carry-4 | regular-bearers | regular-bearers-carry |
| dragoon-wounded-led-1 | dragoon-wounded-led | dragoon-wounded-led |
| dragoon-wounded-led-2 | dragoon-wounded-led | dragoon-wounded-led |
| dragoon-wounded-led-3 | dragoon-wounded-led | dragoon-wounded-led |
| dragoon-wounded-led-4 | dragoon-wounded-led | dragoon-wounded-led |
| volunteer-ride-e-1 | volunteer-mounted | volunteer-ride-e |
| volunteer-ride-e-2 | volunteer-mounted | volunteer-ride-e |
| volunteer-ride-e-3 | volunteer-mounted | volunteer-ride-e |
| volunteer-ride-e-4 | volunteer-mounted | volunteer-ride-e |
| volunteer-ride-s-1 | volunteer-mounted | volunteer-ride-s |
| volunteer-ride-s-2 | volunteer-mounted | volunteer-ride-s |
| volunteer-ride-s-3 | volunteer-mounted | volunteer-ride-s |
| volunteer-ride-s-4 | volunteer-mounted | volunteer-ride-s |
| volunteer-ride-n-1 | volunteer-mounted | volunteer-ride-n |
| volunteer-ride-n-2 | volunteer-mounted | volunteer-ride-n |
| volunteer-ride-n-3 | volunteer-mounted | volunteer-ride-n |
| volunteer-ride-n-4 | volunteer-mounted | volunteer-ride-n |
| volunteer-mounted-idle-e | volunteer-mounted | volunteer-mounted-fire-cycle |
| volunteer-mounted-idle-s | volunteer-mounted | State artwork; no motion required |
| volunteer-mounted-idle-n | volunteer-mounted | State artwork; no motion required |
| volunteer-mounted-fire | volunteer-mounted | volunteer-mounted-fire-cycle |
| barricade-street-left | field-cover-camp-props | State artwork; no motion required |
| barricade-street-embrasure | field-cover-camp-props | State artwork; no motion required |
| barricade-street-right | field-cover-camp-props | State artwork; no motion required |
| barricade-street-broken | field-cover-camp-props | State artwork; no motion required |
| sandbag-breastwork | field-cover-camp-props | State artwork; no motion required |
| sandbag-corner | field-cover-camp-props | State artwork; no motion required |
| sandbag-embrasure | field-cover-camp-props | State artwork; no motion required |
| sandbag-loose-open | field-cover-camp-props | State artwork; no motion required |
| breastwork-packs-left | field-cover-camp-props | State artwork; no motion required |
| breastwork-packs-right | field-cover-camp-props | State artwork; no motion required |
| breastwork-packs-opening | field-cover-camp-props | State artwork; no motion required |
| breastwork-packs-disturbed | field-cover-camp-props | State artwork; no motion required |
| musket-stack-small | field-cover-camp-props | State artwork; no motion required |
| musket-stack-large | field-cover-camp-props | State artwork; no motion required |
| muskets-laid | field-cover-camp-props | State artwork; no motion required |
| camp-cookpot-tripod | field-cover-camp-props | State artwork; no motion required |
| house-loopholed | house-loopholed | State artwork; no motion required |
| house-loopholed-open | house-loopholed | State artwork; no motion required |
| house-loopholed-breached | house-loopholed | State artwork; no motion required |
| house-loopholed-cutaway | house-loopholed | State artwork; no motion required |
| volunteer-loophole-aim | volunteer-loophole-actions | volunteer-loophole-fire-reload |
| volunteer-loophole-fire | volunteer-loophole-actions | volunteer-loophole-fire-reload |
| volunteer-loophole-load | volunteer-loophole-actions | volunteer-loophole-fire-reload |
| volunteer-loophole-ramrod | volunteer-loophole-actions | volunteer-loophole-fire-reload |
| girl-ride-e-1 | people-mounted-children-e | girl-ride-e |
| girl-ride-e-2 | people-mounted-children-e | girl-ride-e |
| girl-ride-e-3 | people-mounted-children-e | girl-ride-e |
| girl-ride-e-4 | people-mounted-children-e | girl-ride-e |
| boy-ride-e-1 | people-mounted-children-e | boy-ride-e |
| boy-ride-e-2 | people-mounted-children-e | boy-ride-e |
| boy-ride-e-3 | people-mounted-children-e | boy-ride-e |
| boy-ride-e-4 | people-mounted-children-e | boy-ride-e |
| smallchild-with-caregiver-ride-e-1 | people-mounted-children-e | smallchild-with-caregiver-ride-e |
| smallchild-with-caregiver-ride-e-2 | people-mounted-children-e | smallchild-with-caregiver-ride-e |
| smallchild-with-caregiver-ride-e-3 | people-mounted-children-e | smallchild-with-caregiver-ride-e |
| smallchild-with-caregiver-ride-e-4 | people-mounted-children-e | smallchild-with-caregiver-ride-e |
| infant-with-caregiver-ride-e-1 | people-mounted-children-e | infant-with-caregiver-ride-e |
| infant-with-caregiver-ride-e-2 | people-mounted-children-e | infant-with-caregiver-ride-e |
| infant-with-caregiver-ride-e-3 | people-mounted-children-e | infant-with-caregiver-ride-e |
| infant-with-caregiver-ride-e-4 | people-mounted-children-e | infant-with-caregiver-ride-e |
| girl-ride-s-1 | people-mounted-children-s | girl-ride-s |
| girl-ride-s-2 | people-mounted-children-s | girl-ride-s |
| girl-ride-s-3 | people-mounted-children-s | girl-ride-s |
| girl-ride-s-4 | people-mounted-children-s | girl-ride-s |
| boy-ride-s-1 | people-mounted-children-s | boy-ride-s |
| boy-ride-s-2 | people-mounted-children-s | boy-ride-s |
| boy-ride-s-3 | people-mounted-children-s | boy-ride-s |
| boy-ride-s-4 | people-mounted-children-s | boy-ride-s |
| smallchild-with-caregiver-ride-s-1 | people-mounted-children-s | smallchild-with-caregiver-ride-s |
| smallchild-with-caregiver-ride-s-2 | people-mounted-children-s | smallchild-with-caregiver-ride-s |
| smallchild-with-caregiver-ride-s-3 | people-mounted-children-s | smallchild-with-caregiver-ride-s |
| smallchild-with-caregiver-ride-s-4 | people-mounted-children-s | smallchild-with-caregiver-ride-s |
| infant-with-caregiver-ride-s-1 | people-mounted-children-s | infant-with-caregiver-ride-s |
| infant-with-caregiver-ride-s-2 | people-mounted-children-s | infant-with-caregiver-ride-s |
| infant-with-caregiver-ride-s-3 | people-mounted-children-s | infant-with-caregiver-ride-s |
| infant-with-caregiver-ride-s-4 | people-mounted-children-s | infant-with-caregiver-ride-s |
| girl-ride-n-1 | people-mounted-children-n | girl-ride-n |
| girl-ride-n-2 | people-mounted-children-n | girl-ride-n |
| girl-ride-n-3 | people-mounted-children-n | girl-ride-n |
| girl-ride-n-4 | people-mounted-children-n | girl-ride-n |
| boy-ride-n-1 | people-mounted-children-n | boy-ride-n |
| boy-ride-n-2 | people-mounted-children-n | boy-ride-n |
| boy-ride-n-3 | people-mounted-children-n | boy-ride-n |
| boy-ride-n-4 | people-mounted-children-n | boy-ride-n |
| smallchild-with-caregiver-ride-n-1 | people-mounted-children-n | smallchild-with-caregiver-ride-n |
| smallchild-with-caregiver-ride-n-2 | people-mounted-children-n | smallchild-with-caregiver-ride-n |
| smallchild-with-caregiver-ride-n-3 | people-mounted-children-n | smallchild-with-caregiver-ride-n |
| smallchild-with-caregiver-ride-n-4 | people-mounted-children-n | smallchild-with-caregiver-ride-n |
| infant-with-caregiver-ride-n-1 | people-mounted-children-n | infant-with-caregiver-ride-n |
| infant-with-caregiver-ride-n-2 | people-mounted-children-n | infant-with-caregiver-ride-n |
| infant-with-caregiver-ride-n-3 | people-mounted-children-n | infant-with-caregiver-ride-n |
| infant-with-caregiver-ride-n-4 | people-mounted-children-n | infant-with-caregiver-ride-n |
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
| jw-smith-mounted-trot-e-1 | named-jw-smith-trot | jw-smith-mounted-trot-e |
| jw-smith-mounted-trot-e-2 | named-jw-smith-trot | jw-smith-mounted-trot-e |
| jw-smith-mounted-trot-e-3 | named-jw-smith-trot | jw-smith-mounted-trot-e |
| jw-smith-mounted-trot-e-4 | named-jw-smith-trot | jw-smith-mounted-trot-e |
| jw-smith-mounted-trot-s-1 | named-jw-smith-trot | jw-smith-mounted-trot-s |
| jw-smith-mounted-trot-s-2 | named-jw-smith-trot | jw-smith-mounted-trot-s |
| jw-smith-mounted-trot-s-3 | named-jw-smith-trot | jw-smith-mounted-trot-s |
| jw-smith-mounted-trot-s-4 | named-jw-smith-trot | jw-smith-mounted-trot-s |
| jw-smith-mounted-trot-n-1 | named-jw-smith-trot | jw-smith-mounted-trot-n |
| jw-smith-mounted-trot-n-2 | named-jw-smith-trot | jw-smith-mounted-trot-n |
| jw-smith-mounted-trot-n-3 | named-jw-smith-trot | jw-smith-mounted-trot-n |
| jw-smith-mounted-trot-n-4 | named-jw-smith-trot | jw-smith-mounted-trot-n |
| jw-smith-mounted-dispatch-e-1 | named-jw-smith-mounted-dispatch | jw-smith-mounted-dispatch-e |
| jw-smith-mounted-dispatch-e-2 | named-jw-smith-mounted-dispatch | jw-smith-mounted-dispatch-e |
| jw-smith-mounted-dispatch-s-1 | named-jw-smith-mounted-dispatch | jw-smith-mounted-dispatch-s |
| jw-smith-mounted-dispatch-s-2 | named-jw-smith-mounted-dispatch | jw-smith-mounted-dispatch-s |
| jw-smith-mounted-dispatch-n-1 | named-jw-smith-mounted-dispatch | jw-smith-mounted-dispatch-n |
| jw-smith-mounted-dispatch-n-2 | named-jw-smith-mounted-dispatch | jw-smith-mounted-dispatch-n |
| jw-smith-mounted-rest-e-1 | named-jw-smith-mounted-dispatch | jw-smith-mounted-rest-e |
| jw-smith-mounted-rest-e-2 | named-jw-smith-mounted-dispatch | jw-smith-mounted-rest-e |
| horton-mounted-trot-e-1 | named-horton-trot | horton-mounted-trot-e |
| horton-mounted-trot-e-2 | named-horton-trot | horton-mounted-trot-e |
| horton-mounted-trot-e-3 | named-horton-trot | horton-mounted-trot-e |
| horton-mounted-trot-e-4 | named-horton-trot | horton-mounted-trot-e |
| horton-mounted-trot-s-1 | named-horton-trot | horton-mounted-trot-s |
| horton-mounted-trot-s-2 | named-horton-trot | horton-mounted-trot-s |
| horton-mounted-trot-s-3 | named-horton-trot | horton-mounted-trot-s |
| horton-mounted-trot-s-4 | named-horton-trot | horton-mounted-trot-s |
| horton-mounted-trot-n-1 | named-horton-trot | horton-mounted-trot-n |
| horton-mounted-trot-n-2 | named-horton-trot | horton-mounted-trot-n |
| horton-mounted-trot-n-3 | named-horton-trot | horton-mounted-trot-n |
| horton-mounted-trot-n-4 | named-horton-trot | horton-mounted-trot-n |
| horton-mounted-dispatch-e-1 | named-horton-mounted-dispatch | horton-mounted-dispatch-e |
| horton-mounted-dispatch-e-2 | named-horton-mounted-dispatch | horton-mounted-dispatch-e |
| horton-mounted-dispatch-s-1 | named-horton-mounted-dispatch | horton-mounted-dispatch-s |
| horton-mounted-dispatch-s-2 | named-horton-mounted-dispatch | horton-mounted-dispatch-s |
| horton-mounted-dispatch-n-1 | named-horton-mounted-dispatch | horton-mounted-dispatch-n |
| horton-mounted-dispatch-n-2 | named-horton-mounted-dispatch | horton-mounted-dispatch-n |
| horton-mounted-rest-e-1 | named-horton-mounted-dispatch | horton-mounted-rest-e |
| horton-mounted-rest-e-2 | named-horton-mounted-dispatch | horton-mounted-rest-e |
| kimbell-mounted-trot-e-1 | named-kimbell-trot | kimbell-mounted-trot-e |
| kimbell-mounted-trot-e-2 | named-kimbell-trot | kimbell-mounted-trot-e |
| kimbell-mounted-trot-e-3 | named-kimbell-trot | kimbell-mounted-trot-e |
| kimbell-mounted-trot-e-4 | named-kimbell-trot | kimbell-mounted-trot-e |
| kimbell-mounted-trot-s-1 | named-kimbell-trot | kimbell-mounted-trot-s |
| kimbell-mounted-trot-s-2 | named-kimbell-trot | kimbell-mounted-trot-s |
| kimbell-mounted-trot-s-3 | named-kimbell-trot | kimbell-mounted-trot-s |
| kimbell-mounted-trot-s-4 | named-kimbell-trot | kimbell-mounted-trot-s |
| kimbell-mounted-trot-n-1 | named-kimbell-trot | kimbell-mounted-trot-n |
| kimbell-mounted-trot-n-2 | named-kimbell-trot | kimbell-mounted-trot-n |
| kimbell-mounted-trot-n-3 | named-kimbell-trot | kimbell-mounted-trot-n |
| kimbell-mounted-trot-n-4 | named-kimbell-trot | kimbell-mounted-trot-n |
| kimbell-mounted-dispatch-e-1 | named-kimbell-mounted-dispatch | kimbell-mounted-dispatch-e |
| kimbell-mounted-dispatch-e-2 | named-kimbell-mounted-dispatch | kimbell-mounted-dispatch-e |
| kimbell-mounted-dispatch-s-1 | named-kimbell-mounted-dispatch | kimbell-mounted-dispatch-s |
| kimbell-mounted-dispatch-s-2 | named-kimbell-mounted-dispatch | kimbell-mounted-dispatch-s |
| kimbell-mounted-dispatch-n-1 | named-kimbell-mounted-dispatch | kimbell-mounted-dispatch-n |
| kimbell-mounted-dispatch-n-2 | named-kimbell-mounted-dispatch | kimbell-mounted-dispatch-n |
| kimbell-mounted-rest-e-1 | named-kimbell-mounted-dispatch | kimbell-mounted-rest-e |
| kimbell-mounted-rest-e-2 | named-kimbell-mounted-dispatch | kimbell-mounted-rest-e |
| martin-mounted-trot-e-1 | named-martin-trot | martin-mounted-trot-e |
| martin-mounted-trot-e-2 | named-martin-trot | martin-mounted-trot-e |
| martin-mounted-trot-e-3 | named-martin-trot | martin-mounted-trot-e |
| martin-mounted-trot-e-4 | named-martin-trot | martin-mounted-trot-e |
| martin-mounted-trot-s-1 | named-martin-trot | martin-mounted-trot-s |
| martin-mounted-trot-s-2 | named-martin-trot | martin-mounted-trot-s |
| martin-mounted-trot-s-3 | named-martin-trot | martin-mounted-trot-s |
| martin-mounted-trot-s-4 | named-martin-trot | martin-mounted-trot-s |
| martin-mounted-trot-n-1 | named-martin-trot | martin-mounted-trot-n |
| martin-mounted-trot-n-2 | named-martin-trot | martin-mounted-trot-n |
| martin-mounted-trot-n-3 | named-martin-trot | martin-mounted-trot-n |
| martin-mounted-trot-n-4 | named-martin-trot | martin-mounted-trot-n |
| martin-mounted-dispatch-e-1 | named-martin-mounted-dispatch | martin-mounted-dispatch-e |
| martin-mounted-dispatch-e-2 | named-martin-mounted-dispatch | martin-mounted-dispatch-e |
| martin-mounted-dispatch-s-1 | named-martin-mounted-dispatch | martin-mounted-dispatch-s |
| martin-mounted-dispatch-s-2 | named-martin-mounted-dispatch | martin-mounted-dispatch-s |
| martin-mounted-dispatch-n-1 | named-martin-mounted-dispatch | martin-mounted-dispatch-n |
| martin-mounted-dispatch-n-2 | named-martin-mounted-dispatch | martin-mounted-dispatch-n |
| martin-mounted-rest-e-1 | named-martin-mounted-dispatch | martin-mounted-rest-e |
| martin-mounted-rest-e-2 | named-martin-mounted-dispatch | martin-mounted-rest-e |
| milam-service-e-aim | named-milam-fire-service | milam-fire-service-e |
| milam-service-e-fire | named-milam-fire-service | milam-fire-service-e |
| milam-service-e-load | named-milam-fire-service | milam-fire-service-e |
| milam-service-e-ramrod | named-milam-fire-service | milam-fire-service-e |
| milam-service-w-aim | named-milam-fire-service | milam-fire-service-w |
| milam-service-w-fire | named-milam-fire-service | milam-fire-service-w |
| milam-service-w-load | named-milam-fire-service | milam-fire-service-w |
| milam-service-w-ramrod | named-milam-fire-service | milam-fire-service-w |
| milam-service-s-aim | named-milam-fire-service | milam-fire-service-s |
| milam-service-s-fire | named-milam-fire-service | milam-fire-service-s |
| milam-service-s-load | named-milam-fire-service | milam-fire-service-s |
| milam-service-s-ramrod | named-milam-fire-service | milam-fire-service-s |
| milam-service-n-aim | named-milam-fire-service | milam-fire-service-n |
| milam-service-n-fire | named-milam-fire-service | milam-fire-service-n |
| milam-service-n-load | named-milam-fire-service | milam-fire-service-n |
| milam-service-n-ramrod | named-milam-fire-service | milam-fire-service-n |
| kimbell-fall-relief | named-relief-fates | State artwork; no motion required |
| kimbell-still-relief | named-relief-fates | State artwork; no motion required |
| martin-fall-relief | named-relief-fates | State artwork; no motion required |
| martin-still-relief | named-relief-fates | State artwork; no motion required |
| cottonwood-gale-1 | nature-gales | cottonwood-gale |
| cottonwood-gale-2 | nature-gales | cottonwood-gale |
| sapling-gale-1 | nature-gales | sapling-gale |
| sapling-gale-2 | nature-gales | sapling-gale |
| campfire-night-1 | night-settlement-lights | campfire-night |
| campfire-night-2 | night-settlement-lights | campfire-night |
| campfire-night-3 | night-settlement-lights | campfire-night |
| campfire-night-4 | night-settlement-lights | campfire-night |
| adobe-night-lit-1 | night-settlement-lights | adobe-night-lit |
| adobe-night-lit-2 | night-settlement-lights | adobe-night-lit |
| adobe-night-lit-3 | night-settlement-lights | adobe-night-lit |
| adobe-night-lit-4 | night-settlement-lights | adobe-night-lit |
| jacal-night-lit-1 | night-settlement-lights | jacal-night-lit |
| jacal-night-lit-2 | night-settlement-lights | jacal-night-lit |
| jacal-night-lit-3 | night-settlement-lights | jacal-night-lit |
| jacal-night-lit-4 | night-settlement-lights | jacal-night-lit |
| cabin-night-lit-1 | night-settlement-lights | cabin-night-lit |
| cabin-night-lit-2 | night-settlement-lights | cabin-night-lit |
| cabin-night-lit-3 | night-settlement-lights | cabin-night-lit |
| cabin-night-lit-4 | night-settlement-lights | cabin-night-lit |
| scrub-gale-1 | norther-ground | scrub-gale |
| scrub-gale-2 | norther-ground | scrub-gale |
| reeds-gale-1 | norther-ground | reeds-gale |
| reeds-gale-2 | norther-ground | reeds-gale |
| prickly-pear-gale-1 | norther-ground | prickly-pear-gale |
| prickly-pear-gale-2 | norther-ground | prickly-pear-gale |
| post-oak-pole-gale-1 | oak-gale | post-oak-pole-gale |
| post-oak-pole-gale-2 | oak-gale | post-oak-pole-gale |
| blackjack-pole-gale-1 | oak-gale | blackjack-pole-gale |
| blackjack-pole-gale-2 | oak-gale | blackjack-pole-gale |
| post-oak-log-gale-1 | oak-gale | post-oak-log-gale |
| post-oak-log-gale-2 | oak-gale | post-oak-log-gale |
| blackjack-log-gale-1 | oak-gale | blackjack-log-gale |
| blackjack-log-gale-2 | oak-gale | blackjack-log-gale |
| post-oak-large-gale-1 | oak-gale | post-oak-large-gale |
| post-oak-large-gale-2 | oak-gale | post-oak-large-gale |
| blackjack-large-gale-1 | oak-gale | blackjack-large-gale |
| blackjack-large-gale-2 | oak-gale | blackjack-large-gale |
| cart-open-travel-e-1 | cart-open-complete | cart-open-travel-e |
| cart-open-travel-e-2 | cart-open-complete | cart-open-travel-e |
| cart-open-travel-e-3 | cart-open-complete | cart-open-travel-e |
| cart-open-travel-e-4 | cart-open-complete | cart-open-travel-e |
| cart-open-travel-s-1 | cart-open-complete | cart-open-travel-s |
| cart-open-travel-s-2 | cart-open-complete | cart-open-travel-s |
| cart-open-travel-s-3 | cart-open-complete | cart-open-travel-s |
| cart-open-travel-s-4 | cart-open-complete | cart-open-travel-s |
| cart-open-travel-n-1 | cart-open-complete | cart-open-travel-n |
| cart-open-travel-n-2 | cart-open-complete | cart-open-travel-n |
| cart-open-travel-n-3 | cart-open-complete | cart-open-travel-n |
| cart-open-travel-n-4 | cart-open-complete | cart-open-travel-n |
| cart-open-idle-e | cart-open-complete | State artwork; no motion required |
| cart-open-idle-s | cart-open-complete | State artwork; no motion required |
| cart-open-idle-n | cart-open-complete | State artwork; no motion required |
| cart-open-loaded-e | cart-open-complete | State artwork; no motion required |
| cart-open-loaded-s | cart-open-complete | State artwork; no motion required |
| cart-open-loaded-n | cart-open-complete | State artwork; no motion required |
| cart-open-loaded-e-alt | cart-open-complete | State artwork; no motion required |
| cart-open-loaded-n-alt | cart-open-complete | State artwork; no motion required |
| cart-open-loaded-travel-e-1 | cart-open-loaded-travel | cart-open-loaded-travel-e |
| cart-open-loaded-travel-e-2 | cart-open-loaded-travel | cart-open-loaded-travel-e |
| cart-open-loaded-travel-e-3 | cart-open-loaded-travel | cart-open-loaded-travel-e |
| cart-open-loaded-travel-e-4 | cart-open-loaded-travel | cart-open-loaded-travel-e |
| cart-open-loaded-travel-s-1 | cart-open-loaded-travel | cart-open-loaded-travel-s |
| cart-open-loaded-travel-s-2 | cart-open-loaded-travel | cart-open-loaded-travel-s |
| cart-open-loaded-travel-s-3 | cart-open-loaded-travel | cart-open-loaded-travel-s |
| cart-open-loaded-travel-s-4 | cart-open-loaded-travel | cart-open-loaded-travel-s |
| cart-open-loaded-travel-n-1 | cart-open-loaded-travel | cart-open-loaded-travel-n |
| cart-open-loaded-travel-n-2 | cart-open-loaded-travel | cart-open-loaded-travel-n |
| cart-open-loaded-travel-n-3 | cart-open-loaded-travel | cart-open-loaded-travel-n |
| cart-open-loaded-travel-n-4 | cart-open-loaded-travel | cart-open-loaded-travel-n |
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
| ox-wagon-empty-e-1 | ox-wagon-composite-e | ox-wagon-empty-e |
| ox-wagon-empty-e-2 | ox-wagon-composite-e | ox-wagon-empty-e |
| ox-wagon-empty-e-3 | ox-wagon-composite-e | ox-wagon-empty-e |
| ox-wagon-empty-e-4 | ox-wagon-composite-e | ox-wagon-empty-e |
| ox-wagon-loaded-e-1 | ox-wagon-composite-e | ox-wagon-loaded-e |
| ox-wagon-loaded-e-2 | ox-wagon-composite-e | ox-wagon-loaded-e |
| ox-wagon-loaded-e-3 | ox-wagon-composite-e | ox-wagon-loaded-e |
| ox-wagon-loaded-e-4 | ox-wagon-composite-e | ox-wagon-loaded-e |
| ox-wagon-empty-s-1 | ox-wagon-composite-s | ox-wagon-empty-s |
| ox-wagon-empty-s-2 | ox-wagon-composite-s | ox-wagon-empty-s |
| ox-wagon-empty-s-3 | ox-wagon-composite-s | ox-wagon-empty-s |
| ox-wagon-empty-s-4 | ox-wagon-composite-s | ox-wagon-empty-s |
| ox-wagon-loaded-s-1 | ox-wagon-composite-s | ox-wagon-loaded-s |
| ox-wagon-loaded-s-2 | ox-wagon-composite-s | ox-wagon-loaded-s |
| ox-wagon-loaded-s-3 | ox-wagon-composite-s | ox-wagon-loaded-s |
| ox-wagon-loaded-s-4 | ox-wagon-composite-s | ox-wagon-loaded-s |
| ox-wagon-empty-n-1 | ox-wagon-composite-n | ox-wagon-empty-n |
| ox-wagon-empty-n-2 | ox-wagon-composite-n | ox-wagon-empty-n |
| ox-wagon-empty-n-3 | ox-wagon-composite-n | ox-wagon-empty-n |
| ox-wagon-empty-n-4 | ox-wagon-composite-n | ox-wagon-empty-n |
| ox-wagon-loaded-n-1 | ox-wagon-composite-n | ox-wagon-loaded-n |
| ox-wagon-loaded-n-2 | ox-wagon-composite-n | ox-wagon-loaded-n |
| ox-wagon-loaded-n-3 | ox-wagon-composite-n | ox-wagon-loaded-n |
| ox-wagon-loaded-n-4 | ox-wagon-composite-n | ox-wagon-loaded-n |
| girl-wagon-driver-s-1 | people-child-wagon-drivers | girl-wagon-driver-s |
| girl-wagon-driver-s-2 | people-child-wagon-drivers | girl-wagon-driver-s |
| boy-wagon-driver-s-1 | people-child-wagon-drivers | boy-wagon-driver-s |
| boy-wagon-driver-s-2 | people-child-wagon-drivers | boy-wagon-driver-s |
| girl-wagon-driver-e-1 | people-child-wagon-drivers | girl-wagon-driver-e |
| girl-wagon-driver-e-2 | people-child-wagon-drivers | girl-wagon-driver-e |
| boy-wagon-driver-e-1 | people-child-wagon-drivers | boy-wagon-driver-e |
| boy-wagon-driver-e-2 | people-child-wagon-drivers | boy-wagon-driver-e |
| girl-wagon-driver-w-1 | people-child-wagon-drivers | girl-wagon-driver-w |
| girl-wagon-driver-w-2 | people-child-wagon-drivers | girl-wagon-driver-w |
| boy-wagon-driver-w-1 | people-child-wagon-drivers | boy-wagon-driver-w |
| boy-wagon-driver-w-2 | people-child-wagon-drivers | boy-wagon-driver-w |
| girl-wagon-driver-n-1 | people-child-wagon-drivers | girl-wagon-driver-n |
| girl-wagon-driver-n-2 | people-child-wagon-drivers | girl-wagon-driver-n |
| boy-wagon-driver-n-1 | people-child-wagon-drivers | boy-wagon-driver-n |
| boy-wagon-driver-n-2 | people-child-wagon-drivers | boy-wagon-driver-n |
| regular-crowbar-s-1 | regular-crowbar-vertical | regular-crowbar-s |
| regular-crowbar-s-2 | regular-crowbar-vertical | regular-crowbar-s |
| regular-crowbar-s-3 | regular-crowbar-vertical | regular-crowbar-s |
| regular-crowbar-s-4 | regular-crowbar-vertical | regular-crowbar-s |
| regular-crowbar-n-1 | regular-crowbar-vertical | regular-crowbar-n |
| regular-crowbar-n-2 | regular-crowbar-vertical | regular-crowbar-n |
| regular-crowbar-n-3 | regular-crowbar-vertical | regular-crowbar-n |
| regular-crowbar-n-4 | regular-crowbar-vertical | regular-crowbar-n |
| regular-dig-1 | regular-engineer-actions | regular-dig |
| regular-dig-2 | regular-engineer-actions | regular-dig |
| regular-dig-3 | regular-engineer-actions | regular-dig |
| regular-dig-4 | regular-engineer-actions | regular-dig |
| regular-crowbar-1 | regular-engineer-actions | regular-crowbar |
| regular-crowbar-2 | regular-engineer-actions | regular-crowbar |
| regular-crowbar-3 | regular-engineer-actions | regular-crowbar |
| regular-crowbar-4 | regular-engineer-actions | regular-crowbar |
| regular-sandbag-carry-1 | regular-engineer-actions | regular-sandbag-carry |
| regular-sandbag-carry-2 | regular-engineer-actions | regular-sandbag-carry |
| regular-sandbag-carry-3 | regular-engineer-actions | regular-sandbag-carry |
| regular-sandbag-carry-4 | regular-engineer-actions | regular-sandbag-carry |
| regular-sandbag-fill-1 | regular-engineer-actions | regular-sandbag-fill |
| regular-sandbag-fill-2 | regular-engineer-actions | regular-sandbag-fill |
| regular-sandbag-fill-3 | regular-engineer-actions | regular-sandbag-fill |
| regular-sandbag-fill-4 | regular-engineer-actions | regular-sandbag-fill |
| pecan-pole-gale-1 | pecan-hackberry-gale | pecan-pole-gale |
| pecan-pole-gale-2 | pecan-hackberry-gale | pecan-pole-gale |
| hackberry-pole-gale-1 | pecan-hackberry-gale | hackberry-pole-gale |
| hackberry-pole-gale-2 | pecan-hackberry-gale | hackberry-pole-gale |
| pecan-log-gale-1 | pecan-hackberry-gale | pecan-log-gale |
| pecan-log-gale-2 | pecan-hackberry-gale | pecan-log-gale |
| hackberry-log-gale-1 | pecan-hackberry-gale | hackberry-log-gale |
| hackberry-log-gale-2 | pecan-hackberry-gale | hackberry-log-gale |
| pecan-large-gale-1 | pecan-hackberry-gale | pecan-large-gale |
| pecan-large-gale-2 | pecan-hackberry-gale | pecan-large-gale |
| hackberry-large-gale-1 | pecan-hackberry-gale | hackberry-large-gale |
| hackberry-large-gale-2 | pecan-hackberry-gale | hackberry-large-gale |
| sweetgum-pole-gale-1 | sweetgum-gale | sweetgum-pole-gale |
| sweetgum-pole-gale-2 | sweetgum-gale | sweetgum-pole-gale |
| sweetgum-log-gale-1 | sweetgum-gale | sweetgum-log-gale |
| sweetgum-log-gale-2 | sweetgum-gale | sweetgum-log-gale |
| sweetgum-large-gale-1 | sweetgum-gale | sweetgum-large-gale |
| sweetgum-large-gale-2 | sweetgum-gale | sweetgum-large-gale |
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
| house-roof-join | house-roof-joins | house-roof-join |
| house-roof-join-partial | house-roof-joins | house-roof-join-partial |
| house-roof-join-chimney | house-roof-joins | house-roof-join-chimney |
| interior-saddlebag | interior-saddlebag | State artwork; no motion required |
| rust-camp-rest-1 | people-sj-camp-cast1 | rust-camp-rest |
| rust-camp-rest-2 | people-sj-camp-cast1 | rust-camp-rest |
| rust-camp-sleep-1 | people-sj-camp-cast1 | rust-camp-sleep |
| rust-camp-sleep-2 | people-sj-camp-cast1 | rust-camp-sleep |
| teal-camp-rest-1 | people-sj-camp-cast1 | teal-camp-rest |
| teal-camp-rest-2 | people-sj-camp-cast1 | teal-camp-rest |
| teal-camp-sleep-1 | people-sj-camp-cast1 | teal-camp-sleep |
| teal-camp-sleep-2 | people-sj-camp-cast1 | teal-camp-sleep |
| elder-camp-rest-1 | people-sj-camp-cast1 | elder-camp-rest |
| elder-camp-rest-2 | people-sj-camp-cast1 | elder-camp-rest |
| elder-camp-sleep-1 | people-sj-camp-cast1 | elder-camp-sleep |
| elder-camp-sleep-2 | people-sj-camp-cast1 | elder-camp-sleep |
| blue-camp-rest-1 | people-sj-camp-cast1 | blue-camp-rest |
| blue-camp-rest-2 | people-sj-camp-cast1 | blue-camp-rest |
| blue-camp-sleep-1 | people-sj-camp-cast1 | blue-camp-sleep |
| blue-camp-sleep-2 | people-sj-camp-cast1 | blue-camp-sleep |
| rust-woman-camp-rest-1 | people-sj-camp-cast2 | rust-woman-camp-rest |
| rust-woman-camp-rest-2 | people-sj-camp-cast2 | rust-woman-camp-rest |
| rust-woman-camp-sleep-1 | people-sj-camp-cast2 | rust-woman-camp-sleep |
| rust-woman-camp-sleep-2 | people-sj-camp-cast2 | rust-woman-camp-sleep |
| indigo-camp-rest-1 | people-sj-camp-cast2 | indigo-camp-rest |
| indigo-camp-rest-2 | people-sj-camp-cast2 | indigo-camp-rest |
| indigo-camp-sleep-1 | people-sj-camp-cast2 | indigo-camp-sleep |
| indigo-camp-sleep-2 | people-sj-camp-cast2 | indigo-camp-sleep |
| ochre-camp-rest-1 | people-sj-camp-cast2 | ochre-camp-rest |
| ochre-camp-rest-2 | people-sj-camp-cast2 | ochre-camp-rest |
| ochre-camp-sleep-1 | people-sj-camp-cast2 | ochre-camp-sleep |
| ochre-camp-sleep-2 | people-sj-camp-cast2 | ochre-camp-sleep |
| blue-girl-camp-rest-1 | people-sj-camp-cast2 | blue-girl-camp-rest |
| blue-girl-camp-rest-2 | people-sj-camp-cast2 | blue-girl-camp-rest |
| blue-girl-camp-sleep-1 | people-sj-camp-cast2 | blue-girl-camp-sleep |
| blue-girl-camp-sleep-2 | people-sj-camp-cast2 | blue-girl-camp-sleep |
| girl-camp-rest-1 | people-sj-camp-children | girl-camp-rest |
| girl-camp-rest-2 | people-sj-camp-children | girl-camp-rest |
| girl-camp-sleep-1 | people-sj-camp-children | girl-camp-sleep |
| girl-camp-sleep-2 | people-sj-camp-children | girl-camp-sleep |
| boy-camp-rest-1 | people-sj-camp-children | boy-camp-rest |
| boy-camp-rest-2 | people-sj-camp-children | boy-camp-rest |
| boy-camp-sleep-1 | people-sj-camp-children | boy-camp-sleep |
| boy-camp-sleep-2 | people-sj-camp-children | boy-camp-sleep |
| smallchild-camp-rest-1 | people-sj-camp-children | smallchild-camp-rest |
| smallchild-camp-rest-2 | people-sj-camp-children | smallchild-camp-rest |
| smallchild-camp-sleep-1 | people-sj-camp-children | smallchild-camp-sleep |
| smallchild-camp-sleep-2 | people-sj-camp-children | smallchild-camp-sleep |
| mother-scarf-camp-rest-1 | people-sj-camp-heads1 | mother-scarf-camp-rest |
| mother-scarf-camp-rest-2 | people-sj-camp-heads1 | mother-scarf-camp-rest |
| mother-scarf-camp-sleep-1 | people-sj-camp-heads1 | mother-scarf-camp-sleep |
| mother-scarf-camp-sleep-2 | people-sj-camp-heads1 | mother-scarf-camp-sleep |
| father-straw-camp-rest-1 | people-sj-camp-heads1 | father-straw-camp-rest |
| father-straw-camp-rest-2 | people-sj-camp-heads1 | father-straw-camp-rest |
| father-straw-camp-sleep-1 | people-sj-camp-heads1 | father-straw-camp-sleep |
| father-straw-camp-sleep-2 | people-sj-camp-heads1 | father-straw-camp-sleep |
| father-beard-camp-rest-1 | people-sj-camp-heads1 | father-beard-camp-rest |
| father-beard-camp-rest-2 | people-sj-camp-heads1 | father-beard-camp-rest |
| father-beard-camp-sleep-1 | people-sj-camp-heads1 | father-beard-camp-sleep |
| father-beard-camp-sleep-2 | people-sj-camp-heads1 | father-beard-camp-sleep |
| father-moustache-camp-rest-1 | people-sj-camp-heads1 | father-moustache-camp-rest |
| father-moustache-camp-rest-2 | people-sj-camp-heads1 | father-moustache-camp-rest |
| father-moustache-camp-sleep-1 | people-sj-camp-heads1 | father-moustache-camp-sleep |
| father-moustache-camp-sleep-2 | people-sj-camp-heads1 | father-moustache-camp-sleep |
| mother-braid-camp-rest-1 | people-sj-camp-heads2 | mother-braid-camp-rest |
| mother-braid-camp-rest-2 | people-sj-camp-heads2 | mother-braid-camp-rest |
| mother-braid-camp-sleep-1 | people-sj-camp-heads2 | mother-braid-camp-sleep |
| mother-braid-camp-sleep-2 | people-sj-camp-heads2 | mother-braid-camp-sleep |
| mother-loose-camp-rest-1 | people-sj-camp-heads2 | mother-loose-camp-rest |
| mother-loose-camp-rest-2 | people-sj-camp-heads2 | mother-loose-camp-rest |
| mother-loose-camp-sleep-1 | people-sj-camp-heads2 | mother-loose-camp-sleep |
| mother-loose-camp-sleep-2 | people-sj-camp-heads2 | mother-loose-camp-sleep |
| mother-straw-camp-rest-1 | people-sj-camp-heads2 | mother-straw-camp-rest |
| mother-straw-camp-rest-2 | people-sj-camp-heads2 | mother-straw-camp-rest |
| mother-straw-camp-sleep-1 | people-sj-camp-heads2 | mother-straw-camp-sleep |
| mother-straw-camp-sleep-2 | people-sj-camp-heads2 | mother-straw-camp-sleep |
| youth-boy-camp-rest-1 | people-sj-camp-heads2 | youth-boy-camp-rest |
| youth-boy-camp-rest-2 | people-sj-camp-heads2 | youth-boy-camp-rest |
| youth-boy-camp-sleep-1 | people-sj-camp-heads2 | youth-boy-camp-sleep |
| youth-boy-camp-sleep-2 | people-sj-camp-heads2 | youth-boy-camp-sleep |
| youth-girl-camp-rest-1 | people-sj-camp-heads3 | youth-girl-camp-rest |
| youth-girl-camp-rest-2 | people-sj-camp-heads3 | youth-girl-camp-rest |
| youth-girl-camp-sleep-1 | people-sj-camp-heads3 | youth-girl-camp-sleep |
| youth-girl-camp-sleep-2 | people-sj-camp-heads3 | youth-girl-camp-sleep |
| father-hat-camp-rest-1 | people-sj-camp-heads3 | father-hat-camp-rest |
| father-hat-camp-rest-2 | people-sj-camp-heads3 | father-hat-camp-rest |
| father-hat-camp-sleep-1 | people-sj-camp-heads3 | father-hat-camp-sleep |
| father-hat-camp-sleep-2 | people-sj-camp-heads3 | father-hat-camp-sleep |
| infant-camp-rest-1 | people-sj-camp-infant | infant-camp-rest |
| infant-camp-rest-2 | people-sj-camp-infant | infant-camp-rest |
| infant-camp-sleep-1 | people-sj-camp-infant | infant-camp-sleep |
| infant-camp-sleep-2 | people-sj-camp-infant | infant-camp-sleep |
| volunteer-mounted-reload-e-1 | sj-mounted-reload-e | volunteer-mounted-reload-e |
| volunteer-mounted-reload-e-2 | sj-mounted-reload-e | volunteer-mounted-reload-e |
| volunteer-mounted-reload-e-3 | sj-mounted-reload-e | volunteer-mounted-reload-e |
| volunteer-mounted-reload-e-4 | sj-mounted-reload-e | volunteer-mounted-reload-e |
| volunteer-mounted-reload-e-5 | sj-mounted-reload-e | volunteer-mounted-reload-e |
| volunteer-mounted-reload-e-6 | sj-mounted-reload-e | volunteer-mounted-reload-e |
| volunteer-mounted-reload-e-7 | sj-mounted-reload-e | volunteer-mounted-reload-e |
| volunteer-mounted-reload-e-8 | sj-mounted-reload-e | volunteer-mounted-reload-e |
| dragoon-mounted-reload-e-1 | sj-mounted-reload-e | dragoon-mounted-reload-e |
| dragoon-mounted-reload-e-2 | sj-mounted-reload-e | dragoon-mounted-reload-e |
| dragoon-mounted-reload-e-3 | sj-mounted-reload-e | dragoon-mounted-reload-e |
| dragoon-mounted-reload-e-4 | sj-mounted-reload-e | dragoon-mounted-reload-e |
| dragoon-mounted-reload-e-5 | sj-mounted-reload-e | dragoon-mounted-reload-e |
| dragoon-mounted-reload-e-6 | sj-mounted-reload-e | dragoon-mounted-reload-e |
| dragoon-mounted-reload-e-7 | sj-mounted-reload-e | dragoon-mounted-reload-e |
| dragoon-mounted-reload-e-8 | sj-mounted-reload-e | dragoon-mounted-reload-e |
| volunteer-mounted-reload-s-1 | sj-mounted-reload-s | volunteer-mounted-reload-s |
| volunteer-mounted-reload-s-2 | sj-mounted-reload-s | volunteer-mounted-reload-s |
| volunteer-mounted-reload-s-3 | sj-mounted-reload-s | volunteer-mounted-reload-s |
| volunteer-mounted-reload-s-4 | sj-mounted-reload-s | volunteer-mounted-reload-s |
| volunteer-mounted-reload-s-5 | sj-mounted-reload-s | volunteer-mounted-reload-s |
| volunteer-mounted-reload-s-6 | sj-mounted-reload-s | volunteer-mounted-reload-s |
| volunteer-mounted-reload-s-7 | sj-mounted-reload-s | volunteer-mounted-reload-s |
| volunteer-mounted-reload-s-8 | sj-mounted-reload-s | volunteer-mounted-reload-s |
| dragoon-mounted-reload-s-1 | sj-mounted-reload-s | dragoon-mounted-reload-s |
| dragoon-mounted-reload-s-2 | sj-mounted-reload-s | dragoon-mounted-reload-s |
| dragoon-mounted-reload-s-3 | sj-mounted-reload-s | dragoon-mounted-reload-s |
| dragoon-mounted-reload-s-4 | sj-mounted-reload-s | dragoon-mounted-reload-s |
| dragoon-mounted-reload-s-5 | sj-mounted-reload-s | dragoon-mounted-reload-s |
| dragoon-mounted-reload-s-6 | sj-mounted-reload-s | dragoon-mounted-reload-s |
| dragoon-mounted-reload-s-7 | sj-mounted-reload-s | dragoon-mounted-reload-s |
| dragoon-mounted-reload-s-8 | sj-mounted-reload-s | dragoon-mounted-reload-s |
| volunteer-mounted-reload-n-1 | sj-mounted-reload-n | volunteer-mounted-reload-n |
| volunteer-mounted-reload-n-2 | sj-mounted-reload-n | volunteer-mounted-reload-n |
| volunteer-mounted-reload-n-3 | sj-mounted-reload-n | volunteer-mounted-reload-n |
| volunteer-mounted-reload-n-4 | sj-mounted-reload-n | volunteer-mounted-reload-n |
| volunteer-mounted-reload-n-5 | sj-mounted-reload-n | volunteer-mounted-reload-n |
| volunteer-mounted-reload-n-6 | sj-mounted-reload-n | volunteer-mounted-reload-n |
| volunteer-mounted-reload-n-7 | sj-mounted-reload-n | volunteer-mounted-reload-n |
| volunteer-mounted-reload-n-8 | sj-mounted-reload-n | volunteer-mounted-reload-n |
| dragoon-mounted-reload-n-1 | sj-mounted-reload-n | dragoon-mounted-reload-n |
| dragoon-mounted-reload-n-2 | sj-mounted-reload-n | dragoon-mounted-reload-n |
| dragoon-mounted-reload-n-3 | sj-mounted-reload-n | dragoon-mounted-reload-n |
| dragoon-mounted-reload-n-4 | sj-mounted-reload-n | dragoon-mounted-reload-n |
| dragoon-mounted-reload-n-5 | sj-mounted-reload-n | dragoon-mounted-reload-n |
| dragoon-mounted-reload-n-6 | sj-mounted-reload-n | dragoon-mounted-reload-n |
| dragoon-mounted-reload-n-7 | sj-mounted-reload-n | dragoon-mounted-reload-n |
| dragoon-mounted-reload-n-8 | sj-mounted-reload-n | dragoon-mounted-reload-n |
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
| pine-shortleaf-pole | trees-shortleaf | State artwork; no motion required |
| pine-shortleaf-pole-gale-1 | trees-shortleaf | pine-shortleaf-pole-gale |
| pine-shortleaf-pole-gale-2 | trees-shortleaf | pine-shortleaf-pole-gale |
| stump-pine-shortleaf-pole | trees-shortleaf | State artwork; no motion required |
| pine-shortleaf-log | trees-shortleaf | State artwork; no motion required |
| pine-shortleaf-log-gale-1 | trees-shortleaf | pine-shortleaf-log-gale |
| pine-shortleaf-log-gale-2 | trees-shortleaf | pine-shortleaf-log-gale |
| stump-pine-shortleaf-log | trees-shortleaf | State artwork; no motion required |
| pine-shortleaf-large | trees-shortleaf | State artwork; no motion required |
| pine-shortleaf-large-gale-1 | trees-shortleaf | pine-shortleaf-large-gale |
| pine-shortleaf-large-gale-2 | trees-shortleaf | pine-shortleaf-large-gale |
| stump-pine-shortleaf | trees-shortleaf | State artwork; no motion required |
| volunteer-mounted-action-s-1 | southern-volunteer-mounted-actions | volunteer-mounted-fire-s |
| volunteer-mounted-action-s-2 | southern-volunteer-mounted-actions | volunteer-mounted-fire-s |
| volunteer-mounted-action-s-3 | southern-volunteer-mounted-actions | volunteer-mounted-fire-s |
| volunteer-mounted-action-s-4 | southern-volunteer-mounted-actions | volunteer-mounted-fire-s |
| volunteer-mounted-action-n-1 | southern-volunteer-mounted-actions | volunteer-mounted-fire-n |
| volunteer-mounted-action-n-2 | southern-volunteer-mounted-actions | volunteer-mounted-fire-n |
| volunteer-mounted-action-n-3 | southern-volunteer-mounted-actions | volunteer-mounted-fire-n |
| volunteer-mounted-action-n-4 | southern-volunteer-mounted-actions | volunteer-mounted-fire-n |
| dragoon-mounted-action-s-1 | southern-dragoon-mounted-actions | dragoon-mounted-fire-s |
| dragoon-mounted-action-s-2 | southern-dragoon-mounted-actions | dragoon-mounted-fire-s |
| dragoon-mounted-action-s-3 | southern-dragoon-mounted-actions | dragoon-mounted-fire-s |
| dragoon-mounted-action-s-4 | southern-dragoon-mounted-actions | dragoon-mounted-fire-s |
| dragoon-mounted-action-n-1 | southern-dragoon-mounted-actions | dragoon-mounted-fire-n |
| dragoon-mounted-action-n-2 | southern-dragoon-mounted-actions | dragoon-mounted-fire-n |
| dragoon-mounted-action-n-3 | southern-dragoon-mounted-actions | dragoon-mounted-fire-n |
| dragoon-mounted-action-n-4 | southern-dragoon-mounted-actions | dragoon-mounted-fire-n |
| lancer-charge-s-1 | southern-lancer-charge | lancer-charge-s |
| lancer-charge-s-2 | southern-lancer-charge | lancer-charge-s |
| lancer-charge-s-3 | southern-lancer-charge | lancer-charge-s |
| lancer-charge-s-4 | southern-lancer-charge | lancer-charge-s |
| lancer-charge-n-1 | southern-lancer-charge | lancer-charge-n |
| lancer-charge-n-2 | southern-lancer-charge | lancer-charge-n |
| lancer-charge-n-3 | southern-lancer-charge | lancer-charge-n |
| lancer-charge-n-4 | southern-lancer-charge | lancer-charge-n |
| susanna-child-walk-e-1 | famous-susanna-child-travel | susanna-child-walk-e |
| susanna-child-walk-e-2 | famous-susanna-child-travel | susanna-child-walk-e |
| susanna-child-hold-1 | famous-susanna-child-travel | susanna-child-hold |
| susanna-child-hold-2 | famous-susanna-child-travel | susanna-child-hold |
| susanna-child-walk-s-1 | famous-susanna-child-cardinal | susanna-child-walk-s |
| susanna-child-walk-s-2 | famous-susanna-child-cardinal | susanna-child-walk-s |
| susanna-child-walk-n-1 | famous-susanna-child-cardinal | susanna-child-walk-n |
| susanna-child-walk-n-2 | famous-susanna-child-cardinal | susanna-child-walk-n |
| settler-gun-ram-1 | gonzales-settler-rammer | settler-gun-ram |
| settler-gun-ram-2 | gonzales-settler-rammer | settler-gun-ram |
| settler-gun-rammer-cover-1 | gonzales-settler-rammer | settler-gun-rammer-cover |
| settler-gun-rammer-cover-2 | gonzales-settler-rammer | settler-gun-rammer-cover |
| settler-gun-carry-1 | gonzales-settler-charge | settler-gun-carry |
| settler-gun-carry-2 | gonzales-settler-charge | settler-gun-carry |
| settler-gun-charge-wait-1 | gonzales-settler-charge | settler-gun-charge-wait |
| settler-gun-charge-wait-2 | gonzales-settler-charge | settler-gun-charge-wait |
| settler-gun-fire-1 | gonzales-settler-igniter | settler-gun-fire |
| settler-gun-fire-2 | gonzales-settler-igniter | settler-gun-fire |
| settler-gun-ready-1 | gonzales-settler-igniter | settler-gun-ready |
| settler-gun-ready-2 | gonzales-settler-igniter | settler-gun-ready |
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
| town-fort-velasco-1835 | town-fort-velasco | State artwork; no motion required |
| town-harrisburg-steam-mill-1835 | town-harrisburg-steam-mill | State artwork; no motion required |
| town-nacogdoches-stone-house-1835 | town-nacogdoches-stone-house | State artwork; no motion required |
| town-mill-smoke-1 | town-mill-smoke | town-mill-smoke |
| town-mill-smoke-2 | town-mill-smoke | town-mill-smoke |
| town-mill-smoke-3 | town-mill-smoke | town-mill-smoke |
| town-mill-smoke-4 | town-mill-smoke | town-mill-smoke |
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
| volunteer-crowbar-s-1 | volunteer-crowbar-vertical | volunteer-crowbar-s |
| volunteer-crowbar-s-2 | volunteer-crowbar-vertical | volunteer-crowbar-s |
| volunteer-crowbar-s-3 | volunteer-crowbar-vertical | volunteer-crowbar-s |
| volunteer-crowbar-s-4 | volunteer-crowbar-vertical | volunteer-crowbar-s |
| volunteer-crowbar-n-1 | volunteer-crowbar-vertical | volunteer-crowbar-n |
| volunteer-crowbar-n-2 | volunteer-crowbar-vertical | volunteer-crowbar-n |
| volunteer-crowbar-n-3 | volunteer-crowbar-vertical | volunteer-crowbar-n |
| volunteer-crowbar-n-4 | volunteer-crowbar-vertical | volunteer-crowbar-n |
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
| rust-rig-idle-s | rig-adult-male-locomotion | rust-rig-idle-s |
| rust-rig-idle-e | rig-adult-male-locomotion | rust-rig-idle-e |
| rust-rig-idle-n | rig-adult-male-locomotion | rust-rig-idle-n |
| rust-rig-idle-w | rig-adult-male-locomotion | rust-rig-idle-w |
| rust-rig-walk-e-1 | rig-adult-male-locomotion | rust-rig-walk-e |
| rust-rig-walk-e-2 | rig-adult-male-locomotion | rust-rig-walk-e |
| rust-rig-walk-e-3 | rig-adult-male-locomotion | rust-rig-walk-e |
| rust-rig-walk-e-4 | rig-adult-male-locomotion | rust-rig-walk-e |
| rust-rig-walk-s-1 | rig-adult-male-locomotion | rust-rig-walk-s |
| rust-rig-walk-s-2 | rig-adult-male-locomotion | rust-rig-walk-s |
| rust-rig-walk-n-1 | rig-adult-male-locomotion | rust-rig-walk-n |
| rust-rig-walk-n-2 | rig-adult-male-locomotion | rust-rig-walk-n |
| rust-rig-dig-1 | rig-adult-male-work | rust-rig-dig |
| rust-rig-dig-2 | rig-adult-male-work | rust-rig-dig |
| rust-rig-hoe-1 | rig-adult-male-work | rust-rig-hoe |
| rust-rig-hoe-2 | rig-adult-male-work | rust-rig-hoe |
| rust-rig-chop-1 | rig-adult-male-work | rust-rig-chop |
| rust-rig-chop-2 | rig-adult-male-work | rust-rig-chop |
| rust-rig-hammer-1 | rig-adult-male-work | rust-rig-hammer |
| rust-rig-hammer-2 | rig-adult-male-work | rust-rig-hammer |
| rust-rig-carry-1 | rig-adult-male-work | rust-rig-carry |
| rust-rig-carry-2 | rig-adult-male-work | rust-rig-carry |
| rust-rig-trade-1 | rig-adult-male-work | rust-rig-trade |
| rust-rig-trade-2 | rig-adult-male-work | rust-rig-trade |
| rust-rig-care-1 | rig-adult-male-work | rust-rig-care |
| rust-rig-care-2 | rig-adult-male-work | rust-rig-care |
| rust-rig-search-1 | rig-adult-male-work | rust-rig-search |
| rust-rig-search-2 | rig-adult-male-work | rust-rig-search |
| rust-rig-aim | rig-adult-male-service | rust-rig-fire-reload |
| rust-rig-fire | rig-adult-male-service | rust-rig-fire-reload |
| rust-rig-load | rig-adult-male-service | rust-rig-fire-reload |
| rust-rig-ramrod | rig-adult-male-service | rust-rig-fire-reload |
| rust-rig-horse-e-1 | rig-adult-male-service | State artwork; no motion required |
| rust-rig-horse-e-2 | rig-adult-male-service | State artwork; no motion required |
| rust-rig-passenger-e-1 | rig-adult-male-service | rust-rig-passenger-e |
| rust-rig-passenger-e-2 | rig-adult-male-service | rust-rig-passenger-e |
| rust-rig-passenger-s-1 | rig-adult-male-service | rust-rig-passenger-s |
| rust-rig-passenger-s-2 | rig-adult-male-service | rust-rig-passenger-s |
| rust-rig-passenger-n-1 | rig-adult-male-service | rust-rig-passenger-n |
| rust-rig-passenger-n-2 | rig-adult-male-service | rust-rig-passenger-n |
| rust-rig-wounded-1 | rig-adult-male-service | rust-rig-wounded |
| rust-rig-wounded-2 | rig-adult-male-service | rust-rig-wounded |
| rust-rig-fall | rig-adult-male-service | State artwork; no motion required |
| rust-rig-still | rig-adult-male-service | State artwork; no motion required |
| rust-rig-saddle-e-1 | rig-adult-male-saddle | rust-rig-saddle-e |
| rust-rig-saddle-e-2 | rig-adult-male-saddle | rust-rig-saddle-e |
| rust-rig-saddle-wounded-e-1 | rig-adult-male-saddle | rust-rig-saddle-wounded-e |
| rust-rig-saddle-wounded-e-2 | rig-adult-male-saddle | rust-rig-saddle-wounded-e |
| rust-rig-saddle-s-1 | rig-adult-male-saddle | rust-rig-saddle-s |
| rust-rig-saddle-s-2 | rig-adult-male-saddle | rust-rig-saddle-s |
| rust-rig-saddle-wounded-s-1 | rig-adult-male-saddle | rust-rig-saddle-wounded-s |
| rust-rig-saddle-wounded-s-2 | rig-adult-male-saddle | rust-rig-saddle-wounded-s |
| rust-rig-saddle-n-1 | rig-adult-male-saddle | rust-rig-saddle-n |
| rust-rig-saddle-n-2 | rig-adult-male-saddle | rust-rig-saddle-n |
| rust-rig-saddle-wounded-n-1 | rig-adult-male-saddle | rust-rig-saddle-wounded-n |
| rust-rig-saddle-wounded-n-2 | rig-adult-male-saddle | rust-rig-saddle-wounded-n |
| rust-rig-covered-1 | rig-covered-patients | rust-rig-covered |
| rust-rig-covered-2 | rig-covered-patients | rust-rig-covered |
| rust-rig-camp-rest-1 | rig-camp-grown | rust-rig-camp-rest |
| rust-rig-camp-rest-2 | rig-camp-grown | rust-rig-camp-rest |
| rust-rig-camp-sleep-1 | rig-camp-grown | rust-rig-camp-sleep |
| rust-rig-camp-sleep-2 | rig-camp-grown | rust-rig-camp-sleep |
| rust-rig-mounted-e-aim | rig-adult-male-mounted-service | rust-rig-mounted-fire-e |
| rust-rig-mounted-e-fire | rig-adult-male-mounted-service | rust-rig-mounted-fire-e |
| rust-rig-mounted-e-load | rig-adult-male-mounted-service | rust-rig-mounted-fire-e |
| rust-rig-mounted-e-ramrod | rig-adult-male-mounted-service | rust-rig-mounted-fire-e |
| rust-rig-mounted-s-aim | rig-adult-male-mounted-service | rust-rig-mounted-fire-s |
| rust-rig-mounted-s-fire | rig-adult-male-mounted-service | rust-rig-mounted-fire-s |
| rust-rig-mounted-s-load | rig-adult-male-mounted-service | rust-rig-mounted-fire-s |
| rust-rig-mounted-s-ramrod | rig-adult-male-mounted-service | rust-rig-mounted-fire-s |
| rust-rig-mounted-n-aim | rig-adult-male-mounted-service | rust-rig-mounted-fire-n |
| rust-rig-mounted-n-fire | rig-adult-male-mounted-service | rust-rig-mounted-fire-n |
| rust-rig-mounted-n-load | rig-adult-male-mounted-service | rust-rig-mounted-fire-n |
| rust-rig-mounted-n-ramrod | rig-adult-male-mounted-service | rust-rig-mounted-fire-n |
| rust-rig-surrender-1 | rig-capture-poses | rust-rig-surrender |
| rust-rig-surrender-2 | rig-capture-poses | rust-rig-surrender |
| rust-rig-sow-1 | rig-sow-poses | rust-rig-sow |
| rust-rig-sow-2 | rig-sow-poses | rust-rig-sow |
| rust-rig-harvest-1 | rig-harvest-poses | rust-rig-harvest |
| rust-rig-harvest-2 | rig-harvest-poses | rust-rig-harvest |
| elder-rig-idle-s | rig-adult-male-locomotion | elder-rig-idle-s |
| elder-rig-idle-e | rig-adult-male-locomotion | elder-rig-idle-e |
| elder-rig-idle-n | rig-adult-male-locomotion | elder-rig-idle-n |
| elder-rig-idle-w | rig-adult-male-locomotion | elder-rig-idle-w |
| elder-rig-walk-e-1 | rig-adult-male-locomotion | elder-rig-walk-e |
| elder-rig-walk-e-2 | rig-adult-male-locomotion | elder-rig-walk-e |
| elder-rig-walk-e-3 | rig-adult-male-locomotion | elder-rig-walk-e |
| elder-rig-walk-e-4 | rig-adult-male-locomotion | elder-rig-walk-e |
| elder-rig-walk-s-1 | rig-adult-male-locomotion | elder-rig-walk-s |
| elder-rig-walk-s-2 | rig-adult-male-locomotion | elder-rig-walk-s |
| elder-rig-walk-n-1 | rig-adult-male-locomotion | elder-rig-walk-n |
| elder-rig-walk-n-2 | rig-adult-male-locomotion | elder-rig-walk-n |
| elder-rig-dig-1 | rig-adult-male-work | elder-rig-dig |
| elder-rig-dig-2 | rig-adult-male-work | elder-rig-dig |
| elder-rig-hoe-1 | rig-adult-male-work | elder-rig-hoe |
| elder-rig-hoe-2 | rig-adult-male-work | elder-rig-hoe |
| elder-rig-chop-1 | rig-adult-male-work | elder-rig-chop |
| elder-rig-chop-2 | rig-adult-male-work | elder-rig-chop |
| elder-rig-hammer-1 | rig-adult-male-work | elder-rig-hammer |
| elder-rig-hammer-2 | rig-adult-male-work | elder-rig-hammer |
| elder-rig-carry-1 | rig-adult-male-work | elder-rig-carry |
| elder-rig-carry-2 | rig-adult-male-work | elder-rig-carry |
| elder-rig-trade-1 | rig-adult-male-work | elder-rig-trade |
| elder-rig-trade-2 | rig-adult-male-work | elder-rig-trade |
| elder-rig-care-1 | rig-adult-male-work | elder-rig-care |
| elder-rig-care-2 | rig-adult-male-work | elder-rig-care |
| elder-rig-search-1 | rig-adult-male-work | elder-rig-search |
| elder-rig-search-2 | rig-adult-male-work | elder-rig-search |
| elder-rig-aim | rig-adult-male-service | elder-rig-fire-reload |
| elder-rig-fire | rig-adult-male-service | elder-rig-fire-reload |
| elder-rig-load | rig-adult-male-service | elder-rig-fire-reload |
| elder-rig-ramrod | rig-adult-male-service | elder-rig-fire-reload |
| elder-rig-horse-e-1 | rig-adult-male-service | State artwork; no motion required |
| elder-rig-horse-e-2 | rig-adult-male-service | State artwork; no motion required |
| elder-rig-passenger-e-1 | rig-adult-male-service | elder-rig-passenger-e |
| elder-rig-passenger-e-2 | rig-adult-male-service | elder-rig-passenger-e |
| elder-rig-passenger-s-1 | rig-adult-male-service | elder-rig-passenger-s |
| elder-rig-passenger-s-2 | rig-adult-male-service | elder-rig-passenger-s |
| elder-rig-passenger-n-1 | rig-adult-male-service | elder-rig-passenger-n |
| elder-rig-passenger-n-2 | rig-adult-male-service | elder-rig-passenger-n |
| elder-rig-wounded-1 | rig-adult-male-service | elder-rig-wounded |
| elder-rig-wounded-2 | rig-adult-male-service | elder-rig-wounded |
| elder-rig-fall | rig-adult-male-service | State artwork; no motion required |
| elder-rig-still | rig-adult-male-service | State artwork; no motion required |
| elder-rig-saddle-e-1 | rig-adult-male-saddle | elder-rig-saddle-e |
| elder-rig-saddle-e-2 | rig-adult-male-saddle | elder-rig-saddle-e |
| elder-rig-saddle-wounded-e-1 | rig-adult-male-saddle | elder-rig-saddle-wounded-e |
| elder-rig-saddle-wounded-e-2 | rig-adult-male-saddle | elder-rig-saddle-wounded-e |
| elder-rig-saddle-s-1 | rig-adult-male-saddle | elder-rig-saddle-s |
| elder-rig-saddle-s-2 | rig-adult-male-saddle | elder-rig-saddle-s |
| elder-rig-saddle-wounded-s-1 | rig-adult-male-saddle | elder-rig-saddle-wounded-s |
| elder-rig-saddle-wounded-s-2 | rig-adult-male-saddle | elder-rig-saddle-wounded-s |
| elder-rig-saddle-n-1 | rig-adult-male-saddle | elder-rig-saddle-n |
| elder-rig-saddle-n-2 | rig-adult-male-saddle | elder-rig-saddle-n |
| elder-rig-saddle-wounded-n-1 | rig-adult-male-saddle | elder-rig-saddle-wounded-n |
| elder-rig-saddle-wounded-n-2 | rig-adult-male-saddle | elder-rig-saddle-wounded-n |
| elder-rig-covered-1 | rig-covered-patients | elder-rig-covered |
| elder-rig-covered-2 | rig-covered-patients | elder-rig-covered |
| elder-rig-camp-rest-1 | rig-camp-grown | elder-rig-camp-rest |
| elder-rig-camp-rest-2 | rig-camp-grown | elder-rig-camp-rest |
| elder-rig-camp-sleep-1 | rig-camp-grown | elder-rig-camp-sleep |
| elder-rig-camp-sleep-2 | rig-camp-grown | elder-rig-camp-sleep |
| elder-rig-mounted-e-aim | rig-adult-male-mounted-service | elder-rig-mounted-fire-e |
| elder-rig-mounted-e-fire | rig-adult-male-mounted-service | elder-rig-mounted-fire-e |
| elder-rig-mounted-e-load | rig-adult-male-mounted-service | elder-rig-mounted-fire-e |
| elder-rig-mounted-e-ramrod | rig-adult-male-mounted-service | elder-rig-mounted-fire-e |
| elder-rig-mounted-s-aim | rig-adult-male-mounted-service | elder-rig-mounted-fire-s |
| elder-rig-mounted-s-fire | rig-adult-male-mounted-service | elder-rig-mounted-fire-s |
| elder-rig-mounted-s-load | rig-adult-male-mounted-service | elder-rig-mounted-fire-s |
| elder-rig-mounted-s-ramrod | rig-adult-male-mounted-service | elder-rig-mounted-fire-s |
| elder-rig-mounted-n-aim | rig-adult-male-mounted-service | elder-rig-mounted-fire-n |
| elder-rig-mounted-n-fire | rig-adult-male-mounted-service | elder-rig-mounted-fire-n |
| elder-rig-mounted-n-load | rig-adult-male-mounted-service | elder-rig-mounted-fire-n |
| elder-rig-mounted-n-ramrod | rig-adult-male-mounted-service | elder-rig-mounted-fire-n |
| elder-rig-surrender-1 | rig-capture-poses | elder-rig-surrender |
| elder-rig-surrender-2 | rig-capture-poses | elder-rig-surrender |
| elder-rig-sow-1 | rig-sow-poses | elder-rig-sow |
| elder-rig-sow-2 | rig-sow-poses | elder-rig-sow |
| elder-rig-harvest-1 | rig-harvest-poses | elder-rig-harvest |
| elder-rig-harvest-2 | rig-harvest-poses | elder-rig-harvest |
| ochre-rig-idle-s | rig-adult-male-locomotion | ochre-rig-idle-s |
| ochre-rig-idle-e | rig-adult-male-locomotion | ochre-rig-idle-e |
| ochre-rig-idle-n | rig-adult-male-locomotion | ochre-rig-idle-n |
| ochre-rig-idle-w | rig-adult-male-locomotion | ochre-rig-idle-w |
| ochre-rig-walk-e-1 | rig-adult-male-locomotion | ochre-rig-walk-e |
| ochre-rig-walk-e-2 | rig-adult-male-locomotion | ochre-rig-walk-e |
| ochre-rig-walk-e-3 | rig-adult-male-locomotion | ochre-rig-walk-e |
| ochre-rig-walk-e-4 | rig-adult-male-locomotion | ochre-rig-walk-e |
| ochre-rig-walk-s-1 | rig-adult-male-locomotion | ochre-rig-walk-s |
| ochre-rig-walk-s-2 | rig-adult-male-locomotion | ochre-rig-walk-s |
| ochre-rig-walk-n-1 | rig-adult-male-locomotion | ochre-rig-walk-n |
| ochre-rig-walk-n-2 | rig-adult-male-locomotion | ochre-rig-walk-n |
| ochre-rig-dig-1 | rig-adult-male-work | ochre-rig-dig |
| ochre-rig-dig-2 | rig-adult-male-work | ochre-rig-dig |
| ochre-rig-hoe-1 | rig-adult-male-work | ochre-rig-hoe |
| ochre-rig-hoe-2 | rig-adult-male-work | ochre-rig-hoe |
| ochre-rig-chop-1 | rig-adult-male-work | ochre-rig-chop |
| ochre-rig-chop-2 | rig-adult-male-work | ochre-rig-chop |
| ochre-rig-hammer-1 | rig-adult-male-work | ochre-rig-hammer |
| ochre-rig-hammer-2 | rig-adult-male-work | ochre-rig-hammer |
| ochre-rig-carry-1 | rig-adult-male-work | ochre-rig-carry |
| ochre-rig-carry-2 | rig-adult-male-work | ochre-rig-carry |
| ochre-rig-trade-1 | rig-adult-male-work | ochre-rig-trade |
| ochre-rig-trade-2 | rig-adult-male-work | ochre-rig-trade |
| ochre-rig-care-1 | rig-adult-male-work | ochre-rig-care |
| ochre-rig-care-2 | rig-adult-male-work | ochre-rig-care |
| ochre-rig-search-1 | rig-adult-male-work | ochre-rig-search |
| ochre-rig-search-2 | rig-adult-male-work | ochre-rig-search |
| ochre-rig-aim | rig-adult-male-service | ochre-rig-fire-reload |
| ochre-rig-fire | rig-adult-male-service | ochre-rig-fire-reload |
| ochre-rig-load | rig-adult-male-service | ochre-rig-fire-reload |
| ochre-rig-ramrod | rig-adult-male-service | ochre-rig-fire-reload |
| ochre-rig-horse-e-1 | rig-adult-male-service | State artwork; no motion required |
| ochre-rig-horse-e-2 | rig-adult-male-service | State artwork; no motion required |
| ochre-rig-passenger-e-1 | rig-adult-male-service | ochre-rig-passenger-e |
| ochre-rig-passenger-e-2 | rig-adult-male-service | ochre-rig-passenger-e |
| ochre-rig-passenger-s-1 | rig-adult-male-service | ochre-rig-passenger-s |
| ochre-rig-passenger-s-2 | rig-adult-male-service | ochre-rig-passenger-s |
| ochre-rig-passenger-n-1 | rig-adult-male-service | ochre-rig-passenger-n |
| ochre-rig-passenger-n-2 | rig-adult-male-service | ochre-rig-passenger-n |
| ochre-rig-wounded-1 | rig-adult-male-service | ochre-rig-wounded |
| ochre-rig-wounded-2 | rig-adult-male-service | ochre-rig-wounded |
| ochre-rig-fall | rig-adult-male-service | State artwork; no motion required |
| ochre-rig-still | rig-adult-male-service | State artwork; no motion required |
| ochre-rig-saddle-e-1 | rig-adult-male-saddle | ochre-rig-saddle-e |
| ochre-rig-saddle-e-2 | rig-adult-male-saddle | ochre-rig-saddle-e |
| ochre-rig-saddle-wounded-e-1 | rig-adult-male-saddle | ochre-rig-saddle-wounded-e |
| ochre-rig-saddle-wounded-e-2 | rig-adult-male-saddle | ochre-rig-saddle-wounded-e |
| ochre-rig-saddle-s-1 | rig-adult-male-saddle | ochre-rig-saddle-s |
| ochre-rig-saddle-s-2 | rig-adult-male-saddle | ochre-rig-saddle-s |
| ochre-rig-saddle-wounded-s-1 | rig-adult-male-saddle | ochre-rig-saddle-wounded-s |
| ochre-rig-saddle-wounded-s-2 | rig-adult-male-saddle | ochre-rig-saddle-wounded-s |
| ochre-rig-saddle-n-1 | rig-adult-male-saddle | ochre-rig-saddle-n |
| ochre-rig-saddle-n-2 | rig-adult-male-saddle | ochre-rig-saddle-n |
| ochre-rig-saddle-wounded-n-1 | rig-adult-male-saddle | ochre-rig-saddle-wounded-n |
| ochre-rig-saddle-wounded-n-2 | rig-adult-male-saddle | ochre-rig-saddle-wounded-n |
| ochre-rig-covered-1 | rig-covered-patients | ochre-rig-covered |
| ochre-rig-covered-2 | rig-covered-patients | ochre-rig-covered |
| ochre-rig-camp-rest-1 | rig-camp-grown | ochre-rig-camp-rest |
| ochre-rig-camp-rest-2 | rig-camp-grown | ochre-rig-camp-rest |
| ochre-rig-camp-sleep-1 | rig-camp-grown | ochre-rig-camp-sleep |
| ochre-rig-camp-sleep-2 | rig-camp-grown | ochre-rig-camp-sleep |
| ochre-rig-mounted-e-aim | rig-adult-male-mounted-service | ochre-rig-mounted-fire-e |
| ochre-rig-mounted-e-fire | rig-adult-male-mounted-service | ochre-rig-mounted-fire-e |
| ochre-rig-mounted-e-load | rig-adult-male-mounted-service | ochre-rig-mounted-fire-e |
| ochre-rig-mounted-e-ramrod | rig-adult-male-mounted-service | ochre-rig-mounted-fire-e |
| ochre-rig-mounted-s-aim | rig-adult-male-mounted-service | ochre-rig-mounted-fire-s |
| ochre-rig-mounted-s-fire | rig-adult-male-mounted-service | ochre-rig-mounted-fire-s |
| ochre-rig-mounted-s-load | rig-adult-male-mounted-service | ochre-rig-mounted-fire-s |
| ochre-rig-mounted-s-ramrod | rig-adult-male-mounted-service | ochre-rig-mounted-fire-s |
| ochre-rig-mounted-n-aim | rig-adult-male-mounted-service | ochre-rig-mounted-fire-n |
| ochre-rig-mounted-n-fire | rig-adult-male-mounted-service | ochre-rig-mounted-fire-n |
| ochre-rig-mounted-n-load | rig-adult-male-mounted-service | ochre-rig-mounted-fire-n |
| ochre-rig-mounted-n-ramrod | rig-adult-male-mounted-service | ochre-rig-mounted-fire-n |
| ochre-rig-surrender-1 | rig-capture-poses | ochre-rig-surrender |
| ochre-rig-surrender-2 | rig-capture-poses | ochre-rig-surrender |
| ochre-rig-sow-1 | rig-sow-poses | ochre-rig-sow |
| ochre-rig-sow-2 | rig-sow-poses | ochre-rig-sow |
| ochre-rig-harvest-1 | rig-harvest-poses | ochre-rig-harvest |
| ochre-rig-harvest-2 | rig-harvest-poses | ochre-rig-harvest |
| father-hat-rig-idle-s | rig-adult-male-locomotion | father-hat-rig-idle-s |
| father-hat-rig-idle-e | rig-adult-male-locomotion | father-hat-rig-idle-e |
| father-hat-rig-idle-n | rig-adult-male-locomotion | father-hat-rig-idle-n |
| father-hat-rig-idle-w | rig-adult-male-locomotion | father-hat-rig-idle-w |
| father-hat-rig-walk-e-1 | rig-adult-male-locomotion | father-hat-rig-walk-e |
| father-hat-rig-walk-e-2 | rig-adult-male-locomotion | father-hat-rig-walk-e |
| father-hat-rig-walk-e-3 | rig-adult-male-locomotion | father-hat-rig-walk-e |
| father-hat-rig-walk-e-4 | rig-adult-male-locomotion | father-hat-rig-walk-e |
| father-hat-rig-walk-s-1 | rig-adult-male-locomotion | father-hat-rig-walk-s |
| father-hat-rig-walk-s-2 | rig-adult-male-locomotion | father-hat-rig-walk-s |
| father-hat-rig-walk-n-1 | rig-adult-male-locomotion | father-hat-rig-walk-n |
| father-hat-rig-walk-n-2 | rig-adult-male-locomotion | father-hat-rig-walk-n |
| father-hat-rig-dig-1 | rig-adult-male-work | father-hat-rig-dig |
| father-hat-rig-dig-2 | rig-adult-male-work | father-hat-rig-dig |
| father-hat-rig-hoe-1 | rig-adult-male-work | father-hat-rig-hoe |
| father-hat-rig-hoe-2 | rig-adult-male-work | father-hat-rig-hoe |
| father-hat-rig-chop-1 | rig-adult-male-work | father-hat-rig-chop |
| father-hat-rig-chop-2 | rig-adult-male-work | father-hat-rig-chop |
| father-hat-rig-hammer-1 | rig-adult-male-work | father-hat-rig-hammer |
| father-hat-rig-hammer-2 | rig-adult-male-work | father-hat-rig-hammer |
| father-hat-rig-carry-1 | rig-adult-male-work | father-hat-rig-carry |
| father-hat-rig-carry-2 | rig-adult-male-work | father-hat-rig-carry |
| father-hat-rig-trade-1 | rig-adult-male-work | father-hat-rig-trade |
| father-hat-rig-trade-2 | rig-adult-male-work | father-hat-rig-trade |
| father-hat-rig-care-1 | rig-adult-male-work | father-hat-rig-care |
| father-hat-rig-care-2 | rig-adult-male-work | father-hat-rig-care |
| father-hat-rig-search-1 | rig-adult-male-work | father-hat-rig-search |
| father-hat-rig-search-2 | rig-adult-male-work | father-hat-rig-search |
| father-hat-rig-aim | rig-adult-male-service | father-hat-rig-fire-reload |
| father-hat-rig-fire | rig-adult-male-service | father-hat-rig-fire-reload |
| father-hat-rig-load | rig-adult-male-service | father-hat-rig-fire-reload |
| father-hat-rig-ramrod | rig-adult-male-service | father-hat-rig-fire-reload |
| father-hat-rig-horse-e-1 | rig-adult-male-service | State artwork; no motion required |
| father-hat-rig-horse-e-2 | rig-adult-male-service | State artwork; no motion required |
| father-hat-rig-passenger-e-1 | rig-adult-male-service | father-hat-rig-passenger-e |
| father-hat-rig-passenger-e-2 | rig-adult-male-service | father-hat-rig-passenger-e |
| father-hat-rig-passenger-s-1 | rig-adult-male-service | father-hat-rig-passenger-s |
| father-hat-rig-passenger-s-2 | rig-adult-male-service | father-hat-rig-passenger-s |
| father-hat-rig-passenger-n-1 | rig-adult-male-service | father-hat-rig-passenger-n |
| father-hat-rig-passenger-n-2 | rig-adult-male-service | father-hat-rig-passenger-n |
| father-hat-rig-wounded-1 | rig-adult-male-service | father-hat-rig-wounded |
| father-hat-rig-wounded-2 | rig-adult-male-service | father-hat-rig-wounded |
| father-hat-rig-fall | rig-adult-male-service | State artwork; no motion required |
| father-hat-rig-still | rig-adult-male-service | State artwork; no motion required |
| father-hat-rig-saddle-e-1 | rig-adult-male-saddle | father-hat-rig-saddle-e |
| father-hat-rig-saddle-e-2 | rig-adult-male-saddle | father-hat-rig-saddle-e |
| father-hat-rig-saddle-wounded-e-1 | rig-adult-male-saddle | father-hat-rig-saddle-wounded-e |
| father-hat-rig-saddle-wounded-e-2 | rig-adult-male-saddle | father-hat-rig-saddle-wounded-e |
| father-hat-rig-saddle-s-1 | rig-adult-male-saddle | father-hat-rig-saddle-s |
| father-hat-rig-saddle-s-2 | rig-adult-male-saddle | father-hat-rig-saddle-s |
| father-hat-rig-saddle-wounded-s-1 | rig-adult-male-saddle | father-hat-rig-saddle-wounded-s |
| father-hat-rig-saddle-wounded-s-2 | rig-adult-male-saddle | father-hat-rig-saddle-wounded-s |
| father-hat-rig-saddle-n-1 | rig-adult-male-saddle | father-hat-rig-saddle-n |
| father-hat-rig-saddle-n-2 | rig-adult-male-saddle | father-hat-rig-saddle-n |
| father-hat-rig-saddle-wounded-n-1 | rig-adult-male-saddle | father-hat-rig-saddle-wounded-n |
| father-hat-rig-saddle-wounded-n-2 | rig-adult-male-saddle | father-hat-rig-saddle-wounded-n |
| father-hat-rig-covered-1 | rig-covered-patients | father-hat-rig-covered |
| father-hat-rig-covered-2 | rig-covered-patients | father-hat-rig-covered |
| father-hat-rig-camp-rest-1 | rig-camp-grown | father-hat-rig-camp-rest |
| father-hat-rig-camp-rest-2 | rig-camp-grown | father-hat-rig-camp-rest |
| father-hat-rig-camp-sleep-1 | rig-camp-grown | father-hat-rig-camp-sleep |
| father-hat-rig-camp-sleep-2 | rig-camp-grown | father-hat-rig-camp-sleep |
| father-hat-rig-mounted-e-aim | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-e |
| father-hat-rig-mounted-e-fire | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-e |
| father-hat-rig-mounted-e-load | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-e |
| father-hat-rig-mounted-e-ramrod | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-e |
| father-hat-rig-mounted-s-aim | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-s |
| father-hat-rig-mounted-s-fire | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-s |
| father-hat-rig-mounted-s-load | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-s |
| father-hat-rig-mounted-s-ramrod | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-s |
| father-hat-rig-mounted-n-aim | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-n |
| father-hat-rig-mounted-n-fire | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-n |
| father-hat-rig-mounted-n-load | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-n |
| father-hat-rig-mounted-n-ramrod | rig-adult-male-mounted-service | father-hat-rig-mounted-fire-n |
| father-hat-rig-surrender-1 | rig-capture-poses | father-hat-rig-surrender |
| father-hat-rig-surrender-2 | rig-capture-poses | father-hat-rig-surrender |
| father-hat-rig-sow-1 | rig-sow-poses | father-hat-rig-sow |
| father-hat-rig-sow-2 | rig-sow-poses | father-hat-rig-sow |
| father-hat-rig-harvest-1 | rig-harvest-poses | father-hat-rig-harvest |
| father-hat-rig-harvest-2 | rig-harvest-poses | father-hat-rig-harvest |
| father-beard-rig-idle-s | rig-adult-male-locomotion | father-beard-rig-idle-s |
| father-beard-rig-idle-e | rig-adult-male-locomotion | father-beard-rig-idle-e |
| father-beard-rig-idle-n | rig-adult-male-locomotion | father-beard-rig-idle-n |
| father-beard-rig-idle-w | rig-adult-male-locomotion | father-beard-rig-idle-w |
| father-beard-rig-walk-e-1 | rig-adult-male-locomotion | father-beard-rig-walk-e |
| father-beard-rig-walk-e-2 | rig-adult-male-locomotion | father-beard-rig-walk-e |
| father-beard-rig-walk-e-3 | rig-adult-male-locomotion | father-beard-rig-walk-e |
| father-beard-rig-walk-e-4 | rig-adult-male-locomotion | father-beard-rig-walk-e |
| father-beard-rig-walk-s-1 | rig-adult-male-locomotion | father-beard-rig-walk-s |
| father-beard-rig-walk-s-2 | rig-adult-male-locomotion | father-beard-rig-walk-s |
| father-beard-rig-walk-n-1 | rig-adult-male-locomotion | father-beard-rig-walk-n |
| father-beard-rig-walk-n-2 | rig-adult-male-locomotion | father-beard-rig-walk-n |
| father-beard-rig-dig-1 | rig-adult-male-work | father-beard-rig-dig |
| father-beard-rig-dig-2 | rig-adult-male-work | father-beard-rig-dig |
| father-beard-rig-hoe-1 | rig-adult-male-work | father-beard-rig-hoe |
| father-beard-rig-hoe-2 | rig-adult-male-work | father-beard-rig-hoe |
| father-beard-rig-chop-1 | rig-adult-male-work | father-beard-rig-chop |
| father-beard-rig-chop-2 | rig-adult-male-work | father-beard-rig-chop |
| father-beard-rig-hammer-1 | rig-adult-male-work | father-beard-rig-hammer |
| father-beard-rig-hammer-2 | rig-adult-male-work | father-beard-rig-hammer |
| father-beard-rig-carry-1 | rig-adult-male-work | father-beard-rig-carry |
| father-beard-rig-carry-2 | rig-adult-male-work | father-beard-rig-carry |
| father-beard-rig-trade-1 | rig-adult-male-work | father-beard-rig-trade |
| father-beard-rig-trade-2 | rig-adult-male-work | father-beard-rig-trade |
| father-beard-rig-care-1 | rig-adult-male-work | father-beard-rig-care |
| father-beard-rig-care-2 | rig-adult-male-work | father-beard-rig-care |
| father-beard-rig-search-1 | rig-adult-male-work | father-beard-rig-search |
| father-beard-rig-search-2 | rig-adult-male-work | father-beard-rig-search |
| father-beard-rig-aim | rig-adult-male-service | father-beard-rig-fire-reload |
| father-beard-rig-fire | rig-adult-male-service | father-beard-rig-fire-reload |
| father-beard-rig-load | rig-adult-male-service | father-beard-rig-fire-reload |
| father-beard-rig-ramrod | rig-adult-male-service | father-beard-rig-fire-reload |
| father-beard-rig-horse-e-1 | rig-adult-male-service | State artwork; no motion required |
| father-beard-rig-horse-e-2 | rig-adult-male-service | State artwork; no motion required |
| father-beard-rig-passenger-e-1 | rig-adult-male-service | father-beard-rig-passenger-e |
| father-beard-rig-passenger-e-2 | rig-adult-male-service | father-beard-rig-passenger-e |
| father-beard-rig-passenger-s-1 | rig-adult-male-service | father-beard-rig-passenger-s |
| father-beard-rig-passenger-s-2 | rig-adult-male-service | father-beard-rig-passenger-s |
| father-beard-rig-passenger-n-1 | rig-adult-male-service | father-beard-rig-passenger-n |
| father-beard-rig-passenger-n-2 | rig-adult-male-service | father-beard-rig-passenger-n |
| father-beard-rig-wounded-1 | rig-adult-male-service | father-beard-rig-wounded |
| father-beard-rig-wounded-2 | rig-adult-male-service | father-beard-rig-wounded |
| father-beard-rig-fall | rig-adult-male-service | State artwork; no motion required |
| father-beard-rig-still | rig-adult-male-service | State artwork; no motion required |
| father-beard-rig-saddle-e-1 | rig-adult-male-saddle | father-beard-rig-saddle-e |
| father-beard-rig-saddle-e-2 | rig-adult-male-saddle | father-beard-rig-saddle-e |
| father-beard-rig-saddle-wounded-e-1 | rig-adult-male-saddle | father-beard-rig-saddle-wounded-e |
| father-beard-rig-saddle-wounded-e-2 | rig-adult-male-saddle | father-beard-rig-saddle-wounded-e |
| father-beard-rig-saddle-s-1 | rig-adult-male-saddle | father-beard-rig-saddle-s |
| father-beard-rig-saddle-s-2 | rig-adult-male-saddle | father-beard-rig-saddle-s |
| father-beard-rig-saddle-wounded-s-1 | rig-adult-male-saddle | father-beard-rig-saddle-wounded-s |
| father-beard-rig-saddle-wounded-s-2 | rig-adult-male-saddle | father-beard-rig-saddle-wounded-s |
| father-beard-rig-saddle-n-1 | rig-adult-male-saddle | father-beard-rig-saddle-n |
| father-beard-rig-saddle-n-2 | rig-adult-male-saddle | father-beard-rig-saddle-n |
| father-beard-rig-saddle-wounded-n-1 | rig-adult-male-saddle | father-beard-rig-saddle-wounded-n |
| father-beard-rig-saddle-wounded-n-2 | rig-adult-male-saddle | father-beard-rig-saddle-wounded-n |
| father-beard-rig-covered-1 | rig-covered-patients | father-beard-rig-covered |
| father-beard-rig-covered-2 | rig-covered-patients | father-beard-rig-covered |
| father-beard-rig-camp-rest-1 | rig-camp-grown | father-beard-rig-camp-rest |
| father-beard-rig-camp-rest-2 | rig-camp-grown | father-beard-rig-camp-rest |
| father-beard-rig-camp-sleep-1 | rig-camp-grown | father-beard-rig-camp-sleep |
| father-beard-rig-camp-sleep-2 | rig-camp-grown | father-beard-rig-camp-sleep |
| father-beard-rig-mounted-e-aim | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-e |
| father-beard-rig-mounted-e-fire | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-e |
| father-beard-rig-mounted-e-load | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-e |
| father-beard-rig-mounted-e-ramrod | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-e |
| father-beard-rig-mounted-s-aim | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-s |
| father-beard-rig-mounted-s-fire | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-s |
| father-beard-rig-mounted-s-load | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-s |
| father-beard-rig-mounted-s-ramrod | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-s |
| father-beard-rig-mounted-n-aim | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-n |
| father-beard-rig-mounted-n-fire | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-n |
| father-beard-rig-mounted-n-load | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-n |
| father-beard-rig-mounted-n-ramrod | rig-adult-male-mounted-service | father-beard-rig-mounted-fire-n |
| father-beard-rig-surrender-1 | rig-capture-poses | father-beard-rig-surrender |
| father-beard-rig-surrender-2 | rig-capture-poses | father-beard-rig-surrender |
| father-beard-rig-sow-1 | rig-sow-poses | father-beard-rig-sow |
| father-beard-rig-sow-2 | rig-sow-poses | father-beard-rig-sow |
| father-beard-rig-harvest-1 | rig-harvest-poses | father-beard-rig-harvest |
| father-beard-rig-harvest-2 | rig-harvest-poses | father-beard-rig-harvest |
| father-moustache-rig-idle-s | rig-adult-male-locomotion | father-moustache-rig-idle-s |
| father-moustache-rig-idle-e | rig-adult-male-locomotion | father-moustache-rig-idle-e |
| father-moustache-rig-idle-n | rig-adult-male-locomotion | father-moustache-rig-idle-n |
| father-moustache-rig-idle-w | rig-adult-male-locomotion | father-moustache-rig-idle-w |
| father-moustache-rig-walk-e-1 | rig-adult-male-locomotion | father-moustache-rig-walk-e |
| father-moustache-rig-walk-e-2 | rig-adult-male-locomotion | father-moustache-rig-walk-e |
| father-moustache-rig-walk-e-3 | rig-adult-male-locomotion | father-moustache-rig-walk-e |
| father-moustache-rig-walk-e-4 | rig-adult-male-locomotion | father-moustache-rig-walk-e |
| father-moustache-rig-walk-s-1 | rig-adult-male-locomotion | father-moustache-rig-walk-s |
| father-moustache-rig-walk-s-2 | rig-adult-male-locomotion | father-moustache-rig-walk-s |
| father-moustache-rig-walk-n-1 | rig-adult-male-locomotion | father-moustache-rig-walk-n |
| father-moustache-rig-walk-n-2 | rig-adult-male-locomotion | father-moustache-rig-walk-n |
| father-moustache-rig-dig-1 | rig-adult-male-work | father-moustache-rig-dig |
| father-moustache-rig-dig-2 | rig-adult-male-work | father-moustache-rig-dig |
| father-moustache-rig-hoe-1 | rig-adult-male-work | father-moustache-rig-hoe |
| father-moustache-rig-hoe-2 | rig-adult-male-work | father-moustache-rig-hoe |
| father-moustache-rig-chop-1 | rig-adult-male-work | father-moustache-rig-chop |
| father-moustache-rig-chop-2 | rig-adult-male-work | father-moustache-rig-chop |
| father-moustache-rig-hammer-1 | rig-adult-male-work | father-moustache-rig-hammer |
| father-moustache-rig-hammer-2 | rig-adult-male-work | father-moustache-rig-hammer |
| father-moustache-rig-carry-1 | rig-adult-male-work | father-moustache-rig-carry |
| father-moustache-rig-carry-2 | rig-adult-male-work | father-moustache-rig-carry |
| father-moustache-rig-trade-1 | rig-adult-male-work | father-moustache-rig-trade |
| father-moustache-rig-trade-2 | rig-adult-male-work | father-moustache-rig-trade |
| father-moustache-rig-care-1 | rig-adult-male-work | father-moustache-rig-care |
| father-moustache-rig-care-2 | rig-adult-male-work | father-moustache-rig-care |
| father-moustache-rig-search-1 | rig-adult-male-work | father-moustache-rig-search |
| father-moustache-rig-search-2 | rig-adult-male-work | father-moustache-rig-search |
| father-moustache-rig-aim | rig-adult-male-service | father-moustache-rig-fire-reload |
| father-moustache-rig-fire | rig-adult-male-service | father-moustache-rig-fire-reload |
| father-moustache-rig-load | rig-adult-male-service | father-moustache-rig-fire-reload |
| father-moustache-rig-ramrod | rig-adult-male-service | father-moustache-rig-fire-reload |
| father-moustache-rig-horse-e-1 | rig-adult-male-service | State artwork; no motion required |
| father-moustache-rig-horse-e-2 | rig-adult-male-service | State artwork; no motion required |
| father-moustache-rig-passenger-e-1 | rig-adult-male-service | father-moustache-rig-passenger-e |
| father-moustache-rig-passenger-e-2 | rig-adult-male-service | father-moustache-rig-passenger-e |
| father-moustache-rig-passenger-s-1 | rig-adult-male-service | father-moustache-rig-passenger-s |
| father-moustache-rig-passenger-s-2 | rig-adult-male-service | father-moustache-rig-passenger-s |
| father-moustache-rig-passenger-n-1 | rig-adult-male-service | father-moustache-rig-passenger-n |
| father-moustache-rig-passenger-n-2 | rig-adult-male-service | father-moustache-rig-passenger-n |
| father-moustache-rig-wounded-1 | rig-adult-male-service | father-moustache-rig-wounded |
| father-moustache-rig-wounded-2 | rig-adult-male-service | father-moustache-rig-wounded |
| father-moustache-rig-fall | rig-adult-male-service | State artwork; no motion required |
| father-moustache-rig-still | rig-adult-male-service | State artwork; no motion required |
| father-moustache-rig-saddle-e-1 | rig-adult-male-saddle | father-moustache-rig-saddle-e |
| father-moustache-rig-saddle-e-2 | rig-adult-male-saddle | father-moustache-rig-saddle-e |
| father-moustache-rig-saddle-wounded-e-1 | rig-adult-male-saddle | father-moustache-rig-saddle-wounded-e |
| father-moustache-rig-saddle-wounded-e-2 | rig-adult-male-saddle | father-moustache-rig-saddle-wounded-e |
| father-moustache-rig-saddle-s-1 | rig-adult-male-saddle | father-moustache-rig-saddle-s |
| father-moustache-rig-saddle-s-2 | rig-adult-male-saddle | father-moustache-rig-saddle-s |
| father-moustache-rig-saddle-wounded-s-1 | rig-adult-male-saddle | father-moustache-rig-saddle-wounded-s |
| father-moustache-rig-saddle-wounded-s-2 | rig-adult-male-saddle | father-moustache-rig-saddle-wounded-s |
| father-moustache-rig-saddle-n-1 | rig-adult-male-saddle | father-moustache-rig-saddle-n |
| father-moustache-rig-saddle-n-2 | rig-adult-male-saddle | father-moustache-rig-saddle-n |
| father-moustache-rig-saddle-wounded-n-1 | rig-adult-male-saddle | father-moustache-rig-saddle-wounded-n |
| father-moustache-rig-saddle-wounded-n-2 | rig-adult-male-saddle | father-moustache-rig-saddle-wounded-n |
| father-moustache-rig-covered-1 | rig-covered-patients | father-moustache-rig-covered |
| father-moustache-rig-covered-2 | rig-covered-patients | father-moustache-rig-covered |
| father-moustache-rig-camp-rest-1 | rig-camp-grown | father-moustache-rig-camp-rest |
| father-moustache-rig-camp-rest-2 | rig-camp-grown | father-moustache-rig-camp-rest |
| father-moustache-rig-camp-sleep-1 | rig-camp-grown | father-moustache-rig-camp-sleep |
| father-moustache-rig-camp-sleep-2 | rig-camp-grown | father-moustache-rig-camp-sleep |
| father-moustache-rig-mounted-e-aim | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-e |
| father-moustache-rig-mounted-e-fire | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-e |
| father-moustache-rig-mounted-e-load | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-e |
| father-moustache-rig-mounted-e-ramrod | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-e |
| father-moustache-rig-mounted-s-aim | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-s |
| father-moustache-rig-mounted-s-fire | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-s |
| father-moustache-rig-mounted-s-load | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-s |
| father-moustache-rig-mounted-s-ramrod | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-s |
| father-moustache-rig-mounted-n-aim | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-n |
| father-moustache-rig-mounted-n-fire | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-n |
| father-moustache-rig-mounted-n-load | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-n |
| father-moustache-rig-mounted-n-ramrod | rig-adult-male-mounted-service | father-moustache-rig-mounted-fire-n |
| father-moustache-rig-surrender-1 | rig-capture-poses | father-moustache-rig-surrender |
| father-moustache-rig-surrender-2 | rig-capture-poses | father-moustache-rig-surrender |
| father-moustache-rig-sow-1 | rig-sow-poses | father-moustache-rig-sow |
| father-moustache-rig-sow-2 | rig-sow-poses | father-moustache-rig-sow |
| father-moustache-rig-harvest-1 | rig-harvest-poses | father-moustache-rig-harvest |
| father-moustache-rig-harvest-2 | rig-harvest-poses | father-moustache-rig-harvest |
| father-straw-rig-idle-s | rig-adult-male-locomotion | father-straw-rig-idle-s |
| father-straw-rig-idle-e | rig-adult-male-locomotion | father-straw-rig-idle-e |
| father-straw-rig-idle-n | rig-adult-male-locomotion | father-straw-rig-idle-n |
| father-straw-rig-idle-w | rig-adult-male-locomotion | father-straw-rig-idle-w |
| father-straw-rig-walk-e-1 | rig-adult-male-locomotion | father-straw-rig-walk-e |
| father-straw-rig-walk-e-2 | rig-adult-male-locomotion | father-straw-rig-walk-e |
| father-straw-rig-walk-e-3 | rig-adult-male-locomotion | father-straw-rig-walk-e |
| father-straw-rig-walk-e-4 | rig-adult-male-locomotion | father-straw-rig-walk-e |
| father-straw-rig-walk-s-1 | rig-adult-male-locomotion | father-straw-rig-walk-s |
| father-straw-rig-walk-s-2 | rig-adult-male-locomotion | father-straw-rig-walk-s |
| father-straw-rig-walk-n-1 | rig-adult-male-locomotion | father-straw-rig-walk-n |
| father-straw-rig-walk-n-2 | rig-adult-male-locomotion | father-straw-rig-walk-n |
| father-straw-rig-dig-1 | rig-adult-male-work | father-straw-rig-dig |
| father-straw-rig-dig-2 | rig-adult-male-work | father-straw-rig-dig |
| father-straw-rig-hoe-1 | rig-adult-male-work | father-straw-rig-hoe |
| father-straw-rig-hoe-2 | rig-adult-male-work | father-straw-rig-hoe |
| father-straw-rig-chop-1 | rig-adult-male-work | father-straw-rig-chop |
| father-straw-rig-chop-2 | rig-adult-male-work | father-straw-rig-chop |
| father-straw-rig-hammer-1 | rig-adult-male-work | father-straw-rig-hammer |
| father-straw-rig-hammer-2 | rig-adult-male-work | father-straw-rig-hammer |
| father-straw-rig-carry-1 | rig-adult-male-work | father-straw-rig-carry |
| father-straw-rig-carry-2 | rig-adult-male-work | father-straw-rig-carry |
| father-straw-rig-trade-1 | rig-adult-male-work | father-straw-rig-trade |
| father-straw-rig-trade-2 | rig-adult-male-work | father-straw-rig-trade |
| father-straw-rig-care-1 | rig-adult-male-work | father-straw-rig-care |
| father-straw-rig-care-2 | rig-adult-male-work | father-straw-rig-care |
| father-straw-rig-search-1 | rig-adult-male-work | father-straw-rig-search |
| father-straw-rig-search-2 | rig-adult-male-work | father-straw-rig-search |
| father-straw-rig-aim | rig-adult-male-service | father-straw-rig-fire-reload |
| father-straw-rig-fire | rig-adult-male-service | father-straw-rig-fire-reload |
| father-straw-rig-load | rig-adult-male-service | father-straw-rig-fire-reload |
| father-straw-rig-ramrod | rig-adult-male-service | father-straw-rig-fire-reload |
| father-straw-rig-horse-e-1 | rig-adult-male-service | State artwork; no motion required |
| father-straw-rig-horse-e-2 | rig-adult-male-service | State artwork; no motion required |
| father-straw-rig-passenger-e-1 | rig-adult-male-service | father-straw-rig-passenger-e |
| father-straw-rig-passenger-e-2 | rig-adult-male-service | father-straw-rig-passenger-e |
| father-straw-rig-passenger-s-1 | rig-adult-male-service | father-straw-rig-passenger-s |
| father-straw-rig-passenger-s-2 | rig-adult-male-service | father-straw-rig-passenger-s |
| father-straw-rig-passenger-n-1 | rig-adult-male-service | father-straw-rig-passenger-n |
| father-straw-rig-passenger-n-2 | rig-adult-male-service | father-straw-rig-passenger-n |
| father-straw-rig-wounded-1 | rig-adult-male-service | father-straw-rig-wounded |
| father-straw-rig-wounded-2 | rig-adult-male-service | father-straw-rig-wounded |
| father-straw-rig-fall | rig-adult-male-service | State artwork; no motion required |
| father-straw-rig-still | rig-adult-male-service | State artwork; no motion required |
| father-straw-rig-saddle-e-1 | rig-adult-male-saddle | father-straw-rig-saddle-e |
| father-straw-rig-saddle-e-2 | rig-adult-male-saddle | father-straw-rig-saddle-e |
| father-straw-rig-saddle-wounded-e-1 | rig-adult-male-saddle | father-straw-rig-saddle-wounded-e |
| father-straw-rig-saddle-wounded-e-2 | rig-adult-male-saddle | father-straw-rig-saddle-wounded-e |
| father-straw-rig-saddle-s-1 | rig-adult-male-saddle | father-straw-rig-saddle-s |
| father-straw-rig-saddle-s-2 | rig-adult-male-saddle | father-straw-rig-saddle-s |
| father-straw-rig-saddle-wounded-s-1 | rig-adult-male-saddle | father-straw-rig-saddle-wounded-s |
| father-straw-rig-saddle-wounded-s-2 | rig-adult-male-saddle | father-straw-rig-saddle-wounded-s |
| father-straw-rig-saddle-n-1 | rig-adult-male-saddle | father-straw-rig-saddle-n |
| father-straw-rig-saddle-n-2 | rig-adult-male-saddle | father-straw-rig-saddle-n |
| father-straw-rig-saddle-wounded-n-1 | rig-adult-male-saddle | father-straw-rig-saddle-wounded-n |
| father-straw-rig-saddle-wounded-n-2 | rig-adult-male-saddle | father-straw-rig-saddle-wounded-n |
| father-straw-rig-covered-1 | rig-covered-patients | father-straw-rig-covered |
| father-straw-rig-covered-2 | rig-covered-patients | father-straw-rig-covered |
| father-straw-rig-camp-rest-1 | rig-camp-grown | father-straw-rig-camp-rest |
| father-straw-rig-camp-rest-2 | rig-camp-grown | father-straw-rig-camp-rest |
| father-straw-rig-camp-sleep-1 | rig-camp-grown | father-straw-rig-camp-sleep |
| father-straw-rig-camp-sleep-2 | rig-camp-grown | father-straw-rig-camp-sleep |
| father-straw-rig-mounted-e-aim | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-e |
| father-straw-rig-mounted-e-fire | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-e |
| father-straw-rig-mounted-e-load | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-e |
| father-straw-rig-mounted-e-ramrod | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-e |
| father-straw-rig-mounted-s-aim | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-s |
| father-straw-rig-mounted-s-fire | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-s |
| father-straw-rig-mounted-s-load | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-s |
| father-straw-rig-mounted-s-ramrod | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-s |
| father-straw-rig-mounted-n-aim | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-n |
| father-straw-rig-mounted-n-fire | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-n |
| father-straw-rig-mounted-n-load | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-n |
| father-straw-rig-mounted-n-ramrod | rig-adult-male-mounted-service | father-straw-rig-mounted-fire-n |
| father-straw-rig-surrender-1 | rig-capture-poses | father-straw-rig-surrender |
| father-straw-rig-surrender-2 | rig-capture-poses | father-straw-rig-surrender |
| father-straw-rig-sow-1 | rig-sow-poses | father-straw-rig-sow |
| father-straw-rig-sow-2 | rig-sow-poses | father-straw-rig-sow |
| father-straw-rig-harvest-1 | rig-harvest-poses | father-straw-rig-harvest |
| father-straw-rig-harvest-2 | rig-harvest-poses | father-straw-rig-harvest |
| teal-rig-idle-s | rig-adult-female-locomotion | teal-rig-idle-s |
| teal-rig-idle-e | rig-adult-female-locomotion | teal-rig-idle-e |
| teal-rig-idle-n | rig-adult-female-locomotion | teal-rig-idle-n |
| teal-rig-idle-w | rig-adult-female-locomotion | teal-rig-idle-w |
| teal-rig-walk-e-1 | rig-adult-female-locomotion | teal-rig-walk-e |
| teal-rig-walk-e-2 | rig-adult-female-locomotion | teal-rig-walk-e |
| teal-rig-walk-e-3 | rig-adult-female-locomotion | teal-rig-walk-e |
| teal-rig-walk-e-4 | rig-adult-female-locomotion | teal-rig-walk-e |
| teal-rig-walk-s-1 | rig-adult-female-locomotion | teal-rig-walk-s |
| teal-rig-walk-s-2 | rig-adult-female-locomotion | teal-rig-walk-s |
| teal-rig-walk-n-1 | rig-adult-female-locomotion | teal-rig-walk-n |
| teal-rig-walk-n-2 | rig-adult-female-locomotion | teal-rig-walk-n |
| teal-rig-dig-1 | rig-adult-female-work | teal-rig-dig |
| teal-rig-dig-2 | rig-adult-female-work | teal-rig-dig |
| teal-rig-hoe-1 | rig-adult-female-work | teal-rig-hoe |
| teal-rig-hoe-2 | rig-adult-female-work | teal-rig-hoe |
| teal-rig-chop-1 | rig-adult-female-work | teal-rig-chop |
| teal-rig-chop-2 | rig-adult-female-work | teal-rig-chop |
| teal-rig-hammer-1 | rig-adult-female-work | teal-rig-hammer |
| teal-rig-hammer-2 | rig-adult-female-work | teal-rig-hammer |
| teal-rig-carry-1 | rig-adult-female-work | teal-rig-carry |
| teal-rig-carry-2 | rig-adult-female-work | teal-rig-carry |
| teal-rig-trade-1 | rig-adult-female-work | teal-rig-trade |
| teal-rig-trade-2 | rig-adult-female-work | teal-rig-trade |
| teal-rig-care-1 | rig-adult-female-work | teal-rig-care |
| teal-rig-care-2 | rig-adult-female-work | teal-rig-care |
| teal-rig-search-1 | rig-adult-female-work | teal-rig-search |
| teal-rig-search-2 | rig-adult-female-work | teal-rig-search |
| teal-rig-aim | rig-adult-female-service | teal-rig-fire-reload |
| teal-rig-fire | rig-adult-female-service | teal-rig-fire-reload |
| teal-rig-load | rig-adult-female-service | teal-rig-fire-reload |
| teal-rig-ramrod | rig-adult-female-service | teal-rig-fire-reload |
| teal-rig-horse-e-1 | rig-adult-female-service | State artwork; no motion required |
| teal-rig-horse-e-2 | rig-adult-female-service | State artwork; no motion required |
| teal-rig-passenger-e-1 | rig-adult-female-service | teal-rig-passenger-e |
| teal-rig-passenger-e-2 | rig-adult-female-service | teal-rig-passenger-e |
| teal-rig-passenger-s-1 | rig-adult-female-service | teal-rig-passenger-s |
| teal-rig-passenger-s-2 | rig-adult-female-service | teal-rig-passenger-s |
| teal-rig-passenger-n-1 | rig-adult-female-service | teal-rig-passenger-n |
| teal-rig-passenger-n-2 | rig-adult-female-service | teal-rig-passenger-n |
| teal-rig-wounded-1 | rig-adult-female-service | teal-rig-wounded |
| teal-rig-wounded-2 | rig-adult-female-service | teal-rig-wounded |
| teal-rig-fall | rig-adult-female-service | State artwork; no motion required |
| teal-rig-still | rig-adult-female-service | State artwork; no motion required |
| teal-rig-saddle-e-1 | rig-adult-female-saddle | teal-rig-saddle-e |
| teal-rig-saddle-e-2 | rig-adult-female-saddle | teal-rig-saddle-e |
| teal-rig-saddle-wounded-e-1 | rig-adult-female-saddle | teal-rig-saddle-wounded-e |
| teal-rig-saddle-wounded-e-2 | rig-adult-female-saddle | teal-rig-saddle-wounded-e |
| teal-rig-saddle-s-1 | rig-adult-female-saddle | teal-rig-saddle-s |
| teal-rig-saddle-s-2 | rig-adult-female-saddle | teal-rig-saddle-s |
| teal-rig-saddle-wounded-s-1 | rig-adult-female-saddle | teal-rig-saddle-wounded-s |
| teal-rig-saddle-wounded-s-2 | rig-adult-female-saddle | teal-rig-saddle-wounded-s |
| teal-rig-saddle-n-1 | rig-adult-female-saddle | teal-rig-saddle-n |
| teal-rig-saddle-n-2 | rig-adult-female-saddle | teal-rig-saddle-n |
| teal-rig-saddle-wounded-n-1 | rig-adult-female-saddle | teal-rig-saddle-wounded-n |
| teal-rig-saddle-wounded-n-2 | rig-adult-female-saddle | teal-rig-saddle-wounded-n |
| teal-rig-covered-1 | rig-covered-patients | teal-rig-covered |
| teal-rig-covered-2 | rig-covered-patients | teal-rig-covered |
| teal-rig-camp-rest-1 | rig-camp-grown | teal-rig-camp-rest |
| teal-rig-camp-rest-2 | rig-camp-grown | teal-rig-camp-rest |
| teal-rig-camp-sleep-1 | rig-camp-grown | teal-rig-camp-sleep |
| teal-rig-camp-sleep-2 | rig-camp-grown | teal-rig-camp-sleep |
| teal-rig-mounted-e-aim | rig-adult-female-mounted-service | teal-rig-mounted-fire-e |
| teal-rig-mounted-e-fire | rig-adult-female-mounted-service | teal-rig-mounted-fire-e |
| teal-rig-mounted-e-load | rig-adult-female-mounted-service | teal-rig-mounted-fire-e |
| teal-rig-mounted-e-ramrod | rig-adult-female-mounted-service | teal-rig-mounted-fire-e |
| teal-rig-mounted-s-aim | rig-adult-female-mounted-service | teal-rig-mounted-fire-s |
| teal-rig-mounted-s-fire | rig-adult-female-mounted-service | teal-rig-mounted-fire-s |
| teal-rig-mounted-s-load | rig-adult-female-mounted-service | teal-rig-mounted-fire-s |
| teal-rig-mounted-s-ramrod | rig-adult-female-mounted-service | teal-rig-mounted-fire-s |
| teal-rig-mounted-n-aim | rig-adult-female-mounted-service | teal-rig-mounted-fire-n |
| teal-rig-mounted-n-fire | rig-adult-female-mounted-service | teal-rig-mounted-fire-n |
| teal-rig-mounted-n-load | rig-adult-female-mounted-service | teal-rig-mounted-fire-n |
| teal-rig-mounted-n-ramrod | rig-adult-female-mounted-service | teal-rig-mounted-fire-n |
| teal-rig-surrender-1 | rig-capture-poses | teal-rig-surrender |
| teal-rig-surrender-2 | rig-capture-poses | teal-rig-surrender |
| teal-rig-sow-1 | rig-sow-poses | teal-rig-sow |
| teal-rig-sow-2 | rig-sow-poses | teal-rig-sow |
| teal-rig-harvest-1 | rig-harvest-poses | teal-rig-harvest |
| teal-rig-harvest-2 | rig-harvest-poses | teal-rig-harvest |
| rust-woman-rig-idle-s | rig-adult-female-locomotion | rust-woman-rig-idle-s |
| rust-woman-rig-idle-e | rig-adult-female-locomotion | rust-woman-rig-idle-e |
| rust-woman-rig-idle-n | rig-adult-female-locomotion | rust-woman-rig-idle-n |
| rust-woman-rig-idle-w | rig-adult-female-locomotion | rust-woman-rig-idle-w |
| rust-woman-rig-walk-e-1 | rig-adult-female-locomotion | rust-woman-rig-walk-e |
| rust-woman-rig-walk-e-2 | rig-adult-female-locomotion | rust-woman-rig-walk-e |
| rust-woman-rig-walk-e-3 | rig-adult-female-locomotion | rust-woman-rig-walk-e |
| rust-woman-rig-walk-e-4 | rig-adult-female-locomotion | rust-woman-rig-walk-e |
| rust-woman-rig-walk-s-1 | rig-adult-female-locomotion | rust-woman-rig-walk-s |
| rust-woman-rig-walk-s-2 | rig-adult-female-locomotion | rust-woman-rig-walk-s |
| rust-woman-rig-walk-n-1 | rig-adult-female-locomotion | rust-woman-rig-walk-n |
| rust-woman-rig-walk-n-2 | rig-adult-female-locomotion | rust-woman-rig-walk-n |
| rust-woman-rig-dig-1 | rig-adult-female-work | rust-woman-rig-dig |
| rust-woman-rig-dig-2 | rig-adult-female-work | rust-woman-rig-dig |
| rust-woman-rig-hoe-1 | rig-adult-female-work | rust-woman-rig-hoe |
| rust-woman-rig-hoe-2 | rig-adult-female-work | rust-woman-rig-hoe |
| rust-woman-rig-chop-1 | rig-adult-female-work | rust-woman-rig-chop |
| rust-woman-rig-chop-2 | rig-adult-female-work | rust-woman-rig-chop |
| rust-woman-rig-hammer-1 | rig-adult-female-work | rust-woman-rig-hammer |
| rust-woman-rig-hammer-2 | rig-adult-female-work | rust-woman-rig-hammer |
| rust-woman-rig-carry-1 | rig-adult-female-work | rust-woman-rig-carry |
| rust-woman-rig-carry-2 | rig-adult-female-work | rust-woman-rig-carry |
| rust-woman-rig-trade-1 | rig-adult-female-work | rust-woman-rig-trade |
| rust-woman-rig-trade-2 | rig-adult-female-work | rust-woman-rig-trade |
| rust-woman-rig-care-1 | rig-adult-female-work | rust-woman-rig-care |
| rust-woman-rig-care-2 | rig-adult-female-work | rust-woman-rig-care |
| rust-woman-rig-search-1 | rig-adult-female-work | rust-woman-rig-search |
| rust-woman-rig-search-2 | rig-adult-female-work | rust-woman-rig-search |
| rust-woman-rig-aim | rig-adult-female-service | rust-woman-rig-fire-reload |
| rust-woman-rig-fire | rig-adult-female-service | rust-woman-rig-fire-reload |
| rust-woman-rig-load | rig-adult-female-service | rust-woman-rig-fire-reload |
| rust-woman-rig-ramrod | rig-adult-female-service | rust-woman-rig-fire-reload |
| rust-woman-rig-horse-e-1 | rig-adult-female-service | State artwork; no motion required |
| rust-woman-rig-horse-e-2 | rig-adult-female-service | State artwork; no motion required |
| rust-woman-rig-passenger-e-1 | rig-adult-female-service | rust-woman-rig-passenger-e |
| rust-woman-rig-passenger-e-2 | rig-adult-female-service | rust-woman-rig-passenger-e |
| rust-woman-rig-passenger-s-1 | rig-adult-female-service | rust-woman-rig-passenger-s |
| rust-woman-rig-passenger-s-2 | rig-adult-female-service | rust-woman-rig-passenger-s |
| rust-woman-rig-passenger-n-1 | rig-adult-female-service | rust-woman-rig-passenger-n |
| rust-woman-rig-passenger-n-2 | rig-adult-female-service | rust-woman-rig-passenger-n |
| rust-woman-rig-wounded-1 | rig-adult-female-service | rust-woman-rig-wounded |
| rust-woman-rig-wounded-2 | rig-adult-female-service | rust-woman-rig-wounded |
| rust-woman-rig-fall | rig-adult-female-service | State artwork; no motion required |
| rust-woman-rig-still | rig-adult-female-service | State artwork; no motion required |
| rust-woman-rig-saddle-e-1 | rig-adult-female-saddle | rust-woman-rig-saddle-e |
| rust-woman-rig-saddle-e-2 | rig-adult-female-saddle | rust-woman-rig-saddle-e |
| rust-woman-rig-saddle-wounded-e-1 | rig-adult-female-saddle | rust-woman-rig-saddle-wounded-e |
| rust-woman-rig-saddle-wounded-e-2 | rig-adult-female-saddle | rust-woman-rig-saddle-wounded-e |
| rust-woman-rig-saddle-s-1 | rig-adult-female-saddle | rust-woman-rig-saddle-s |
| rust-woman-rig-saddle-s-2 | rig-adult-female-saddle | rust-woman-rig-saddle-s |
| rust-woman-rig-saddle-wounded-s-1 | rig-adult-female-saddle | rust-woman-rig-saddle-wounded-s |
| rust-woman-rig-saddle-wounded-s-2 | rig-adult-female-saddle | rust-woman-rig-saddle-wounded-s |
| rust-woman-rig-saddle-n-1 | rig-adult-female-saddle | rust-woman-rig-saddle-n |
| rust-woman-rig-saddle-n-2 | rig-adult-female-saddle | rust-woman-rig-saddle-n |
| rust-woman-rig-saddle-wounded-n-1 | rig-adult-female-saddle | rust-woman-rig-saddle-wounded-n |
| rust-woman-rig-saddle-wounded-n-2 | rig-adult-female-saddle | rust-woman-rig-saddle-wounded-n |
| rust-woman-rig-covered-1 | rig-covered-patients | rust-woman-rig-covered |
| rust-woman-rig-covered-2 | rig-covered-patients | rust-woman-rig-covered |
| rust-woman-rig-camp-rest-1 | rig-camp-grown | rust-woman-rig-camp-rest |
| rust-woman-rig-camp-rest-2 | rig-camp-grown | rust-woman-rig-camp-rest |
| rust-woman-rig-camp-sleep-1 | rig-camp-grown | rust-woman-rig-camp-sleep |
| rust-woman-rig-camp-sleep-2 | rig-camp-grown | rust-woman-rig-camp-sleep |
| rust-woman-rig-mounted-e-aim | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-e |
| rust-woman-rig-mounted-e-fire | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-e |
| rust-woman-rig-mounted-e-load | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-e |
| rust-woman-rig-mounted-e-ramrod | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-e |
| rust-woman-rig-mounted-s-aim | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-s |
| rust-woman-rig-mounted-s-fire | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-s |
| rust-woman-rig-mounted-s-load | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-s |
| rust-woman-rig-mounted-s-ramrod | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-s |
| rust-woman-rig-mounted-n-aim | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-n |
| rust-woman-rig-mounted-n-fire | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-n |
| rust-woman-rig-mounted-n-load | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-n |
| rust-woman-rig-mounted-n-ramrod | rig-adult-female-mounted-service | rust-woman-rig-mounted-fire-n |
| rust-woman-rig-surrender-1 | rig-capture-poses | rust-woman-rig-surrender |
| rust-woman-rig-surrender-2 | rig-capture-poses | rust-woman-rig-surrender |
| rust-woman-rig-sow-1 | rig-sow-poses | rust-woman-rig-sow |
| rust-woman-rig-sow-2 | rig-sow-poses | rust-woman-rig-sow |
| rust-woman-rig-harvest-1 | rig-harvest-poses | rust-woman-rig-harvest |
| rust-woman-rig-harvest-2 | rig-harvest-poses | rust-woman-rig-harvest |
| indigo-rig-idle-s | rig-adult-female-locomotion | indigo-rig-idle-s |
| indigo-rig-idle-e | rig-adult-female-locomotion | indigo-rig-idle-e |
| indigo-rig-idle-n | rig-adult-female-locomotion | indigo-rig-idle-n |
| indigo-rig-idle-w | rig-adult-female-locomotion | indigo-rig-idle-w |
| indigo-rig-walk-e-1 | rig-adult-female-locomotion | indigo-rig-walk-e |
| indigo-rig-walk-e-2 | rig-adult-female-locomotion | indigo-rig-walk-e |
| indigo-rig-walk-e-3 | rig-adult-female-locomotion | indigo-rig-walk-e |
| indigo-rig-walk-e-4 | rig-adult-female-locomotion | indigo-rig-walk-e |
| indigo-rig-walk-s-1 | rig-adult-female-locomotion | indigo-rig-walk-s |
| indigo-rig-walk-s-2 | rig-adult-female-locomotion | indigo-rig-walk-s |
| indigo-rig-walk-n-1 | rig-adult-female-locomotion | indigo-rig-walk-n |
| indigo-rig-walk-n-2 | rig-adult-female-locomotion | indigo-rig-walk-n |
| indigo-rig-dig-1 | rig-adult-female-work | indigo-rig-dig |
| indigo-rig-dig-2 | rig-adult-female-work | indigo-rig-dig |
| indigo-rig-hoe-1 | rig-adult-female-work | indigo-rig-hoe |
| indigo-rig-hoe-2 | rig-adult-female-work | indigo-rig-hoe |
| indigo-rig-chop-1 | rig-adult-female-work | indigo-rig-chop |
| indigo-rig-chop-2 | rig-adult-female-work | indigo-rig-chop |
| indigo-rig-hammer-1 | rig-adult-female-work | indigo-rig-hammer |
| indigo-rig-hammer-2 | rig-adult-female-work | indigo-rig-hammer |
| indigo-rig-carry-1 | rig-adult-female-work | indigo-rig-carry |
| indigo-rig-carry-2 | rig-adult-female-work | indigo-rig-carry |
| indigo-rig-trade-1 | rig-adult-female-work | indigo-rig-trade |
| indigo-rig-trade-2 | rig-adult-female-work | indigo-rig-trade |
| indigo-rig-care-1 | rig-adult-female-work | indigo-rig-care |
| indigo-rig-care-2 | rig-adult-female-work | indigo-rig-care |
| indigo-rig-search-1 | rig-adult-female-work | indigo-rig-search |
| indigo-rig-search-2 | rig-adult-female-work | indigo-rig-search |
| indigo-rig-aim | rig-adult-female-service | indigo-rig-fire-reload |
| indigo-rig-fire | rig-adult-female-service | indigo-rig-fire-reload |
| indigo-rig-load | rig-adult-female-service | indigo-rig-fire-reload |
| indigo-rig-ramrod | rig-adult-female-service | indigo-rig-fire-reload |
| indigo-rig-horse-e-1 | rig-adult-female-service | State artwork; no motion required |
| indigo-rig-horse-e-2 | rig-adult-female-service | State artwork; no motion required |
| indigo-rig-passenger-e-1 | rig-adult-female-service | indigo-rig-passenger-e |
| indigo-rig-passenger-e-2 | rig-adult-female-service | indigo-rig-passenger-e |
| indigo-rig-passenger-s-1 | rig-adult-female-service | indigo-rig-passenger-s |
| indigo-rig-passenger-s-2 | rig-adult-female-service | indigo-rig-passenger-s |
| indigo-rig-passenger-n-1 | rig-adult-female-service | indigo-rig-passenger-n |
| indigo-rig-passenger-n-2 | rig-adult-female-service | indigo-rig-passenger-n |
| indigo-rig-wounded-1 | rig-adult-female-service | indigo-rig-wounded |
| indigo-rig-wounded-2 | rig-adult-female-service | indigo-rig-wounded |
| indigo-rig-fall | rig-adult-female-service | State artwork; no motion required |
| indigo-rig-still | rig-adult-female-service | State artwork; no motion required |
| indigo-rig-saddle-e-1 | rig-adult-female-saddle | indigo-rig-saddle-e |
| indigo-rig-saddle-e-2 | rig-adult-female-saddle | indigo-rig-saddle-e |
| indigo-rig-saddle-wounded-e-1 | rig-adult-female-saddle | indigo-rig-saddle-wounded-e |
| indigo-rig-saddle-wounded-e-2 | rig-adult-female-saddle | indigo-rig-saddle-wounded-e |
| indigo-rig-saddle-s-1 | rig-adult-female-saddle | indigo-rig-saddle-s |
| indigo-rig-saddle-s-2 | rig-adult-female-saddle | indigo-rig-saddle-s |
| indigo-rig-saddle-wounded-s-1 | rig-adult-female-saddle | indigo-rig-saddle-wounded-s |
| indigo-rig-saddle-wounded-s-2 | rig-adult-female-saddle | indigo-rig-saddle-wounded-s |
| indigo-rig-saddle-n-1 | rig-adult-female-saddle | indigo-rig-saddle-n |
| indigo-rig-saddle-n-2 | rig-adult-female-saddle | indigo-rig-saddle-n |
| indigo-rig-saddle-wounded-n-1 | rig-adult-female-saddle | indigo-rig-saddle-wounded-n |
| indigo-rig-saddle-wounded-n-2 | rig-adult-female-saddle | indigo-rig-saddle-wounded-n |
| indigo-rig-covered-1 | rig-covered-patients | indigo-rig-covered |
| indigo-rig-covered-2 | rig-covered-patients | indigo-rig-covered |
| indigo-rig-camp-rest-1 | rig-camp-grown | indigo-rig-camp-rest |
| indigo-rig-camp-rest-2 | rig-camp-grown | indigo-rig-camp-rest |
| indigo-rig-camp-sleep-1 | rig-camp-grown | indigo-rig-camp-sleep |
| indigo-rig-camp-sleep-2 | rig-camp-grown | indigo-rig-camp-sleep |
| indigo-rig-mounted-e-aim | rig-adult-female-mounted-service | indigo-rig-mounted-fire-e |
| indigo-rig-mounted-e-fire | rig-adult-female-mounted-service | indigo-rig-mounted-fire-e |
| indigo-rig-mounted-e-load | rig-adult-female-mounted-service | indigo-rig-mounted-fire-e |
| indigo-rig-mounted-e-ramrod | rig-adult-female-mounted-service | indigo-rig-mounted-fire-e |
| indigo-rig-mounted-s-aim | rig-adult-female-mounted-service | indigo-rig-mounted-fire-s |
| indigo-rig-mounted-s-fire | rig-adult-female-mounted-service | indigo-rig-mounted-fire-s |
| indigo-rig-mounted-s-load | rig-adult-female-mounted-service | indigo-rig-mounted-fire-s |
| indigo-rig-mounted-s-ramrod | rig-adult-female-mounted-service | indigo-rig-mounted-fire-s |
| indigo-rig-mounted-n-aim | rig-adult-female-mounted-service | indigo-rig-mounted-fire-n |
| indigo-rig-mounted-n-fire | rig-adult-female-mounted-service | indigo-rig-mounted-fire-n |
| indigo-rig-mounted-n-load | rig-adult-female-mounted-service | indigo-rig-mounted-fire-n |
| indigo-rig-mounted-n-ramrod | rig-adult-female-mounted-service | indigo-rig-mounted-fire-n |
| indigo-rig-surrender-1 | rig-capture-poses | indigo-rig-surrender |
| indigo-rig-surrender-2 | rig-capture-poses | indigo-rig-surrender |
| indigo-rig-sow-1 | rig-sow-poses | indigo-rig-sow |
| indigo-rig-sow-2 | rig-sow-poses | indigo-rig-sow |
| indigo-rig-harvest-1 | rig-harvest-poses | indigo-rig-harvest |
| indigo-rig-harvest-2 | rig-harvest-poses | indigo-rig-harvest |
| mother-braid-rig-idle-s | rig-adult-female-locomotion | mother-braid-rig-idle-s |
| mother-braid-rig-idle-e | rig-adult-female-locomotion | mother-braid-rig-idle-e |
| mother-braid-rig-idle-n | rig-adult-female-locomotion | mother-braid-rig-idle-n |
| mother-braid-rig-idle-w | rig-adult-female-locomotion | mother-braid-rig-idle-w |
| mother-braid-rig-walk-e-1 | rig-adult-female-locomotion | mother-braid-rig-walk-e |
| mother-braid-rig-walk-e-2 | rig-adult-female-locomotion | mother-braid-rig-walk-e |
| mother-braid-rig-walk-e-3 | rig-adult-female-locomotion | mother-braid-rig-walk-e |
| mother-braid-rig-walk-e-4 | rig-adult-female-locomotion | mother-braid-rig-walk-e |
| mother-braid-rig-walk-s-1 | rig-adult-female-locomotion | mother-braid-rig-walk-s |
| mother-braid-rig-walk-s-2 | rig-adult-female-locomotion | mother-braid-rig-walk-s |
| mother-braid-rig-walk-n-1 | rig-adult-female-locomotion | mother-braid-rig-walk-n |
| mother-braid-rig-walk-n-2 | rig-adult-female-locomotion | mother-braid-rig-walk-n |
| mother-braid-rig-dig-1 | rig-adult-female-work | mother-braid-rig-dig |
| mother-braid-rig-dig-2 | rig-adult-female-work | mother-braid-rig-dig |
| mother-braid-rig-hoe-1 | rig-adult-female-work | mother-braid-rig-hoe |
| mother-braid-rig-hoe-2 | rig-adult-female-work | mother-braid-rig-hoe |
| mother-braid-rig-chop-1 | rig-adult-female-work | mother-braid-rig-chop |
| mother-braid-rig-chop-2 | rig-adult-female-work | mother-braid-rig-chop |
| mother-braid-rig-hammer-1 | rig-adult-female-work | mother-braid-rig-hammer |
| mother-braid-rig-hammer-2 | rig-adult-female-work | mother-braid-rig-hammer |
| mother-braid-rig-carry-1 | rig-adult-female-work | mother-braid-rig-carry |
| mother-braid-rig-carry-2 | rig-adult-female-work | mother-braid-rig-carry |
| mother-braid-rig-trade-1 | rig-adult-female-work | mother-braid-rig-trade |
| mother-braid-rig-trade-2 | rig-adult-female-work | mother-braid-rig-trade |
| mother-braid-rig-care-1 | rig-adult-female-work | mother-braid-rig-care |
| mother-braid-rig-care-2 | rig-adult-female-work | mother-braid-rig-care |
| mother-braid-rig-search-1 | rig-adult-female-work | mother-braid-rig-search |
| mother-braid-rig-search-2 | rig-adult-female-work | mother-braid-rig-search |
| mother-braid-rig-aim | rig-adult-female-service | mother-braid-rig-fire-reload |
| mother-braid-rig-fire | rig-adult-female-service | mother-braid-rig-fire-reload |
| mother-braid-rig-load | rig-adult-female-service | mother-braid-rig-fire-reload |
| mother-braid-rig-ramrod | rig-adult-female-service | mother-braid-rig-fire-reload |
| mother-braid-rig-horse-e-1 | rig-adult-female-service | State artwork; no motion required |
| mother-braid-rig-horse-e-2 | rig-adult-female-service | State artwork; no motion required |
| mother-braid-rig-passenger-e-1 | rig-adult-female-service | mother-braid-rig-passenger-e |
| mother-braid-rig-passenger-e-2 | rig-adult-female-service | mother-braid-rig-passenger-e |
| mother-braid-rig-passenger-s-1 | rig-adult-female-service | mother-braid-rig-passenger-s |
| mother-braid-rig-passenger-s-2 | rig-adult-female-service | mother-braid-rig-passenger-s |
| mother-braid-rig-passenger-n-1 | rig-adult-female-service | mother-braid-rig-passenger-n |
| mother-braid-rig-passenger-n-2 | rig-adult-female-service | mother-braid-rig-passenger-n |
| mother-braid-rig-wounded-1 | rig-adult-female-service | mother-braid-rig-wounded |
| mother-braid-rig-wounded-2 | rig-adult-female-service | mother-braid-rig-wounded |
| mother-braid-rig-fall | rig-adult-female-service | State artwork; no motion required |
| mother-braid-rig-still | rig-adult-female-service | State artwork; no motion required |
| mother-braid-rig-saddle-e-1 | rig-adult-female-saddle | mother-braid-rig-saddle-e |
| mother-braid-rig-saddle-e-2 | rig-adult-female-saddle | mother-braid-rig-saddle-e |
| mother-braid-rig-saddle-wounded-e-1 | rig-adult-female-saddle | mother-braid-rig-saddle-wounded-e |
| mother-braid-rig-saddle-wounded-e-2 | rig-adult-female-saddle | mother-braid-rig-saddle-wounded-e |
| mother-braid-rig-saddle-s-1 | rig-adult-female-saddle | mother-braid-rig-saddle-s |
| mother-braid-rig-saddle-s-2 | rig-adult-female-saddle | mother-braid-rig-saddle-s |
| mother-braid-rig-saddle-wounded-s-1 | rig-adult-female-saddle | mother-braid-rig-saddle-wounded-s |
| mother-braid-rig-saddle-wounded-s-2 | rig-adult-female-saddle | mother-braid-rig-saddle-wounded-s |
| mother-braid-rig-saddle-n-1 | rig-adult-female-saddle | mother-braid-rig-saddle-n |
| mother-braid-rig-saddle-n-2 | rig-adult-female-saddle | mother-braid-rig-saddle-n |
| mother-braid-rig-saddle-wounded-n-1 | rig-adult-female-saddle | mother-braid-rig-saddle-wounded-n |
| mother-braid-rig-saddle-wounded-n-2 | rig-adult-female-saddle | mother-braid-rig-saddle-wounded-n |
| mother-braid-rig-covered-1 | rig-covered-patients | mother-braid-rig-covered |
| mother-braid-rig-covered-2 | rig-covered-patients | mother-braid-rig-covered |
| mother-braid-rig-camp-rest-1 | rig-camp-grown | mother-braid-rig-camp-rest |
| mother-braid-rig-camp-rest-2 | rig-camp-grown | mother-braid-rig-camp-rest |
| mother-braid-rig-camp-sleep-1 | rig-camp-grown | mother-braid-rig-camp-sleep |
| mother-braid-rig-camp-sleep-2 | rig-camp-grown | mother-braid-rig-camp-sleep |
| mother-braid-rig-mounted-e-aim | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-e |
| mother-braid-rig-mounted-e-fire | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-e |
| mother-braid-rig-mounted-e-load | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-e |
| mother-braid-rig-mounted-e-ramrod | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-e |
| mother-braid-rig-mounted-s-aim | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-s |
| mother-braid-rig-mounted-s-fire | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-s |
| mother-braid-rig-mounted-s-load | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-s |
| mother-braid-rig-mounted-s-ramrod | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-s |
| mother-braid-rig-mounted-n-aim | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-n |
| mother-braid-rig-mounted-n-fire | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-n |
| mother-braid-rig-mounted-n-load | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-n |
| mother-braid-rig-mounted-n-ramrod | rig-adult-female-mounted-service | mother-braid-rig-mounted-fire-n |
| mother-braid-rig-surrender-1 | rig-capture-poses | mother-braid-rig-surrender |
| mother-braid-rig-surrender-2 | rig-capture-poses | mother-braid-rig-surrender |
| mother-braid-rig-sow-1 | rig-sow-poses | mother-braid-rig-sow |
| mother-braid-rig-sow-2 | rig-sow-poses | mother-braid-rig-sow |
| mother-braid-rig-harvest-1 | rig-harvest-poses | mother-braid-rig-harvest |
| mother-braid-rig-harvest-2 | rig-harvest-poses | mother-braid-rig-harvest |
| mother-loose-rig-idle-s | rig-adult-female-locomotion | mother-loose-rig-idle-s |
| mother-loose-rig-idle-e | rig-adult-female-locomotion | mother-loose-rig-idle-e |
| mother-loose-rig-idle-n | rig-adult-female-locomotion | mother-loose-rig-idle-n |
| mother-loose-rig-idle-w | rig-adult-female-locomotion | mother-loose-rig-idle-w |
| mother-loose-rig-walk-e-1 | rig-adult-female-locomotion | mother-loose-rig-walk-e |
| mother-loose-rig-walk-e-2 | rig-adult-female-locomotion | mother-loose-rig-walk-e |
| mother-loose-rig-walk-e-3 | rig-adult-female-locomotion | mother-loose-rig-walk-e |
| mother-loose-rig-walk-e-4 | rig-adult-female-locomotion | mother-loose-rig-walk-e |
| mother-loose-rig-walk-s-1 | rig-adult-female-locomotion | mother-loose-rig-walk-s |
| mother-loose-rig-walk-s-2 | rig-adult-female-locomotion | mother-loose-rig-walk-s |
| mother-loose-rig-walk-n-1 | rig-adult-female-locomotion | mother-loose-rig-walk-n |
| mother-loose-rig-walk-n-2 | rig-adult-female-locomotion | mother-loose-rig-walk-n |
| mother-loose-rig-dig-1 | rig-adult-female-work | mother-loose-rig-dig |
| mother-loose-rig-dig-2 | rig-adult-female-work | mother-loose-rig-dig |
| mother-loose-rig-hoe-1 | rig-adult-female-work | mother-loose-rig-hoe |
| mother-loose-rig-hoe-2 | rig-adult-female-work | mother-loose-rig-hoe |
| mother-loose-rig-chop-1 | rig-adult-female-work | mother-loose-rig-chop |
| mother-loose-rig-chop-2 | rig-adult-female-work | mother-loose-rig-chop |
| mother-loose-rig-hammer-1 | rig-adult-female-work | mother-loose-rig-hammer |
| mother-loose-rig-hammer-2 | rig-adult-female-work | mother-loose-rig-hammer |
| mother-loose-rig-carry-1 | rig-adult-female-work | mother-loose-rig-carry |
| mother-loose-rig-carry-2 | rig-adult-female-work | mother-loose-rig-carry |
| mother-loose-rig-trade-1 | rig-adult-female-work | mother-loose-rig-trade |
| mother-loose-rig-trade-2 | rig-adult-female-work | mother-loose-rig-trade |
| mother-loose-rig-care-1 | rig-adult-female-work | mother-loose-rig-care |
| mother-loose-rig-care-2 | rig-adult-female-work | mother-loose-rig-care |
| mother-loose-rig-search-1 | rig-adult-female-work | mother-loose-rig-search |
| mother-loose-rig-search-2 | rig-adult-female-work | mother-loose-rig-search |
| mother-loose-rig-aim | rig-adult-female-service | mother-loose-rig-fire-reload |
| mother-loose-rig-fire | rig-adult-female-service | mother-loose-rig-fire-reload |
| mother-loose-rig-load | rig-adult-female-service | mother-loose-rig-fire-reload |
| mother-loose-rig-ramrod | rig-adult-female-service | mother-loose-rig-fire-reload |
| mother-loose-rig-horse-e-1 | rig-adult-female-service | State artwork; no motion required |
| mother-loose-rig-horse-e-2 | rig-adult-female-service | State artwork; no motion required |
| mother-loose-rig-passenger-e-1 | rig-adult-female-service | mother-loose-rig-passenger-e |
| mother-loose-rig-passenger-e-2 | rig-adult-female-service | mother-loose-rig-passenger-e |
| mother-loose-rig-passenger-s-1 | rig-adult-female-service | mother-loose-rig-passenger-s |
| mother-loose-rig-passenger-s-2 | rig-adult-female-service | mother-loose-rig-passenger-s |
| mother-loose-rig-passenger-n-1 | rig-adult-female-service | mother-loose-rig-passenger-n |
| mother-loose-rig-passenger-n-2 | rig-adult-female-service | mother-loose-rig-passenger-n |
| mother-loose-rig-wounded-1 | rig-adult-female-service | mother-loose-rig-wounded |
| mother-loose-rig-wounded-2 | rig-adult-female-service | mother-loose-rig-wounded |
| mother-loose-rig-fall | rig-adult-female-service | State artwork; no motion required |
| mother-loose-rig-still | rig-adult-female-service | State artwork; no motion required |
| mother-loose-rig-saddle-e-1 | rig-adult-female-saddle | mother-loose-rig-saddle-e |
| mother-loose-rig-saddle-e-2 | rig-adult-female-saddle | mother-loose-rig-saddle-e |
| mother-loose-rig-saddle-wounded-e-1 | rig-adult-female-saddle | mother-loose-rig-saddle-wounded-e |
| mother-loose-rig-saddle-wounded-e-2 | rig-adult-female-saddle | mother-loose-rig-saddle-wounded-e |
| mother-loose-rig-saddle-s-1 | rig-adult-female-saddle | mother-loose-rig-saddle-s |
| mother-loose-rig-saddle-s-2 | rig-adult-female-saddle | mother-loose-rig-saddle-s |
| mother-loose-rig-saddle-wounded-s-1 | rig-adult-female-saddle | mother-loose-rig-saddle-wounded-s |
| mother-loose-rig-saddle-wounded-s-2 | rig-adult-female-saddle | mother-loose-rig-saddle-wounded-s |
| mother-loose-rig-saddle-n-1 | rig-adult-female-saddle | mother-loose-rig-saddle-n |
| mother-loose-rig-saddle-n-2 | rig-adult-female-saddle | mother-loose-rig-saddle-n |
| mother-loose-rig-saddle-wounded-n-1 | rig-adult-female-saddle | mother-loose-rig-saddle-wounded-n |
| mother-loose-rig-saddle-wounded-n-2 | rig-adult-female-saddle | mother-loose-rig-saddle-wounded-n |
| mother-loose-rig-covered-1 | rig-covered-patients | mother-loose-rig-covered |
| mother-loose-rig-covered-2 | rig-covered-patients | mother-loose-rig-covered |
| mother-loose-rig-camp-rest-1 | rig-camp-grown | mother-loose-rig-camp-rest |
| mother-loose-rig-camp-rest-2 | rig-camp-grown | mother-loose-rig-camp-rest |
| mother-loose-rig-camp-sleep-1 | rig-camp-grown | mother-loose-rig-camp-sleep |
| mother-loose-rig-camp-sleep-2 | rig-camp-grown | mother-loose-rig-camp-sleep |
| mother-loose-rig-mounted-e-aim | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-e |
| mother-loose-rig-mounted-e-fire | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-e |
| mother-loose-rig-mounted-e-load | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-e |
| mother-loose-rig-mounted-e-ramrod | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-e |
| mother-loose-rig-mounted-s-aim | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-s |
| mother-loose-rig-mounted-s-fire | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-s |
| mother-loose-rig-mounted-s-load | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-s |
| mother-loose-rig-mounted-s-ramrod | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-s |
| mother-loose-rig-mounted-n-aim | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-n |
| mother-loose-rig-mounted-n-fire | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-n |
| mother-loose-rig-mounted-n-load | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-n |
| mother-loose-rig-mounted-n-ramrod | rig-adult-female-mounted-service | mother-loose-rig-mounted-fire-n |
| mother-loose-rig-surrender-1 | rig-capture-poses | mother-loose-rig-surrender |
| mother-loose-rig-surrender-2 | rig-capture-poses | mother-loose-rig-surrender |
| mother-loose-rig-sow-1 | rig-sow-poses | mother-loose-rig-sow |
| mother-loose-rig-sow-2 | rig-sow-poses | mother-loose-rig-sow |
| mother-loose-rig-harvest-1 | rig-harvest-poses | mother-loose-rig-harvest |
| mother-loose-rig-harvest-2 | rig-harvest-poses | mother-loose-rig-harvest |
| mother-scarf-rig-idle-s | rig-adult-female-locomotion | mother-scarf-rig-idle-s |
| mother-scarf-rig-idle-e | rig-adult-female-locomotion | mother-scarf-rig-idle-e |
| mother-scarf-rig-idle-n | rig-adult-female-locomotion | mother-scarf-rig-idle-n |
| mother-scarf-rig-idle-w | rig-adult-female-locomotion | mother-scarf-rig-idle-w |
| mother-scarf-rig-walk-e-1 | rig-adult-female-locomotion | mother-scarf-rig-walk-e |
| mother-scarf-rig-walk-e-2 | rig-adult-female-locomotion | mother-scarf-rig-walk-e |
| mother-scarf-rig-walk-e-3 | rig-adult-female-locomotion | mother-scarf-rig-walk-e |
| mother-scarf-rig-walk-e-4 | rig-adult-female-locomotion | mother-scarf-rig-walk-e |
| mother-scarf-rig-walk-s-1 | rig-adult-female-locomotion | mother-scarf-rig-walk-s |
| mother-scarf-rig-walk-s-2 | rig-adult-female-locomotion | mother-scarf-rig-walk-s |
| mother-scarf-rig-walk-n-1 | rig-adult-female-locomotion | mother-scarf-rig-walk-n |
| mother-scarf-rig-walk-n-2 | rig-adult-female-locomotion | mother-scarf-rig-walk-n |
| mother-scarf-rig-dig-1 | rig-adult-female-work | mother-scarf-rig-dig |
| mother-scarf-rig-dig-2 | rig-adult-female-work | mother-scarf-rig-dig |
| mother-scarf-rig-hoe-1 | rig-adult-female-work | mother-scarf-rig-hoe |
| mother-scarf-rig-hoe-2 | rig-adult-female-work | mother-scarf-rig-hoe |
| mother-scarf-rig-chop-1 | rig-adult-female-work | mother-scarf-rig-chop |
| mother-scarf-rig-chop-2 | rig-adult-female-work | mother-scarf-rig-chop |
| mother-scarf-rig-hammer-1 | rig-adult-female-work | mother-scarf-rig-hammer |
| mother-scarf-rig-hammer-2 | rig-adult-female-work | mother-scarf-rig-hammer |
| mother-scarf-rig-carry-1 | rig-adult-female-work | mother-scarf-rig-carry |
| mother-scarf-rig-carry-2 | rig-adult-female-work | mother-scarf-rig-carry |
| mother-scarf-rig-trade-1 | rig-adult-female-work | mother-scarf-rig-trade |
| mother-scarf-rig-trade-2 | rig-adult-female-work | mother-scarf-rig-trade |
| mother-scarf-rig-care-1 | rig-adult-female-work | mother-scarf-rig-care |
| mother-scarf-rig-care-2 | rig-adult-female-work | mother-scarf-rig-care |
| mother-scarf-rig-search-1 | rig-adult-female-work | mother-scarf-rig-search |
| mother-scarf-rig-search-2 | rig-adult-female-work | mother-scarf-rig-search |
| mother-scarf-rig-aim | rig-adult-female-service | mother-scarf-rig-fire-reload |
| mother-scarf-rig-fire | rig-adult-female-service | mother-scarf-rig-fire-reload |
| mother-scarf-rig-load | rig-adult-female-service | mother-scarf-rig-fire-reload |
| mother-scarf-rig-ramrod | rig-adult-female-service | mother-scarf-rig-fire-reload |
| mother-scarf-rig-horse-e-1 | rig-adult-female-service | State artwork; no motion required |
| mother-scarf-rig-horse-e-2 | rig-adult-female-service | State artwork; no motion required |
| mother-scarf-rig-passenger-e-1 | rig-adult-female-service | mother-scarf-rig-passenger-e |
| mother-scarf-rig-passenger-e-2 | rig-adult-female-service | mother-scarf-rig-passenger-e |
| mother-scarf-rig-passenger-s-1 | rig-adult-female-service | mother-scarf-rig-passenger-s |
| mother-scarf-rig-passenger-s-2 | rig-adult-female-service | mother-scarf-rig-passenger-s |
| mother-scarf-rig-passenger-n-1 | rig-adult-female-service | mother-scarf-rig-passenger-n |
| mother-scarf-rig-passenger-n-2 | rig-adult-female-service | mother-scarf-rig-passenger-n |
| mother-scarf-rig-wounded-1 | rig-adult-female-service | mother-scarf-rig-wounded |
| mother-scarf-rig-wounded-2 | rig-adult-female-service | mother-scarf-rig-wounded |
| mother-scarf-rig-fall | rig-adult-female-service | State artwork; no motion required |
| mother-scarf-rig-still | rig-adult-female-service | State artwork; no motion required |
| mother-scarf-rig-saddle-e-1 | rig-adult-female-saddle | mother-scarf-rig-saddle-e |
| mother-scarf-rig-saddle-e-2 | rig-adult-female-saddle | mother-scarf-rig-saddle-e |
| mother-scarf-rig-saddle-wounded-e-1 | rig-adult-female-saddle | mother-scarf-rig-saddle-wounded-e |
| mother-scarf-rig-saddle-wounded-e-2 | rig-adult-female-saddle | mother-scarf-rig-saddle-wounded-e |
| mother-scarf-rig-saddle-s-1 | rig-adult-female-saddle | mother-scarf-rig-saddle-s |
| mother-scarf-rig-saddle-s-2 | rig-adult-female-saddle | mother-scarf-rig-saddle-s |
| mother-scarf-rig-saddle-wounded-s-1 | rig-adult-female-saddle | mother-scarf-rig-saddle-wounded-s |
| mother-scarf-rig-saddle-wounded-s-2 | rig-adult-female-saddle | mother-scarf-rig-saddle-wounded-s |
| mother-scarf-rig-saddle-n-1 | rig-adult-female-saddle | mother-scarf-rig-saddle-n |
| mother-scarf-rig-saddle-n-2 | rig-adult-female-saddle | mother-scarf-rig-saddle-n |
| mother-scarf-rig-saddle-wounded-n-1 | rig-adult-female-saddle | mother-scarf-rig-saddle-wounded-n |
| mother-scarf-rig-saddle-wounded-n-2 | rig-adult-female-saddle | mother-scarf-rig-saddle-wounded-n |
| mother-scarf-rig-covered-1 | rig-covered-patients | mother-scarf-rig-covered |
| mother-scarf-rig-covered-2 | rig-covered-patients | mother-scarf-rig-covered |
| mother-scarf-rig-camp-rest-1 | rig-camp-grown | mother-scarf-rig-camp-rest |
| mother-scarf-rig-camp-rest-2 | rig-camp-grown | mother-scarf-rig-camp-rest |
| mother-scarf-rig-camp-sleep-1 | rig-camp-grown | mother-scarf-rig-camp-sleep |
| mother-scarf-rig-camp-sleep-2 | rig-camp-grown | mother-scarf-rig-camp-sleep |
| mother-scarf-rig-mounted-e-aim | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-e |
| mother-scarf-rig-mounted-e-fire | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-e |
| mother-scarf-rig-mounted-e-load | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-e |
| mother-scarf-rig-mounted-e-ramrod | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-e |
| mother-scarf-rig-mounted-s-aim | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-s |
| mother-scarf-rig-mounted-s-fire | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-s |
| mother-scarf-rig-mounted-s-load | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-s |
| mother-scarf-rig-mounted-s-ramrod | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-s |
| mother-scarf-rig-mounted-n-aim | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-n |
| mother-scarf-rig-mounted-n-fire | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-n |
| mother-scarf-rig-mounted-n-load | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-n |
| mother-scarf-rig-mounted-n-ramrod | rig-adult-female-mounted-service | mother-scarf-rig-mounted-fire-n |
| mother-scarf-rig-surrender-1 | rig-capture-poses | mother-scarf-rig-surrender |
| mother-scarf-rig-surrender-2 | rig-capture-poses | mother-scarf-rig-surrender |
| mother-scarf-rig-sow-1 | rig-sow-poses | mother-scarf-rig-sow |
| mother-scarf-rig-sow-2 | rig-sow-poses | mother-scarf-rig-sow |
| mother-scarf-rig-harvest-1 | rig-harvest-poses | mother-scarf-rig-harvest |
| mother-scarf-rig-harvest-2 | rig-harvest-poses | mother-scarf-rig-harvest |
| mother-straw-rig-idle-s | rig-adult-female-locomotion | mother-straw-rig-idle-s |
| mother-straw-rig-idle-e | rig-adult-female-locomotion | mother-straw-rig-idle-e |
| mother-straw-rig-idle-n | rig-adult-female-locomotion | mother-straw-rig-idle-n |
| mother-straw-rig-idle-w | rig-adult-female-locomotion | mother-straw-rig-idle-w |
| mother-straw-rig-walk-e-1 | rig-adult-female-locomotion | mother-straw-rig-walk-e |
| mother-straw-rig-walk-e-2 | rig-adult-female-locomotion | mother-straw-rig-walk-e |
| mother-straw-rig-walk-e-3 | rig-adult-female-locomotion | mother-straw-rig-walk-e |
| mother-straw-rig-walk-e-4 | rig-adult-female-locomotion | mother-straw-rig-walk-e |
| mother-straw-rig-walk-s-1 | rig-adult-female-locomotion | mother-straw-rig-walk-s |
| mother-straw-rig-walk-s-2 | rig-adult-female-locomotion | mother-straw-rig-walk-s |
| mother-straw-rig-walk-n-1 | rig-adult-female-locomotion | mother-straw-rig-walk-n |
| mother-straw-rig-walk-n-2 | rig-adult-female-locomotion | mother-straw-rig-walk-n |
| mother-straw-rig-dig-1 | rig-adult-female-work | mother-straw-rig-dig |
| mother-straw-rig-dig-2 | rig-adult-female-work | mother-straw-rig-dig |
| mother-straw-rig-hoe-1 | rig-adult-female-work | mother-straw-rig-hoe |
| mother-straw-rig-hoe-2 | rig-adult-female-work | mother-straw-rig-hoe |
| mother-straw-rig-chop-1 | rig-adult-female-work | mother-straw-rig-chop |
| mother-straw-rig-chop-2 | rig-adult-female-work | mother-straw-rig-chop |
| mother-straw-rig-hammer-1 | rig-adult-female-work | mother-straw-rig-hammer |
| mother-straw-rig-hammer-2 | rig-adult-female-work | mother-straw-rig-hammer |
| mother-straw-rig-carry-1 | rig-adult-female-work | mother-straw-rig-carry |
| mother-straw-rig-carry-2 | rig-adult-female-work | mother-straw-rig-carry |
| mother-straw-rig-trade-1 | rig-adult-female-work | mother-straw-rig-trade |
| mother-straw-rig-trade-2 | rig-adult-female-work | mother-straw-rig-trade |
| mother-straw-rig-care-1 | rig-adult-female-work | mother-straw-rig-care |
| mother-straw-rig-care-2 | rig-adult-female-work | mother-straw-rig-care |
| mother-straw-rig-search-1 | rig-adult-female-work | mother-straw-rig-search |
| mother-straw-rig-search-2 | rig-adult-female-work | mother-straw-rig-search |
| mother-straw-rig-aim | rig-adult-female-service | mother-straw-rig-fire-reload |
| mother-straw-rig-fire | rig-adult-female-service | mother-straw-rig-fire-reload |
| mother-straw-rig-load | rig-adult-female-service | mother-straw-rig-fire-reload |
| mother-straw-rig-ramrod | rig-adult-female-service | mother-straw-rig-fire-reload |
| mother-straw-rig-horse-e-1 | rig-adult-female-service | State artwork; no motion required |
| mother-straw-rig-horse-e-2 | rig-adult-female-service | State artwork; no motion required |
| mother-straw-rig-passenger-e-1 | rig-adult-female-service | mother-straw-rig-passenger-e |
| mother-straw-rig-passenger-e-2 | rig-adult-female-service | mother-straw-rig-passenger-e |
| mother-straw-rig-passenger-s-1 | rig-adult-female-service | mother-straw-rig-passenger-s |
| mother-straw-rig-passenger-s-2 | rig-adult-female-service | mother-straw-rig-passenger-s |
| mother-straw-rig-passenger-n-1 | rig-adult-female-service | mother-straw-rig-passenger-n |
| mother-straw-rig-passenger-n-2 | rig-adult-female-service | mother-straw-rig-passenger-n |
| mother-straw-rig-wounded-1 | rig-adult-female-service | mother-straw-rig-wounded |
| mother-straw-rig-wounded-2 | rig-adult-female-service | mother-straw-rig-wounded |
| mother-straw-rig-fall | rig-adult-female-service | State artwork; no motion required |
| mother-straw-rig-still | rig-adult-female-service | State artwork; no motion required |
| mother-straw-rig-saddle-e-1 | rig-adult-female-saddle | mother-straw-rig-saddle-e |
| mother-straw-rig-saddle-e-2 | rig-adult-female-saddle | mother-straw-rig-saddle-e |
| mother-straw-rig-saddle-wounded-e-1 | rig-adult-female-saddle | mother-straw-rig-saddle-wounded-e |
| mother-straw-rig-saddle-wounded-e-2 | rig-adult-female-saddle | mother-straw-rig-saddle-wounded-e |
| mother-straw-rig-saddle-s-1 | rig-adult-female-saddle | mother-straw-rig-saddle-s |
| mother-straw-rig-saddle-s-2 | rig-adult-female-saddle | mother-straw-rig-saddle-s |
| mother-straw-rig-saddle-wounded-s-1 | rig-adult-female-saddle | mother-straw-rig-saddle-wounded-s |
| mother-straw-rig-saddle-wounded-s-2 | rig-adult-female-saddle | mother-straw-rig-saddle-wounded-s |
| mother-straw-rig-saddle-n-1 | rig-adult-female-saddle | mother-straw-rig-saddle-n |
| mother-straw-rig-saddle-n-2 | rig-adult-female-saddle | mother-straw-rig-saddle-n |
| mother-straw-rig-saddle-wounded-n-1 | rig-adult-female-saddle | mother-straw-rig-saddle-wounded-n |
| mother-straw-rig-saddle-wounded-n-2 | rig-adult-female-saddle | mother-straw-rig-saddle-wounded-n |
| mother-straw-rig-covered-1 | rig-covered-patients | mother-straw-rig-covered |
| mother-straw-rig-covered-2 | rig-covered-patients | mother-straw-rig-covered |
| mother-straw-rig-camp-rest-1 | rig-camp-grown | mother-straw-rig-camp-rest |
| mother-straw-rig-camp-rest-2 | rig-camp-grown | mother-straw-rig-camp-rest |
| mother-straw-rig-camp-sleep-1 | rig-camp-grown | mother-straw-rig-camp-sleep |
| mother-straw-rig-camp-sleep-2 | rig-camp-grown | mother-straw-rig-camp-sleep |
| mother-straw-rig-mounted-e-aim | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-e |
| mother-straw-rig-mounted-e-fire | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-e |
| mother-straw-rig-mounted-e-load | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-e |
| mother-straw-rig-mounted-e-ramrod | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-e |
| mother-straw-rig-mounted-s-aim | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-s |
| mother-straw-rig-mounted-s-fire | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-s |
| mother-straw-rig-mounted-s-load | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-s |
| mother-straw-rig-mounted-s-ramrod | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-s |
| mother-straw-rig-mounted-n-aim | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-n |
| mother-straw-rig-mounted-n-fire | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-n |
| mother-straw-rig-mounted-n-load | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-n |
| mother-straw-rig-mounted-n-ramrod | rig-adult-female-mounted-service | mother-straw-rig-mounted-fire-n |
| mother-straw-rig-surrender-1 | rig-capture-poses | mother-straw-rig-surrender |
| mother-straw-rig-surrender-2 | rig-capture-poses | mother-straw-rig-surrender |
| mother-straw-rig-sow-1 | rig-sow-poses | mother-straw-rig-sow |
| mother-straw-rig-sow-2 | rig-sow-poses | mother-straw-rig-sow |
| mother-straw-rig-harvest-1 | rig-harvest-poses | mother-straw-rig-harvest |
| mother-straw-rig-harvest-2 | rig-harvest-poses | mother-straw-rig-harvest |
| blue-rig-idle-s | rig-youth-male-locomotion | blue-rig-idle-s |
| blue-rig-idle-e | rig-youth-male-locomotion | blue-rig-idle-e |
| blue-rig-idle-n | rig-youth-male-locomotion | blue-rig-idle-n |
| blue-rig-idle-w | rig-youth-male-locomotion | blue-rig-idle-w |
| blue-rig-walk-e-1 | rig-youth-male-locomotion | blue-rig-walk-e |
| blue-rig-walk-e-2 | rig-youth-male-locomotion | blue-rig-walk-e |
| blue-rig-walk-e-3 | rig-youth-male-locomotion | blue-rig-walk-e |
| blue-rig-walk-e-4 | rig-youth-male-locomotion | blue-rig-walk-e |
| blue-rig-walk-s-1 | rig-youth-male-locomotion | blue-rig-walk-s |
| blue-rig-walk-s-2 | rig-youth-male-locomotion | blue-rig-walk-s |
| blue-rig-walk-n-1 | rig-youth-male-locomotion | blue-rig-walk-n |
| blue-rig-walk-n-2 | rig-youth-male-locomotion | blue-rig-walk-n |
| blue-rig-dig-1 | rig-youth-male-work | blue-rig-dig |
| blue-rig-dig-2 | rig-youth-male-work | blue-rig-dig |
| blue-rig-hoe-1 | rig-youth-male-work | blue-rig-hoe |
| blue-rig-hoe-2 | rig-youth-male-work | blue-rig-hoe |
| blue-rig-chop-1 | rig-youth-male-work | blue-rig-chop |
| blue-rig-chop-2 | rig-youth-male-work | blue-rig-chop |
| blue-rig-hammer-1 | rig-youth-male-work | blue-rig-hammer |
| blue-rig-hammer-2 | rig-youth-male-work | blue-rig-hammer |
| blue-rig-carry-1 | rig-youth-male-work | blue-rig-carry |
| blue-rig-carry-2 | rig-youth-male-work | blue-rig-carry |
| blue-rig-trade-1 | rig-youth-male-work | blue-rig-trade |
| blue-rig-trade-2 | rig-youth-male-work | blue-rig-trade |
| blue-rig-care-1 | rig-youth-male-work | blue-rig-care |
| blue-rig-care-2 | rig-youth-male-work | blue-rig-care |
| blue-rig-search-1 | rig-youth-male-work | blue-rig-search |
| blue-rig-search-2 | rig-youth-male-work | blue-rig-search |
| blue-rig-aim | rig-youth-male-service | blue-rig-fire-reload |
| blue-rig-fire | rig-youth-male-service | blue-rig-fire-reload |
| blue-rig-load | rig-youth-male-service | blue-rig-fire-reload |
| blue-rig-ramrod | rig-youth-male-service | blue-rig-fire-reload |
| blue-rig-horse-e-1 | rig-youth-male-service | State artwork; no motion required |
| blue-rig-horse-e-2 | rig-youth-male-service | State artwork; no motion required |
| blue-rig-passenger-e-1 | rig-youth-male-service | blue-rig-passenger-e |
| blue-rig-passenger-e-2 | rig-youth-male-service | blue-rig-passenger-e |
| blue-rig-passenger-s-1 | rig-youth-male-service | blue-rig-passenger-s |
| blue-rig-passenger-s-2 | rig-youth-male-service | blue-rig-passenger-s |
| blue-rig-passenger-n-1 | rig-youth-male-service | blue-rig-passenger-n |
| blue-rig-passenger-n-2 | rig-youth-male-service | blue-rig-passenger-n |
| blue-rig-wounded-1 | rig-youth-male-service | blue-rig-wounded |
| blue-rig-wounded-2 | rig-youth-male-service | blue-rig-wounded |
| blue-rig-fall | rig-youth-male-service | State artwork; no motion required |
| blue-rig-still | rig-youth-male-service | State artwork; no motion required |
| blue-rig-saddle-e-1 | rig-youth-male-saddle | blue-rig-saddle-e |
| blue-rig-saddle-e-2 | rig-youth-male-saddle | blue-rig-saddle-e |
| blue-rig-saddle-wounded-e-1 | rig-youth-male-saddle | blue-rig-saddle-wounded-e |
| blue-rig-saddle-wounded-e-2 | rig-youth-male-saddle | blue-rig-saddle-wounded-e |
| blue-rig-saddle-s-1 | rig-youth-male-saddle | blue-rig-saddle-s |
| blue-rig-saddle-s-2 | rig-youth-male-saddle | blue-rig-saddle-s |
| blue-rig-saddle-wounded-s-1 | rig-youth-male-saddle | blue-rig-saddle-wounded-s |
| blue-rig-saddle-wounded-s-2 | rig-youth-male-saddle | blue-rig-saddle-wounded-s |
| blue-rig-saddle-n-1 | rig-youth-male-saddle | blue-rig-saddle-n |
| blue-rig-saddle-n-2 | rig-youth-male-saddle | blue-rig-saddle-n |
| blue-rig-saddle-wounded-n-1 | rig-youth-male-saddle | blue-rig-saddle-wounded-n |
| blue-rig-saddle-wounded-n-2 | rig-youth-male-saddle | blue-rig-saddle-wounded-n |
| blue-rig-covered-1 | rig-covered-patients | blue-rig-covered |
| blue-rig-covered-2 | rig-covered-patients | blue-rig-covered |
| blue-rig-camp-rest-1 | rig-camp-grown | blue-rig-camp-rest |
| blue-rig-camp-rest-2 | rig-camp-grown | blue-rig-camp-rest |
| blue-rig-camp-sleep-1 | rig-camp-grown | blue-rig-camp-sleep |
| blue-rig-camp-sleep-2 | rig-camp-grown | blue-rig-camp-sleep |
| blue-rig-mounted-e-aim | rig-youth-male-mounted-service | blue-rig-mounted-fire-e |
| blue-rig-mounted-e-fire | rig-youth-male-mounted-service | blue-rig-mounted-fire-e |
| blue-rig-mounted-e-load | rig-youth-male-mounted-service | blue-rig-mounted-fire-e |
| blue-rig-mounted-e-ramrod | rig-youth-male-mounted-service | blue-rig-mounted-fire-e |
| blue-rig-mounted-s-aim | rig-youth-male-mounted-service | blue-rig-mounted-fire-s |
| blue-rig-mounted-s-fire | rig-youth-male-mounted-service | blue-rig-mounted-fire-s |
| blue-rig-mounted-s-load | rig-youth-male-mounted-service | blue-rig-mounted-fire-s |
| blue-rig-mounted-s-ramrod | rig-youth-male-mounted-service | blue-rig-mounted-fire-s |
| blue-rig-mounted-n-aim | rig-youth-male-mounted-service | blue-rig-mounted-fire-n |
| blue-rig-mounted-n-fire | rig-youth-male-mounted-service | blue-rig-mounted-fire-n |
| blue-rig-mounted-n-load | rig-youth-male-mounted-service | blue-rig-mounted-fire-n |
| blue-rig-mounted-n-ramrod | rig-youth-male-mounted-service | blue-rig-mounted-fire-n |
| blue-rig-surrender-1 | rig-capture-poses | blue-rig-surrender |
| blue-rig-surrender-2 | rig-capture-poses | blue-rig-surrender |
| blue-rig-sow-1 | rig-sow-poses | blue-rig-sow |
| blue-rig-sow-2 | rig-sow-poses | blue-rig-sow |
| blue-rig-harvest-1 | rig-harvest-poses | blue-rig-harvest |
| blue-rig-harvest-2 | rig-harvest-poses | blue-rig-harvest |
| youth-boy-rig-idle-s | rig-youth-male-locomotion | youth-boy-rig-idle-s |
| youth-boy-rig-idle-e | rig-youth-male-locomotion | youth-boy-rig-idle-e |
| youth-boy-rig-idle-n | rig-youth-male-locomotion | youth-boy-rig-idle-n |
| youth-boy-rig-idle-w | rig-youth-male-locomotion | youth-boy-rig-idle-w |
| youth-boy-rig-walk-e-1 | rig-youth-male-locomotion | youth-boy-rig-walk-e |
| youth-boy-rig-walk-e-2 | rig-youth-male-locomotion | youth-boy-rig-walk-e |
| youth-boy-rig-walk-e-3 | rig-youth-male-locomotion | youth-boy-rig-walk-e |
| youth-boy-rig-walk-e-4 | rig-youth-male-locomotion | youth-boy-rig-walk-e |
| youth-boy-rig-walk-s-1 | rig-youth-male-locomotion | youth-boy-rig-walk-s |
| youth-boy-rig-walk-s-2 | rig-youth-male-locomotion | youth-boy-rig-walk-s |
| youth-boy-rig-walk-n-1 | rig-youth-male-locomotion | youth-boy-rig-walk-n |
| youth-boy-rig-walk-n-2 | rig-youth-male-locomotion | youth-boy-rig-walk-n |
| youth-boy-rig-dig-1 | rig-youth-male-work | youth-boy-rig-dig |
| youth-boy-rig-dig-2 | rig-youth-male-work | youth-boy-rig-dig |
| youth-boy-rig-hoe-1 | rig-youth-male-work | youth-boy-rig-hoe |
| youth-boy-rig-hoe-2 | rig-youth-male-work | youth-boy-rig-hoe |
| youth-boy-rig-chop-1 | rig-youth-male-work | youth-boy-rig-chop |
| youth-boy-rig-chop-2 | rig-youth-male-work | youth-boy-rig-chop |
| youth-boy-rig-hammer-1 | rig-youth-male-work | youth-boy-rig-hammer |
| youth-boy-rig-hammer-2 | rig-youth-male-work | youth-boy-rig-hammer |
| youth-boy-rig-carry-1 | rig-youth-male-work | youth-boy-rig-carry |
| youth-boy-rig-carry-2 | rig-youth-male-work | youth-boy-rig-carry |
| youth-boy-rig-trade-1 | rig-youth-male-work | youth-boy-rig-trade |
| youth-boy-rig-trade-2 | rig-youth-male-work | youth-boy-rig-trade |
| youth-boy-rig-care-1 | rig-youth-male-work | youth-boy-rig-care |
| youth-boy-rig-care-2 | rig-youth-male-work | youth-boy-rig-care |
| youth-boy-rig-search-1 | rig-youth-male-work | youth-boy-rig-search |
| youth-boy-rig-search-2 | rig-youth-male-work | youth-boy-rig-search |
| youth-boy-rig-aim | rig-youth-male-service | youth-boy-rig-fire-reload |
| youth-boy-rig-fire | rig-youth-male-service | youth-boy-rig-fire-reload |
| youth-boy-rig-load | rig-youth-male-service | youth-boy-rig-fire-reload |
| youth-boy-rig-ramrod | rig-youth-male-service | youth-boy-rig-fire-reload |
| youth-boy-rig-horse-e-1 | rig-youth-male-service | State artwork; no motion required |
| youth-boy-rig-horse-e-2 | rig-youth-male-service | State artwork; no motion required |
| youth-boy-rig-passenger-e-1 | rig-youth-male-service | youth-boy-rig-passenger-e |
| youth-boy-rig-passenger-e-2 | rig-youth-male-service | youth-boy-rig-passenger-e |
| youth-boy-rig-passenger-s-1 | rig-youth-male-service | youth-boy-rig-passenger-s |
| youth-boy-rig-passenger-s-2 | rig-youth-male-service | youth-boy-rig-passenger-s |
| youth-boy-rig-passenger-n-1 | rig-youth-male-service | youth-boy-rig-passenger-n |
| youth-boy-rig-passenger-n-2 | rig-youth-male-service | youth-boy-rig-passenger-n |
| youth-boy-rig-wounded-1 | rig-youth-male-service | youth-boy-rig-wounded |
| youth-boy-rig-wounded-2 | rig-youth-male-service | youth-boy-rig-wounded |
| youth-boy-rig-fall | rig-youth-male-service | State artwork; no motion required |
| youth-boy-rig-still | rig-youth-male-service | State artwork; no motion required |
| youth-boy-rig-saddle-e-1 | rig-youth-male-saddle | youth-boy-rig-saddle-e |
| youth-boy-rig-saddle-e-2 | rig-youth-male-saddle | youth-boy-rig-saddle-e |
| youth-boy-rig-saddle-wounded-e-1 | rig-youth-male-saddle | youth-boy-rig-saddle-wounded-e |
| youth-boy-rig-saddle-wounded-e-2 | rig-youth-male-saddle | youth-boy-rig-saddle-wounded-e |
| youth-boy-rig-saddle-s-1 | rig-youth-male-saddle | youth-boy-rig-saddle-s |
| youth-boy-rig-saddle-s-2 | rig-youth-male-saddle | youth-boy-rig-saddle-s |
| youth-boy-rig-saddle-wounded-s-1 | rig-youth-male-saddle | youth-boy-rig-saddle-wounded-s |
| youth-boy-rig-saddle-wounded-s-2 | rig-youth-male-saddle | youth-boy-rig-saddle-wounded-s |
| youth-boy-rig-saddle-n-1 | rig-youth-male-saddle | youth-boy-rig-saddle-n |
| youth-boy-rig-saddle-n-2 | rig-youth-male-saddle | youth-boy-rig-saddle-n |
| youth-boy-rig-saddle-wounded-n-1 | rig-youth-male-saddle | youth-boy-rig-saddle-wounded-n |
| youth-boy-rig-saddle-wounded-n-2 | rig-youth-male-saddle | youth-boy-rig-saddle-wounded-n |
| youth-boy-rig-covered-1 | rig-covered-patients | youth-boy-rig-covered |
| youth-boy-rig-covered-2 | rig-covered-patients | youth-boy-rig-covered |
| youth-boy-rig-camp-rest-1 | rig-camp-grown | youth-boy-rig-camp-rest |
| youth-boy-rig-camp-rest-2 | rig-camp-grown | youth-boy-rig-camp-rest |
| youth-boy-rig-camp-sleep-1 | rig-camp-grown | youth-boy-rig-camp-sleep |
| youth-boy-rig-camp-sleep-2 | rig-camp-grown | youth-boy-rig-camp-sleep |
| youth-boy-rig-mounted-e-aim | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-e |
| youth-boy-rig-mounted-e-fire | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-e |
| youth-boy-rig-mounted-e-load | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-e |
| youth-boy-rig-mounted-e-ramrod | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-e |
| youth-boy-rig-mounted-s-aim | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-s |
| youth-boy-rig-mounted-s-fire | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-s |
| youth-boy-rig-mounted-s-load | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-s |
| youth-boy-rig-mounted-s-ramrod | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-s |
| youth-boy-rig-mounted-n-aim | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-n |
| youth-boy-rig-mounted-n-fire | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-n |
| youth-boy-rig-mounted-n-load | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-n |
| youth-boy-rig-mounted-n-ramrod | rig-youth-male-mounted-service | youth-boy-rig-mounted-fire-n |
| youth-boy-rig-surrender-1 | rig-capture-poses | youth-boy-rig-surrender |
| youth-boy-rig-surrender-2 | rig-capture-poses | youth-boy-rig-surrender |
| youth-boy-rig-sow-1 | rig-sow-poses | youth-boy-rig-sow |
| youth-boy-rig-sow-2 | rig-sow-poses | youth-boy-rig-sow |
| youth-boy-rig-harvest-1 | rig-harvest-poses | youth-boy-rig-harvest |
| youth-boy-rig-harvest-2 | rig-harvest-poses | youth-boy-rig-harvest |
| blue-girl-rig-idle-s | rig-youth-female-locomotion | blue-girl-rig-idle-s |
| blue-girl-rig-idle-e | rig-youth-female-locomotion | blue-girl-rig-idle-e |
| blue-girl-rig-idle-n | rig-youth-female-locomotion | blue-girl-rig-idle-n |
| blue-girl-rig-idle-w | rig-youth-female-locomotion | blue-girl-rig-idle-w |
| blue-girl-rig-walk-e-1 | rig-youth-female-locomotion | blue-girl-rig-walk-e |
| blue-girl-rig-walk-e-2 | rig-youth-female-locomotion | blue-girl-rig-walk-e |
| blue-girl-rig-walk-e-3 | rig-youth-female-locomotion | blue-girl-rig-walk-e |
| blue-girl-rig-walk-e-4 | rig-youth-female-locomotion | blue-girl-rig-walk-e |
| blue-girl-rig-walk-s-1 | rig-youth-female-locomotion | blue-girl-rig-walk-s |
| blue-girl-rig-walk-s-2 | rig-youth-female-locomotion | blue-girl-rig-walk-s |
| blue-girl-rig-walk-n-1 | rig-youth-female-locomotion | blue-girl-rig-walk-n |
| blue-girl-rig-walk-n-2 | rig-youth-female-locomotion | blue-girl-rig-walk-n |
| blue-girl-rig-dig-1 | rig-youth-female-work | blue-girl-rig-dig |
| blue-girl-rig-dig-2 | rig-youth-female-work | blue-girl-rig-dig |
| blue-girl-rig-hoe-1 | rig-youth-female-work | blue-girl-rig-hoe |
| blue-girl-rig-hoe-2 | rig-youth-female-work | blue-girl-rig-hoe |
| blue-girl-rig-chop-1 | rig-youth-female-work | blue-girl-rig-chop |
| blue-girl-rig-chop-2 | rig-youth-female-work | blue-girl-rig-chop |
| blue-girl-rig-hammer-1 | rig-youth-female-work | blue-girl-rig-hammer |
| blue-girl-rig-hammer-2 | rig-youth-female-work | blue-girl-rig-hammer |
| blue-girl-rig-carry-1 | rig-youth-female-work | blue-girl-rig-carry |
| blue-girl-rig-carry-2 | rig-youth-female-work | blue-girl-rig-carry |
| blue-girl-rig-trade-1 | rig-youth-female-work | blue-girl-rig-trade |
| blue-girl-rig-trade-2 | rig-youth-female-work | blue-girl-rig-trade |
| blue-girl-rig-care-1 | rig-youth-female-work | blue-girl-rig-care |
| blue-girl-rig-care-2 | rig-youth-female-work | blue-girl-rig-care |
| blue-girl-rig-search-1 | rig-youth-female-work | blue-girl-rig-search |
| blue-girl-rig-search-2 | rig-youth-female-work | blue-girl-rig-search |
| blue-girl-rig-aim | rig-youth-female-service | blue-girl-rig-fire-reload |
| blue-girl-rig-fire | rig-youth-female-service | blue-girl-rig-fire-reload |
| blue-girl-rig-load | rig-youth-female-service | blue-girl-rig-fire-reload |
| blue-girl-rig-ramrod | rig-youth-female-service | blue-girl-rig-fire-reload |
| blue-girl-rig-horse-e-1 | rig-youth-female-service | State artwork; no motion required |
| blue-girl-rig-horse-e-2 | rig-youth-female-service | State artwork; no motion required |
| blue-girl-rig-passenger-e-1 | rig-youth-female-service | blue-girl-rig-passenger-e |
| blue-girl-rig-passenger-e-2 | rig-youth-female-service | blue-girl-rig-passenger-e |
| blue-girl-rig-passenger-s-1 | rig-youth-female-service | blue-girl-rig-passenger-s |
| blue-girl-rig-passenger-s-2 | rig-youth-female-service | blue-girl-rig-passenger-s |
| blue-girl-rig-passenger-n-1 | rig-youth-female-service | blue-girl-rig-passenger-n |
| blue-girl-rig-passenger-n-2 | rig-youth-female-service | blue-girl-rig-passenger-n |
| blue-girl-rig-wounded-1 | rig-youth-female-service | blue-girl-rig-wounded |
| blue-girl-rig-wounded-2 | rig-youth-female-service | blue-girl-rig-wounded |
| blue-girl-rig-fall | rig-youth-female-service | State artwork; no motion required |
| blue-girl-rig-still | rig-youth-female-service | State artwork; no motion required |
| blue-girl-rig-saddle-e-1 | rig-youth-female-saddle | blue-girl-rig-saddle-e |
| blue-girl-rig-saddle-e-2 | rig-youth-female-saddle | blue-girl-rig-saddle-e |
| blue-girl-rig-saddle-wounded-e-1 | rig-youth-female-saddle | blue-girl-rig-saddle-wounded-e |
| blue-girl-rig-saddle-wounded-e-2 | rig-youth-female-saddle | blue-girl-rig-saddle-wounded-e |
| blue-girl-rig-saddle-s-1 | rig-youth-female-saddle | blue-girl-rig-saddle-s |
| blue-girl-rig-saddle-s-2 | rig-youth-female-saddle | blue-girl-rig-saddle-s |
| blue-girl-rig-saddle-wounded-s-1 | rig-youth-female-saddle | blue-girl-rig-saddle-wounded-s |
| blue-girl-rig-saddle-wounded-s-2 | rig-youth-female-saddle | blue-girl-rig-saddle-wounded-s |
| blue-girl-rig-saddle-n-1 | rig-youth-female-saddle | blue-girl-rig-saddle-n |
| blue-girl-rig-saddle-n-2 | rig-youth-female-saddle | blue-girl-rig-saddle-n |
| blue-girl-rig-saddle-wounded-n-1 | rig-youth-female-saddle | blue-girl-rig-saddle-wounded-n |
| blue-girl-rig-saddle-wounded-n-2 | rig-youth-female-saddle | blue-girl-rig-saddle-wounded-n |
| blue-girl-rig-covered-1 | rig-covered-patients | blue-girl-rig-covered |
| blue-girl-rig-covered-2 | rig-covered-patients | blue-girl-rig-covered |
| blue-girl-rig-camp-rest-1 | rig-camp-grown | blue-girl-rig-camp-rest |
| blue-girl-rig-camp-rest-2 | rig-camp-grown | blue-girl-rig-camp-rest |
| blue-girl-rig-camp-sleep-1 | rig-camp-grown | blue-girl-rig-camp-sleep |
| blue-girl-rig-camp-sleep-2 | rig-camp-grown | blue-girl-rig-camp-sleep |
| blue-girl-rig-mounted-e-aim | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-e |
| blue-girl-rig-mounted-e-fire | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-e |
| blue-girl-rig-mounted-e-load | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-e |
| blue-girl-rig-mounted-e-ramrod | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-e |
| blue-girl-rig-mounted-s-aim | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-s |
| blue-girl-rig-mounted-s-fire | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-s |
| blue-girl-rig-mounted-s-load | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-s |
| blue-girl-rig-mounted-s-ramrod | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-s |
| blue-girl-rig-mounted-n-aim | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-n |
| blue-girl-rig-mounted-n-fire | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-n |
| blue-girl-rig-mounted-n-load | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-n |
| blue-girl-rig-mounted-n-ramrod | rig-youth-female-mounted-service | blue-girl-rig-mounted-fire-n |
| blue-girl-rig-surrender-1 | rig-capture-poses | blue-girl-rig-surrender |
| blue-girl-rig-surrender-2 | rig-capture-poses | blue-girl-rig-surrender |
| blue-girl-rig-sow-1 | rig-sow-poses | blue-girl-rig-sow |
| blue-girl-rig-sow-2 | rig-sow-poses | blue-girl-rig-sow |
| blue-girl-rig-harvest-1 | rig-harvest-poses | blue-girl-rig-harvest |
| blue-girl-rig-harvest-2 | rig-harvest-poses | blue-girl-rig-harvest |
| youth-girl-rig-idle-s | rig-youth-female-locomotion | youth-girl-rig-idle-s |
| youth-girl-rig-idle-e | rig-youth-female-locomotion | youth-girl-rig-idle-e |
| youth-girl-rig-idle-n | rig-youth-female-locomotion | youth-girl-rig-idle-n |
| youth-girl-rig-idle-w | rig-youth-female-locomotion | youth-girl-rig-idle-w |
| youth-girl-rig-walk-e-1 | rig-youth-female-locomotion | youth-girl-rig-walk-e |
| youth-girl-rig-walk-e-2 | rig-youth-female-locomotion | youth-girl-rig-walk-e |
| youth-girl-rig-walk-e-3 | rig-youth-female-locomotion | youth-girl-rig-walk-e |
| youth-girl-rig-walk-e-4 | rig-youth-female-locomotion | youth-girl-rig-walk-e |
| youth-girl-rig-walk-s-1 | rig-youth-female-locomotion | youth-girl-rig-walk-s |
| youth-girl-rig-walk-s-2 | rig-youth-female-locomotion | youth-girl-rig-walk-s |
| youth-girl-rig-walk-n-1 | rig-youth-female-locomotion | youth-girl-rig-walk-n |
| youth-girl-rig-walk-n-2 | rig-youth-female-locomotion | youth-girl-rig-walk-n |
| youth-girl-rig-dig-1 | rig-youth-female-work | youth-girl-rig-dig |
| youth-girl-rig-dig-2 | rig-youth-female-work | youth-girl-rig-dig |
| youth-girl-rig-hoe-1 | rig-youth-female-work | youth-girl-rig-hoe |
| youth-girl-rig-hoe-2 | rig-youth-female-work | youth-girl-rig-hoe |
| youth-girl-rig-chop-1 | rig-youth-female-work | youth-girl-rig-chop |
| youth-girl-rig-chop-2 | rig-youth-female-work | youth-girl-rig-chop |
| youth-girl-rig-hammer-1 | rig-youth-female-work | youth-girl-rig-hammer |
| youth-girl-rig-hammer-2 | rig-youth-female-work | youth-girl-rig-hammer |
| youth-girl-rig-carry-1 | rig-youth-female-work | youth-girl-rig-carry |
| youth-girl-rig-carry-2 | rig-youth-female-work | youth-girl-rig-carry |
| youth-girl-rig-trade-1 | rig-youth-female-work | youth-girl-rig-trade |
| youth-girl-rig-trade-2 | rig-youth-female-work | youth-girl-rig-trade |
| youth-girl-rig-care-1 | rig-youth-female-work | youth-girl-rig-care |
| youth-girl-rig-care-2 | rig-youth-female-work | youth-girl-rig-care |
| youth-girl-rig-search-1 | rig-youth-female-work | youth-girl-rig-search |
| youth-girl-rig-search-2 | rig-youth-female-work | youth-girl-rig-search |
| youth-girl-rig-aim | rig-youth-female-service | youth-girl-rig-fire-reload |
| youth-girl-rig-fire | rig-youth-female-service | youth-girl-rig-fire-reload |
| youth-girl-rig-load | rig-youth-female-service | youth-girl-rig-fire-reload |
| youth-girl-rig-ramrod | rig-youth-female-service | youth-girl-rig-fire-reload |
| youth-girl-rig-horse-e-1 | rig-youth-female-service | State artwork; no motion required |
| youth-girl-rig-horse-e-2 | rig-youth-female-service | State artwork; no motion required |
| youth-girl-rig-passenger-e-1 | rig-youth-female-service | youth-girl-rig-passenger-e |
| youth-girl-rig-passenger-e-2 | rig-youth-female-service | youth-girl-rig-passenger-e |
| youth-girl-rig-passenger-s-1 | rig-youth-female-service | youth-girl-rig-passenger-s |
| youth-girl-rig-passenger-s-2 | rig-youth-female-service | youth-girl-rig-passenger-s |
| youth-girl-rig-passenger-n-1 | rig-youth-female-service | youth-girl-rig-passenger-n |
| youth-girl-rig-passenger-n-2 | rig-youth-female-service | youth-girl-rig-passenger-n |
| youth-girl-rig-wounded-1 | rig-youth-female-service | youth-girl-rig-wounded |
| youth-girl-rig-wounded-2 | rig-youth-female-service | youth-girl-rig-wounded |
| youth-girl-rig-fall | rig-youth-female-service | State artwork; no motion required |
| youth-girl-rig-still | rig-youth-female-service | State artwork; no motion required |
| youth-girl-rig-saddle-e-1 | rig-youth-female-saddle | youth-girl-rig-saddle-e |
| youth-girl-rig-saddle-e-2 | rig-youth-female-saddle | youth-girl-rig-saddle-e |
| youth-girl-rig-saddle-wounded-e-1 | rig-youth-female-saddle | youth-girl-rig-saddle-wounded-e |
| youth-girl-rig-saddle-wounded-e-2 | rig-youth-female-saddle | youth-girl-rig-saddle-wounded-e |
| youth-girl-rig-saddle-s-1 | rig-youth-female-saddle | youth-girl-rig-saddle-s |
| youth-girl-rig-saddle-s-2 | rig-youth-female-saddle | youth-girl-rig-saddle-s |
| youth-girl-rig-saddle-wounded-s-1 | rig-youth-female-saddle | youth-girl-rig-saddle-wounded-s |
| youth-girl-rig-saddle-wounded-s-2 | rig-youth-female-saddle | youth-girl-rig-saddle-wounded-s |
| youth-girl-rig-saddle-n-1 | rig-youth-female-saddle | youth-girl-rig-saddle-n |
| youth-girl-rig-saddle-n-2 | rig-youth-female-saddle | youth-girl-rig-saddle-n |
| youth-girl-rig-saddle-wounded-n-1 | rig-youth-female-saddle | youth-girl-rig-saddle-wounded-n |
| youth-girl-rig-saddle-wounded-n-2 | rig-youth-female-saddle | youth-girl-rig-saddle-wounded-n |
| youth-girl-rig-covered-1 | rig-covered-patients | youth-girl-rig-covered |
| youth-girl-rig-covered-2 | rig-covered-patients | youth-girl-rig-covered |
| youth-girl-rig-camp-rest-1 | rig-camp-grown | youth-girl-rig-camp-rest |
| youth-girl-rig-camp-rest-2 | rig-camp-grown | youth-girl-rig-camp-rest |
| youth-girl-rig-camp-sleep-1 | rig-camp-grown | youth-girl-rig-camp-sleep |
| youth-girl-rig-camp-sleep-2 | rig-camp-grown | youth-girl-rig-camp-sleep |
| youth-girl-rig-mounted-e-aim | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-e |
| youth-girl-rig-mounted-e-fire | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-e |
| youth-girl-rig-mounted-e-load | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-e |
| youth-girl-rig-mounted-e-ramrod | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-e |
| youth-girl-rig-mounted-s-aim | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-s |
| youth-girl-rig-mounted-s-fire | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-s |
| youth-girl-rig-mounted-s-load | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-s |
| youth-girl-rig-mounted-s-ramrod | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-s |
| youth-girl-rig-mounted-n-aim | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-n |
| youth-girl-rig-mounted-n-fire | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-n |
| youth-girl-rig-mounted-n-load | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-n |
| youth-girl-rig-mounted-n-ramrod | rig-youth-female-mounted-service | youth-girl-rig-mounted-fire-n |
| youth-girl-rig-surrender-1 | rig-capture-poses | youth-girl-rig-surrender |
| youth-girl-rig-surrender-2 | rig-capture-poses | youth-girl-rig-surrender |
| youth-girl-rig-sow-1 | rig-sow-poses | youth-girl-rig-sow |
| youth-girl-rig-sow-2 | rig-sow-poses | youth-girl-rig-sow |
| youth-girl-rig-harvest-1 | rig-harvest-poses | youth-girl-rig-harvest |
| youth-girl-rig-harvest-2 | rig-harvest-poses | youth-girl-rig-harvest |
| boy-rig-idle-s | rig-child-male-locomotion | boy-rig-idle-s |
| boy-rig-idle-e | rig-child-male-locomotion | boy-rig-idle-e |
| boy-rig-idle-n | rig-child-male-locomotion | boy-rig-idle-n |
| boy-rig-idle-w | rig-child-male-locomotion | boy-rig-idle-w |
| boy-rig-walk-e-1 | rig-child-male-locomotion | boy-rig-walk-e |
| boy-rig-walk-e-2 | rig-child-male-locomotion | boy-rig-walk-e |
| boy-rig-walk-e-3 | rig-child-male-locomotion | boy-rig-walk-e |
| boy-rig-walk-e-4 | rig-child-male-locomotion | boy-rig-walk-e |
| boy-rig-walk-s-1 | rig-child-male-locomotion | boy-rig-walk-s |
| boy-rig-walk-s-2 | rig-child-male-locomotion | boy-rig-walk-s |
| boy-rig-walk-n-1 | rig-child-male-locomotion | boy-rig-walk-n |
| boy-rig-walk-n-2 | rig-child-male-locomotion | boy-rig-walk-n |
| boy-rig-dig-1 | rig-child-male-work | boy-rig-dig |
| boy-rig-dig-2 | rig-child-male-work | boy-rig-dig |
| boy-rig-hoe-1 | rig-child-male-work | boy-rig-hoe |
| boy-rig-hoe-2 | rig-child-male-work | boy-rig-hoe |
| boy-rig-chop-1 | rig-child-male-work | boy-rig-chop |
| boy-rig-chop-2 | rig-child-male-work | boy-rig-chop |
| boy-rig-hammer-1 | rig-child-male-work | boy-rig-hammer |
| boy-rig-hammer-2 | rig-child-male-work | boy-rig-hammer |
| boy-rig-carry-1 | rig-child-male-work | boy-rig-carry |
| boy-rig-carry-2 | rig-child-male-work | boy-rig-carry |
| boy-rig-trade-1 | rig-child-male-work | boy-rig-trade |
| boy-rig-trade-2 | rig-child-male-work | boy-rig-trade |
| boy-rig-care-1 | rig-child-male-work | boy-rig-care |
| boy-rig-care-2 | rig-child-male-work | boy-rig-care |
| boy-rig-search-1 | rig-child-male-work | boy-rig-search |
| boy-rig-search-2 | rig-child-male-work | boy-rig-search |
| boy-rig-comfort-1 | rig-child-male-service | boy-rig-comfort |
| boy-rig-comfort-2 | rig-child-male-service | boy-rig-comfort |
| boy-rig-rest-1 | rig-child-male-service | State artwork; no motion required |
| boy-rig-rest-2 | rig-child-male-service | State artwork; no motion required |
| boy-rig-horse-e-1 | rig-child-male-service | State artwork; no motion required |
| boy-rig-horse-e-2 | rig-child-male-service | State artwork; no motion required |
| boy-rig-passenger-e-1 | rig-child-male-service | boy-rig-passenger-e |
| boy-rig-passenger-e-2 | rig-child-male-service | boy-rig-passenger-e |
| boy-rig-passenger-s-1 | rig-child-male-service | boy-rig-passenger-s |
| boy-rig-passenger-s-2 | rig-child-male-service | boy-rig-passenger-s |
| boy-rig-passenger-n-1 | rig-child-male-service | boy-rig-passenger-n |
| boy-rig-passenger-n-2 | rig-child-male-service | boy-rig-passenger-n |
| boy-rig-wounded-1 | rig-child-male-service | boy-rig-wounded |
| boy-rig-wounded-2 | rig-child-male-service | boy-rig-wounded |
| boy-rig-fall | rig-child-male-service | State artwork; no motion required |
| boy-rig-still | rig-child-male-service | State artwork; no motion required |
| boy-rig-saddle-e-1 | rig-child-male-saddle | boy-rig-saddle-e |
| boy-rig-saddle-e-2 | rig-child-male-saddle | boy-rig-saddle-e |
| boy-rig-saddle-wounded-e-1 | rig-child-male-saddle | boy-rig-saddle-wounded-e |
| boy-rig-saddle-wounded-e-2 | rig-child-male-saddle | boy-rig-saddle-wounded-e |
| boy-rig-saddle-s-1 | rig-child-male-saddle | boy-rig-saddle-s |
| boy-rig-saddle-s-2 | rig-child-male-saddle | boy-rig-saddle-s |
| boy-rig-saddle-wounded-s-1 | rig-child-male-saddle | boy-rig-saddle-wounded-s |
| boy-rig-saddle-wounded-s-2 | rig-child-male-saddle | boy-rig-saddle-wounded-s |
| boy-rig-saddle-n-1 | rig-child-male-saddle | boy-rig-saddle-n |
| boy-rig-saddle-n-2 | rig-child-male-saddle | boy-rig-saddle-n |
| boy-rig-saddle-wounded-n-1 | rig-child-male-saddle | boy-rig-saddle-wounded-n |
| boy-rig-saddle-wounded-n-2 | rig-child-male-saddle | boy-rig-saddle-wounded-n |
| boy-rig-covered-1 | rig-covered-patients | boy-rig-covered |
| boy-rig-covered-2 | rig-covered-patients | boy-rig-covered |
| boy-rig-camp-rest-1 | rig-camp-children | boy-rig-camp-rest |
| boy-rig-camp-rest-2 | rig-camp-children | boy-rig-camp-rest |
| boy-rig-camp-sleep-1 | rig-camp-children | boy-rig-camp-sleep |
| boy-rig-camp-sleep-2 | rig-camp-children | boy-rig-camp-sleep |
| boy-rig-surrender-1 | rig-capture-poses | boy-rig-surrender |
| boy-rig-surrender-2 | rig-capture-poses | boy-rig-surrender |
| boy-rig-sow-1 | rig-sow-poses | boy-rig-sow |
| boy-rig-sow-2 | rig-sow-poses | boy-rig-sow |
| boy-rig-harvest-1 | rig-harvest-poses | boy-rig-harvest |
| boy-rig-harvest-2 | rig-harvest-poses | boy-rig-harvest |
| girl-rig-idle-s | rig-child-female-locomotion | girl-rig-idle-s |
| girl-rig-idle-e | rig-child-female-locomotion | girl-rig-idle-e |
| girl-rig-idle-n | rig-child-female-locomotion | girl-rig-idle-n |
| girl-rig-idle-w | rig-child-female-locomotion | girl-rig-idle-w |
| girl-rig-walk-e-1 | rig-child-female-locomotion | girl-rig-walk-e |
| girl-rig-walk-e-2 | rig-child-female-locomotion | girl-rig-walk-e |
| girl-rig-walk-e-3 | rig-child-female-locomotion | girl-rig-walk-e |
| girl-rig-walk-e-4 | rig-child-female-locomotion | girl-rig-walk-e |
| girl-rig-walk-s-1 | rig-child-female-locomotion | girl-rig-walk-s |
| girl-rig-walk-s-2 | rig-child-female-locomotion | girl-rig-walk-s |
| girl-rig-walk-n-1 | rig-child-female-locomotion | girl-rig-walk-n |
| girl-rig-walk-n-2 | rig-child-female-locomotion | girl-rig-walk-n |
| girl-rig-dig-1 | rig-child-female-work | girl-rig-dig |
| girl-rig-dig-2 | rig-child-female-work | girl-rig-dig |
| girl-rig-hoe-1 | rig-child-female-work | girl-rig-hoe |
| girl-rig-hoe-2 | rig-child-female-work | girl-rig-hoe |
| girl-rig-chop-1 | rig-child-female-work | girl-rig-chop |
| girl-rig-chop-2 | rig-child-female-work | girl-rig-chop |
| girl-rig-hammer-1 | rig-child-female-work | girl-rig-hammer |
| girl-rig-hammer-2 | rig-child-female-work | girl-rig-hammer |
| girl-rig-carry-1 | rig-child-female-work | girl-rig-carry |
| girl-rig-carry-2 | rig-child-female-work | girl-rig-carry |
| girl-rig-trade-1 | rig-child-female-work | girl-rig-trade |
| girl-rig-trade-2 | rig-child-female-work | girl-rig-trade |
| girl-rig-care-1 | rig-child-female-work | girl-rig-care |
| girl-rig-care-2 | rig-child-female-work | girl-rig-care |
| girl-rig-search-1 | rig-child-female-work | girl-rig-search |
| girl-rig-search-2 | rig-child-female-work | girl-rig-search |
| girl-rig-comfort-1 | rig-child-female-service | girl-rig-comfort |
| girl-rig-comfort-2 | rig-child-female-service | girl-rig-comfort |
| girl-rig-rest-1 | rig-child-female-service | State artwork; no motion required |
| girl-rig-rest-2 | rig-child-female-service | State artwork; no motion required |
| girl-rig-horse-e-1 | rig-child-female-service | State artwork; no motion required |
| girl-rig-horse-e-2 | rig-child-female-service | State artwork; no motion required |
| girl-rig-passenger-e-1 | rig-child-female-service | girl-rig-passenger-e |
| girl-rig-passenger-e-2 | rig-child-female-service | girl-rig-passenger-e |
| girl-rig-passenger-s-1 | rig-child-female-service | girl-rig-passenger-s |
| girl-rig-passenger-s-2 | rig-child-female-service | girl-rig-passenger-s |
| girl-rig-passenger-n-1 | rig-child-female-service | girl-rig-passenger-n |
| girl-rig-passenger-n-2 | rig-child-female-service | girl-rig-passenger-n |
| girl-rig-wounded-1 | rig-child-female-service | girl-rig-wounded |
| girl-rig-wounded-2 | rig-child-female-service | girl-rig-wounded |
| girl-rig-fall | rig-child-female-service | State artwork; no motion required |
| girl-rig-still | rig-child-female-service | State artwork; no motion required |
| girl-rig-saddle-e-1 | rig-child-female-saddle | girl-rig-saddle-e |
| girl-rig-saddle-e-2 | rig-child-female-saddle | girl-rig-saddle-e |
| girl-rig-saddle-wounded-e-1 | rig-child-female-saddle | girl-rig-saddle-wounded-e |
| girl-rig-saddle-wounded-e-2 | rig-child-female-saddle | girl-rig-saddle-wounded-e |
| girl-rig-saddle-s-1 | rig-child-female-saddle | girl-rig-saddle-s |
| girl-rig-saddle-s-2 | rig-child-female-saddle | girl-rig-saddle-s |
| girl-rig-saddle-wounded-s-1 | rig-child-female-saddle | girl-rig-saddle-wounded-s |
| girl-rig-saddle-wounded-s-2 | rig-child-female-saddle | girl-rig-saddle-wounded-s |
| girl-rig-saddle-n-1 | rig-child-female-saddle | girl-rig-saddle-n |
| girl-rig-saddle-n-2 | rig-child-female-saddle | girl-rig-saddle-n |
| girl-rig-saddle-wounded-n-1 | rig-child-female-saddle | girl-rig-saddle-wounded-n |
| girl-rig-saddle-wounded-n-2 | rig-child-female-saddle | girl-rig-saddle-wounded-n |
| girl-rig-covered-1 | rig-covered-patients | girl-rig-covered |
| girl-rig-covered-2 | rig-covered-patients | girl-rig-covered |
| girl-rig-camp-rest-1 | rig-camp-children | girl-rig-camp-rest |
| girl-rig-camp-rest-2 | rig-camp-children | girl-rig-camp-rest |
| girl-rig-camp-sleep-1 | rig-camp-children | girl-rig-camp-sleep |
| girl-rig-camp-sleep-2 | rig-camp-children | girl-rig-camp-sleep |
| girl-rig-surrender-1 | rig-capture-poses | girl-rig-surrender |
| girl-rig-surrender-2 | rig-capture-poses | girl-rig-surrender |
| girl-rig-sow-1 | rig-sow-poses | girl-rig-sow |
| girl-rig-sow-2 | rig-sow-poses | girl-rig-sow |
| girl-rig-harvest-1 | rig-harvest-poses | girl-rig-harvest |
| girl-rig-harvest-2 | rig-harvest-poses | girl-rig-harvest |
| smallchild-rig-idle-s | rig-smallchild-locomotion | smallchild-rig-idle-s |
| smallchild-rig-idle-e | rig-smallchild-locomotion | smallchild-rig-idle-e |
| smallchild-rig-idle-n | rig-smallchild-locomotion | smallchild-rig-idle-n |
| smallchild-rig-idle-w | rig-smallchild-locomotion | smallchild-rig-idle-w |
| smallchild-rig-walk-e-1 | rig-smallchild-locomotion | smallchild-rig-walk-e |
| smallchild-rig-walk-e-2 | rig-smallchild-locomotion | smallchild-rig-walk-e |
| smallchild-rig-walk-e-3 | rig-smallchild-locomotion | smallchild-rig-walk-e |
| smallchild-rig-walk-e-4 | rig-smallchild-locomotion | smallchild-rig-walk-e |
| smallchild-rig-walk-s-1 | rig-smallchild-locomotion | smallchild-rig-walk-s |
| smallchild-rig-walk-s-2 | rig-smallchild-locomotion | smallchild-rig-walk-s |
| smallchild-rig-walk-n-1 | rig-smallchild-locomotion | smallchild-rig-walk-n |
| smallchild-rig-walk-n-2 | rig-smallchild-locomotion | smallchild-rig-walk-n |
| smallchild-rig-dig-1 | rig-smallchild-work | smallchild-rig-dig |
| smallchild-rig-dig-2 | rig-smallchild-work | smallchild-rig-dig |
| smallchild-rig-hoe-1 | rig-smallchild-work | smallchild-rig-hoe |
| smallchild-rig-hoe-2 | rig-smallchild-work | smallchild-rig-hoe |
| smallchild-rig-chop-1 | rig-smallchild-work | smallchild-rig-chop |
| smallchild-rig-chop-2 | rig-smallchild-work | smallchild-rig-chop |
| smallchild-rig-hammer-1 | rig-smallchild-work | smallchild-rig-hammer |
| smallchild-rig-hammer-2 | rig-smallchild-work | smallchild-rig-hammer |
| smallchild-rig-carry-1 | rig-smallchild-work | smallchild-rig-carry |
| smallchild-rig-carry-2 | rig-smallchild-work | smallchild-rig-carry |
| smallchild-rig-trade-1 | rig-smallchild-work | smallchild-rig-trade |
| smallchild-rig-trade-2 | rig-smallchild-work | smallchild-rig-trade |
| smallchild-rig-care-1 | rig-smallchild-work | smallchild-rig-care |
| smallchild-rig-care-2 | rig-smallchild-work | smallchild-rig-care |
| smallchild-rig-search-1 | rig-smallchild-work | smallchild-rig-search |
| smallchild-rig-search-2 | rig-smallchild-work | smallchild-rig-search |
| smallchild-rig-comfort-1 | rig-smallchild-service | smallchild-rig-comfort |
| smallchild-rig-comfort-2 | rig-smallchild-service | smallchild-rig-comfort |
| smallchild-rig-rest-1 | rig-smallchild-service | State artwork; no motion required |
| smallchild-rig-rest-2 | rig-smallchild-service | State artwork; no motion required |
| smallchild-rig-horse-e-1 | rig-smallchild-service | State artwork; no motion required |
| smallchild-rig-horse-e-2 | rig-smallchild-service | State artwork; no motion required |
| smallchild-rig-passenger-e-1 | rig-smallchild-service | smallchild-rig-passenger-e |
| smallchild-rig-passenger-e-2 | rig-smallchild-service | smallchild-rig-passenger-e |
| smallchild-rig-passenger-s-1 | rig-smallchild-service | smallchild-rig-passenger-s |
| smallchild-rig-passenger-s-2 | rig-smallchild-service | smallchild-rig-passenger-s |
| smallchild-rig-passenger-n-1 | rig-smallchild-service | smallchild-rig-passenger-n |
| smallchild-rig-passenger-n-2 | rig-smallchild-service | smallchild-rig-passenger-n |
| smallchild-rig-wounded-1 | rig-smallchild-service | smallchild-rig-wounded |
| smallchild-rig-wounded-2 | rig-smallchild-service | smallchild-rig-wounded |
| smallchild-rig-fall | rig-smallchild-service | State artwork; no motion required |
| smallchild-rig-still | rig-smallchild-service | State artwork; no motion required |
| smallchild-rig-covered-1 | rig-covered-patients | smallchild-rig-covered |
| smallchild-rig-covered-2 | rig-covered-patients | smallchild-rig-covered |
| smallchild-rig-camp-rest-1 | rig-camp-children | smallchild-rig-camp-rest |
| smallchild-rig-camp-rest-2 | rig-camp-children | smallchild-rig-camp-rest |
| smallchild-rig-camp-sleep-1 | rig-camp-children | smallchild-rig-camp-sleep |
| smallchild-rig-camp-sleep-2 | rig-camp-children | smallchild-rig-camp-sleep |
| smallchild-rig-surrender-1 | rig-capture-poses | smallchild-rig-surrender |
| smallchild-rig-surrender-2 | rig-capture-poses | smallchild-rig-surrender |
| smallchild-rig-sow-1 | rig-sow-poses | smallchild-rig-sow |
| smallchild-rig-sow-2 | rig-sow-poses | smallchild-rig-sow |
| smallchild-rig-harvest-1 | rig-harvest-poses | smallchild-rig-harvest |
| smallchild-rig-harvest-2 | rig-harvest-poses | smallchild-rig-harvest |
| infant-rig-idle-s | rig-infant-body | infant-rig-idle-s |
| infant-rig-idle-e | rig-infant-body | infant-rig-idle-e |
| infant-rig-idle-n | rig-infant-body | infant-rig-idle-n |
| infant-rig-idle-w | rig-infant-body | infant-rig-idle-w |
| infant-rig-rest-e-1 | rig-infant-body | State artwork; no motion required |
| infant-rig-rest-e-2 | rig-infant-body | State artwork; no motion required |
| infant-rig-rest-s-1 | rig-infant-body | State artwork; no motion required |
| infant-rig-rest-s-2 | rig-infant-body | State artwork; no motion required |
| infant-rig-care-1 | rig-infant-body | State artwork; no motion required |
| infant-rig-care-2 | rig-infant-body | State artwork; no motion required |
| infant-rig-wounded-1 | rig-infant-body | infant-rig-wounded |
| infant-rig-wounded-2 | rig-infant-body | infant-rig-wounded |
| infant-rig-covered-1 | rig-covered-patients | infant-rig-covered |
| infant-rig-covered-2 | rig-covered-patients | infant-rig-covered |
| infant-rig-camp-rest-1 | rig-camp-children | infant-rig-camp-rest |
| infant-rig-camp-rest-2 | rig-camp-children | infant-rig-camp-rest |
| infant-rig-camp-sleep-1 | rig-camp-children | infant-rig-camp-sleep |
| infant-rig-camp-sleep-2 | rig-camp-children | infant-rig-camp-sleep |
| infant-rig-surrender-1 | rig-capture-poses | State artwork; no motion required |
| infant-rig-surrender-2 | rig-capture-poses | State artwork; no motion required |
| infant-rig-sow-1 | rig-sow-poses | State artwork; no motion required |
| infant-rig-sow-2 | rig-sow-poses | State artwork; no motion required |
| infant-rig-harvest-1 | rig-harvest-poses | State artwork; no motion required |
| infant-rig-harvest-2 | rig-harvest-poses | State artwork; no motion required |
| rust-rig-carry-living-1 | family-transport-components | rust-rig-carry-living |
| rust-rig-carry-living-2 | family-transport-components | rust-rig-carry-living |
| rust-rig-carry-living-3 | family-transport-components | rust-rig-carry-living |
| rust-rig-carry-living-4 | family-transport-components | rust-rig-carry-living |
| rust-rig-carry-dead-1 | family-transport-components | rust-rig-carry-dead |
| rust-rig-carry-dead-2 | family-transport-components | rust-rig-carry-dead |
| rust-rig-carry-dead-3 | family-transport-components | rust-rig-carry-dead |
| rust-rig-carry-dead-4 | family-transport-components | rust-rig-carry-dead |
| rust-rig-led-wounded-1 | family-transport-components | rust-rig-led-wounded |
| rust-rig-led-wounded-2 | family-transport-components | rust-rig-led-wounded |
| rust-rig-led-wounded-3 | family-transport-components | rust-rig-led-wounded |
| rust-rig-led-wounded-4 | family-transport-components | rust-rig-led-wounded |
| elder-rig-carry-living-1 | family-transport-components | elder-rig-carry-living |
| elder-rig-carry-living-2 | family-transport-components | elder-rig-carry-living |
| elder-rig-carry-living-3 | family-transport-components | elder-rig-carry-living |
| elder-rig-carry-living-4 | family-transport-components | elder-rig-carry-living |
| elder-rig-carry-dead-1 | family-transport-components | elder-rig-carry-dead |
| elder-rig-carry-dead-2 | family-transport-components | elder-rig-carry-dead |
| elder-rig-carry-dead-3 | family-transport-components | elder-rig-carry-dead |
| elder-rig-carry-dead-4 | family-transport-components | elder-rig-carry-dead |
| elder-rig-led-wounded-1 | family-transport-components | elder-rig-led-wounded |
| elder-rig-led-wounded-2 | family-transport-components | elder-rig-led-wounded |
| elder-rig-led-wounded-3 | family-transport-components | elder-rig-led-wounded |
| elder-rig-led-wounded-4 | family-transport-components | elder-rig-led-wounded |
| ochre-rig-carry-living-1 | family-transport-components | ochre-rig-carry-living |
| ochre-rig-carry-living-2 | family-transport-components | ochre-rig-carry-living |
| ochre-rig-carry-living-3 | family-transport-components | ochre-rig-carry-living |
| ochre-rig-carry-living-4 | family-transport-components | ochre-rig-carry-living |
| ochre-rig-carry-dead-1 | family-transport-components | ochre-rig-carry-dead |
| ochre-rig-carry-dead-2 | family-transport-components | ochre-rig-carry-dead |
| ochre-rig-carry-dead-3 | family-transport-components | ochre-rig-carry-dead |
| ochre-rig-carry-dead-4 | family-transport-components | ochre-rig-carry-dead |
| ochre-rig-led-wounded-1 | family-transport-components | ochre-rig-led-wounded |
| ochre-rig-led-wounded-2 | family-transport-components | ochre-rig-led-wounded |
| ochre-rig-led-wounded-3 | family-transport-components | ochre-rig-led-wounded |
| ochre-rig-led-wounded-4 | family-transport-components | ochre-rig-led-wounded |
| father-hat-rig-carry-living-1 | family-transport-components | father-hat-rig-carry-living |
| father-hat-rig-carry-living-2 | family-transport-components | father-hat-rig-carry-living |
| father-hat-rig-carry-living-3 | family-transport-components | father-hat-rig-carry-living |
| father-hat-rig-carry-living-4 | family-transport-components | father-hat-rig-carry-living |
| father-hat-rig-carry-dead-1 | family-transport-components | father-hat-rig-carry-dead |
| father-hat-rig-carry-dead-2 | family-transport-components | father-hat-rig-carry-dead |
| father-hat-rig-carry-dead-3 | family-transport-components | father-hat-rig-carry-dead |
| father-hat-rig-carry-dead-4 | family-transport-components | father-hat-rig-carry-dead |
| father-hat-rig-led-wounded-1 | family-transport-components | father-hat-rig-led-wounded |
| father-hat-rig-led-wounded-2 | family-transport-components | father-hat-rig-led-wounded |
| father-hat-rig-led-wounded-3 | family-transport-components | father-hat-rig-led-wounded |
| father-hat-rig-led-wounded-4 | family-transport-components | father-hat-rig-led-wounded |
| father-beard-rig-carry-living-1 | family-transport-components | father-beard-rig-carry-living |
| father-beard-rig-carry-living-2 | family-transport-components | father-beard-rig-carry-living |
| father-beard-rig-carry-living-3 | family-transport-components | father-beard-rig-carry-living |
| father-beard-rig-carry-living-4 | family-transport-components | father-beard-rig-carry-living |
| father-beard-rig-carry-dead-1 | family-transport-components | father-beard-rig-carry-dead |
| father-beard-rig-carry-dead-2 | family-transport-components | father-beard-rig-carry-dead |
| father-beard-rig-carry-dead-3 | family-transport-components | father-beard-rig-carry-dead |
| father-beard-rig-carry-dead-4 | family-transport-components | father-beard-rig-carry-dead |
| father-beard-rig-led-wounded-1 | family-transport-components | father-beard-rig-led-wounded |
| father-beard-rig-led-wounded-2 | family-transport-components | father-beard-rig-led-wounded |
| father-beard-rig-led-wounded-3 | family-transport-components | father-beard-rig-led-wounded |
| father-beard-rig-led-wounded-4 | family-transport-components | father-beard-rig-led-wounded |
| father-moustache-rig-carry-living-1 | family-transport-components | father-moustache-rig-carry-living |
| father-moustache-rig-carry-living-2 | family-transport-components | father-moustache-rig-carry-living |
| father-moustache-rig-carry-living-3 | family-transport-components | father-moustache-rig-carry-living |
| father-moustache-rig-carry-living-4 | family-transport-components | father-moustache-rig-carry-living |
| father-moustache-rig-carry-dead-1 | family-transport-components | father-moustache-rig-carry-dead |
| father-moustache-rig-carry-dead-2 | family-transport-components | father-moustache-rig-carry-dead |
| father-moustache-rig-carry-dead-3 | family-transport-components | father-moustache-rig-carry-dead |
| father-moustache-rig-carry-dead-4 | family-transport-components | father-moustache-rig-carry-dead |
| father-moustache-rig-led-wounded-1 | family-transport-components | father-moustache-rig-led-wounded |
| father-moustache-rig-led-wounded-2 | family-transport-components | father-moustache-rig-led-wounded |
| father-moustache-rig-led-wounded-3 | family-transport-components | father-moustache-rig-led-wounded |
| father-moustache-rig-led-wounded-4 | family-transport-components | father-moustache-rig-led-wounded |
| father-straw-rig-carry-living-1 | family-transport-components | father-straw-rig-carry-living |
| father-straw-rig-carry-living-2 | family-transport-components | father-straw-rig-carry-living |
| father-straw-rig-carry-living-3 | family-transport-components | father-straw-rig-carry-living |
| father-straw-rig-carry-living-4 | family-transport-components | father-straw-rig-carry-living |
| father-straw-rig-carry-dead-1 | family-transport-components | father-straw-rig-carry-dead |
| father-straw-rig-carry-dead-2 | family-transport-components | father-straw-rig-carry-dead |
| father-straw-rig-carry-dead-3 | family-transport-components | father-straw-rig-carry-dead |
| father-straw-rig-carry-dead-4 | family-transport-components | father-straw-rig-carry-dead |
| father-straw-rig-led-wounded-1 | family-transport-components | father-straw-rig-led-wounded |
| father-straw-rig-led-wounded-2 | family-transport-components | father-straw-rig-led-wounded |
| father-straw-rig-led-wounded-3 | family-transport-components | father-straw-rig-led-wounded |
| father-straw-rig-led-wounded-4 | family-transport-components | father-straw-rig-led-wounded |
| teal-rig-carry-living-1 | family-transport-components | teal-rig-carry-living |
| teal-rig-carry-living-2 | family-transport-components | teal-rig-carry-living |
| teal-rig-carry-living-3 | family-transport-components | teal-rig-carry-living |
| teal-rig-carry-living-4 | family-transport-components | teal-rig-carry-living |
| teal-rig-carry-dead-1 | family-transport-components | teal-rig-carry-dead |
| teal-rig-carry-dead-2 | family-transport-components | teal-rig-carry-dead |
| teal-rig-carry-dead-3 | family-transport-components | teal-rig-carry-dead |
| teal-rig-carry-dead-4 | family-transport-components | teal-rig-carry-dead |
| teal-rig-led-wounded-1 | family-transport-components | teal-rig-led-wounded |
| teal-rig-led-wounded-2 | family-transport-components | teal-rig-led-wounded |
| teal-rig-led-wounded-3 | family-transport-components | teal-rig-led-wounded |
| teal-rig-led-wounded-4 | family-transport-components | teal-rig-led-wounded |
| rust-woman-rig-carry-living-1 | family-transport-components | rust-woman-rig-carry-living |
| rust-woman-rig-carry-living-2 | family-transport-components | rust-woman-rig-carry-living |
| rust-woman-rig-carry-living-3 | family-transport-components | rust-woman-rig-carry-living |
| rust-woman-rig-carry-living-4 | family-transport-components | rust-woman-rig-carry-living |
| rust-woman-rig-carry-dead-1 | family-transport-components | rust-woman-rig-carry-dead |
| rust-woman-rig-carry-dead-2 | family-transport-components | rust-woman-rig-carry-dead |
| rust-woman-rig-carry-dead-3 | family-transport-components | rust-woman-rig-carry-dead |
| rust-woman-rig-carry-dead-4 | family-transport-components | rust-woman-rig-carry-dead |
| rust-woman-rig-led-wounded-1 | family-transport-components | rust-woman-rig-led-wounded |
| rust-woman-rig-led-wounded-2 | family-transport-components | rust-woman-rig-led-wounded |
| rust-woman-rig-led-wounded-3 | family-transport-components | rust-woman-rig-led-wounded |
| rust-woman-rig-led-wounded-4 | family-transport-components | rust-woman-rig-led-wounded |
| indigo-rig-carry-living-1 | family-transport-components | indigo-rig-carry-living |
| indigo-rig-carry-living-2 | family-transport-components | indigo-rig-carry-living |
| indigo-rig-carry-living-3 | family-transport-components | indigo-rig-carry-living |
| indigo-rig-carry-living-4 | family-transport-components | indigo-rig-carry-living |
| indigo-rig-carry-dead-1 | family-transport-components | indigo-rig-carry-dead |
| indigo-rig-carry-dead-2 | family-transport-components | indigo-rig-carry-dead |
| indigo-rig-carry-dead-3 | family-transport-components | indigo-rig-carry-dead |
| indigo-rig-carry-dead-4 | family-transport-components | indigo-rig-carry-dead |
| indigo-rig-led-wounded-1 | family-transport-components | indigo-rig-led-wounded |
| indigo-rig-led-wounded-2 | family-transport-components | indigo-rig-led-wounded |
| indigo-rig-led-wounded-3 | family-transport-components | indigo-rig-led-wounded |
| indigo-rig-led-wounded-4 | family-transport-components | indigo-rig-led-wounded |
| mother-braid-rig-carry-living-1 | family-transport-components | mother-braid-rig-carry-living |
| mother-braid-rig-carry-living-2 | family-transport-components | mother-braid-rig-carry-living |
| mother-braid-rig-carry-living-3 | family-transport-components | mother-braid-rig-carry-living |
| mother-braid-rig-carry-living-4 | family-transport-components | mother-braid-rig-carry-living |
| mother-braid-rig-carry-dead-1 | family-transport-components | mother-braid-rig-carry-dead |
| mother-braid-rig-carry-dead-2 | family-transport-components | mother-braid-rig-carry-dead |
| mother-braid-rig-carry-dead-3 | family-transport-components | mother-braid-rig-carry-dead |
| mother-braid-rig-carry-dead-4 | family-transport-components | mother-braid-rig-carry-dead |
| mother-braid-rig-led-wounded-1 | family-transport-components | mother-braid-rig-led-wounded |
| mother-braid-rig-led-wounded-2 | family-transport-components | mother-braid-rig-led-wounded |
| mother-braid-rig-led-wounded-3 | family-transport-components | mother-braid-rig-led-wounded |
| mother-braid-rig-led-wounded-4 | family-transport-components | mother-braid-rig-led-wounded |
| mother-loose-rig-carry-living-1 | family-transport-components | mother-loose-rig-carry-living |
| mother-loose-rig-carry-living-2 | family-transport-components | mother-loose-rig-carry-living |
| mother-loose-rig-carry-living-3 | family-transport-components | mother-loose-rig-carry-living |
| mother-loose-rig-carry-living-4 | family-transport-components | mother-loose-rig-carry-living |
| mother-loose-rig-carry-dead-1 | family-transport-components | mother-loose-rig-carry-dead |
| mother-loose-rig-carry-dead-2 | family-transport-components | mother-loose-rig-carry-dead |
| mother-loose-rig-carry-dead-3 | family-transport-components | mother-loose-rig-carry-dead |
| mother-loose-rig-carry-dead-4 | family-transport-components | mother-loose-rig-carry-dead |
| mother-loose-rig-led-wounded-1 | family-transport-components | mother-loose-rig-led-wounded |
| mother-loose-rig-led-wounded-2 | family-transport-components | mother-loose-rig-led-wounded |
| mother-loose-rig-led-wounded-3 | family-transport-components | mother-loose-rig-led-wounded |
| mother-loose-rig-led-wounded-4 | family-transport-components | mother-loose-rig-led-wounded |
| mother-scarf-rig-carry-living-1 | family-transport-components | mother-scarf-rig-carry-living |
| mother-scarf-rig-carry-living-2 | family-transport-components | mother-scarf-rig-carry-living |
| mother-scarf-rig-carry-living-3 | family-transport-components | mother-scarf-rig-carry-living |
| mother-scarf-rig-carry-living-4 | family-transport-components | mother-scarf-rig-carry-living |
| mother-scarf-rig-carry-dead-1 | family-transport-components | mother-scarf-rig-carry-dead |
| mother-scarf-rig-carry-dead-2 | family-transport-components | mother-scarf-rig-carry-dead |
| mother-scarf-rig-carry-dead-3 | family-transport-components | mother-scarf-rig-carry-dead |
| mother-scarf-rig-carry-dead-4 | family-transport-components | mother-scarf-rig-carry-dead |
| mother-scarf-rig-led-wounded-1 | family-transport-components | mother-scarf-rig-led-wounded |
| mother-scarf-rig-led-wounded-2 | family-transport-components | mother-scarf-rig-led-wounded |
| mother-scarf-rig-led-wounded-3 | family-transport-components | mother-scarf-rig-led-wounded |
| mother-scarf-rig-led-wounded-4 | family-transport-components | mother-scarf-rig-led-wounded |
| mother-straw-rig-carry-living-1 | family-transport-components | mother-straw-rig-carry-living |
| mother-straw-rig-carry-living-2 | family-transport-components | mother-straw-rig-carry-living |
| mother-straw-rig-carry-living-3 | family-transport-components | mother-straw-rig-carry-living |
| mother-straw-rig-carry-living-4 | family-transport-components | mother-straw-rig-carry-living |
| mother-straw-rig-carry-dead-1 | family-transport-components | mother-straw-rig-carry-dead |
| mother-straw-rig-carry-dead-2 | family-transport-components | mother-straw-rig-carry-dead |
| mother-straw-rig-carry-dead-3 | family-transport-components | mother-straw-rig-carry-dead |
| mother-straw-rig-carry-dead-4 | family-transport-components | mother-straw-rig-carry-dead |
| mother-straw-rig-led-wounded-1 | family-transport-components | mother-straw-rig-led-wounded |
| mother-straw-rig-led-wounded-2 | family-transport-components | mother-straw-rig-led-wounded |
| mother-straw-rig-led-wounded-3 | family-transport-components | mother-straw-rig-led-wounded |
| mother-straw-rig-led-wounded-4 | family-transport-components | mother-straw-rig-led-wounded |
| blue-rig-carry-living-1 | family-transport-components | blue-rig-carry-living |
| blue-rig-carry-living-2 | family-transport-components | blue-rig-carry-living |
| blue-rig-carry-living-3 | family-transport-components | blue-rig-carry-living |
| blue-rig-carry-living-4 | family-transport-components | blue-rig-carry-living |
| blue-rig-carry-dead-1 | family-transport-components | blue-rig-carry-dead |
| blue-rig-carry-dead-2 | family-transport-components | blue-rig-carry-dead |
| blue-rig-carry-dead-3 | family-transport-components | blue-rig-carry-dead |
| blue-rig-carry-dead-4 | family-transport-components | blue-rig-carry-dead |
| blue-rig-led-wounded-1 | family-transport-components | blue-rig-led-wounded |
| blue-rig-led-wounded-2 | family-transport-components | blue-rig-led-wounded |
| blue-rig-led-wounded-3 | family-transport-components | blue-rig-led-wounded |
| blue-rig-led-wounded-4 | family-transport-components | blue-rig-led-wounded |
| youth-boy-rig-carry-living-1 | family-transport-components | youth-boy-rig-carry-living |
| youth-boy-rig-carry-living-2 | family-transport-components | youth-boy-rig-carry-living |
| youth-boy-rig-carry-living-3 | family-transport-components | youth-boy-rig-carry-living |
| youth-boy-rig-carry-living-4 | family-transport-components | youth-boy-rig-carry-living |
| youth-boy-rig-carry-dead-1 | family-transport-components | youth-boy-rig-carry-dead |
| youth-boy-rig-carry-dead-2 | family-transport-components | youth-boy-rig-carry-dead |
| youth-boy-rig-carry-dead-3 | family-transport-components | youth-boy-rig-carry-dead |
| youth-boy-rig-carry-dead-4 | family-transport-components | youth-boy-rig-carry-dead |
| youth-boy-rig-led-wounded-1 | family-transport-components | youth-boy-rig-led-wounded |
| youth-boy-rig-led-wounded-2 | family-transport-components | youth-boy-rig-led-wounded |
| youth-boy-rig-led-wounded-3 | family-transport-components | youth-boy-rig-led-wounded |
| youth-boy-rig-led-wounded-4 | family-transport-components | youth-boy-rig-led-wounded |
| blue-girl-rig-carry-living-1 | family-transport-components | blue-girl-rig-carry-living |
| blue-girl-rig-carry-living-2 | family-transport-components | blue-girl-rig-carry-living |
| blue-girl-rig-carry-living-3 | family-transport-components | blue-girl-rig-carry-living |
| blue-girl-rig-carry-living-4 | family-transport-components | blue-girl-rig-carry-living |
| blue-girl-rig-carry-dead-1 | family-transport-components | blue-girl-rig-carry-dead |
| blue-girl-rig-carry-dead-2 | family-transport-components | blue-girl-rig-carry-dead |
| blue-girl-rig-carry-dead-3 | family-transport-components | blue-girl-rig-carry-dead |
| blue-girl-rig-carry-dead-4 | family-transport-components | blue-girl-rig-carry-dead |
| blue-girl-rig-led-wounded-1 | family-transport-components | blue-girl-rig-led-wounded |
| blue-girl-rig-led-wounded-2 | family-transport-components | blue-girl-rig-led-wounded |
| blue-girl-rig-led-wounded-3 | family-transport-components | blue-girl-rig-led-wounded |
| blue-girl-rig-led-wounded-4 | family-transport-components | blue-girl-rig-led-wounded |
| youth-girl-rig-carry-living-1 | family-transport-components | youth-girl-rig-carry-living |
| youth-girl-rig-carry-living-2 | family-transport-components | youth-girl-rig-carry-living |
| youth-girl-rig-carry-living-3 | family-transport-components | youth-girl-rig-carry-living |
| youth-girl-rig-carry-living-4 | family-transport-components | youth-girl-rig-carry-living |
| youth-girl-rig-carry-dead-1 | family-transport-components | youth-girl-rig-carry-dead |
| youth-girl-rig-carry-dead-2 | family-transport-components | youth-girl-rig-carry-dead |
| youth-girl-rig-carry-dead-3 | family-transport-components | youth-girl-rig-carry-dead |
| youth-girl-rig-carry-dead-4 | family-transport-components | youth-girl-rig-carry-dead |
| youth-girl-rig-led-wounded-1 | family-transport-components | youth-girl-rig-led-wounded |
| youth-girl-rig-led-wounded-2 | family-transport-components | youth-girl-rig-led-wounded |
| youth-girl-rig-led-wounded-3 | family-transport-components | youth-girl-rig-led-wounded |
| youth-girl-rig-led-wounded-4 | family-transport-components | youth-girl-rig-led-wounded |
| boy-rig-carry-living-1 | family-transport-components | boy-rig-carry-living |
| boy-rig-carry-living-2 | family-transport-components | boy-rig-carry-living |
| boy-rig-carry-living-3 | family-transport-components | boy-rig-carry-living |
| boy-rig-carry-living-4 | family-transport-components | boy-rig-carry-living |
| boy-rig-carry-dead-1 | family-transport-components | boy-rig-carry-dead |
| boy-rig-carry-dead-2 | family-transport-components | boy-rig-carry-dead |
| boy-rig-carry-dead-3 | family-transport-components | boy-rig-carry-dead |
| boy-rig-carry-dead-4 | family-transport-components | boy-rig-carry-dead |
| boy-rig-led-wounded-1 | family-transport-components | boy-rig-led-wounded |
| boy-rig-led-wounded-2 | family-transport-components | boy-rig-led-wounded |
| boy-rig-led-wounded-3 | family-transport-components | boy-rig-led-wounded |
| boy-rig-led-wounded-4 | family-transport-components | boy-rig-led-wounded |
| girl-rig-carry-living-1 | family-transport-components | girl-rig-carry-living |
| girl-rig-carry-living-2 | family-transport-components | girl-rig-carry-living |
| girl-rig-carry-living-3 | family-transport-components | girl-rig-carry-living |
| girl-rig-carry-living-4 | family-transport-components | girl-rig-carry-living |
| girl-rig-carry-dead-1 | family-transport-components | girl-rig-carry-dead |
| girl-rig-carry-dead-2 | family-transport-components | girl-rig-carry-dead |
| girl-rig-carry-dead-3 | family-transport-components | girl-rig-carry-dead |
| girl-rig-carry-dead-4 | family-transport-components | girl-rig-carry-dead |
| girl-rig-led-wounded-1 | family-transport-components | girl-rig-led-wounded |
| girl-rig-led-wounded-2 | family-transport-components | girl-rig-led-wounded |
| girl-rig-led-wounded-3 | family-transport-components | girl-rig-led-wounded |
| girl-rig-led-wounded-4 | family-transport-components | girl-rig-led-wounded |
| smallchild-rig-carry-living-1 | family-transport-components | smallchild-rig-carry-living |
| smallchild-rig-carry-living-2 | family-transport-components | smallchild-rig-carry-living |
| smallchild-rig-carry-living-3 | family-transport-components | smallchild-rig-carry-living |
| smallchild-rig-carry-living-4 | family-transport-components | smallchild-rig-carry-living |
| smallchild-rig-carry-dead-1 | family-transport-components | smallchild-rig-carry-dead |
| smallchild-rig-carry-dead-2 | family-transport-components | smallchild-rig-carry-dead |
| smallchild-rig-carry-dead-3 | family-transport-components | smallchild-rig-carry-dead |
| smallchild-rig-carry-dead-4 | family-transport-components | smallchild-rig-carry-dead |
| infant-rig-carry-living-1 | family-transport-components | infant-rig-carry-living |
| infant-rig-carry-living-2 | family-transport-components | infant-rig-carry-living |
| infant-rig-carry-living-3 | family-transport-components | infant-rig-carry-living |
| infant-rig-carry-living-4 | family-transport-components | infant-rig-carry-living |
| infant-rig-carry-dead-1 | family-transport-components | infant-rig-carry-dead |
| infant-rig-carry-dead-2 | family-transport-components | infant-rig-carry-dead |
| infant-rig-carry-dead-3 | family-transport-components | infant-rig-carry-dead |
| infant-rig-carry-dead-4 | family-transport-components | infant-rig-carry-dead |

## Animation families

| Clip | Method | Frames | Duration (ms) | Loop | Direction |
| --- | --- | ---: | ---: | --- | --- |
| volunteer-parapet-fire-e | Pose cycle | 4 | 3600 | yes | east |
| volunteer-parapet-fire-w | Pose cycle | 4 | 3600 | yes | west |
| volunteer-parapet-fire-n | Pose cycle | 4 | 3600 | yes | north |
| volunteer-parapet-fire-s | Pose cycle | 4 | 3600 | yes | south |
| travis-battery-fire-e | Pose cycle | 4 | 3600 | yes | east |
| travis-battery-fire-w | Pose cycle | 4 | 3600 | yes | west |
| travis-battery-fire-n | Pose cycle | 4 | 3600 | yes | north |
| travis-battery-fire-s | Pose cycle | 4 | 3600 | yes | south |
| volunteer-trot-e | Pose cycle | 4 | 720 | yes | east; west by mirroring |
| volunteer-trot-s | Pose cycle | 4 | 720 | yes | south |
| volunteer-trot-n | Pose cycle | 4 | 720 | yes | north |
| lancer-upright-march-e | Pose cycle | 4 | 1040 | yes | east |
| lancer-upright-idle-e | Pose cycle | 4 | 3400 | yes | east |
| lancer-upright-march-s | Pose cycle | 4 | 1040 | yes | south |
| lancer-upright-idle-s | Pose cycle | 4 | 3400 | yes | south |
| lancer-upright-march-n | Pose cycle | 4 | 1040 | yes | north |
| lancer-upright-idle-n | Pose cycle | 4 | 3400 | yes | north |
| cannon-alamo-north-e-recoil | Pose cycle | 2 | 900 | one-shot | east |
| cannon-alamo-north-w-recoil | Pose cycle | 2 | 900 | one-shot | west |
| cannon-alamo-church-e-recoil | Pose cycle | 2 | 900 | one-shot | east |
| cannon-alamo-church-w-recoil | Pose cycle | 2 | 900 | one-shot | west |
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
| camp-wedge-cream | Pose cycle | 2 | 1400 | yes | undefined |
| camp-wedge-gray | Pose cycle | 2 | 1400 | yes | undefined |
| camp-cookfire | Pose cycle | 4 | 1000 | yes | undefined |
| camp-pennant-ochre | Pose cycle | 2 | 900 | yes | undefined |
| camp-pennant-rust | Pose cycle | 2 | 900 | yes | undefined |
| volunteer-gun-ram | Pose cycle | 4 | 1160 | one-shot | east; west by mirroring |
| volunteer-gun-shot-carry | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| volunteer-gun-fire | Pose cycle | 2 | 1060 | one-shot | east; west by mirroring |
| regular-gun-ram | Pose cycle | 4 | 1160 | one-shot | east; west by mirroring |
| regular-gun-shot-carry | Pose cycle | 2 | 840 | yes | east; west by mirroring |
| regular-gun-fire | Pose cycle | 2 | 1060 | one-shot | east; west by mirroring |
| volunteer-bank-climb | Pose cycle | 6 | 2950 | yes | east; west by mirroring |
| regular-bugler-call | Pose cycle | 4 | 1340 | one-shot | east; mirror for west |
| white-flag-regular-walk-e | Pose cycle | 2 | 560 | yes | east |
| white-flag-volunteer-walk-e | Pose cycle | 2 | 560 | yes | east |
| bexar-woman-walk | Pose cycle | 4 | 720 | yes | east |
| bexar-elder-walk | Pose cycle | 4 | 720 | yes | east |
| bexar-child-walk | Pose cycle | 4 | 720 | yes | east |
| bexar-older-woman-walk | Pose cycle | 4 | 720 | yes | east |
| regular-loophole-fire-reload | Pose cycle | 4 | 2470 | one-shot | east |
| cane-wind | Still state | 1 | 900 | yes | not applicable |
| grass-tall-wind | Still state | 1 | 900 | yes | not applicable |
| tree-anacua-gale | Pose cycle | 2 | 1200 | yes | undefined |
| tree-texas-ebony-gale | Pose cycle | 2 | 1200 | yes | undefined |
| tree-water-tupelo-gale | Pose cycle | 2 | 1200 | yes | not applicable |
| tree-cedar-elm-gale | Pose cycle | 2 | 1200 | yes | undefined |
| tree-black-willow-gale | Pose cycle | 2 | 1200 | yes | undefined |
| tree-black-willow-pole-gale | Pose cycle | 2 | 1200 | yes | undefined |
| pine-longleaf-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| palm-sabal-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| pine-longleaf-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| palm-sabal-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| pine-longleaf-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| palm-sabal-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| cypress-bald-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| cypress-bald-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| cypress-bald-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| magnolia-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| beech-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| magnolia-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| beech-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
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
| rust-woman-wagon-driver-s | Pose cycle | 2 | 1200 | yes | south |
| rust-woman-wagon-driver-e | Pose cycle | 2 | 1200 | yes | east |
| rust-woman-wagon-driver-w | Pose cycle | 2 | 1200 | yes | west |
| rust-woman-wagon-driver-n | Pose cycle | 2 | 1200 | yes | north |
| indigo-wagon-driver-s | Pose cycle | 2 | 1200 | yes | south |
| indigo-wagon-driver-e | Pose cycle | 2 | 1200 | yes | east |
| indigo-wagon-driver-w | Pose cycle | 2 | 1200 | yes | west |
| indigo-wagon-driver-n | Pose cycle | 2 | 1200 | yes | north |
| ochre-wagon-driver-s | Pose cycle | 2 | 1200 | yes | south |
| ochre-wagon-driver-e | Pose cycle | 2 | 1200 | yes | east |
| ochre-wagon-driver-w | Pose cycle | 2 | 1200 | yes | west |
| ochre-wagon-driver-n | Pose cycle | 2 | 1200 | yes | north |
| blue-girl-wagon-driver-s | Pose cycle | 2 | 1200 | yes | south |
| blue-girl-wagon-driver-e | Pose cycle | 2 | 1200 | yes | east |
| blue-girl-wagon-driver-w | Pose cycle | 2 | 1200 | yes | west |
| blue-girl-wagon-driver-n | Pose cycle | 2 | 1200 | yes | north |
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
| dragoon-fire | Pose cycle | 4 | 1000 | one-shot | east; west by mirroring |
| lancer-charge | Pose cycle | 4 | 640 | yes | east; west by mirroring |
| girl-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| girl-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| girl-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| boy-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| boy-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| boy-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| smallchild-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| smallchild-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| smallchild-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| girl-speak | Pose cycle | 2 | 1000 | yes | undefined |
| girl-listen-s | breathe | 1 | 2200 | yes | undefined |
| girl-listen-n | breathe | 1 | 2200 | yes | undefined |
| boy-speak | Pose cycle | 2 | 1000 | yes | undefined |
| boy-listen-s | breathe | 1 | 2200 | yes | undefined |
| boy-listen-n | breathe | 1 | 2200 | yes | undefined |
| smallchild-speak | Pose cycle | 2 | 1000 | yes | undefined |
| smallchild-listen-s | breathe | 1 | 2200 | yes | undefined |
| smallchild-listen-n | breathe | 1 | 2200 | yes | undefined |
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
| regular-prone-fire-reload | Pose cycle | 4 | 2470 | one-shot | east; west by mirroring |
| tree-water-oak-gale | Pose cycle | 2 | 1200 | yes | not applicable |
| tree-bur-oak-gale | Pose cycle | 2 | 1200 | yes | undefined |
| tree-white-oak-gale | Pose cycle | 2 | 1200 | yes | undefined |
| tree-texas-oak-gale | Pose cycle | 2 | 1200 | yes | undefined |
| tree-hickory-gale | Pose cycle | 2 | 1200 | yes | undefined |
| tree-walnut-gale | Pose cycle | 2 | 1200 | yes | undefined |
| tree-ash-gale | Pose cycle | 2 | 1200 | yes | undefined |
| river-bend | Pose cycle | 4 | 1400 | yes | undefined |
| limber-mules-walk-e | Pose cycle | 4 | 880 | yes | east |
| limber-mules-walk-s | Pose cycle | 4 | 880 | yes | south |
| limber-mules-walk-n | Pose cycle | 4 | 880 | yes | north |
| padre-walk | Pose cycle | 4 | 960 | yes | east |
| casualty-cart-wounded | Pose cycle | 4 | 960 | yes | east |
| casualty-cart-covered | Pose cycle | 4 | 960 | yes | east |
| pine-loblolly-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| cedar-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| pine-loblolly-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| cedar-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| pine-loblolly-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| cedar-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| volunteer-fallen-carry | Pose cycle | 4 | 1600 | yes | east; west by mirroring |
| regular-fallen-carry | Pose cycle | 4 | 1600 | yes | east; west by mirroring |
| mother-scarf-walk | Pose cycle | 4 | 800 | yes | east; mirror for west |
| mother-scarf-walk-s | Pose cycle | 2 | 560 | yes | south |
| mother-scarf-walk-n | Pose cycle | 2 | 560 | yes | north |
| mother-scarf-idle-s | breathe | 1 | 1500 | yes | south |
| mother-scarf-idle-e | breathe | 1 | 1500 | yes | east |
| mother-scarf-idle-n | breathe | 1 | 1500 | yes | north |
| mother-scarf-rest | Still state | 1 | 1500 | yes | undefined |
| mother-scarf-injured-rest | Still state | 1 | 1500 | yes | undefined |
| mother-scarf-work | Pose cycle | 2 | 1300 | yes | undefined |
| mother-scarf-listen-s | breathe | 1 | 1500 | yes | undefined |
| mother-scarf-listen-n | breathe | 1 | 1500 | yes | undefined |
| mother-scarf-speak | breathe | 1 | 1500 | yes | undefined |
| father-straw-walk | Pose cycle | 4 | 800 | yes | east; mirror for west |
| father-straw-walk-s | Pose cycle | 2 | 560 | yes | south |
| father-straw-walk-n | Pose cycle | 2 | 560 | yes | north |
| father-straw-idle-s | breathe | 1 | 1500 | yes | south |
| father-straw-idle-e | breathe | 1 | 1500 | yes | east |
| father-straw-idle-n | breathe | 1 | 1500 | yes | north |
| father-straw-rest | Still state | 1 | 1500 | yes | undefined |
| father-straw-injured-rest | Still state | 1 | 1500 | yes | undefined |
| father-straw-work | Pose cycle | 2 | 1300 | yes | undefined |
| father-straw-listen-s | breathe | 1 | 1500 | yes | undefined |
| father-straw-listen-n | breathe | 1 | 1500 | yes | undefined |
| father-straw-speak | breathe | 1 | 1500 | yes | undefined |
| father-beard-walk | Pose cycle | 4 | 800 | yes | east; mirror for west |
| father-beard-walk-s | Pose cycle | 2 | 560 | yes | south |
| father-beard-walk-n | Pose cycle | 2 | 560 | yes | north |
| father-beard-idle-s | breathe | 1 | 1500 | yes | south |
| father-beard-idle-e | breathe | 1 | 1500 | yes | east |
| father-beard-idle-n | breathe | 1 | 1500 | yes | north |
| father-beard-rest | Still state | 1 | 1500 | yes | undefined |
| father-beard-injured-rest | Still state | 1 | 1500 | yes | undefined |
| father-beard-work | Pose cycle | 2 | 1300 | yes | undefined |
| father-beard-listen-s | breathe | 1 | 1500 | yes | undefined |
| father-beard-listen-n | breathe | 1 | 1500 | yes | undefined |
| father-beard-speak | breathe | 1 | 1500 | yes | undefined |
| father-moustache-walk | Pose cycle | 4 | 800 | yes | east; mirror for west |
| father-moustache-walk-s | Pose cycle | 2 | 560 | yes | south |
| father-moustache-walk-n | Pose cycle | 2 | 560 | yes | north |
| father-moustache-idle-s | breathe | 1 | 1500 | yes | south |
| father-moustache-idle-e | breathe | 1 | 1500 | yes | east |
| father-moustache-idle-n | breathe | 1 | 1500 | yes | north |
| father-moustache-rest | Still state | 1 | 1500 | yes | undefined |
| father-moustache-injured-rest | Still state | 1 | 1500 | yes | undefined |
| father-moustache-work | Pose cycle | 2 | 1300 | yes | undefined |
| father-moustache-listen-s | breathe | 1 | 1500 | yes | undefined |
| father-moustache-listen-n | breathe | 1 | 1500 | yes | undefined |
| father-moustache-speak | breathe | 1 | 1500 | yes | undefined |
| mother-braid-walk | Pose cycle | 4 | 800 | yes | east; mirror for west |
| mother-braid-walk-s | Pose cycle | 2 | 560 | yes | south |
| mother-braid-walk-n | Pose cycle | 2 | 560 | yes | north |
| mother-braid-idle-s | breathe | 1 | 1500 | yes | south |
| mother-braid-idle-e | breathe | 1 | 1500 | yes | east |
| mother-braid-idle-n | breathe | 1 | 1500 | yes | north |
| mother-braid-rest | Still state | 1 | 1500 | yes | undefined |
| mother-braid-injured-rest | Still state | 1 | 1500 | yes | undefined |
| mother-braid-work | Pose cycle | 2 | 1300 | yes | undefined |
| mother-braid-listen-s | breathe | 1 | 1500 | yes | undefined |
| mother-braid-listen-n | breathe | 1 | 1500 | yes | undefined |
| mother-braid-speak | breathe | 1 | 1500 | yes | undefined |
| mother-loose-walk | Pose cycle | 4 | 800 | yes | east; mirror for west |
| mother-loose-walk-s | Pose cycle | 2 | 560 | yes | south |
| mother-loose-walk-n | Pose cycle | 2 | 560 | yes | north |
| mother-loose-idle-s | breathe | 1 | 1500 | yes | south |
| mother-loose-idle-e | breathe | 1 | 1500 | yes | east |
| mother-loose-idle-n | breathe | 1 | 1500 | yes | north |
| mother-loose-rest | Still state | 1 | 1500 | yes | undefined |
| mother-loose-injured-rest | Still state | 1 | 1500 | yes | undefined |
| mother-loose-work | Pose cycle | 2 | 1300 | yes | undefined |
| mother-loose-listen-s | breathe | 1 | 1500 | yes | undefined |
| mother-loose-listen-n | breathe | 1 | 1500 | yes | undefined |
| mother-loose-speak | breathe | 1 | 1500 | yes | undefined |
| mother-straw-walk | Pose cycle | 4 | 800 | yes | east; mirror for west |
| mother-straw-walk-s | Pose cycle | 2 | 560 | yes | south |
| mother-straw-walk-n | Pose cycle | 2 | 560 | yes | north |
| mother-straw-idle-s | breathe | 1 | 1500 | yes | south |
| mother-straw-idle-e | breathe | 1 | 1500 | yes | east |
| mother-straw-idle-n | breathe | 1 | 1500 | yes | north |
| mother-straw-rest | Still state | 1 | 1500 | yes | undefined |
| mother-straw-injured-rest | Still state | 1 | 1500 | yes | undefined |
| mother-straw-work | Pose cycle | 2 | 1300 | yes | undefined |
| mother-straw-listen-s | breathe | 1 | 1500 | yes | undefined |
| mother-straw-listen-n | breathe | 1 | 1500 | yes | undefined |
| mother-straw-speak | breathe | 1 | 1500 | yes | undefined |
| youth-boy-walk | Pose cycle | 4 | 800 | yes | east; mirror for west |
| youth-boy-walk-s | Pose cycle | 2 | 560 | yes | south |
| youth-boy-walk-n | Pose cycle | 2 | 560 | yes | north |
| youth-boy-idle-s | breathe | 1 | 1500 | yes | south |
| youth-boy-idle-e | breathe | 1 | 1500 | yes | east |
| youth-boy-idle-n | breathe | 1 | 1500 | yes | north |
| youth-boy-rest | Still state | 1 | 1500 | yes | undefined |
| youth-boy-injured-rest | Still state | 1 | 1500 | yes | undefined |
| youth-boy-work | Pose cycle | 2 | 1300 | yes | undefined |
| youth-boy-listen-s | breathe | 1 | 1500 | yes | undefined |
| youth-boy-listen-n | breathe | 1 | 1500 | yes | undefined |
| youth-boy-speak | breathe | 1 | 1500 | yes | undefined |
| youth-girl-walk | Pose cycle | 4 | 800 | yes | east; mirror for west |
| youth-girl-walk-s | Pose cycle | 2 | 560 | yes | south |
| youth-girl-walk-n | Pose cycle | 2 | 560 | yes | north |
| youth-girl-idle-s | breathe | 1 | 1500 | yes | south |
| youth-girl-idle-e | breathe | 1 | 1500 | yes | east |
| youth-girl-idle-n | breathe | 1 | 1500 | yes | north |
| youth-girl-rest | Still state | 1 | 1500 | yes | undefined |
| youth-girl-injured-rest | Still state | 1 | 1500 | yes | undefined |
| youth-girl-work | Pose cycle | 2 | 1300 | yes | undefined |
| youth-girl-listen-s | breathe | 1 | 1500 | yes | undefined |
| youth-girl-listen-n | breathe | 1 | 1500 | yes | undefined |
| youth-girl-speak | breathe | 1 | 1500 | yes | undefined |
| father-hat-walk | Pose cycle | 4 | 800 | yes | east; mirror for west |
| father-hat-walk-s | Pose cycle | 2 | 560 | yes | south |
| father-hat-walk-n | Pose cycle | 2 | 560 | yes | north |
| father-hat-idle-s | breathe | 1 | 1500 | yes | south |
| father-hat-idle-e | breathe | 1 | 1500 | yes | east |
| father-hat-idle-n | breathe | 1 | 1500 | yes | north |
| father-hat-rest | Still state | 1 | 1500 | yes | undefined |
| father-hat-injured-rest | Still state | 1 | 1500 | yes | undefined |
| father-hat-work | Pose cycle | 2 | 1300 | yes | undefined |
| father-hat-listen-s | breathe | 1 | 1500 | yes | undefined |
| father-hat-listen-n | breathe | 1 | 1500 | yes | undefined |
| father-hat-speak | breathe | 1 | 1500 | yes | undefined |
| rust-rig-idle-s | breathe | 1 | 1200 | yes | south |
| rust-rig-idle-e | breathe | 1 | 1200 | yes | east |
| rust-rig-idle-w | breathe | 1 | 1200 | yes | west |
| rust-rig-idle-n | breathe | 1 | 1200 | yes | north |
| rust-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| rust-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| rust-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| rust-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| rust-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| rust-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| rust-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| rust-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| rust-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| rust-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| rust-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| rust-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| rust-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| rust-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| rust-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| rust-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| rust-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| rust-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| rust-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| rust-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| rust-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| rust-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| rust-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| rust-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| elder-rig-idle-s | breathe | 1 | 1200 | yes | south |
| elder-rig-idle-e | breathe | 1 | 1200 | yes | east |
| elder-rig-idle-w | breathe | 1 | 1200 | yes | west |
| elder-rig-idle-n | breathe | 1 | 1200 | yes | north |
| elder-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| elder-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| elder-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| elder-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| elder-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| elder-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| elder-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| elder-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| elder-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| elder-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| elder-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| elder-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| elder-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| elder-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| elder-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| elder-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| elder-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| elder-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| elder-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| elder-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| elder-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| elder-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| elder-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| elder-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| ochre-rig-idle-s | breathe | 1 | 1200 | yes | south |
| ochre-rig-idle-e | breathe | 1 | 1200 | yes | east |
| ochre-rig-idle-w | breathe | 1 | 1200 | yes | west |
| ochre-rig-idle-n | breathe | 1 | 1200 | yes | north |
| ochre-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| ochre-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| ochre-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| ochre-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| ochre-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| ochre-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| ochre-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| ochre-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| ochre-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| ochre-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| ochre-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| ochre-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| ochre-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| ochre-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| ochre-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| ochre-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| ochre-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| ochre-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| ochre-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| ochre-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| ochre-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| ochre-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| ochre-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| ochre-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| father-hat-rig-idle-s | breathe | 1 | 1200 | yes | south |
| father-hat-rig-idle-e | breathe | 1 | 1200 | yes | east |
| father-hat-rig-idle-w | breathe | 1 | 1200 | yes | west |
| father-hat-rig-idle-n | breathe | 1 | 1200 | yes | north |
| father-hat-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| father-hat-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| father-hat-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| father-hat-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| father-hat-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| father-hat-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| father-hat-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| father-hat-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| father-hat-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| father-hat-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| father-hat-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| father-hat-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| father-hat-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| father-hat-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| father-hat-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| father-hat-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-hat-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-hat-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-hat-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-hat-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| father-hat-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| father-hat-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| father-hat-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| father-hat-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| father-beard-rig-idle-s | breathe | 1 | 1200 | yes | south |
| father-beard-rig-idle-e | breathe | 1 | 1200 | yes | east |
| father-beard-rig-idle-w | breathe | 1 | 1200 | yes | west |
| father-beard-rig-idle-n | breathe | 1 | 1200 | yes | north |
| father-beard-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| father-beard-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| father-beard-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| father-beard-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| father-beard-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| father-beard-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| father-beard-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| father-beard-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| father-beard-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| father-beard-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| father-beard-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| father-beard-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| father-beard-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| father-beard-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| father-beard-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| father-beard-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-beard-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-beard-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-beard-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-beard-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| father-beard-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| father-beard-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| father-beard-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| father-beard-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| father-moustache-rig-idle-s | breathe | 1 | 1200 | yes | south |
| father-moustache-rig-idle-e | breathe | 1 | 1200 | yes | east |
| father-moustache-rig-idle-w | breathe | 1 | 1200 | yes | west |
| father-moustache-rig-idle-n | breathe | 1 | 1200 | yes | north |
| father-moustache-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| father-moustache-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| father-moustache-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| father-moustache-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| father-moustache-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| father-moustache-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| father-moustache-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| father-moustache-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| father-moustache-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| father-moustache-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| father-moustache-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| father-moustache-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| father-moustache-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| father-moustache-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| father-moustache-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| father-moustache-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-moustache-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-moustache-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-moustache-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-moustache-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| father-moustache-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| father-moustache-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| father-moustache-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| father-moustache-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| father-straw-rig-idle-s | breathe | 1 | 1200 | yes | south |
| father-straw-rig-idle-e | breathe | 1 | 1200 | yes | east |
| father-straw-rig-idle-w | breathe | 1 | 1200 | yes | west |
| father-straw-rig-idle-n | breathe | 1 | 1200 | yes | north |
| father-straw-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| father-straw-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| father-straw-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| father-straw-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| father-straw-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| father-straw-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| father-straw-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| father-straw-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| father-straw-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| father-straw-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| father-straw-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| father-straw-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| father-straw-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| father-straw-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| father-straw-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| father-straw-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-straw-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-straw-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-straw-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| father-straw-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| father-straw-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| father-straw-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| father-straw-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| father-straw-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| teal-rig-idle-s | breathe | 1 | 1200 | yes | south |
| teal-rig-idle-e | breathe | 1 | 1200 | yes | east |
| teal-rig-idle-w | breathe | 1 | 1200 | yes | west |
| teal-rig-idle-n | breathe | 1 | 1200 | yes | north |
| teal-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| teal-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| teal-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| teal-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| teal-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| teal-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| teal-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| teal-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| teal-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| teal-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| teal-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| teal-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| teal-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| teal-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| teal-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| teal-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| teal-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| teal-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| teal-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| teal-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| teal-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| teal-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| teal-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| teal-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| rust-woman-rig-idle-s | breathe | 1 | 1200 | yes | south |
| rust-woman-rig-idle-e | breathe | 1 | 1200 | yes | east |
| rust-woman-rig-idle-w | breathe | 1 | 1200 | yes | west |
| rust-woman-rig-idle-n | breathe | 1 | 1200 | yes | north |
| rust-woman-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| rust-woman-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| rust-woman-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| rust-woman-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| rust-woman-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| rust-woman-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| rust-woman-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| rust-woman-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| rust-woman-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| rust-woman-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| rust-woman-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| rust-woman-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| rust-woman-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| rust-woman-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| rust-woman-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| rust-woman-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| rust-woman-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| rust-woman-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| rust-woman-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| rust-woman-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| rust-woman-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| rust-woman-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| rust-woman-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| rust-woman-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| indigo-rig-idle-s | breathe | 1 | 1200 | yes | south |
| indigo-rig-idle-e | breathe | 1 | 1200 | yes | east |
| indigo-rig-idle-w | breathe | 1 | 1200 | yes | west |
| indigo-rig-idle-n | breathe | 1 | 1200 | yes | north |
| indigo-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| indigo-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| indigo-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| indigo-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| indigo-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| indigo-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| indigo-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| indigo-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| indigo-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| indigo-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| indigo-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| indigo-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| indigo-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| indigo-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| indigo-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| indigo-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| indigo-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| indigo-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| indigo-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| indigo-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| indigo-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| indigo-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| indigo-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| indigo-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| mother-braid-rig-idle-s | breathe | 1 | 1200 | yes | south |
| mother-braid-rig-idle-e | breathe | 1 | 1200 | yes | east |
| mother-braid-rig-idle-w | breathe | 1 | 1200 | yes | west |
| mother-braid-rig-idle-n | breathe | 1 | 1200 | yes | north |
| mother-braid-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| mother-braid-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| mother-braid-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| mother-braid-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| mother-braid-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| mother-braid-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| mother-braid-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| mother-braid-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| mother-braid-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| mother-braid-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| mother-braid-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| mother-braid-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| mother-braid-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| mother-braid-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| mother-braid-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| mother-braid-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-braid-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-braid-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-braid-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-braid-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| mother-braid-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| mother-braid-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| mother-braid-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| mother-braid-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| mother-loose-rig-idle-s | breathe | 1 | 1200 | yes | south |
| mother-loose-rig-idle-e | breathe | 1 | 1200 | yes | east |
| mother-loose-rig-idle-w | breathe | 1 | 1200 | yes | west |
| mother-loose-rig-idle-n | breathe | 1 | 1200 | yes | north |
| mother-loose-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| mother-loose-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| mother-loose-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| mother-loose-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| mother-loose-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| mother-loose-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| mother-loose-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| mother-loose-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| mother-loose-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| mother-loose-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| mother-loose-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| mother-loose-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| mother-loose-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| mother-loose-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| mother-loose-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| mother-loose-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-loose-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-loose-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-loose-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-loose-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| mother-loose-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| mother-loose-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| mother-loose-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| mother-loose-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| mother-scarf-rig-idle-s | breathe | 1 | 1200 | yes | south |
| mother-scarf-rig-idle-e | breathe | 1 | 1200 | yes | east |
| mother-scarf-rig-idle-w | breathe | 1 | 1200 | yes | west |
| mother-scarf-rig-idle-n | breathe | 1 | 1200 | yes | north |
| mother-scarf-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| mother-scarf-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| mother-scarf-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| mother-scarf-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| mother-scarf-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| mother-scarf-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| mother-scarf-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| mother-scarf-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| mother-scarf-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| mother-scarf-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| mother-scarf-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| mother-scarf-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| mother-scarf-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| mother-scarf-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| mother-scarf-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| mother-scarf-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-scarf-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-scarf-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-scarf-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-scarf-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| mother-scarf-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| mother-scarf-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| mother-scarf-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| mother-scarf-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| mother-straw-rig-idle-s | breathe | 1 | 1200 | yes | south |
| mother-straw-rig-idle-e | breathe | 1 | 1200 | yes | east |
| mother-straw-rig-idle-w | breathe | 1 | 1200 | yes | west |
| mother-straw-rig-idle-n | breathe | 1 | 1200 | yes | north |
| mother-straw-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| mother-straw-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| mother-straw-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| mother-straw-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| mother-straw-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| mother-straw-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| mother-straw-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| mother-straw-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| mother-straw-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| mother-straw-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| mother-straw-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| mother-straw-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| mother-straw-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| mother-straw-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| mother-straw-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| mother-straw-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-straw-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-straw-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-straw-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| mother-straw-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| mother-straw-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| mother-straw-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| mother-straw-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| mother-straw-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| blue-rig-idle-s | breathe | 1 | 1200 | yes | south |
| blue-rig-idle-e | breathe | 1 | 1200 | yes | east |
| blue-rig-idle-w | breathe | 1 | 1200 | yes | west |
| blue-rig-idle-n | breathe | 1 | 1200 | yes | north |
| blue-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| blue-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| blue-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| blue-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| blue-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| blue-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| blue-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| blue-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| blue-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| blue-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| blue-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| blue-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| blue-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| blue-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| blue-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| blue-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| blue-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| blue-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| blue-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| blue-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| blue-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| blue-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| blue-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| blue-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| youth-boy-rig-idle-s | breathe | 1 | 1200 | yes | south |
| youth-boy-rig-idle-e | breathe | 1 | 1200 | yes | east |
| youth-boy-rig-idle-w | breathe | 1 | 1200 | yes | west |
| youth-boy-rig-idle-n | breathe | 1 | 1200 | yes | north |
| youth-boy-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| youth-boy-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| youth-boy-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| youth-boy-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| youth-boy-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| youth-boy-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| youth-boy-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| youth-boy-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| youth-boy-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| youth-boy-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| youth-boy-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| youth-boy-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| youth-boy-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| youth-boy-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| youth-boy-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| youth-boy-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| youth-boy-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| youth-boy-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| youth-boy-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| youth-boy-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| youth-boy-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| youth-boy-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| youth-boy-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| youth-boy-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| blue-girl-rig-idle-s | breathe | 1 | 1200 | yes | south |
| blue-girl-rig-idle-e | breathe | 1 | 1200 | yes | east |
| blue-girl-rig-idle-w | breathe | 1 | 1200 | yes | west |
| blue-girl-rig-idle-n | breathe | 1 | 1200 | yes | north |
| blue-girl-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| blue-girl-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| blue-girl-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| blue-girl-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| blue-girl-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| blue-girl-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| blue-girl-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| blue-girl-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| blue-girl-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| blue-girl-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| blue-girl-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| blue-girl-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| blue-girl-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| blue-girl-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| blue-girl-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| blue-girl-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| blue-girl-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| blue-girl-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| blue-girl-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| blue-girl-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| blue-girl-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| blue-girl-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| blue-girl-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| blue-girl-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| youth-girl-rig-idle-s | breathe | 1 | 1200 | yes | south |
| youth-girl-rig-idle-e | breathe | 1 | 1200 | yes | east |
| youth-girl-rig-idle-w | breathe | 1 | 1200 | yes | west |
| youth-girl-rig-idle-n | breathe | 1 | 1200 | yes | north |
| youth-girl-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| youth-girl-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| youth-girl-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| youth-girl-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| youth-girl-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| youth-girl-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| youth-girl-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| youth-girl-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| youth-girl-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| youth-girl-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| youth-girl-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| youth-girl-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| youth-girl-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| youth-girl-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| youth-girl-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| youth-girl-rig-mounted-fire-e | Pose cycle | 4 | 2470 | one-shot | undefined |
| youth-girl-rig-mounted-fire-s | Pose cycle | 4 | 2470 | one-shot | undefined |
| youth-girl-rig-mounted-fire-n | Pose cycle | 4 | 2470 | one-shot | undefined |
| youth-girl-rig-fire-reload | Pose cycle | 4 | 2470 | one-shot | undefined |
| youth-girl-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| youth-girl-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| youth-girl-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| youth-girl-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| youth-girl-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| boy-rig-idle-s | breathe | 1 | 1200 | yes | south |
| boy-rig-idle-e | breathe | 1 | 1200 | yes | east |
| boy-rig-idle-w | breathe | 1 | 1200 | yes | west |
| boy-rig-idle-n | breathe | 1 | 1200 | yes | north |
| boy-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| boy-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| boy-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| boy-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| boy-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| boy-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| boy-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| boy-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| boy-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| boy-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| boy-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| boy-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| boy-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| boy-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| boy-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| boy-rig-comfort | Pose cycle | 2 | 1700 | yes | undefined |
| boy-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| boy-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| boy-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| boy-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| boy-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| girl-rig-idle-s | breathe | 1 | 1200 | yes | south |
| girl-rig-idle-e | breathe | 1 | 1200 | yes | east |
| girl-rig-idle-w | breathe | 1 | 1200 | yes | west |
| girl-rig-idle-n | breathe | 1 | 1200 | yes | north |
| girl-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| girl-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| girl-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| girl-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| girl-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| girl-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| girl-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| girl-rig-saddle-e | Pose cycle | 2 | 1300 | yes | undefined |
| girl-rig-saddle-wounded-e | Pose cycle | 2 | 1300 | yes | undefined |
| girl-rig-saddle-s | Pose cycle | 2 | 1300 | yes | undefined |
| girl-rig-saddle-wounded-s | Pose cycle | 2 | 1300 | yes | undefined |
| girl-rig-saddle-n | Pose cycle | 2 | 1300 | yes | undefined |
| girl-rig-saddle-wounded-n | Pose cycle | 2 | 1300 | yes | undefined |
| girl-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| girl-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| girl-rig-comfort | Pose cycle | 2 | 1700 | yes | undefined |
| girl-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| girl-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| girl-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| girl-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| girl-rig-led-wounded | Pose cycle | 4 | 1200 | yes | undefined |
| smallchild-rig-idle-s | breathe | 1 | 1200 | yes | south |
| smallchild-rig-idle-e | breathe | 1 | 1200 | yes | east |
| smallchild-rig-idle-w | breathe | 1 | 1200 | yes | west |
| smallchild-rig-idle-n | breathe | 1 | 1200 | yes | north |
| smallchild-rig-walk-e | Pose cycle | 4 | 1000 | yes | east |
| smallchild-rig-walk-s | Pose cycle | 2 | 500 | yes | south |
| smallchild-rig-walk-n | Pose cycle | 2 | 500 | yes | north |
| smallchild-rig-dig | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-hoe | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-chop | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-hammer | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-sow | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-harvest | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-carry | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-trade | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-care | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-search | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-surrender | Pose cycle | 2 | 900 | yes | undefined |
| smallchild-rig-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| smallchild-rig-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| smallchild-rig-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| smallchild-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| smallchild-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| smallchild-rig-comfort | Pose cycle | 2 | 1700 | yes | undefined |
| smallchild-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| smallchild-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| smallchild-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| smallchild-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| infant-rig-idle-s | breathe | 1 | 1200 | yes | south |
| infant-rig-idle-e | breathe | 1 | 1200 | yes | east |
| infant-rig-idle-w | breathe | 1 | 1200 | yes | west |
| infant-rig-idle-n | breathe | 1 | 1200 | yes | north |
| infant-rig-camp-rest | Pose cycle | 2 | 2400 | yes | undefined |
| infant-rig-camp-sleep | Pose cycle | 2 | 2400 | yes | undefined |
| infant-rig-wounded | Pose cycle | 2 | 1800 | yes | undefined |
| infant-rig-covered | Pose cycle | 2 | 1800 | yes | undefined |
| infant-rig-carry-living | Pose cycle | 4 | 1200 | yes | undefined |
| infant-rig-carry-dead | Pose cycle | 4 | 1200 | yes | undefined |
| rust-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| rust-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| rust-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| teal-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| teal-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| teal-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| elder-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| elder-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| elder-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| blue-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| blue-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| blue-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| rust-woman-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| rust-woman-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| rust-woman-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| indigo-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| indigo-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| indigo-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| ochre-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| ochre-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| ochre-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| blue-girl-wagon-passenger-e | Pose cycle | 2 | 1500 | yes | undefined |
| blue-girl-wagon-passenger-s | Pose cycle | 2 | 1500 | yes | undefined |
| blue-girl-wagon-passenger-n | Pose cycle | 2 | 1500 | yes | undefined |
| rust-woman-infant-walk-e | Pose cycle | 4 | 920 | yes | east |
| rust-woman-infant-walk-s | Pose cycle | 4 | 920 | yes | south |
| rust-woman-infant-walk-n | Pose cycle | 4 | 920 | yes | north |
| indigo-infant-walk-e | Pose cycle | 4 | 920 | yes | east |
| indigo-infant-walk-s | Pose cycle | 4 | 920 | yes | south |
| indigo-infant-walk-n | Pose cycle | 4 | 920 | yes | north |
| ochre-infant-walk-e | Pose cycle | 4 | 920 | yes | east |
| ochre-infant-walk-s | Pose cycle | 4 | 920 | yes | south |
| ochre-infant-walk-n | Pose cycle | 4 | 920 | yes | north |
| blue-girl-infant-walk-e | Pose cycle | 4 | 920 | yes | east |
| blue-girl-infant-walk-s | Pose cycle | 4 | 920 | yes | south |
| blue-girl-infant-walk-n | Pose cycle | 4 | 920 | yes | north |
| rust-infant-walk-e | Pose cycle | 4 | 920 | yes | east |
| rust-infant-walk-s | Pose cycle | 4 | 920 | yes | south |
| rust-infant-walk-n | Pose cycle | 4 | 920 | yes | north |
| wagon-open-cover-e | Pose cycle | 2 | 800 | yes | undefined |
| wagon-open-cover-w | Pose cycle | 2 | 800 | yes | undefined |
| wagon-open-cover-s | Pose cycle | 2 | 800 | yes | undefined |
| wagon-open-cover-n | Pose cycle | 2 | 800 | yes | undefined |
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
| austin-walk-e | Pose cycle | 4 | 760 | yes | east |
| austin-walk-s | Pose cycle | 2 | 580 | yes | south |
| austin-walk-n | Pose cycle | 2 | 580 | yes | north |
| barragan-walk-e | Pose cycle | 2 | 560 | yes | east |
| barragan-walk-s | Pose cycle | 2 | 560 | yes | south |
| barragan-walk-n | Pose cycle | 2 | 560 | yes | north |
| barragan-intervene | Pose cycle | 2 | 1800 | yes | east; mirror for west |
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
| castrillon-walk-s | Pose cycle | 2 | 560 | yes | south |
| castrillon-walk-n | Pose cycle | 2 | 560 | yes | north |
| castrillon-crate-command | Pose cycle | 2 | 1800 | yes | undefined |
| castrillon-walk-e | Pose cycle | 2 | 540 | yes | east |
| castrillon-fall | Pose cycle | 3 | 700 | one-shot | east; mirror for west |
| condelle-walk-e | Pose cycle | 4 | 760 | yes | east |
| condelle-walk-s | Pose cycle | 2 | 580 | yes | south |
| condelle-walk-n | Pose cycle | 2 | 580 | yes | north |
| condelle-command | Pose cycle | 2 | 1500 | yes | east; mirror for west |
| cos-walk-e | Pose cycle | 4 | 760 | yes | east |
| cos-walk-s | Pose cycle | 2 | 580 | yes | south |
| cos-walk-n | Pose cycle | 2 | 580 | yes | north |
| cos-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| crockett-captive | Pose cycle | 2 | 3100 | yes | east; mirror for west |
| deaf-smith-walk-e | Pose cycle | 4 | 760 | yes | east |
| deaf-smith-walk-s | Pose cycle | 2 | 580 | yes | south |
| deaf-smith-walk-n | Pose cycle | 2 | 580 | yes | north |
| deaf-smith-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| deaf-smith-axe-work | Pose cycle | 2 | 700 | one-shot | east; mirror for west |
| esparza-walk-e | Pose cycle | 4 | 760 | yes | east |
| esparza-walk-s | Pose cycle | 2 | 580 | yes | south |
| esparza-walk-n | Pose cycle | 2 | 580 | yes | north |
| travis-foot-walk-s-v2 | Pose cycle | 2 | 700 | yes | south |
| travis-foot-walk-n-v2 | Pose cycle | 2 | 700 | yes | north |
| crockett-foot-walk-s-v2 | Pose cycle | 2 | 700 | yes | south |
| crockett-foot-walk-n-v2 | Pose cycle | 2 | 700 | yes | north |
| bowie-foot-walk-s-v2 | Pose cycle | 2 | 700 | yes | south |
| bowie-foot-walk-n-v2 | Pose cycle | 2 | 700 | yes | north |
| fannin-foot-walk-s-v2 | Pose cycle | 2 | 700 | yes | south |
| fannin-foot-walk-n-v2 | Pose cycle | 2 | 700 | yes | north |
| milam-foot-walk-s-v2 | Pose cycle | 2 | 700 | yes | south |
| milam-foot-walk-n-v2 | Pose cycle | 2 | 700 | yes | north |
| ben-foot-walk-s-v2 | Pose cycle | 2 | 700 | yes | south |
| ben-foot-walk-n-v2 | Pose cycle | 2 | 700 | yes | north |
| neill-field-command | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| neill-field-conversation | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| karnes-field-command | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| karnes-field-conversation | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| hockley-field-command | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| hockley-field-conversation | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| lamar-field-command | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| lamar-field-conversation | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| sherman-field-command | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| sherman-field-conversation | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| rusk-field-command | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| rusk-field-conversation | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| travis-command-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| travis-conversation-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| houston-command-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| houston-conversation-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| santa-anna-command-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| santa-anna-conversation-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| austin-command-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| austin-conversation-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| moore-command-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| moore-conversation-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| almonte-command-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| almonte-conversation-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| burleson-command-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| burleson-conversation-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| cos-command-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| cos-conversation-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| urrea-command-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| urrea-conversation-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| castaneda-command-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| castaneda-conversation-cycle | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| grant-walk-e | Pose cycle | 4 | 760 | yes | east |
| grant-walk-s | Pose cycle | 2 | 580 | yes | south |
| grant-walk-n | Pose cycle | 2 | 580 | yes | north |
| grant-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| grant-mounted-gallop-e | Pose cycle | 4 | 540 | yes | east; mirror for west |
| hockley-walk-e | Pose cycle | 4 | 760 | yes | east |
| hockley-walk-s | Pose cycle | 2 | 580 | yes | south |
| hockley-walk-n | Pose cycle | 2 | 580 | yes | north |
| hockley-battery-command | Pose cycle | 3 | 1100 | yes | east; mirror for west |
| johnson-walk-e | Pose cycle | 4 | 760 | yes | east |
| johnson-walk-s | Pose cycle | 2 | 580 | yes | south |
| johnson-walk-n | Pose cycle | 2 | 580 | yes | north |
| johnson-command | Pose cycle | 2 | 1020 | yes | east; mirror for west |
| johnson-escape-e | Pose cycle | 2 | 350 | yes | east; mirror for west |
| karnes-walk-e | Pose cycle | 4 | 760 | yes | east |
| karnes-walk-s | Pose cycle | 2 | 580 | yes | south |
| karnes-walk-n | Pose cycle | 2 | 580 | yes | north |
| karnes-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| karnes-crowbar-work | Pose cycle | 2 | 680 | yes | east; mirror for west |
| lamar-walk-e | Pose cycle | 4 | 760 | yes | east |
| lamar-walk-s | Pose cycle | 2 | 580 | yes | south |
| lamar-walk-n | Pose cycle | 2 | 580 | yes | north |
| lamar-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| mcculloch-walk-e | Pose cycle | 4 | 760 | yes | east |
| mcculloch-walk-s | Pose cycle | 2 | 580 | yes | south |
| mcculloch-walk-n | Pose cycle | 2 | 580 | yes | north |
| mcculloch-gun-service | Pose cycle | 3 | 1080 | yes | east; mirror for west |
| moore-walk-e | Pose cycle | 4 | 760 | yes | east |
| moore-walk-s | Pose cycle | 2 | 580 | yes | south |
| moore-walk-n | Pose cycle | 2 | 580 | yes | north |
| smither-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| smither-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| jw-smith-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| jw-smith-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| horton-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| horton-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| kimbell-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| kimbell-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| martin-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| martin-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| cos-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| cos-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| urrea-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| urrea-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| castaneda-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| castaneda-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| houston-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| houston-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| santa-anna-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| santa-anna-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| burleson-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| burleson-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| grant-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| grant-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| houston-mounted-walk-e | Pose cycle | 2 | 640 | yes | east |
| santa-anna-mounted-walk-e | Pose cycle | 2 | 640 | yes | east |
| neill-walk-e | Pose cycle | 4 | 760 | yes | east |
| neill-walk-s | Pose cycle | 2 | 580 | yes | south |
| neill-walk-n | Pose cycle | 2 | 580 | yes | north |
| neill-gun-service | Pose cycle | 3 | 1120 | yes | east; mirror for west |
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
| jw-smith-walk-e | Pose cycle | 2 | 560 | yes | east |
| jw-smith-walk-s | Pose cycle | 2 | 560 | yes | south |
| jw-smith-walk-n | Pose cycle | 2 | 560 | yes | north |
| jw-smith-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| horton-walk-e | Pose cycle | 2 | 560 | yes | east |
| horton-walk-s | Pose cycle | 2 | 560 | yes | south |
| horton-walk-n | Pose cycle | 2 | 560 | yes | north |
| horton-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| kimbell-walk-e | Pose cycle | 2 | 560 | yes | east |
| kimbell-walk-s | Pose cycle | 2 | 560 | yes | south |
| kimbell-walk-n | Pose cycle | 2 | 560 | yes | north |
| kimbell-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| martin-walk-e | Pose cycle | 2 | 560 | yes | east |
| martin-walk-s | Pose cycle | 2 | 560 | yes | south |
| martin-walk-n | Pose cycle | 2 | 560 | yes | north |
| martin-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| rusk-walk-e | Pose cycle | 4 | 760 | yes | east |
| rusk-walk-s | Pose cycle | 2 | 580 | yes | south |
| rusk-walk-n | Pose cycle | 2 | 580 | yes | north |
| rusk-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| rusk-stop | Pose cycle | 2 | 1120 | yes | east; mirror for west |
| sanchez-navarro-walk-e | Pose cycle | 2 | 560 | yes | east |
| sanchez-navarro-walk-s | Pose cycle | 2 | 560 | yes | south |
| sanchez-navarro-walk-n | Pose cycle | 2 | 560 | yes | north |
| sanchez-navarro-parley | Pose cycle | 2 | 1550 | yes | east; mirror for west |
| deaf-smith-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| deaf-smith-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| karnes-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| karnes-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| lamar-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| lamar-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| sherman-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| sherman-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| rusk-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| rusk-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| seguin-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| seguin-mounted-canter-e | Pose cycle | 2 | 380 | yes | east; mirror for west |
| seguin-mounted-walk-s | Pose cycle | 2 | 600 | yes | south |
| seguin-mounted-walk-n | Pose cycle | 2 | 600 | yes | north |
| sherman-walk-e | Pose cycle | 4 | 760 | yes | east |
| sherman-walk-s | Pose cycle | 2 | 580 | yes | south |
| sherman-walk-n | Pose cycle | 2 | 580 | yes | north |
| sherman-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| smither-walk-e | Pose cycle | 2 | 560 | yes | east |
| smither-walk-s | Pose cycle | 2 | 560 | yes | south |
| smither-walk-n | Pose cycle | 2 | 560 | yes | north |
| smither-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| fannin-story-command | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| fannin-story-surrender | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| milam-story-rally | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| milam-story-point | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| crockett-story-command | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| crockett-story-rest | Pose cycle | 2 | 2400 | yes | east; mirror for west |
| bowie-story-command | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| bowie-story-sick | Pose cycle | 2 | 2400 | yes | east; mirror for west |
| alavez-story-beckon | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| alavez-story-guide | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| ben-story-pot-walk | Pose cycle | 2 | 560 | yes | east; mirror for west |
| ben-story-conversation | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| esparza-story-ram | Pose cycle | 2 | 1300 | yes | east; mirror for west |
| esparza-story-shot-carry | Pose cycle | 2 | 560 | yes | east; mirror for west |
| almeron-dickinson-story-ram | Pose cycle | 2 | 1300 | yes | east; mirror for west |
| almeron-dickinson-story-shot-carry | Pose cycle | 2 | 560 | yes | east; mirror for west |
| urrea-walk-e | Pose cycle | 4 | 760 | yes | east |
| urrea-walk-s | Pose cycle | 2 | 580 | yes | south |
| urrea-walk-n | Pose cycle | 2 | 580 | yes | north |
| urrea-mounted-walk-e | Pose cycle | 2 | 600 | yes | east |
| wp-smith-walk-e | Pose cycle | 2 | 560 | yes | east |
| wp-smith-walk-s | Pose cycle | 2 | 560 | yes | south |
| wp-smith-walk-n | Pose cycle | 2 | 560 | yes | north |
| wp-smith-address | Pose cycle | 2 | 1850 | yes | east; mirror for west |
| timber-felled-e | Still state | 1 | 1000 | one-shot | undefined |
| timber-felled-n | Still state | 1 | 1000 | one-shot | undefined |
| timber-trimmed-e | Still state | 1 | 1000 | one-shot | undefined |
| timber-stack | Still state | 1 | 1000 | one-shot | undefined |
| flag-come-and-take-it-wind | Pose cycle | 4 | 2700 | yes | not applicable |
| prisoner2-walk-e | Pose cycle | 4 | 840 | yes | east |
| prisoner2-walk-s | Pose cycle | 2 | 600 | yes | south |
| prisoner2-walk-n | Pose cycle | 2 | 600 | yes | north |
| prisoner-walk-e | Pose cycle | 4 | 840 | yes | east |
| prisoner-walk-s | Pose cycle | 2 | 600 | yes | south |
| prisoner-walk-n | Pose cycle | 2 | 600 | yes | north |
| teal-bundle-walk-s | Pose cycle | 2 | 1200 | yes | south |
| teal-bundle-walk-n | Pose cycle | 2 | 1200 | yes | north |
| indigo-bundle-walk-s | Pose cycle | 2 | 1200 | yes | south |
| indigo-bundle-walk-n | Pose cycle | 2 | 1200 | yes | north |
| blue-girl-bundle-walk-s | Pose cycle | 2 | 1200 | yes | south |
| blue-girl-bundle-walk-n | Pose cycle | 2 | 1200 | yes | north |
| elder-bundle-walk-s | Pose cycle | 2 | 1200 | yes | south |
| elder-bundle-walk-n | Pose cycle | 2 | 1200 | yes | north |
| teal-bundle-walk | Pose cycle | 4 | 1200 | yes | east; west by mirroring |
| indigo-bundle-walk | Pose cycle | 4 | 1200 | yes | east; west by mirroring |
| blue-girl-bundle-walk | Pose cycle | 4 | 1200 | yes | east; west by mirroring |
| elder-bundle-walk | Pose cycle | 4 | 1200 | yes | east; west by mirroring |
| elder-dig | Pose cycle | 4 | 1900 | yes | east; west by mirroring |
| ochre-dig | Pose cycle | 4 | 1900 | yes | east; west by mirroring |
| blue-dig | Pose cycle | 4 | 1900 | yes | east; west by mirroring |
| flag-come-and-take-it-no-star-wind | Pose cycle | 4 | 2700 | yes | not applicable |
| elder-read-letter | Pose cycle | 4 | 2200 | yes | east; west by mirroring |
| ochre-read-letter | Pose cycle | 4 | 2200 | yes | east; west by mirroring |
| blue-read-letter | Pose cycle | 4 | 2200 | yes | east; west by mirroring |
| teal-paint | Pose cycle | 2 | 1520 | yes | east; west by mirroring |
| indigo-paint | Pose cycle | 2 | 1520 | yes | east; west by mirroring |
| blue-girl-paint | Pose cycle | 2 | 1520 | yes | east; west by mirroring |
| indigo-river-watch | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| indigo-river-point | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| blue-river-watch | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| blue-river-point | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| ochre-river-watch | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| ochre-river-point | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| blue-girl-river-watch | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| blue-girl-river-point | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| ochre-river-watch-s | Pose cycle | 2 | 1300 | yes | south |
| ochre-river-point-s | Pose cycle | 2 | 1300 | yes | south |
| blue-girl-river-watch-s | Pose cycle | 2 | 1300 | yes | south |
| blue-girl-river-point-s | Pose cycle | 2 | 1300 | yes | south |
| ochre-river-watch-n | Pose cycle | 2 | 1300 | yes | north |
| ochre-river-point-n | Pose cycle | 2 | 1300 | yes | north |
| blue-girl-river-watch-n | Pose cycle | 2 | 1300 | yes | north |
| blue-girl-river-point-n | Pose cycle | 2 | 1300 | yes | north |
| teal-river-watch | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| teal-river-point | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| elder-river-watch | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| elder-river-point | Pose cycle | 2 | 1300 | yes | east; west by mirroring |
| teal-river-watch-n | Pose cycle | 2 | 1300 | yes | north |
| teal-river-point-n | Pose cycle | 2 | 1300 | yes | north |
| indigo-river-watch-n | Pose cycle | 2 | 1300 | yes | north |
| indigo-river-point-n | Pose cycle | 2 | 1300 | yes | north |
| elder-river-watch-n | Pose cycle | 2 | 1300 | yes | north |
| elder-river-point-n | Pose cycle | 2 | 1300 | yes | north |
| blue-river-watch-n | Pose cycle | 2 | 1300 | yes | north |
| blue-river-point-n | Pose cycle | 2 | 1300 | yes | north |
| teal-river-watch-s | Pose cycle | 2 | 1300 | yes | south |
| teal-river-point-s | Pose cycle | 2 | 1300 | yes | south |
| indigo-river-watch-s | Pose cycle | 2 | 1300 | yes | south |
| indigo-river-point-s | Pose cycle | 2 | 1300 | yes | south |
| elder-river-watch-s | Pose cycle | 2 | 1300 | yes | south |
| elder-river-point-s | Pose cycle | 2 | 1300 | yes | south |
| blue-river-watch-s | Pose cycle | 2 | 1300 | yes | south |
| blue-river-point-s | Pose cycle | 2 | 1300 | yes | south |
| teal-seated-paint | Pose cycle | 4 | 1800 | yes | east; west by mirroring |
| indigo-seated-paint | Pose cycle | 4 | 1800 | yes | east; west by mirroring |
| blue-girl-seated-paint | Pose cycle | 4 | 1800 | yes | east; west by mirroring |
| elder-smith-hammer | Pose cycle | 4 | 1270 | yes | east; west by mirroring |
| elder-smith-chain | Pose cycle | 4 | 1270 | yes | east; west by mirroring |
| ochre-smith-hammer | Pose cycle | 4 | 1270 | yes | east; west by mirroring |
| ochre-smith-chain | Pose cycle | 4 | 1270 | yes | east; west by mirroring |
| creek-ford | Pose cycle | 4 | 1400 | yes | undefined |
| mule-packed-grass-walk-e | Pose cycle | 4 | 1120 | yes | east |
| mule-packed-grass-walk-s | Pose cycle | 4 | 1120 | yes | south |
| mule-packed-grass-walk-n | Pose cycle | 4 | 1120 | yes | north |
| fog-bank-dense | Pose cycle | 2 | 12000 | yes | scenery |
| fog-bank-thin | Pose cycle | 2 | 12000 | yes | scenery |
| mesquite-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| live-oak-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| mesquite-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| live-oak-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| mesquite-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| live-oak-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| elm-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| elm-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| elm-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| herd-drove | Pose cycle | 4 | 1000 | yes | undefined |
| herd-scatter | Pose cycle | 4 | 1000 | yes | undefined |
| infant-wagon-passenger-e | Pose cycle | 2 | 1800 | yes | undefined |
| infant-wagon-passenger-s | Pose cycle | 2 | 1800 | yes | undefined |
| infant-wagon-passenger-n | Pose cycle | 2 | 1800 | yes | undefined |
| live-oak-mott-dense-wind | Pose cycle | 2 | 3600 | yes | not applicable |
| live-oak-mott-open-wind | Pose cycle | 2 | 3600 | yes | not applicable |
| marsh-edge-dense | Pose cycle | 4 | 1400 | yes | undefined |
| marsh-edge-sparse | Pose cycle | 4 | 1400 | yes | undefined |
| volunteer-wade | Pose cycle | 4 | 960 | yes | undefined |
| regular-wade | Pose cycle | 4 | 960 | yes | undefined |
| volunteer-rest-sit | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| volunteer-sleep | Pose cycle | 2 | 4800 | yes | east; west by mirroring |
| volunteer-camp-drink | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| volunteer-camp-clean | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| regular-rest-sit | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| regular-sleep | Pose cycle | 2 | 4800 | yes | east; west by mirroring |
| regular-camp-drink | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| regular-camp-clean | Pose cycle | 2 | 1800 | yes | east; west by mirroring |
| volunteer-dig | Pose cycle | 4 | 1800 | yes | east; west by mirroring |
| volunteer-crowbar | Pose cycle | 4 | 1800 | yes | east; west by mirroring |
| volunteer-sandbag-carry | Pose cycle | 4 | 1280 | yes | east; west by mirroring |
| volunteer-sandbag-fill | Pose cycle | 4 | 1800 | yes | east; west by mirroring |
| bearers-carry | Pose cycle | 4 | 1600 | yes | east; west by mirroring |
| regular-bearers-carry | Pose cycle | 4 | 1600 | yes | east; west by mirroring |
| dragoon-wounded-led | Pose cycle | 4 | 1760 | yes | east; west by mirroring |
| volunteer-ride-e | Pose cycle | 4 | 1200 | yes | east; west by mirroring |
| volunteer-ride-s | Pose cycle | 4 | 1200 | yes | south |
| volunteer-ride-n | Pose cycle | 4 | 1200 | yes | north |
| volunteer-mounted-fire-cycle | Pose cycle | 3 | 1000 | one-shot | east; west by mirroring |
| volunteer-loophole-fire-reload | Pose cycle | 4 | 2470 | one-shot | east; west by mirroring |
| girl-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| boy-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| smallchild-with-caregiver-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| infant-with-caregiver-ride-e | Pose cycle | 4 | 920 | yes | east; west by mirroring |
| girl-ride-s | Pose cycle | 4 | 920 | yes | south |
| boy-ride-s | Pose cycle | 4 | 920 | yes | south |
| smallchild-with-caregiver-ride-s | Pose cycle | 4 | 920 | yes | south |
| infant-with-caregiver-ride-s | Pose cycle | 4 | 920 | yes | south |
| girl-ride-n | Pose cycle | 4 | 920 | yes | north |
| boy-ride-n | Pose cycle | 4 | 920 | yes | north |
| smallchild-with-caregiver-ride-n | Pose cycle | 4 | 920 | yes | north |
| infant-with-caregiver-ride-n | Pose cycle | 4 | 920 | yes | north |
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
| jw-smith-mounted-trot-e | Pose cycle | 4 | 720 | yes | undefined |
| jw-smith-mounted-trot-s | Pose cycle | 4 | 720 | yes | undefined |
| jw-smith-mounted-trot-n | Pose cycle | 4 | 720 | yes | undefined |
| jw-smith-mounted-dispatch-e | Pose cycle | 2 | 1800 | yes | undefined |
| jw-smith-mounted-dispatch-s | Pose cycle | 2 | 1800 | yes | undefined |
| jw-smith-mounted-dispatch-n | Pose cycle | 2 | 1800 | yes | undefined |
| jw-smith-mounted-rest-e | Pose cycle | 2 | 2200 | yes | undefined |
| horton-mounted-trot-e | Pose cycle | 4 | 720 | yes | undefined |
| horton-mounted-trot-s | Pose cycle | 4 | 720 | yes | undefined |
| horton-mounted-trot-n | Pose cycle | 4 | 720 | yes | undefined |
| horton-mounted-dispatch-e | Pose cycle | 2 | 1800 | yes | undefined |
| horton-mounted-dispatch-s | Pose cycle | 2 | 1800 | yes | undefined |
| horton-mounted-dispatch-n | Pose cycle | 2 | 1800 | yes | undefined |
| horton-mounted-rest-e | Pose cycle | 2 | 2200 | yes | undefined |
| kimbell-mounted-trot-e | Pose cycle | 4 | 720 | yes | undefined |
| kimbell-mounted-trot-s | Pose cycle | 4 | 720 | yes | undefined |
| kimbell-mounted-trot-n | Pose cycle | 4 | 720 | yes | undefined |
| kimbell-mounted-dispatch-e | Pose cycle | 2 | 1800 | yes | undefined |
| kimbell-mounted-dispatch-s | Pose cycle | 2 | 1800 | yes | undefined |
| kimbell-mounted-dispatch-n | Pose cycle | 2 | 1800 | yes | undefined |
| kimbell-mounted-rest-e | Pose cycle | 2 | 2200 | yes | undefined |
| martin-mounted-trot-e | Pose cycle | 4 | 720 | yes | undefined |
| martin-mounted-trot-s | Pose cycle | 4 | 720 | yes | undefined |
| martin-mounted-trot-n | Pose cycle | 4 | 720 | yes | undefined |
| martin-mounted-dispatch-e | Pose cycle | 2 | 1800 | yes | undefined |
| martin-mounted-dispatch-s | Pose cycle | 2 | 1800 | yes | undefined |
| martin-mounted-dispatch-n | Pose cycle | 2 | 1800 | yes | undefined |
| martin-mounted-rest-e | Pose cycle | 2 | 2200 | yes | undefined |
| milam-fire-service-e | Pose cycle | 4 | 3600 | yes | undefined |
| milam-fire-service-w | Pose cycle | 4 | 3600 | yes | undefined |
| milam-fire-service-s | Pose cycle | 4 | 3600 | yes | undefined |
| milam-fire-service-n | Pose cycle | 4 | 3600 | yes | undefined |
| cottonwood-gale | Pose cycle | 2 | 1200 | yes | undefined |
| sapling-gale | Pose cycle | 2 | 1200 | yes | undefined |
| campfire-night | Pose cycle | 4 | 720 | yes | scenery |
| adobe-night-lit | Pose cycle | 4 | 2800 | yes | scenery |
| jacal-night-lit | Pose cycle | 4 | 2800 | yes | scenery |
| cabin-night-lit | Pose cycle | 4 | 2800 | yes | scenery |
| scrub-gale | Pose cycle | 2 | 1000 | yes | undefined |
| reeds-gale | Pose cycle | 2 | 1000 | yes | undefined |
| prickly-pear-gale | Pose cycle | 2 | 1000 | yes | undefined |
| post-oak-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| blackjack-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| post-oak-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| blackjack-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| post-oak-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| blackjack-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| cart-open-travel-e | Pose cycle | 4 | 980 | yes | east; west by mirroring |
| cart-open-travel-s | Pose cycle | 4 | 980 | yes | south |
| cart-open-travel-n | Pose cycle | 4 | 980 | yes | north |
| cart-open-loaded-travel-e | Pose cycle | 4 | 980 | yes | east; west by mirroring |
| cart-open-loaded-travel-s | Pose cycle | 4 | 980 | yes | south |
| cart-open-loaded-travel-n | Pose cycle | 4 | 980 | yes | north |
| ox-packed-walk-e | Pose cycle | 4 | 960 | yes | east |
| ox-packed-idle-e | breathe | 1 | 2700 | yes | east |
| ox-packed-walk-s | Pose cycle | 4 | 960 | yes | south |
| ox-packed-idle-s | breathe | 1 | 2700 | yes | south |
| ox-packed-walk-n | Pose cycle | 4 | 960 | yes | north |
| ox-packed-idle-n | breathe | 1 | 2700 | yes | north |
| ox-wagon-empty-e | Pose cycle | 4 | 1200 | yes | east; west by mirroring |
| ox-wagon-loaded-e | Pose cycle | 4 | 1200 | yes | east; west by mirroring |
| ox-wagon-empty-s | Pose cycle | 4 | 1200 | yes | south |
| ox-wagon-loaded-s | Pose cycle | 4 | 1200 | yes | south |
| ox-wagon-empty-n | Pose cycle | 4 | 1200 | yes | north |
| ox-wagon-loaded-n | Pose cycle | 4 | 1200 | yes | north |
| girl-wagon-driver-s | Pose cycle | 2 | 1200 | yes | south |
| boy-wagon-driver-s | Pose cycle | 2 | 1200 | yes | south |
| girl-wagon-driver-e | Pose cycle | 2 | 1200 | yes | east |
| boy-wagon-driver-e | Pose cycle | 2 | 1200 | yes | east |
| girl-wagon-driver-w | Pose cycle | 2 | 1200 | yes | west |
| boy-wagon-driver-w | Pose cycle | 2 | 1200 | yes | west |
| girl-wagon-driver-n | Pose cycle | 2 | 1200 | yes | north |
| boy-wagon-driver-n | Pose cycle | 2 | 1200 | yes | north |
| regular-crowbar-s | Pose cycle | 4 | 1200 | yes | undefined |
| regular-crowbar-n | Pose cycle | 4 | 1200 | yes | undefined |
| regular-dig | Pose cycle | 4 | 1800 | yes | east; west by mirroring |
| regular-crowbar | Pose cycle | 4 | 1800 | yes | east; west by mirroring |
| regular-sandbag-carry | Pose cycle | 4 | 1280 | yes | east; west by mirroring |
| regular-sandbag-fill | Pose cycle | 4 | 1800 | yes | east; west by mirroring |
| pecan-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| hackberry-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| pecan-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| hackberry-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| pecan-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| hackberry-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| sweetgum-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| sweetgum-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| sweetgum-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
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
| house-roof-join | Still state | 1 | 1000 | one-shot | undefined |
| house-roof-join-partial | Still state | 1 | 1000 | one-shot | undefined |
| house-roof-join-chimney | Still state | 1 | 1000 | one-shot | undefined |
| rust-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| rust-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| teal-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| teal-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| elder-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| elder-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| blue-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| blue-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| rust-woman-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| rust-woman-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| indigo-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| indigo-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| ochre-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| ochre-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| blue-girl-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| blue-girl-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| girl-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| girl-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| boy-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| boy-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| smallchild-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| smallchild-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| mother-scarf-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| mother-scarf-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| father-straw-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| father-straw-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| father-beard-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| father-beard-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| father-moustache-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| father-moustache-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| mother-braid-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| mother-braid-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| mother-loose-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| mother-loose-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| mother-straw-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| mother-straw-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| youth-boy-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| youth-boy-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| youth-girl-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| youth-girl-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| father-hat-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| father-hat-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| infant-camp-rest | Pose cycle | 2 | 2200 | yes | undefined |
| infant-camp-sleep | Pose cycle | 2 | 3200 | yes | undefined |
| volunteer-mounted-reload-e | Pose cycle | 8 | 8000 | one-shot | east; west by mirroring |
| dragoon-mounted-reload-e | Pose cycle | 8 | 8000 | one-shot | east; west by mirroring |
| volunteer-mounted-reload-s | Pose cycle | 8 | 8000 | one-shot | south |
| dragoon-mounted-reload-s | Pose cycle | 8 | 8000 | one-shot | south |
| volunteer-mounted-reload-n | Pose cycle | 8 | 8000 | one-shot | north |
| dragoon-mounted-reload-n | Pose cycle | 8 | 8000 | one-shot | north |
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
| pine-shortleaf-pole-gale | Pose cycle | 2 | 1000 | yes | undefined |
| pine-shortleaf-log-gale | Pose cycle | 2 | 1000 | yes | undefined |
| pine-shortleaf-large-gale | Pose cycle | 2 | 1000 | yes | undefined |
| volunteer-mounted-fire-s | Pose cycle | 4 | 1000 | one-shot | south |
| volunteer-mounted-fire-n | Pose cycle | 4 | 1000 | one-shot | north |
| dragoon-mounted-fire-s | Pose cycle | 4 | 1000 | one-shot | south |
| dragoon-mounted-fire-n | Pose cycle | 4 | 1000 | one-shot | north |
| lancer-charge-s | Pose cycle | 4 | 640 | yes | south |
| lancer-charge-n | Pose cycle | 4 | 640 | yes | north |
| susanna-child-walk-e | Pose cycle | 2 | 560 | yes | east |
| susanna-child-hold | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| susanna-child-walk-s | Pose cycle | 2 | 560 | yes | south |
| susanna-child-walk-n | Pose cycle | 2 | 560 | yes | north |
| settler-gun-ram | Pose cycle | 2 | 1300 | yes | east; mirror for west |
| settler-gun-rammer-cover | Pose cycle | 2 | 900 | one-shot | east; mirror for west |
| settler-gun-carry | Pose cycle | 2 | 560 | yes | east; mirror for west |
| settler-gun-charge-wait | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| settler-gun-fire | Pose cycle | 2 | 900 | one-shot | east; mirror for west |
| settler-gun-ready | Pose cycle | 2 | 1800 | yes | east; mirror for west |
| town-mill-smoke | Pose cycle | 4 | 1400 | yes | not applicable |
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
| volunteer-crowbar-s | Pose cycle | 4 | 1200 | yes | undefined |
| volunteer-crowbar-n | Pose cycle | 4 | 1200 | yes | undefined |
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
- **Families and riders:** Gameplay integration: explicit transport staging and removal of old helper stand-ins; independent appearance composition for multi-person caregiver pairs. New dismount/remount or additional directional task requests are future scope, not undelivered groups in the dated backlog. Read docs/ART_DELIVERY_2026-10-13-FAMILY-APPEARANCE-AND-BATTLE-COMPLETE.md.
- **Animals:** The rest of the game of 1836 (bear, javelina, antelope, buffalo, geese, wild cattle), which is words only until each lands; cream ox/grey horse/sheep/chicken locomotion, other livestock grazing and drinking, flight and load/harness behavior. Do not substitute a different coat mid-journey.
- **Cannons and soldiers:** Limber/unlimber, elevated aim, mounted firing and remounting. Gun recoil is whole-carriage translation, not an articulated barrel rig.
- **Buildings and environment:** Continuous door/gate hinge rig, construction/repair progression, crown-only tree rig, boat rowing/poling and ferry loading. The Yellow Stone under way landed 2026-09-21: the army-laden loop is drawn at the Brazos crossing, and the empty-deck loop is registered and drawn by nothing, because no projected state has her steaming light. Building stillness is intentional; condition changes require simulation state.
- **Production finish:** Generated pose proportions can drift between sheets. Hand-register additional transitions and final cast/period uniform variants as the game defines them. These are prototype assets, not exact historical portraits.

## Excluded art

The first cell of `fortifications.png` depicts a later rounded facade. It has no sprite ID and is never drawn. Use `roofless-church-shell` for a schematic 1836 Alamo. The unchanged source PNG is retained for provenance.
