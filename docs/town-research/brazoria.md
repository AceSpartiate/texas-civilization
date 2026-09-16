# Brazoria in 1835 — what is known about the town plan

Research only. Nothing here is built, and no claim below has a `HIST-` or `FIC-` ID yet; IDs are
assigned when something is drawn. Read alongside `docs/town-research/columbia.md` — **Brazoria's
nearest neighbour, twelve miles up the same river, in the same county, under the same
ayuntamiento, and the town it is most often confused with** — and `san-felipe.md`, `victoria.md`,
`mina.md`, `matagorda.md`, `liberty.md`, `goliad.md` and `washington.md`, which this follows in
shape. The layout vocabulary in §7 is that of `public/bexar-layout.js`; `public/gonzales-art.js`
(`GONZALES_BUILDINGS`) and `public/alamo-layout.js` were both read and both exist as the brief
says.

Researched 2026-09-16. Every URL in §1 was opened and read on that date. Every measurement in
§2.4–§2.6, §3.2–§3.4 and §7 was computed here on that date from the sources named.

---

## The one-line answer

**Brazoria's plat is lost, but Mary Austin Holley describes its plan in one sentence, the surviving
street grid matches her sentence exactly, and that grid measures a module of 100 varas — the
cleanest measured plat module in this series. And for the first time in nine reports, the town's
own newspaper can be read week by week through October 1835.**

Four things, and they agree:

1. **The plan, in words, from 1836.** Holley: *"One street stretches along the banks of the
   Brazos"* (S7, quoted), with one parallel to it further back, and other streets laid out to
   intersect these at right angles. That is a river-front plat — a Front/Main street on the bank,
   a Main/Market street behind it, cross streets running down to the water.
2. **The grid on the ground says the same thing.** In **Old Town Brazoria**, twelve streets run
   parallel to the Brazos on a bearing of **S 46.3° E** and eight run square to them at
   **N 43.1° E**; the two families differ by **90.6°**. The river-parallel set — Main, Pearl,
   Austin, Camp, Travis, Marion, Velasco — sits at intervals of **282, 279, 279, 279, 272 and
   279 ft**. Mean **278.3 ft. One hundred varas is 277.8 ft.** The match is 0.2 %.
3. **The riverfront street is still called Main, the cross street at the landing is still called
   Market, and a local history puts the town's principal firm on that corner.** The Mills
   brothers' store and bank: *"Their business was located at the corner of Market and Main"*
   (S12, quoted), with the back of the building built out over the river as a steamboat landing.
   **Market × Main is the one building corner this town has, and it is the origin of §7's frame.**
4. **The *Texas Republican* was printed in this town every Saturday through October 1835 and the
   issues survive.** Thirty-four of them were read here (§1c). They name the hotel, the merchants,
   the doctors, the wagon-maker, the pilot of the Brazos bar, the votes polled, and the day the
   New Orleans Greys were fed in Jane Long's house.

**The trap is a slow one and it is written on a bridge plaque.** Brazoria did not drown, silt up
or fall in the river. It was **partially burned in 1836**, it lost the county seat to Angleton in
1896–97, and then in 1912 *"the townspeople moved to 'New Town'"* by the new railroad (S5-Bridge,
quoted). The living town of Brazoria — Louisiana, Virginia, Alabama, Ohio, Oregon Streets, on a
grid bearing 88° — **is not the 1828 town and is not on the 1828 ground.** The 1828 town is the
lightly-built quarter a kilometre north-east of it, along Old Main Street. **Measure the old grid
and ignore the one people live in.**

### Five corrections to the brief, and one to the repository

- **The paper is the *Texas Republican*, not the "*Texas Republic*", and the *Texas Gazette* is the
  wrong decade.** Both names in the brief are real and both need fixing. The *Texas Gazette* was
  Godwin Brown Cotten's San Felipe paper; he moved the press to Brazoria and printed the *Texas
  Gazette and Brazoria Commercial Advertiser* there **for three months only, April to June 1832**
  (S17). The **same press** then carried three more titles — Anthony's *Constitutional Advocate and
  Texas Public Advertiser* (1832–33), Wharton's *Advocate of the People's Rights* (to 27 March
  1834), and **F. C. Gray's *Brazoria Texas Republican* from 5 July 1834 to about March 1836**
  (S17, S18). **It is the *Texas Republican* that is printing in October 1835**, and §1c reads it.
- **"the Texas Republic's first newspapers" is the wrong claim for this town.** The Republic's
  first newspaper was the *Telegraph and Texas Register*, which was founded at **San Felipe on
  10 October 1835** and never printed at Brazoria (the Columbia researcher established this).
  What Brazoria has is better and different: **for part of 1832–34 it held the only press in
  Texas** (S8), and in October 1835 it held one of two. **Brazoria is the only town in this
  nine-town series with a press actually working in the game's month.**
- **The cannon of 1832 were not built at Brazoria.** The brief says "the Brazoria-built cannon
  episode". They were **taken off the wreck of the steamboat *Ariel* in the San Jacinto River**
  and carried down on the schooner *Brazoria* (S13, S14). What is Brazoria's is the **hiding** of
  them: local history puts the powder and the cannon in an outbuilding at Jane Long's boarding
  house before the march (S12). The militia journal of 22 June 1832 lists what actually left the
  town: *"Two Canonades, one swivel and Two Blunder Busses"* (S14, quoted), forty men aboard the
  schooner and sixty by land.
- **"the old townsite has been studied" — no archaeological report was found.** Nothing comparable
  to Columbia's 41BO225 exists in anything read. The Brazoria Heritage Foundation's own account
  says hurricanes, floods, termites, apathy and dynamite destroyed nearly every tangible reminder,
  and that the **Masonic Oak** is one of the few left (S12). **Brazoria is the least-excavated
  town in this series, not one of the better-studied ones.** §1b says who to ask.
- **There are two museums, not one.** The brief names the **Brazoria County Historical Museum**,
  in Angleton, which holds the Adriance Library and Research Center (S15). There is also the
  **Brazoria Historical Museum** run by the Brazoria Heritage Foundation, in the town of Brazoria
  itself, whose site carries the marker texts and local history used as S12. **Neither was
  contacted.**
- **`sim/texas.mjs` has Brazoria but no road to it.** The brief says Brazoria "is on the game's map
  with a road drawn to it". Line 68 carries
  `{ id:'brazoria', name:'Brazoria', on:'the Brazos River', x:164, y:30, weight:'minor' }`, and
  that is all: `PROVINCE_ROADS` contains exactly one entry, the Béxar–Gonzales–San Felipe road,
  which does not come near Brazoria. **No road is drawn to Brazoria.** Two further notes in §8.

---

## 1. Sources

| # | Source | What it was used for | URL read 2026-09-16 |
| --- | --- | --- | --- |
| S1 | TSHA *Handbook of Texas*, **Brazoria, TX** | That the town was **established in 1828, when John Austin laid out the town on land granted by Stephen F. Austin**; the Masonic Oak meeting of March 1835; that the town was virtually deserted in the Runaway Scrape; the 1838 school, the 1846 post office, the 1884 "stirring village" of 800, the county seat to 1897, the bypassing railroad | [tshaonline.org/handbook/entries/brazoria-tx](https://www.tshaonline.org/handbook/entries/brazoria-tx) |
| S2 | TSHA *Handbook of Texas*, **Brazoria County** | **The 1834 list of largest settlements — "Brazoria, with 500 residents, Velasco with 100, and Bolivar with fifty" (quoted)**; the 1834 municipal figure of 2,100 and the rename to Columbia; the 1833 flood and cholera; **the meeting near Brazoria of 1 March 1835 that founded Holland Lodge No. 36**; **Austin's declaration against Santa Anna at a Brazoria meeting on 8 September 1835**; that **customhouses were located at Brazoria and Velasco**; the county's timber, game and bottom hardwoods; Brazoria 800 and Columbia 300 in 1840; the county created 24 March 1836 and Brazoria county seat from 20 December 1836 | [tshaonline.org/handbook/entries/brazoria-county](https://www.tshaonline.org/handbook/entries/brazoria-county) |
| S3 | TSHA *Handbook of Texas*, **Austin, John** | John Austin's Long-expedition past; the mercantile store at Brazoria with J. E. B. Austin; **port officer 1831, alcalde of Brazoria Municipality 1832**; commander at Velasco; **that he died 11 August 1833 in the cholera epidemic** — i.e. the town's founder was two years dead in October 1835 | [tshaonline.org/handbook/entries/austin-john](https://www.tshaonline.org/handbook/entries/austin-john) |
| S4 | TSHA *Handbook of Texas*, **Long, Jane Herbert Wilkinson** | **That she bought W. T. Austin's boarding house at Brazoria in 1832 and operated it for five years**, moving to Richmond in 1837 — so the house is hers throughout the game's window; her life before and after | [tshaonline.org/handbook/entries/long-jane-herbert-wilkinson](https://www.tshaonline.org/handbook/entries/long-jane-herbert-wilkinson) |
| S5 | **Historical markers**, transcribed and photographed on hmdb.org. Seventeen listed for the town, ten fetched, eight used; itemised in §1a. Fetched with curl and a browser user-agent (WebFetch is refused by hmdb — the note in the Victoria research is still correct) | The 1912 move to "New Town"; the 1836 burning; the townsite; **Jane Long's boarding house site with a coordinate**; John Austin's home site; the Masonic Oak and the six men who met under it; the 1827 Catholic cemetery; that the Presbyterians had no building until the 1850s | see §1a |
| S6 | **The *Brazoria Texas Republican*, Feb 1835 – Mar 1836**, read on the Portal to Texas History as OCR text: **34 issues, 130 pages, about 1.6 MB.** Itemised in §1c | **The town's own voice in the game's month.** The Brazoria Hotel and John P. Gill; Fitchett & Gill; Edmund Andrews, L. C. Manson, Bennett & Sharp, Sterling McNeel, A. Brigham, Robert Mills & Co.; Drs Anson Jones, Ira Jones and E. Harris; Charles Kneass the portrait painter; J. B. Cowan's wagon shop; the pilot of the Brazos bar; **the curator's sale of a block of lots and an out-lot in the town**; the votes polled at Brazoria on 25 September; the meetings of 4 and 20 September; **the New Orleans Greys fed at Mrs Long's on 21 October** | index [texashistory.unt.edu/explore/titles/t01324](https://texashistory.unt.edu/explore/titles/t01324/); items and arks in §1c |
| S7 | **Mary Austin Holley**, *Texas* (Lexington, 1836), Internet Archive djvu text — already the source for `HIST-TEX-016` | **The only description of Brazoria's town plan found anywhere.** *"One street stretches along the banks of the Brazos"* (quoted), one parallel behind it, others at right angles; the town on a wooded elevation of "peach land", chosen as most commanding and healthful, disputing empire with the lords of the forest; **thirty miles from the mouth by the river and fifteen by land**; **fifty families in 1831 and not many more in 1836, though more houses**; the 1833 cholera; the courts drawn off to Columbia and afterwards returned; vacant houses to be had; disappointment at the sight of it; mail route No. 4; **the *Texas Republican* at Brazoria and the *Telegraph* at San Felipe**; Bolivar as the head of tide water; the Harrisburg steam mills | [archive.org/download/texas00holl/texas00holl_djvu.txt](https://archive.org/download/texas00holl/texas00holl_djvu.txt) |
| S8 | **David B. Edward**, *The History of Texas* (Cincinnati, 1836), Internet Archive djvu text | **The contrary verdict, and the trap in one clause**: Brazoria twelve miles below Columbia on the same side of the Brazos, of considerable consequence but unable to remain so *"by reason of… the lowness of its situation; being subject to overflows in a particularly wet season"* (quoted); its widely spread timber bottoms; its survival as a carrying place; **that the press at Brazoria was the only one then in Texas** (1832); Mexía conducted to Brazoria by a deputation of citizens, received by the committee of vigilance; John Austin's warehouse at the mouth of the Brazos in 1830 | [archive.org/download/historyoftexas01edwa/historyoftexas01edwa_djvu.txt](https://archive.org/download/historyoftexas01edwa/historyoftexas01edwa_djvu.txt) |
| S9 | ***The Austin Papers, October 1834 – January 1837***, vol. III, ed. Eugene C. Barker (Austin, 1927), Internet Archive djvu text | **The dinner, from inside the town.** Benjamin F. Smith and others to Austin, **Brazoria, 4 September 1835**, inviting him to *"a dinner on Tuesday the 8 inst, at, Messrs Fitchett and Gill, in this town"* (quoted), signed Benj. F. Smith, Edmd Andrews, John Wurts Cloud, Robt J. Calder; **the index entry "Fitchett and Gill, hotel, 112"**; **D. T. Fitchett writing from Brazoria on 22 September 1835 having left Columbia that morning**; Asa Brigham calling the Ayuntamiento for 5 October; **the election returns taken at Brazoria, 25 September and 5 October 1835, with a top figure of 104** | [archive.org/download/austinpapersocto03aust/austinpapersocto03aust_djvu.txt](https://archive.org/download/austinpapersocto03aust/austinpapersocto03aust_djvu.txt) |
| S10 | **OpenStreetMap**, read through `api.openstreetmap.org/api/0.6/map?bbox=` (Overpass returns 406 here — the Matagorda researcher's note saved time again), 2026-09-16 | Every named street centreline and the Brazos course in and around Old Town Brazoria, from which every bearing, module, street position and distance in §2.4–§2.6 and §7 was computed. 311 named highway ways, 138 km of centreline | `https://api.openstreetmap.org/api/0.6/map?bbox=-95.585,29.040,-95.545,29.070` |
| S11 | **USGS 3DEP**, Elevation Point Query Service, 2026-09-16 | The transect across the Brazos, the profile inland across the whole grid, the height of the cut bank, the width of the water, and the comparison with Columbia (§3.3) | `https://epqs.nationalmap.gov/v1/json` |
| S12 | **Brazoria Heritage Foundation**, *Old Town Brazoria* (5 pp., undated, unfootnoted), the text of the town's own interpretive markers | **The best building-by-building local account found.** *"Their business was located at the corner of Market and Main"* (quoted) of the Mills brothers' store, bank, post and insurance office, **with the back of the building built over the river and serving as a steamboat landing**; Jane Long's boarding house **on Main Street**, formerly W. T. Austin's tavern, with an outbuilding that hid the powder and cannon; **the 1831 trade list — blacksmith, gunsmith, carpenters, masons, two doctors, several lawyers, a shoe cobbler, a boot and saddle cobbler, a weaver, a tannery downwind of town, two general stores, a steamboat landing and a hardware store**; Brazoria Courthouse Square and the Masons' meeting room in the courthouse by December 1835; the steep river bank a house was hauled up by horse and mule; the 1896 loss of the county seat and the 1934 dynamiting; S. F. Austin to W. C. Carr, 4 March 1829, on *"a new town we have laid off on the Brasos river"* | [brazoriahf.org/new/wp-content/uploads/2014/04/brazoria_history.pdf](https://brazoriahf.org/new/wp-content/uploads/2014/04/brazoria_history.pdf) |
| S13 | TSHA *Handbook of Texas*, **Brazoria [Schooner]** and **Velasco, battle of** | **That the schooner *Brazoria* "was anchored at Brazoria when preparations were being made"** (quoted) — a sea-going schooner lying at this town in June 1832; that she carried a company and two or three small cannon **taken from the *Ariel***; John Austin and Henry Smith in command; Ugartechea's surrender | [brazoria-schooner](https://www.tshaonline.org/handbook/entries/brazoria-schooner); [velasco-battle-of](https://www.tshaonline.org/handbook/entries/velasco-battle-of) |
| S14 | **Militia journal, 22–27 June 1832**, Mirabeau B. Lamar Papers #132, Texas State Library and Archives, transcribed on the TSLAC "Texas Navy" exhibit | **The only contemporary account of a force leaving this town.** Brazoria, 22 June 1832, Capt. John Austin, 100 men, sixty by land and forty by water aboard the schooner *Brazoria*, with *"Two Canonades, one swivel and Two Blunder Busses"* (quoted); the march by W. H. Wharton's Landing, Hawk Camp and A. Calvit's labour two miles above the mouth; **three portable barricades of two-inch pine plank, 4 ft high and about 20 ft long** | [tsl.texas.gov/exhibits/navy/militia_june22_1832_1.html](https://www.tsl.texas.gov/exhibits/navy/militia_june22_1832_1.html) |
| S15 | **Brazoria County Historical Museum**, Angleton — county page and PastPerfect catalogue | That the museum is the county's Historical Resource Center, holds the **Adriance Library and Research Center**, and takes research enquiries at research@bchm.org. **Its catalogue was not searched for a Brazoria plat** (§1b) | [brazoriacountytx.gov/departments/museum](https://www.brazoriacountytx.gov/departments/museum); [bchm.pastperfectonline.com](https://bchm.pastperfectonline.com/) |
| S16 | **Portal to Texas History gazetteer**, place record **"Old Brazoria"** | The canonical coordinate of the 1828 town, **29.055530, −95.565220**, distinct from the modern town — used as the check on §2.4 | [texashistory.unt.edu/explore/locations/p08660/](https://texashistory.unt.edu/explore/locations/p08660/) |
| S17 | TSHA *Handbook of Texas*, **Texas Gazette** | **The whole lineage of the Brazoria press, one machine and four titles**: Cotten at San Felipe from 25 September 1829; Williamson's *Mexican Citizen* 1831; **the press moved to Brazoria, printing the *Texas Gazette and Brazoria Commercial Advertiser* April–June 1832**; D. W. Anthony's *Constitutional Advocate and Texas Public Advertiser* from July 1832 until his death of cholera in 1833; John A. Wharton's *Advocate of the People's Rights* to 27 March 1834; **the same press used from July 1834 by Gray and Harris for the *Brazoria Texas Republican*** | [tshaonline.org/handbook/entries/texas-gazette](https://www.tshaonline.org/handbook/entries/texas-gazette) |
| S18 | TSHA *Handbook of Texas*, **Brazoria Texas Republican** | Weekly from **5 July 1834**; Gray and Harris until Harris retired December 1834; **three columns and four pages, changing to five columns by 14 November 1835**; publication ceasing about March 1836 with the Mexican advance | [tshaonline.org/handbook/entries/brazoria-texas-republican](https://www.tshaonline.org/handbook/entries/brazoria-texas-republican) |
| S19 | **Library of Congress, Sanborn Maps collection**, searched for Brazoria County, 2026-09-16 | **A negative result that matters.** Sheets exist for Alvin, Angleton, Freeport, Lake Jackson, Velasco and West Columbia. **There is no Sanborn sheet for the town of Brazoria in any year.** §1b explains why that is itself evidence | [loc.gov/collections/sanborn-maps/?q=brazoria](https://www.loc.gov/collections/sanborn-maps/?q=brazoria) |

### 1a. The historical markers used (S5)

Seventeen markers are listed for Brazoria on hmdb.org; ten were fetched and eight are used. The
coordinates are the markers' own and were converted into the grid frame of §7. **Six of the eight
fall inside the old grid, and the two that do not are both to the south-west, in or beyond the
1912 town.**

| Marker | Erected | Coordinates (hmdb) | In §7's frame (ft) | URL |
| --- | --- | --- | --- | --- |
| **Brazoria Townsite** (9534) | 1964, State Historical Survey Committee | 29° 3.23′ N, 95° 33.742′ W | x 16, y 1043 | [hmdb m=167907](https://www.hmdb.org/m.asp?m=167907) |
| **Site of Jane Long's Tavern** (9572) | **1986, Texas Historical Commission** | **29° 3.375′ N, 95° 33.637′ W** | **x −190, y 16 — on Main Street** | [hmdb m=184358](https://www.hmdb.org/m.asp?m=184358) |
| **Site of the Home of John Austin** (9522) | **1936, State of Texas** | 29° 3.325′ N, 95° 33.959′ W | x −1217, y 1407 | [hmdb m=167903](https://www.hmdb.org/m.asp?m=167903) |
| **Old Brazoria Cemetery** (9532) | 1967, State Historical Survey Committee | 29° 3.317′ N, 95° 33.8′ W | x −571, y 866 | [hmdb m=173172](https://www.hmdb.org/m.asp?m=173172) |
| **Don Carlos Barrett** (9525) | 1936, State of Texas | 29° 3.284′ N, 95° 33.797′ W | x −420, y 1001 (in the cemetery) | [hmdb m=167917](https://www.hmdb.org/m.asp?m=167917) |
| **Masonic Oak** (9573) | 1966, State Historical Survey Committee | 29° 3.343′ N, 95° 34.195′ W | **x −2201, y 2188 — 0.59 mi SW of Market × Main** | [hmdb m=167902](https://www.hmdb.org/m.asp?m=167902) |
| **Masonic Oak** (interpretive panel, same spot) | — | 29° 3.343′ N, 95° 34.195′ W | as above | [hmdb m=167942](https://www.hmdb.org/m.asp?m=167942) |
| **Brazoria Bridge** (9531) | 1991, Texas Historical Commission | 29° 3.435′ N, 95° 33.378′ W | x 558, y −1191 (over the river) | [hmdb m=90103](https://www.hmdb.org/m.asp?m=90103) |
| **First Presbyterian Church of Brazoria** (17665) | — | 29° 2.572′ N, 95° 34.248′ W | in New Town; **used only for the negative in §4.3** | [hmdb m=167906](https://www.hmdb.org/m.asp?m=167906) |
| (index of 17 Brazoria markers) | — | — | — | [hmdb results, Brazoria](https://www.hmdb.org/results.asp?Town=Brazoria&State=Texas&County=Brazoria) |

**What these markers are.** Mostly **1936 Centennial and 1960s Survey Committee plates** — the
class the Matagorda and Victoria researchers found least reliable — with **one exception that is
better than the rest**: the 1986 Sesquicentennial marker for Jane Long's boarding house, which
carries a narrative with dates, says "on this site", and is the only marker in the town that gives
a building a position. **Two of the eight contradict each other and one contradicts S12**, and
both disagreements are flagged where they arise (§2.7, §3.5, §4.1).

### 1b. Sources looked for and not found

- **The Portal to Texas History is open, and this is the finding to carry into every future
  report.** Eight reports running have been stopped by its altcha interstitial. **The
  interstitial guards `/search/` only.** Item pages under `/ark:/67531/…` and browse pages under
  `/explore/…` answer **curl with a browser user-agent with HTTP 200 and full server-rendered
  HTML**, including the per-page OCR text at `/ark:/67531/<id>/m1/<page>/ocr/`, which sits in a
  single `<p>` inside `<div id="ocr-text">`. **The method is: find ark IDs with an ordinary web
  search, then read them directly.** That is how §1c's 130 pages were read. `/search/?…&format=json`
  still serves the altcha and the JSON API could not be reached.
- **The 1828 plat itself was not located, and nothing read reproduces or quotes it.** Unlike
  Columbia, where two independent sources work from the sheet, **nobody read has evidently seen
  Brazoria's.** It should be in the **Brazoria County Clerk's** records at Angleton. **A photograph
  of it would settle nine of the fifteen unknowns in §5.**
- **There is no Sanborn sheet for Brazoria (S19).** The best plat substitute in this series —
  the one that recovered Columbia's 1826 block numbering and Liberty's 1831 Mexican plat — **does
  not exist here.** That absence is itself a datum: Sanborn mapped towns with insurable business
  districts, and by 1926 Brazoria's business had moved to New Town fourteen years earlier. The
  1926 survey of Brazoria County mapped **Angleton, Alvin, Freeport, Velasco and West Columbia**
  and skipped Brazoria.
- **No archaeological report on the townsite was found.** No site trinomial, no Texas Historical
  Commission report, nothing comparable to 41BO225 at Columbia. Given that the county museum is
  the county's designated Historical Resource Center, **the first question to ask it is whether
  the old townsite has ever been tested.**
- **Neither museum was contacted** (S12, S15). The Brazoria County Historical Museum's Adriance
  Library is the obvious holder of a plat, a title abstract, or a nineteenth-century photograph
  of Main Street.
- **James A. Creighton, *A Narrative History of Brazoria County* (1975), was not read**, for the
  second report running. It is cited by every TSHA entry used here.
- **The full run of the *Texas Republican* was not read.** The Portal holds 35 issues; 34 were
  read (§1c). **What is missing is the run before February 1835** — issues 1–24, July 1834 to
  February 1835 — and the three earlier Brazoria titles (S17), *none* of which were looked for.
  **Anthony's *Constitutional Advocate* is the likeliest place in existence to find a Brazoria
  street name in an 1832–33 advertisement.**
- **The General Land Office map database was not used.** The Portal carries GLO county maps of
  Brazoria County (`metapth89106`, `metapth89109`); neither was opened, and a county map will not
  carry a town plat, but the GLO certainly holds the John Austin league survey.
- **No Almonte original was read**, only `HIST-TEX-011`'s existing summaries.
- **The Brazoria County deed records were not searched**, and they are where the block-and-lot
  numbering of §2.7 would be confirmed or destroyed.

### 1c. The *Texas Republican* issues read (S6)

All read as OCR text at `texashistory.unt.edu/ark:/67531/metapth<id>/m1/<page>/ocr/`. The paper is
four pages (occasionally two or six), three columns to February 1835 and five from 14 November
1835 (S18); the OCR interleaves columns badly and every reading below was checked against a second
occurrence in a later issue wherever the advertisement repeated.

| Ark id | Issue | Date | Used for |
| --- | --- | --- | --- |
| metapth80252–80257 | 25, 28–32 | 14 Feb – 11 Apr 1835 | **The curator's sale of D. W. Anthony's estate**, advertised four weeks running |
| metapth80258–80259 | 35, 36 | 2, 9 May 1835 | The same advertisement; the paper's terms and prices |
| metapth80260–80265 | 39–44 | 30 May – 4 Jul 1835 | Bennett & Sharp buying out Sterling McNeel; the Mills dissolution; sheriff's sales in the town |
| metapth80266–80267 | 46, 47 | 18, 25 Jul 1835 | Charles Kneass, portrait painter; Dr Anson Jones taking in Dr Ira Jones; J. B. Cowan's new road and ferry; **the pilotage rules for the Brazos bar** |
| metapth80268–80270 | 49, 51, 52 | 8, 22, 29 Aug 1835 | Cos to the Ayuntamiento of the jurisdiction; A. Brigham's notice; the Columbia meeting |
| **metapth80271** | **53** | **19 Sep 1835** | **The Brazoria citizens' meeting of Friday 4 September and the public dinner to Austin on Tuesday 8 September at Fitchett & Gill's** |
| **metapth80272** | **54** | **26 Sep 1835** | **The election at Brazoria on the 25th, 64 votes polled**; the Committee of Safety of the jurisdiction of Columbia meeting **in the town of Brazoria**; the resolution to raise a volunteer company at Brazoria; **the Brazoria Hotel**; L. C. Manson selling his dwelling house and two improved lots |
| **metapth80273** | **55** | **3 Oct 1835** | The militia of the jurisdiction ordered to Columbia on 5 October; the Fall Races over the Columbia Turf |
| **metapth80274** | **56** | **10 Oct 1835** | **The full election returns for the jurisdiction**; W. H. Wharton's call from Brazoria, 5–6 October, to march to Gonzales; Edmund Andrews's October goods |
| **metapth80275** | **57** | **17 Oct 1835** | The Lady Madison towed in at Quintana with seven cannon; candidates for sheriff |
| **metapth80276** | **58** | **24 Oct 1835** | The dispute over the Velasco poll; Goliad taken |
| **metapth80277** | **59** | **31 Oct 1835** | **The New Orleans Greys towed up to Brazoria and fed at Mrs Long's**; the Montezuma off the mouth; *"the present deserted condition of the town and country"* (quoted) |
| metapth80278 | 61 | 14 Nov 1835 | Edmund Andrews's November cargo — bagging, bale rope, powder, lead and shot |
| metapth80279–80280 | 68, 76 | 6 Jan, 2 Mar 1836 | **Fitchett & Gill dissolving, with Fitchett gone to Columbia and the Brazoria debts left to Edmund Andrews**; Haskins resigning as pilot of the bar |

---

## 2. Documented — the plan

### 2.1 Which Brazoria, and why the modern town is the wrong one

**This is the question to settle first, and it is Brazoria's version of Columbia's two-towns
problem — except that here the two places share not only a name but a corporation.**

| | **Old Town Brazoria** | **New Town Brazoria** |
| --- | --- | --- |
| Laid out | **1828**, by John Austin (S1) | **1912**, by the townspeople (S5-Bridge) |
| Why | a port and trading centre on the Brazos | *"to escape floods and to enjoy a better life"*, by the St Louis, Brownsville & Mexico Railway |
| Grid bearing | **N 43.1° E / S 46.3° E** | **N 88° E / N 1° W**, and a second set at 85° |
| Module | **278 ft — 100 varas** | not measured here |
| Street names | **Main, Market, Pearl, Austin, Camp, Travis, Marion, Velasco, China, Star, Liberty, Milam, Walnut, Chestnut, Cherry** | **Louisiana, Virginia, Alabama, Florida, Georgia, Indiana, Nevada, New York, Ohio, Oregon, Texas, Railroad, Smith, Brooks, Wilson** |
| Where | 29.0555 N, 95.5652 W (S16) | about 29.045 N, 95.571 W |

**The two grids do not touch and are 45° apart.** The state-name grid is unmistakably twentieth
century; the Old Town names are exactly what an 1828 American speculative plat on the Brazos would
carry. **Anything drawn from the modern town centre is wrong by about a kilometre and by
forty-five degrees.**

### 2.2 The plan in words — Holley's sentence, which is the whole documentary plat

> *"One street stretches along the banks of the Brazos"* — S7, quoted, of Brazoria as it stood
> when she wrote.

Holley continues that there is one street parallel with it further back, while other streets are
laid out to intersect these at right angles. **That is three statements about the plan:**

1. **A street on the bank**, running with the river.
2. **A second street parallel to it, one block back.**
3. **Cross streets at right angles**, running down to the water.

**It is not a description of a large plat.** Holley is describing a town whose built part in 1831
was **two streets deep**. The surviving grid is six or more streets deep (§2.4) — which means
either the plat was always larger than the built part, or it grew. **§6, I-1 takes the first
reading**, on the strength of the out-lot numbering in §2.7.

### 2.3 Where it is, and how it sat on its grant

- **Founded 1828 by John Austin on land granted by Stephen F. Austin** (S1). S. F. Austin, writing
  to W. C. Carr on 4 March 1829, calls it *"a new town we have laid off on the Brasos river"*
  (S12, quoted), fifteen miles from its mouth, and says he gave it its name because he knew of
  none like it in the world. **So: John Austin laid it out, Stephen F. Austin granted the land,
  was party to the laying-out, and named it.** The brief's "laid out about 1828 by John Austin" is
  right as far as it goes.
- **John Austin was alcalde of Brazoria Municipality in 1832 and died of cholera on 11 August
  1833** (S3). **The founder is two years dead in the game's month.**
- **Brazoria was the capital of its own municipality from 1832** (S12), the body Mexía addressed
  in 1832 as the second alcalde of the second department of Austin's colony (S8). **In 1834 the
  municipality was renamed Columbia and the seat moved to Columbia** (S2). **By October 1835
  Brazoria is not a seat of government of any kind** — every civic notice in the *Texas Republican*
  is headed "the jurisdiction of Columbia", the Primary Judge sits at Columbia, and the courthouse
  the paper advertises sales at is *the Courthouse in the Town of Columbia* (S6, issue 46).
  **This is the single most important thing to get right about Brazoria in 1835 and it is exactly
  backwards from the town's reputation.**
- **The 1827 Catholic cemetery predates the town by a year** (S5-Cemetery). It is inside the grid
  (§7.2). The town was laid out around a burying ground that was already there.

### 2.4 The grid, measured

Every named street centreline within the bbox of S10 was pulled, broken into segments, and binned
by length-weighted bearing. **Three grids come out, and only one of them is 1828.**

- **Grid A — Old Town.** Twelve streets at a length-weighted median of **133.7°** (S 46.3° E) and
  eight at **43.1°** (N 43.1° E). **133.7 − 43.1 = 90.6: square to within two thirds of a degree.**
- **Grid B — the state-name town of 1912.** 88.1° and 178.7°.
- **Grid C — a third set** at 84.8° and 174.6°, carrying Front Street, North and South Main,
  Church, Erwin, Carlton, Oak, Maple, Pine. It is south of and adjoining Grid B. **Note the
  trap inside the trap: the modern "Front Street" and the modern "North/South Main Street" are
  in Grid C, not in the old town.** Old Town's Main is signed **"Old Main Street"** or
  **"Old Main"** and runs at 133.7°.

**The river runs with Grid A.** The Brazos centreline beside the town lies between 133° and 140°
over half a mile — **the plat was laid square to the river, not to the compass**, exactly as
Holley's sentence implies.

**The module, along the river-parallel streets.** Perpendicular offsets from Main Street,
measured on the median of every node of each street:

| Street | Distance back from Main | Interval |
| --- | --- | --- |
| **Main (Old Main)** | **0 ft** | — |
| Pearl | 282 ft | 282 |
| Austin | 561 ft | 279 |
| Camp | 840 ft | 279 |
| Travis | 1,119 ft | 279 |
| Marion | 1,391 ft | 272 |
| **Velasco** | **1,670 ft** | 279 |

**Six consecutive intervals of 282, 279, 279, 279, 272 and 279 ft. Mean 278.3 ft.**
**One hundred varas is 277.78 ft. The measurement is 0.2 % over it.**

**That is the tightest module recovery in this series** — Columbia measured 406 ft and could be
145 or 150 varas; Matagorda measured 150 varas twice; **Brazoria measures 100 varas six times in
a row.**

**The module, across.** Offsets from Market Street along the river:

| Street | Offset (downstream +) | Interval |
| --- | --- | --- |
| Walnut / Gaines | −1,148 ft | — |
| Chestnut | −882 ft | 266 |
| Star / Spencer | −591 ft | 291 |
| China | −325 ft | 266 |
| **Market** | **0** | 325 |
| Liberty | +541 ft | 541 = 2 × 270 |
| Cherry | +935 ft | 394 |
| Milam | +1,722 ft | 787 = 3 × 262 |

**Mean of the unit intervals: 274 ft.** Noisier than the other axis — several of these are
unpaved lanes whose modern centrelines wander — **but the same 100-vara module, and Liberty and
Milam fall on exact multiples of it.** **The plat is square: 100 varas by 100 varas.**

**Streets beyond Velasco** — Yerby (2,001 ft back), Willis (2,336), Bell (2,474), Burnett (2,818),
Henderson (3,366) — **sit on a looser spacing near 101 m and do not fit the 100-vara run.** Treat
them as later ground (§6, I-2).

**Two street-name pairs are one street each.** Star and Spencer are 16 ft apart on the
perpendicular axis; Walnut and Gaines are 10 ft apart. They are continuations under different
modern names.

### 2.5 Block and street width

**Nothing read states a street width or a block dimension for Brazoria.** What can be said:

- With a 100-vara module, a **20-vara street (55.6 ft)** leaves a block of **80 varas — 222 ft**
  square. A **10-vara street (27.8 ft)** leaves **90 varas, 250 ft**.
- 20 varas is the width Mina's surveyor was instructed to use, and four of five Sanborn readings
  at Columbia sit on it. **20 varas is the defensible guess and it is a guess** (§6, I-3).
- A 222-ft block divided into **eight lots** in two columns of four, the arrangement documented at
  Columbia, gives a lot of about **111 ft deep by 55 ft of frontage — 40 × 20 varas.** That is a
  very normal Mexican-period town lot. **Nobody says it** (§6, I-4).

### 2.6 Where the town sits in its own frame, and the check on it

The frame of §7 puts its origin at **Market Street × Main Street**, computed from the two street
centrelines at **29.05593 N, 95.56016 W**. The Portal's gazetteer coordinate for "Old Brazoria" is
**29.055530, −95.565220** (S16) — **440 m west-south-west of the Market/Main corner**, near the
middle of the grid. The two agree that the old town is where §7 puts it.

**The whole measured grid**, from Walnut Street to Milam Street and from Main Street to Velasco
Street, is about **2,870 ft along the river by 1,670 ft back** — **0.54 by 0.32 of a mile**.
Counting the streets, that is **seven columns by six rows: forty-two blocks.**

### 2.7 The one fragment of the plat's own numbering

The *Texas Republican* carried a curator's sale for five weeks in the spring of 1835, on order of
the Primary Judge of the jurisdiction of Columbia, of the estate of **D. W. Anthony** — the man who
printed the *Constitutional Advocate* on the Brazoria press until cholera killed him in 1833
(S17). Among the property: a quarter-league on the San Bernard, and

> **one block of Lots No. 41, and an out Lot No. 48, in the town of Brazoria**
> (S6, metapth80258, 2 May 1835; the same advertisement in four other issues)

**This is the only surviving statement of Brazoria's cadastre found anywhere, and it says three
things:**

1. **The plat numbered blocks (or lots) to at least 41.** The natural reading of "one block of
   lots, No. 41" is *Block 41*; the alternative reading is *lot 41*. **§6, I-5 takes the first**,
   and a forty-two-block grid (§2.6) is a startling fit — but the fit is arithmetic, not evidence.
2. **The plat had out-lots, numbered to at least 48.** An out-lot is a larger parcel outside the
   town blocks, for gardens, stock or corn. **This is the second town in the series to show them
   and the first to show one numbered** — Columbia's research found Bell "provided garden plots
   for new residents" and could not say where. **At Brazoria the out-lots are on the plat and
   numbered, and there are at least forty-eight of them.**
3. **Town lots were bought, sold, mortgaged and auctioned by number in 1835.** The sale took
   place *in the town of Brazoria* on 25 April 1835 — a public auction in the street, of a dead
   printer's block of lots.

**One more lot transaction, in the game's month.** L. C. Manson advertised from 19 September 1835,
running through October, the auction on the second Sunday in October of his household furniture
*together with the Dwelling House and two well improved Lots* (S6, metapth80272–80276). **Two lots
made one improved dwelling property.** No street is named.

---

## 3. Documented — the river, the landing and the ground

### 3.1 How far a sea-going vessel could get, and how

**This is the brief's second question and Brazoria answers it better than any town in the series.**

- **Thirty miles from the mouth by the river, fifteen by land** (S7). Brazoria is the first real
  port above the bar.
- **Sea-going schooners lay at the town.** The schooner *Brazoria* *"was anchored at Brazoria when
  preparations were being made"* for the Velasco expedition in June 1832 (S13, quoted). She then
  took forty men and the cannon down river.
- **And when the wind would not serve, they were towed.** On Tuesday 20 or 21 October 1835 the
  New Orleans Greys arrived at the mouth of the Brazos in the schooner *Columbus* and **were towed
  up to Brazoria** (S6, metapth80277). **A steamboat was working the lower Brazos in the game's
  month** — and the *Texas Republican* names one: the **steam boat *Laura***, from whose cabin a
  silver lever watch was stolen, advertised from 19 September 1835 (S6, metapth80274–80275).
  **This is the single most useful transport fact in the report and §7.7 turns it into an art
  correction.**
- **The bar at the mouth was the obstacle, not the river.** The Ayuntamiento of the jurisdiction
  of Columbia appointed a Branch Pilot for the Bar of the Brazos — **F. J. Haskins, of Velasco**,
  who advertised his rules all through 1835 (S6, metapth80267 onward): vessels boarded when
  prudent; **two white flags with a red ball** meaning it is safe to cross; **the Mexican flag at
  half mast** meaning it is not, and then no signals at all; a fire lit on the beach for vessels
  off the bar in bad weather; two substantial boats and a full crew. **Another flagstaff had been
  erected at the mouth of the Rio Brazos** because the bar was often too rough to board (S6,
  metapth80267). He resigned in January 1836 when the General Council cut the pilotage rates.
- **Above Brazoria, Bolivar was the head of tide water** — sixty miles from the mouth by water,
  and *any vessel that could pass the bar could ascend to it at the lowest stage of water, but not
  farther* (S7). **So Brazoria was comfortably inside the navigable reach, not at the end of it.**
- **Where the mouth was.** The Brazos was diverted to Freeport in 1929; the 1835 mouth was at
  **Velasco**, on the site of present Surfside Beach, with **Quintana** opposite (S-Velasco entry).
  **Do not draw the modern mouth.**

### 3.2 The landing, and the building over it

- **A steamboat landing existed by 1831** (S12, the 1831 trade list).
- **The Mills brothers' building stood at the corner of Market and Main and its back was built out
  over the river, serving as the steamboat landing** (S12). Andrew G. and Robert Mills were in
  business here before 1832; they ran a store, a bank, a postal service for the colony and the
  first insurance agency in Texas. **The *Texas Republican* confirms the firm in the game's
  month**: A. G. & R. Mills dissolved by mutual consent, the business to be carried on by
  **Robert Mills and David G. Mills as Robert Mills & Co.** (S6, metapth80254 onward).
- **The bank is steep and things had to be hauled up it.** S12, of a later house barged up from
  Velasco: *the house was pulled up the steep bank of the river by horse and mule.*
- **A warehouse of John Austin's stood at the mouth of the Brazos**, not at the town, and held
  three hundred and forty bales of seized leaf tobacco in 1830 (S8). **The Brazoria warehouses
  themselves are not described by anybody read** (§5.6).
- **What went out and what came in.** Edmund Andrews's advertisements through the autumn of 1835
  (S6, metapth80274, 80278) list what a lower-Brazos store shipped and stocked: **cotton bagging,
  bale rope, bales of brown domestic, Spanish cigars, boxes of brown sugar, coffee, burlaps for
  cotton-seed bags, Russia sheetings, white domestics, prints, powder, lead and shot**; also
  ready-made clothing, boots and shoes, superfine hats, bacon, sour flour, Madeira, claret and
  port. Goods came **per schooner from New Orleans and New York** — the *Shenandoah*, the
  *Elizabeth Jane*, the *Julius Caesar*.

### 3.3 The ground, measured — and why Holley and Edward contradict each other

USGS 3DEP (S11). **A transect across the river at the latitude of Jane Long's marker:**

| Position | Elevation |
| --- | --- |
| **Main Street (Jane Long's site)** | **23.8 ft** |
| 41 m toward the river | 13.7 ft |
| 75–115 m — **the water** | **1.0 ft** |
| 150 m — far bank rising | 17.7 ft |
| 190 m — top of the far bank | 23.0 ft |

**And a profile inland across the whole grid, from Main Street to the prairie:**

| Street | Elevation |
| --- | --- |
| **Main** | **23.8 ft** |
| Pearl | 23.6 ft |
| Austin | 23.0 ft |
| Camp | 24.5 ft |
| Travis | 25.6 ft |
| Marion | 25.9 ft |
| **Velasco** | **27.3 ft** |
| outer ground | 27.3 ft |
| **prairie, 1 km south-west** | **27.7 ft** |
| Masonic Oak | 28.2 ft |
| Old Brazoria Cemetery | 25.9 ft |
| New Town, 1912 | 24.3 ft |

**Four things follow and they settle a two-hundred-year-old disagreement.**

1. **The town falls toward its own river.** Velasco Street, the inland edge, is 27.3 ft; Main
   Street, on the bank, is 23.8 ft. **A 3.5-ft fall over 1,670 ft — about one in 480.** Gentle, but
   consistent, and it means **the riverfront street is the lowest street in town.**
2. **The cut bank is about 22 ft** from Main Street down to low water, and **the top of it is only
   about 130 ft from Main Street.** That is a very tight riverfront — barely one lot depth between
   the street and the drop, which is precisely why the Mills brothers built the back of their
   store out over the water instead of behind it.
3. **The water is 255 to 395 ft wide** here, at a stage where the surface reads 1 ft.
4. **Brazoria is ten to twelve feet lower than Columbia.** Columbia's capitol site measured
   **36.0 ft** and its prairie a mile west 29.8 ft; Brazoria's whole grid is **23 to 27 ft**, and
   the prairie behind it is *higher* than the town. **That is the number that decides everything
   else about this town.**

**Holley and Edward are both right and the ground says which is which.** Holley calls the site
*a wooded elevation of peach land… the most commanding and healthful* (S7) — true of the immediate
Brazos bottom, out of which the town rises. Edward writes of *"the lowness of its situation; being
subject to overflows in a particularly wet season"* (S8, quoted) — true of the river system, and
**true relative to Columbia, which took the courts away from Brazoria in 1834 on exactly that
argument.** The Columbia researcher found the reason printed there: Brazoria was declared damp,
sickly and swampy after the 1833 cholera and the courts moved to higher ground. **Ten feet of
elevation is the whole quarrel between these two towns, and USGS can now measure it.**

**And it is why the town moved in 1912** *"to escape floods"* (S5-Bridge, quoted). **Edward was
right by seventy-six years.**

### 3.4 What stood on the ground — timber, not prairie

**This is the largest single difference between Brazoria and every other town in this series.**

- Holley is explicit: Brazoria **is not located in a prairie**, where nothing was needed but to
  mark off its lines with compass and chain, but **upon a wooded elevation**; the site was chosen
  as the most commanding and healthful; and **it has therefore to dispute empire with the lords of
  the forest** (S7). **The plat was cut out of standing timber, and in 1836 the timber had not
  finished losing.**
- Edward calls the town's survival a matter of **clearing away and improving its widely spread
  timber bottoms** (S8).
- The county's bottoms carry **pin oak, cedar, live oak, mulberry, hackberry, ash, elm, cottonwood
  and pecan**, with deer, bear, turkey and fish (S2). The western third of the county is hardwood;
  the rest is prairie, and Brazoria is on the hardwood side of the river.
- **"Peach land"** is Holley's term for this soil — she uses it elsewhere of land clothed with
  heavy timber carrying peach and cane undergrowth.
- **The Masonic Oak is a real, dated, positioned tree** — the six men met under it on 1 March 1835
  (S5-Masonic Oak, S12), it still stands in Masonic Park, and §7.2 gives its coordinate in the
  town's frame. **It is the only object in Old Town Brazoria that was there in 1835.**

**So the drawing rule for Brazoria is the inverse of Columbia's:** Columbia sits on the edge of
open prairie with live oaks standing about it; **Brazoria sits in the woods, and its streets are
gaps cut through them.**

### 3.5 The country around it, and the roads

- **Twelve miles below Columbia on the same side of the Brazos** (S8) — about **7.8 miles in a
  straight line on bearing 140°** (computed here from S16 and the Columbia research's corrected
  coordinate), which is what "twelve miles" by a river road amounts to.
- **Mail route No. 4: San Felipe – Fort Bend – Orozimbo – Columbia – Brazoria – Velasco, 98 miles,
  weekly**, leaving San Felipe Sunday 7 a.m. and reaching Velasco Tuesday 6 p.m. (S7).
  **Brazoria is the last stop before the sea on the colony's main mail road.**
- **A new road west.** J. B. Cowan advertised all through 1835 (S6, metapth80266 onward) that a new
  road had been cut from his place to the San Bernardo crossing at his house, shortening the
  distance to **Cedar Lake by six miles**, with **a good ferry boat always at hand** for people
  going to or from Matagorda. **His wagon shop was at his plantation on the Bernardo, three miles
  from Brazoria**, where wagons were made and repaired on moderate terms. **That is a named,
  dated, positioned wheelwright three miles out of town, and the game has wagons.**
- **Near neighbours named in the record:** **Peach Point**, James F. Perry's plantation and the
  place Stephen F. Austin considered home, from which Austin answered the dinner invitation on
  4 September 1835 (S9, S12); **Eagle Island**, William H. Wharton's (S6, metapth80280);
  **Bailey's Prairie**, east of the river (S6, metapth80272); **Gulf Prairie**, where John Austin
  died (S3); **the San Bernard four miles west**, where Fannin lived (S12).
- **Plantations and cotton.** County cotton farms produced over 5,000 bales a year by the
  mid-1830s (S2). `HISTORY.md`'s representation limits apply to everything drawn from that: this
  was a slaveholding district, and the *Texas Republican* of 1835 is full of it — runaway
  advertisements naming Sterling, Joe and Richard; L. C. Manson selling a woman of forty and a boy
  of nine at the same auction as his house and lots; the Committee of Safety resolving that no
  enslaved person be found off his master's premises without a written permit. **None of that is
  decoration and none of it should be softened if this town is drawn.**

---

## 4. Documented and strongly supported — the buildings

**This is the best-attested October-1835 building list in the series, and the reason is simple:
the town printed a newspaper that month and the advertisements survive.** Everything below is
dated. Where a building is known only from S12's unfootnoted local history it is marked
**strongly supported**, not documented.

### 4.1 The buildings standing in October 1835

| Building | What is documented | Standing Oct 1835? | Position | Source |
| --- | --- | --- | --- | --- |
| **Jane Long's boarding house** | Bought from **W. T. Austin** in 1832 and kept by her for five years; a tavern before that; **the centre of Anglo political activity in the town**; the War Party met in it; an outbuilding hid the powder and the Velasco cannon in 1832; **she fed the New Orleans Greys in it on 21 October 1835** | **YES — and it is the one building in this report with a documented event inside it in the game's month** | **On Main Street.** The 1986 marker gives 29° 3.375′ N, 95° 33.637′ W — **x −190, y 16 in §7's frame, i.e. on Main Street two thirds of a block upstream of Market** | S4, S5-Long, S6 metapth80277, S12 |
| **The Mills brothers' store and bank** | Andrew G. and Robert Mills in business before 1832; store, bank, postal service, **the first insurance agency in Texas**; **the back of the building built over the river as a steamboat landing**; the firm reconstituted in 1835 as **Robert Mills & Co.** under Robert and David G. Mills | **YES** | **The corner of Market and Main** — the only stated corner in the town, and §7's origin | **S12 (strongly supported); the firm's existence in 1835 documented by S6** |
| **The Brazoria Hotel** | Advertised from 19 September 1835 and running through October: a first-rate cotton gin for sale, *apply to John P. Gill at the Brazoria Hotel*. **The Austin Papers' own index reads "Fitchett and Gill, hotel"**; the public dinner to Austin on 8 September 1835 was *at Messrs Fitchett and Gill, in this town*; the firm dissolved by early 1836 with Fitchett gone to Columbia and the Brazoria debts left to Edmund Andrews | **YES — the largest public room in the town** | **UNKNOWN** | **S6 metapth80272–80276, S9 (both documented)** |
| **The printing office of the *Texas Republican*** | The press stood in this town from April 1832; **F. C. Gray printed and published the paper here every Saturday through October 1835**; the office took advertisements, lost-property notices ("apply at this office") and job work; the paper went from three columns to five on 14 November 1835 | **YES — and Brazoria is the only town in this series with a working press in October 1835** | **UNKNOWN** | S6, S17, S18 |
| **Edmund Andrews's store** | Groceries, dry goods, clothing, boots, hats, wines, bacon, flour, powder, lead, shot, cotton bagging and bale rope, landed per schooner from New Orleans and New York; **also agent for the New Orleans insurance companies**; a member of the committee that invited Austin to dinner; the man left to settle Fitchett & Gill's Brazoria debts in 1836 | **YES** | **UNKNOWN** | S6 (many issues), S9 |
| **Bennett & Sharp's store** | Theodore Bennett and John Sharp, **having bought the entire stock of merchandize formerly belonging to Mr Sterling McNeel**; dry goods, groceries, hardware, crockery, medicines; Brazoria, 3 June 1835. John Sharp was still the town's newspaper agent in 1836 | **YES** | **UNKNOWN** | S6 metapth80266–80267, 80280 |
| **L. C. Manson's store and dwelling** | Fresh superfine flour, canvassed hams, mess pork and beef, sugar, coffee, cognac brandy, lemon syrup; **and in September 1835 his dwelling house and two well improved lots advertised for auction on the second Sunday in October** | **YES** | **UNKNOWN; two lots** | S6 metapth80267, 80272–80276 |
| **Dr Anson Jones's office** | Jones *respectfully informs the public that he has associated his cousin Dr Ira Jones with himself*, Brazoria, 25 July 1835. Jones was one of the six under the Masonic Oak in March 1835 and was elected Master of Holland Lodge in December | **YES** | **UNKNOWN** | S6 metapth80267, S5-Masonic Oak |
| **Dr E. Harris's office** | Located himself permanently for the practice of medicine, surgery &c; **"his office is next door to Mr. John Chaffin"** | **YES** | **relative only — next door to John Chaffin's**, and the advertisement's own town line is ambiguous between Brazoria and Columbia in the OCR. **Treat as Columbia unless the printed sheet says otherwise** | S6 metapth80263 onward |
| **Doctors Wm. Erwin and Arthur/A. N. B—— ** | Two more physicians advertising as *having located in Brazoria*, offering professional services to the citizens and inhabitants of Texas, through the whole autumn | **YES** | **UNKNOWN** | S6 metapth80266 onward |
| **Charles Kneass, portrait painter** | *Terms for painting portraits, $12 and upwards. Likeness warranted.* Brazoria, 13 July 1835; he waited on sitters at their residences | **YES — a portrait painter, in a town of this size** | **UNKNOWN** | S6 metapth80266 |
| **The courthouse** | **Not a court of the jurisdiction in 1835** (§2.3) — but S12 says the Masons *"secured a meeting room in the courthouse"* by December 1835 and elected Anson Jones Master there on 27 December. **A municipal building survives from Brazoria's 1832–34 spell as the capital of its own municipality**, and "Brazoria Courthouse Square" is an interpretive stop in Old Town | **probable, as a building; NOT as a seat of justice** | **UNKNOWN**; a "Courthouse Square" exists in Old Town and was not located here | S12 (strongly supported), S2 |
| **The Old Brazoria Cemetery** | *Site given to Brazoria in 1827 by government of Mexico as cemetery for Catholics*, open to all residents; full by 1930 | **YES — it predates the town** | **x −571, y 866** (marker) — inside the grid, at about Camp × Star | S5-Cemetery |
| **The Masonic Oak** | Six men — **Anson Jones, John A. Wharton, Asa Brigham, James A. E. Phelps, Alexander Russell and J. P. Caldwell** — met beneath it on **1 March 1835** to petition the Grand Lodge of Louisiana. Secret, because the order was outlawed | **YES — the only surviving physical object** | **x −2201, y 2188** — 0.59 mi south-west of Market × Main | S2, S5-Masonic Oak, S12 |
| **J. B. Cowan's wagon shop** | *His shop is at his plantation on the Bernardo, three miles from Brazoria, where wagons will be made and repaired on moderate terms*; also the new road and the ferry | **YES** | **three miles out, on the San Bernard** | S6, many issues |
| **The tannery** | On the 1831 trade list, **"a bit downwind of town"** | probable | **UNKNOWN, but downwind** | S12 (strongly supported) |
| **The 1831 trades** | A blacksmith, a gunsmith, carpenters, masons, two doctors, several lawyers, a shoe cobbler, a boot and saddle cobbler, a weaver, **two general mercantile stores**, a hardware store, a steamboat landing | 1831; by 1835 the two stores have become at least three | **UNKNOWN** | S12 (strongly supported), S7 |

### 4.2 The two events inside buildings, dated

**Both are in or beside the game's month and both have a named room.**

- **Tuesday 8 September 1835 — the public dinner to Stephen F. Austin, at Fitchett & Gill's.** At
  a meeting of the citizens of Brazoria on **Friday 4 September**, Col. Gowin Harris in the chair
  and Robert J. Calder secretary, it was resolved to invite Austin to dine. A committee of ten was
  named: **Edmund Andrews, Benjamin F. Smith, John W. Cloud, Gowin Harris, Theodore Bennett,
  Robert J. Calder, James F. Caldwell, Samuel Fuller, Sterling McNeel** and one more. Austin
  answered from **Peach Point on 4 September**. The company sat down *"at Messrs Fitchett and Gill,
  in this town"* (S9, quoted), the toasts were drunk, Austin was hailed as founder, and he rose and
  made the speech that declared for war — the meeting TSHA records as the moment *"Texans began to
  prepare for a revolution"* (S2). **The *Texas Republican* printed the whole proceeding on
  19 September** and grumbled in the same column that calling Austin "the angel of mercy" was
  absurd and ridiculous. **The most important room in the lower Brazos in September 1835 was the
  dining room of the Brazoria Hotel.**
- **Tuesday 20 or 21 October 1835 — the New Orleans Greys at Mrs Long's.** The schooner *Columbus*
  reached the mouth and **the company was towed up to Brazoria**. They were received and provided
  for as amply as *"the present deserted condition of the town and country"* would permit (S6,
  metapth80277, quoted). **Immediately on arrival they were invited to a treat at her own dwelling
  by a lady whose fortune had been spent and whose husband's life had been given for the country**
  — the paper then names her: **Mrs Long**. Flowers were strewn at their feet; **Mrs Cox, Mrs
  Scott and Mrs Splan** offered toasts; the company withdrew to a second repast prepared by the
  citizens; **they stayed nearly two days procuring horses and arranging transport for their
  provisions and arms, and then marched for San Antonio.** **That is a dated, located, populated
  scene inside a building this report can place on a street.**

### 4.3 What was NOT there in October 1835 — the list to hold the line on

**The same discipline the Columbia and Washington reports used, and Brazoria needs it more,
because its reputation is all about things that happened before and after.**

| Thing | Why not | Source |
| --- | --- | --- |
| **Any church, of any denomination** | The Presbyterians were "active since the 1830s" but worshipped with the Episcopalians and Methodists in the **Union Church, built around 1853**; the First Presbyterian Church was organised in **1913**. **No church building existed in Brazoria in 1835** — the same negative as Columbia and Washington | S5-Presbyterian |
| **A county courthouse** | **Brazoria County did not exist.** It was created 24 March 1836 and Brazoria became its seat on 20 December 1836. The grand J. Riley Gordon courthouse is **1897**, and it was dynamited in 1934 | S2, S12 |
| **A seat of government of any kind** | The municipality was renamed **Columbia** in 1834 and the seat moved there. In October 1835 Brazoria is a precinct of the jurisdiction of Columbia | S2, S6 |
| **A Masonic lodge hall** | The lodge was only **petitioned for** under an oak on 1 March 1835, secretly. It had no room until **December 1835**, in the courthouse, and its charter arrived in 1836 | S5-Masonic Oak, S12 |
| **The *Telegraph and Texas Register*** | Founded at **San Felipe, 10 October 1835**. It never printed at Brazoria | Columbia research, S7 |
| **A steam sawmill, or a lumber yard** | Lumber came from the **Harrisburg Steam Mills** at **twenty-five dollars per thousand, delivered at the mills** — advertised in this paper all autumn. **Every sawn board at Brazoria came by water** | S6 metapth80267 onward, S7 |
| **A sugar mill, or sugar** | Sugar is the county's post-1840s crop; in 1835 it is cotton | S2 |
| **A post office** | Established **1846**. In 1835 mail came weekly on route No. 4, and before that the **Mills brothers ran a private postal service** for the colony | S1, S7, S12 |
| **A custom house at the town** | TSHA says customhouses were "located at Brazoria and Velasco" during the immigration period (S2), but **every customs and pilotage notice in the 1835 paper is datelined Velasco or the mouth**, and the pilot was Velasco's. **Do not draw a custom house at Brazoria without better evidence** | S2 vs S6 |
| **A bridge, or a railroad** | The first bridge across the Brazos here was **1912**; the present one 1939. The railway came about 1905 | S5-Bridge, S12 |
| **"New Town"** | 1912. Every state-named street is twentieth century | S5-Bridge |
| **A school** | H. M. Shaw opened a school at Brazoria in **April 1838**. Miss Trask's boarding school, advertised weekly in this paper all through 1835, was **at Coles' Settlement**, and its Brazoria reference was **James F. Perry** at Peach Point | S1, S6 |
| **John Austin, alive** | Died of cholera **11 August 1833**. His home site carries a 1936 marker; **who lived in the house in 1835 is unknown** | S3, S5-Austin |

### 4.4 What the buildings were made of

**Weaker here than at Columbia, and the reason is that nobody read describes a single Brazoria
building's fabric.** What can be said:

- **Log is the default.** The county and the colony are the same as Columbia's, where most people
  lived in log cabins or log houses and the dog-run was the prosperous form.
- **Sawn plank existed and was imported.** Two independent proofs: the militia made **three
  portable barricades of two-inch pine plank, 4 ft high and about 20 ft long**, at two days'
  notice in June 1832 (S14) — **there were no pines on the lower Brazos, so that plank came up the
  river**; and the Harrisburg steam mills were selling at $25 per thousand, delivered at the mills,
  in 1835 (S6). **The same conclusion the Columbia research reached, from different evidence.**
- **A two-storey or otherwise substantial commercial building is implied but not described.** A
  store whose back is built out over a 22-ft river bank on piles is not a log cabin. **No storey
  count, no dimension, no roof and no chimney is recorded for any Brazoria building.**
- **Brick is unattested here.** Columbia's excavation found a hand-made brick cistern; nothing
  comparable is recorded at Brazoria.
- **The rule for 1835 Brazoria:** log for dwellings; frame and weatherboard for the stores, the
  hotel and the printing office; imported sawn plank and shingle for anything better; a plank
  landing stage and piles at the water; rail fence for stock; **and no brick unless the museum
  produces some.**

### 4.5 How big the place was in 1835 — and what to make of TSHA's 500

**The brief asks this and it can now be tested from four directions.**

| Year | Figure | What it measures | Source |
| --- | --- | --- | --- |
| 1831 | **fifty families** | **the town** | **S7 (Holley)** |
| 1831 | a blacksmith, a gunsmith, carpenters, masons, two doctors, several lawyers, two cobblers, a weaver, a tannery, **two general stores**, a hardware store, a steamboat landing | **the town's trades** | S12 |
| **1834** | **Brazoria 500; Velasco 100; Bolivar 50 — the county's largest settlements, and Columbia is not in the list** | **the towns** | **S2 (TSHA)** |
| 1834 | 2,100 | **the municipality** (renamed Columbia) — already `HIST-TEX-011` | S2 |
| **25 Sep 1835** | **64 votes polled at Brazoria** | **the precinct** | **S6 metapth80272** |
| **25 Sep + 5 Oct 1835** | **104 for the leading candidate; 96, 88, 83, 74, 73** | **the whole number taken at Brazoria over both days** | **S9 (Austin Papers)** |
| **Oct 1835** | *"the present deserted condition of the town and country"* | **the town, in the game's month** | **S6 metapth80277, quoted** |
| 1836 | **not many more families than fifty, though more houses** | **the town** | **S7 (Holley)** |
| 1840 | about 800 | the town | S2 |

**Reading down that column, TSHA's 500 survives — and it is a jurisdiction-flavoured 500.**

- **Fifty families in 1831 is the hard number**, and it is the only one taken by someone who went
  there. At six or seven souls to a household including enslaved people, fifty families is
  **300 to 350**. Add five years of a busy port and 500 by 1834 is entirely reasonable — **but
  Holley, writing in 1836 of the same town, says it has not many more families than it had in
  1831.** The population did not grow between 1831 and 1836; the number of **houses** did.
- **104 voters across two polling days in September and October 1835** is the other hard number,
  and it belongs to the precinct — the town and its vicinity, plantations included. A hundred
  voters implies a free adult male population of roughly that size, which fits a town-and-vicinity
  total in the 400–600 range.
- **So: Brazoria in October 1835 was a town of perhaps fifty to seventy households, with the
  largest settlement figure in its county, and it was half empty because the men had gone to
  Gonzales.** The paper says so in its own words. **`docs/COLONIES.md` should carry that last
  clause, because it is true of every lower-Brazos town in the game's month and the newspaper
  states it for this one.**

**Against Columbia, which the brief asks for explicitly:** Columbia in 1835 had a hotel, a
courthouse and offices, a store or two, a tavern and a few dwellings, standing in a grid platted
for a hundred and sixty lots — **about ninety per cent empty**. Brazoria in 1835 had **at least
four stores, a hotel, a printing office, four or five doctors, a portrait painter, a bank, an
insurance agency, a landing and fifty-odd families**. **Brazoria is unambiguously the bigger,
busier and older place, and the TSHA list is right.** What Columbia had that Brazoria did not was
ten feet of elevation and the courts.

### 4.6 What happened here in 1835

- **1 March 1835.** Six men meet under an oak south-west of the town and petition the Grand Lodge
  of Louisiana for a Masonic dispensation. **Holland Lodge, the first in Texas.** (S2, S5, S12)
- **June–August 1835.** Cos writes from Matamoros to the Ayuntamiento of the jurisdiction; the
  paper prints his letter late, for want of room, and remarks that the literal translation contains
  some very awkward sentences (S6, metapth80269).
- **Friday 4 September 1835.** The citizens of Brazoria meet; Gowin Harris chairman, Robert J.
  Calder secretary; resolutions of lively satisfaction at Austin's return (S6, metapth80271).
- **Tuesday 8 September 1835.** **The dinner at Fitchett & Gill's, and Austin's declaration**
  (§4.2). (S2, S6, S9)
- **Friday 20 September 1835.** The **Committee of Safety and Correspondence for the jurisdiction
  of Columbia meets in the town of Brazoria** — Branch T. Archer chairman, William T. Austin
  secretary, with W. D. C. Hall, John A. Wharton and Francis Bingham. It resolves to encourage the
  citizens about to leave for the war, and that **four volunteer companies be raised in the
  jurisdiction: one at Columbia, one at Velasco, one at Brazoria, and one east of the Brazos above
  Bailey's Prairie.** (S6, metapth80272)
- **Friday 25 September 1835.** **Election for delegates to the Consultation, held at Brazoria;
  64 votes polled.** John A. Wharton, J. S. D. Byrom, Wm. H. Wharton, Henry Smith, B. T. Archer,
  W. D. C. Hall, Edwin Waller, P. W. Grayson, J. G. McNeel, James F. Perry lead. **The polls open
  again on 5 October.** (S6, metapth80272)
- **5 October 1835.** Second polling day. **The final Brazoria return, 104 at the top**, is in the
  Austin Papers (S9). The first company of militia of the jurisdiction is ordered to muster at
  **Columbia** on the same day with arms and accoutrements for inspection, John Chaffin 1st Lieut
  (S6, metapth80273).
- **5–6 October 1835.** **William H. Wharton, Agent for the Volunteers, publishes from Brazoria**:
  every person who cannot go and who withholds a horse or gun from those willing to go will be
  considered a traitor to his country; let no one stop for want of a horse; **"I will leave
  Brazoria for the Camp at Gonzales tomorrow"**; he expects upward of 600 volunteers at Gonzales
  within days; $5,000 for whoever kills or takes General Cos. (S6, metapth80274)
- **Mid-October 1835.** **Arrangements are making in Brazoria and Matagorda to send supplies,
  provisions and ammunition** to the army, and Columbia and San Felipe ought to do the same
  (S6, metapth80274). **This is the supply line the game's Gonzales arc is at the far end of.**
- **20–22 October 1835.** **The New Orleans Greys, towed up, fed at Mrs Long's, two days procuring
  horses, then the march for San Antonio** (§4.2).
- **Late October 1835.** An express from Velasco at night: the **Montezuma** off the mouth under
  the Mexican flag; many citizens mount and ride for the coast at midnight (S6, metapth80277).
- **Then, and this is the point:** the town empties. `HIST-` claims drawn from this section
  should carry **the deserted-condition line** with them.

---

## 5. Unknown — what a layout would need and no source read supplies

Everything here would have to be invented and registered as fiction.

1. **The 1828 plat sheet.** Its block count, its lot count and dimensions, its street widths, its
   street names, whether it carried a public square or any reserved ground, where the out-lots lay
   and how big they were. §2.4 recovers the module and the bearing; **it recovers nothing that was
   written on the sheet.**
2. **Whether any modern Old Town street name is an 1828 name.** *Main* and *Market* are attested
   by S12 as the Mills corner and nothing older confirms them; *Velasco*, *Marion*, *Camp*,
   *Austin*, *Pearl*, *China*, *Star*, *Liberty*, *Milam* are all plausible 1828 names and none is
   attested; ***Travis* cannot be an 1828 name** and is almost certainly post-1836. **No Brazoria
   street name appears in any 1835 document read** — and that is not for want of looking: thirty-
   four issues of the town's own newspaper carry **no street address at all**. The nearest thing
   is *"his office is next door to Mr. John Chaffin"*. **The town was small enough that nobody
   needed a street.**
3. **Any block, lot or street dimension.** §2.4–§2.5 are measurements off modern centrelines.
4. **Whether Brazoria had a public square.** S12's interpretive walk includes a **"Brazoria
   Courthouse Square"**, which implies one — but the courthouse it is named for is the **1897**
   building, and nothing read says a square was on the 1828 plat. **The square is the single most
   valuable thing the county deed records could confirm.**
5. **Where the courthouse / municipal building of 1832–35 stood**, and whether "Courthouse Square"
   is its ground.
6. **Where any warehouse stood, and what the landing looked like** beyond "the back of the
   building was built over the river".
7. **Where the Brazoria Hotel stood.** The largest public room in the town, the site of the most
   consequential dinner in Texas in 1835, **and there is no location for it in anything read.**
   **This is the single most valuable missing position** — the same sentence the Columbia research
   had to write about Bell's hotel.
8. **Where the printing office stood.**
9. **Where any store stood** — Andrews's, Bennett & Sharp's, Manson's.
10. **Which lot Jane Long's house stood on**, how big the house was, how many rooms, and what the
    outbuilding that hid the cannon looked like. **The 1986 marker gives a point and nothing else.**
11. **The 1835 bank line of the Brazos**, and whether a street ran between Main Street and the
    bank that has since been lost. **Columbia lost exactly such a street at Marion; Brazoria's
    bank has not been shown to have moved, but nothing read establishes that it has not.**
12. **The number of houses.** Fifty families in 1831 (S7) is the closest anyone comes, and a
    family is not a house.
13. **Any dimension of any Brazoria building.** Not one, anywhere.
14. **Who held which lot**, beyond D. W. Anthony's block 41 and out-lot 48 and L. C. Manson's two.
15. **Whether the town was burned in 1836, and how much.** The 1964 marker says burned by the
    enemy; the 1991 marker says partially burned; **S12 says the Mexican forces marched through on
    22 April 1836 and spared most of the town**, destroying only the Masonic records. **All three
    cannot be right.** It does not affect an October-1835 drawing, but it governs what may be shown
    surviving.

---

## 6. Inferred — things that follow but that nobody states

Each is an inference of this document and must be labelled as one if it is used.

- **I-1. The modern Old Town street grid is John Austin's 1828 grid.** The load-bearing inference,
  and it is better supported here than at Columbia. Supporting it: **Holley's sentence and the
  surviving grid describe the same plan** (§2.2, §2.4); the grid is **square to 0.6°** on a
  module that hits **100 varas to 0.2 % six intervals running**; the streets are named Main and
  Market and a local history puts the town's 1831 firm on that corner; **the 1827 cemetery is
  inside the grid**; and the grid is 45° off the 1912 town beside it, so it cannot be a product of
  the 1912 replatting. **Nobody says the town was never re-platted.** If this is wrong, §7.2 is
  wrong.
- **I-2. The 1828 plat was six blocks deep from the river and about seven blocks along it —
  forty-two blocks.** From: the 100-vara run ending cleanly at **Velasco Street**, the looser and
  differently-spaced streets beyond it, the grid's extent from Walnut to Milam, and the
  **"block of Lots No. 41"** in the 1835 advertisement. **The arithmetic fits and nobody states
  any of it.** A 42-block plat is also within the range of a single surveyor's day's work with
  compass and chain, which is Holley's phrase for what was *not* needed here.
- **I-3. The streets were 20 varas wide and the blocks 80 varas square.** The module is measured;
  the split between street and block is not. 20 varas is what Mina's surveyor was instructed to
  use and what four of five Columbia Sanborn readings show. **Nobody states a Brazoria street
  width.**
- **I-4. A Brazoria lot is about 40 × 20 varas, eight to a block.** By analogy with Columbia's
  documented eight-lot block, divided into an 80-vara block. **Nobody says it**, and L. C. Manson's
  *dwelling house and two well improved lots* is the only hint of what a lot bought you.
- **I-5. "One block of Lots No. 41" means Block 41.** The alternative reading — lot 41 — is
  grammatically possible and would destroy I-2. **The advertisement is the only evidence and it
  was set by a compositor in a hurry.**
- **I-6. Main Street was the "one street along the banks of the Brazos" and Market Street ran down
  to the landing.** From Holley's sentence, the Mills corner, the 22-ft bank measured 130 ft off
  Main, and the fact that the river converges on the grid at and below Market Street and swings
  away above it (§7.4). **Nobody names either street in an 1830s document.**
- **I-7. The built town of 1835 clustered on Main Street around Market Street**, three or four
  blocks along the water and one or two back — because that is where the landing, the store, the
  hotel's likely site and Jane Long's house are, and because Holley describes a town two streets
  deep in 1831. **Nobody says the rest of the grid was empty**, but a town of fifty families on
  forty-two blocks cannot have filled them.
- **I-8. Brazoria in October 1835 held perhaps 45 to 70 buildings**, more than any other town in
  this series except Béxar — reasoned in §4.5 from fifty families, more houses than families, at
  least four stores, a hotel, a printing office, four physicians' offices and the outbuildings
  every household had. **Nobody counts Brazoria's houses.** **This is the crucial difference from
  Columbia: a Brazoria drawn as a nearly empty grid would be as wrong as a Columbia drawn full.**
- **I-9. The streets still had trees standing in them.** From Holley's *disputing empire with the
  lords of the forest* and Edward's *widely spread timber bottoms*. **Nobody says a tree stood in
  a Brazoria street**; both say the town was cut out of timber and that clearing was unfinished.
- **I-10. Sawn lumber at Brazoria came up the river, most likely from Harrisburg.** The mills are
  advertised in this town's own paper with a price and a delivery term; the pine plank of 1832 had
  to come from somewhere; there is no pine on the lower Brazos. **The join is this document's, as
  it was the Columbia researcher's.**
- **I-11. The old grid's riverfront has not moved much.** Main Street still runs 130 ft from the
  top of a 22-ft bank on the inside of a gentle bend. **Columbia's Front Street at Marion is in the
  river; Brazoria's Main Street is not.** But no source read states an 1835 bank line, and a
  century of the lower Brazos is not nothing. **Draw the bank and say it is modern.**

---

## 7. A suggested layout sketch

In the terms of `public/bexar-layout.js`: feet, a local plane, a river line with a width, roads
with widths, buildings placed in local feet with a height and a sprite name.

**Read this first.** **The frame is the most solid in the series and the contents are the
thinnest.** The bearing, the module, every Old Town street position, the river course, the bank
height and the water width are measured. **One building corner is documented and one building
point is marked.** Everything else — every footprint, every height, the count of houses, the block
and lot subdivision, the street widths, the square — is invented. Items marked `INVENTED` are
invented; if this is built it should be registered as fiction under a new `FIC-` ID with a `note`
in the spirit of the one at the foot of `BEXAR_LAYOUT`.

### 7.1 Frame

| Thing | Value | Status |
| --- | --- | --- |
| Units | feet; 1 vara = 2.7778 ft (33⅓ in) | conversion, fixed |
| Plane | **grid-aligned**: `+x` runs along Main Street **downstream**, bearing **S 46.3° E**; `+y` runs **inland**, bearing **S 43.7° W**, away from the river | choice of frame |
| True bearing | rotate the plane so `+x` bears **133.7°** | **measured** (§2.4) |
| Module | **278 ft** | **measured**, six consecutive intervals (§2.4) |
| In varas | **100 varas** (277.78 ft) — **0.2 % off** | **measured** |
| Block | **222 ft** square | module minus a 20-vara street; `I-3` |
| Street width | **55.6 ft (20 varas)** | `I-3` — **nothing read states one** |
| Lot | **111 × 55 ft**, eight to a block | `I-4` |
| Origin | **Market Street × Main Street**, the Mills brothers' corner — **29.05593 N, 95.56016 W** | **computed from two measured centrelines**; the corner itself is S12 |
| Bounds | `{x:-3600, y:-1400, width:7400, height:5200}` — enough to hold the grid, the river and the Masonic Oak | frame choice |

### 7.2 Streets of Old Town Brazoria

**Every position is measured from OSM centrelines (S10) in the frame above.** The names are
modern; only *Main* and *Market* have any attestation before 1900, and that is S12's (§5.2).

**Running along `+x` (with the river) — listed by `y`, distance inland from Main Street.**

| Street | y (ft) | note |
| --- | --- | --- |
| **Main Street** (Old Main) | **0** | **the river street; 130 ft from the top of a 22-ft bank** |
| Pearl Street | 282 | |
| Austin Street | 561 | |
| Camp Street | 840 | |
| Travis Street | 1119 | **cannot be an 1828 name** |
| Marion Street | 1391 | |
| **Velasco Street** | **1670** | **the inland edge of the 100-vara run — `I-2` makes it the back of the plat** |
| Yerby Street | 2001 | outside the run |
| Willis Street | 2336 | outside |
| Bell Street | 2474 | outside |
| Burnett Street | 2818 | outside |
| Henderson Street | 3366 | outside |

**Running along `+y` (down to the river) — listed by `x`, downstream positive.**

| Street | x (ft) | note |
| --- | --- | --- |
| Walnut / Gaines Street | −1148 | |
| Chestnut Street | −882 | |
| Star / Spencer Street | −591 | |
| China Street | −325 | |
| **Market Street** | **0** | **the street to the landing** |
| Liberty Street | +541 | exactly two modules |
| Cherry Street | +935 | |
| Milam Street | +1722 | |

**The 100-vara core occupies `x` −1148 → +935 and `y` 0 → 1670** — about **2,080 × 1,670 ft**,
seven columns by six rows. `I-2`.

**Measured marker positions in this frame** (these are the anchors):

```
jane-long-boarding-house  x -190,  y   16   // 1986 THC marker, "on this site"; ON MAIN STREET
brazoria-townsite-marker  x   16,  y 1043   // 1964; Market St near Travis
old-brazoria-cemetery     x -571,  y  866   // given 1827 — PREDATES the town
barrett-grave             x -420,  y 1001   // inside the cemetery
john-austin-home-site     x -1217, y 1407   // 1936 Centennial plate; SEE CAUTION BELOW
masonic-oak               x -2201, y 2188   // 1 March 1835 — the ONLY surviving 1835 object
brazoria-bridge-1939      x  558,  y -1191  // out over the river; NOT 1835
```

**Caution on the John Austin marker.** hmdb describes it as standing at the intersection of *West
Velasco Street and Marion Street* — **two streets that are parallel and cannot intersect** (§2.4).
It is a **1936 Centennial plate**, the class placed at convenient roadsides rather than on sites,
and it sits at the far upstream-inland corner of the grid, which is a strange lot for the town's
founder. **Use the coordinate as the marker's position, not as John Austin's house.**

### 7.3 The roads out

```
// All three MEASURED only as far as their first mile; the courses beyond are INVENTED.
roads: [
  { id:'road-to-columbia', label:'The road to Columbia, twelve miles',
    from:{x:0,y:1670}, bearingDeg:315 /* upstream and inland, toward W Columbia at 7.8 mi / 140° reversed */,
    widthFeet:40 /* INVENTED */ },
  { id:'road-to-velasco', label:'The road to Velasco, fifteen miles',
    from:{x:935,y:1670}, bearingDeg:150 /* INVENTED bearing; Holley gives 15 miles by land */,
    widthFeet:40 /* INVENTED */ },
  { id:'road-to-san-bernard', label:'Cowan’s new road to the Bernardo crossing and Cedar Lake',
    from:{x:-1148,y:1670}, bearingDeg:250 /* INVENTED */, widthFeet:30,
    note:'three miles to Cowan’s wagon shop and ferry (S6)' } ]
```

**Mail route No. 4 comes in from Columbia and goes out to Velasco, weekly** (S7). **That is the
road a student arrives on, and it is the same road `docs/COLONIES.md` already runs to Columbia.**

### 7.4 The water and the bank

```
// The Brazos at Brazoria. The MODERN centreline (S10), in the frame of §7.1.
// Real geometry, wrong century (§6, I-11). Width MEASURED at one transect only.
river: { id:'brazos', label:'Brazos River',
  widthFeet:320 /* MEASURED 255–395 ft at one transect (S11); varies */,
  centre:[
  {x:-3300,y:-1758},{x:-3050,y:-1814},{x:-2785,y:-1841},{x:-2552,y:-1804},{x:-2322,y:-1709},
  {x:-2060,y:-1562},{x:-1824,y:-1388},{x:-1437,y:-1060},{x:-1161,y:-830},{x:-840,y:-587},
  {x:-600,y:-443},{x:-236,y:-335},{x:98,y:-253},{x:433,y:-164},{x:817,y:-184},{x:1220,y:-207},
  {x:1512,y:-262},{x:1847,y:-354},{x:2257,y:-486},{x:2716,y:-617},{x:3024,y:-768} ] }

// The cut bank. MEASURED at one transect; the line between transects is INTERPOLATED.
bank: { id:'brazoria-bank', heightFeet:22 /* MEASURED: 23.8 ft at Main, 1.0 ft at the water */,
  topOffsetFeet:130 /* MEASURED at the Jane Long transect: the drop begins 130 ft off Main */,
  note:'the top of the bank runs roughly parallel to Main Street from Market downstream, and
        falls away from it upstream' }

landing: { id:'brazoria-landing', x:40, y:-100,   // POSITION INVENTED, between Main and the bank
  label:'The steamboat landing at the back of the Mills store (S12)' }
```

**Five rules for drawing this water, all documented:**

1. **The river runs with the grid, not across it.** The Brazos beside the town bears 133°–140°;
   the plat bears 133.7°. **Main Street and the river are parallel, and that is why the plan
   works.** No other town in this series has that.
2. **The riverfront is at Market Street and downstream.** Above Market the channel swings away
   north-east — at 3,300 ft upstream it is 1,760 ft off Main. **The town's water frontage is
   short and the landing is at the short end of it.**
3. **A sea-going schooner ties up here** (S13), and **a steamboat tows her up from the mouth**
   (S6). **Both, in the same picture, is the defining image of this town.**
4. **The bank is 22 ft and things get hauled up it by horse and mule** (S11, S12). **Draw the
   bank; the town is up on top of it and the water is not visible from Pearl Street.**
5. **Cotton bagging and bale rope go down; prints, powder, lead, shot, sugar, coffee, Madeira and
   ready-made hats come up.** Both sides are in Edmund Andrews's advertisements (§3.2).

### 7.5 The built town

Draw **a short, dense frontage on Main Street on either side of Market, thinning fast, with the
back four fifths of the grid in stumps, garden plots, timber and fence** (`I-7`, `I-8`, `I-9`).

| id | Building | What is documented | sprite | x, y | heightFeet |
| --- | --- | --- | --- | --- | --- |
| `brz-mills-store` | **The Mills brothers' store, bank, post and insurance office** — its back built out over the river as the steamboat landing | **the corner of Market and Main** (S12); **the firm in business in 1835** (S6) | *none — stand-in, §7.7* | **0, 0** — the origin; **which of the four corners is `INVENTED`** | 26 |
| `brz-long-boarding-house` | **Jane Long's boarding house** — bought from W. T. Austin in 1832, kept to 1837; the War Party's meeting place; **the New Orleans Greys fed here 21 Oct 1835** | **on Main Street; marker coordinate** (S4, S5, S6, S12) | `frame-hall` *stand-in* | **−190, 16** (measured from the marker) | 24 |
| `brz-long-outbuilding` | **The outbuilding that hid the powder and the cannon in 1832** | **strongly supported** (S12) | `storehouse` | behind the house `INVENTED` | 12 |
| `brz-hotel` | **The Brazoria Hotel, Fitchett & Gill** — where Austin dined on 8 September 1835 | **exists Sept–Oct 1835; no location** (§5.7) | `frame-hall` | 300, 20 `INVENTED` | 28 |
| `brz-printing-office` | **The office of the *Texas Republican*, F. C. Gray** — a hand press, cases of type, a composing stone, a stack of four-page sheets | **exists and prints weekly; no location** | *none — stand-in, §7.7* | −450, 30 `INVENTED` | 20 |
| `brz-andrews-store` | **Edmund Andrews's store and insurance agency** | **exists; no location** | `trading-house` | 160, 300 `INVENTED` | 22 |
| `brz-bennett-sharp-store` | **Bennett & Sharp's store**, ex-Sterling McNeel | **exists; no location** | `trading-house` | −330, 290 `INVENTED` | 22 |
| `brz-manson-store` | **L. C. Manson's store**, with a dwelling house and two improved lots for sale | **exists; no location** | `timber-shop` | 480, 290 `INVENTED` | 20 |
| `brz-warehouse-*` | **Warehouses on the bank** | **a port with a landing must have them; none described** (§5.6) | `storehouse` | between Main and the bank, `x` −300…+600 `INVENTED` | 18–26 |
| `brz-doctor-*` | **Four physicians' offices** — Anson Jones & Ira Jones, Erwin, and one more | **all advertising in Oct 1835; no locations** | `cabin-small` | scattered on Main and Pearl `INVENTED` | 16 |
| `brz-courthouse` | **The municipal building of 1832–34**, with a room the Masons used from December 1835 | **strongly supported** (S12); **NOT a court of the jurisdiction in 1835** (§2.3) | `timber-hall` | 270, 560 `INVENTED` | 24 |
| `brz-house-*` | **Fifty-odd dwellings** | **fifty families in 1831, more houses by 1836** (S7); the count is `I-8` | `house-dog-run`, `house-hewn-log`, `house-round-log`, `cabin-wide`, `cabin-weathered` | Main, Pearl, Austin and Market `INVENTED` | 16–24 |
| `brz-outbuilding-*` | kitchen, smoke house, stable, corn crib, stock lot behind each house | the colony's standard yard | `shed-open`, `storehouse`, `fence-rail` | behind the dwellings | 10–16 |
| `brz-cemetery` | **The Catholic burying ground, given 1827** | **documented; marker position** | `fence-rail` + grave markers | **−571, 866** | — |
| `brz-masonic-oak` | **The Masonic Oak** — six men, 1 March 1835, in secret | **documented; marker position; the tree still stands** | `live-oak-large` | **−2201, 2188** | — |
| `brz-outlots` | **The out-lots, numbered to at least 48** | **documented by the 1835 advertisement** (§2.7); **position, size and shape all UNKNOWN** | `fence-rail` + crop sprites | beyond Velasco Street `INVENTED` | — |
| `brz-cowan-shop` | **J. B. Cowan's wagon shop and ferry** | **three miles out on the Bernardo** (S6) | `timber-shop` + `ferry-raft` | three miles WSW `INVENTED bearing` | 18 |

**How many.** `UNKNOWN` (§5.12). A defensible invented figure is **forty-five to seventy buildings
at Brazoria in October 1835**, reasoned in §4.5 and §6 `I-8`. **That reasoning is this document's
and the numbers are invented.** Mark them.

**How to place them.** **Put roughly half the buildings on the four blocks that touch Main Street
between China and Liberty**, a quarter on Pearl and Market, and scatter the rest. **Leave
everything beyond Camp Street to garden plots, stumps and standing timber.** Repeatable arithmetic
only, never `Math.random()`, as `bexar-layout.js` does.

**And then empty it.** **In the game's month this town is half deserted** — the paper says so
(§4.5). The men are at Gonzales or on the road to Béxar. **If Brazoria is ever drawn populated,
draw women, children, enslaved people, the printer, the doctors and the storekeepers, and very
few free adult men.** That is documented, it is unusual, and it is the thing a student should
notice.

**What makes this town look different from the other eight, in one line each:**
**a straight grid lying square along a river instead of square to the compass**; **a town standing
in its own timber, with trees not yet cleared out of the streets**; **a 22-foot cut bank 130 feet
from the main street, with a store built out over the water**; **a masted schooner under tow by a
steamboat**; **a printing press working**; **no church, no square, no courthouse of justice and no
fort**; **and half the men gone.**

### 7.6 What must be drawn *around* the town

- **Timber on every side** — hardwood bottom: pin oak, live oak, cedar, mulberry, hackberry, ash,
  elm, cottonwood, pecan (S2), with peach and cane undergrowth (S7). **No pines.**
- **The Brazos bending past the town**, with cotton bales on the bank and a schooner against it.
- **Cotton fields and plantations on every side** — Peach Point, Eagle Island, Bailey's Prairie,
  Gulf Prairie, the San Bernard plantations. `HISTORY.md`'s representation limits apply.
- **The San Bernard three or four miles west**, with Cowan's crossing, ferry and wagon shop.
- **The road to Columbia twelve miles north-west and the road to Velasco fifteen miles south**,
  both on mail route No. 4.
- **Deer, bear and turkey in the county's bottoms** (S2) — as at Columbia, directly usable by
  `docs/WOODS_AND_BUILDING.md`'s hunting, and at Brazoria the timber comes right to the town.

### 7.7 Art gaps this sketch creates

Checked against `public/assets/frontier-v1/atlas.json`, which holds **767 frames**, and against
the art sections of the eight earlier reports. **The standing practice is to raise the priority of
an existing request rather than duplicate it, and most of Brazoria's needs are already asked for.**

**Already covered — do not raise a request for these:**

- **`wharf`**, **`skiff`**, **`ferry-raft`**, **`storehouse`**, **`trading-house`**,
  **`frame-hall`**, **`timber-hall`**, **`timber-shop`**, **`shed-open`** exist.
- **`house-dog-run`** with `-site` / `-walls` / `-roofing`, **`house-hewn-log`**,
  **`house-round-log`**, **`cabin-small`**, **`cabin-wide`**, **`cabin-weathered`**,
  **`house-shed-room`**, **`house-porch`**, **`house-chimney-stick`**, **`house-chimney-stone`**,
  **`house-passage-floor`**, **`house-passage-roof`** exist.
- **`live-oak-large` / `-log` / `-pole`**, **`oak-broad`**, **`oak-spreading`**, **`pecan`**,
  **`elm-*`**, **`cedar-*`**, **`cottonwood`**, and the stumps — **`stump-post-oak`**,
  **`stump-hollow-oak`**, **`stump-cottonwood`** — exist. **The stumps matter more here than
  anywhere else in the series** (§3.4, `I-9`).
- **`cotton-young` / `-mature` / `-dry`**, **`fence-rail`**, **`fence-corner`**, **`palisade`**,
  **`barrel`**, **`crate`**, **`sacks`**, **`reeds`**, **`water-ripple`**, **`ox-cart`**,
  **`wagon-loaded`**, **`wagon-covered`**, **`deer-*`** exist.
- **The domestic interior is essentially complete**, as the Columbia research established.

**Existing requests this town raises the priority of, with the reason it supplies:**

- **A two-storey building.** **Brazoria is the fourth town to need it** — after Columbia raised it
  and Washington re-raised it as the third. Brazoria's case is different from both: not a capitol
  but **a commercial frontage** — a store with a bank and a post office in it whose back stands out
  over a river, and a hotel with a dining room that seated the leading men of Texas at one sitting.
  **Add to the existing request: the same silhouette wanted as a river-port store, with a gable to
  the street.**
- **A warehouse or store standing out over the water on piles.** Matagorda asked for "a warehouse
  standing on a wharf, rather than a warehouse and a wharf side by side". **Brazoria supplies the
  documented reason and a sharper composition**: a building on the street at the top of a 22-ft
  bank whose **rear elevation is carried on piles out over the river and used as the landing**
  (S12). **Raise the priority and add this composition to the request.**
- **A cut river bank with steps or a haul road.** Columbia asked for it (30 ft, log-lined, with
  timbered steps); Washington asked for "a river bluff with a road cut down it". **Brazoria
  measures 22 ft with USGS and has a documented haul up it by horse and mule.** **Three towns, one
  request — it should now be near the top of the list.**
- **Cotton bales.** Columbia's request. Brazoria adds **cotton bagging and bale rope landing from
  New Orleans** as well as bales going out — **a bale is made here as well as shipped.**
- **A sea-going schooner.** Matagorda's request, which Columbia asked to see tied against a high
  bank. **Brazoria wants a third state: a schooner under tow, with a steamboat ahead of her.**
- **A frame / clapboard building.** San Felipe raised it, Matagorda re-priced it, Columbia supplied
  the adjective. **Brazoria is the fourth town and its whole commercial front needs it.**
- **Cane, and a cane-brake.** Columbia's request. Holley puts peach and cane undergrowth on exactly
  this kind of land (S7).

**Genuinely new, and both are strong:**

- **A printing office — a hand press, two cases of type on a frame, a composing stone, a pile of
  folded sheets, an ink ball.** **Nothing in the atlas is a press, and Brazoria is the only town in
  this nine-town series with one working in October 1835.** Columbia's research established that
  the *Telegraph* did not print at Columbia until August 1836; San Felipe's own paper was founded
  on 10 October 1835. **The lower Brazos read its news on paper printed in this town, and a student
  can be shown the machine that printed it.** It is also cheap: a wooden common press is one
  object. Stand-in: `timber-shop` with `crate`, marked `stand-in:` naming the request.
- **A steamboat — and this is a correction to the Washington report's art section.** Washington's
  §8.8 says **"Do NOT request: a steamboat (1840s)"**. That is right for the *upper* Brazos and
  wrong for the lower. **Two independent 1835 sources put a steamboat on the water below
  Columbia**: the *Texas Republican* advertises a reward for a watch stolen from **the cabin of the
  steam boat *Laura***, from 19 September 1835, and the same paper reports the New Orleans Greys'
  schooner **towed up to Brazoria** from the mouth in October 1835 (S6). A small side-wheel
  river steamboat with a single stack, drawing very little, is a real object on the lower Brazos in
  the game's month. **Raise it as a *lower-Brazos* request, with the date evidence attached, and
  amend Washington's line rather than contradicting it.** Stand-in: none adequate; `wharf` with
  `skiff` alongside, marked `stand-in:`.

**Record the gap, do not raise the request yet:**

- **A tannery** (documented 1831, "a bit downwind of town") — a bark mill and a row of pits.
  Small, specific, and no other town in the series has asked for one.
- **A town lot boundary that is a line of stumps rather than a fence.** This is a ground rule
  rather than a sprite, and the stumps already exist.

---

## 8. Verdict

**Can Brazoria be drawn honestly? Yes — and it is the most alive of the nine.**

**What is solid.** The plan is recoverable twice over: **Holley describes it in one sentence in
1836, and the surviving grid matches her sentence and measures a 100-vara module six intervals
running, square to two thirds of a degree.** No other town in this series has a documentary
description of its plan *and* a grid that agrees with it. **One building has a corner** — the Mills
brothers' store at Market and Main, with its back over the river as the landing — **and one
building has a marked point**, Jane Long's boarding house on Main Street. **The river, the bank and
the ground are measured**: a 22-foot cut bank 130 feet from the main street, water 255–395 feet
wide, and a town sitting ten to twelve feet lower than Columbia, which is the whole reason Columbia
took the courts. **And the town's own newspaper can be read week by week through October 1835** —
which means the hotel has a name, the merchants have names, the doctors have names, the pilot of
the bar has rules, the votes are counted, and there is a dated scene, in a placeable building, in
the exact month the game is set: **the New Orleans Greys fed at Jane Long's house on 21 October
1835, with flowers strewn at their feet, two days before they marched for San Antonio.**

**What would have to be invented.** Everything written on the plat: street widths, block and lot
dimensions, the block numbering (beyond "No. 41"), the out-lots' size and position, and whether
there was a public square. The positions of the hotel, the printing office, every store, the
warehouses, the courthouse building and every dwelling. The number of houses. Any dimension of any
building — **there is not one in the entire record.** And the 1835 bank line, which is probably
close to the modern one but nobody says so.

**Is there enough to draw the town honestly? Yes, with one discipline.** Draw the **frame** as
measured — the bearing, the module, the streets, the river, the bank — and put on it **one
documented corner, one marked house, a short dense frontage either side of Market Street, and
forty-odd buildings that are labelled as invented.** Then **empty it**, because the paper says the
town was in a deserted condition that month. **The honest Brazoria is a real plan with invented
contents, and it is the reverse of Washington, where the plan is gone and a building survives.**

**What will surprise anyone who knows Brazoria only from a marker:** in October 1835 it was
**not** the seat of anything. Its municipality had been renamed Columbia and moved away the year
before; its founder was two years dead; it had no church, no courthouse of justice, no lodge hall
and no post office. What it had was **a river, a landing, four stores, a bank, an insurance agency,
a hotel where Stephen F. Austin declared for war, a printing press, four doctors, a portrait
painter, and fifty families — and half of them had gone to fight.**

**The six things most worth doing before drawing it**, in order of value:

1. **Get the 1828 plat out of the Brazoria County Clerk's records at Angleton.** It would settle
   nine of the fifteen unknowns in §5 from one sheet — the street widths, the lot size, the block
   numbering, the out-lots, and whether there was a square.
2. **Ask the Brazoria County Historical Museum's Adriance Library three questions** (S15):
   is there a plat or a title abstract of the old townsite; has the townsite ever been
   archaeologically tested; and is there a nineteenth-century photograph of Main Street.
3. **Read the rest of the Brazoria press.** The Portal is now open to this project (§1b) and
   **34 issues of the *Texas Republican* are already read.** Missing: issues 1–24 (July 1834 –
   February 1835), and the three earlier titles — **Cotten's *Texas Gazette and Brazoria Commercial
   Advertiser* (1832), Anthony's *Constitutional Advocate* (1832–33), and Wharton's *Advocate of
   the People's Rights* (1833–34)**. Anthony owned a block of lots in this town and printed a
   newspaper in it; **his own paper is the likeliest surviving place for a Brazoria street name.**
4. **Read Creighton's *A Narrative History of Brazoria County* (1975).** Two reports have now had
   to say it was not read.
5. **Settle the 1836 burning** (§5.15) — three sources give three answers, and it governs what may
   be shown surviving anywhere in the county.
6. **Fix `sim/texas.mjs`.** Three things follow from this research, and none is a large change:
   - **There is no road to Brazoria** (§Corrections). Mail route No. 4 —
     **San Felipe – Fort Bend – Orozimbo – Columbia – Brazoria – Velasco, 98 miles, weekly** (S7)
     — is documented, is the road the game's own Columbia and Velasco sit on, and is the road a
     family from the lower Brazos would travel. **If any road is drawn on the lower Brazos, that
     is the one, and it should be drawn with the same caution as the Gonzales road.**
   - **`weight: 'minor'` is arguable.** Brazoria was **the largest settlement in its county in
     1834** at 500, ahead of Velasco (marked `'port'`) at 100 (S2), and it was the port where
     sea-going schooners lay and volunteers landed. Columbia is `'minor'` too, and Columbia was
     smaller. **This report does not change the file; it records that the ordering is backwards.**
   - **The position may be too far south.** With Columbia at `(158, 8)`, the measured
     **7.8 miles on bearing 140°** from West Columbia to Old Brazoria (§3.5) puts Brazoria nearer
     `(164, 15)` than `(164, 30)`. **But `sim/texas.mjs`'s map is a schematic, not a projection** —
     three independent pairs of settlements give three different miles-per-unit — **so this is a
     flag, not a correction.** The bearing and distance above are the measured facts; what the
     schematic should do with them is a decision for whoever draws it.
