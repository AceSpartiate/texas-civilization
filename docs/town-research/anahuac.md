# Anahuac in 1835 — a ruined brick fort on Perry's Point, and a garrison town that had lost its garrison

Research only. Nothing here is built, and no claim below has a `HIST-` or `FIC-` ID yet; IDs are
assigned when something is drawn. Read alongside `docs/town-research/liberty.md` (Anahuac was a
precinct of the municipality of Liberty in 1835), `harrisburg.md` (Travis's 1835 company sailed from
there, and the Anahuac merchants traded there) and `velasco.md` (the other 1832 Mexican fort, and the
model for a fort drawn as a ruin with a date on it). The layout vocabulary in §8 is that of
`public/bexar-layout.js` (feet, a local plane, +y south, `river`, `roads`,
`building(id, sprite, x, y, heightFeet)`), with the fort in the `rooms`/`walls` terms of
`public/alamo-layout.js`. `public/gonzales-art.js` (`GONZALES_BUILDINGS`) was read and exists as the
brief says; there is no `public/gonzales-layout.js`.

Researched 2026-09-16. Every URL in §1 was opened and read on that date. Every measurement in §2.2,
§2.3 and §8 was computed here on that date from the sources named.

---

## The one-line answer

**In October 1835 Anahuac was a small, half-emptied trading place on a bluff at the north-east corner
of Galveston Bay (Trinity Bay today), beside the mouths of the Trinity. At the south end of the bluff,
on the point once called Perry's Point, stood the ruin of a Mexican brick fort. It had been built in
1831–32, taken apart by its own garrison in July 1832, and burned out that November. Captain Antonio
Tenorio's detachment had used what was left of it from January to June 1835, and nobody had held it
since Travis took it on 30 June. There was no garrison, no customs collector and no Mexican flag.
There were a few stores, a calaboose, the collector's empty office, some families, round shot lying
about, and a precinct of about 124 people spread along the bay. The ruin can be located to within a
couple of hundred feet: it is in Fort Anahuac Park, about a mile south of the modern courthouse. The
fort's plan can be sketched from four accounts that do not agree on its size. The town's plan can't
be recovered. A surveyor was at work in 1832 and lots were handed out, but no plat has been found.**

Six things, and they mostly agree:

1. **The fort's site is documented and still on the ground.** It is National Register site
   41CH226, listed 1 July 1981, in Fort Anahuac Park on FM 563/SH 564. It sits at the edge of an old
   river terrace that drops about 15–20 ft to the marshy Trinity delta (S2, S17, S20). **Measured
   here on USGS 3DEP (S22):** the terrace at the fort is 18–20 ft above sea level. Ground below the
   bluff is 0–4 ft. The fort stands on the terrace's most westerly point. North of it the bluff edge
   bends 300–650 ft back to the east, which is why this spot was a "point" (§2.2).
2. **Four descriptions of the fort survive, and their sizes differ by a factor of three.**
   - Henson (S2): outer walls 100 × 70 ft, two redoubts on diagonally opposite corners, and a brick
     building about 50 × 35 ft inside.
   - George Wilcox, recalled in 1898 (S9): "about 30x40 feet in the clear", with its west side on the
     bank.
   - The 1976 marker and the 1979 nomination (S20, S17): a bastion with brick walls more than 7 ft
     thick and an adjoining barracks with 4-ft walls.
   - Carroll Lewis's 1968 excavation plan (S17): a five-sided "bastion" on the bluff edge with a long
     "barracks" behind it.

   **They fit together if Wilcox's 30 × 40 is one redoubt and Lewis's barracks is Henson's brick
   building.** That is an inference (`I-2`), and it is the backbone of §8.2.
3. **The fort in October 1835 was a ruin, and five sources say so without contradiction.**
   - It was dismantled in July 1832 (S2).
   - A November 1832 fire gutted its wooden parts (S2).
   - Neighbours took its bricks for chimneys and foundations (S2).
   - In January 1835 it was "in such disrepair" that Tenorio asked for lumber, and the lumber sent
     "for the purpose of rebuilding Fort Dabis" was burned on the night of 3–4 May 1835 (S2, S8).
   - Travis's men found it deserted on 29 June 1835 (S8), and "the fort was never again to know the
     tread of a Mexican garrison" (S9).
4. **The town is documented by counts and scenes, not by a plan.**
   - **March 1831:** "fifteen or twenty log houses and huts, and seven poor shops", plus a barracks
     about 150 × 20 ft (S5).
   - **June 1831:** 300 civilians and 170 soldiers (Labadie, via S11).
   - **1834:** 50 people in the town (Almonte, S12).
   - **December 1834:** 124 people in the whole precinct (S11), including a planter's household of
     about 30 enslaved people at Smith's Point, 18 miles south.
   - **1836:** "about thirty houses besides the building erected as barracks" (Holley, S6). This
     sentence is copied almost word for word from the 1831 account, with the count raised (§1b).
5. **There are real 1835 scenes with physical detail.**
   - The night of 12 June 1835: Briscoe's store under guard; a wheelbarrow of brick wheeled to the
     beach; soldiers catching the men at the boat; William Smith shot "as we were ascending the bank"
     while "coming down the hill"; Briscoe and Harris put in the calaboose (S8, S9).
   - The afternoon of 29 June 1835: the sloop *Ohio* grounded about half a mile off shore; a warning
     shot from a six-pounder mounted on sawmill truck wheels; the gun rowed ashore in a small boat;
     the Mexicans slipping away into the woods (S8, S9).
6. **Almost nothing is documented for October 1835 itself.**
   - No Anahuac item was found in the October issues of either 1835 newspaper (S15, S16). Both OCRs
     are poor, so that is "not found", not "not there".
   - Austin wrote on 3 November 1835 that "there is considerable round shot at Anahuac" (S13).
   - Charles Willcox, merchant since 1831, was subalcalde "during that period" (S4-Willcox).
   - Andrew Briscoe, the other merchant, was captain of the Liberty Volunteers at Concepción on
     28 October, so he had left town (S4-Briscoe).
   - Benjamin Freeman, at whose house the tariff meeting of 4 May 1835 was held, had died on
     17 August 1835 (S8, S11).

---

### Corrections to the brief, and four notes for the repository

- **"on Trinity Bay near the mouth of the Trinity River (Perry's Point)": right, with detail added.**
  - Every 1830s source calls the water the north-east corner of Galveston Bay (S5, S6, S7). "Trinity
    Bay" is the modern name (S4-Trinity Bay).
  - **Perry's Point was the fort's site, not the town's.** The fort stood on the point. The town lay
    along the same bluff to the north: "about half a mile" (S9, 1898) or about a mile (S2, S17) from
    the fort.
  - The Trinity reached the bay here by "seven mouths", with bars "sometimes too shallow even for row
    boats" (S5).
- **"established around 1830–31 as a Mexican customs post and garrison under Juan Davis Bradburn":
  right, and in that order.**
  - Bradburn landed with about forty men on **26 October 1830** (S3).
  - Terán named the place Anahuac in **January 1831** (S1).
  - Bricks were made on site from March 1831, and the foundation was finished on 14 May 1831 (S2).
  - The customs house came later: George Fisher opened it in **November 1831** (S4-Fisher).
  - **Three places in the record give a wrong date:** TSHA's *Chambers County* entry says Perry's
    Point was renamed Anahuac in **1825**; the 1976 fort marker says the place was "known as Perry's
    Point until 1825"; and TSHA's *Trinity Bay* entry says "early Anahuac (1821)". None fits Henson's
    account or the 1831 eyewitness (§1d).
- **"with a brick fort (Fort Anahuac)": right, but it was a ruin by the game's month.**
  - The south-west redoubt had its own name, **Fort Davis**, after Bradburn (S2). Tenorio's letters
    call the fort "Fort Dabis" (S8).
  - Every primary account says brick (S2, S9, S10, S17). The starforts.com page's "30' by 40' adobe
    rectangle" takes Wilcox's 1898 measurement and gives it the wrong material. It is **rejected**
    (S24).
- **"1832 (Bradburn, Travis's arrest)": right.**
  - Travis and Patrick Jack were arrested in May 1832 and held first in a house next to Bradburn's
    quarters, then in an emptied brick kiln turned prison near the fort (S9, S10).
  - The fighting ran from **10 to 12 June 1832** (S2, S3).
  - The Turtle Bayou Resolutions were drafted six miles north on **13 June** (S6, S20). TSHA's
    *Turtle Bayou Resolutions* entry has the settlers reaching the bayou on 12 June, and Wikipedia
    says 5 June.
- **"June 1835 (Travis and volunteers forcing Captain Antonio Tenorio's small garrison to leave, about
  29–30 June 1835)": right on the dates, with three things to add.**
  1. **Travis landed on 29 June and Tenorio capitulated on the morning of 30 June** (Travis to
     Henry Smith, 6 July 1835, S9; Tenorio to Ugartechea, 7 July, via S8). TSHA's *Anahuac
     Disturbances* entry says Tenorio "surrendered on June 20". **That is wrong.** D. W. C. Harris's
     letter of 17 August 1835 says "the 27th", also wrong (§1d).
  2. **The garrison was not tiny by local standards.** Two officers and 34 men arrived in January;
     nine more came with Lieutenant Durán on 1 May (S8). Travis said "about forty" (S9) and Harris
     said 44 (S8). **Travis had 20 to 30 men** (§1d).
  3. **The men sailed away but did not "leave" by sea.** Travis sent them "bag and baggage on board
     the sloop" to Harrisburg (S9). From there they marched, with 12 muskets left them against
     Indians, toward Béxar (S8). Tenorio reached San Felipe by 17 July, stayed about seven weeks, and
     reached Béxar about 8 September (S8).
- **"the second is a direct prelude to Gonzales": supportable, as one link and not the cause.** Cos
  wrote to the ayuntamiento of Columbia on 1 August 1835 demanding that Travis be handed over for the
  Anahuac attack (S13). Soon after, Ugartechea and Cos ordered the arrest of Travis, Johnson,
  Williamson, Baker and Zavala (S4-Tenorio, S9). Barker (S8, 1901) calls the capture "the first act
  of violence in the Texas revolution", but says it was the Mexican reaction to it "which provoked
  all the Texans into united rebellion". The cannon demand at Gonzales is a separate chain.
  **Say "a prelude", not "the prelude".**
- **"By October 1835 the garrison was gone and the customs house idle": right, and more certain than
  the brief says.**
  - The collector José González left for Mexico with his deputy on **9 May 1835**. Tenorio then did
    the job himself, without authority. An unnamed collector was acting again by 11 June (S8).
  - No collector is recorded after the capitulation.
  - **Two threats of return never came:**
    - TSHA says Ugartechea ordered Tenorio "to return to his command at Anahuac" in September
      (S4-Tenorio). Nothing read says he went.
    - Travis wrote to Briscoe on 31 August that "200 men shall arrive by water at Anahuac" by
      12–15 September (S9). They did not.
  - The Mexican schooner of war *Correo*, whose captain proclaimed to "the citizens of Anahuac" from
    anchor on 26 July 1835 (S15), was captured off the Brazos on 1 September (`velasco.md`).
- **"the town was small": right.** Fifty people in 1834 (S12), in a precinct of 124 that took in
  Double Bayou, Smith's Point and High Island (S11). **Its peak had been 1831–32**, with 300
  civilians and 170 soldiers (S11). After the garrison left in 1832, "the remaining inhabitants of
  the town began to drift away" (S11).
- **"It was on the Atascosito Road network": wrong as stated.**
  - The Atascosito Road crossed the Trinity at the Atascosito crossing near Liberty (S4-Atascosito
    Road), about 20 miles north.
  - **Anahuac was off it.** It connected by a track north across the prairie to Turtle Bayou (James
    Taylor White's crossing, six miles) and on to Liberty. Labadie gives Anahuac to Liberty as
    **twenty-five miles** (S10).
  - The 1831 traveller came from the west by a different route: Harrisburg, Lynch's on the San
    Jacinto, Winfree's, Barrow's, then Heyne's on Old River near the Trinity. That house was "three
    or four miles" from Anahuac by water, and "the land route is circuitous, and much further"
    (S5).
- **"reached by water from Galveston Bay": right, and it was the main way in.**
  - Travis came by sloop from Harrisburg in 1835 (S8, S9).
  - D. W. C. Harris put Anahuac "about fifty miles from Harrisburg" (S9).
  - The 1831 traveller's party once rowed about "two or three miles" to reach it (S5).
  - A schooner lay "in the channel at Anahuac" in 1832, and the landing was about half a mile from
    Bradburn's quarters (S10).
  - The water was shallow. The sloop *Ohio* grounded half a mile out (S8). The brig *Climax* was
    wrecked at Bolivar in 1831 because it drew too much to cross the bar (S11). The second *Climax*
    sank at Red Fish Reef in July 1834 (S11).
- **Method notes, as found today.**
  - Portal `ocr/` and `metadata.untl.xml` still answer curl. About 330 pages were read here, including
    four Portal volumes (S8, S9, S10, S11) located by web search.
  - hmdb still answers curl with a browser user-agent.
  - The THC Atlas serves National Register PDFs at `atlas.thc.texas.gov/NR/pdfs/<ref>/<ref>.pdf`.
    **New to this series:** its page images can be pulled out of the PDF stream with a few lines of
    Node, because no PDF renderer is installed here. That is how the 1968 excavation plan was read.
  - The Library of Congress Sanborn JSON now returns a Cloudflare challenge.
  - Henson's *Juan Davis Bradburn* (archive.org) is lending-only and its text is refused (§1b).

**Four notes for the repository.** Nothing is changed here.

1. **`HIST-TEX-010`'s Anahuac coordinate (29.77300, −94.68270, GNIS 1329510) is the modern town, and
   it sits at the north end of where the 1830s town stood. The fort is 1.23 miles away.** Measured
   here (S20, S21, §2.1):
   - The GNIS point is **6,498 ft (1.23 mi) at bearing 15° from the fort marker**, so the fort lies
     195° from it.
   - It is 1,433 ft north-north-east of the courthouse. The Texas Almanac article (S18) says
     Bradburn's first wooden barracks stood near the courthouse.
   - It is about 1,050 ft east of the bluff edge and about 1,400 ft east of the south end of Lake
     Anahuac, which was Turtle Bay in 1835.
   
   This is not Velasco's four-mile error. **It is fine for the colonies map. It is the wrong origin
   for a fort or town layout.** Use the fort markers (29.7558, −94.6879) for the fort, and put the
   town between them and the courthouse (§3.5).
2. **The Liberty–Anahuac road of `FIC-GONZ-027` / `scripts/build-colonies-map.mjs` is consistent with
   the record**, by way of Turtle Bayou, 25 miles (S10). **But Anahuac's documented link to
   Harrisburg and Lynchburg was by water**: the 1835 expedition, D. W. C. Harris's trading trips,
   and the Harris brothers' schooners of 1832 (S8, S9). No road joins them in the game. That is
   right, but the express and news model (`docs/COLONIES.md`) should know news reached Anahuac by
   boat or from Liberty.
3. **`scripts/art-registry.mjs` (`anahuac`) and `docs/LOCATION_ART_GUIDE.md` are right that the fort
   is a disused ruin in the game period. Three details need adjusting:**
   - **No ferry is documented at Anahuac.** `ferry-raft` belongs to river crossings.
   - **No wharf is documented.** The record has a "landing", a "beach" below a "bank" or "hill", and
     boats (S8, S10). `skiff` fits better than `wharf`.
   - **"No artillery" is right for mounted guns but not for ordnance.** Austin reported
     "considerable round shot at Anahuac" on 3 November 1835 (S13). Wilcox said in 1898 that one of
     the fort's two iron guns "can be seen at Anahuac today" (S9). Its whereabouts in 1835 are
     unknown. **Loose round shot is documented. A dismounted gun is possible. A manned battery is
     wrong.**
4. **`velasco.md` §1c dates "the Anahuac petition" to 5 May 1835.** Barker (S8) dates the meeting,
   held at Benjamin Freeman's house, to **4 May 1835**, the same night Tenorio's lumber was burned.
   Both cite the *Texas Republican* of 8 August 1835. The issue's OCR was too damaged to settle it
   here. **Flagged, not resolved.**

---

## 1. Sources

| # | Source | What it was used for | URL read 2026-09-16 |
| --- | --- | --- | --- |
| S1 | TSHA *Handbook of Texas*, **Anahuac, TX** (Kevin Ladd, rev. 20 Sep 2023) | Northeast bank of Trinity Bay; Perry's Point after Henry Perry's 1816 camp; **Bradburn arrived October 1830 with three officers and forty men; Terán named the town January 1831**; the town "flourished briefly prior to the 1832 battle" and the population "declined dramatically afterward"; the **Chambers–Willcox townsite suit, 1838–1865**; "Chambersea"; Fort Chambers 1862; sawmill 1894; Lone Star Canal 1902; the Anahuac Townsite Company's real-estate development "in the early 1900s"; county seat 1908; incorporated 1948 | [tshaonline.org/handbook/entries/anahuac-tx](https://www.tshaonline.org/handbook/entries/anahuac-tx) |
| S2 | TSHA, **Fort Anahuac** (Margaret S. Henson, rev. 1 Jan 1995) | **The fullest description of the fort.** One mile south of Anahuac; site chosen November 1830 "on a bluff, called Perry's Point since 1816, overlooking the entrance to the Trinity River"; Bradburn brought "plans and a cardboard fort"; **a fortified wooden barracks half a mile north of the bluff, in the centre of modern Anahuac, later the jail that held Travis**; bricks made by convict soldiers from March 1831; **foundation completed 14 May 1831**; **exterior walls 100 by 70 ft enclosing two redoubts diagonally opposite at SW and NE; a reinforced-brick building about 50 by 35 ft inside**; the SW redoubt **"Fort Davis"** overlooking the bay, up to 50 men and a six-pounder; the NE redoubt guarding the land approach; cavalry horses between; **an excavated passage to the powder magazine on the east side, with two bulwarks, Hidalgo and Morelos, near the brick kilns, each with a sixteen-pounder**; garrison 40 men in 1830 to 285 men and ten officers in May 1832; **dismantled July 1832; fire gutted the wooden parts November 1832; wooden calaboose burned December 1832; residents removed bricks**; Tenorio in January 1835 found it in disrepair; wood arrived in May and was burned; **no artillery in June 1835**; never used again; **1938 county surveyor's field notes of the foundations**; **erosion after the Trinity was rechannelled "sometime after the 1930s" put the SW redoubt's remains into the water**; county park 1946, rubble buried; amateur dig 1968 | [tshaonline.org/handbook/entries/fort-anahuac](https://www.tshaonline.org/handbook/entries/fort-anahuac) |
| S3 | TSHA, **Anahuac Disturbances** (Henson, rev. 8 Sep 2020) | Landing on 26 October 1830 "with orders to establish a garrison and a town"; Madero and the Liberty ayuntamiento; Terán ordering it moved to Anahuac; Fisher's clearances; the empty brick kiln as prison; the rescue force at Turtle Bayou "six miles north of Anahuac" on 9 June 1832; Bradburn threatening "to fire on the town"; **1835: Briscoe's ballast trick, "stowing bricks"; arrest of Briscoe and Harris on 12 June**; Tenorio's "some forty troops"; **"surrendered on June 20"**, which is wrong (§1d) | [tshaonline.org/handbook/entries/anahuac-disturbances](https://www.tshaonline.org/handbook/entries/anahuac-disturbances) |
| S4 | TSHA, **Tenorio, Antonio**; **Perry's Point**; **Briscoe, Andrew**; **Willcox, Charles**; **Labadie, Nicholas Descomps**; **Harris, DeWitt Clinton**; **Fisher, George**; **Turtle Bayou Resolutions**; **Atascosito Road**; **Trinity Bay**; **Chambers County**; **Wallisville, TX**; **Fort Chambers** | Tenorio: two officers and 34 men, January 1835; **"In September Domingo de Ugartechea ordered him to return to his command at Anahuac"**. Perry's Point: "Punta de Perry" on Thompson's 1828 map. Briscoe: **opened a store in Anahuac in 1835**; captain of the Liberty Volunteers at Concepción and Béxar. **Willcox: moved to Anahuac 3 March 1831; general store with Labadie; kept it "until at least 1875"; allied with Travis and Tenorio in 1835; subalcalde at Anahuac "during that period"**. **Labadie: Bradburn "gave him a town lot on which to build his home and office"**; he lived on Lake Charlotte from 1833. Fisher: **set up the customhouse at Anahuac in November 1831**. Atascosito Road: to the Trinity near Liberty. Trinity Bay: "early Anahuac (1821)". Chambers County: "In 1825 Perry's Point ... was renamed Anahuac"; **Chambers's home "built in 1835"**; **Lake Anahuac built in the 1940s**; Anahuac "unoccupied" in the 1880s–90s. Fort Chambers: **"about halfway between the site of Fort Anahuac and the town"**, 1862 | `tshaonline.org/handbook/entries/` + `tenorio-antonio`, `perrys-point`, `briscoe-andrew`, `willcox-charles`, `labadie-nicholas-descomps`, `harris-dewitt-clinton`, `fisher-george`, `turtle-bayou-resolutions`, `atascosito-road`, `trinity-bay`, `chambers-county`, `wallisville-tx`, `fort-chambers` |
| S5 | **[Anonymous], *A Visit to Texas: Being the Journal of a Traveller*** (New York, 1834), chs. VII–XIII, Internet Archive djvu text. **The only eyewitness description of the town's physical form** | **Arrived Saturday 26 March 1831.** "The situation is pleasant, at the north eastern corner of Galveston Bay, on the verge of the Prairie, **where the bank descends abruptly from the water, about thirty feet**"; the bay "twenty miles across"; **"The seven mouths of Trinity or Trinidad river open into the bay near this corner"** with bars "sometimes too shallow even for row boats"; tides very small, raised by southerly gales; **"fifteen or twenty log houses and huts, and seven poor shops, with the building erected as barracks for the garrison. This was about one hundred and fifty feet long and twenty wide, with the Colonel's quarters at one end, and the guard house at the other"**; the country behind level, "groves and islands of trees"; the calaboza; **the overland route in** (Harrisburg, Lynch's, Winfree's, Barrow's, Heyne's on Old River, a Trinity crossing, twelve miles of bottomland timber of pine, cypress, cedar, ash, pecan, oak, walnut and locust, Turtle Bayou, prairie); **Heyne's "a distance by water of about three or four miles" from Anahuac, "the land route ... circuitous"**; Taylor White's estate about five miles off; the emigrants' huts | [archive.org/download/avisittotexasbe00fiskgoog/avisittotexasbe00fiskgoog_djvu.txt](https://archive.org/download/avisittotexasbe00fiskgoog/avisittotexasbe00fiskgoog_djvu.txt) |
| S6 | **Mary Austin Holley, *Texas*** (Lexington, 1836), djvu text | Anahuac "formerly a military post town"; NE corner of Galveston Bay "opposite the mouths of the Trinity"; on the border of a prairie, **thirty feet above the bay**; **"about thirty houses besides the building erected as barracks ... about one hundred and fifty feet long and twenty wide, with the colonel's quarters at one end, and the guard house on the other"**; Bradburn's military council "distributed lots to the inhabitants"; "Tuscasito, in the vicinity of Anahuac". **Paraphrased from S5**; see §1b | [archive.org/download/texas00holl/texas00holl_djvu.txt](https://archive.org/download/texas00holl/texas00holl_djvu.txt) |
| S7 | **David B. Edward, *The History of Texas*** (Cincinnati, 1836), djvu text | Anahuac "at present the third town of importance in the district of Nacogdoches"; **"a beautiful, high level prairie bluff, south-east of Galveston Bay, opposite the mouths of Trinidad river"**; the 1835 revenue officers "residing at Galveston and Anahuac"; Tenorio arriving "the fall of 1834" (wrong, per S8) | [archive.org/download/historyoftexas01edwa/historyoftexas01edwa_djvu.txt](https://archive.org/download/historyoftexas01edwa/historyoftexas01edwa_djvu.txt) |
| S8 | **Eugene C. Barker, "Difficulties of a Mexican Revenue Officer in Texas"**, *QTSHA* IV (Jan 1901), 190–202, Portal reprint OCR, 16 pages. **Built on Tenorio's own letters in the Béxar Archives and J. W. Moore's MS "The Capture of Anahuac"** | **The 1835 garrison from the inside.** Arrived near the end of January 1835: **two officers and 34 men** of the Abasolo and Jiménez regiments; ordered to Galveston Island but went to Anahuac "where there were means of living"; **Anahuac "the chief port of the department of Nacogdoches, whose imports in 1834 were valued at $265,000"**; no boats, no cavalry, no post; merchants refused credit; desertions; **Durán with nine men, fifty muskets and $2,310 on 1 May**; **4 May: lumber "for the purpose of rebuilding Fort Dabis" burned in the night**; **4 May: twenty or twenty-five men met "at the house of Benjamin Freeman"**; collector José González stationed at Brazoria, deputies Gil Hernández (Galveston) and Martín de Alegría (Anahuac); **González left for Mexico on 9 May**; 11 June: the collector asks for a guard of four and a corporal; **night of 12 June: Briscoe "took from his house a box, and went to the sea shore"; Smith shot**; Harris's account (below); **Travis's company: 30 signed at San Felipe and Harrisburg, 25 went, names listed**; **the *Ohio* "grounded" about half a mile from shore; a warning shot from "the small cannon ... mounted on a pair of saw mill truck wheels"; the gun rowed ashore; "the Mexicans had made use of the delay to flee to the woods, and the Texans found the fort deserted"**; capitulation morning of 30 June; twelve soldiers allowed arms against Indians; Harris's figure of 44 Mexicans and about 30 Texans; Tenorio at Harrisburg 4 July, at San Felipe by 17 July, **Béxar about 8 September**; Tenorio's own arms return of 23 April 1835 | [ark:/67531/metapth29769](https://texashistory.unt.edu/ark:/67531/metapth29769/) (OCR `m1/1`–`m1/18/ocr/`) |
| S9 | **Adele B. Looscan, "The Old Fort at Anahuac"**, *QTSHA* II (July 1898), 21–28, Portal OCR | **The fort "about half a mile south of the town of Anahuac"**, walls levelled, outlines traceable; Labadie on the kiln prison; **D. W. C. Harris's letter, Harrisburg 17 August 1835, the 12 June scene**: goods bought from Briscoe; guards round Briscoe's store; a box of ballast on "a wheelbarrow filled with brick" taken "for the beach"; the box "put in the boat"; **"As we were ascending the bank a young man named Wm. Smith came down the hill"** and was shot; "put in the calaboose"; **Anahuac "about fifty miles from Harrisburg"**; **"a six-pound cannon on truck wheels used for hauling logs to the saw mill"**; **Travis to Henry Smith, 6 July 1835**: landed on the 29th, capitulation on the 30th, "about forty", sixty-four stands of arms; **Travis to Briscoe, 31 August 1835: "200 men shall arrive by water at Anahuac"; "Allow no pilots in the bay"; "My respects to Wilcox"**; Thompson of the *Correo*; **"the fort was never again to know the tread of a Mexican garrison"**; **George E. Wilcox's description: "about 30x40 feet in the clear, built with the western side fronting and immediately on the bank. The bank had been excavated for a distance of ten feet, with the side next to the bay entirely open. This opening was closed up with heavy walls of brick, and lighter brick walls were built around the other three sides ... two passage ways underground, leading back to a large magazine some forty yards back on the hill ... On the exposed part of the fort there was a brick wall about four feet thick ... only two cannon in the fort; they were about six-pound iron guns. One of them can be seen at Anahuac today"**; Fort Chambers "about half way between the Mexican fort and Anahuac, opposite Brown's Flats" | [ark:/67531/metapth101011](https://texashistory.unt.edu/ark:/67531/metapth101011/) (OCR `m1/25`–`m1/32/ocr/`) |
| S10 | **N. D. Labadie, "Narrative of the Anahuac, or Opening Campaign of the Texas Revolution"**, *Texas Almanac* for 1859, Portal OCR, with F. W. Johnson's account in the same run of pages | **The 1832 town as a lived place.** Meetings "at Capt. Dorsatt's house"; **Jack held "on board of an American schooner, then lying in the channel at Anahuac"**; **"about half a mile, to the landing"** from Bradburn's office; **"Dr. Patrick had been appointed City Surveyor"**; the kiln prison "as he was laying the foundation for a fort near Anahuac"; **Labadie's own house, yard and fence, the women sent "to take shelter under the bluff close by" while four-pound balls "bounded over the ground" and cut the limbs of trees**; prisoners made "to mould brick and tramp the clay"; **Taylor White's "some six miles distant"**; Johnson: the Texians camp at **"White's crossing"** on Turtle Bayou, enter Anahuac by noon, and plan to move a detachment **"under the river bank ... The bank at that point being high"** to within rifle-shot of the fort; the commissioners meet "at Wm. Hardin's"; **Bradburn's escape reaching "Liberty by seven o'clock the next morning, a distance of twenty-five miles"** | [ark:/67531/metapth123765](https://texashistory.unt.edu/ark:/67531/metapth123765/) (OCR `m1/30`–`m1/42/ocr/`) |
| S11 | **Jean L. Epperson, "1834 Census—Anahuac Precinct, Atascosito District"**, *SWHQ* 92 (Jan 1989), 437–447, Portal OCR | **The 1834 census, taken by William Dobie (alias Dunlap), dated 29 December 1834**, and Epperson's introduction: the precinct took in **present Anahuac, Double Bayou, Smith Point and High Island**; **124 individuals**; the thirty-foot bluff; **the March 1831 visitor's "fifteen or twenty log houses and huts, and seven poor shops"**; **Labadie, June 1831: "upwards of 300 besides 170 soldiers"**; after 1832 the inhabitants "began to drift away"; the German emigrants of the *Angelia* (March 1831) and two ships named *Climax*; **"temporary plots of land along the shore of Turtle Bay, now Lake Anahuac, located just north of the town"**; **Anahuac's first cemetery there, with the marble stone of Benjamin Freeman, "Who Died August 17 1835"**; Willich's letter of 6 September 1834, "Of all the 72 heads of colonists, only 9 are left"; John M. Smith's plantation at Smith's Point, 18 miles south, and **the killing there on 7 October 1835**; Dobie a merchant, left for Virginia June 1835 and died there. **Occupations in the census**: 18 farmers, 25 spinstresses, 4 labourers, 3 sawyers (the Hodges family), 2 mechanics/machinists, 2 hatters (Henry and Mary Miller), 1 grocer (John P. Brown), 1 seaman (William A. Smith, the man shot on 12 June 1835), 1 huntsman, 1 merchant (Dobie); **about thirty people listed as "Slave" in the Smith household** | [ark:/67531/metapth101212](https://texashistory.unt.edu/ark:/67531/metapth101212/) (OCR `m1/491`–`m1/501/ocr/`) |
| S12 | **Juan N. Almonte's 1834 report**, as transcribed at Sons of DeWitt Colony (already `HIST-TEX-011`) | **"the town of Anahuac, 50"** in the Department of Nacogdoches; Liberty municipality 1,000 | [sonsofdewittcolony.org/almonterep.htm](https://www.sonsofdewittcolony.org/almonterep.htm) |
| S13 | ***The Austin Papers*, vol. III** (Barker, 1927), djvu text | **Austin to the President of the Consultation, 3 November 1835: "Mr Farmer says there is considerable round shot at Anahuac and some at Harrisburgh"**; calendar: Ugartechea forwarding Tenorio's letters showing need of reinforcements (April 1835); Gritten on the Columbia resolutions against the attack (July); Travis's apology to Ugartechea, 31 July; **Cos to the Ayuntamiento of Columbia, 1 August 1835, demanding Travis's surrender for the attack on Anahuac**; William Hardin writing from Anahuac, 4 May 1835; trial of Tomás García for desertion, Anahuac, 20 July 1835 | [archive.org/download/austinpapersocto03aust/austinpapersocto03aust_djvu.txt](https://archive.org/download/austinpapersocto03aust/austinpapersocto03aust_djvu.txt) |
| S14 | **Dilue Rose Harris, "Reminiscences"**, *QTSHA* IV, Sons of DeWitt Colony transcription | **Briscoe "had a large stock of goods there, and it was the chief port of entry east of the Brazos"**; the June 1835 news; the cannon "on a cart used for hauling logs to the saw mill"; November 1835, "Since the garrison at Anahuac had been forced to surrender, the schooners were coming to Harrisburg frequently" | [sonsofdewittcolony.org/roseharris.htm](http://www.sonsofdewittcolony.org/roseharris.htm) |
| S15 | **The *Brazoria Texas Republican*, Feb–Nov 1835**, Portal OCR, 30 issues searched (ids 80252–80281; 80281 turned out to be an 1841 paper) | Itemised in §1c | `texashistory.unt.edu/ark:/67531/metapth<id>/m1/<page>/ocr/` |
| S16 | **The *Telegraph and Texas Register*, 10 Oct – 12 Dec 1835**, Portal OCR, 8 issues searched (plus 2 of 1836) | Itemised in §1c | as above |
| S17 | **National Register of Historic Places nomination, *Fort Anahuac*** (J. Barto Arnold III, Texas Antiquities Committee, 13 July 1979; listed 1 July 1981; ref. 81000626), THC Atlas PDF, 66 MB; text layer read, and **its 50 page images extracted from the PDF stream and read** | Site 41CH226, "about one mile south of the town of Anahuac"; **"constructed at the edge of an upper terrace which drops precipitously about 15 feet to the marshy delta of the Trinity River to the west"**; terrace of mixed pine and hardwood with **loblolly, longleaf and shortleaf pine, gum, oak and hickory**; **"the possible location of the kiln ... about 100 feet southeast of the fort, and several brick foundations located about 150 feet north of the fort which may or may not be related structures"**; foundations **about 24 inches below ground, brick "ten courses thick"**; site "about 75% disturbed" by the 1967 dig and 150 years of brick mining; **1977 magnetometer survey** (TAC Technical Report 25); "brick walls more than seven feet thick"; **"two 18 lb. pivot guns"**; "barracks adjoining the fort had walls about four feet thick"; UTM box of the park. **Two plans inside it:** (a) a 1980 sketch "after map by Southwestern Historical Exploration Society, 1967" showing the approximate water's edge, **"Edge of 30 to 40 ft. bluff"**, "Fort Anahuac brick flooring", "Possible area of old brick kiln", **"4 or 5 brick floor foundations reported in this area"** to the north, and "area of two ponds fill during 1846"; (b) **Carroll Lewis's excavation plan from *Texana* VI (Summer 1968)**, showing a **"BASTION"** on the bluff edge, a long **"BARRACKS"** behind it with "exposed wall foundations, 8 courses of mortared brick layed over 3" clamshell base", a "brick ramp slanting down", "OFFICERS' QUARTERS" in dashed outline beyond, the Fort Anahuac marker, "BLUFF LINE — 1960", and **"APPROXIMATE BLUFF LINE — 1832" drawn well out into the "TRINITY RIVER BOTTOM"**. Its dimension figures are too blurred in the scan to read with confidence | [atlas.thc.texas.gov/NR/pdfs/81000626/81000626.pdf](https://atlas.thc.texas.gov/NR/pdfs/81000626/81000626.pdf) |
| S18 | **Bryan Woolley, "Fort Anahuac and the Texas Revolution"**, *Texas Almanac 2004–2005* | **"the colonel and his soldiers built a temporary wooden fort near the site of the present Chambers County courthouse. It comprised a barracks, a guardhouse and quarters for Bradburn"**; heavy rains, clay dug, permanent post begun March 1831; the guardhouse held 15 prisoners in 1832; **THC magnetometer survey 2001 "found the foundations of about half the fort — enough to determine that it had been diamond-shaped — and one of its bastions"**; **Hicks & Company testing (Rachel Feit): a plaza wall of brick rubble; brick-lined drains carrying water away from the fort; "a well-preserved outbuilding feature with an intact floor surface" with cut nails, ceramics, a gunflint and a Mexican uniform button, "thought to have had wood-frame walls and featured a front porch facing the water ... it might be a customs house or the jail"** | [texasalmanac.com/articles/fort-anahuac-and-the-texas-revolution](https://www.texasalmanac.com/articles/fort-anahuac-and-the-texas-revolution) |
| S19 | **Texas State Library and Archives, *Texas Navy* exhibit**: John W. Moore, W. B. Travis and others, 22 June 1835 (Lamar Papers #203) | The volunteers' pledge "to rendezvous at Lynches on San Jacinto on Saturday next"; the exhibit's summary (Tenorio arriving "in Galveston"; the *Ohio*) | [tsl.texas.gov/exhibits/navy/jno_moore_june22_1835_1.html](https://www.tsl.texas.gov/exhibits/navy/jno_moore_june22_1835_1.html) |
| S20 | **Historical markers**, hmdb.org, fetched with curl; itemised in §1a | Fort Anahuac (1936, 1976), Juan Davis Bradburn (1973), William Barret Travis (1971), Events at Anahuac Leading to the Texas Revolution, Turtle Bayou Resolutions (1968), James Taylor White (1980), Round Point (1984), Chambersea (1968), Home of T. J. Chambers (1936), Chambers County Courthouse (2018), An Anchor (2005) | see §1a |
| S21 | **OpenStreetMap**, `api.openstreetmap.org/api/0.6/map?bbox=-94.705,29.745,-94.665,29.790` | Coastline, salt marsh, Lake Anahuac, the navigation canal, Fort Anahuac Park polygon, the memorial nodes, 1,371 ways; street bearings (the modern grid is cardinal to within 1.5°) | as given |
| S22 | **USGS 3DEP**, Elevation Point Query Service, 90 points | The terrace, the bluff edge, the marsh, the transects of §2.2 | `https://epqs.nationalmap.gov/v1/json` |
| S23 | **Wikipedia, *Anahuac disturbances* and *Juan Davis Bradburn*, wikitext** | **Used only to find citations** (Henson 1982 page references; Epperson 1989). Its dates (the Resolutions "June 5"; the 1835 dispute "late June 27") are not used | `en.wikipedia.org/w/index.php?title=Anahuac_disturbances&action=raw`, `…Juan_Davis_Bradburn&action=raw` |
| S24 | **starforts.com, *Fort Anahuac*** | **Read and rejected**: "30' by 40' adobe rectangle"; Tenorio "in May of 1835"; surrender "June 29". Each contradicts better sources | [starforts.com/anahuac.html](http://www.starforts.com/anahuac.html) |
| S25 | **tDAR citation, G. Roger, T. Q. Booth, R. C. Booth and M. J. D. Moore, *Archeological Monitoring at the Chambers County Jail Expansion Project, Anahuac, Texas*** (Moore Archeological Consulting, RoI 113) | **Citation only; no copy online.** The jail stands by the courthouse, where S18 puts Bradburn's first barracks. This report may say whether anything of 1830–32 was found there | [core.tdar.org/document/316306](https://core.tdar.org/document/316306/archeological-monitoring-at-the-chambers-county-jail-expansion-project-anahuac-texas) |

### 1a. The historical markers used (S20)

Frame of §8: origin at the 1976 Fort Anahuac marker, +x east, +y south, feet.

| Marker | Erected | Coordinates (hmdb) | In §8's frame (ft) | URL |
| --- | --- | --- | --- | --- |
| **Fort Anahuac** (9123) | **1976**, THC | 29° 45.346′ N, 94° 41.273′ W | **0, 0 — origin** | [hmdb m=117180](https://www.hmdb.org/m.asp?m=117180) |
| **Fort Anahuac** (9124) | 1936, State of Texas | 29° 45.369′ N, 94° 41.28′ W | −37, −140 | [hmdb m=117183](https://www.hmdb.org/m.asp?m=117183) |
| Juan Davis Bradburn (9113) | 1973, THC | (OSM memorial node 29.75593, −94.68758) | +96, −60 | [hmdb m=117179](https://www.hmdb.org/m.asp?m=117179) |
| William Barret Travis (9135) | 1971 | "a few steps" from 9123 | ≈ 0, 0 | [hmdb m=117182](https://www.hmdb.org/m.asp?m=117182) |
| An Anchor | 2005, Chambers Co. Hist. Comm. | 29° 45.344′ N, 94° 41.294′ W | −111, +12 | [hmdb m=163903](https://www.hmdb.org/m.asp?m=163903) |
| **Chambers County Courthouse** (20094) | 2018, THC | 29° 46.163′ N, 94° 41.068′ W | **+1,082, −4,968** | [hmdb m=157357](https://www.hmdb.org/m.asp?m=157357) |
| Chambersea (9117) | 1968 | 29° 46.253′ N, 94° 41.087′ W | +982, −5,515 | [hmdb m=121263](https://www.hmdb.org/m.asp?m=121263) |
| Home of Thomas Jefferson Chambers (9116) | 1936 | 29° 46.26′ N, 94° 41.068′ W | +1,082, −5,557 | [hmdb m=121340](https://www.hmdb.org/m.asp?m=121340) |
| Events at Anahuac Leading to the Texas Revolution (9121) | State Hist. Survey Comm. (undated) | 29° 46.389′ N, 94° 40.929′ W | +1,816, −6,342 | [hmdb m=157356](https://www.hmdb.org/m.asp?m=157356) |
| Round Point (9131) | 1984 | 29° 44.075′ N, 94° 41.393′ W | −633, +7,728 | [hmdb m=121353](https://www.hmdb.org/m.asp?m=121353) |
| Turtle Bayou Resolutions (9136) | 1968 | 29° 50.266′ N, 94° 39.198′ W | +10,953, −29,915 (5.7 mi at 20°) | [hmdb m=60341](https://www.hmdb.org/m.asp?m=60341) |
| James Taylor White (12650) | 1980 | 29° 50.246′ N, 94° 36.498′ W (I-10 rest area) | 7.4 mi at 40°; **"Anahuac (9 mi. SW)"** from the ranch | [hmdb m=307754](https://www.hmdb.org/m.asp?m=307754) |
| (index) | — | — | — | [hmdb, Anahuac](https://www.hmdb.org/results.asp?Search=Place&Town=Anahuac&State=Texas) |

**The caution.** The five markers in Fort Anahuac Park stand within 150 ft of each other near the
boat ramp. They are **near** the ruin, not on it, and the S17 plans put the fort foundations close to
the bluff edge, west of them. None of the town markers marks a building of the 1830s. The 1936
*Chambers* marker and the 1968 *Chambersea* marker are about T. J. Chambers's house, and they
disagree about its date (§1d).

**Three marker texts carry claims found nowhere else, and they are marker claims only.**
- The 1976 plate: "Two 18-pound guns topped the 7-foot thick brick walls of the bastion. Four-foot
  thick walls protected the adjacent barracks, and an underground tunnel led to a nearby powder
  magazine."
- The Bradburn plate: Travis and Jack "were held 50 days".
- The Bradburn plate: Bradburn "escaped from Anahuac on July 13, 1832".

### 1b. Sources looked for and not found, and one source that copies another

- **No plat of Anahuac of 1831–35 was found.**
  - Labadie (S10) says Dr. Patrick "had been appointed City Surveyor" by 1832.
  - TSHA (S4-Labadie) says Bradburn gave Labadie "a town lot".
  - Holley (S6) says Bradburn's council "distributed lots".
  
  So a lot survey existed. **Where it went is unknown.** Places to look:
  - the Béxar and Nacogdoches Archives (Bradburn's and Terán's correspondence);
  - the Mexican military archives;
  - the Liberty County and Chambers County deed records;
  - the 1838–1862 Chambers v. Willcox townsite suit, which must have described the townsite;
  - the Sam Houston Regional Library and Research Center, Liberty, which holds Anahuac papers
    (S11's footnotes).
- **Henson's two books were not read.** *Juan Davis Bradburn* (1982) is lending-only on archive.org
  (the text download returned 403), and *Anahuac in 1832: The Cradle of the Texas Revolution* (1982)
  was not found online. **S2 is Henson's summary of both. The books may contain her plan of the fort
  and town, and they are the most valuable unread sources here.**
- **The Hicks & Company reports were not found online:** Feit, Clark, Karbula and Miller, *Fort
  Anahuac: Archeological Testing at a Mexican Era Fort* (Archeological Series 115, 2003), and Feit and
  Clark, *Archeology & History at Fort Anahuac (41CH226): Results of the 2003 Season* (2004).
  **Neither is in the Index of Texas Archaeology.** These, with THC's 2001 magnetometer report and the
  1938 county surveyor's field notes (S2), would give the fort's actual trace. **Get them from Chambers
  County or THC before drawing the fort as more than a sketch.**
- **J. Barto Arnold's 1977 magnetometer report** (TAC Technical Report 25) was not seen.
- **Carroll Lewis, "The Birthplace of the Texas Revolution", *Texana* VI (Summer 1968)**, was seen
  only as the plan reproduced in S17. Its dimension figures cannot be read in the scan.
- **Acacia Heritage Consultants** have worked at Fort Anahuac Park "for two decades", including a
  recent survey for two monuments ([acaciaheritage.com/projects-6](https://www.acaciaheritage.com/projects-6)).
  No report was found online.
- **The Moore Archeological Consulting jail-monitoring report** (S25) is a citation only.
- **Tenorio's letters** (Béxar Archives, January–July 1835) and **J. W. Moore's MS "The Capture of
  Anahuac"** were read only as Barker quotes them.
- **No map of the 1830s town was found.** Alexander Thompson's 1828 chart of Galveston Bay ("Punta
  de Perry", S4-Perry's Point) survives only as the small inset on David Burr's 1834 map of Texas. The
  Coast Survey's 1851 *Preliminary Sketch of Galveston Bay* was seen only as a dealer thumbnail
  (geographicus.com). A search for "Anahuac" on the GLO's *Historic Texas Maps* site, through web
  search, found nothing. **The 1850s Coast Survey topographic sheets (T-sheets) of upper Galveston
  Bay are the likeliest surviving survey drawing of the bluff, the shore and any buildings before the
  twentieth century.**
- **Sanborn maps of Anahuac** could not be checked. The Library of Congress JSON returned a
  Cloudflare challenge. Any Sanborn would date from after the early-1900s Townsite Company replatting
  (S1), in any case.
- **The *Texas Republican* issue of 8 August 1835 (Briscoe's letter dated "ANAHUAC, July 11, 1835";
  the 4 May memorial and resolutions)** was found, but its OCR is too broken to quote. It was read
  through Barker's transcription (S8).
- **Holley 1836 (S6) copies the 1831 *Visit to Texas* (S5).** Her entry uses the same order of
  thoughts and the same numbers: thirty feet above the bay, a barracks 150 by 20 ft, the colonel's
  quarters at one end and the guardhouse at the other. Her "Tuscasito" paragraph (a single house and a
  blacksmith's shop, fine view of the bay, Mr. Orr) is S5's almost word for word. **Her one
  difference is "about thirty houses" where S5 has "fifteen or twenty log houses and huts". Nothing
  says when her number was counted.** Do not treat S6 as independent evidence for anything in S5.
  Treat "thirty houses" as a count of unknown date, probably from the 1832 peak (`I-6`).

### 1c. The newspapers read

All at `texashistory.unt.edu/ark:/67531/metapth<id>/m1/<page>/ocr/`. Searched for Anahuac and its OCR
misreadings ("nahu", "Anahnrc", "Anahuae"), Tenorio, Briscoe, Perry's Point, Galveston, Liberty and
Trinity.

**The *Brazoria Texas Republican*:**

| Ark id | Issue, date | Anahuac material |
| --- | --- | --- |
| metapth80268 | 49, 8 Aug 1835, pp. 1, 3 | **Letter to the editor dated Anahuac, 11 July 1835, signed A. Briscoe; the memorial of the Anahuac meeting to the Governor, "Jurisdiction of Liberty"**; a notice about "a meeting held at the town of Anahuac". OCR badly broken; read through S8 |
| **metapth80271** | **53, 19 Sep 1835, p. 1** | **"T. M. Thompson's Proclamation to the citizens of Anahuac &c."**, dated on board the schooner of war *Correo* at anchor "in this port", 26 July 1835: warns against meetings called by "Judges Williams and Hardin" to organise militia; "Citizens of Anahuac! remain at home". **Certificate of A. C. Allen and A. J. Yates, Velasco 26 August 1835**: about 25 July they "sailed in company with several other persons from the Town of Anahuac to visit several places on Galveston Bay", and about 10 August engaged a sloop "to sail from Anahuac for Velasco". **A Burnet/McComb precinct meeting (W. Scott chairman)** electing delegates to the convention |
| metapth80272 | 54, 26 Sep 1835, pp. 1, 3 | An open letter charging the former Political Chief over "the resolutions ... to Anahuac"; an editorial asking **"Did Miller directly or indirectly authorize Travis to capture the fort of Anahuac? Whose money did the committee give Capt. Tenorio?"** |
| metapth80273–80278 | 55–61, 3 Oct – 14 Nov 1835 | **No Anahuac item found.** Liberty appears only in advertisements and in "Troops from East of the Trinity" (10 Oct) |

**The *Telegraph and Texas Register*:**

| Ark id | Issue, date | Material |
| --- | --- | --- |
| metapth47872 | 10 Oct 1835 | Austin's committee: "An express has been sent to San Jacinto and Trinity"; asks for communication "with the people of Trinity, and of Bevil's Settlement" |
| **metapth47875** | **17 Oct 1835, pp. 3, 7** | **"Municipality of Liberty. — No members present"** at the first meeting; later **"delegates to the Convention, from the municipality of Liberty, have arrived": Henry Millard, Claiborne West, A. B. Hardin, Jas. B. Wood, Hugh B. Johnson, P. J. Menard** (names as read through damaged OCR); **11 Oct, "Mr. Joseph Bryan, from the Jurisdiction of Liberty, laid before this body sundry resolutions from the Committee of Safety of that place"** |
| metapth47877, 47881, 47885, 47888, 47896, 47898 | 26 Oct – 12 Dec 1835 | **No Anahuac item found** |

**So in October 1835 Anahuac speaks only through Liberty**, its municipality, whose committee of
safety and delegates were active. Anahuac was a precinct under a subalcalde, Willcox (S4).

### 1d. Where the sources disagree

| Question | Readings | Verdict here |
| --- | --- | --- |
| **Size of the fort** | 100 × 70 ft exterior, two corner redoubts, 50 × 35 ft brick building (Henson, S2); "about 30x40 feet in the clear" (G. E. Wilcox, S9); a bastion with 7-ft walls and an adjoining barracks with 4-ft walls (S17, 1976 marker); a bastion and a long barracks (Lewis plan, S17); "diamond-shaped", with bastions (THC 2001, S18); 30' × 40' adobe (S24, rejected) | **Henson's 100 × 70 for the enclosure; Wilcox's 30 × 40 as one redoubt, probably Fort Davis on the bluff** (`I-2`) |
| **Guns** | SW redoubt a six-pounder; two sixteen-pounders at the magazine bulwarks (S2); two 18-lb pivot guns (S17, 1976 marker); two six-pound iron guns (Wilcox, S9); "two large cannons placed on a platform" by the kiln prison (Labadie 1832, S9/S10); a four-pounder in the 1832 skirmish (S10); **none in June 1835** (S2); **round shot at Anahuac in November 1835** (S13) | **1832: guns of several calibres. October 1835: no mounted guns; round shot lying about.** A dismounted old gun is possible, not documented for 1835 |
| **Distance from fort to town** | "a half mile north of the bluff in the center of modern Anahuac" (S2); "about half a mile south of the town" (S9, 1898); "about one mile south" (S2 opening, S17); temporary fort "near the site of the present Chambers County courthouse" (S18); Fort Chambers halfway between (S4) | **Measured: courthouse to fort 5,084 ft = 0.96 mi.** Half a mile north of the fort puts the barracks at about y −2,640 in §8's frame; the courthouse is at y −4,968. **The 1830s town is placed along the bluff between the two, and not located more closely** (`I-4`) |
| **Height of the bluff** | "about thirty feet" (S5, 1831; copied in S6); "thirty feet" (S11, Henson); "precipitously about 15 feet" (S17 text); "30 to 40 ft. bluff" (S17 sketch) | **Measured: 18–20 ft at the fort, 21–24 ft on the terrace at the courthouse, falling to 0–4 ft below** (§2.2). The 1831 figure is high by about 10 ft. Subsidence and erosion have changed the ground, but nothing measured here accounts for ten feet (`I-9`) |
| **When the fort was built** | foundation completed 14 May 1831 (S2); "erected in 1832" (S9); Bradburn "laying the foundation for a fort" when the kiln prison was built in May 1832 (S10); in March 1831 the visitor saw only a barracks (S5) | **Begun 1831, still being built in 1832, never finished to plan as far as anything read says** (`I-1`) |
| **Where Travis and Jack were held in 1832** | a house contiguous to Bradburn's quarters, then a brick kiln (S9, S10); the wooden barracks used as jail (S2); "the fort" (1971 marker) | **All three, one after another** |
| **The calaboose in 1835** | "wooden calaboose was burned in December 1832" (S2); **Briscoe and Harris "put in the calaboose" in June 1835** (S9) | **A calaboose existed in June 1835.** Whether it was rebuilt or another building is unknown. The Hicks "outbuilding ... customs house or the jail" (S18) may be it (`I-5`) |
| **Name date** | Anahuac from January 1831 (S1); Perry's Point "until 1825" (1976 marker); "In 1825 Perry's Point ... was renamed Anahuac" (S4-Chambers County); "early Anahuac (1821)" (S4-Trinity Bay) | **January 1831.** Bradburn only arrived in October 1830 (S3), and the March 1831 visitor calls the place newly named (S5) |
| **Tenorio's arrival** | late January 1835 (S8, from Tenorio's letter of 31 January); January 1835 (S2, S4); "the fall of 1834" (S7); more troops in "May 1834" (Dilue Harris, per S8); "May of 1835" (S24) | **January 1835** |
| **Date of the capitulation** | landed 29 June, capitulation morning of 30 June (Travis 6 July; Tenorio 7 July; S8, S9); "June 20" (S3); "done on the 27th" (D. W. C. Harris 17 August, S9); "June 29" (S24) | **29–30 June 1835** |
| **Travis's numbers** | 25 (S8, Moore's list); "twenty men" (Travis, S9); about 30 with men who joined at Anahuac (Harris, S8); "about twenty" (S9) | **Twenty to thirty** |
| **Briscoe's arrest** | night of 12 June (Tenorio, S8; S3); Harris went to Anahuac on 10 June and was stopped "the evening previous to my intended departure" (S9) | **Night of 12 June 1835** |
| **T. J. Chambers's house** | "built in 1835" (S4-Chambers County); "Built in 1845" (Chambersea marker, 1968) | **Not resolved.** Do not draw it in 1835 without checking. The 1845 date fits the post office opening as Chambersea in 1844 (S4) |
| **Turtle Bayou Resolutions date** | 13 June 1832 (1968 marker; Holley, S6); settlers fled to Turtle Bayou on 12 June (S4-Turtle Bayou Resolutions); "June 5" (S23) | **13 June 1832**. Not in the game's month |

---

## 2. Documented: where the place was, and what has happened to the ground

### 2.1 The site, and the coordinate check

**The fort** stood on Perry's Point: "a bluff, called Perry's Point since 1816, overlooking the
entrance to the Trinity River" (S2), "at the edge of an upper terrace which drops precipitously ...
to the marshy delta of the Trinity River to the west" (S17). Wilcox puts its "western side fronting
and immediately on the bank" (S9). **Today that is Fort Anahuac Park, 1704 South Main Street**, and
the five markers there stand at about **29.7558, −94.6879** (S20). The park polygon runs from
29.7547 to 29.7584 N (S21).

**The town** lay north of the fort along the same bluff:
- Bradburn's temporary wooden fort (barracks, guardhouse, his quarters) was "near the site of the
  present Chambers County courthouse" (S18), or "a half mile north of the bluff in the center of
  modern Anahuac" (S2).
- In June 1832 the insurgents "occupied buildings in northern Anahuac" (S3).
- The emigrants had shelters on "the shore of Turtle Bay, now Lake Anahuac, located just north of the
  town", where the first cemetery was (S11).
- Labadie's house was near enough the bluff for women to be sent "to take shelter under the bluff
  close by" (S10).
- The landing was about half a mile from Bradburn's office (S10).

**Does the modern town sit on the 1835 site?** Broadly yes; in detail, no.
- The modern street grid is cardinal (east–west streets 88.2–91.5°, north–south 177.3–179.5°, S21).
  It belongs to the **Anahuac Townsite Company's development of the early 1900s** (S1).
- The townsite was fought over in court from 1838 to 1865 (S1, S4-Willcox).
- The place was called "unoccupied" in the 1880s–90s (S4-Chambers County).
- **No street or lot of the 1830s is known to survive in the modern plan.**

**Coordinate check: `HIST-TEX-010` / `docs/COLONIES.md` §3a / `scripts/build-colonies-map.mjs`,
Anahuac 29.77300, −94.68270 (GNIS 1329510).** Measured here on S20/S21 coordinates:

| From the GNIS point to | Distance | Bearing |
| --- | --- | --- |
| **Fort Anahuac markers (the fort)** | **6,498 ft = 1.23 mi** | **195°** |
| Chambers County Courthouse (S18's site of the 1830 barracks) | 1,433 ft | 203° |
| Bluff edge at the same latitude (§2.2) | about 1,050 ft | west |
| South end of Lake Anahuac (Turtle Bay) | 1,415 ft | 280° |
| Nearest OSM coastline | 3,931 ft | 233° |
| "Events at Anahuac" marker | 183 ft | 73° |

**Verdict.** The GNIS point is **on the right terrace, at or just past the north end of the documented
1830s town, and 1.23 miles from the fort.** For the colonies map that is well inside a mile-scale
error and needs no change. For any drawing of Anahuac, the fort is the one fixed point. It is the
thing a student would recognise, and it is **1.2 miles from the game's dot**.

### 2.2 The ground, measured

USGS 3DEP (S22). **North–south transects**, elevation in feet:

| Longitude | 29.752 | 29.755 | 29.758 | 29.760 | 29.762 | 29.764 | 29.766 | 29.768 | 29.770 | 29.772 | 29.774 | 29.776 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| −94.6880 (fort's line) | 18 | 19 | **3** | 1 | 4 | 3 | 4 | 4 | 2 | 0 | 7 | 1 |
| −94.6855 | 19 | 18 | 19 | 20 | 19 | 20 | 21 | 21 | 22 | 23 | 6 | 1 |
| −94.6830 | 17 | 17 | 17 | 19 | 19 | 20 | 20 | 20 | 21 | 22 | 21 | 8 |
| −94.6800 | 17 | 17 | 17 | 19 | 20 | 19 | 19 | 18 | 20 | 20 | 19 | 21 |

**East–west transects** locate the bluff edge, where the ground drops from about 18–24 ft to 0–4 ft:

| Latitude | Bluff edge (lon) | In §8's frame (x, y) |
| --- | --- | --- |
| 29.7535 | −94.6885 | −195, +827 |
| **29.7558 (the fort)** | **−94.6885** | **−195, −12** |
| 29.7580 | −94.6875 | +121, −815 |
| 29.7620 | −94.6864 | +470, −2,274 |
| 29.7660 | −94.6865 | +438, −3,733 |
| 29.7700 | −94.6865 | +438, −5,193 |
| 29.7730 | −94.6860 | +596, −6,287 |

Other points: fort markers 17.8–18.6 ft; 200–600 ft east of the fort 19.7–20.1 ft; courthouse 21.3 ft;
GNIS point 22.5 ft; Chambersea 23.5 ft; Round Point, 1.5 mi south, 18.5 ft; below the bluff west of
the fort 3.1 ft at 100 ft and −0.4 ft at 400 ft; the south end of Lake Anahuac 3.2 ft.

**Five things follow.**

1. **Anahuac stands on a level terrace 17–24 ft above the sea.** It rises gently northward from the
   fort (18–20 ft) to the town (21–24 ft). That is the Pleistocene terrace S17 describes. It is
   lower than Harrisburg's (32–34 ft) and far higher than Velasco's (5–7 ft).
2. **The bluff is real and abrupt.** At the fort the ground falls about 16 ft in 100 ft. It drops to
   9.8 ft at 150 ft west of the marker, 5.5 ft at 250 ft and 3.1 ft at 350 ft.
3. **The fort stands on the terrace's westernmost projection.** North of 29.757 the bluff edge steps
   back east by 300 ft, then by 600–650 ft, and runs nearly straight north (bearing about 5°) past
   the town. **That projection is the "point" in Perry's Point.** The name fits the ground, which is
   a check on the location (`I-3`).
4. **Below the bluff is low marsh at 0–4 ft.** OSM maps it as salt marsh and wetland (S21). Open bay
   water lies about 340 ft west of the fort marker, but about 1,900 ft west of the bluff at the
   town's latitude.
5. **Every source's "thirty feet" is too high for this ground by about ten feet** (§1d). The bluff
   still gives the only elevated, defensible point on this shore.

### 2.3 What has happened to the ground since: check before measuring anything

| Date | What happened | Source |
| --- | --- | --- |
| Jul–Dec 1832 | Fort dismantled by the departing garrison; wooden parts gutted by fire (Nov); wooden calaboose burned (Dec) | S2 |
| 1832–c.1980 | **"150 year long mining of the site for reusable brick by the local inhabitants"** | S2, S17 |
| 1838–1865 | Chambers v. Willcox townsite litigation; "Chambersea" | S1, S4 |
| 1846 | "Two ponds" filled near the fort | S17 sketch |
| 1862 | Fort Chambers, a Confederate earthwork, built halfway between the old fort and the town, "opposite Brown's Flats" | S4, S9 |
| 1894–1898 | Cummings sawmill at Anahuac | S1 |
| 1902 → | **Lone Star Canal** (rice irrigation) | S1 |
| early 1900s | **Anahuac Townsite Company replats and develops the town**; county seat 1908; courthouse 1912, rebuilt 1937 | S1, S20 |
| 1938 | County surveyor's field notes of the fort foundations | S2 |
| "sometime after the 1930s" | **Trinity River rechannelled; erosion drops the remains of the SW redoubt into the water** | S2 |
| 1940s | **Turtle Bay dammed as Lake Anahuac**; Fort Anahuac Park built (1946); **rubble buried** | S2, S4-Chambers County |
| 1967–68 | Southwestern Historical Exploration Society dig; about 75% of the site disturbed | S17 |
| 1977; 2001 | Magnetometer surveys (TAC; THC) | S17, S18 |
| 2003–2004 | Hicks & Company testing | S18 |
| recent | Chambers–Liberty Counties Navigation District canal along the town's bay edge (29.7734 N); Acacia survey for two monuments | S21; §1b |

**Lewis's 1968 plan (S17) draws an "approximate bluff line — 1832" well west of the "bluff line —
1960".** If that is right, **the 1835 bluff edge at the fort stood some tens of feet farther out than
today's**, and the modern edge has eaten into the fort. The distance cannot be read off the scan
(`I-8`). **So: take the terrace height and the bluff's line from the modern ground; take the fort's
west face as at or just beyond today's edge; take the 1835 shoreline and marsh width as unknown.**

---

## 3. Documented: the fort

### 3.1 What it was meant to be (1830–32)

- One of six garrisons established under the Law of 6 April 1830 at "strategic entrances to Texas"
  (S2). It was **customs post and garrison together**: George Fisher's customhouse from November 1831
  (S4-Fisher).
- **Built to a plan.** "Bradburn brought plans and a cardboard fort with him" (S2), "built from a
  model given to Col. Bradburn by his superiors in Mexico" (S17).
- **Brick, made on site.** Clay was dug in the winter of 1830–31. Convict soldiers made bricks from
  March 1831, in "two large kilns" (S2, S18, S23). Later, prisoners were made "to tramp the clay" and
  mould bricks (S9, S10). Colonial carpenters and masons were conscripted (S9, S17). The foundations
  found in 1967 were **mortared brick "laid over 3-inch clamshell base"**, eight to ten courses (S17).
- **Plan (Henson, S2):**
  - exterior walls **100 × 70 ft**;
  - **two redoubts diagonally opposite at the SW and NE corners**;
  - the SW redoubt **"Fort Davis"**, overlooking the bay, up to 50 men and a six-pounder;
  - the NE redoubt guarding the land approach;
  - **a reinforced-brick building about 50 × 35 ft inside**;
  - cavalry horses tethered between the redoubts;
  - **an excavated passage to the powder magazine on the east side**;
  - **two bulwarks, Hidalgo and Morelos, near the brick kilns**, each with a sixteen-pounder.
- **Plan (Wilcox, S9, as a boy's memory of the ruin):**
  - "about 30x40 feet in the clear";
  - west side on the bank, with the bank "excavated for a distance of ten feet" and closed with
    "heavy walls of brick";
  - "lighter brick walls" on the other three sides;
  - **two underground passages from the east side to "a large magazine some forty yards back on the
    hill"**;
  - "about four feet thick" on the exposed side;
  - two iron six-pounders.
- **Plan (S17, 1976 marker):** "brick walls more than seven feet thick"; "two 18 lb. pivot guns"; "the
  barracks adjoining the fort had walls about four feet thick"; a tunnel to the powder magazine.
- **Plan (Lewis 1968 excavation, S17):**
  - a **five-sided "bastion"** whose outer faces meet at the 1960 bluff line;
  - behind it a **long rectangular "barracks"** with "exposed wall foundations, 8 courses of mortared
    brick";
  - a "brick ramp slanting down" at the bastion–barracks junction;
  - "officers' quarters" in dashed outline beyond;
  - the kiln about 100 ft south-east; "4 or 5 brick floor foundations" about 150 ft north.
- **Plan (THC magnetometer 2001, S18):** about half of a **diamond-shaped** fort and **one bastion**.
  **Plan (Hicks 2003–04, S18):** a plaza with a brick-rubble wall; brick-lined drains leading water
  away; a **wood-framed outbuilding with an intact floor and "a front porch facing the water"**.

### 3.2 What was there in October 1835: the brief's first question

**A ruin, empty, with the marks of three reuses on it.**

| Date | State | Source |
| --- | --- | --- |
| July 1832 | "The troops dismantled the fort when they left" | S2 |
| Nov 1832 | "a fire in November gutted the wooden parts" | S2 |
| Dec 1832 | "The wooden calaboose was burned" | S2 |
| 1832 → | "practical residents removed bricks for fireplaces and foundations" | S2 |
| Jan 1835 | Tenorio "arrived ... to reopen the fort, but it was in such disrepair that he asked his superiors for wood to make repairs" | S2 |
| **3–4 May 1835** | **"the lumber which had been sent him 'for the purpose of rebuilding Fort Dabis,' had been burned during the night"** | S8 (Tenorio 18 May) |
| 12 June 1835 | A guard at the collector's office; soldiers on the beach; a calaboose in use | S8, S9 |
| **29 June 1835** | **"the Mexicans had made use of the delay to flee to the woods, and the Texans found the fort deserted"** | S8 |
| 30 June 1835 | Capitulation; 64 stands of arms handed over; the troops embark "bag and baggage" | S9 |
| Sep 1835 | Tenorio ordered back (S4); 200 men rumoured by water (S9); **neither came** | S4, S9 |
| **Nov 1835** | **"considerable round shot at Anahuac"** | S13 |
| after 1835 | "The fort was never used again; the land became private property" | S2 |

**So, for the game's month:** brick foundations and low broken walls, probably highest on the bank
side where the walls were heaviest; no roofs and no wooden parts; heaps and gaps where bricks had been
taken; perhaps traces of Tenorio's half-year of use (a fire place, a repaired corner, a guard post).
**No flag, no garrison, no guns mounted, and round shot somewhere about the place.** Heights, gaps and
what Tenorio repaired are all unknown (§6).

### 3.3 Reconciling the four sizes: an inference, not a finding

**`I-2`: Henson's 100 × 70-ft enclosure is the whole work. Wilcox's "30x40 in the clear" is its
bay-side redoubt, Fort Davis. Lewis's "bastion" is the same redoubt as it survived on the bluff edge,
and his "barracks" is Henson's brick building.** Five things support this:

1. Henson places the redoubt with the six-pounder "overlooking Trinity Bay". Wilcox places his work
   "immediately on the bank". Lewis places his bastion on the bluff edge.
2. Wilcox's work is "30x40 feet in the clear", which is an interior. That is about the size of a
   corner redoubt in a 100 × 70 ft work, and far too small for 50 men plus a 50 × 35 ft building.
3. The 7-ft bastion walls and the 4-ft barracks walls (S17) are two different structures, matching
   Lewis's two.
4. Wilcox's "magazine some forty yards back on the hill" reached by passages matches Henson's
   "excavated passage ... with the powder magazine on the east side".
5. "Diamond-shaped" (S18) describes a bastion trace, the corner redoubts seen as diamonds on a
   magnetometer plot.

**Against it:** Wilcox says only two guns "in the fort", and TSHA says the SW redoubt fell into the
water after the 1930s, while Lewis found a bastion in 1968. **Lewis's bastion could be the NE
redoubt**, or erosion may have taken only part of the SW one. **Not resolved. The Hicks reports and the
1938 field notes would settle it.**

---

## 4. Documented: the town

### 4.1 Was there a town plan?

**There was a survey of lots, and no plan survives that was found.**
- Bradburn landed "with orders to establish a garrison and a town" (S3).
- A "City Surveyor", Dr. Patrick, was dismissed by Bradburn in 1832 (S10).
- Labadie received "a town lot on which to build his home and office" (S4-Labadie).
- Bradburn's council "distributed lots to the inhabitants" (S6).
- The townsite was litigated from 1838 (S1).

Against this, the 1831 visitor saw "log houses and huts" and "poor shops" (S5), and in 1832 the
emigrants lived in shelters on Turtle Bay (S11). **Draw lots as unmarked ground and houses loosely
placed, not a gridded town** (`I-4`).

### 4.2 How big the place was

| Date | Figure | What it counts | Source |
| --- | --- | --- | --- |
| 26 Mar 1831 | **15–20 log houses and huts; 7 poor shops; one barracks 150 × 20 ft** | the town, seen | S5 |
| 1 Jun 1831 | **"upwards of 300 besides 170 soldiers"** | a local census, not found | Labadie via S11 |
| May 1832 | 285 men and 10 officers (about 100 of them at Velasco after March) | the garrison | S2 |
| after Jul 1832 | "the remaining inhabitants of the town began to drift away" | — | S11 |
| 6 Sep 1834 | "Of all the 72 heads of colonists, only 9 are left" | the German emigrants | Willich via S11 |
| 1834 | **town of Anahuac: 50** | the town | S12 |
| 29 Dec 1834 | **124 individuals**, including about 30 enslaved people in one planter's household at Smith's Point | the precinct: Anahuac, Double Bayou, Smith Point, High Island | S11 |
| 1834 | imports of the Department of Nacogdoches, "chief port" Anahuac: **$265,000** | trade, not people | Almonte via S8 |
| 1835 | Anahuac "the chief port of entry east of the Brazos" | — | S14 |
| 4 May 1835 | **"some twenty or twenty-five men"** at the tariff meeting | adult men of the town and vicinity | S8 |
| pub. 1836 | "about thirty houses besides the building erected as barracks" | count of unknown date (§1b) | S6 |
| pub. 1836 | "the third town of importance in the district of Nacogdoches" | — | S7 |

**For October 1835:** a town of about 50 people in 1834, fewer after Dobie left and Freeman died in
1835, with twenty to twenty-five men able to gather for a meeting in May. **Draw houses for about ten
to fifteen households, and some empty ones left from 1831–32** (`I-6`).

### 4.3 People and buildings attested for 1835

| Thing | What is documented | Standing Oct 1835? | Position | Source |
| --- | --- | --- | --- | --- |
| **The fort ruin** | §3 | **YES, as a ruin** | **Perry's Point; the markers ±200 ft** | S2, S8, S17 |
| **Charles Willcox's general store** | opened 1831 (with Labadie until 1833), kept "until at least 1875"; Willcox subalcalde in 1835; "My respects to Wilcox" (Travis, 31 Aug 1835) | **YES** | unknown | S4-Willcox, S9 |
| **Andrew Briscoe's store** | opened 1835 "with a shipment of goods"; "a large stock of goods"; under guard 12 June; **close enough to the beach to wheel a barrow there, with a bank or hill between** | **the building, probably; Briscoe himself was with the Liberty Volunteers by late October** | **inland from and above the beach** (relationship documented) | S4-Briscoe, S9, S14 |
| **The collector's office / custom house** | an office "the collector" feared Briscoe "might attack", 11 June; collectors González and Alegría in spring 1835 | **the building probably; no collector** | unknown; Hicks's porched outbuilding "facing the water" may be it (`I-5`) | S8, S18 |
| **The calaboose** | Briscoe and Harris held there, 12–13 June 1835 | probably | unknown | S9 |
| **Benjamin Freeman's house** | meeting of 20–25 men, 4 May 1835; Freeman single, farmer, 26 in 1834; **died 17 Aug 1835** | the house probably; empty or passed on (`I-7`) | unknown | S8, S11 |
| **Freeman's grave and the first cemetery** | marble stone "Died August 17 1835"; cemetery at the emigrants' Turtle Bay site, just north of town | **the grave, yes; the stone's date of setting unknown** | shore of Turtle Bay (Lake Anahuac), north of town | S11 |
| **Dobie's store** | merchant; left for Virginia June 1835, died there | unknown | unknown | S11 |
| **John P. Brown, grocer; Henry and Mary Miller, hatters; the Hodges family, sawyers** | 1834 census | probably | unknown | S11 |
| **Labadie's house, yard and fence** | 1831–32, near the bluff, with trees; Labadie on Lake Charlotte from 1833; Capt. Dorsatt's family in it in July 1832 | unknown | near the bluff | S4-Labadie, S10 |
| **The landing** | "about half a mile" from Bradburn's office; a schooner "in the channel at Anahuac" (1832); boats at the beach (1835) | **YES, as a beach and landing** | below the bank | S9, S10 |
| **Round shot** | "considerable round shot at Anahuac", 3 Nov 1835 | **YES** | unknown | S13 |
| **Bradburn's wooden barracks, guardhouse and quarters** (1830–32) | 150 × 20 ft; "later used as the jail that held William B. Travis" | **NO. The wooden calaboose burned December 1832** (if the same building) | near the courthouse (S18) or half a mile north of the bluff (S2) | S2, S5, S18 |
| **The brick kilns** | two large kilns; one emptied and walled in as a prison, May 1832, "two large cannons placed on a platform near by"; a possible kiln site 100 ft SE of the fort | **the kiln sites, probably, as brick-rubble mounds** | 100 ft SE of the fort (possible); "near the sites of the brick kilns" for the Hidalgo and Morelos bulwarks | S2, S9, S17 |
| **T. J. Chambers's house** | "built in 1835" (S4) vs "Built in 1845" (marker) | **not established** | 202 Cummings St. today | §1d |

### 4.4 What happened here in 1835

- **January**: Tenorio arrives with two officers and 34 men "to assist in re-establishing there the
  custom house" (S8).
- **April**: The Liberty ayuntamiento urges obedience to the revenue laws (17 April). Alegría is
  relieved by González at Anahuac (25 April) (S8).
- **3–4 May**: Lumber for rebuilding Fort Davis is burned. The tariff meeting is held at Freeman's
  house, with William Hardin in the chair (S8).
- **9 May**: The collector and his deputy leave for Mexico (S8).
- **12 June**: Briscoe's box of brick ballast; Smith shot; Briscoe and D. W. C. Harris in the
  calaboose (S8, S9).
- **22 June**: The volunteers' pledge at San Felipe (S19).
- **29–30 June**: The *Ohio*, the six-pounder, the deserted fort, the capitulation (S8, S9).
- **11 July**: Briscoe's letter from Anahuac to the *Texas Republican* (S15).
- **26 July**: Captain Thompson of the *Correo*, at anchor "in this port", proclaims to "the citizens
  of Anahuac" against militia meetings called by Judges Williams and Hardin (S15).
- **About 25 July and 10 August**: A pleasure party sails "from the Town of Anahuac" round Galveston
  Bay, and a sloop is hired "to sail from Anahuac for Velasco" (S15).
- **17 August**: Benjamin Freeman dies (S11).
- **31 August**: Travis writes to Briscoe warning of 200 men "by water at Anahuac": "Keep a bright
  look out to sea. Allow no pilots in the bay to assist them" (S9).
- **September**: Tenorio is ordered back to Anahuac (S4) and does not come.
- **7 October**: At Smith's Point, 18 miles south in the same precinct, William M. Smith kills his
  brother-in-law Moses Alfred Carroll (S11).
- **11–17 October**: The Liberty jurisdiction's committee of safety and Consultation delegates reach
  San Felipe (S16).
- **28 October**: Briscoe is captain of the Liberty Volunteers at Concepción (S4-Briscoe).
- **3 November**: Austin asks for "considerable round shot at Anahuac" (S13).
- **November**: "Since the garrison at Anahuac had been forced to surrender, the schooners were coming
  to Harrisburg frequently" (S14).

### 4.5 NOT there in October 1835

| Thing | Why not | Source |
| --- | --- | --- |
| **A garrison, a flag, mounted guns** | gone 30 June 1835; never returned | S8, S9 |
| **A customs collector** | González left 9 May; no collector recorded after 30 June | S8 |
| **Bradburn's 1830 wooden barracks** | burned December 1832 (as the calaboose) | S2 |
| **A wharf** | not mentioned by anyone. A beach, a bank and a landing | S9, S10 |
| **A ferry** | none documented at Anahuac | — |
| **Fort Chambers** | 1862 | S4 |
| **Lake Anahuac** | Turtle Bay was open water until the 1940s | S4, S11 |
| **The street grid, courthouse, canal, park** | 1902 onward | S1, S2 |
| **"Chambersea"; a post office** | 1844 onward | S4 |
| **The German emigrants' colony** | dispersed by 1834 | S11 |
| **Labadie** | on Lake Charlotte from 1833 | S4 |
| **Dobie** | left June 1835 | S11 |
| **Briscoe in person** (late October) | with the Liberty Volunteers | S4 |

---

## 5. Documented: the water and the roads

### 5.1 The water

- **"The seven mouths of Trinity or Trinidad river open into the bay near this corner"**, with bars
  "sometimes too shallow even for row boats". Tides are "very small", raised by southerly gales, which
  "also occasionally render the water too brackish for use" (S5, 1831).
- **The bay "spreads out about twenty miles across"** in front of the bluff (S5).
- **A channel off the town:** a schooner lay "in the channel at Anahuac" in 1832 (S10).
- **Shallow water off the landing:** the sloop *Ohio* grounded "within about half a mile of the shore"
  and the party rowed in (S8).
- **Vessels came by the whole length of Galveston Bay:** over the bar at Bolivar and past Red Fish
  Bar. The brig *Climax* was wrecked at Bolivar in 1831; the second *Climax* sank "at Red Fish Reef
  off Edwards Point" in 1834 (S11). The 1831 visitor's chapter heading reads "The Harbor. — Redfish
  Bar. — Edwards's" (S5). **No depth for Red Fish Bar or the Anahuac channel was found** (§6).
- **The trade of the place was by water.** It was "the chief port of entry east of the Brazos" (S14),
  and Harris came 50 miles from Harrisburg to buy goods (S9). In 1832 Anahuac "was out of the way of
  the main shipping lanes, and the waters that had to be navigated to reach it were treacherous"
  (S18, a modern summary).
- **Mexican warships in the bay in 1835:** the *Moctezuma* in spring, which lent Tenorio three muskets
  (S8), and the *Correo* in July (S15).

### 5.2 The roads

- **North to Turtle Bayou and Liberty.** The 1832 force came from Liberty by Minchey's and camped "on
  the west side of Turtle Bayou — White's crossing", then "entered Anahuac at or before noon" (S10).
  **Taylor White's was "some six miles distant"** (S10), about five miles in 1831 (S5). **Bradburn's
  pursuer reached Liberty from Anahuac by seven the next morning, "a distance of twenty-five miles"**
  (S10).
- **West, the long way round.** Harrisburg → Lynch's on the San Jacinto → Winfree's → Barrow's →
  Heyne's on Old River near the Trinity → a swim for the horses across the Trinity → twelve miles of
  bottomland timber → Turtle Bayou → prairie → Anahuac (S5, 1831). Heyne's was "three or four miles"
  from Anahuac by water; "The land route is circuitous, and much further."
- **Not on the Atascosito Road** (Corrections).

---

## 6. Unknown: what a layout would need and no source read supplies

1. **The fort's actual trace**: which of the §3.3 readings is right; the orientation of the 100-ft
   side; the redoubts' shape and faces. (Hicks 2003/2004; the 1938 field notes; THC 2001.)
2. **Wall heights** of any part, in 1832 or 1835.
3. **The position of the magazine and the Hidalgo and Morelos bulwarks**, beyond "east" and "forty
   yards back on the hill".
4. **The 1835 bluff edge and shoreline** at the fort and below the town (§2.3).
5. **Where any house, store, the office or the calaboose stood.**
6. **Where the landing was**, beyond half a mile from the commandant's quarters and below a bank.
7. **Depths**: the Anahuac channel, the Trinity bars, Red Fish Bar.
8. **What Tenorio repaired or built in January–June 1835**, and where his men lived.
9. **Where the round shot lay**, and whether any gun remained.
10. **What the houses were built of.** "Log houses and huts" in 1831 (S5). Brick was made on site,
    and settlers bought it (S23, citing Henson) or took it from the ruin for chimneys (S2). Nothing
    read describes a house of 1835.
11. **The lot survey**: its orientation, module and extent.
12. **Whether T. J. Chambers's house existed in 1835.**

---

## 7. Inferred: things that follow but that nobody states

Each must be labelled as inference if used.

- **`I-1`. The permanent fort was never finished to plan.** Foundations were done in May 1831 (S2),
  Bradburn was still "laying the foundation" in May 1832 (S10), and the garrison dismantled the work
  in July 1832 (S2).
- **`I-2`. Henson's enclosure, Wilcox's redoubt and Lewis's bastion and barracks are one fort seen
  three ways** (§3.3). The load-bearing inference of §8.2.
- **`I-3`. Perry's Point is the terrace's westward projection where the markers stand** (§2.2). This
  is ground matched to a name, not a document.
- **`I-4`. The 1835 town lay along the terrace north of the fort, between about y −800 and y −5,500
  in §8's frame, scattered and not gridded.** The anchors are the barracks near the courthouse (S18)
  or half a mile north of the bluff (S2), Labadie's house near the bluff (S10), the landing half a
  mile from the quarters (S10), Turtle Bay just north (S11), and Fort Chambers halfway (S4).
- **`I-5`. Hicks's wood-framed building with a porch facing the water is the 1831–35 customs office or
  the calaboose of June 1835.** The archaeologists' own suggestion (S18), not a finding.
- **`I-6`. October 1835 had about ten to fifteen occupied households in the town and some empty
  houses** from the 1831–32 boom. This follows from 50 people in 1834, 20–25 men at a meeting, and a
  census precinct of 124 spread over three places.
- **`I-7`. Freeman's house stood empty or had passed to someone else by October.** He was single and
  died in August 1835 (S11).
- **`I-8`. The bank below the fort has retreated since 1835.** Lewis's 1832 bluff line (S17) and
  TSHA's redoubt lost to erosion (S2) both say so. So the fort's west face stood a little back from
  the 1835 edge, not on today's.
- **`I-9`. The 1831 "thirty feet" was measured from the water, or overstated.** Part of the
  difference from the measured 18–20 ft may be subsidence on upper Galveston Bay. That was not
  measured here.
- **`I-10`. Houses in 1835 were mostly log and frame with brick chimneys and footings robbed from the
  fort.** From "log houses and huts" (S5), a sawyer family in the census (S11), and "bricks for
  fireplaces and foundations" (S2).
- **`I-11`. Timber stood behind the terrace.** Pine, gum, oak and hickory are on the terrace today
  (S17). The 1831 visitor saw "groves and islands of trees" behind the town and bottomland pine and
  cypress toward the Trinity (S5). In 1832 a cannonball cut tree limbs near the bluff (S10).

---

## 8. A suggested layout sketch

**In two vocabularies, as for Velasco.** The fort is in `public/alamo-layout.js` terms: feet, a local
plane, `walls` with `thickness`, `heightFeet` and `material`, and `rooms`. The place is in
`public/bexar-layout.js` terms: a water body, roads with widths, and `building(id, sprite, x, y,
heightFeet)`.

**Read this first.**
- **Measured:** the terrace height, the bluff line, the marker positions, the distance to the town
  and the park extent.
- **Documented, conflicting:** the fort's dimensions (§1d).
- **Invented:** every building position, and everything marked `INVENTED`. If this is built it
  should be registered as fiction under a new `FIC-` ID with a note like the one at the head of
  `BEXAR_LAYOUT`.

### 8.1 Frame

| Thing | Value | Status |
| --- | --- | --- |
| Units | feet | — |
| Origin | **1976 Fort Anahuac marker, 29.755767, −94.687883** | marker coordinate (S20) |
| Axes | +x east, **+y south**, north-up. There is no 1830s grid to align to | choice |
| Terrace | **18–20 ft at the fort, rising to 21–24 ft at y −5,000** | **measured** (§2.2) |
| Marsh below the bluff | **0–4 ft** | **measured** |
| Bluff edge | polyline `(-195,+827) (-195,-12) (+121,-815) (+470,-2274) (+438,-3733) (+438,-5193) (+596,-6287)` | **measured** (§2.2) |
| Town envelope | x +500…+1,700, y −800…−5,500 | `I-4` |
| Bounds | `{x:-2500, y:-6800, width:5000, height:8000}` | frame choice |

```
// Measured positions in this frame (S20, S21). MARKERS, NOT BUILDINGS.
fort-marker-1976           x     0, y     0
fort-marker-1936           x   -37, y  -140
bradburn-marker            x    96, y   -60
anchor-2005                x  -111, y    12
park-polygon               x -248..+1248, y +408..-977
courthouse-2018            x  1082, y -4968   // S18: Bradburn's 1830 wooden barracks "near" here
chambersea-1968            x   982, y -5515
gnis-anahuac (HIST-TEX-010) x 1642, y -6287
lake-anahuac-south-end     x   248, y -6531   // Turtle Bay in 1835
nearest-coastline-to-fort  x  -335, y    61
```

### 8.2 The fort, in `alamo-layout.js` terms

**October 1835: the 1831–32 brick work as a robbed ruin, empty.**

```
// FORT ANAHUAC, 1831-32 Mexican brick work, as it stood in October 1835.
// Enclosure 100 x 70 ft, two diagonal redoubts, inner brick building 50 x 35: DOCUMENTED (Henson, S2).
// Redoubt 30 x 40 clear, west face on the bank: DOCUMENTED (Wilcox 1898, S9).
// Wall thicknesses 7 ft (bastion) and 4 ft (barracks): DOCUMENTED (S17, 1976 marker) -- marker-grade.
// Reconciliation of the above: I-2. Orientation (long side N-S along the bluff): INVENTED.
// Position: west face at today's bluff edge (x -195); 1835 edge a little further west (I-8).
const fortOrigin = { x: -195, y: -50 };        // NW corner of enclosure. INVENTED within +/-150 ft
enclosure: { x: -195, y: -50, width: 70, height: 100, material: 'brick on clamshell footing' }

walls: [
  // Bay (west) face: heavy wall closing the cut bank -- DOCUMENTED form (S9); 7 ft (S17)
  wall('west', {x:-195,y:-50}, {x:-195,y:50}, {thickness:7, heightFeet:4 /* INVENTED ruin height */,
       material:'brick', state:'robbed, broken'}),
  // Other three faces: "lighter brick walls" (S9); thickness INVENTED at 2.5
  wall('north', {x:-195,y:-50}, {x:-125,y:-50}, {thickness:2.5, heightFeet:2, state:'mostly footing'}),
  wall('east',  {x:-125,y:-50}, {x:-125,y:50},  {thickness:2.5, heightFeet:2, state:'gapped'}),
  wall('south', {x:-195,y:50},  {x:-125,y:50},  {thickness:2.5, heightFeet:2, state:'gapped'}),
]
rooms: [
  // "Fort Davis", SW redoubt on the bluff: 30 x 40 clear (S9), diamond trace (S18), 6-pdr in 1832 (S2)
  room('fort-davis', 'SW redoubt "Fort Davis"', -215, 20, 40, 30, 'e',
       {walls:7, heightFeet:5 /* INVENTED */, plan:'bastion (diamond) -- form INVENTED', guns:0}),
  // NE redoubt guarding the land approach (S2); size INVENTED as a copy of Fort Davis
  room('ne-redoubt', 'NE redoubt', -135, -70, 30, 30, 's', {walls:4, heightFeet:3, guns:0}),
  // Inner brick building ~50 x 35 (S2); 4-ft walls (S17); roofless since Nov 1832 fire (S2)
  room('brick-building', 'Brick building (barracks)', -185, -35, 35, 50, 'e',
       {walls:4, heightFeet:6 /* INVENTED */, roof:false}),
]
props: [
  {id:'magazine',     x: -5,  y: 0,   note:'"some forty yards back on the hill", underground (S9); east (S2)'},
  {id:'passages',     from:{x:-125,y:-10}, to:{x:-5,y:0}, note:'two underground passages (S9), collapsed -- INVENTED'},
  {id:'kiln-site',    x: -95, y: 120, note:'"possible location of the kiln ... about 100 feet southeast" (S17)'},
  {id:'brick-floors', x:-120, y:-210, note:'"4 or 5 brick floor foundations" ~150 ft N (S17); date UNKNOWN'},
  {id:'roundshot',    x: -60, y: 10,  note:'"considerable round shot at Anahuac", Nov 1835 (S13); position INVENTED'},
  {id:'brick-heaps',  x:-150, y: 60,  note:'bricks taken "for fireplaces and foundations" (S2); I-10'},
  {id:'tenorio-lumber-ash', x:-110, y:-60, note:'lumber for Fort Davis burned 3-4 May 1835 (S8); position INVENTED'},
]
state1835: 'deserted since 30 June 1835; no roof, no timber, no flag, no mounted gun; low brick walls
            highest on the bay face; footings elsewhere; brick heaps and robbed gaps.'
```

**Four rules for drawing this fort, all documented:**

1. **It is brick, not stone, not timber, not adobe** (S2, S9, S17).
2. **It sits on the edge of a 16–20-ft bluff over marsh and the bay, on the point** (S5, S17, §2.2).
3. **It is a ruin in October 1835, and nobody is in it** (§3.2).
4. **No mounted guns. Round shot, yes** (S2, S13).

**If an 1832 arc is ever drawn**, restore the walls and roofs, put a six-pounder in Fort Davis
(S2, or iron six-pounders per S9), add the Hidalgo and Morelos bulwarks by the kilns, a kiln prison
with guns on a platform (S9), the wooden barracks 150 × 20 ft near the courthouse (S5, S18), and 285
men. **Do not mix the two states.**

### 8.3 The built place, in `bexar-layout.js` terms

**Draw about fifteen houses and shops, some empty. Not a gridded town.**

| id | Building | Documented | sprite | x, y | heightFeet |
| --- | --- | --- | --- | --- | --- |
| `anh-willcox-store` | **Charles Willcox's general store** | exists 1831–1875; Willcox subalcalde 1835 | `trading-house` | +900, −3,600 `INVENTED` | 18 |
| `anh-briscoe-store` | **Andrew Briscoe's store**; stock of goods; Briscoe away | exists 1835; **near and above the beach** | `trading-house` | +620, −3,000 `INVENTED`, **within 150 ft of the bluff edge** | 18 |
| `anh-custom-office` | **The collector's office**, empty; wood frame, porch to the water (`I-5`) | office exists June 1835 | `storehouse` *stand-in* | +560, −2,650 `INVENTED`, facing west | 16 |
| `anh-calaboose` | **The calaboose** | exists June 1835 | `cabin-small` *stand-in* | +760, −2,700 `INVENTED` | 12 |
| `anh-freeman-house` | **Benjamin Freeman's house**, where 20–25 men met on 4 May 1835 | exists; owner dead Aug 1835 (`I-7`) | `house-round-log` | +1,300, −4,200 `INVENTED` | 14 |
| `anh-dorsatt-labadie` | **Labadie's former house, yard and fence, near the bluff** | exists 1832; 1835 unknown | `cabin-wide` + `fence-rail` | +650, −2,000 `INVENTED` | 15 |
| `anh-house-1` … `-8` | **Occupied log houses** (families of the 1834 census) | count inferred (`I-6`) | cabin/log set | scattered, x +600…+1,600, y −1,500…−5,200 `INVENTED` | 12–16 |
| `anh-empty-1` … `-4` | **Empty houses from 1831–32** | `I-6` | `cabin-weathered`, `cabin-ruin` | scattered `INVENTED` | 12–14 |
| `anh-barracks-site` | **Burned ground of Bradburn's 1830 barracks**, 150 × 20 ft | building documented; **gone by 1835** | none; ground mark only | near the courthouse, +1,050, −4,900 (S18) **or** y −2,640 (S2) | — |
| `anh-landing` | **Beach and landing below the bank**; skiffs; a sloop or schooner lying off in the channel | documented class (S8, S9, S10) | `skiff` | +300, −3,000 `INVENTED`, at the foot of the bluff | — |
| `anh-turtle-bay-graves` | **The first cemetery, with Freeman's marble stone** | documented (S11) | none; see §8.6 | +300, −6,300 `INVENTED`, on the Turtle Bay shore | 3 |
| `anh-mexican-lumber-ash` | see §8.2 | — | — | — | — |

**Around it:**
- the terrace running back as prairie with "groves and islands of trees" (S5);
- pine, gum and oak behind (S17);
- **Turtle Bay open to the north**, not a lake;
- the Trinity's mouths and marsh to the west and north-west;
- **the bay spreading twenty miles to the south-west**;
- Round Point and the prairie toward Double Bayou and Smith's Point to the south;
- **the track north to Turtle Bayou and Liberty**.

`HISTORY.md`'s representation limits apply. The precinct's largest household held about thirty
enslaved people (S11). The 1831 garrison gave asylum to men who had escaped slavery in Louisiana, and
that was one of the settlers' grievances (S3, S7). A German colonist's letter of September 1834, printed
with the census, records the sale of a Scottish woman and her daughter for twenty dollars and a horse
(S11). **None of this is scenery.**

### 8.4 The water and the ground

```
// TRINITY BAY (the NE corner of Galveston Bay) below Perry's Point.
bluff: { id:'anahuac-bluff', heightFeet: 17,   // MEASURED: 18-20 terrace, 0-4 marsh
  line: [{x:-195,y:827},{x:-195,y:-12},{x:121,y:-815},{x:470,y:-2274},{x:438,y:-3733},
         {x:438,y:-5193},{x:596,y:-6287}],     // MEASURED 2026 edge; 1835 edge a little west (I-8)
  note:'the bank "descends abruptly" (S5); women sheltered "under the bluff" (S10)' }
marsh: { id:'trinity-delta-marsh', elevationFeet:[0,4],   // MEASURED
  widthFeet:{ atFort: 340, atTown: 1900 },               // MEASURED today; 1835 UNKNOWN
  note:'the "marshy delta of the Trinity" (S17); "seven mouths" near this corner (S5)' }
bay: { id:'trinity-bay', note:'"spreads out about twenty miles across" (S5). Tides very small (S5).' }
channel: { note:'a schooner "in the channel at Anahuac" (S10); the Ohio grounded half a mile out (S8).',
           depthFeet: null /* UNKNOWN */ }
turtleBay: { id:'turtle-bay', note:'open tidal water north of town in 1835; dammed as Lake Anahuac 1940s (S4)',
             southShore:{x:248,y:-6531} /* MEASURED modern lake end */ }
```

**Five rules for this water, all documented:**
1. **The town stands above the water, not beside it.** There is a bank, a beach and a hill between
   them (S9).
2. **Boats land at a beach. There is no wharf** (§4.5).
3. **It is shallow.** A sloop grounds half a mile out, and the Trinity bars can stop a rowboat (S5, S8).
4. **The shore is marsh and river mouths to the west**, not surf (S5, S17).
5. **The 1835 visitor arrives by boat** (S5, S8, S9).

### 8.5 The roads

```
roads: [
  {id:'track-to-turtle-bayou', widthFeet: 12,
   points:[{x:1100,y:-4000},{x:1400,y:-6800}],   // direction DOCUMENTED (north, S10); line INVENTED
   note:'to White\'s crossing on Turtle Bayou, ~6 mi; Liberty 25 mi (S10)'},
  {id:'path-to-fort', widthFeet: 8,
   points:[{x:700,y:-1500},{x:-100,y:-100}],     // INVENTED
   note:'fort is 0.5-1 mi south of the town (S2, S9)'},
  {id:'path-to-landing', widthFeet: 6,
   points:[{x:620,y:-3000},{x:300,y:-3000}],     // INVENTED; the bank and hill are DOCUMENTED (S9)
   note:'Briscoe\'s wheelbarrow of brick went this way, 12 June 1835'},
]
```

**In the game, news reaches this town by boat from Harrisburg or overland from Liberty**
(§Corrections, repository note 2).

### 8.6 Art gaps this sketch creates

Checked against `public/assets/frontier-v1/atlas.json` (767 frames) and the art sections of the
eleven earlier reports. **Raise existing requests; do not duplicate them.**

**Already covered, so do not request:** `brick-fort-ruin`, `brick-breach`, `brick-barracks-ruin`,
`brick-bastion`, `roundshot`, `cannon-iron-*`, `skiff`, `reeds`, `fence-rail`, `fence-broken`,
`storehouse`, `trading-house`, `cabin-small`, `cabin-wide`, `cabin-weathered`, `cabin-ruin`, the
round- and hewn-log house set, `pine-loblolly-*`, `oak-*`, `shed-open`. **Anahuac is the first town
in the series whose central structure already has art.** `brick-fort-ruin` and `brick-bastion` are
exactly the October 1835 state, provided nothing is mounted on them.

**Existing requests this town raises the priority of:**

- **A sea-going schooner**, plus a **sloop** as a smaller variant (Matagorda, Brazoria, Velasco,
  Harrisburg). **Anahuac adds two documented states:** lying in a channel off a bluff (1832), and a
  sloop aground half a mile out with a boat rowing a six-pounder ashore (29 June 1835). **Fifth town.**
- **A gun being moved and mounted** (Velasco, Harrisburg): the six-pounder on sawmill truck wheels
  (S8, S9, S14), the same gun Harrisburg's report records. **Third town.**
- **Salt marsh and shell bank** (Matagorda, Velasco): the Trinity delta marsh below the bluff.
  **Third town.**
- **A cut bank or bluff edge as terrain** (Brazoria's 22-ft bank, Harrisburg's timbered banks,
  Liberty's terrace lip): **a 16–20-ft clay bluff dropping to marsh, with a beach path and a
  "hill".** **Fourth town.** If no such request exists yet in `docs/ART_REQUESTS.md`, this is where
  to write it.
- **A frame / clapboard building** (San Felipe → Harrisburg): for the collector's office with its
  porch (`I-5`). **Seventh town, weakest case.**

**Genuinely new, and the evidence supports them:**

1. **A brick-kiln ruin.** A low mound of fired brick and rubble with a collapsed firing mouth, cold
   since 1832. Documented at Anahuac as two large kilns, one walled in as a prison (S2, S9, S17).
   Small, and reusable wherever brick was made. **Stand-in:** `brick-breach` scaled down on a `rocks`
   heap, marked `stand-in: Request — brick-kiln ruin (Anahuac)`.
2. **A carved grave marker.** Freeman's "large marble stone" of August 1835 (S11). **The first dated
   gravestone in the series.** Record the gap and do not request it yet unless a cemetery is drawn
   anywhere.

**Record the gap, do not request yet:**
- a wheelbarrow of brick (a prop for the 12 June scene);
- a Mexican warship at anchor (the *Correo*, July, not October).

**Registry correction** (repository note 3): drop `ferry-raft` from the `anahuac` recipe in
`scripts/art-registry.mjs`, and prefer `skiff` to `wharf`.

---

## 9. Verdict

**Can Anahuac be drawn honestly? Yes, as a ruin on a point with a thin, half-empty trading town to
its north. The fort can be sketched; the town can only be suggested.**

**What is solid.**
- **The fort's site** is on the ground, a National Register site, marked, dug at three times, and
  surveyed by magnetometer twice.
- **The ground is measured:** an 18–20-ft terrace ending in an abrupt bluff over marsh, with the
  fort on its westernmost point.
- **The fort's materials and history are documented from both sides:** brick on clamshell footings;
  built by convicts and conscripts in 1831–32; dismantled and burned in 1832; robbed for bricks; too
  ruinous to use in January 1835; its rebuilding lumber burned in May; deserted on 29 June; never
  garrisoned again. Tenorio's own letters, Travis's letters, D. W. C. Harris's letter and Labadie's
  narrative all agree on this.
- **The town is counted five times between 1831 and 1836:** 15–20 houses and 7 shops in 1831, 300
  civilians at the peak, 50 people in 1834, 124 in the precinct, 20–25 men at a meeting in May 1835.
- **The June 1835 night scene is documented to the foot:** the store under guard, the wheelbarrow of
  brick, the beach, the bank, the hill, the shot, the calaboose.
- **The water is known in kind:** shallow, marshy, a channel, a landing, sloops and schooners, no
  wharf.
- **The October facts are few and firm:** no garrison, no collector, Willcox subalcalde, Briscoe off
  to Béxar, Freeman two months dead, and round shot lying about.

**What would have to be invented.**
- **The fort's exact trace**: four sizes, reconciled only by inference.
- **Its orientation and wall heights.**
- **Every town building position.**
- **The landing's place.**
- **The 1835 shoreline and bluff edge**, and depths.
- **What the houses were built of.**
- **Whether the lot survey shaped the town at all.**

**Is there enough to draw it honestly? Yes, on two conditions.**
1. **Draw the fort as the brick ruin it was, with no flag, no garrison and no mounted gun, on the edge
   of a real bluff at Perry's Point, and mark its plan as reconciled, not surveyed.**
2. **Draw the town as a scatter of about fifteen log houses and shops along the bluff to the north,
   some of them empty, with a beach and boats below, and mark every position as invented.**

The temptation to resist is the fort of 1832, with its 285 men, its guns and Travis tied to the
ground. That is a different month, three years earlier.

**What will surprise anyone who knows Anahuac as "the first shot of the Revolution":** in October
1835 it was the quietest place in the story. The fort had been taken, the soldiers were gone, the
customs man was gone, and the town's best-known merchant had marched off to Béxar. The one warlike
thing left there was a pile of round shot, and a month later Austin wanted it.

**The things most worth doing before drawing it**, in order of value:

1. **Get the Hicks & Company reports (2003, 2004), THC's 2001 magnetometer report and the 1938 county
   surveyor's field notes** from Chambers County or THC. Together they settle §3.3 and give the
   fort's real trace and orientation.
2. **Read Henson's *Juan Davis Bradburn* (1982) and *Anahuac in 1832*.** They are the source of every
   dimension in S2, and may contain a plan of the fort and town.
3. **Look for the 1831–32 lot survey and the Chambers v. Willcox townsite papers** (Liberty and
   Chambers County records; the Sam Houston Regional Library, Liberty).
4. **Get the 1850s Coast Survey T-sheets of upper Galveston Bay** for the bluff, the shore, the
   channel and any buildings before the twentieth century.
5. **Read Tenorio's January–July 1835 letters in the Béxar Archives** for where his men lived and what
   they repaired.
6. **Fix `scripts/art-registry.mjs`** (ferry, wharf, round shot), and **note in `HIST-TEX-010` that
   the fort is 1.23 miles at 195° from the Anahuac coordinate.** This report changes neither file; it
   records the measurement and the reason.
