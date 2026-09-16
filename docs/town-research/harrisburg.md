# Harrisburg in 1835 — the steam mills, the bayou, and a grid laid out in feet

Research only. Nothing here is built, and no claim below has a `HIST-` or `FIC-` ID yet; IDs are
assigned when something is drawn. Read alongside `docs/town-research/brazoria.md` and
`columbia.md`, whose lumber questions this report answers from the other end; `velasco.md` for the
method on the Portal and for refusing a later map; and `liberty.md`, the next stop east on the same
mail road. The layout vocabulary in §8 is that of `public/bexar-layout.js` (feet, a local plane,
`river`, `roads`, `building(id, sprite, x, y, heightFeet)`), with the mill in the `rooms`/`walls`
terms of `public/alamo-layout.js`. `public/gonzales-art.js` (`GONZALES_BUILDINGS`) was read and
exists as the brief says.

Researched 2026-09-16. Every URL in §1 was opened and read on that date. Every measurement in §2.3,
§3.2–§3.4 and §8 was computed here on that date from the sources named.

---

## The one-line answer

**In October 1835 Harrisburg was about twenty houses, mostly log, with two or three frame buildings,
irregularly built on a peninsula where Brays Bayou met Buffalo Bayou — and a set of steam mills,
owned since January 1835 by a joint-stock company, advertising in the Brazoria paper every week of
the game's month that they were "now in complete order" and selling lumber at twenty-five dollars a
thousand, delivered at the mills. Schooners loaded lumber there for the Mexican Gulf ports. The town
had a surveyed grid from 1826, and — unlike every earlier town in this series — that grid can be
recovered: its streets are still on the ground in Houston's East End under their 1854 names, and
they measure 400 feet centre to centre, to the foot, which is exactly the 320-foot block and 80-foot
street that the 1854 lithograph writes on its face. It was laid out in feet, not varas.**

Six things, and they agree:

1. **The mill is documented in the game's month, in print, weekly.** A notice signed by M. W. Smith, President of the Harrisburg Steam
   Mill Company, dated Harrisburg 11 July 1835, announcing the mills in working order and lumber at
   twenty-five dollars a thousand delivered at the mills, ran in the *Brazoria Texas Republican* from 18 July to at least 14 November 1835 (S9, §1c). The
   company's articles of association, its proprietors, its president's salary and its advertisement
   for **a first-rate sawyer and two good carpenters** are in the same paper in February–April 1835.
2. **One contemporary description of the town exists, and it is Holley's.** About twenty houses,
   mostly log, two or three frame, irregularly built; extensive steam saw-mills; vessels frequently
   loaded there with lumber for the Mexican ports; yellow pine and oak; the mills on Buffalo Bayou
   about thirty miles from the Brazos, **accessible to vessels drawing five or six feet**; the price
   twenty-five dollars; and that the mills probably furnish more lumber than all the others in Texas
   (S7, §4, §5).
3. **The plan is recoverable, and this is the first town in the series where the surviving street
   grid can be tied to a dimensioned historical plat.** The 1854 lithograph *Harrisburg, Texas*
   (GLO Map #3044, S5) states on its face that all blocks are 320 feet square and all north–south streets
   are 80 feet wide except Broadway. **Measured here on OpenStreetMap, the north–south streets
   of the old town stand 399, 399, 399 and 399 feet apart over four consecutive intervals**, 422
   and 423 either side of Broadway, then 403 and 401 (S16, §3.3). Broadway, Medina, Nueces, Frio,
   Lavaca, San Saba, San Antonio, San Marcos, Cypress, Sycamore, Elm and Magnolia are all still there.
4. **The 1826 plat and the 1854 plat are related but not the same, and the report keeps them apart.**
   The 1826 plat had 25 blocks, eight lots to a block except blocks 1–7; the 1854 plat has over ninety
   blocks, and its core blocks are cut into 12 and 24 lots after an 1839–49 replat (S2, S4, S5; §3).
   **What carries through is the block module, the eight-lot block and the low block numbers on the
   bayou front.**
5. **In the game's month the town sent men and guns west.** Harrisburg's committee forwarded Austin's
   expresses to Lynchburg and Zavala on 23 September; Austin expected its men at San Felipe within
   a day or two (3 October); and **"the cannon at Harrisburg"** — more than two pieces, only
   two of them on carriages — were fetched to San Felipe between 10 and 17 October 1835 (S8, §6.2).
6. **The trap is the one the brief names, and it has a second layer the brief does not.** Santa Anna
   burned the town — **on 16 April 1836, not 15 April** (S1, S14, S15). And the Houston Ship Channel
   did not merely rework Buffalo Bayou here: **the great meander loop that wrapped the east side of
   the 1854 town has been cut off**, so that the "bayou" beside Harrisburg today runs about 1,000 ft
   north of where its bend stood (§2.3). Draw the water from the 1854 sheet, never from the channel.

---

### Corrections to the brief, and two notes for the repository

- **"Santa Anna burned Harrisburg on 15 April 1836" — 16 April.** TSHA's town entry, the 1965 state
  marker and the 1984 Rotary marker all say 16 April; the GLO's own exhibit text says the government
  left on the 15th and the town was burned the next day (S1, S14, S5-GLO). One undated marker
  at the Jane Harris site says **17 April** (S14). Houston's report of 25 April says only that on the
  evening of the 18th he learned Santa Anna had marched toward Lynch's Ferry, burning Harrisburg as
  he went (S7). **16 April, with 17 April noted.** Santa Anna reached the town on the night of
  the 15th, which is probably where the brief's date came from.
- **"eight months after the game's window" — six and a half.** October 1835 to 16 April 1836.
- **"John Richardson Harris's mill" — his by origin, not in 1835.** Harris was *building* a steam
  sawmill-gristmill in 1829 when he went to New Orleans for machinery and died there of yellow fever
  on 21 August 1829; his brothers ran it afterwards (S2). **By October 1835 the mills belonged to the
  Harrisburg Steam Mill Company**, whose articles were signed at Columbia in October 1834 by
  **Meriwether W. Smith, H. H. League, R. Wilson and W. P. Harris**, which bought the property under a
  contract of sale **dated at Harrisburg on 2 January 1835**, and whose board met at Columbia in
  January 1835 and made M. W. Smith president at **$1,000 a year** (S9, metapth80252). **And it was
  mills, plural — saw and grist** (S2, S9, S14-1965).
- **"laid out by Harris from 1826" — surveyed for Harris by Francis W. (Frank) Johnson in 1826.**
  Harris's league was titled 16 August 1824 and the settlement existed before 1825 (S1, S3, S4). The
  surveyor is the Frank Johnson who commanded at the capitulation of Béxar in December 1835.
- **"blocks and lots in varas" — in feet.** The only dimensioned plan (1854) is in feet, and the
  numbers are round only in feet: 320-ft blocks, 80-ft streets, a 400-ft module, lots 80 × 160 ft.
  In varas those are 115.2, 28.8, 144.0 and 28.8 × 57.6. **This is the first town in the series
  that is not a vara town**, which is what an American surveyor platting a private league for an
  American proprietor would produce (inference `I-2`, §7).
- **"on Buffalo Bayou at its junction with Brays Bayou" — right, with the orientation added.** The
  town stood on the peninsula **south-west of the junction**: Brays Bayou along its north-west side,
  Buffalo Bayou coming down from the north to meet it at the north-east corner and then bending south
  round the town's east side (S5). TSHA says the right bank of Buffalo Bayou (S1); the General
  Council's ordinance of 30 December 1835 says **the "west bank"** (S10). Both describe the same place.
- **"that mill is why the other towns' frame buildings exist" — more than the evidence carries.**
  What is documented: the Harrisburg mills advertised in the Brazoria paper all autumn at $25; Holley
  says vessels loaded lumber there for the Mexican ports and that the mills probably out-produced
  all others in Texas (S7, S9). What is not: that any board at Brazoria or Columbia came from
  Harrisburg — both of those reports say most likely, as an inference. **Against a monopoly:**
  Holley compares them with the other mills in Texas, so other mills existed; **David G. Burnet set up a boiler and steam engine
  at Lynchburg in 1831** (S3-Lynchburg); lumber and frame houses entered Galveston and Matagorda
  duty-free under the law of 6 April 1830 (Matagorda report); and Velasco's brig *Tremont* brought
  lumber in by sea in September 1835 (Velasco report). **Say: Harrisburg's was the largest mill
  documented in the colonies and the one the lower Brazos paper advertised — not the only source of
  sawn plank.**
- **"the one town in the series with industry" — the one with a steam engine at work.** Velasco and
  Matagorda had salt works. Harrisburg is the only series town with powered machinery.
- **"word of the fight passes through it" — documented, and better than the brief says.** The
  General Council's **mail route No. 5 ran "From San Felipe, by Hunter's, Harrisburg, and Lynchburg,
  to Liberty, 107 miles, weekly"**, leaving San Felipe Sunday 7 a.m. and reaching Liberty Tuesday
  7 p.m. (*Telegraph*, 12 December 1835, S11). Austin had asked for exactly that road on 4 October
  (a regular mail by way of Harrisburg, Liberty and Nacogdoches), and in September 1835 his expresses went to
  Harrisburg, which forwarded them to Lynchburg and Zavala (S8). **`docs/COLONIES.md`'s express road
  should carry Hunter's and Lynchburg as its intermediate points.**
- **"the Harrisburg site has been studied" — no archaeological report on the townsite was found.**
  A search of the *Index of Texas Archaeology* and the web turned up nothing for the 1826–36 town or
  the mill site; TSHA says only Glendale Cemetery and a marker remain at the townsite (S1). **Not
  found is not the same as not done** — Harris County's archaeologists and the Harris County Archives
  were not contacted (§1b).
- **"the newspapers are the most valuable source" — yes, and the valuable one here is Brazoria's,
  not San Felipe's.** The *Telegraph* began only on 10 October 1835; its 1835 Harrisburg material is a
  delegate list, the December ordinance and the mail route. **The mill lives in the *Texas
  Republican*.**
- **Portal access, as found today:** `/ark:/67531/<id>/m1/<page>/ocr/` still answers curl with a
  browser user-agent (80 pages read here). **New to this series:** the GLO's *Historic Texas Maps*
  site serves a **IIIF image service** for its maps — `historictexasmaps.com/iiif-server/iiif/3/
  maps%7C<map>-1.tif.jpg/<x>,<y>,<w>,<h>/max/0/default.jpg` — so any GLO map can be read at full
  resolution (4870 × 7238 for Map #3044) region by region. That is how the 1854 plat's notes were read.

**Two notes for the repository.** Nothing is changed here.

1. **`HIST-TEX-010`'s Harrisburg coordinate (29.71828, −95.27966) is inside the 1854 town but not in
   the 1835 one.** It falls on Medina Street about 1,700 ft south of Cypress Street — between Magnolia
   and Orange Streets on the 1854 sheet, outside the 25-block core — and about **2,400 ft (0.45 mi)
   south-south-west of the bayou-front blocks** (§3.4). A small offset, not Velasco's four miles, but
   it puts the game's Harrisburg on open prairie rather than at the landing.
2. **Velasco's report puts the General Council's mail routes in the *Telegraph* of 31 October 1835.**
   This report read route No. 5 in the issue of **12 December 1835** (metapth47898 p. 3), passed at
   San Felipe on 10 December. The 31 October issue was not re-read; both may be right (a proposal and
   then the ordinance). Flagged, not resolved.

---

## 1. Sources

| # | Source | What it was used for | URL read 2026-09-16 |
| --- | --- | --- | --- |
| S1 | TSHA *Handbook of Texas*, **Harrisburg, TX (Harris County)** | Right bank of Buffalo Bayou; established before 1825 on Harris's survey; **surveyed by Francis W. Johnson in 1826**; a small sawmill cutting local timber; ships to U.S. and Mexican ports; **freight for San Felipe landed at Harrisburg and went overland to the Brazos**; Harrisburg Municipality created 30 December 1835; **burned 16 April 1836 except John W. Moore's residence**; incorporated 5 June 1837; consolidated with Hamilton 1839 under the Harrisburg Town Company (population about 1,400); **the new plat by Frederick Jacob Rothhaas** (1839–49); sold to the BBB&C Railway 1847; steam saw and grist mill, stores and three hotels by 1853; annexed to Houston December 1926; **only Glendale Cemetery and a marker remain** | [tshaonline.org/handbook/entries/harrisburg-tx-harris-county](https://www.tshaonline.org/handbook/entries/harrisburg-tx-harris-county) |
| S2 | TSHA, **Harris, John Richardson** | Title to 4,428 acres at the junction of Brays and Buffalo bayous; boarded with William Scott **while he built a house on the peninsula between the bayous and a store and warehouse on Buffalo Bayou**; Johnson hired 1826; trading post at Bell's Landing with David Harris; the *Rights of Man* with 84 bales in 1828; **building a steam sawmill-gristmill in 1829**; death 21 August 1829; mill and shipping run by his brothers | [tshaonline.org/handbook/entries/harris-john-richardson](https://www.tshaonline.org/handbook/entries/harris-john-richardson) |
| S3 | TSHA, **Johnson, Francis White**; **Harris, William Plunkett**; **Harris, DeWitt Clinton**; **Harris, Jane Birdsall**; **Moore, John W.**; **Briscoe, Andrew**; **Lynchburg, TX**; **Buffalo Bayou**; **Brays Bayou**; **Harrisburg County** | Johnson laid out the town in 1826; **W. P. Harris and Robert Wilson operated much of the Harrisburg property until 1838**, W. P. Harris a delegate to the Consultation and on the General Council to 30 December 1835; **DeWitt Clinton Harris opened a store in 1833**; Jane Harris came 1833, hostess to the government March–April 1836, rebuilt after the burning, **an innkeeper afterwards**; Moore in the municipality from 1830, delegate to the Consultation; Briscoe's store at **Anahuac**, not Harrisburg; **Lynchburg: Burnet's boiler and steam engine 1831, Lynch's plat 1834 or 1835, post office 1835**; Buffalo Bayou tidal from Whiteoak Bayou, widened into the Ship Channel | [johnson-francis-white](https://www.tshaonline.org/handbook/entries/johnson-francis-white), [harris-william-plunkett](https://www.tshaonline.org/handbook/entries/harris-william-plunkett), [harris-dewitt-clinton](https://www.tshaonline.org/handbook/entries/harris-dewitt-clinton), [harris-jane-birdsall](https://www.tshaonline.org/handbook/entries/harris-jane-birdsall), [moore-john-w](https://www.tshaonline.org/handbook/entries/moore-john-w), [briscoe-andrew](https://www.tshaonline.org/handbook/entries/briscoe-andrew), [lynchburg-tx](https://www.tshaonline.org/handbook/entries/lynchburg-tx), [buffalo-bayou](https://www.tshaonline.org/handbook/entries/buffalo-bayou), [brays-bayou](https://www.tshaonline.org/handbook/entries/brays-bayou), [harrisburg-county](https://www.tshaonline.org/handbook/entries/harrisburg-county) |
| S4 | **Glendale Cemetery Association, *Early Harrisburg***, after L. L. Walker Jr., *The Story of Old Harrisburg* (Rotary Club of Harrisburg pamphlet, undated), **with its sketch map** | **The 1826 plat described**: streets at right angles, **25 blocks numbered 1–25; Block 3 the Harris home site; a slightly later map adding Blocks 26–33 on the south side; the town about 3,188 ft on its south boundary and 4,250 ft on its west, including 26–33; every block except 1–7 platted for eight lots**; the principal street apparently present-day Broadway. **The sketch is a modern pamphlet drawing, not the plat** — it shows the 25-block core, the "block plan as per original" (two columns of four lots), Brays and Buffalo bayous, "Town of Hamilton" and "North Harrisburg" | [glendale-cemetery.org/early-harrisburg](https://glendale-cemetery.org/early-harrisburg/); image `wp-content/uploads/2020/04/map.gif` |
| S5 | **William Kirby (del.), *Harrisburg, Texas*, Boston: L. H. Bradford & Co.'s Lith., 1 April 1854, signed Jno. A. Williams; Texas General Land Office Map #3044** — read as the full sheet and as IIIF crops at full resolution | **The dimensioned plat.** Street names; block numbers 1–94; lot subdivision; **all blocks 320 ft square except fractional blocks and those between Market and Water Streets**; alleys 20 ft (2, 3 and 4 are 30 ft); **E–W streets 124 ft from Chesnut to Brazos Avenue inclusive, others 80 ft, Market and Water 100 ft; all N–S streets 80 ft except Broadway**; Depot Ground; the BBB&C freight track and graded passenger track; **Brays and Buffalo bayous drawn with the Buffalo meander loop round the east of the town**. Scale 20[?] feet to the inch — the third digit is lost to a tear. Plus the GLO's *Save Texas History* exhibit text (S5-GLO) | [historictexasmaps.com/collection/search-results/3044-harrisburg-texas-general-map-collection](https://historictexasmaps.com/collection/search-results/3044-harrisburg-texas-general-map-collection); IIIF `historictexasmaps.com/iiif-server/iiif/3/maps%7C3044-1.tif.jpg/info.json`; [GLO exhibit post on Medium](https://medium.com/save-texas-history/mapping-texas-from-frontier-to-the-lone-star-state-harrisburg-texas-7c66053d8c2) |
| S6 | **Dilue Rose Harris, "Reminiscences"**, *QTSHA* IV (1900–01), in the Sons of DeWitt Colony transcription — the family lived at Stafford's Point, about fifteen miles west | **Harrisburg seen from its hinterland, month by month**: June 1835, men at Harrisburg drilling against the Anahuac garrison and **Travis raising his company at Harrisburg**; **November 1835, schooners calling at Harrisburg frequently after the Anahuac garrison surrendered**, the Dyers taking passage and cotton shipped from Harrisburg, farmers refusing to ship after a Mexican war vessel was reported; **January 1836, no drug store at Harrisburg; several schooners there loaded with cotton and hides that could not get out**; March 1836 camp near where the later railroad depot stood; **the burning of the saw mill at Harrisburg a calamity**; the Allens' attempt to buy the Harris claim | [sonsofdewittcolony.org/roseharris.htm](http://www.sonsofdewittcolony.org/roseharris.htm) |
| S7 | **Mary Austin Holley, *Texas*** (Lexington, 1836), Internet Archive djvu text | **The description of the town (§5)**; Buffalo Bayou **navigable to its forks above Harrisburg, within forty miles of San Felipe, like a wide canal with high and heavily timbered banks, tidal to the forks**; the San Jacinto navigable for any vessel that can pass Red Fish bar as far as the mouth of Buffalo Bayou; **lumber scarce, few mills, the Harrisburgh steam-mill company advertising at $25 per thousand feet**; Lynchburg a new town at the mouth, a point on the eastern mail route; Houston's San Jacinto report | [archive.org/download/texas00holl/texas00holl_djvu.txt](https://archive.org/download/texas00holl/texas00holl_djvu.txt) |
| S8 | ***The Austin Papers*, vol. III** (Barker, 1927), djvu text | **Harrisburg in the game's month**: Austin to the Columbia committee, 21 September, expresses sent to Harrisburg; **W. P. Harris and John W. Moore to Austin, Harrisburg 23 September 1835** — express to Lynchburg and Zavala, militia and volunteers calling their commands together, some to leave the next Saturday for the rendezvous at League's old place; Austin, 3 October, the Harrisburg men expected; **Austin to the Committee of Harrisburgh, 4 October**; Austin's post-office proposal, 4 October; Isaac Batterson, member from Harrisburg, on the 8 October circular; **Austin at Moseley's, 8 October, on "the cannon at Harrisburg"**; Borden and Royall, 10 October, Batterson gone to Harrisburg for the cannon; Royall, 16–17 October, **the cannon from Harrisburg badly managed, two only with carriages**; Austin, 3 November, **some round shot at Harrisburgh**; W. K. Wilson writing from Harrisburgh, 26 April 1835 | [archive.org/download/austinpapersocto03aust/austinpapersocto03aust_djvu.txt](https://archive.org/download/austinpapersocto03aust/austinpapersocto03aust_djvu.txt) |
| S9 | **The *Brazoria Texas Republican*, Feb–Nov 1835**, Portal OCR, 29 issues, 116 pages | **The Harrisburg Steam Mill Company**: its articles of association, proprietors, contract of sale, president and salary; the sawyer-and-carpenters advertisement; **the working-order advertisement dated Harrisburg 11 July 1835, run weekly through the game's month**. Itemised in §1c | page OCR `texashistory.unt.edu/ark:/67531/metapth<id>/m1/<page>/ocr/`, ids 80252–80280 |
| S10 | ***Telegraph and Texas Register*, 1835–36**, Portal OCR, 17 issues read or searched | **Harrisburg's delegates to the Consultation** (10 Oct and 7 Nov 1835: Lorenzo de Zavala, D. B. McComb, John W. Moore, W. P. Harris, C. C. Dyer, M. W. Smith, George M. Patrick); **the ordinance of 30 December 1835 making Harrisburg, on the west bank of Buffalo Bayou, the seat of the new municipality**; 1836 matter on the government at Harrisburg and Burnet on the burning of the town; **the paper's own note that it printed only one number at Harrisburg** | arks in §1c |
| S11 | ***Telegraph and Texas Register*, 12 December 1835**, p. 3 | **Mail route No. 5: San Felipe – Hunter's – Harrisburg – Lynchburg – Liberty, 107 miles, weekly**, with times | [ark:/67531/metapth47898/m1/3/ocr/](https://texashistory.unt.edu/ark:/67531/metapth47898/m1/3/ocr/) |
| S12 | **David B. Edward, *The History of Texas*** (1836), djvu text | Searched; **nothing on Harrisburg's plan or buildings** beyond its listing | [archive.org/download/historyoftexas01edwa/historyoftexas01edwa_djvu.txt](https://archive.org/download/historyoftexas01edwa/historyoftexas01edwa_djvu.txt) |
| S13 | **OpenStreetMap**, `api.openstreetmap.org/api/0.6/map?bbox=` in four quadrants (the single box exceeded the 50,000-node limit) | 1,280 named highway ways, the bayou centrelines, water polygons and docks; **every bearing and module in §3.3 and §8** | `…/map?bbox=-95.290,29.710,-95.272,29.722` and the three adjoining quadrants to −95.254, 29.734 |
| S14 | **Historical markers**, hmdb.org, fetched with curl and a browser user-agent; itemised in §1a | Two *Old Harrisburg* markers (1965 state, 1984 Rotary), *Site of the Home of Mrs. Jane Harris*, *Buffalo Bayou, Brazos & Colorado Railroad*, *Glendale Cemetery*, *Holy Cross Mission*, *Asbury Memorial*, *Harrisburg-Jackson Cemetery* | see §1a |
| S15 | **USGS 3DEP**, Elevation Point Query Service | Terrace, bank and water elevations, §2.2 | `https://epqs.nationalmap.gov/v1/json` |
| S16 | *(computed)* | Grid measurement, §3.3 — from S13 | — |

### 1a. The historical markers used (S14)

| Marker | Erected | Coordinates (hmdb) | In §8's frame (ft, +y south) | URL |
| --- | --- | --- | --- | --- |
| **Old Harrisburg** (10680) | **1965**, State Historical Survey Committee | 29° 42.971′ N, 95° 16.657′ W | x +220, y +2,420 | [hmdb m=62910](https://www.hmdb.org/m.asp?m=62910) |
| **Old Harrisburg** | **1984**, Rotary Club of Harrisburg | 29° 42.975′ N, 95° 16.656′ W | x +230, y +2,400 | [hmdb m=62912](https://www.hmdb.org/m.asp?m=62912) |
| **Site of the Home of Mrs. Jane Harris** | undated plate | 29° 43.265′ N, 95° 16.636′ W | x +370, y +640 | [hmdb m=171044](https://www.hmdb.org/m.asp?m=171044) |
| **Buffalo Bayou, Brazos & Colorado Railroad** (10621) | 1967 | 29° 43.313′ N, 95° 16.659′ W | x +255, y +345 | [hmdb m=201842](https://www.hmdb.org/m.asp?m=201842) |
| **Glendale Cemetery** (10670) | 1970 | 29° 43.173′ N, 95° 16.474′ W | x +1,215, y +1,215 | [hmdb m=265914](https://www.hmdb.org/m.asp?m=265914) |
| Holy Cross Mission (10687) | 1970 | 29° 43.204′ N, 95° 16.793′ W | x −470, y +990 | [hmdb m=170907](https://www.hmdb.org/m.asp?m=170907) |
| Asbury Memorial UMC (15730) | 2009 | 29° 43.525′ N, 95° 16.782′ W | x −370, y −950 | [hmdb m=235919](https://www.hmdb.org/m.asp?m=235919) |
| Harrisburg-Jackson Cemetery (12325) | 2000 | 29° 42.923′ N, 95° 16.934′ W | x −1,250, y +2,680 | [hmdb m=247383](https://www.hmdb.org/m.asp?m=247383) |

**The caution.** The two *Old Harrisburg* markers stand in a parking lot on Frio Street near Lawndale,
**about 2,400 ft south of Cypress Street — well outside the 1826 town.** The 1984 plate says the
Harris home was "three blocks north of this site", which would be about y +1,200; the Jane Harris
plate stands at y +650; **and Glendale's Block 3 lies at about y −600** (§3.4). Three positions for
one house, 1,800 ft apart. **No marker here is a building position.** The railroad marker's placing of the 1836 capitol half a block south
of it puts the Harris house near the Jane Harris plate, which is
the best of the three and still a 1960s placement.

**What the markers add that nothing else does:** the 1965 plate calls the town the site of the state's
first steam saw and grist mills, and says **Mrs Sarah Dodson made the first tricolour Lone Star flag
here in 1835** (§6.3). Both are marker claims only.

### 1b. Sources looked for and not found

- **The 1826 plat itself was not seen.** S4 describes it and draws a sketch from it; its repository
  is not named. **The Harris County Archives, the Houston Metropolitan Research Center (Houston Public
  Library) and the San Jacinto Museum are the places to ask.** The slightly later map adding Blocks
  26–33 was not seen either.
- **The Rothhaas plat of 1839–49 was not seen.** It is the step between the 1826 plat and the 1854
  lithograph, and it is the likeliest place the core blocks were cut from 8 lots to 12 and 24.
- **No archaeology of the townsite or the mill was found** (search of the *Index of Texas Archaeology*
  and the web; the only 41HR hits were prehistoric). Not contacted: the Harris County Historical
  Commission, the Texas Historical Commission's site files, the Glendale Cemetery Association.
- **The Portal's run of the *Texas Republican* after 14 November 1835 was not searched for the mill.**
- **Almonte's 1834 statistical report was not read** — it may give a population for the San Jacinto
  district.
- **L. L. Walker's pamphlet (S4's source) was not seen**, only the cemetery association's transcript.
- **The GLO land file for the John R. Harris league** (title of 16 August 1824, GLO Box 4 Folder 11,
  cited by S5-GLO) was not requested; its field notes would fix the league corner and the town's place
  on it.
- **TSHA has no entry for Sarah Dodson under the slug tried**; the flag story was not verified.
- **Sanborn maps** of Harrisburg exist only from the twentieth century and were not used — the 1854
  lithograph is a better plat substitute than any Sanborn key sheet could be.

### 1c. The newspapers read

All at `texashistory.unt.edu/ark:/67531/metapth<id>/m1/<page>/ocr/`. OCR interleaves columns; every
reading below was checked against a repeat of the same advertisement in another issue.

**The *Brazoria Texas Republican*** (issue numbers and dates as `brazoria.md` §1c):

| Ark id | Issue, date | Harrisburg material |
| --- | --- | --- |
| **metapth80252** | **25, 14 Feb 1835**, p. 4 | **The articles of association of the Harrisburg Steam Mill Company** (Articles 5–12 legible: the president's power to contract; the board in extra session; **no buildings erected or alterations made to the establishment without a majority of the company**; no alienation of shares without unanimous consent; first refusal to the company; proxies; **Article 12, the contract of sale dated 2 January 1835 at Harrisburg to govern the property**); **signed at Columbia by M. W. Smith, H. H. League, R. Wilson and W. P. Harris**; **the board's January 1835 meeting at Columbia appointing Meriwether W. Smith president at $1,000**; **an advertisement wanting a first-rate sawyer and two good carpenters for the steam mills at Harrisburg, dated 31 January** |
| metapth80253–80257 | 28–32, Feb–Apr 1835 | The sawyer-and-carpenters advertisement repeated |
| **metapth80266** | **46, 18 Jul 1835** | **First appearance of the working-order notice, dated Harrisburg 11 July 1835** |
| metapth80267, 80271–80273 | 47, 53–55, Jul–Oct 1835 | The same, weekly |
| **metapth80274–80277** | **56–59, 10–31 Oct 1835** | **The same, in every issue of the game's month** |
| metapth80278 | 61, 14 Nov 1835 | The same, last issue searched |

**The *Telegraph and Texas Register*** (1835 issues read in full; 1836 issues searched):

| Ark id | Issue, date | Harrisburg material |
| --- | --- | --- |
| metapth47872 | 10 Oct 1835 | Delegates for the Jurisdiction of Harrisburg; Zavala arrived at San Felipe from his residence on the San Jacinto |
| metapth47875, 47877, 47878, 47881 | Oct 1835 | Searched; nothing on the town |
| metapth47885 | 7 Nov 1835 | Delegates again (with Patrick, Harris, Dyer, Smith, Moore, McComb) |
| metapth47888, 47896 | Nov–Dec 1835 | W. P. Harris among the General Council; Harrisburg among the municipalities |
| **metapth47898** | **12 Dec 1835** | **Mail route No. 5** (S11) |
| **metapth47874** | Jan 1836 | **The ordinance of 30 December 1835: municipality boundaries; the town, on the west bank of Buffalo Bayou, made the seat** |
| metapth47876, 47879, 47884, 47886, 47890, 47894, 47895 | 1836 | Burnet's proclamations dated at Harrisburg; the only number printed at Harrisburg; the government's retreat; Burnet on the army that burned the town |

---

## 2. Documented — where the town was, and what has happened to the ground

### 2.1 The site

Harris's league ran from Brays Bayou south to about Bellfort Boulevard, roughly half a mile either side
of Broadway, and **the town was its north-east corner** (S4). The town stood on the **peninsula
between Brays Bayou and Buffalo Bayou, south-west of their junction** (S2, S5). On the 1854 sheet,
Brays Bayou enters from the west, runs north-east across the town's north-west corner, and meets
Buffalo Bayou — which comes down from the north — above the blocks north of Market Street; the joined
bayou then **swings south in a deep loop past Frio and Front Streets to about Elm Street** and back
north-east (S5). Across Buffalo Bayou to the east lay land later platted as **Hamilton** (numbered
streets 1st–10th, San Jacinto, Trinity, Neches) and across Brays to the north **North Harrisburg**,
neither on the Harris league and neither developed (S4, S5). **Neither existed in 1835** (Hamilton
was consolidated in 1839, S1).

### 2.2 The ground, measured

USGS 3DEP (S15):

| Point | Elevation |
| --- | --- |
| Jane Harris marker (Frio × Elm area) | **33.1 ft** |
| BBB&C marker (Elm west of Frio) | 32.4 ft |
| Glendale Cemetery | 33.1 ft |
| GNIS "Harrisburg" | 31.9 ft |
| Old Harrisburg markers (Frio × Lawndale) | 34.0 ft |
| Lawndale × Broadway | 30.2 ft |
| a mile south, on the league | 23.4 ft |
| **Sycamore × Medina, toward Brays Bayou** | **16.6 ft** |
| inside the old loop, 29.7225–29.7243 N at −95.2745 | **20.0–22.4 ft** |
| **Ship Channel / slip surface** | **0.3 ft** |
| Houston, Allen's Landing, for comparison | 33.7 ft |

**Three things follow.**

1. **Harrisburg stands on a flat terrace at 32–34 ft**, the same level as downtown Houston six miles
   up the bayou. It is higher than Brazoria (23–27 ft) and Velasco (5–7 ft), about Columbia's.
2. **The terrace drops about 15 ft toward Brays Bayou** within the north-west blocks, and to the water
   in a bank toward Buffalo Bayou. Holley's high, heavily timbered banks (S7) are right here.
3. **The ground inside the old Buffalo loop is 11–13 ft lower than the terrace** — consistent with the
   loop's own floodplain, and with a mill and landing on low ground at the water below a town on the
   bank. **That is inference (`I-5`); the modern figures there include industrial fill.**

### 2.3 What has happened to the ground since — check before measuring anything

| Date | What happened | Source |
| --- | --- | --- |
| 16 Apr 1836 | **Town burned**, one house spared (Moore's) | S1 |
| 1836–39 | Rebuilt; incorporated 1837; consolidated with Hamilton 1839 | S1 |
| 1839–49 | **Replatted by F. J. Rothhaas** for the Harrisburg Town Company | S1 |
| 1847–53 | Town sold to the BBB&C Railway; depot, roundhouse and docks one block north of Elm at Frio | S1, S14-BBB&C |
| 1 Apr 1854 | **The Kirby lithograph** | S5 |
| 1870s | Railroad shops burned and moved to Houston | S1 |
| after 1919 | **Ship Channel widening brings industry** | S1 |
| 1926 | Annexed by Houston | S1 |

**Measured against the 1854 sheet, the channel has cut off the loop.** On OpenStreetMap the south bank
of the Ship Channel beside the town runs at about **y −300 to −700 in §8's frame, x +1,550 to +2,400** (the dock
polygons, S13), and the channel runs nearly straight east. **On the 1854 sheet the bayou's loop comes
south past Front Street to about Elm Street, y ≈ +400.** The southern **800–1,200 ft of the loop is
now land**, and a patch of open water measured at 29.7215 N, −95.2745 (§8 frame x ≈ +1,250, y ≈ +510,
elevation 0.3 ft) sits almost exactly at the bottom of the old bend — **probably a remnant of it, an
inference (`I-6`).** The junction with Brays, by contrast, has hardly moved: the modern centrelines
meet at about x +580, y −1,830, and the 1854 junction lies above block 1 at about x +400 to +700,
y −1,400 to −1,700. **Brays itself has been channelised along its whole course.**

**So: take the grid from the ground, and the water from the 1854 sheet.** Neither the modern channel
nor the modern Brays is the 1835 bayou.

---

## 3. Documented — the town plan

### 3.1 Was there a plan in 1835?

**Yes.** TSHA (S1) and Johnson's biography (S3) say Francis W. Johnson surveyed the town in 1826; S4
describes an 1826 plat of 25 numbered blocks. **Unlike Velasco, the survey is of the right date**, and
Harrisburg's lots were being dealt in — the Steam Mill Company's contract of sale of January 1835 was
made at Harrisburg (S9). **But Holley calls the town "irregularly built"** (S7): the lines existed and
the houses did not follow them. **Draw the grid as a survey on the ground, not as streets lined with
houses** (`I-1`).

### 3.2 The 1826 plat, as described (S4)

- **25 blocks, numbered 1–25**, streets at right angles.
- **Blocks 1–7 not divided into eight lots**; every other block **eight lots**, drawn in S4's block
  plan marked as per original as **two columns of four** (lots 1–4 on one side, 5–8 on the other).
- **Block 3 the Harris home site.**
- A slightly later map added **Blocks 26–33 on the south side**, perhaps before 1830.
- **The town about 3,188 ft on its south boundary and 4,250 ft on its west**, including 26–33.
- **The principal street apparently present-day Broadway.**

**Measured check, here:** eight blocks of 26–33 on a 400-ft module make **3,200 ft — 0.4% from
S4's 3,188 ft.** The 4,250-ft west side is not explained by the module (six or seven rows make
2,400–2,800 ft); S4's sketch labels a strip on the west Birdsall, 16 acres, with a figure that reads
1632 ft, which may account for it. **Unknown.**

**No street name appears in any 1835 document read.** Market, Sycamore, Walnut, Cypress, Elm,
Brazos Avenue, Magnolia, Broadway, Medina, Colorado, Nueces, San Antonio, Saint Marcus and Frio are
**first attested in 1854** (S5).

### 3.3 The 1854 plat, and the grid on the ground today

**The 1854 sheet (S5), read at full resolution.** North at the top. The core, between Market Street
and Brazos Avenue and west of the bayou loop, holds blocks 1–25 in north–south columns numbered
boustrophedon — **blocks 1–6 in the column next to the bayou** (with the Depot Ground between them and
the water), then 7–12, 13–18 and 19–24 westward; Block 25 lies beyond Brays. Outer blocks run to 94.
Outer blocks are **eight lots, two rows of four — exactly S4's as-per-original block**; the core
blocks are cut into **12 or 24 narrow lots**, the work of a later replat. The two printed notes, in substance:

- **Kirby's note (lower left):** all blocks **320 ft square** except fractional blocks and those
  between Market and Water Streets; **alleys 20 ft**, except alleys 2, 3 and 4 at **30 ft**; unnumbered
  blocks and closed streets and alleys reserved to the railroad company.
- **Williams's note (lower right):** east–west streets **124 ft** wide from Chesnut Street to Brazos
  Avenue inclusive, others **80 ft**, except Market and Water Streets at **100 ft**; all north–south
  streets **80 ft** except Broadway (no figure given).

**Names on the ground today** (S13), matching the sheet: **Broadway, Medina (1854 "Madina"), Nueces,
San Antonio, San Marcos ("Saint Marcus"), Frio, Lavaca ("Labaca"), San Saba, Sycamore, Cypress, Elm,
Magnolia**. Gone or renamed: Market, Walnut, Brazos Avenue, Colorado (its line is Fennell Street),
Orange, Myrtle, Chesnut, Front, Water, Mustang, Buffalo.

**Bearing, measured:** east–west streets bear **88.8° true** (Sycamore 88.86°, Cypress 88.71°,
Manchester 88.75°, East Erath 88.8°); north–south streets **178.5° true** (Medina 178.49°, Nueces
178.52°, Broadway 178.6–178.8°). **Perpendicular to within 0.3°. The grid is cardinal, turned 1.2°
clockwise.**

**Module, measured** — street centreline positions along the grid's east–west axis, west to east:

| Street (1854 name) | Position (ft) | Interval |
| --- | --- | --- |
| San Marcos (Saint Marcus) | −2,009 | — |
| San Antonio | −1,618 | 391 |
| Nueces | −1,220 | **399** |
| Fennell (Colorado) | −821 | **399** |
| Medina (Madina) | −421 | **399** |
| **Broadway** | **0** | **422** |
| Frio | +424 | **423** |
| Lavaca (Labaca) | +826 | **403** |
| San Saba | +1,228 | **401** |

and along the north–south axis: **Cypress → Elm 396**; **Sycamore → Cypress 800 (two modules,
Walnut gone)**; Elm → Magnolia 900 (two modules across the 124-ft Brazos Avenue; predicted 866).

**What that means.**

1. **The module is 400 ft — 320-ft block plus 80-ft street — recovered to one foot over four
   consecutive intervals.** It is the sheet's own statement, on the ground.
2. **Broadway is wider.** 320 + (80 + W)/2 = 422.5 gives **W ≈ 125 ft** — the sheet's 124-ft
   figure for the principal cross streets. **Broadway was 124 ft** (inference `I-3`, one measurement
   and one printed number).
3. **This is the 1854 grid, and it descends from 1826 by three links:** the block numbers 1–25 in the
   core on the bayou front, the eight-lot as-per-original block, and S4's 3,188 ft = eight 400-ft
   modules. **None of the three is the 1826 sheet itself** (`I-4`).

### 3.4 Where the 1835 town stood, in the grid

**Frame (§8):** origin at the centreline intersection of **Broadway and Cypress Street, 29.7228 N,
−95.2785 W**; +x east along 88.8°, **+y south** (as `bexar-layout.js`).

- **The 25-block core**: x ≈ −1,700 to +700, y ≈ −1,300 (Market Street) to +400 (Elm Street),
  bayou-front blocks at the east and north.
- **Block 3** (the Harris house, S4): between Broadway and Frio, Walnut and Sycamore — **x +62 to
  +384, y −760 to −440**.
- **Blocks 1–7**: the east column against the bayou — **fractional, not lotted, in 1826 (S4)**.
- **The junction of the bayous**: about x +400 to +700, y −1,400 to −1,800 (§2.3).
- **GNIS "Harrisburg"** (`HIST-TEX-010`): **x ≈ −420, y ≈ +1,680** — south of Magnolia on Medina.

---

## 4. Documented — the bayou

### 4.1 Navigation

- **Buffalo Bayou navigable to its forks above Harrisburg, within forty miles of San Felipe; tidal to
  the forks; like a wide canal with high, heavily timbered banks** (Holley, S7). The forks are the
  Whiteoak junction at later Houston (S3-Buffalo Bayou).
- **The mills accessible to vessels drawing five or six feet** (S7). **The one depth figure for the
  place.**
- **The approach: Galveston Bay → Red Fish bar → the San Jacinto → Lynchburg at the mouth of Buffalo
  Bayou → up the bayou to Harrisburg** (S7). Holley says the San Jacinto is navigable for any vessel
  that can pass Red Fish bar; **the Red Fish bar depth was not found**.
- **Who came:** sloops and schooners of the Harris brothers from the 1820s (S2); W. P. Harris and
  Wilson's *Nelson* and *Mecana* in 1832 (S3); **"schooners were coming to Harrisburg frequently"
  in November 1835** after Anahuac fell; schooners loaded with cotton and hides waiting at Harrisburg
  in January 1836 (S6); **vessels frequently loaded at the mills with lumber for the Mexican Gulf
  ports** (S7).
- **No steamboat is documented at Harrisburg in 1835.** W. P. Harris's steamboat *Cayuga* carried
  government stores in spring 1836 (S3); when it arrived was not established.

### 4.2 The landing

**Nobody read describes a wharf.** Holley says vessels loaded at the mills themselves (S7) — **the landing was
the mill's**. TSHA places Harris's original **store and warehouse on Buffalo Bayou** (S2). The 1854
sheet's **Depot Ground** strip between blocks 1–6 and the water, and Front and Water Streets, are
the later form of that same frontage (S5). **Where on the loop the mill and landing stood is unknown**
(§6).

### 4.3 The road

**Freight for San Felipe landed at Harrisburg and went overland to the Brazos** (S1), across the
level prairie of the forty miles (S7). **Mail route No. 5**, San Felipe – Hunter's – Harrisburg –
Lynchburg – Liberty, 107 miles weekly (S11). Dilue Harris's family's road from Stafford's Point came
in from the west; in March 1836 they camped **near Harrisburg** and next day crossed **Vince's
Bridge** (S6).

---

## 5. Documented — the steam mills

**The brief's first question, and the best-documented industrial establishment in the series.**

### 5.1 Timeline

| Date | What | Source |
| --- | --- | --- |
| 1824–26 | Harris takes title; builds house, store and warehouse; town surveyed | S2 |
| **1829** | **Harris building a steam sawmill-gristmill**; dies at New Orleans 21 Aug, buying equipment | S2 |
| 1829–33 | Brothers (David, Samuel, W. P.) run the mill and shipping | S2, S4 |
| **Oct 1834** | **Harrisburg Steam Mill Company articles signed at Columbia** — Smith, League, Wilson, W. P. Harris | S9 |
| **2 Jan 1835** | **Contract of sale made at Harrisburg** governing the property | S9 |
| Jan 1835 | Board meets at Columbia; **M. W. Smith president at $1,000** | S9 |
| **31 Jan 1835** | **Wanted: a first-rate sawyer and two good carpenters** | S9 |
| **11 Jul 1835** | **in working order; lumber $25 per thousand, delivered at the mills** | S9 |
| **Oct 1835** | **The same notice in every issue of the month** | S9 |
| 1836 (pub.) | Extensive steam saw-mills; vessels loading lumber for Mexican ports; yellow pine and oak; more lumber than all others in Texas | S7 |
| **16 Apr 1836** | **The saw mill burned with the town** — a calamity to the district | S1, S6 |
| by 1853 | A steam saw and grist mill again at Harrisburg | S1 |

**One reading of the gap from July 1834 to July 1835**: the notice for a sawyer and carpenters in
January–April 1835 and the working-order notice in July describe **a mill refitted after a change of
ownership**. That is how the sequence reads; nobody says it (`I-7`).

### 5.2 What the record says the mill was

- **Steam-powered, saw and grist** — steam mills, steam saw-mill, sawmill-gristmill (S2, S7, S9).
- **Cut yellow pine and oak** (S7); **"local timber"** (S1).
- **Sold at the mill**: delivered at the mills — the buyer carried it away, by vessel or wagon (S9).
- **Price $25 per thousand feet**, all of 1835 (S7, S9).
- **Staffed by a sawyer and carpenters** under a president (S9). **An engineer and firewood hands**
  may appear in Article 1 of the articles, but that passage is too garbled in the OCR to use.
- **Shipped by water to the Mexican Gulf ports** (S7).
- **Governed as a joint-stock company** in which no building could be put up or altered without a
  majority of proprietors (S9, Art. 7).
- **The proprietors were men of the lower Brazos**: the company met at **Columbia**; Smith and
  League were Brazoria/Columbia men (League was Smith's agent at Brazoria, S9); W. P. Harris and Wilson
  held the Harrisburg property (S3). **The mill was capitalised from the Brazos, not from Harrisburg**
  — which is the documented connection between this town and the Brazoria and Columbia reports.

### 5.3 What the record does not say

**Where the mill stood, how big it was, what its engine or saw was, how many men worked it, how
the logs came in, whether it had a millpond or ran on the bayou, what the building was made of.**
Nothing read gives a single dimension or position. §6.

---

## 6. Documented — the town in 1835

### 6.1 Buildings and places standing in October 1835

| Thing | What is documented | Standing Oct 1835? | Position | Source |
| --- | --- | --- | --- | --- |
| **The steam saw- and grist-mills** | §5 | **YES — in complete order, advertising weekly** | **on Buffalo Bayou; nothing closer** | S7, S9 |
| **The mill landing** | vessels loaded at the mills | **YES** | at the mills | S7 |
| **The Harris house** | built by J. R. Harris on the peninsula; Jane Harris living in it from 1833; the government's lodging March–April 1836; burned April 1836 | **YES** | **Block 3 (S4)** — or the Jane Harris marker site (S14); §1a | S2, S3, S4 |
| **Harris's store and warehouse on Buffalo Bayou** | built by J. R. Harris before 1829 | **probable, not attested for 1835** | on the bayou | S2 |
| **DeWitt Clinton Harris's store** | opened 1833; he went to buy goods from Briscoe at Anahuac in June 1835 | **YES** | unknown | S3, S6 |
| **John W. Moore's residence** | the one house Santa Anna spared in 1836; Moore in the municipality since 1830 | **probably** | unknown | S1, S3 |
| **About twenty houses, mostly log; two or three frame** | Holley's count | **YES — the whole town** | irregularly built | S7 |
| **Cannon** | the Harrisburg cannon; more than two pieces, two with carriages; some round shot | **YES, until mid-October** | unknown | S8 |
| **The surveyed grid** | 1826 | **YES, as a survey** | §3.4 | S1, S4 |

### 6.2 What happened here in 1835

- **June**: men at Harrisburg drilling against the Anahuac garrison; **Travis raises his company at
  Harrisburg**, mostly from San Jacinto and Buffalo Bayou, and takes Anahuac on 30 June (S6, S3-Moore).
- **23 September**: the Harrisburg committee (W. P. Harris, J. W. Moore) receives Austin's expresses,
  sends on to Lynchburg and Zavala, calls out militia and volunteers (S8).
- **3–4 October**: Harrisburg men expected at San Felipe within a day or two; Austin's letter
  to the Committee of Harrisburgh (S8; already `HIST-TEX-014`).
- **Early October**: Harrisburg elects **Zavala, McComb, Moore, W. P. Harris, Dyer, M. W. Smith and
  Patrick** to the Consultation (S10). **The mill company's president is a delegate.**
- **8–17 October: the Harrisburg cannon go west** — Batterson goes for them on the 10th, promising them
  on the road by the next night; on the 16th–17th they are reported badly managed and two days short of San
  Felipe, only two on carriages (S8). **The most concrete October event in the town.**
- **All autumn**: the mill notice runs (S9); **after Anahuac, schooners call frequently** (S6).
- **30 December**: municipality and seat created (S10). **Not in the game's month.**

### 6.3 The flag — marker only

The 1965 state marker says Sarah Dodson made the first tricolour Lone Star flag at Harrisburg in
1835 (S14). **Nothing else read confirms it.** If used, it is a marker claim.

### 6.4 NOT there in October 1835

| Thing | Why not | Source |
| --- | --- | --- |
| **A municipality, alcalde or seat of government** | Created 30 December 1835; in October Harrisburg is a district with a committee | S1, S10 |
| **The capitol / the government** | 22 March – 13 April 1836 | S14 |
| **The *Telegraph* press** | One number printed at Harrisburg, April 1836 | S10 |
| **Incorporation, Town Company, Hamilton** | 1837, 1839 | S1 |
| **The 1854 lot subdivision, street names, Depot Ground, railroad, docks, roundhouse** | 1839–1853 | S1, S5, S14 |
| **Glendale Cemetery** | first burial 23 July 1839 | S14 |
| **Any church** | Holy Cross 1865; Methodist 1866 | S14 |
| **A post office** | 1853; mail route through the town ordered December 1835 | S1, S11 |
| **A drug store** | none in January 1836 | S6 |
| **Jane Harris's inn** | TSHA calls her an innkeeper *after* rebuilding | S3 |
| **Houston** | laid out August 1836 | S6 |
| **The Ship Channel; the cut-off loop** | twentieth century | S1, §2.3 |
| **Andrew Briscoe's store** | **at Anahuac**, not Harrisburg | S3 |
| **A steamboat** | not attested at Harrisburg in 1835 | §4.1 |

### 6.5 How big the place was

- **About twenty houses, mostly log, two or three frame** — Holley, published 1836 (S7). **The only
  count.** At five or six people a house that is **100–120 people**, which is arithmetic, not a source.
- **About 1,400** after consolidation with Hamilton in 1839 (S1) — **not a 1835 figure; do not use.**
- **A district that polled a delegation of seven** to the Consultation (S10) — Harrisburg jurisdiction,
  not the town.

---

## 7. Inferred — things that follow but that nobody states

Each must be labelled as inference if used.

- **`I-1`. The 1835 town did not fill its grid.** Twenty houses (S7) against 25 blocks of eight lots
  (S4), and irregularly built (S7). Houses stood where their owners wanted, most near the bayou.
- **`I-2`. The town was laid out in feet.** The only dimensioned plan's numbers are round in feet and
  not in varas; the surveyor and proprietor were American; the league was private. The 1854 numbers
  could be a later conversion — but S4's 3,188 ft matches eight 400-ft modules.
- **`I-3`. Broadway was 124 ft wide.** One measurement (§3.3) and one printed number for the cross
  streets.
- **`I-4`. The 1826 block was the 1854 block: 320 ft square, eight lots of 80 × 160 ft.** Three
  links, §3.3; the plat itself unseen. **The load-bearing inference of §8.**
- **`I-5`. The mill and landing stood on low ground at the bayou, below the terrace** — on or near the
  unlotted bayou-front blocks 1–7. From the mills being on Buffalo Bayou, vessels loading at the mills, blocks 1–7
  left fractional, and the 11–13-ft drop measured inside the loop. **Nobody places the mill.**
- **`I-6`. The water at 29.7215, −95.2745 is a remnant of the 1854 loop.** Position only.
- **`I-7`. The mill was refitted in early 1835** after the company bought it (§5.1).
- **`I-8`. The town had frame buildings because it had the mill.** Holley's two or three frame
  buildings in a log town are the ones a mill makes cheap. **The strongest join in the report.**
- **`I-9`. There was a log yard, lumber stacks, a sawdust heap and a woodpile for the boiler.** Every
  steam sawmill had them; nobody describes Harrisburg's.
- **`I-10`. Timber stood close.** Yellow pine and oak abundant (S7), heavily timbered banks (S7). The
  pine is what made this the mill town and the lower Brazos not (`columbia.md`: no pines there).
- **`I-11`. The Harris house on Block 3 fronted the bayou**, since blocks 1–7 are the bayou column.
  **Against it**, the Jane Harris marker is 1,250 ft further south (§1a).

---

## 8. A suggested layout sketch

**In `bexar-layout.js` terms** — feet, a local plane, +y south, `river`, `roads`, `building(...)` —
with the mill in `alamo-layout.js` terms. **Read this first:** the grid, its bearing, its module, its
block size and street widths, the ground levels and the building count are **measured or printed**.
**No building has a documented position.** Everything marked `INVENTED` is invented; if built, register
it as fiction under a new `FIC-` ID with a note like the one at the head of `BEXAR_LAYOUT`.

### 8.1 Frame

| Thing | Value | Status |
| --- | --- | --- |
| Units | feet (1 vara = 2.7778 ft — **not used; this is a feet town**) | `I-2` |
| Origin | centreline of **Broadway × Cypress Street, 29.7228 N, −95.2785 W** | computed from S13 |
| Axes | +x east along **88.8° true**; +y **south** along 178.8° | **measured** |
| Module | **400 ft** | **measured** |
| Block | **320 ft square** (core fractional blocks excepted) | **printed 1854** (S5); 1826 by `I-4` |
| Lot | **80 × 160 ft**, eight to a block, two rows of four | S4 plan × S5 block; `I-4` |
| N–S streets | **80 ft**; Broadway **124 ft** | printed (S5); Broadway `I-3` |
| E–W streets | Cypress, Walnut, Sycamore, Elm **80 ft**; Market **100 ft** | printed (S5) |
| Terrace | **33 ft** above sea, flat | **measured** |
| Bounds | `{x:-2200, y:-2200, width:4400, height:3000}` | frame choice |

```
// Street centrelines (1854 names). Positions MEASURED on the modern grid (S13);
// whether each street existed as a line in 1835 is I-4. No 1835 street name is attested.
roads: [
  {id:'broadway',  widthFeet:124, points:[{x:0,y:-1300},{x:0,y:400}]},
  {id:'medina',    widthFeet:80,  points:[{x:-421,y:-1300},{x:-421,y:400}]},
  {id:'colorado',  widthFeet:80,  points:[{x:-821,y:-1300},{x:-821,y:400}]},
  {id:'nueces',    widthFeet:80,  points:[{x:-1220,y:-1000},{x:-1220,y:400}]},
  {id:'frio',      widthFeet:80,  points:[{x:424,y:-1300},{x:424,y:400}]},
  {id:'market',    widthFeet:100, points:[{x:-1400,y:-1210},{x:700,y:-1210}]},   // y INFERRED, 3 modules N
  {id:'sycamore',  widthFeet:80,  points:[{x:-1400,y:-800},{x:700,y:-800}]},
  {id:'walnut',    widthFeet:80,  points:[{x:-1400,y:-400},{x:700,y:-400}]},
  {id:'cypress',   widthFeet:80,  points:[{x:-1400,y:0},{x:700,y:0}]},
  {id:'elm',       widthFeet:80,  points:[{x:-1400,y:396},{x:700,y:396}]},
  {id:'road-to-san-felipe', widthFeet:30, points:[{x:-1400,y:200},{x:-2200,y:200}]},  // direction DOCUMENTED (west, overland, S1); line INVENTED
]
// In 1835 draw these as SURVEY LINES — stakes, a cleared trace, a cart track on Broadway and to
// the landing — not as fenced streets (I-1). Holley: irregularly built.
```

### 8.2 The water

```
// Brays Bayou and Buffalo Bayou, redrawn from the 1854 lithograph (S5) laid over the measured grid.
// The modern channel is NOT this water (section 2.3). Widths INVENTED -- no source gives one.
river: { id:'buffalo-bayou', label:'Buffalo Bayou', widthFeet: 120 /* INVENTED */,
  points:[ {x:450,y:-2200},{x:520,y:-1650},   // down from the north to the junction -- 1854, placed ±150
           {x:800,y:-1350},{x:1000,y:-900},{x:950,y:-300},
           {x:900,y:200},{x:1150,y:480},      // bottom of the loop, about Elm St -- 1854; I-6
           {x:1600,y:350},{x:2100,y:-100} ] } // out to the east toward Lynchburg
brays: { id:'brays-bayou', label:"Brays Bayou", widthFeet: 60 /* INVENTED */,
  points:[ {x:-2200,y:200},{x:-1700,y:-200},{x:-1450,y:-700},{x:-1200,y:-1300},
           {x:-600,y:-1550},{x:520,y:-1650} ] }   // 1854 course, placed by eye ±200
bank: { heightFeet: 13, note:'MEASURED: terrace 33 ft, loop floor 20-22 ft. High, timbered banks (S7).' }
navigation: { draughtFeet: 6, note:'DOCUMENTED (S7): vessels drawing five or six feet reach the mills.' }
```

### 8.3 The mills — in `alamo-layout.js` terms

**Position `I-5`: at the water inside the loop, below the bayou-front blocks. Every number below is
INVENTED except where marked.**

```
// HARRISBURG STEAM MILLS, October 1835. Existence, steam power, saw + grist, pine and oak,
// $25/M, in working order, vessels loading at the mills: DOCUMENTED (S1, S2, S7, S9).
// Plan, size, material, position: ALL INVENTED.
const millOrigin = { x: 700, y: -500 };            // INVENTED, per I-5: bank below blocks 2-3
rooms: [
  room('mill-saw',   'Steam saw mill',  0,  0, 90, 30, 'w', {wallHeight:12, material:'sawn plank'}), // INVENTED
  room('mill-boiler','Boiler and engine', 90, 5, 25, 20, 'w', {wallHeight:10}),                      // INVENTED
  room('mill-grist', 'Grist mill',      0, 30, 30, 25, 'n', {wallHeight:12}),                        // INVENTED; grist DOCUMENTED
]
props: [
  {id:'mill-stack',   x:105, y:15,  heightFeet:30, note:'boiler stack -- INVENTED form'},
  {id:'log-deck',     x:-40, y:10,  note:'I-9'},
  {id:'lumber-stacks',x:40,  y:-40, note:'I-9; sold "delivered at the mills" (S9)'},
  {id:'woodpile',     x:130, y:15,  note:'boiler fuel -- I-9'},
  {id:'sawdust',      x:60,  y:60,  note:'I-9'},
  {id:'mill-landing', x:40,  y:-90, note:'vessels loaded here (S7); plank stage INVENTED'},
]
```

**Rules for drawing it, all documented:** it is **working** in October 1835; it has **smoke**; it is
**on the water with a vessel at it**; it has **stacks of sawn pine**; it is **the largest thing in the
place**.

### 8.4 The town

**Draw about twenty houses. Not two hundred.**

| id | Building | Documented | sprite | x, y | heightFeet |
| --- | --- | --- | --- | --- | --- |
| `hbg-harris-house` | **The Harris house** — Jane Harris and her children | **exists; Block 3 (S4)** | `house-dog-run` *stand-in* | **+220, −600** `INVENTED within Block 3` | 20 |
| `hbg-dch-store` | **DeWitt Clinton Harris's store** | **exists 1833–35; no position** | `trading-house` | +300, −1000 `INVENTED` | 18 |
| `hbg-warehouse` | **Harris's store and warehouse on the bayou** | **built before 1829; 1835 probable** | `storehouse` | +620, −980 `INVENTED`, on the bank | 18 |
| `hbg-moore` | **John W. Moore's house** | **the house that survived 1836** | `frame-hall` *stand-in* | −380, −700 `INVENTED` | 22 |
| `hbg-frame-1`, `-2` | **Two more frame buildings** (Holley's two or three) | count documented | `frame-hall`, `timber-shop` | near the landing `INVENTED` | 18 |
| `hbg-log-1` … `-14` | **Log houses**, mostly log per Holley | count documented | the cabin/log set | scattered, **clustered toward Broadway and the bayou front** `INVENTED` (`I-1`) | 14–16 |
| `hbg-cannon` | **Guns awaiting carriage west**, early October | **documented (S8)** | `cannon-iron-e` ×3, two with carriages | beside the landing `INVENTED` | — |
| `hbg-schooner` | **A schooner loading lumber** | documented class (S6, S7) | *none — see §8.6* | at the landing | — |

**Around it:** yellow pine and oak on the banks (`I-10`); prairie to the west toward San Felipe and
Stafford's Point; **Lynchburg and Zavala's place downstream**; nothing across either bayou but timber.
`HISTORY.md`'s representation limits apply as on the Brazos: the district shipped cotton grown by
enslaved people (S6), and the same paper that carried the mill notice carried runaway advertisements.

### 8.5 What the express road looks like here

Riders come **in from the west along the prairie road from San Felipe via Hunter's**, reach the town
on the terrace, and **go on east to Lynchburg** at the mouth of the bayou and across to Liberty
(S11). **In the game this is the town where the news from Gonzales turns east.**

### 8.6 Art gaps this sketch creates

Checked against the art sections of the ten earlier reports. **Raise existing requests; do not
duplicate them.**

**Existing requests this town raises the priority of:**

- **A frame / clapboard building** (San Felipe → Matagorda → Columbia → Brazoria → Velasco). **Harrisburg
  is where the boards were sawn** — two or three frame buildings in a log town beside the mill that
  made them. **Sixth town.**
- **A sea-going schooner** (Matagorda, Brazoria, Velasco). **Harrisburg adds the loading state: lying
  at a mill landing taking on sawn lumber, and later cotton and hides** (S6, S7). **Fourth town.**
- **A cargo lighter** (Matagorda, Velasco) — lower priority here; vessels came to the mills.
- **Cotton bales** (Columbia, Brazoria) — shipped from Harrisburg in November 1835 (S6).
- **A gun being moved and mounted** (Velasco) — **the Harrisburg cannon hauled west in October 1835,
  badly managed, only two of them on carriages** (S8). **Second town.**

**Do not request:** a steamboat (not attested at Harrisburg in 1835); a railroad or depot (1850s).

**Genuinely new — and the evidence supports it:**

1. **A working steam sawmill.** An open-sided timber mill shed about the size of a long barn, a sash
   (up-and-down) saw frame with a log on the carriage, **a boiler and engine house with a tall iron or
   brick stack and smoke**, a log deck and skids at the water, **stacks of sawn boards stickered to
   dry**, a sawdust heap, a boiler woodpile, and a plank landing stage with a vessel alongside. Wanted
   in one state (working) plus a smokeless ruin for April 1836 if that arc is drawn. **No town in the
   series has powered machinery, and this one is documented weekly in the game's month.**
   **Stand-in:** `shed-open` scaled long, with the stone chimney piece from `house-modules` as the
   stack, `smoke-dispersing` over it, `crate` and `barrel` stacks for lumber, marked
   `stand-in: Request — working steam sawmill (Harrisburg)`.
2. **Lumber stacks and a log deck** as separate props — sawn boards in stickered piles, and a ramp of
   sawlogs. Small, reusable at any landing that received plank (Brazoria, Columbia, Velasco).

**Record the gap, do not request yet:** a grist mill interior; a sash saw close-up.

---

## 9. Verdict

**Can Harrisburg be drawn honestly? Yes — better than any town in the series except the Alamo, for
the plan; and no better than Velasco, for the buildings.**

**What is solid.** **The steam mills existed, were owned by a named company with named proprietors,
had been bought on 2 January 1835, hired a sawyer and carpenters that winter, and advertised every
week of October 1835 that they were in complete order and selling pine and oak lumber at $25 a
thousand.** Schooners loaded lumber at them for the Mexican ports, and came frequently after Anahuac
fell. **Vessels drawing five or six feet reached them.** The bayou was tidal, canal-like and timbered.
**The town was about twenty houses, mostly log, two or three frame, irregularly built.** Its men
forwarded Austin's expresses east to Lynchburg in September, **its cannon went west to the army in
October**, and the weekly mail road San Felipe–Hunter's–Harrisburg–Lynchburg–Liberty was ordered in
December. **The grid was surveyed in 1826, and the ground still holds it: 400-ft modules measured to
the foot, 320-ft blocks and 80-ft streets printed on the 1854 sheet, bearing 88.8°, on a 33-ft
terrace.** The houses were burned on 16 April 1836.

**What would have to be invented.** **Where the mill stood, and everything about how it looked.** Where
any house stood — Block 3 for the Harris house is a pamphlet's statement, and the markers put it in
two other places. The course and width of the 1835 bayou, which must be redrawn from an 1854 sheet
because the Ship Channel cut off the loop. Whether the 1826 blocks were exactly the 1854 blocks. Which
streets were more than survey lines. The landing's form. The number of people.

**Is there enough to draw the town honestly? Yes, on two conditions.** **Draw the 1854 grid as a
survey with twenty houses loosely on it, not as a town that fills it**; and **put the mill, smoking,
at the water inside the bayou loop, with sawn lumber stacked on the bank and a schooner alongside —
and mark its position and form as invented.** The temptation to resist is the 1854 lithograph's
ninety-four blocks, its railroad and its Depot Ground, which are a railroad company's town nineteen
years later.

**What will surprise anyone who knows Harrisburg as "the place Santa Anna burned":** in October 1835 it
was the only place in Texas where a steam engine was sawing boards for sale, and its mill company was
run from Columbia by men who were also on their way to the Consultation.

**The things most worth doing before drawing it**, in order of value:

1. **Find the 1826 plat** — Harris County Archives, Houston Metropolitan Research Center, San Jacinto
   Museum. It settles `I-4` and whether the core was eight-lot blocks.
2. **Find the Rothhaas plat (1839–49).** It is the missing step between the two sheets.
3. **Search the Harris County deed records and the GLO file for the Harris league** for the mill tract.
   The January 1835 contract of sale should describe the property it conveyed.
4. **Read the remaining *Texas Republican* issues (Nov 1835 – Mar 1836)** for the mill notice and any
   change in it.
5. **Ask the Harris County Historical Commission and THC whether any archaeology of the townsite or
   mill exists.**
6. **Read Almonte's 1834 report** for a San Jacinto district population.
