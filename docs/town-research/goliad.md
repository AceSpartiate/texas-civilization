# Goliad in 1835 — the presidio, the mission and the town

Research only. Nothing here is built, and no claim below has a `HIST-` or `FIC-` ID yet; IDs are
assigned when something is drawn. Read alongside `docs/town-research/san-felipe.md`, `victoria.md`,
`mina.md`, `matagorda.md`, `columbia.md` and `liberty.md`, which this follows in shape.

**Two corrections to the brief before anything else.**

- The brief again named `public/gonzales-layout.js`. **No such file exists** — the Mina, Matagorda,
  Columbia and Liberty researchers all found the same thing, and this is the fifth report to say so.
  `public/gonzales-art.js` and `public/bexar-layout.js` exist.
- **More importantly, the brief named the wrong pair of layout files for this place.** Goliad is a
  fortification, and this repository already has a fortification layout: **`public/alamo-layout.js`**,
  which is the only file in the codebase with `walls`, `doors`, `rooms`, `roofs`, wall `material` and
  `thickness`, `destructible` wall segments, a `damageWall`/`createDamageState` pair, and
  `isWalkable`/`findPath` over the compound interior. `BEXAR_LAYOUT` has none of that; it has
  buildings-as-sprites, plazas, a river and roads. **§8 below is written in `ALAMO_LAYOUT`'s terms for
  the fort and `BEXAR_LAYOUT`'s terms for the ground outside it**, because that is the only honest fit
  for a place whose interior a student may one day be shown in an assault.

Researched 2026-09-16. Every URL in §1 was opened and read on that date. Every measurement in §2.3,
§5.2–§5.5 and §8 was computed here on that date from the sources named.

---

## The one-line answer

**Goliad is the only place in this series that can be drawn from a plan its own garrison's engineer
made, and the only one where a primary letter written eight hours after the event says in words where
the attackers came through the wall. It is also the only one where the settlement the game names is
one and a half miles from the settlement that existed in 1835.**

Five things carry the report:

1. **A plan of the fort drawn from inside it.** **Captain Joseph M. Chadwick**, Fannin's adjutant and
   a West Point–trained draughtsman, drew *A Correct View of Fort Defiance Goliad* on **2 March 1836**
   — five months after the game's army takes the place — and sent it to his mother in New Hampshire
   weeks before he was shot in the massacre. It was lithographed in New York in 1836, and **Chadwick's
   original turned up in a Charlottesville, Virginia library in 1967, two weeks before the restored
   presidio was rededicated** (S9, S13). The lithograph is reproduced online and was read here at full
   resolution. **It is north-up, it names twenty-two features by letter, and it draws the river, the
   bluff, the walls, the bastions, the church, the magazine, the sally port, the ditch and the
   pickets.** Nothing in this series has come close to it.
2. **Collinsworth's own letter, written at Goliad at 8 a.m. on 10 October 1835**, printed in *The
   Austin Papers* vol. III (S2). It gives the hour of the assault, the surrender terms, the casualties
   — and **the point of entry, in five words: they marched in "by forcing the Church doors."**
3. **A second primary letter, from the officer commanding the place a week later**, that says exactly
   what state the fortification was in. Col. **Benjamin F. Smith**, mid-October 1835: "The walls of the
   fortification here is in a perfect recked State" (S3, quoted). **Philip Dimmitt on 21 October**
   reports the breaches repaired and the bastions to follow — and dates the capture independently to
   "the night of the 9th., inst." (S4).
4. **A 1977 National Register / National Historic Landmark nomination** (S5) with an architectural
   description: four rounded corner bastions with stone sentry boxes on three of them, three gates,
   one-storey white limestone, and the chapel's dimensions.
5. **The ground, measured.** USGS 3DEP puts the fort platform at **186–190 ft** and the San Antonio
   River channel at **96 ft**, 865 ft to the north — **a ninety-foot bluff in seven hundred feet**,
   with dead-level prairie at 177–190 ft for three thousand feet south. A traveller in 1846 said the
   ruins covered "the top of the hill" (Furber, quoted on S8-Strategic). The lidar agrees with him.

**The quadrangle, measured.** Off OpenStreetMap traces of the standing walls the fort is a quadrangle
of about **355 × 340 ft**, perimeter about **1,390 ft — a quarter of a mile** — rotated about **5°
clockwise from the cardinal points**, so its long walls bear roughly **96°** and **186°**. **The
National Register's "approximately one-seventh of a mile in its exterior circumference" is not
reproducible**: one-seventh of a mile is 754 ft, a little over half what is on the ground (§2.3).

**And Goliad has two traps, not one.**

- **The trap the brief named is real but it is the smaller one.** The presidio was reconstructed
  1963–67. What is original is the **chapel** and not much else: five Historic American Buildings
  Survey photographs of 1936 were read here (S6), and they show the chapel standing complete, one long
  stone range standing, a few hundred feet of low wall, and **grass**. The 1977 nomination says the
  presidio "fell into ruins" and "Only the chapel was preserved in tact."
- **The trap the brief did not name is bigger. The town of Goliad moved.** TSHA: after San Jacinto the
  old town was largely deserted and "Anglo-Americans moved north of the river to the present townsite"
  (S1a, quoted). The 1835 settlement stood **against the presidio's walls, on the south-west bank**.
  The present town of Goliad — the courthouse square, the Sanborn grid, the place `HIST-TEX-010` puts
  at 28.66833, −97.38833 — is **7,700 ft, one and a half miles, north-north-west of the presidio,
  across the river, and was laid out after 1836.** §9 says what would change in `HISTORY.md`.

---

## 1. Sources

| # | Source | What it was used for | URL read 2026-09-16 |
| --- | --- | --- | --- |
| **S1** | TSHA *Handbook of Texas*: **(a) Goliad, TX**; **(b) Goliad County**; **(c) Nuestra Señora de Loreto de la Bahia Presidio**; **(d) Nuestra Señora del Espíritu Santo de Zúñiga Mission**; **(e) Goliad Campaign of 1835**; **(f) La Bahía Road**; **(g) Manahuilla Creek** | (a) the presidio "built on a hill near the river"; the settlement of La Bahía growing **around the presidio walls**, the mission "on the opposite bank"; the 1829 renaming; **stone houses of wealthy citizens and dozens of jacals**; the 1834 cholera; the 24-man garrison; **the town's removal north of the river after 1836**. (b) **the presidio on the south-western bank and the mission on the north-eastern**; the 1749–50 fort — a large barrack, forty temporary houses, a garrison of 29, the captain's stone house, a church; La Bahía's population 1,138 in 1796, 618 in 1803, 655 in 1810; the roads that met here. (c) the 1721/1726/1749 moves; Ramírez de la Piscina's stone captain's house and chapel; the fifty-man garrison; **the 1963–67 reconstruction of stuccoed limestone under Raiford Stripling and Roland E. Beard, from a New York lithograph and Chadwick's notes and map**; nine occupation layers; the museum in the restored officers' quarters; THC's purchase finalised 2025. (d) the mission's three sites; **rebuilt of stone and mortar by 1758 with the Indians still in jacales**; Solís 1767–68 — the presidio in sight across the river, **crossed by canoe**; secularised 1830; **"the mission, which had fallen into ruin"** by the revolution; the 1930s CCC/NPS reconstruction. (e) Condelle's July 1835 occupation; Cos's landing at Copano and his entry into Goliad **2 October**; his departure **5 October** leaving 27 men under Sandoval and Sabriego; Collinsworth's march; **Manahuilla Creek, Ira Ingram's scouting party, Milam joining on the road, arrival at the presidio about 11 p.m., a fight of about thirty minutes**; the Compact of Volunteers of 9 October and its 49 signers; **"The ultimate strength of the Collinsworth company probably reached some 120 men"**; Sandoval's losses as TSHA gives them. (f) the road's course. (g) **Manahuilla Creek's mouth on the San Antonio five miles east of Goliad** | [/goliad-tx](https://www.tshaonline.org/handbook/entries/goliad-tx) · [/goliad-county](https://www.tshaonline.org/handbook/entries/goliad-county) · [/nuestra-senora-de-loreto-de-la-bahia-presidio](https://www.tshaonline.org/handbook/entries/nuestra-senora-de-loreto-de-la-bahia-presidio) · [/nuestra-senora-del-espiritu-santo-de-zuniga-mission](https://www.tshaonline.org/handbook/entries/nuestra-senora-del-espiritu-santo-de-zuniga-mission) · [/goliad-campaign-of-1835](https://www.tshaonline.org/handbook/entries/goliad-campaign-of-1835) · [/la-bahia-road](https://www.tshaonline.org/handbook/entries/la-bahia-road) · [/manahuilla-creek](https://www.tshaonline.org/handbook/entries/manahuilla-creek) |
| **S2** | **George M. Collinsworth to Capt. Benjamin Smith, "Goliad 8 oclock A.M. Octr 10th 1835"**, enclosed in **James Kerr to the Council of War, Victoria, 10 October 1835, 11 p.m.**; and **Collinsworth to Austin, "Guadaloupe 12 o'Clock Oct 8th 1835, In Camp"**. Both in *The Austin Papers* vol. III ed. Barker, pp. 164–170 | **The load-bearing primary source.** The 10 October letter: arrival "last night at 11 Oclock"; the entry **"by forcing the Church doors"** (quoted); "after a small fight they surrendered with 3 officers and 21 soldiers, together with 3 wounded and one killed"; one Texian wounded in the shoulder; couriers sent for troops. The 8 October letter: **"I have under My charge 47 Good and Effective men"**, his intelligence that "there is from 60 to 100 troops in that place", and his intention to enter "to Night or tomorrow". Kerr names the prisoners: **Lt Col. Sandoval, Capt. Sabriego, Ensign Garza** | [archive.org/details/austinpapersocto03aust](https://archive.org/details/austinpapersocto03aust) — full text at [/austinpapersocto03aust_djvu.txt](https://archive.org/stream/austinpapersocto03aust/austinpapersocto03aust_djvu.txt) |
| **S3** | **Col. Benjamin F. Smith to Austin, Goliad, mid-October 1835**, with **Ira Ingram's ordnance return, "Goliad Oct. 13th 1835"**, same volume, pp. 180–181 | **The condition of the fortification, from the man holding it.** "The walls of the fortification here is in a perfect recked State" (quoted); it "requires considerable repairs to Make it in any way tenable"; a besieger "can cut off our Supplies of water and provisions"; the garrison then about 120 men, of whom the Mexican volunteers are not counted. **Ingram's return of what was captured**: 6 saddles, 1 barrel of musket cartridges, 100 4-lb shot, 44 lance heads, 100–200 bayonets, **200 stands of muskets and carbines "the greater part are broken and entirely useless"**, broken cartridge boxes, rusty camp kettles, old iron | same volume |
| **S4** | **Philip Dimmitt to Austin, "Fort Goliad Oct. 21st 1835"**, and Dimmitt's letters of 12 and 20 October, same volume, pp. 176, 194–196 | **"All the breaches in the outer wall are repaired, and the bastions will be done tomorrow"** (quoted); effective force "still 50 men"; **"the little band that entered this place on the night of the 9th., inst."** — a second, independent primary dating of the assault; about 50 pikes and bayonets handled. Kerr's postscript of 11 October gives the prize: "about $10,000 — upwards of 300 stand arms" | same volume |
| **S5** | **National Register of Historic Places / National Historic Landmark nomination, Presidio Nuestra Senora de Loreto de La Bahia**, ref. **67000024**, prepared by Patricia Heintzelman and rewritten by Cecil McKithan, Historic Sites Survey Division, NPS, **December 1977**, 9 pp. | **The architectural description.** 1749 as built: several wooden buildings and **some 40 grass huts inside a palisade of wooden poles**; from the early 1760s to about 1795 the wood was replaced by stone and the rock walls "progressively extended until the fort attained its present size"; the quadrangle "approximately one-seventh of a mile in its exterior circumference" (**not reproducible — §2.3**); massive white limestone walls and buildings, **one storey**; **"Four rounded bastions, built to mount cannon, project from each corner of the walls"** (quoted), with **stone sentry boxes on three of them**; quarters for officers and men, offices, storehouses, workshops and an arsenal forming part of the defensive walls and opening onto the enclosed parade ground; **three gates, in the north, west and south walls**; the chapel **built between 1775 and 1790**, near the north-west corner, **about 90 ft long, 27 ft wide, walls 4 ft thick**, with a square bell tower, an octagonal window over the door lighting the choir loft, a niche and statue, a groin-vaulted interior, a side chapel on the right and a sacristy on the left projecting from the outer wall; Pryor Lea's occupation mid-1840s to mid-1850s with the chapel as a residence and other structures as carriage houses and bunk houses; **"Only the chapel was preserved in tact"**; restoration begun **24 April 1963**; Collinsworth's attack dated **9 October 1835** with "Only 24 Mexican soldiers"; and its bibliography, which names **Kathryn Stoner O'Connor, *Presidio La Bahia del Espiritu Santo de Zuniga, 1721–1846* (Austin, 1966)** — the book the brief asked for, not read (§1b) | [npgallery.nps.gov/NRHP/GetAsset/NRHP/67000024_text](https://npgallery.nps.gov/NRHP/GetAsset/NRHP/67000024_text) |
| **S6** | **Historic American Buildings Survey, HABS TX-387 / HABS TEX,88-GOLI,4-, "La Bahia Presidio Chapel"** — 5 photographs (1936) and 2 data pages, Library of Congress. **All five photographs were viewed here.** | **The best evidence of what survived.** The photographs show the chapel complete — square bell tower, arched entrance, octagonal window, semicircular pediment with a cross and a statue in a niche, exactly as S5 describes it — with, beyond it, **one long one-storey stone range with an arched door and a round window still standing**, a few hundred feet of low rubble wall, and open grass where the rest of the fort was. **Source hazard: HABS TX-387's 1936 data page is unreliable.** It is headed "MISSION LA BAHIA", gives the owner as the State of Texas and the present condition as "Rebuilt 1932–33" by the C.C.C. — all of which describes **Mission Espíritu Santo in Goliad State Park**, not the presidio chapel, which was never CCC-rebuilt. The 1975 supplemental card is correctly about the presidio and says **"the surrounding fort was reconstructed in the 1960s"** (quoted) | item [loc.gov/item/tx0342/](https://www.loc.gov/item/tx0342/); photos [157449pv](https://tile.loc.gov/storage-services/service/pnp/habshaer/tx/tx0300/tx0342/photos/157449pv.jpg) … 157453pv; data [tx0342data.pdf](https://tile.loc.gov/storage-services/master/pnp/habshaer/tx/tx0300/tx0342/data/tx0342data.pdf); supp [tx0342supp.pdf](https://tile.loc.gov/storage-services/master/pnp/habshaer/tx/tx0300/tx0342/supp/tx0342supp.pdf) |
| **S7** | **Texas Historical Commission**, *Presidio La Bahía history* and *Plan your visit* | **"the officer's quarters, which is now the museum, the Our Lady of Loreto Chapel, and the enlisted men's barracks all of rock construction and all connected by an eight foot high wall"** (quoted) — the only stated **wall height** found anywhere; the chapel built for the soldiers **and the Spanish settlers living in the town surrounding the fort**; the earliest reports of needed repairs **1791**, walls and soldier housing already in disrepair; **Fannin reinforced walls and bastions and built a new blockhouse** and was ordered to destroy what he could; 1837–1963 "barely any walls left, mounds of rubble", **and the relocation of the town from the south to the north side of the river**; the 1963 restoration beginning with ~500 photographs and then archaeology; the present tour naming **bastions, barracks, blacksmith's shop and parade grounds** | [thc.texas.gov/…/presidio-la-bahia-history](https://thc.texas.gov/state-historic-sites/presidio-la-bahia/presidio-la-bahia-history); [/plan-your-visit-presidio-la-bahia](https://thc.texas.gov/state-historic-sites/presidio-la-bahia/plan-your-visit-presidio-la-bahia) |
| **S8** | **Historical markers**, transcribed with photographs on hmdb.org. Seventy listed for Goliad, twenty-five fetched, thirteen used; itemised in §1a. **hmdb refuses WebFetch and refuses curl without `-L`; it also rate-limits — fetch with a browser user-agent and pause about three seconds between markers** | The presidio's own interpretive panels and the state's markers: **the town "extended to the walls of the fort"** and was destroyed in 1835–36; Furber's 1846 description of the hill; **the Chadwick plan's rediscovery in a Virginia library in 1967**; the chapel dated 1779 on one panel; the restoration to "its 1836 appearance"; the mission 1/4 mi NW (**wrong — §5.2**); **the 1965 state marker's "Oct. 8, 1835" and "48 men" (wrong — §3.4)**; the La Bahía Cemetery "as early as the 1830s"; 180 persons at mission and fort in 1758 with **jacales, "crude clay-plastered brush huts thatched with grass"**, all about | see §1a |
| **S9** | **Copano Bay Press gallery**, *Capt. Chadwick's Plan of Presidio La Bahia – Goliad 1836*, a dealer page carrying a **full reproduction of the 1836 New York lithograph**, read at 759 × 1024 px and enlarged in five crops | **The plan itself** (§2.1–§2.2), and its provenance: Chadwick drew it **2 March 1836**; Stripling worked from a family copy of the lithograph; **"the lithographer had placed the church's bell tower on the wrong end"** (quoted), which is why §2.4 will not say which end it is; Chadwick's original found in Charlottesville two weeks before the 1968 rededication and "a perfect match"; the only known copy of the lithograph sold at Heritage Galleries, Dallas, in 2020 for $200,000. **The brief's tip held: this page 403s nothing and answers curl with a browser user-agent** | [copanobaypress-gallery.com/products/capt-chadwicks-plan-of-presidio-la-bahia-goliad-1836](https://copanobaypress-gallery.com/products/capt-chadwicks-plan-of-presidio-la-bahia-goliad-1836); image [capt-chadwicks-plan-…-894447.png](https://copanobaypress-gallery.com/cdn/shop/files/capt-chadwicks-plan-of-presidio-la-bahia-goliad-1836-894447.png?v=1731650392) |
| **S10** | **OpenStreetMap**, through the **OSM API 0.6 map endpoint**, 2026-09-16 | Every wall, building, marker, road and watercourse in §2.3, §5.2–§5.5 and §8. The presidio is mapped in detail — one `historic=building` outline, six `building=yes` footprints and six `barrier=wall` runs. **Note for the next researcher, confirming Liberty's finding: the Overpass API is still unusable from this machine; `https://api.openstreetmap.org/api/0.6/map?bbox=…` worked first try and returns XML** | `…/api/0.6/map?bbox=-97.400,28.638,-97.372,28.665` (presidio) and `bbox=-97.405,28.658,-97.378,28.680` (modern town) |
| **S11** | **USGS 3DEP**, Elevation Point Query Service, 2026-09-16 | The hill the fort stands on, the ninety-foot bluff to the river, the level prairie south and west, and the mission's own bench (§5.4) | `https://epqs.nationalmap.gov/v1/json` |
| **S12** | **Sanborn Fire Insurance Map from Goliad, Goliad County, Texas, February 1894**, 1 sheet, Library of Congress, read at 25 % (1,613 × 1,913 px) | **A negative result worth having.** Sanborn's Goliad is the **post-1836 town north of the river**: a county courthouse square of brick between Square and Court Streets, blocks lettered in "Ranges E, F, G" and numbered 4, 5, 6, Franklin/West/Fannin running east–west, Mechanic/Commercial/East running north–south, Fannin Park to the north-east, population 1,500, a compass rose with true north up. **Nothing of the 1835 settlement appears on it, and none of the seven Goliad Sanborn editions (1894–1944) covers the presidio.** For the first time in this series the Sanborn method returns nothing about the year in question — because the town it maps did not exist in 1835 | item [loc.gov/item/sanborn08547_001/](https://www.loc.gov/item/sanborn08547_001/); image [IIIF 08547_1894-0001](https://tile.loc.gov/image-services/iiif/service:gmd:gmd403m:g4034m:g4034gm:g4034gm_g085471894:08547_1894-0001/full/pct:25/0/default.jpg) |
| **S13** | **Wikipedia, *Presidio La Bahía*** (read once, and used only where it does not stand alone) | Two statements used here and **both corroborated elsewhere**: that the Texians **"hacked through a door on the north wall"** — which agrees with S2's "Church doors" only because S9's plan puts the church *in* the north wall (§3.2); and that the fighting lasted about thirty minutes, which is S1e's figure. Its "area 45 acres" is the **National Register boundary** of S5, which includes Fannin's grave site, **not the fort** | [en.wikipedia.org/wiki/Presidio_La_Bahía](https://en.wikipedia.org/wiki/Presidio_La_Bah%C3%ADa) |
| **S14** | **THC Atlas**, marker record 5175004119; **U.S. Board on Geographic Names** via `HIST-TEX-010` | The 1969 Recorded Texas Historic Landmark text and its UTM (zone 14, 658336 E, 3170268 N); and Goliad's official coordinate **28.66833, −97.38833**, which is the **modern** town (§5.5) | [atlas.thc.texas.gov/Details/5175004119](https://atlas.thc.texas.gov/Details/5175004119) |

### 1a. The historical markers used (S8)

All transcribed with photographs on hmdb.org. Coordinates are the markers' own, converted into the
fort frame of §8 (x along the presidio's north wall, y along its west wall, origin at the north-west
outside corner; +x ≈ bearing 96°, +y ≈ bearing 186°).

| Marker | Erected | Coordinates (hmdb) | Fort frame (x, y) ft | URL |
| --- | --- | --- | --- | --- |
| **A Strategic Location** (SW bastion panel) | Presidio La Bahía SHS (undated) | 28.647283, −97.382950 | **47, 360** — on the south-west bastion | [hmdb m=235072](https://www.hmdb.org/m.asp?m=235072) |
| **A Stroke of Very Good Luck** (the Chadwick plan) | Presidio La Bahía SHS | 28.647833, −97.382750 | **92, 155** — courtyard, by the museum door | [hmdb m=235071](https://www.hmdb.org/m.asp?m=235071) |
| **Presidio La Bahía** (interpretive) | Historic Goliad | 28.647633, −97.382967 | 55, 200 | [hmdb m=235084](https://www.hmdb.org/m.asp?m=235084) |
| **Presidio la Bahia del Espíritu Santo de Zúñiga** | **1966, Raiford Stripling, Restoration Architect** | 28.647667, −97.382933 | 66, 193 | [hmdb m=235082](https://www.hmdb.org/m.asp?m=235082) |
| **Presidio de Nuestra Señora de Loreto de la Bahía** (4119) | **1969, State Historical Survey Committee** | 28.648250, −97.382833 | 108, −20 — at the entrance | [hmdb m=36230](https://www.hmdb.org/m.asp?m=36230) |
| **Nine Flags Over Goliad** | Presidio La Bahía SHS | 28.647800, −97.383000 | 66, 163 | [hmdb m=235078](https://www.hmdb.org/m.asp?m=235078) |
| **A Pitiful Site** (Rusk's burial of Fannin's men) | Presidio La Bahía SHS | 28.647250, −97.383000 (partial) | ~40, ~372 | [hmdb m=235075](https://www.hmdb.org/m.asp?m=235075) |
| **La Bahía Cemetery** (15807) | **2008, Texas Historical Commission** | 28.646617, −97.380367 | **895, 522** — 900 ft ESE of the fort | [hmdb m=122040](https://www.hmdb.org/m.asp?m=122040) |
| **Angel of Goliad** (15677) | 2009, THC | 28.646548, −97.381199 | 632, 573 | [hmdb m=36263](https://www.hmdb.org/m.asp?m=36263) |
| **Grave of Col. J. W. Fannin and His Men** (2257) | 1968, THC | 28.646077, −97.379652 | **1142, 695** — the 1836 burial ground | [hmdb m=35516](https://www.hmdb.org/m.asp?m=35516) |
| **Mission Nuestra Senora del Espiritu Santo de Zuniga** (3408) | **1969, State Historical Survey Committee** | 28.656552, −97.387007 | **−1568, −3021** | [hmdb m=116299](https://www.hmdb.org/m.asp?m=116299) |
| **Site of the Mission … Espiritu Santo de Zúñiga** (3409) | **1936, State of Texas** | 28.656983, −97.386950 | −1560, −3178 | [hmdb m=68955](https://www.hmdb.org/m.asp?m=68955) |
| **Goliad** (2200) | **1965, State Historical Survey Committee** | 28.667383, −97.391200 | **−2867, −6867** — in the **new** town | [hmdb m=34142](https://www.hmdb.org/m.asp?m=34142) |
| (index of 70 Goliad markers) | — | — | — | [hmdb results, Goliad](https://www.hmdb.org/results.asp?Town=Goliad&State=Texas&County=Goliad) |

**How far these can be trusted.** The **1936 and 1965–69 state markers are unfootnoted and at least one
is demonstrably wrong** (the 1965 Goliad marker's 8 October and "48 men" — §3.4; the 1969 presidio
marker's "1/4 mi. NW" for the mission — §5.2). The **Presidio La Bahía State Historic Site panels** are
modern interpretive signage written by the site and are used here for the site's own account of its
restoration, which is corroborated by S1c, S5 and S7. **The Chadwick panel (m=235071) is the single
most useful marker in the series so far**, because it explains the provenance of the plan the whole
reconstruction rests on and admits the lithographer's error.

### 1b. Sources looked for and not found

- **The Portal to Texas History could not be reached. That is seven reports in a row.** One attempt,
  as the brief directs: `texashistory.unt.edu` served an **`altcha` proof-of-work interstitial** headed
  only "DAM" and never resolved. The Portal holds the *Goliad Advance-Guard* and the county's
  manuscript collections. **It has now blocked every report in this series.**
- **Kathryn Stoner O'Connor, *Presidio La Bahia del Espiritu Santo de Zuniga, 1721–1846* (Austin,
  1966) was not read.** The brief named it; the 1977 National Register nomination names it as its only
  monographic authority (S5). **It is by a distance the most valuable unread document for this place**,
  it was published the year before the restoration was dedicated and by the foundation that paid for
  it, and it almost certainly contains the measured plan, the room list and the documentary history
  that §6 says are missing. Not online in any form found.
- **No excavation report was found.** The brief hoped for one, reasonably: Goliad was dug properly, and
  the restoration was evidence-led. But **Roland E. Beard's 1963–67 archaeology appears never to have
  been published as a report that can be read online.** All that could be found are the summary
  statements that nine occupation layers were uncovered (S1c, S5, S8) and that the museum's artefacts
  all came from the site (S7). **Nothing gives a wall line, a footprint, a stratum or a find-spot.**
  The only La Bahía archaeology with a published account is the **1996–2002 THC work at the *first*
  presidio on Garcitas Creek** — the wrong site by a hundred miles and a century (S1c).
- **`presidiolabahia.org` no longer resolves.** TSHA and OSM both still link to it; the DNS name
  returns `EAI_AGAIN` and its history and chapel pages are indexed by search engines but cannot be
  served. THC took over operations in late 2022 and completed purchase from the Diocese of Victoria in
  2025 (S1c), and the site's own publications — which the brief named — have gone with it.
- **`sah-archipedia.org` returns 403 behind a JavaScript interstitial.** Its entry TX-01-GB15 covers the
  presidio, the chapel and the Zaragoza birthplace and is the only scholarly architectural description
  located; **only the fragments a search engine surfaced could be read**, and they are used in §2.4
  only to record that the question of the chapel's orientation is unsettled.
- **`texasbeyondhistory.net` has no Goliad section at the URLs tried** (`/goliad/`, `/mission/`); both
  404. It is normally the best free route into Texas excavation reports.
- **No plat or survey of the town of La Bahía / Goliad was found, and there may never have been one.**
  See §5.3: this is a presidial settlement that grew against a fort's walls, not a platted town, and
  nothing read suggests a grid. The **four-league grant validated by Houston in 1844** (S1a) would have
  a survey; it was not located, and it postdates 1835 anyway.
- **The Texas General Land Office map database was not used**, on the standing warning in this series.
  GLO will hold the four-league Goliad town tract and probably the De la Garza and Power–Hewetson
  surveys around it.
- **No antique-map dealer page carrying an 1830s map of the *town* was found.** The dealer trade has
  Chadwick's plan of the *fort* (S9), and that is what the method's first step delivered.
- **Chadwick's original manuscript sketch was not located.** S9 places it in a Charlottesville,
  Virginia library in 1967; which library is not said. **The original would settle the bell tower
  (§2.4) and may carry a scale, which the lithograph does not.**
- **No Mexican-period return of the Goliad garrison was read**, and no muster roll of Sandoval's
  detachment. The numbers in §7 are all from the Texian side.
- **The 1836 lithograph's only known impression is in private hands** (Heritage Galleries, Dallas,
  2020, $200,000 — S9). What was read here is a dealer's reproduction of it.

---

## 2. Documented — the presidio as a fortification

### 2.1 What Chadwick's plan shows

*A Correct View of Fort Defiance Goliad*, drawn by Adjutant Joseph M. Chadwick on **2 March 1836** and
lithographed in New York the same year (S9). **North is up** — the sheet carries a compass arrow at
the lower left of the fort and the **River San Antonio runs across the top**, with the bluff between
river and fort drawn in hachure. It is a bird's-eye, not an orthographic plan: walls and buildings are
drawn in low oblique.

**The reference list, twelve numbers, all Fannin's garrison:**

| | | | |
| --- | --- | --- | --- |
| 1 Duvall's Company | 4 Ticknor's Comp. | 7 Bradford's Comp. | 10 **Comm. Officer's Quarters** |
| 2 Wadsworth's Comp. | 5 Bullock's Comp. | 8 Guerra's Comp. | 11 **Regulars' Quarters** |
| 3 Winn's Comp. | 6 **Shackelford's Red Rovers** | 9 Burke's Comp. | 12 **King's Arsenal** |

**The explanation, twenty-two letters, and this is the part that matters.** Transcribed here from the
enlarged image; readings marked `[?]` are uncertain.

- **A. S.E. block house.** "The cannon from this angle commands the entrance to town from Refugio, the
  st[reet] south of the fort & east."
- **B.** Block house **in progress** — the south-west angle.
- **D. N.W. block house** — "commands the ford N of the town & the ditch & ravine at **E the watering
  place**."
- **F. Work shop**, at the north-east angle, "to be strengthened on top & a piece of cannon mounted."
- **H. Madam Garcia's[?] house, new & very strongly built.** Outside the walls beyond the south-east
  angle. "A platform to be laid from this house to A & a 6 pdr mounted on the roof, which commands
  the **ford & road from Victoria**, the **Refugio road**, & ⅔[?] of the circle of country N.W. to S.W."
- **I & K.** Two out-houses, **to be removed**.
- **a.a.a. Ditch. b.b.b. Pickets.**
- **C.** A 6 pdr mounted on a platform **west of the sally port**.
- **G. Sally port** — drawn in the middle third of the **south wall**.
- **M. Prison** and **N. Guard house**, flanking the sally port inside.
- Flagstaff; **"Brooks[?] battery, 68 musket barrels mounted"**.
- **O.** Where the prisoners were shot. **P.** Where Col. Fannin was shot — inside the north-west angle
  of the parade ground. **R.** Adjt. Chadwick.

**And the drawing itself adds what the letters do not:** the **church set into the north wall, west of
centre**, labelled `CHURCH`, with a smaller gabled building immediately south of it labelled
`MAGAZINE`; a **rectangular annex projecting west** off the west wall holding the Regulars' Quarters;
the Commanding Officer's Quarters and the King's Arsenal ranged along the inside of the west wall;
company tents pitched inside along the west and south walls; a battery of five guns in the middle of
the parade; and a line of infantry drawn up across it.

### 2.2 What that gives us for 1835, and what it does not

Chadwick drew the place **five months after the game's army takes it** and after Fannin's men had
worked on it. The plan is therefore **evidence for 1836, and evidence for 1835 only where the thing
drawn is masonry**. Safe to carry back to October 1835:

- the **quadrangle**, the **four corner bastions/block houses**, the **church in the north wall**, the
  **magazine**, the **sally port in the south wall**, the **ditch**, the **ford north of the town**,
  the **watering place in the ravine**, the **Refugio road south and east**, the **Victoria road over
  the ford**, and **Madam Garcia's house standing outside the south-east angle**.

Not safe to carry back:

- the **pickets** (`b.b.b.`), the **platforms**, the **gun positions**, the **new blockhouse** — S7 says
  in as many words that Fannin built one — and the **repairs in progress** (`B`, `F`). Dimmitt's letter
  of 21 October 1835 (S4) shows the bastions were still being repaired **six weeks before** the year
  ended, so a good deal of what Chadwick draws as sound was not sound when Collinsworth arrived.
- **everything movable**: tents, companies, guns, the flagstaff, the parade.

### 2.3 The quadrangle on the ground, measured

Off OpenStreetMap traces of the standing walls (S10) — one `historic=building` outline and six
`barrier=wall` runs, with six building footprints inside them:

| | |
| --- | --- |
| **Fitted quadrangle** | **360.5 × 342.7 ft** at the minimum-area orientation |
| **Wall envelope in the fort frame** | x **20 → 375 ft**, y **20 → 358 ft** — about **355 × 338 ft** |
| **Perimeter** | about **1,390 ft = 0.263 mile** |
| **Enclosed area** | about **2.8 acres** |
| **Rotation from cardinal** | **about 5° clockwise**; the east–west walls bear **94.2°–99.7°** and the north–south walls **182.4°–187.6°** |
| **Squareness** | **not square in the trace** — the two axes differ by about 88°, not 90° |

**Three cautions.** First, this measures **the 1963–67 reconstruction**, not the 1835 fabric (§6).
Second, OSM's trace here is coarse: the outline way's four edges come out 395, 375, 353 and 377 ft with
bearings that disagree by 6.5°, so **the ±15 ft and the ±2° are real**. Third, **Chadwick draws a west
annex that the modern quadrangle does not have** — his Regulars' Quarters project west off the west
wall in a rectangular wing — so the fort of 1836 was **larger and less regular than the fort of today**.

**The National Register's dimension does not reproduce.** S5 says the quadrangle is "approximately
one-seventh of a mile in its exterior circumference". One-seventh of a mile is **754 ft**. The measured
perimeter is **1,390 ft**, and 754 ft of perimeter would be a square **189 ft on a side** — smaller
than the chapel and the west range together. **Either the figure is a copying error, or it describes
something other than the walls.** It has since been repeated, as "one-seventh mile in diameter", by
tertiary sources. **Do not use it.**

**The stated wall height is eight feet** — S7, of the present reconstruction, quoted in §1. Nothing
read gives a height for the 1835 walls, and S3's "perfect recked State" suggests they were not
uniformly at any height in October 1835.

### 2.4 The chapel — Our Lady of Loreto

**Documented:**

| | |
| --- | --- |
| Position | **in the north wall, west of centre**, near the north-west corner (S5, S9, S13) |
| Dimensions | **about 90 ft long, 27 ft wide, walls 4 ft thick** (S5) |
| Measured footprint | **86 ft along the north wall × 75 ft deep** including projections (S10) — the 86 ft agrees with S5's 90 ft to within 5 % |
| Date | **S5: built between 1775 and 1790.** **S8 (site panel): "built in 1779."** **S1c: "virtually intact since 1749."** **Three sources, three answers** — see below |
| Material | white limestone, one storey, **groin-vaulted** — S7 says one of the only buildings anywhere with its original groin vault in place |
| Façade | arched entrance; **massive square bell tower**; **octagonal window** over the door lighting the choir loft; semicircular pediment crowned with a cross framing a rough stone arched niche with a statue (S5, and **visible in the 1936 HABS photograph**, S6) |
| Interior | shell-formed doorway to a **side chapel**; **sacristy projecting from the outer wall** (S5) |
| Use | built for the soldiers **and for the Spanish settlers living in the town around the fort** (S7) — i.e. it was the town's parish church as well as the garrison's |

**The three dates are a real disagreement and this report does not resolve it.** S1c's "virtually
intact since 1749" is probably loose usage for "the oldest building on the site"; the presidio's own
panel says 1779; the National Register says 1775–1790. **All three agree on the one thing that matters
here: the chapel standing in October 1835 was the same stone building that stands today.**

**Which way the façade faces is NOT established, and nobody should guess it.** Three readings were
found and they do not agree: S5 has the sacristy "on the left" projecting from the outer wall as you
enter; the fragments of the SAH Archipedia entry that could be read put **the tower and sacristy on the
north wall of the nave and the side chapel on the south wall**, which would make the nave run
east–west; and a photograph captioned "West elevation of Our Lady of Loreto chapel" is in circulation.
**And there is a documented precedent for getting it wrong**: Chadwick drew only the church's outline,
so **the 1836 lithographer put the bell tower on the wrong end** (S9, quoted), and Raiford Stripling
spent four years of restoration unsure whether the lithograph could be trusted. **If the game ever
draws this chapel, the end that carries the tower must be checked against a photograph, not inferred.**

### 2.5 What was ruinous and what was sound in October 1835

This is the question the brief asked, and for once it has a direct primary answer.

| Element | State in October 1835 | Source |
| --- | --- | --- |
| **The outer wall** | **"in a perfect recked State"**, with **breaches**; "requires considerable repairs to Make it in any way tenable". The breaches were repaired within about eleven days of the capture | **S3** (Col. B. F. Smith), **S4** (Dimmitt, 21 Oct) |
| **The bastions** | still unrepaired on 21 October — "the bastions will be done tomorrow" | **S4**, quoted |
| **The chapel** | **sound.** It is the one building at Goliad that has never not been standing, and it was solid enough that forcing its doors was the way into the fort | S2, S5, S6 |
| **The officers' quarters / west range** | **standing.** A long one-storey stone range with an arched door survived to be photographed in 1936, a century after it was abandoned | **S6** (HABS photo 157453) |
| **Walls and soldier housing generally** | had been reported in disrepair **as early as 1791** and were never properly restored under Mexico | **S7** |
| **The water supply** | **outside the walls.** Smith expects a besieger to "cut off our Supplies of water"; Chadwick marks the watering place `E` in the ditch and ravine at the north-west angle, outside | **S3**, **S9** |
| **The armament left in it** | **junk.** Ingram's return of 13 October 1835: 200 stands of muskets and carbines, "the greater part are broken and entirely useless"; 100 4-lb shot but no serviceable gun listed to fire them; 44 lance heads; rusty camp kettles | **S3** |

**So the fort the game's army takes is a masonry quadrangle with holes in it, no working guns, no well
inside, and one completely sound building — the church.** That is a far more interesting thing to draw
than a restored fort, and it is documented.

### 2.6 Gates and openings

- **S5 (1977): three gates, in the north, west and south walls.** This describes the restored fort.
- **S9 (1836): one sally port `G`, in the south wall**, with the prison and guard house inside flanking
  it and a 6-pounder on a platform to its west; and **`E`, the watering place, an opening at the
  north-west angle** giving on to the ditch and ravine.
- **The church stands in the north wall and its doors were forced from outside** (S2, §3.2) — so there
  was a way to the church door that did not go through a gate, which is what you would expect of a
  chapel that served the town as well as the garrison (S7).

**Nothing read positions a west gate in 1835 or 1836.** If a west gate is drawn, mark it invented.

---

## 3. Documented — how it was taken, 9–10 October 1835

### 3.1 The sequence, from the primary letters

| When | What | Source |
| --- | --- | --- |
| 2 Oct 1835 | Cos enters Goliad with an honour guard of thirty, followed by the Morelos battalion, 400+ | S1e |
| 5 Oct | **Cos leaves for Béxar**, leaving **27 men under Lt. Col. Francisco Sandoval and Capt. Manuel Sabriego**, and his supplies, which he had no transport for | S1e |
| 8 Oct, noon | **Collinsworth in camp on the Guadalupe**: "I have under My charge **47** Good and Effective men"; believes "there is from 60 to 100 troops in that place"; will enter "to Night or tomorrow" | **S2** |
| 9 Oct | At Victoria. **Forty-nine men sign the "Compact of Volunteers."** Reinforced by about thirty from Victoria, Goliad and around — Silvestre De León, Carbajal, Dimmitt, Benavides; Linn sends to Refugio for more | S1e |
| 9 Oct, after dark | Marched **south-westward across the prairie** to **Manahuilla Creek**; rested; **Ira Ingram** takes a small party to scout the town; **Benjamin R. Milam**, just escaped from Monterrey, falls in with them on the road | S1e |
| **9 Oct, ~11 p.m.** | **"I arrived here last night at 11 Oclock and marched into the fort, by forcing the Church doors"** | **S2, quoted** |
| | About thirty minutes' fighting | S1e, S13 |
| 10 Oct, 8 a.m. | Collinsworth writes from inside | S2 |
| 10 Oct, 11 p.m. | Milam reaches Victoria with three officers as prisoners; Kerr forwards Collinsworth's letter to the Council of War at Gonzales | S2 |
| 13 Oct | Ingram's ordnance return of what was taken | S3 |
| 21 Oct | **"the little band that entered this place on the night of the 9th., inst."**; breaches repaired, bastions next; effective force 50 | **S4, quoted** |

### 3.2 Where they broke in

**"By forcing the Church doors" (S2).** That is the whole of the primary evidence, and it is five
words written eight hours afterwards by the man who led them.

It is only usable because a second source places the church: **Chadwick draws the church set into the
north wall** (S9), and the modern reconstruction and the National Register put it in the same place
(S5, S10). **S13's "hacked through a door on the north wall" is therefore not an independent third
account — it is the same fact, restated.** Two sources, not three.

**So, for drawing an assault:** the Texians came at the **north wall**, forced the **church doors**,
and were inside the **parade ground** — because the church's own interior opens on to it. The church is
**west of centre in the north wall**, which puts the break-in about a third of the way along the north
side from the north-west bastion.

### 3.3 The ground they crossed — and why this is the hard part

Here the measurements and the documents pull against each other, and the honest answer is that the
approach is **not settled**.

- **The ground north of the fort is a bluff.** USGS 3DEP (S11): fort platform **186–190 ft**; 100 ft
  north **177 ft**; 300 ft north **139 ft**; the river bank **101 ft**; the channel **96 ft**. **A fall
  of about ninety feet in seven hundred**, with the river's nearest approach **865 ft** north of the
  fort's centre. Chadwick draws exactly this, in hachure, between the river and his north wall.
- **The ground south and west is flat.** 500 ft south **190 ft**; 1,500 ft south **183 ft**; 3,000 ft
  south **177 ft**. Furber in 1846 saw the ruins "covering the top of the hill", with the valley on the
  north-east and the prairie "level as the sea" on the south-west (S8-Strategic, quoting Furber).
- **The town lay on the south and west**, up against the walls (§5.3).
- **They came from Victoria**, which is north-east, and halted on **Manahuilla Creek**, whose mouth is
  on the San Antonio **five miles east of Goliad** (S1g). **So they approached from the east or
  north-east.**
- **Chadwick names a ford north of the town, on the Victoria road** (S9). Whether Collinsworth's column
  used it — crossing to the north bank and back, or coming down the south bank and never crossing —
  **is not stated anywhere read.**

**What can be drawn honestly:** a column arriving out of the east or north-east in the dark, over open
prairie, to a wall that is **a third of a mile round, eight feet high, breached in places, on the lip
of a ninety-foot bluff with the river behind it and a sleeping town against its other side.** What
cannot be drawn honestly is a specific line of approach.

### 3.4 What it cost, and three sources that disagree

| | Mexican killed | Mexican wounded | Prisoners | Texian |
| --- | --- | --- | --- | --- |
| **Collinsworth, 10 Oct 1835 (S2)** | **1** | **3** | **3 officers + 21 soldiers** | 1 wounded in the shoulder |
| **TSHA (S1e)** | **3** | **7** | **21** | "several wounded", none killed |
| **NRHP 1977 (S5)** | — | — | — | "Only 24 Mexican soldiers … the takeover met with no resistence" |

**`HIST-TEX-018` records this disagreement correctly and excludes the cost. That was the right call and
it survives contact with the primary source.** The three accounts agree only on the twenty-one
prisoners and that no Texian was killed. S5's "no resistance" is contradicted by Collinsworth himself
and should be disregarded.

### 3.5 `HIST-TEX-018` checked, and where it needs one qualification

The brief asked for this row to be checked rather than assumed. **It holds.**

- **"the night of October 9–10" — CONFIRMED TWICE from primary sources.** Collinsworth's own letter is
  headed 10 October and says "last night at 11 Oclock" (S2); Dimmitt on 21 October writes of "the
  night of the 9th., inst." (S4). Two independent hands.
- **"Austin twice wrote 'the 8th inst. with a force of fifty men' and was mistaken" — CONFIRMED.**
  Austin's letter to the San Felipe Committee of 11 October, printed in the same volume, says exactly
  that.
- **"his force as 47" — CONFIRMED, and now sourced precisely.** It is Collinsworth's own count in his
  letter of **noon, 8 October, in camp on the Guadalupe** (S2) — **two days and one march before the
  assault**.
- **The one qualification.** **47 was not the force that stormed the fort.** Between that letter and
  the assault the company picked up about thirty volunteers at Victoria and more from Refugio "before,
  during and after the assault"; forty-nine signed the Compact on 9 October; and TSHA puts the ultimate
  strength at "probably … some 120 men" (S1e). Ten days later Dimmitt's garrison was still 50, and
  Smith's had been about 120 (S3, S4). **If the class is ever told a number, "47" is the number
  Collinsworth wrote down before he set out, not the number that went over the wall.** Suggested
  wording is in §9.
- **The 1965 State Historical Survey Committee marker in the new town gets it wrong in the same way
  Austin did**: "Capt. George Collingsworth, Ben Milam and 48 men took Mexican garrison **Oct. 8,
  1835**" (S8-Goliad). **Worth recording in `HIST-TEX-018` so that nobody later "corrects" the game
  from the roadside.**

---

## 4. Documented — the mission Espíritu Santo, across the river

**Position, measured** (S10, S11): the mission church stands **3,712 ft — 0.70 mile — from the centre
of the presidio, bearing 340° (north-north-west)**, at **161 ft** elevation, with the river **619 ft**
away to its north-west at **98 ft**. **It is on the opposite bank**: a straight line from fort to
mission crosses the San Antonio once.

**The 1969 Texas marker's "Espiritu Santo Mission (1/4 mi. NW)" is wrong** (S8, S14). A quarter mile is
1,320 ft; the measured distance is 3,712 ft, **2.8 times further**. NPS repeats a similar figure. What
is a quarter mile away is the southern edge of Goliad State Park, not the mission.

**What stood there in 1835: a ruin.** This is the second thing the brief should be warned about, and it
matters more than the presidio's reconstruction.

- Secularised **February 1830**, the last missions in Texas to comply (S1d).
- By the revolution, TSHA says events centred on the presidio rather than the mission, **"which had
  fallen into ruin"** (S1d, quoted). The 1969 state marker agrees: "After a general decline caused the
  mission to be secularized in 1830, **it fell into ruin.**"
- Goliad's own people were carting its stone away for building in town (S8-Mission Espíritu Santo).
- **What stands there now is a 1930s reconstruction**: WPA and CCC labour under National Park Service
  architects rebuilt the **chapel, granary and workshop** in 1936–39, with additional work in the
  1960s, and by 1987 the mission "appeared as it did in 1749" (S1d, S8). A CCC lime kiln still stands
  4,357 ft north-north-west of the fort and is itself a marked historic ruin.

**So: drawing today's Mission Espíritu Santo for 1835 is a worse error than drawing today's presidio
for 1835.** The presidio was at least a functioning if broken fort in October 1835. **The mission was
a stone shell being quarried by its neighbours.**

**What the mission had been, for scale if a ruin is ever drawn** (S1b, S1d): a stone church and friary
with Indian quarters that housed 178 people in 1758; the Aranama and Tamique still living in
**jacales — "crude clay-plastered brush huts thatched with grass"** (S8); a south gate guarded by
soldiers from the presidio; 3,220 branded cattle, 120 horses and 1,600 sheep in 1758; and in 1767–68
Solís found the presidio visible across the river, which was **crossed by canoe**.

---

## 5. Documented — the town, the river, the roads and the ground

### 5.1 What kind of place this was

**Goliad in 1835 is not a town plan. It is a presidial settlement.** There is no founder, no
commissioner, no surveyor, no plat, no block count and no street name in anything read — and that is
not a gap in the record, it is the answer. The sequence was:

1. **1749**: the presidio moves to Santa Dorotea on the San Antonio River. Within six months it holds
   **a large barrack, forty temporary houses, a garrison of 29 soldiers and their families, the
   captain's stone house built at his own expense, and a church** (S1b).
2. **"Around the presidio walls grew the settlement of La Bahía"** (S1a).
3. **1796: 1,138 residents. 1803: 618 soldiers and settlers. 1810: 655.** (S1b)
4. **4 February 1829**: on Rafael Antonio Manchola's petition, La Bahía is raised to a *villa* and
   renamed **Goliad**, an anagram of Hidalgo. The municipality it heads runs from the Nueces to the
   Lavaca and from the Gulf to the Béxar line (S1a, S1b).
5. **1834**: a cholera epidemic "nearly destroyed the settlement, but it survived" (S1a). Manchola
   himself had died of cholera in July 1833 (S8-Manchola).
6. **1835–36**: "Much of the town was destroyed in 1835-36" (S8-Strategic).
7. **After 1836**: the old town is deserted and the new town is built **north of the river**, because
   nobody would buy old-town property whose Spanish and Mexican titles could not be proved (S1a).

### 5.2 What the town was built of, and where it stood

**Documented:**

- **"the town of Goliad that extended to the walls of the fort"** — the presidio's own panel on the
  **south-west bastion**, from which the old town was overlooked (S8-Strategic, quoted). So the town lay
  **south and west of the fort, on the level prairie, running right up to the masonry.**
- **Stone houses and jacals.** In 1829 "the town had a number of **stone houses** belonging to wealthy
  citizens… Flanking the stone structures stood **dozens of jacals, huts of post and mortar
  construction that sheltered most of the villa's inhabitants**" (S1a). **That sentence is the whole
  documentary description of the built town of Goliad in the year the game plays**, and it is worth
  more than any plat: **a handful of stone houses, and dozens of jacales, most of the people in the
  jacales.**
- **One of those stone houses has a position.** **Ignacio Seguín Zaragoza was born in the town on 24
  March 1829** in one of the stone houses (S1a); the marked birthplace site stands at fort-frame
  **(−38, 346)** — about **60 ft west and 100 ft south of the fort's south-west angle** (S10). Whether
  that is the actual house or a commemorative siting is not established here, **but it is the only
  point in the 1835 town with a coordinate.**
- **Madam Garcia's house**, "new & very strongly built", stood **outside the walls beyond the
  south-east angle** in March 1836 — solid enough that Fannin meant to run a platform from it to the
  south-east blockhouse and mount a 6-pounder on its roof (S9). **A second stone house with a position,
  and the only one whose construction a contemporary vouched for.**
- **The La Bahía Cemetery**, at fort-frame **(895, 522)** — about **900 ft east-south-east of the
  fort** — was "established in conjunction with the chapel" and historical accounts place a cemetery at
  La Bahía "as early as the 1830s" (S8-Cemetery). **A third fixed point in the 1835 town.**
- **The Refugio road came into the town from the south and east**, and Chadwick calls the thing it
  entered by a **street** — "the st[reet] south of the fort & east" (S9). **The only hint anywhere that
  the town had a named or laid-out way through it.**

### 5.3 What the town's plan was — and why there probably wasn't one

**Nothing read describes a grid, a plaza, a block or a lot at Goliad before 1836.** Against the pattern
of this series that is striking: San Felipe, Victoria, Mina, Matagorda, Columbia and Liberty all had
platted plans, and five of the six could be recovered. **Goliad had none to recover.** Two reasons, both
documented:

1. It grew against a fort's walls from 1749 as a garrison's dependency, not as a colonisation grant
   laid out by a commissioner.
2. Its land titles were so uncertain that after 1836 people **refused to buy in the old town** and
   built a new one across the river instead (S1a) — behaviour that does not follow from a surveyed,
   recorded plat.

**A plan may still exist** — in Béxar or Coahuila archives, or in the four-league grant Houston signed
in 1844 (S1a). None was found. **Until one is, a drawn Goliad should be a scatter, not a grid** (§8.6).

### 5.4 The river, the bluff and the ground — measured

USGS 3DEP (S11), in the fort frame, all values feet above sea level:

```
the fort platform ................................. 186 - 190   (N wall 186, centre 189, S wall 188)
100 ft north of the north wall .................... 177
300 ft north ...................................... 139        <- the bluff
500 ft north ...................................... 143
the south bank of the river ....................... 101
the river channel, 865 ft north of the centre ..... 96         <- ~90 ft below the fort
1,000 ft north (across the river) ................. 121
500 ft south ...................................... 190
1,500 ft south .................................... 183
3,000 ft south .................................... 177        <- level prairie for a mile
1,000 ft west ..................................... 174
2,000 ft west ..................................... 160
1,000 ft east ..................................... 168
2,000 ft east ..................................... 156
Fannin Memorial Monument, 1,200 ft SE ............. 195        <- the high point
Mission Espiritu Santo ............................ 161
the river below the mission ....................... 98
```

**So the fort stands on the highest ground within half a mile, on the lip of a bluff that falls ninety
feet to the river on the north, with the ground falling gently away east and west and staying dead
level to the south for three thousand feet.** Furber saw it in 1846 and described exactly that. This is
the single most drawable fact in the report.

**The river, measured** (S10). At Goliad the San Antonio runs a serpentine of great meanders. In the
fort frame it comes down from the north-west, loops out to **3,000 ft north-west**, turns back
south-east, **passes 865 ft due north of the fort at its nearest**, then swings north-east and away to
the east. **The fort sits outside the bend, on the south-west bank.** The USGS gauge *San Antonio Rv at
Goliad* (08188500) stands 965 ft north-west of the fort's centre at 27.8 ft NGVD29.

**The crossing.** Chadwick names **"the ford N of the town"**, commanded by the north-west blockhouse,
and **"the ford & road from Victoria"** (S9). Solís in 1767–68 found the river between mission and
presidio **crossed by canoe** (S1d). **No position, width or approach for the ford is given anywhere
read.** There was no bridge: the state-funded bridge at Goliad dates to Judge J. A. White's 1931 bill
(S8-White).

### 5.5 The roads, and `HIST-TEX-008`

**`HIST-TEX-008` is right about Goliad and is corroborated here.** TSHA's Goliad County entry
independently gives the roads that met at La Bahía: **the Atascosito Road to East Texas, the La Bahía
Road from Monclova to Nacogdoches, and roads from Béxar and from its port El Cópano** (S1b). Chadwick
adds, from inside the fort in 1836, **the Refugio road** entering from the south and east and **the
Victoria road** over the ford (S9).

**Measured bearings and distances from the presidio** (S10), for anyone drawing the roads:

| To | Distance | Bearing |
| --- | --- | --- |
| Mission Espíritu Santo | 3,712 ft (0.70 mi) | 340° |
| The 1836 burial ground (Fannin Memorial Monument) | 1,202 ft | 121° |
| Manahuilla Creek's mouth on the San Antonio | ~5 mi | east (S1g) |
| **The modern town of Goliad (courthouse square)** | **7,154 ft (1.35 mi)** | **~337°** |
| **Goliad's official GNIS coordinate (`HIST-TEX-010`)** | **7,732 ft (1.46 mi)** | **~342°** |

**And that last row is the correction this report exists to make.** `HIST-TEX-010` seats Goliad at
28.66833, −97.38833. **That point is a mile and a half from the presidio, on the far side of the San
Antonio River, in a town that was laid out after the Texas Revolution.** The row already carries the
honest caveat — "La Bahía across the river from Goliad… the offset is noted there and not yet
measured". **It is measured now: 7,732 ft on a bearing of about 342°.** §9 says what to do with it.

For completeness, **the post-1836 town measured** (S10, S12): a true-cardinal grid — east–west streets
bear **89.5°–90.2°**, north–south streets **0.0°–0.7°** — on a module of about **628 ft north–south and
420 ft east–west**, with the courthouse square a full block in the middle. **It is a Republic-era
Anglo grid and has nothing to do with 1835.** It is recorded here only so that nobody draws it.

---

## 6. Documented — the reconstruction, and what is original fabric

The brief was right to flag this, and the evidence is unusually good.

**What survived to 1936, from five photographs taken that year** (S6, all viewed here):

- **The chapel, complete** — bell tower, arched entrance, octagonal window, pediment, cross, niche and
  statue. Restored as a New Deal public-works project about 1935 (S1c), so even in 1936 it was a
  repaired building, but the fabric is the eighteenth-century church.
- **One long one-storey stone range**, with an arched doorway, a square window and a round window,
  standing to full height — almost certainly the officers' quarters, now the museum.
- **A few hundred feet of low rubble wall** and one small square structure, standing perhaps eight to
  ten feet.
- **Grass.** In two of the five frames the foreground is waist-high meadow where the parade ground is.

**What the documents say about the rest:** "Most of the presidio was now in ruins" by the 1850s (S1c);
"the Presidio was completely abandoned and fell into ruins. **Only the chapel was preserved in tact**"
(S5); "barely any walls left, mounds of rubble everywhere" from 1837 to 1963 (S7); the walls scavenged
for building material (S9). Fannin had been ordered to destroy what he could on evacuating in March
1836 (S7); Vásquez and Woll raided in 1842; discharged U.S. soldiers damaged it after 1848; Pryor Lea
lived in the chapel from about 1846 and gardened the parade ground (S1c, S5).

**What the reconstruction was:**

| | |
| --- | --- |
| Begun | **24 April 1963**; dedicated **8 October 1967**; NHL plaque dedicated by Lady Bird Johnson **9 April 1968** (S5, S7, S1c) |
| Paid for by | the **Kathryn Stoner O'Connor Foundation**, with the Diocese of Victoria |
| Directed by | **Raiford Stripling**, architect-restorer, and **Roland E. Beard**, archaeologist |
| Material | **stuccoed limestone** (S1c) |
| Evidence used | about **500 photographs** first; then archaeology, which found **nine levels of occupancy**; then **the 1836 New York lithograph of Chadwick's plan**, with Chadwick's original arriving from Virginia two weeks before the dedication (S7, S9, S1c) |
| Target | **"its 1836 appearance"** (S8) |

**So, plainly: of what a visitor sees today, the chapel is original fabric and the officers' quarters
range is substantially original. The walls, the bastions, the sentry boxes, the barracks and the gates
are 1960s reconstruction on archaeological evidence, stuccoed limestone, rebuilt to a 1836 target using
a drawing made by a twenty-something adjutant who died three weeks later.**

That is a good reconstruction — S1c calls it among the most authentic in the United States — but **it
is a reconstruction of 1836, not of 1835**, and 1836 is after Fannin's men worked on it. §2.5 is what
1835 looked like.

---

## 7. Unknown — what a layout would need and no source read supplies

Everything here would have to be invented and registered as fiction.

1. **Any measured plan of the presidio with dimensions on it.** Chadwick's lithograph carries **no
   scale**. §2.3's numbers are measured off the *reconstruction*. **No source read states the length of
   any wall of this fort.**
2. **The height of the 1835 walls.** The only stated height, eight feet, is S7's description of the
   present reconstruction.
3. **Wall thickness, anywhere except the chapel** (4 ft, S5).
4. **The bastions' size and shape in plan.** "Four rounded bastions" with "stone sentry boxes" on three
   of them (S5) is the whole of it. No diameter, no height, no embrasure count.
5. **Which end of the chapel carries the façade and bell tower** (§2.4). The 1836 lithographer got it
   wrong, and this report will not repeat his mistake by guessing.
6. **Where the well was, or whether there was one.** The brief asked. **Nothing read mentions a well
   inside the presidio**, and the evidence points the other way: the watering place is outside, in the
   ravine (S9), and a besieger was expected to be able to cut the water off (S3).
7. **The interior room plan.** Chadwick labels the Commanding Officer's Quarters, the Regulars'
   Quarters and the King's Arsenal, and no source gives a room count, a room size or a door position
   for any of them. **The single biggest gap if a student is ever to walk inside.**
8. **How many gates in 1835, and where.** §2.6: S5 says three; Chadwick draws one sally port and one
   watering-place opening.
9. **The line of Collinsworth's approach** (§3.3).
10. **The position of the ford**, its width, its bottom and its approaches on either bank.
11. **Any plan, extent, street or house position for the town of La Bahía in 1835** beyond the three
    coordinates in §5.2 and Chadwick's "street south of the fort & east".
12. **The number of houses and the population of the town itself in 1835.** `HIST-TEX-011` gives the
    **municipality** 700 in 1834 — a jurisdiction running from the Nueces to the Lavaca. The last town
    figures are **1,138 (1796), 618 (1803), 655 (1810)**, and a cholera epidemic in 1834 "nearly
    destroyed the settlement" (S1a, S1b). **Nobody read counts Goliad's houses or its people in 1835.**
13. **The size of Sandoval's garrison, exactly.** Cos left 27 (S1e); Collinsworth took 24 and 4 hit
    (S2); "almost twenty" escaped (S1e); the National Register says 24 total (S5). **These cannot all
    be true.**
14. **What Espíritu Santo's ruin actually looked like in 1835** — how much wall stood, whether the
    church was roofed, how far the quarrying had gone.
15. **The 1835 course of the San Antonio River.** §5.4 measures the modern channel. This reach
    meanders heavily and nothing read establishes that it has not moved.
16. **Where the Refugio, Victoria, Béxar, Copano and La Bahía roads actually ran on the ground**
    within a mile of the fort.
17. **Anything about the 1963–67 archaeology that a drawing could use.** No wall line, no footprint, no
    stratum, no find-spot (§1b). **This is the most disappointing gap in the report**, because the
    brief was right that it should exist.

---

## 8. Inferred — things that follow but that nobody states

Each is an inference of this document and must be labelled as one if it is used.

- **I-1. The modern reconstructed quadrangle stands on the 1835 wall lines.** The load-bearing
  inference for §9's frame. Supporting it: the restoration was archaeological, began by uncovering the
  site, found nine occupation layers, and was built to Chadwick's plan (S1c, S7, S9); the chapel, which
  did not move, sits in the north wall exactly where Chadwick draws it. **But nobody states that the
  reconstruction followed excavated footings rather than approximating them**, and §2.3 shows the
  present quadrangle is *not* the shape Chadwick drew, because his west annex is gone. **If this is
  wrong, every dimension in §9 is wrong.**
- **I-2. The fort is about 350 ft square and its walls bear about 96° and 186°.** Measured off the
  reconstruction to ±15 ft and ±2° (§2.3). The rotation is real and worth keeping: **a Goliad drawn
  square to the compass will be about five degrees wrong**, which is visible at the scale of a
  quadrangle.
- **I-3. There was no well inside the walls in 1835.** An argument from two silences and one positive:
  no source read mentions a well; Chadwick's watering place is outside; Smith expected water to be cut
  off (S3, S9). **Treat as probable, not proved.** If the reconstruction has a well in the parade
  ground, that is not evidence for 1835.
- **I-4. The town lay in an arc south and west of the fort, thinning outward.** From the south-west
  bastion overlooking it (S8-Strategic), the Zaragoza birthplace 100 ft off the south-west angle, the
  Refugio road entering "south of the fort & east", Madam Garcia's house outside the south-east angle,
  and the cemetery 900 ft east-south-east. **Nobody read draws or describes the town's extent.**
- **I-5. There was no street grid.** §5.3. An argument from complete silence across seven sources and
  from the town's origin and its post-1836 abandonment. **Strongly held, but an argument from silence.**
- **I-6. Most of the town's buildings were jacales, and the few stone houses stood among them, not in
  a row.** From S1a's one sentence — "Flanking the stone structures stood dozens of jacals" — read
  literally.
- **I-7. The Texians came out of the east or north-east.** From Victoria, by Manahuilla Creek, whose
  mouth is five miles east (S1e, S1g). **Nobody states the compass bearing of the final approach**, and
  the ford north of the town leaves open that they crossed and re-crossed.
- **I-8. The church door they forced was reachable from outside the fort without passing a gate.** From
  the fact that they forced it and were then inside, plus S7's statement that the chapel served the
  townspeople as well as the garrison. **Nobody describes the approach to the church door.**
- **I-9. In October 1835 the fort mounted no serviceable artillery.** Ingram's return lists 100 rounds
  of 4-lb shot and no gun (S3); Cos had taken his guns to Béxar and left his supplies behind only for
  want of transport (S1e). **Nobody says the fort had no cannon.**
- **I-10. Goliad in 1835 was a shrinking place, not a growing one.** 1,138 people in 1796, 655 in
  1810, cholera in 1834, "much of the town destroyed in 1835-36", and complete abandonment after.
  **Nobody counts it in 1835.**
- **I-11. The bluff was the fort's north face and nobody attacked up it.** From the ninety-foot fall in
  seven hundred feet (§5.4) and from the fact that the north-west blockhouse was sited to command the
  ford and the ravine rather than the slope. **An inference from ground, not from a document.**

---

## 9. A suggested layout sketch

**In two vocabularies, because Goliad needs both.** The fort is in the terms of
`public/alamo-layout.js` — feet, a north-up local plane, `walls` with `thickness`, `heightFeet` and
`material`, `rooms`, `doors`, `roofs`, `ground` polygons. The country around it is in the terms of
`public/bexar-layout.js` — a river with a width, roads with widths, buildings with a sprite and a
height.

**Read this first.** **Less of this frame is real than Liberty's and more of the content is than
Matagorda's.** The quadrangle, the chapel's position and dimensions, the four corner bastions, the
sally port in the south wall, the three fixed points in the town, the bluff, the river and the
distances are measured or stated. **Every interior room, every gate but one, every wall height, the
well, the whole plan of the town and the entire approach are invented.** Items marked `INVENTED` are
invented; if this is built it should be registered under a new `FIC-` ID with a `note` in the spirit of
the one at the foot of `ALAMO_LAYOUT`.

### 9.1 Frame

| Thing | Value | Status |
| --- | --- | --- |
| Units | feet | fixed |
| Plane | **fort-aligned**: origin at the **north-west outside corner of the quadrangle**; `+x` runs along the north wall, `+y` runs along the west wall | choice of frame |
| True bearing | rotate the plane so `+x` bears **96°** and `+y` bears **186°** | **measured**, ±2° (§2.3) |
| **Quadrangle** | **x 20 → 375, y 20 → 358** — about **355 × 338 ft** | **measured** off the reconstruction, ±15 ft (`I-1`, `I-2`) |
| Perimeter | ~1,390 ft = 0.26 mi | **measured** |
| **Wall height** | **8 ft** | **stated** for the reconstruction (S7); **NOT stated for 1835** |
| Wall thickness | **3 ft** | `INVENTED` — no source read gives one |
| Wall material | **limestone**, one storey | **stated** (S5) |
| Bounds (fort only) | `{x:-40, y:-40, width:460, height:440}` | frame choice |
| Bounds (the place) | `{x:-3000, y:-3600, width:7000, height:5000}` — holds the fort, the town, the bluff, the river and the mission | frame choice |

### 9.2 The enceinte

```
// The quadrangle. MEASURED from the reconstruction (S10); see I-1 before using.
// Walls bear 96 deg (+x) and 186 deg (+y); draw them square and accept ~2 deg.
wall('north', {x:20,y:20},  {x:375,y:20},  {thickness:3, heightFeet:8, material:'limestone'});
wall('east',  {x:375,y:20}, {x:375,y:358}, {thickness:3, heightFeet:8, material:'limestone'});
wall('south', {x:375,y:358},{x:20,y:358},  {thickness:3, heightFeet:8, material:'limestone'});
wall('west',  {x:20,y:358}, {x:20,y:20},   {thickness:3, heightFeet:8, material:'limestone'});

// Four ROUNDED corner bastions, built to mount cannon; STONE SENTRY BOXES on
// THREE of them (S5 - which three is not stated; omit the box at one corner and
// mark the choice INVENTED). Chadwick's names, March 1836 (S9):
//   NW = 'D', the block house that commands the ford and the ravine
//   NE = 'F', the work shop, to be strengthened and a gun mounted on top
//   SE = 'A', the block house whose gun commands the entrance from Refugio
//   SW = 'B', BLOCK HOUSE IN PROGRESS -- unfinished in March 1836
// Diameter 30 ft INVENTED; the measured NW footprint is 33 x 29 ft.
bastion('nw-blockhouse', 20, 20, 30, {sentryBox:true});
bastion('ne-workshop',  375, 20, 30, {sentryBox:true});
bastion('se-blockhouse',375,358, 30, {sentryBox:true});
bastion('sw-blockhouse', 20,358, 30, {sentryBox:false, unfinished:true /* 1836 */});

// THE SALLY PORT. Documented in the SOUTH wall (S9); its position along that
// wall is INVENTED (Chadwick draws it near the middle).
doors.push({id:'sally-port', x:200, y:353, width:10, height:10});
// Flanking it INSIDE: M = prison (west), N = guard house (east). Chadwick 1836.
// Positions INVENTED.

// 'E', THE WATERING PLACE -- an opening at the NW angle giving on to the ditch
// and ravine outside (S9). DOCUMENTED that it existed; position INVENTED.
doors.push({id:'watering-place', x:56, y:20, width:8, height:8});

// The 1977 National Register says THREE gates, north, west and south (S5).
// Only the south one is corroborated. If a west gate is drawn, mark it INVENTED.

// a.a.a. THE DITCH, outside the walls. DOCUMENTED (S9). Line INVENTED.
// b.b.b. PICKETS. DOCUMENTED for MARCH 1836 ONLY -- do NOT draw for 1835.
```

### 9.3 The buildings inside

```
// THE CHAPEL OF OUR LADY OF LORETO. The one building at Goliad that is
// original fabric and that certainly looked in 1835 as it does now.
// Position in the north wall, west of centre: MEASURED (S10) and drawn there by
// Chadwick (S9) and described there by the National Register (S5).
room('chapel','Our Lady of Loreto', 90, 16, 90, 27, 'e', {wallHeight:23, wallThickness:4});
// 90 x 27 ft and 4 ft walls: STATED (S5). Measured footprint 86 x 75 ft overall,
// the extra depth being the side chapel and sacristy.
// WHICH END CARRIES THE FACADE AND BELL TOWER IS NOT ESTABLISHED (section 2.4).
// The 1836 lithographer put it on the wrong end. Do not guess: check a photograph.
// Square bell tower, arched entrance, octagonal choir window, pediment with cross
// and a statue in a niche, groin vault, side chapel one side, sacristy the other,
// projecting from the OUTER wall: all STATED (S5) and visible in HABS 1936 (S6).

// THE MAGAZINE, immediately south of the church. DOCUMENTED by Chadwick (S9);
// size and exact position INVENTED.
room('magazine','Magazine', 150, 60, 24, 20, 'n', {wallHeight:10});

// THE OFFICERS' QUARTERS -- the west range. Now the museum; substantially
// ORIGINAL FABRIC, standing in the 1936 photographs (S6).
// MEASURED footprint x 15-86, y 69-292 = 71 x 223 ft (S10).
room('officers-quarters','Officers’ quarters', 20, 69, 66, 223, 'e', {wallHeight:12});
// Internal partitions: ENTIRELY INVENTED. No source read gives a room plan.

// THE SOUTH RANGE (enlisted men's barracks). MEASURED x 214-322, y 339-358 (S10).
room('barracks','Enlisted men’s barracks', 214, 339, 108, 19, 'n', {wallHeight:12});

// Chadwick names three more, all on the WEST side, all positions INVENTED:
//   10 Commanding Officer's Quarters, 11 Regulars' Quarters, 12 King's Arsenal.
// NOTE: Chadwick's Regulars' Quarters sit in a RECTANGULAR ANNEX projecting WEST
// off the west wall. THE MODERN QUADRANGLE HAS NO SUCH ANNEX. If the fort is
// drawn for 1835-36 rather than for today, that annex should be there, and its
// size is INVENTED.

// NO WELL IS DRAWN. See I-3. The water was outside, at 'E'.
ground.push({id:'parade', label:'Parade ground',
  points:[{x:20,y:20},{x:375,y:20},{x:375,y:358},{x:20,y:358}]});
```

### 9.4 The state of it in October 1835 — the thing to get right

```
// DO NOT DRAW A RESTORED FORT. On the night of 9-10 October 1835 this place was:
//  - masonry, one storey, limestone, quadrangular  ............. DOCUMENTED
//  - WITH BREACHES IN THE OUTER WALL ........................... DOCUMENTED (S3, S4)
//  - bastions unrepaired .................................... DOCUMENTED (S4)
//  - the chapel SOUND and its doors the way in ............... DOCUMENTED (S2)
//  - no serviceable artillery in it ............................ I-9
//  - no water inside the walls ................................. I-3
// Make some wall segments DESTRUCTIBLE/ALREADY-BREACHED. ALAMO_LAYOUT's
// createDamageState/damageWall pair already does exactly this; Goliad is the
// place where a wall starts damaged rather than becoming so.
// HOW MANY breaches and WHERE: INVENTED. Nothing read says.
```

### 9.5 The ground outside — measured

```
// THE SAN ANTONIO RIVER. MEASURED from OSM centrelines (S10), in the fort frame.
// WARNING: this is the MODERN channel and this reach meanders (section 7.15).
river: { id:'san-antonio-river', label:'San Antonio River',
  widthFeet: 90 /* INVENTED - no source read gives a width here */, points:[
  {x:-2475,y:-3000},{x:-2601,y:-2801},{x:-2561,y:-2261},{x:-2246,y:-1478},
  {x:-1789,y:-993},{x:-1440,y:-643},{x:-1113,y:-416},{x:-943,y:-405},
  {x:-484,y:-568},{x:-127,y:-674},{x:41,y:-805},{x:103,y:-937},
  {x:371,y:-1695},{x:627,y:-2335},{x:808,y:-2837},{x:1539,y:-2974},
  {x:2006,y:-2717},{x:2251,y:-2454},{x:2532,y:-2485},{x:3128,y:-2636},
]}
// Nearest approach to the fort: 865 ft, roughly due north of the centre. MEASURED.

// THE BLUFF. MEASURED from USGS 3DEP (S11). This is the signature of the place.
//   the fort platform .......................... 186-190 ft
//   100 ft north of the north wall ............. 177 ft
//   300 ft north ............................... 139 ft   <- the break
//   the river bank ............................. 101 ft
//   the channel ................................ 96 ft
//   => about NINETY FEET of fall in SEVEN HUNDRED, on the fort's north face.
//   south of the fort: 190, 183, 177 over 3,000 ft -- DEAD LEVEL PRAIRIE.
//   west 1,000/2,000 ft: 174 / 160.  east 1,000/2,000 ft: 168 / 156.
//   the high point is 1,200 ft SE at 195 ft (the 1836 burial ground).
// Furber, 1846, quoted on the site's own marker: the ruins cover
// "the top of the hill", the valley on the NE, the prairie on the SW.

// THE RAVINE at the NW angle, with the watering place in it. DOCUMENTED by
// Chadwick (S9). Its course is INVENTED; run it from the NW angle down the
// bluff to the river at about {x:-130,y:-670}.
```

### 9.6 The town of La Bahía — a scatter, not a grid

```
// THREE FIXED POINTS, MEASURED (S10), everything else invented:
zaragoza-birthplace   x  -38, y  346   // a STONE house of the town; Ignacio
                                       // Zaragoza born there 24 March 1829
madam-garcias-house   x ~430, y ~400   // OUTSIDE the SE angle; "new & very
                                       // strongly built", March 1836 (S9).
                                       // POSITION INVENTED; the side is documented.
la-bahia-cemetery     x  895, y  522   // a cemetery here "as early as the 1830s"
fannin-burial-ground  x 1142, y  695   // 1836 -- NOT 1835; the high point

// THE REST OF THE TOWN IS INVENTED IN POSITION AND IN NUMBER.
// What is documented is its CHARACTER and its SIDE:
//   - it "extended to the walls of the fort" (S8), on the SOUTH and WEST
//   - a NUMBER OF STONE HOUSES belonging to wealthy citizens
//   - DOZENS OF JACALS, "huts of post and mortar construction", which
//     "sheltered most of the villa's inhabitants"                 (S1a)
//   - NO GRID, NO PLAZA, NO PLAT anywhere in the record            (I-5)
// So: 6-10 stone houses scattered on the level ground south and west of the
// walls, and thirty to fifty jacales among and beyond them, thinning outward,
// with stock, brush fences and open prairie between. Numbers INVENTED.
frontage('stone-houses', [[-60,300],[-90,390],[30,430],[150,430],[260,430],[420,400]]);
scatter('jacales', 40, {south:true, west:true, radius:900});  // INVENTED

// THE ROADS. Documented that they existed and roughly where they came in;
// EVERY COURSE INVENTED.
road: { id:'refugio-road', label:'The road from Refugio',
  widthFeet:30, points:[{x:200,y:358},{x:400,y:520},{x:900,y:700},{x:1800,y:1100}] }
  // Chadwick: the SE blockhouse commands "the entrance to town from Refugio,
  // the st[reet] south of the fort & east."
road: { id:'victoria-road', label:'The road from Victoria, by the ford',
  widthFeet:30, points:[{x:200,y:20},{x:60,y:-400},{x:-130,y:-680},{x:-600,y:-1400},{x:600,y:-2600}] }
  // Chadwick: the NW blockhouse "commands the ford N of the town".
  // THE FORD'S POSITION IS INVENTED. Nothing read locates it.
road: { id:'bexar-road', label:'The road to Béxar' , widthFeet:30, points:[{x:20,y:200},{x:-900,y:-200},{x:-2200,y:-900}] }
road: { id:'copano-road', label:'The road to Copano', widthFeet:26, points:[{x:200,y:358},{x:100,y:1400},{x:-400,y:3000}] }
// Both courses INVENTED; that these roads met at La Bahia is DOCUMENTED (S1b).
```

### 9.7 The mission across the river

```
// MISSION NUESTRA SENORA DEL ESPIRITU SANTO DE ZUNIGA.
// Position MEASURED (S10): 3,712 ft from the fort's centre on a bearing of 340
// degrees -- fort frame x -1498, y -3113. Elevation 161 ft; the river 619 ft
// off to its NW at 98 ft. On the OPPOSITE (north-eastern) BANK.
// THE 1969 TEXAS MARKER'S "1/4 mi. NW" IS WRONG BY A FACTOR OF 2.8.
mission: { id:'espiritu-santo', x:-1498, y:-3113,
  state:'RUIN'  /* DOCUMENTED: secularised Feb 1830, "fell into ruin",
                   its stone being carried away by the townspeople (S1d, S8) */ }
// DO NOT DRAW THE RESTORED MISSION. What stands in Goliad State Park today is a
// 1936-39 WPA/CCC reconstruction of the chapel, granary and workshop, with more
// work in the 1960s, built to look like 1749. For 1835 the right picture is a
// roofless stone shell being quarried.
// HOW MUCH OF IT STOOD IN 1835 IS UNKNOWN (section 7.14).
// If Indian quarters are ever drawn: jacales, "crude clay-plastered brush huts
// thatched with grass" (S8). 178 people lived there in 1758; by 1835, none.
```

### 9.8 What must be drawn *around* the place

- **A hill, and only here.** The fort on the highest ground for half a mile, level prairie running
  south and west to the horizon, and the river valley dropping away north-east. **This is the one
  settlement in the series with real relief at its own front door**, and the relief is the reason the
  place is where it is.
- **A ninety-foot bluff on the north face**, with the river at the bottom of it and nothing built on it.
- **No grid.** Stone houses and jacales scattered on open ground up to the walls, stock between them,
  the cemetery out to the east-south-east.
- **Post oak savannah and mesquite** away from the river — blackjack, post and live oak, mesquite,
  huisache, red cedar, cactus and brush — and **pecan and elm along the San Antonio bottom** (S1b).
  Bluestem prairie to the south-east.
- **Cattle, in numbers that are hard to overstate.** This is the ground the Texas cattle industry came
  off: 15,000 branded head between mission and settlement in 1778, with far more unbranded (S1b).
- **A broken fort, not a restored one** (§9.4).
- **No bridge, no wharf, no landing.** The river was crossed at a ford and, earlier, by canoe.
- **Carts.** Goliad's trade was oxcarts between Copano and the interior, and the town supplied "oxcarts
  and drivers" (S1e). Carting was still the Mexican residents' trade in the 1850s.

### 9.9 Art gaps this sketch creates

Already requested across this series and reusable here: jacal variation, the cut river bank, cotton
bales (not here), bear and cougar, the two-storey building (not here), the squared-log public building
(not here — Goliad is stone).

**New requests this place creates, in order of value:**

1. **A rounded stone bastion with a sentry box on top.** Four of them, at the corners of a limestone
   curtain wall. **The single most important missing sprite in this report** — nothing in the library
   has a curved masonry work, and this is the silhouette of Goliad. The Alamo assets are straight
   walls and flat roofs.
2. **A limestone curtain wall, one storey, eight feet, WITH A BREACH IN IT.** Not a damaged-wall
   overlay on a sound wall: a wall that reads as having stood there half-ruined for forty years, with
   rubble at its foot and grass growing in it. **Documented for October 1835 and unique to this place.**
3. **A Spanish presidio chapel façade** — square bell tower, arched entrance, octagonal window,
   semicircular pediment with a cross, a statue in a niche. `bexar-layout.js` uses a generic `chapel`
   sprite as a stand-in for San Fernando; Goliad's chapel is documented in photographs and deserves its
   own. **Draw it from the 1936 HABS photograph, not from a guess about which end the tower is on.**
4. **A groin-vaulted stone interior**, if the chapel is ever entered. It is where 92 men signed the
   first Texas declaration of independence in December 1835 and where more than 300 were held before
   the massacre, and it is one of the few 18th-century vaults left standing in North America.
5. **A jacal of post-and-mortar with a thatched grass roof** — distinct from the existing
   `house-jacal`, which is a stand-in. The documented Goliad house type, and the house type of most of
   the people in the villa.
6. **A steep grassed river bluff seen from the top**, about ninety feet, with the river below and no
   structure on it. Distinct from Columbia's cut bank with timbered steps and from Liberty's plain cut
   bank.
7. **A ford on a sizeable river** — a shelving gravel or rock crossing with cart ruts, not a ferry and
   not a bridge.
8. **An oxcart with a driver.** Goliad's actual trade, from 1749 to the Cart War of 1857.
9. **A quarried stone ruin** — a roofless mission church with its walls half carried away and a lime
   kiln's worth of stone gone. For Espíritu Santo in 1835, and reusable for Rosario.
10. **A ruined bastion under repair** — scaffolding, a mortar trough, cut stone stacked — for what
    Dimmitt's fifty men were doing through October 1835.

---

## 10. Verdict

**Can Goliad be drawn honestly? Yes — and better than any other place in this series, on the one axis
that matters for what the game does with it.**

Liberty's plan survives and its town does not. Matagorda's plat survives and no building in it has a
position. Columbia's plat was recovered from an insurance map. **Goliad has no plan of its town at all,
and probably never had one — and it has a plan of its fort, drawn from inside the fort, by an officer
of its garrison, naming twenty-two features, with the river and the bluff on it.** It also has two
primary letters that say what state the walls were in, one primary letter that says where the attackers
came through, and a hundred feet of lidar relief that a traveller described in 1846 in the same terms.

**For an assault, that is close to everything you would want.** A quadrangle a quarter of a mile round,
five degrees off the compass, eight-foot limestone walls with breaches in them, four rounded bastions
with sentry boxes on three, one sally port in the south wall, a watering place outside at the
north-west angle where the ravine runs down, no serviceable gun, no water inside, ninety feet of bluff
and a river behind it, level prairie in front, a town of stone houses and jacales sleeping against the
south and west walls — **and a church in the north wall whose doors were forced at eleven o'clock at
night on 9 October 1835.**

**What is missing is the inside.** Not one room of this fort has a stated dimension except the chapel.
The commanding officer's quarters, the regulars' quarters, the arsenal, the prison, the guard house and
the barracks are all names on a lithograph with no plan behind them. **If a student is ever shown the
interior, almost every internal wall will be invented**, and the honest way to do that is a `note` like
`ALAMO_LAYOUT`'s, which already says its room partitions are navigable placeholders.

**And what is most missing is the town.** Goliad in 1835 held, on the only description anybody wrote
down, "a number of stone houses" and "dozens of jacals". Nothing read gives one of them a position
except the house Zaragoza was born in. There is no grid, no plaza, no plat, no lot list, no house
count, and no population figure for the town itself after 1810. **Then it was destroyed in 1835–36 and
its people left, and the survivors built a different town a mile and a half away that every modern map
calls Goliad.**

**The five things most worth doing before drawing it**, in order of value:

1. **Read Kathryn Stoner O'Connor, *Presidio La Bahia del Espiritu Santo de Zuniga, 1721–1846*
   (Austin, 1966).** The brief named it and it deserved to be named. It is the National Register's only
   monographic authority, it was published by the family that paid for the restoration the year before
   the fort was finished, and **it very probably contains the measured plan, the room list and the
   documentary history that §7 is made of.** It would move half of §8 into §2.
2. **Find Chadwick's original manuscript sketch**, last reported in a Charlottesville, Virginia library
   in 1967. It would settle which end of the chapel carries the bell tower — the thing the 1836
   lithographer got wrong and the restoration architect could not verify for four years — and it may
   carry a scale, which the lithograph does not.
3. **Ask the Texas Historical Commission for Roland E. Beard's 1963–67 excavation records.** THC now
   owns the site outright, and the brief was right that Goliad was dug properly. **Nothing of that work
   could be read online**, and it is the only thing that could give wall lines, footprints and room
   sizes from evidence rather than from a bird's-eye drawing.
4. **Get into the Portal to Texas History.** Seven reports in a row have been stopped by this one site,
   and it now serves a proof-of-work interstitial rather than a block page. It holds the *Goliad
   Advance-Guard* and Goliad County's manuscripts.
5. **Fix `HIST-TEX-010`, and add two sentences to `HIST-TEX-018`.**
   - **`HIST-TEX-010`** already flags that "La Bahía across the river from Goliad" is an unmeasured
     offset. **It is measured now: the presidio stands 7,732 ft — 1.46 miles — from Goliad's official
     coordinate, on a bearing of about 342°, on the opposite bank of the San Antonio River.** The 1835
     settlement is at approximately **28.6476, −97.3830**. Every other settlement in `HIST-TEX-003` is
     placed where its modern town stands because the offset is small; **at Goliad it is a mile and a
     half, and `docs/COLONIES.md` build step 1 puts a road junction and a river crossing there.**
   - **`HIST-TEX-018`** survives checking and needs only a qualification and a warning: that **47 is
     Collinsworth's own count on 8 October in camp on the Guadalupe, two days before the assault**, and
     that TSHA puts the force that actually stormed the presidio at "probably … some 120 men"; and that
     **the 1965 state marker at Goliad repeats Austin's error** ("Oct. 8, 1835", "48 men"), so the row
     should say so before somebody corrects the game from the roadside. While it is open, the row would
     also be improved by carrying the one detail the primary letter gives that nothing else does:
     **they got in by forcing the church doors, and the church is in the north wall.**
