# The weather of 1835-36 over the settled colonies: what is dated, what is not, and what the game should do with it

**Status: research, 2026-09-20. Nothing here is built.** This is the record and a proposal; the owner implements. Read it with
`sim/road.mjs` (`RAIN_SHARE`, `rainyDay`, the wagon in the mud), `sim/world.mjs` (`wadeAt`, the ford in high water),
`docs/MAP_ACCURACY.md` §10.7 (the wade), `docs/ROAD_EAST.md`, and the claims it registers in `HISTORY.md`:
`HIST-TEX-220` to `HIST-TEX-238` and `FIC-GONZ-130` to `FIC-GONZ-136`, and - for the drawing, built 2026-09-20 -
`FIC-GONZ-190` and `FIC-GONZ-191`.

It is structured as `docs/BIOMES.md` is: what was asked, how to read the sources, the dated record, the record by kind of
weather, the ordinary climate as a stated basis for inference, what the game has now, the proposed model, what not to build,
what was looked for and not found, and the sources.

---

## 1. What the owner asked for

> "dedicate a subagent to research the weather of 1835/36... include (if found) snow, rain, tornado's, hurricanes, etc. we
> need dates as much as possible so the weather can be implemented in the correct locations and times. (we'll have to use
> logic to fill informational gaps.)"
>
> — 2026-09-20

The class runs from **late September 1835 to about April 25, 1836**, over the settled colonies and Béxar. That window is the
scope. Weather outside it is recorded here only where it is needed to rule something out (the hurricane of August 1835, and
Racer's Storm of 1837, which is the single most likely thing to be imported into this period by mistake).

---

## 2. How to read the record for 1835-36

**There was no weather service and no Texas weather station.** The Smithsonian's volunteer meteorological network, the first
systematic observing programme covering this part of the continent, began in **1849** — thirteen years too late. The U.S.
Army Surgeon General's post surgeons did keep instrumental registers from the 1820s, and **those turn out to cover exactly
these months from just across the Sabine (§8.8)** — but no army post stood inside Texas. (A NOAA station history is titled
*History of Weather Observations, Austin, Texas 1842-1948*, which puts the first Austin record six years after this period;
that document was **not read**, and the date rests on its title alone.) So the weather of the campaign survives in four
kinds of record, and they are not equally good:

1. **Diarists who owned a thermometer and used it.** These are the only instrumental Texas observations found for the
   period, and they are the backbone of everything below. See `HIST-TEX-220`.
   - **Samuel Maverick**, under house arrest inside Béxar through the siege, gives near-daily temperatures and weather
     from about 30 October to 30 November 1835.
   - **Juan Nepomuceno Almonte**, on Santa Anna's staff, gives a thermometer reading nearly every morning of the Alamo
     siege, 23 February to 5 March 1836, with wind and sky.
   - **William Fairfax Gray**, riding through the colonies from 31 January to 24 April 1836, writes the weather **most
     days** and reads a thermometer twice — 35 °F at San Felipe on 26 February, 33 °F at Washington on 1 March. **His is
     the densest record of the period and the only one in the colonies** (§3.2), and it covers the two months the Béxar
     diaries do not.
2. **Letters and official reports** that mention weather in passing because it was in the way — Austin's report of
   30 November 1835, Houston's San Jacinto report of 25 April 1836, Hall on the muddy coast road. These are dated and
   trustworthy for the fact, vague about the degree.
3. **Memoirs written decades later** — Smithwick, Creed Taylor, Ehrenberg, Dilue Rose Harris, Delgado (1878). Good for what
   the weather *did* to people; their dates need checking against the contemporaneous record, and their adjectives are
   recollection.
4. **Modern secondary writing** — TSHA's Handbook, Wikipedia, the Alamo's and the Siege of Béxar Descendants' public pages.
   Useful as an index into the primaries, and sometimes the only place a primary's wording survives in a form this research
   could read. Treated as secondary throughout, and never quoted to a class as if it were 1836.

**The rule for modern data.** Monthly normals and storm climatology are used **only as a declared basis for inference about
the gaps**, marked "inference" every time, and are never written down as an 1836 observation. Where a number comes from
1991-2020 normals it says so in the same sentence. See §8 and `HIST-TEX-234`.

**Two things this research refused to do.** It did not invent a tornado to fill §7, and it did not import Racer's Storm
(October **1837**) into 1836, which is the standard error in this subject — web search attaches the famous Velasco surge and
the Galveston wrecks to "1835" freely, and every one of those details belongs to 1837 (§6.3).

---

## 3. The dated record

Every row is a dated weather observation or a dated statement about the state of the ground or the rivers. "Class" marks
whether the day falls inside the game's window (29 September 1835 - about 25 April 1836).

### 3.1 The table

| Date (1835-36) | Place | What the source says | Kind | Source |
| --- | --- | --- | --- | --- |
| **Sep 29, 1835** | Guadalupe at Gonzales | Castañeda's troops "found their path blocked by **high water** and eighteen militiamen" | high water | TSHA, *Gonzales, Battle of* |
| **Oct 1-2, 1835** | Gonzales | "A **thick fog** rolled in around midnight, further delaying them"; "With the darkness and fog, Mexican soldiers could not estimate how many men had surrounded them"; "As the **fog lifted**, Castañeda sent Smither to request a meeting" | fog, night into morning | Wikipedia, *Battle of Gonzales* |
| **Oct 28, 1835** | Mission Concepción, below Béxar | "at dawn of day, every object was obscured by a **heavy, dense fog**" (Bowie's report); the fog rose about 8 a.m. | fog, dawn to about 8 a.m. | already `HIST-TEX-020`; `docs/battle-research/concepcion.md` |
| **about Oct 30, 1835** | Béxar | Writing on Nov 6: "About a week past we experienced **the first norther this fall**." | first norther of the autumn | Maverick's diary |
| **Nov 4, 1835 (night)** | San Felipe de Austin | the night was "**cold and stormy**" (Borden) | cold, storm | already in `docs/battle-research/grass-fight.md` §3.4 |
| **Nov 5, 1835 (about 7 a.m.)** | Béxar | "a **norther blew up**, bringing the thermometer down 20°, from **75° to 55°**" | norther, 20 °F drop in a day | Maverick |
| **Nov 6, 1835** | Béxar | "A **great fog** this morning, arising by evaporation from the river (spring water). Thermometer at 7 A.M. in shade out of doors is at **49°**." | river fog; 49 °F at 7 a.m. | Maverick |
| **Nov 17, 1835** | Béxar | "Not a sound. **The wind hardly blows.**" | calm | Maverick |
| **Nov 18-23, 1835** | the coast and the road up from it | the weather "has been **excessively bad** and the roads are **very muddy**" (Hall, bringing the heavy cannon, Nov 23) | rain, mud on the coast road | already in `docs/battle-research/grass-fight.md` §3.4 |
| **Nov 20, 1835** | Béxar | "This day **the worst norther we have had**. Thermometer **42°** with **rain and wind**." | norther with rain | Maverick |
| **Nov 21, 1835** | Béxar | "This a **very cold, bleak, rainy day**... Thermometer this morning **36 1/2°**." | cold rain | Maverick |
| **Nov 22, 1835** | Béxar | "**Very cold.**" | cold | Maverick |
| **Nov 23, 1835** | Béxar | "The weather **very cold**—**very unusually so** as S. says. Thermometer down to **28°** after sunrise. **Water in the house froze over as thick as a dinner plate.** No frost out of doors by reason of the wind." | hard freeze, 28 °F | Maverick |
| **Nov 24, 1835** | Béxar | "Thermometer at **31°**, but a little weak sunshine, now and then." | freezing, part sun | Maverick |
| **Nov 25, 1835** | Béxar | "Thermometer **30°**. Sun shining and a fair day." | freezing, fair | Maverick |
| **Nov 26, 1835** | Béxar | "**Weather improving.**" | moderating | Maverick |
| **Nov 26, 1835** | a creek near Béxar (the Grass Fight) | the creek the infantry forded was "**cold wide and deep**" (Jack) | high, cold water | already in `docs/battle-research/grass-fight.md` §3.4 |
| **Nov 27, 1835** | Béxar | "**Fair day, cool.**" | fair | Maverick |
| **Nov 28, 1835** | Béxar | "At 10 o'clock thermometer is at **54°** - **a fine day**." | fair, mild | Maverick |
| **Nov 30, 1835** | the colonies generally | Austin's report calls it "**the most inclement, wet, and cold spell of weather known in this country for many years**" | the whole month characterised | already in `docs/battle-research/grass-fight.md` §3.4, from the *Telegraph*, Dec 12 |
| **Dec 5, 1835 (before dawn)** | Béxar | **fog** (Creed Taylor); "**a norther and cold**" (Ehrenberg), as the storming columns went in | fog and norther at dawn | already in `docs/battle-research/bexar-storming.md` |
| **Dec 7, 1835 (night)** | Béxar | "The weather **exceedingly cold and wet**." (Johnson's official report) | cold rain | `docs/battle-research/bexar-storming.md` |
| **Dec 8, 1835** | Béxar | "**Cold and wet**, with but little firing." (Johnson) | cold rain | `docs/battle-research/bexar-storming.md` |
| **Dec 10, 1835 (dawn)** | Béxar | "About Sun Rise Dec 10th their fireing sudently ceased **it was foggy**" | fog at dawn | `docs/battle-research/bexar-storming.md` |
| **December 1835** | the lower Brazos | "Everything was at a standstill and times very gloomy. **The Brazos river was so low the steamboat couldn't go up.**" | **a low river — a dry autumn** | Dilue Rose Harris |
| **Feb 13, 1836** | Santa Anna's army on the march — **where is disputed** (§5.1) | "by February 13, an estimated **15-16 inches (38-41 cm) of snow** had fallen"; hypothermia among recruits from the tropics | **snow, the only one in the record** | Wikipedia, *Battle of the Alamo*; already `HIST-TEX-053` (proposed) |
| **Feb 21, 1836** | the Medina, 25 miles from Béxar | "The raid had to be called off when **sudden rains made the Medina unfordable**." | rain, river unfordable | Wikipedia, *Siege of the Alamo* |
| **Feb 23-25, 1836** | Béxar | Almonte records no weather on the 23rd or 24th; before the 25th it had been "**shirt sleeve**" weather | mild | Almonte; the Alamo; Siege of Béxar Descendants |
| **Feb 25, 1836 (9 p.m.)** | Béxar / the Alamo | "**A strong north wind commenced at nine at night.**" | a norther arrives, evening | Almonte |
| **Feb 26, 1836** | Béxar / the Alamo | "The northern wind continued very strong; the thermometer **fell to 39**, and during the rest of the day remained at 60... The norther wind continues." | norther, 39 °F | Almonte |
| **Feb 26-27, 1836 (night)** | San Patricio, 120 miles south-east | the night was "**very raw and excessively cold**," with **continuous rain**; Urrea attacked at 3 a.m. on the 27th under cover of it | **the same norther, raining on the coastal plain** | TSHA, *Goliad Campaign of 1836* |
| **Feb 27, 1836** | Béxar | "The northern wind was **strong at day break**, and continued all the night. Thermometer at **39**." | norther | Almonte |
| **Feb 28, 1836** | Béxar | "The weather **abated somewhat**. Thermometer at **40** at 7 A.M." | cold, easing | Almonte |
| **Feb 29, 1836** | Béxar | "The weather changed—thermometer at **55**—in the night it commenced **blowing hard from the west**"; "The wind changed to the north at midnight." | a second front, at night | Almonte |
| **Mar 1, 1836** | Béxar | "The wind subsided, but the weather continued cold—thermometer at **36** in the morning—**day clear**"; "Night cold thermometer **34** Fahrenheit and 1 Reaumur." | cold, clear | Almonte |
| **Feb 29 - Mar 1, 1836 (night)** | Washington-on-the-Brazos | "Yesterday was a warm day, and at bed time I found it necessary to throw off some clothes. In the night the wind sprung up suddenly from the north and **blew a gale, accompanied by lightning, thunder, rain and hail**, and it became very cold. In the morning the **thermometer was down to 33 degrees**, and everybody shivering and exclaiming against the cold. **This is the second regular norther that I have experienced.**" | **a norther with hail — the one dated severe storm of the period** | Gray's diary |
| **Mar 1, 1836** | Washington-on-the-Brazos, 150 miles east of Béxar | "The convention met on March 1, 1836, in **near-freezing weather** in an unfinished building" | **the same cold, in the colonies** | TSHA, *Convention of 1836* |
| **Mar 2, 1836** | Béxar | "Commenced **clear and pleasant** thermometer **34**—no wind." | cold, clear, calm | Almonte |
| **Mar 3, 1836** | Béxar | "Commenced **clear**, at **40** without wind." | clear | Almonte |
| **Mar 4, 1836** | Béxar | "The day commenced **windy, but not cold**—thermometer **42**." | windy | Almonte |
| **Mar 5, 1836** | Béxar | "The day commenced very moderate—thermometer **50**—**weather clear**. At mid-day the thermometer rose to **68**." | mild, clear | Almonte |
| **Mar 6, 1836** | Béxar | Almonte records the assault and **no weather**. | — | Almonte |
| **Mar 13, 1836** | between Goliad and Refugio | Urrea "force-marched twenty-seven miles across **rain-soaked prairie**" | wet ground | TSHA, *Goliad Campaign of 1836* |
| **Mar 19, 1836** | Goliad | "The retreat, started at midmorning during a **heavy fog** on March 19, was late and much confused." | fog, morning | TSHA; already `HIST-TEX-063` |
| **from Mar 21, 1836** | Victoria and the coast | Urrea took the coastal ports "**fording rivers swollen from excessive rains**" | rivers up | TSHA, *Goliad Campaign of 1836* |
| **Mar 31 - Apr 14, 1836** | Groce's, on the Brazos | "The **unrelenting rainy weather** swelled the Brazos and threatened flooding" while Houston's army camped there | prolonged rain, river up | already `HIST-TEX-068` |
| **Apr 14, 1836 (evening)** | between the Brazos and Harrisburg | "The sun had already set when we resumed the march over a **muddy prairie**. The night was dark... **our piece of artillery bogged at every turn of the wheel**." | mud on the prairie at night | Delgado |
| **Apr 17, 1836 (night)** | between Harrisburg and New Washington | a bridge "rendered still more dangerous by **darkness and rain**"; "Shortly after ten o'clock at night a **violent storm** set in; darkness caused us to wander from our course... requiring every man to stand in the ranks **without shelter from the rain**." | **a dated violent night storm** | Delgado |
| **Apr 21, 1836** | San Jacinto | **No source read here records the weather on the day of the battle.** Delgado's account of the 21st mentions none; the fighting began about 3:30-4:30 p.m. | — (see §3.4) | Delgado; TSHA; Wikipedia |
| **Apr 22-25, 1836** | the San Jacinto battleground | the Mexican prisoners were kept "starving, **sleeping in the mud**, and exposed to **frequent and heavy showers**" | showers | Delgado |
| **Apr 25, 1836** | the whole campaign, looking back | "For several days previous to the action, our troops were engaged in forced marches, **exposed to excessive rains**, and the additional inconvenience of **extremely bad roads**" | the April characterised | Houston's official report |

### 3.2 Gray's diary: a near-daily series for the colonies, 31 January - 24 April 1836

**This is the densest weather record of the period and it is in the colonies, not at Béxar.** William Fairfax Gray rode
from Nacogdoches to San Felipe, sat through the Convention at Washington-on-the-Brazos, and went east with the Runaway
Scrape, writing the weather most days and reading a thermometer twice.

**What was read, and how far it is verified.** The text is the SMU edition — *The Diary of William Fairfax Gray, from
Virginia to Texas, 1835-1837*, ed. Paul Lack, William P. Clements Center for Southwest Studies, 1997 — which SMU put on
the web page by page and has since taken down (the live URL is a 404). It was read through the Wayback Machine. **Page
numbers below are the 1997 edition's, printed on each web page; they are not the 1909 Gray, Dillaye & Co. pagination**, and
no 1909 copy could be reached (§13).

**This session could not re-read the Wayback pages itself: the Internet Archive went offline part-way through this work
and every route to it returned 503 or "Temporarily Offline".** So the series below is verified indirectly, and the
verification is strong enough to record:

1. **Two passages match, word for word, sources this session read directly and early.** The Alamo's own page says "by
   March 8 Gray proclaimed 'Fine weather'" — and the series has **March 8: "Fine weather."** Washington on the Brazos's
   site prints the whole 1 March passage — and the series has it identically, down to "This is the second regular norther
   that I have experienced."
2. **It agrees with Almonte's independent thermometer at Béxar, date by date, in a way nobody could arrange backwards.**
   Almonte, 25 February: "A strong north wind commenced at **nine at night**." Gray, 150 miles away, the same night: "At
   night the wind **chopped suddenly round to the north**." Almonte 29 February: warm, 55°. Gray 29 February: "A warm
   day". Almonte 1 March: 36° and "day clear". Gray 1 March: 33° and a gale. Almonte 2 March: "clear and pleasant". Gray
   2 March: "clear and cold, but the cold somewhat moderated". Almonte 3 March: "clear". Gray 3 March: "clear and cold,
   but became more moderate as the day advanced". **Five days running, two observers, two thermometers, one weather.**

| Date, 1836 | Place | What Gray wrote | p. |
| --- | --- | --- | --- |
| **Jan 31** | near Nacogdoches | "A fine, clear, frosty morning, with a cold northwest wind." | 78 |
| **Feb 2** | Nacogdoches | "The weather for the two last days has been very fine, cool, but clear, dry and elastic, like fine autumn weather in Virginia. I wear no overcoat." | 80 |
| **Feb 3** | Nacogdoches | "Another fine day, but warmer than yesterday; **three white frosts and then a rain is the rule here**, so we may expect rain tomorrow." Later: "Weather warm and cloudy, threatening rain." | 80, 83 |
| **Feb 4** | Nacogdoches | "It rained hard from noon until midnight... They trudged to it on foot through rain and mud" | 84 |
| **Feb 5** | Nacogdoches | "It continued wet and cold all the forenoon." | 86 |
| **Feb 10** | the Trinity crossing | "we crossed the Trinity, which we approached through a **boggy, miry, nasty prairie**, or rather marsh, of several miles extent, which is **subject to overflow when the river is high**"; the river "runs rapidly between steep banks, some twenty or twenty-five feet above the present stage of the river, which is **somewhat up**"; "The weather for several days has been very warm, and indicating rain"; "we were met by a **storm of thunder, lightning and rain**. The thunder was heavy, and the storm in all respects equal to what we have in Virginia in July and August." | 93-94 |
| **Feb 11** | the Bedias | "the rain of yesterday had **swollen it very much**"; a creek "which had **flowed out beyond its banks upwards of 100 yards**" | 94 |
| **Feb 14** | Washington | "A clear and cold morning." | 98 |
| **Feb 15** | Washington | the Post came in "with his mail completely wet, he having just swam Mill Creek" | 99 |
| **Feb 16** | Mill Creek to San Felipe | "Crossed Mill Creek on a log, and drove the horses through the stream, which was **still too high to ford**. The road was wet and miry" | 100 |
| **Feb 17** | San Felipe | "it has come on to **rain hard**" | 102 |
| **Feb 18** | San Felipe | "It rained hard last night, but this morning, like yesterday, was **very foggy**. Cleared off about 9 o'clock." | 102 |
| **Feb 21** | on the road | "A **heavy storm of rain** came on in the night, which beat on me where I slept." | 107 |
| **Feb 22** | New Year's Creek | "The morning was clear and beautiful, the air mild"; but crossing the creek "I got very wet, coat pockets, boots and saddle bags all full of water", and the Yegua "would also be up" | 108-109 |
| **Feb 25** | Mill Creek | "found Mill Creek **very high**", crossed by pirogue and swam the horses | 109 |
| **Feb 25** | San Felipe | **the definition of a norther, in period words — see §4.1** | 110 |
| **Feb 26** | San Felipe | "This morning it was **excessively cold** for this southern region. Yesterday it was summer heat. I put the **thermometer** out in the porch and **it fell to thirty-five degrees**." | 110 |
| **Feb 27** | on the road | "The wind yesterday and today blew hard from the north, right in my face -- a most uncomfortable ride." | 111 |
| **Feb 28** | on the road | "Cold and drizzling." | 111 |
| **Feb 29** | Washington | "A warm day, threatening rain from the south." | 111 |
| **Mar 1** | Washington | the gale with hail, **33 degrees** — §7.2 | 112 |
| **Mar 2** | Washington | "The morning clear and cold, but the cold somewhat moderated." | 115 |
| **Mar 3** | Washington | "Morning clear and cold, but became more moderate as the day advanced." | 116 |
| **Mar 8** | Washington | "Fine weather." | 118 |
| **Mar 9** | Washington | "Weather warm and fine." | 119 |
| **Mar 10** | Washington | "Fine weather" | 120 |
| **Mar 12** | Washington | "Weather warm and pleasant." | 121 |
| **Mar 14** | Washington | "The weather is gloomy and warm, indicating rain. The wind is from the south, and **the wild geese are mustering for the North**." | 121-122 |
| **Mar 17** | Washington | "Fine, mild weather." At night, "It rained a little in the night, but not enough to wet me." | 124, 126 |
| **Mar 18** | leaving Washington | "This morning was cloudy and drizzly." And the Scrape on the road: "Many persons, moving eastward... some in wagons, some in carts, and some on foot" | 126 |
| **Mar 21** | on the road | "rather cold lodging" | 136 |
| **Mar 22** | toward Galveston Bay | "Weather lowering." | 138 |
| **Mar 23** | near Galveston Bay | "the clouds, which had been lowering for some days, poured down a **heavy rain**. The wind from the northeast blew a regular **equinoctial storm**, and being near the Bay of Galveston, it came up heavy and cold." | 139 |
| **Mar 24** | near Galveston Bay | "The rain has abated, but the wind is still strong from the northeast; cold and cloudy." | 139 |
| **Mar 28** | | "Weather cloudy and rainy." | 142 |
| **Mar 31** | | "Weather very warm -- quite summer heat." | 144 |
| **Apr 2** | | "Very warm weather." | 144 |
| **Apr 3** | | "The wind sprang up from the north early in the morning, and continued to blow gently and pleasantly until night, when it became calm. The moon rose bright and clear" | 145 |
| **Apr 4** | a ferry | "At the ferry were large crowds, all seeking a passage across... with their wives, children, Negroes, horses, carts, wagons, and droves of cattle"; "The wind was ahead" | 146 |
| **Apr 8** | Galveston Island | "a fresh breeze from the south brought the waves in with a noise resembling a great waterfall" | 149 |
| **Apr 9** | Galveston Island | "The wind, all this week, has been fresh from the south." | 150 |
| **Apr 10** | Galveston Island | "During the past night it has **rained, and a strong norther has sprung up**. Our vessel has swung from her groundings... unable to get out for the head wind." | 151 |
| **Apr 11** | Galveston Island | "The **gale still continued** too strong to make it prudent to venture out in our little boat." | 152 |
| **Apr 19** | Anahuac to the Neches | "This morning a **heavy fog**." | 158 |
| **Apr 22** | the Neches | "We had to swim a number of little bayous, running out from the Naches, which is now **so full as to overflow its banks**... **This is the first instance of this kind of overflow I have seen in Texas.**" | 160 |
| **Apr 23** | Sabine, Ballou's ferry | "passing for several miles through the **worst road I have encountered in Texas**. In one place we came upon a poor ox, **bogged in the middle of the road**. His head and a small part of his body was above the mud." | 161 |
| **Apr 24** | Sabine | "Owing to the **crowd of families** now here, we could not conveniently cross the ferry today" | 162 |

**Gray records no weather on 21 April**, nor on 20 April; he was on the lower Neches, two hundred miles east of San
Jacinto, and his entries for those days are silent (§3.4). From **25 April he is in Louisiana**, and his heavy rains of
27-29 April are east of the Sabine and are **not** Texas weather.

### 3.3 What that adds up to

- **Almost every scene the game already stages has dated weather in the record** — Gonzales (fog), Concepción (fog), the
  Grass Fight (a cold, wide, deep creek), the storming of Béxar (fog, a norther, two cold wet nights), the Alamo siege
  (a fortnight of thermometer readings), Coleto (fog), the Runaway Scrape (rain and swollen rivers). **San Jacinto on
  21 April is the one exception, and its weather is not recorded at all** (§3.3). The game stages all of them and gives
  none of them weather.
- **Autumn 1835 was not mild.** Maverick's November is a hard month at Béxar: a norther about 30 October, another on
  5 November, and from 20 to 25 November a spell that put the thermometer at 28 °F and froze water indoors. Austin, writing
  on the 30th, called it the worst spell "known in this country for many years" — so **the sources themselves say November
  1835 was abnormal**, and the game should not make it the template for every autumn.
- **The Alamo siege was cold and CLEAR, not cold and wet.** This matters, because the popular image is wet. Almonte's own
  words for 1-5 March are "day clear", "clear and pleasant", "clear", "weather clear". The only rain in the record for that
  week fell 120 miles away at San Patricio on the night of the 26th-27th. A class that is told it rained at the Alamo is
  being told something the one daily record of the siege contradicts.
- **The spring was wet, and the record says so in five independent voices** — TSHA, Urrea by way of TSHA, Delgado, Houston,
  and Dilue Rose Harris. What none of them gives is **which days**. That gap is the reason `FIC-GONZ-049` exists.
- **The two armies' weather is the same weather.** The norther of 25-27 February is in Almonte's thermometer at Béxar and in
  TSHA's "very raw and excessively cold" at San Patricio on the same nights. That is the single best piece of evidence in
  this whole file for the proposal in §10.2: **a norther is regional, not local, and it arrives within a day across
  300 miles.**
- **The Runaway Scrape's water was the Trinity, not the San Jacinto** — and the game should know it. The two eyewitnesses
  agree independently. At **Lynch's ferry on the San Jacinto** the problem was **the crowd**: Dilue Rose Harris, "There
  were fully five thousand people at the ferry... **We waited three days before we crossed**", and she records **no
  weather there at all**. At the **Trinity** the problem was **the flood**: "Our hardships began at the Trinity. **The
  river was rising** and there was a struggle to see who should cross first. Measles, sore eyes, whooping cough, and every
  other disease that man, woman, or child is heir to, broke out among us... **the water broke over the banks above where
  we were and ran around us. We were several hours surrounded by water**... **Drift wood covered the water as far as we
  could see**... We crossed a bridge that was under water. As soon as we crossed, a man with a cart and oxen drove on the
  bridge, and it broke down, drowning the oxen... **It took four days to get everything out of the water.**" Gray, going
  the same way seven weeks earlier, had already described the Trinity approach as "a **boggy, miry, nasty prairie**, or
  rather marsh, of several miles extent, **which is subject to overflow when the river is high**". **If the game models
  the flight east, the flood belongs on the Trinity and the queue belongs on the San Jacinto.**
- **The bogging the game already models is Harris's, and it is on the open prairie, not at a crossing.** "When we got
  about half across the prairie Uncle Ned's wagon bogged. The negro men driving the carts tried to go around the big wagon
  one at a time until the four carts were fast in the mud... put all the oxen to the wagon, but could not move it... They
  had to be unloaded and pulled out." `sim/road.mjs` already carries this in its header. What it does not yet carry is the
  fact that the mud was there because the ground was already soaked (§10.4).

### 3.4 Did it rain on April 21?

**Not in any source read here.** This deserves a flat answer because the question was asked directly.

- Houston's report of April 25 says the army was "exposed to excessive rains" for "several days previous to the action" —
  *previous to*, not on.
- Delgado, on the Mexican side and writing of the 21st in detail, records the morning, the arrival of Cos, the meal, the
  siesta and the attack at 4:30 p.m., and mentions **no weather at all**, having mentioned it freely for the 14th and 17th.
- TSHA's *San Jacinto, Battle of* and Wikipedia's article contain no weather sentence for the 21st.
- The showers in Delgado's account begin **after** the battle, over the prisoners.
- **Gray, who wrote the weather nearly every day for three months (§3.2), wrote none on 20 or 21 April.** He was on the
  lower Neches, far to the east, so his silence is weak evidence about San Jacinto — but his 19 April "heavy fog" and his
  22 April Neches in flood bracket the days, and neither mentions rain falling.

**Inference (basis: the two accounts that do mention weather on adjacent days, and the fact that an afternoon attack across
open prairie succeeded):** the afternoon of 21 April was most likely not raining. The game should make **April 21 a fair
day**, and mark it as inference, not as a recorded observation.

---

## 4. Northers and cold

### 4.1 What a norther was, in the words of the period

**A settler explained it to his diary on 25 February 1836, and it is worth the whole section.** Gray, at San Felipe, the
day the first of the two great late-February northers arrived (§3.2, p. 110):

> "Yesterday the weather was warm and cloudy, indicating rain. All the forenoon today we were met by a strong south
> breeze, blowing a drizzling rain in our faces. About noon the drizzle ceased, and it was so warm that I rode in my shirt
> sleeves. **It was summer heat.** At night **the wind chopped suddenly round to the north**, and there commenced what is
> familiarly called in this country **a norther, by which is always understood a hard and cold blow from the north. It
> generally lasts for two or three days, and is sometimes so excessively cold that persons have been known to freeze to
> death in crossing the prairies. Long observation has taught them to expect a norther between the 20th of February and
> 1st of March, and that generally closes the winter.**"

That single paragraph gives the game almost everything it needs: **the warm south wind before it, the sudden shift at
night, two or three days' duration, the danger to a person caught out on the prairie, and a settlers' rule of thumb about
when the last one comes.** It is also period speech, and could go into a character's mouth nearly unaltered.

The rest of the record gives the shape of one exactly:

- **It arrives at a named hour.** "A strong north wind commenced at **nine at night**" (Almonte, Feb 25). "a norther blew up"
  at about 7 a.m. (Maverick, Nov 5).
- **The drop is large and fast.** "bringing the thermometer down **20°, from 75° to 55°**" within a day (Maverick, Nov 5).
  At the Alamo: "shirt sleeve" weather before the evening of the 25th, **39 °F** the next morning (Almonte).
- **It lasts two to three days and then lets go** — which is Gray's own figure, and the record bears him out. Almonte's
  siege: strong north wind the 25th night, 39° the 26th, 39° the 27th, "abated somewhat" 40° the 28th, 55° the 29th. Gray,
  for the same spell: 35° on the 26th, wind hard from the north on the 27th, "cold and drizzling" the 28th, "a warm day"
  the 29th. **Both say four days.** Maverick's worst spell was longer: 42° on the 20th, 36½° the 21st, "very cold" the
  22nd, 28° the 23rd, 31° the 24th, 30° the 25th, "improving" the 26th, 54° the 28th — **eight days from onset to fine**,
  which is why the sources call November 1835 unusual.
- **Two thermometers, two places, the same two northers.** In the norther of 25-28 February: **Béxar 39 °F** on the 26th
  (Almonte), **San Felipe 35 °F** the same morning (Gray). In the second, on 1 March: **Béxar 36 °F**, **Washington
  33 °F**. **The colonies were three to four degrees colder than Béxar in both**, which is the ordinary order for latitude
  and is worth keeping if the game ever varies cold by region.
- **It can come with rain and it can come dry, and it can come violently.** Nov 20: "Thermometer 42° **with rain and
  wind**." Feb 26 - Mar 5 at Béxar: norther after norther with a clear sky and no rain mentioned once. But the same second
  norther reached **Washington-on-the-Brazos** as a gale "accompanied by **lightning, thunder, rain and hail**" (Gray,
  §7.2). **The same front is dry in the west and violent in the centre on the same night** — which is the other half of
  §10.2's case for regions.
- **A second one can follow before the first has gone.** Almonte, Feb 29: after warming to 55°, "in the night it commenced
  blowing hard from the west... The wind changed to the north at midnight."

### 4.2 How often, in the record itself

Counting from the two diaries, inside the days they actually cover:

| Window | Days covered | Northers the diarist names | Rate |
| --- | --- | --- | --- |
| about Oct 30 - Nov 30, 1835 (Maverick, Béxar) | 32 | the "first norther this fall" about Oct 30; Nov 5; Nov 20 | 3 in 32 days, about one every 10-11 days |
| Feb 23 - Mar 5, 1836 (Almonte, Béxar) | 12 | Feb 25 evening; Feb 29 midnight | 2 in 12 days, about one every 6 days |
| 31 Jan - 23 Apr 1836 (Gray, in the colonies) | 83 | **25 February** ("there commenced... a norther"); **the night of 29 February** ("the second regular norther that I have experienced"); **10 April** at Galveston ("a strong norther has sprung up"), still blowing on the 11th. Plus "a cold northwest wind" on 31 January, which he does not call a norther. | 3 in 83 days, about one every 28 days |

`ceiling:` these are short windows, and the diarists name only the ones worth naming — Gray's own word is "**regular**
norther", which says plainly that he was not counting every wind shift. It is not a frequency for the season. It is,
however, **the only period frequency this research found**, and it brackets the modern figure in §8.3.

### 4.3 How cold it actually got

The only Texas temperatures in the record for the whole period:

| °F | Date | Place |
| --- | --- | --- |
| **28** (after sunrise; water froze indoors) | Nov 23, 1835 | Béxar |
| 30 | Nov 25, 1835 | Béxar |
| 31 | Nov 24, 1835 | Béxar |
| **33** (morning, the Convention's opening day) | Mar 1, 1836 | **Washington-on-the-Brazos** |
| 34 (night, and "1 Reaumur") | Mar 1, 1836 | Béxar |
| **35** (morning, in the porch) | Feb 26, 1836 | **San Felipe** |
| 34 (morning) | Mar 2, 1836 | Béxar |
| 36 (morning) | Mar 1, 1836 | Béxar |
| 36½ (morning) | Nov 21, 1835 | Béxar |
| 39 | Feb 26 and Feb 27, 1836 | Béxar |
| 40 | Feb 28 (7 a.m.), Mar 3 | Béxar |
| 42 | Nov 20, 1835; Mar 4, 1836 | Béxar |
| 49 (7 a.m.) | Nov 6, 1835 | Béxar |
| 50 (morning), 68 (mid-day) | Mar 5, 1836 | Béxar |
| 54 (10 a.m.) | Nov 28, 1835 | Béxar |
| 55 | Nov 5, 1835 (after the drop); Feb 29, 1836 | Béxar |
| 60 | Feb 26, 1836 (the rest of the day) | Béxar |
| 75 | Nov 5, 1835 (before the drop) | Béxar |

**The coldest figure anywhere in the 1835-36 Texas record read here is 28 °F.** Nothing in the record reaches the teens, and
nothing in it reaches zero. Whatever the game does with cold, it should not out-do 28 °F at Béxar.

---

## 5. Snow, sleet and ice

### 5.1 The one snowfall, and the argument about where it fell

**Feb 13, 1836** is the only dated snow in the period. Wikipedia's *Battle of the Alamo*: "Temperatures in Texas reached
record lows, and by February 13, an estimated **15-16 inches (38-41 cm) of snow** had fallen." The same passage has soldiers
from the tropics dying of hypothermia on the march.

**Where it fell is DISPUTED, and the dispute matters to the game:**

- The Siege of Béxar Descendants: "February 13, 1836, the Mexican Army, **located south of the Rio Grande** and marching to
  quell the Texan rebellion, recorded an atypical blizzard, but it **lasted only a day**."
- The Alamo's own *Myths and Legends* page is blunter: the Mexican Army met a severe blizzard on the march, and **"The
  snowstorm, however, did not extend into Texas."**
- Wikipedia's wording ("Temperatures in Texas") implies otherwise, and dates the Rio Grande crossing to February 12.

**Do not assert either.** What is safe, and is the thing the game needs, is the negative:

> **No source read here records snow anywhere in the settled colonies, or at Béxar, at any time in 1835-36.**

That negative is strong, not merely an absence: **Maverick had a thermometer at Béxar through the hardest cold of the
autumn and recorded ice in the house without recording snow**, and **Almonte had a thermometer at Béxar through three
northers and recorded a clear sky each morning.** Two instrument-keeping diarists at the coldest place in the game's map,
through the coldest weeks of the game's window, and neither writes the word. See `HIST-TEX-226`.

### 5.2 Ice and sleet

- **Ice, once, indoors:** "Water in the house froze over as thick as a dinner plate" (Maverick, Béxar, Nov 23, 1835). That is
  a hard freeze in an unheated room — the best single image in the whole record for what a norther did to a family.
- **Sleet: not found in 1835-36.** Smithwick describes "a storm of snow and sleet" so severe his party had to shelter, but
  that is a later Comanche campaign at the head of the San Gabriel, not this period, and it is **north and west of the
  colonies**. It is recorded here only so a later reader does not mistake it for 1836.

---

## 6. Hurricanes and Gulf storms

### 6.1 The answer

**No tropical cyclone struck Texas between the start of the class and its end.** The window is 29 September 1835 to about
25 April 1836, and:

- The **one** Texas hurricane of 1835 was **the Antigua-Texas hurricane of 18 August 1835**, six weeks *before* the class
  opens. **David Roth's *Texas Hurricane History* (National Weather Service) is the standard source and it was read in
  full** (downloaded 2026-09-20, §14): the storm "passed directly over the island of Antigua on the 12th... raked the
  Greater Antilles... **The hurricane hit near Corpus Christi on the 18th. In its 28 hour duration, many houses were blown
  down at Matamoros. The storm surge engulfed Padre Island and lowlands along the river.** The hamlet of Villa Hermosa de
  Santa Anna disappeared during the tempest. **Every vessel in the nearby harbor of Brazos Santiago was either driven out
  to sea or beached high and dry**... **Galveston Island saw flooding as well. The schooner *Bravo* capsized while in
  Matagorda Bay**... At least **14 perished**."
  **This is a bigger and more northerly storm than the secondary summaries say** — Wikipedia puts the landfall at the mouth
  of the Rio Grande; Roth puts it near Corpus Christi and has it flooding Galveston. Use Roth.
  **One discrepancy, reported rather than resolved:** Roth's own summary table lists **two** 1835 rows — "1835, 8/18
  Antigua Hurricane Brownsville" and "1835, 9/18 — Corpus Christi — 14" — but his narrative has **only one 1835 entry**,
  dated 18 August, and it is the one that names Corpus Christi and the fourteen dead. The two rows are almost certainly the
  same storm with one month mistyped. **It matters only a little and it matters honestly: if the true date were 18
  September, the storm would be eleven days before the class opens rather than six weeks**, and the coast towns would still
  have been putting themselves back together in the game's first days. Either way it is **outside the window**.
- **1836 has no Texas entry at all, in Roth or anywhere else.** Roth's chronology runs 1834 → 1835 → **1837 (Racer's)** →
  1838; the pre-1900 Texas list does the same. The three Atlantic storms listed anywhere for 1836 (27 July, New Brunswick;
  2-3 October, the Cayman Islands; 10-11 October, eastern North Carolina) are none of them in the western Gulf, and all
  three are **outside the class window anyway**.
- `ceiling:` Roth is authoritative on storms and careless elsewhere — he states that by 1835 "over 25,000 people resided in"
  Velasco, which is off by more than an order of magnitude. **Use him for weather and for nothing else.**
- **The season is wrong for it.** The Atlantic hurricane season runs 1 June to 30 November, and the class window contains
  only the ragged end of one season (October, November 1835) and none of the next. See §8.5.

So: **the game should model no hurricane.** A class that ran October 1835 could in principle meet a late-season Gulf storm,
and the *climatology* permits it, but **the record for that particular October says no**, and the game's rule is that a
dated absence beats a plausible invention.

### 6.2 What the record does have on the coast

- **19 November 1835, Pass Cavallo.** The schooner *Hannah Elizabeth*, running munitions to Fannin, stranded on a bar
  entering Matagorda Bay while chased by the Mexican warship *Montezuma*; "During the evening **severe weather** forced the
  *Montezuma* to retreat", and the wreck later "rolled over and broke up in the breakers". *(Wikipedia, Hannah Elizabeth.)*
  **Inference:** "severe weather" on 19 November, two days into Maverick's inclement spell and inside Hall's "excessively
  bad" week, is almost certainly **a norther blowing hard onshore**, not a tropical storm. A norther on the coast is a gale.
- **18-23 November 1835, the coast road.** "the weather has been excessively bad and the roads are very muddy" (Hall).
- **5 February 1836, the Brazos bar.** The schooner *Tamaulipas*, carrying two companies and "the Texas army's whole supply
  of munitions, clothing, and shoes", was wrecked on the Brazos sand bar (TSHA, *Goliad Campaign of 1836*). **The source
  gives no cause**; the Brazos bar wrecked ships in fair weather. **Do not call this a storm wreck.**
- **No Texian Navy vessel was lost or storm-damaged in 1835 or 1836.** The *Brutus* was battered to pieces off Galveston by
  a storm — in **1837**, in Racer's Storm.

### 6.3 The trap: Racer's Storm is 1837

Racer's Storm is **2-6 October 1837**, eighteen months after this game ends, and Roth's account names every detail that
gets misattributed: "the first recorded storm to rake the entire Texas coast"; landfall "briefly south of Brownsville near
Matamoros, lashing the coast for three days"; "**All vessels at Velasco were driven ashore**"; "The storm at Galveston
lasted from the 3rd through the 5th. **A storm surge six to seven feet higher than the spring tide inundated the coast.**
The scene on the Island was one of utter desolation. The new Tremont hotel was blown over"; and "**Two Texas Naval
schooners were dashed to pieces on Galveston Island.**"

**Every one of those belongs to 1837.** Search results attach them to "1835" freely. If any of that imagery ever appears in
this repository attached to 1835 or 1836, it is wrong and it came from this section being ignored. See `HIST-TEX-232`.

---

## 7. Tornadoes and severe storms

### 7.1 The answer, stated plainly

**No dated record of a tornado, whirlwind or waterspout in Texas in 1835 or 1836 exists in any source reachable from here.
None was found, and none is invented.** Where it was looked for:

| Looked in | What it gives |
| --- | --- |
| SPC / NOAA official tornado database | **Begins 1950.** "official NWS data for tornadoes begins in 1950". The Tornado Project's Texas list opens with "JAN 26, 1950", Brooks County. |
| Texas Almanac, *Texas Tornados* | All statistics **1951-2011**; nothing earlier discussed. |
| TSHA *Handbook of Texas*, *Tornadoes* | Quantified data **begins 1916**. Its earliest 19th-century item is anecdotal and undated past the month: "According to one account, a tornado in the Cedar Creek community in **May 1868** 'blew cattle into the air, lodging them in trees.'" Nothing before 1868, nothing on 1835-36. |
| Wikipedia, *List of Texas tornadoes* | Says records run "since **1878**, the year with the first recorded instance in the state", but **its own earliest dated entry is 26 January 1879** and no 1878 Texas event was found anywhere. Treat "1878" as unsupported. |
| Grazulis, *Significant Tornadoes 1680-1991* | **Exists; not readable from here.** Every Grazulis-derived compilation that was readable gives the same earliest Texas entry. |
| *Telegraph and Texas Register*, 1835-36 | **Sampled, not swept.** The Portal's full-text search is behind a bot-check that was not answered, but its item and `/ocr/` pages are open, so **four 1836 editorial pages were read** — San Felipe, 20 and 27 February, 12 and 24 March — and **none carries any weather remark at all**, tornado or otherwise (§13). Four issues cannot support a negative about the run. **This is the one gap worth closing by hand.** |

**The earliest individually documented Texas tornado found is 26 January 1879, near Lockhart** — "Grazulis estimates that an F2 tornado struck near Lockhart, TX. 40 homes were damaged or destroyed and one child was killed. 15 others were injured" (Tornado Talk, attributing it to Grazulis). That is **forty-three years after this game ends.**

**So: the game builds no tornado.** Not because a tornado could not have happened — Texas has about 130 a year and April through June is the season (§8.6) — but because **the systematic record does not begin until long after 1836**, and a tornado is exactly the kind of event a class would remember as a fact about 1836 if the game showed it one.

### 7.2 But there is one dated severe storm, and it is a good one

**The night of 29 February - 1 March 1836, at Washington-on-the-Brazos.** William Fairfax Gray, who carried a thermometer
and read it, on the morning the Convention opened:

> "Yesterday was a warm day, and at bed time I found it necessary to throw off some clothes. In the night the wind sprung up
> suddenly from the north and **blew a gale, accompanied by lightning, thunder, rain and hail**, and it became very cold. In
> the morning the **thermometer was down to 33 degrees**, and everybody shivering and exclaiming against the cold. **This is
> the second regular norther that I have experienced.**"

This is the single richest weather sentence in the whole period, and it is a **norther, a thunderstorm and a hailstorm in
one night**, dated, and in the colonies rather than at Béxar.

**It is corroborated three ways, which is why it can be trusted:**

1. Almonte, at Béxar 150 miles west, wrote of **29 February**: "The weather changed—thermometer at **55**—in the night it
   commenced blowing hard from the west... The wind changed to the north at midnight." Gray's "yesterday was a warm day"
   and Almonte's 55° are the same warm day; Gray's gale from the north and Almonte's "changed to the north at midnight"
   are the same wind shift.
2. Almonte's **1 March** morning reading at Béxar is **36 °F**; Gray's at Washington is **33 °F**.
3. TSHA's *Convention of 1836*: "The convention met on March 1, 1836, in **near-freezing weather** in an unfinished
   building."

**The date is now firm.** The passage is Gray's entry **for 1 March 1836** (SMU 1997 edition, p. 112, §3.2), describing the
night just past — so the gale fell on the night of **29 February - 1 March**, which is exactly how Washington on the
Brazos's own site frames it. It is also the same night Almonte, at Béxar, recorded the wind changing to the north at
midnight. The same entry goes on: "Notwithstanding the cold, the members of the Convention... met today in **an unfinished
house, without doors or windows. In lieu of glass, cotton cloth was stretched across the windows**, which partially
excluded the cold wind."

**One caveat remains.** Gray's "the second regular norther that I have experienced" counts only his own weeks in Texas,
which began on 31 January, and his own word is "**regular**"; it is **not** a count of the winter's northers.

**Use:** this is the warrant for the `storm` kind existing at all (§10.1), and it is the model for what a `storm` is — a
norther arriving violently rather than quietly. It also shows that **hail is in the record and a tornado is not**, which is
the distinction the game should keep.

---

## 8. The ordinary climate, as a declared basis for inference

### 8.1 The rule

Everything in this section is **modern data, used to fill gaps the 1836 record leaves**. It is marked as such here, it is
marked as `HIST-TEX-234` in `HISTORY.md`, and **no number in this section may ever be spoken to a class as an 1836
observation.** Where the record and a normal disagree, the record wins and the disagreement gets written down (§8.7 is the
worked example).

### 8.2 Rain: how many days a month it actually rains

NOAA NCEI **U.S. Climate Normals, 1991-2020**, monthly files at
`https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/<STATION>.csv`. Two columns: `MLY-PRCP-NORMAL` (inches)
and `MLY-PRCP-AVGNDS-GE001HI` (mean number of days with 0.01 inch or more). Read 2026-09-20; the San Antonio file was
re-read independently and its figures match exactly.

**Inches / days with measurable rain:**

| Station (what it stands for) | Sep | Oct | Nov | Dec | Jan | Feb | Mar | Apr |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| San Antonio Intl — **Béxar** (`USW00012921`) | 3.88 / 6.9 | 3.75 / 6.4 | 2.08 / 6.4 | 2.00 / 7.4 | 1.96 / 6.9 | 1.74 / 7.4 | 2.31 / 8.5 | 2.42 / 6.4 |
| Gonzales 2S — **Gonzales** (`USC00413622`) | 3.58 / 6.7 | 3.94 / 4.8 | 2.73 / 5.8 | 2.66 / 6.4 | 2.37 / 7.3 | 2.07 / 7.1 | 2.80 / 6.5 | 2.82 / 4.9 |
| Austin Bergstrom — **Mina/Bastrop** (`USW00013904`) | 3.03 / 6.6 | 4.25 / 6.6 | 2.68 / 7.1 | 2.61 / 7.4 | 2.82 / 7.5 | 1.89 / 7.6 | 2.90 / 8.5 | 2.39 / 7.1 |
| Victoria Rgnl — **Victoria, Goliad, Refugio** (`USW00012912`) | 4.53 / 10.0 | 3.97 / 7.3 | 2.93 / 7.5 | 2.34 / 8.2 | 2.67 / 8.9 | 1.96 / 8.2 | 2.99 / 7.4 | 3.01 / 6.8 |
| Houston IAH — **Harrisburg, Lynchburg, San Jacinto** (`USW00012960`) | 4.71 / 8.4 | 5.46 / 7.7 | 3.87 / 7.6 | 4.03 / 9.6 | 3.76 / 10.0 | 2.97 / 8.8 | 3.47 / 8.8 | 3.95 / 7.3 |
| Nacogdoches — **Nacogdoches** (`USC00416177`) | 4.07 / 7.6 | 4.34 / 6.9 | 4.44 / 8.9 | 4.78 / 10.6 | 4.46 / 10.3 | 4.21 / 9.9 | 4.47 / 9.7 | 4.01 / 8.2 |

**Days divided by days in the month** — arithmetic done here, not NOAA's — gives the per-day share the game wants:

| Region | stands on | Sep | Oct | Nov | Dec | Jan | Feb | Mar | Apr |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `west` | San Antonio, Gonzales, Victoria | .23 | .21 | .21 | .24 | .22 | .26 | .27 | .21 |
| `centre` | Houston IAH | .28 | .25 | .25 | .31 | .32 | .31 | .28 | .24 |
| `east` | Nacogdoches | .25 | .22 | .30 | .34 | .33 | .35 | .31 | .27 |

**Read that against the game's present numbers and two things jump out.**

1. **`RAIN_SHARE_ORDINARY = 0.2` is about right for the interior and too dry for the east.** One day in five is close to
   Béxar's and Gonzales's .21-.24; Nacogdoches in winter is a third of all days.
2. **`RAIN_SHARE = 0.5` for March and April is two to three times any normal in the table.** It is not defensible as
   climate — but it is not meant as climate. It is `FIC-GONZ-049` standing in for `HIST-TEX-068`, the spring the record
   calls "unusually wet", and the game has nothing else to carry that with. The honest fix is to say so: **a base share
   and a named wet-spring multiplier on top of it, tied to `HIST-TEX-068` rather than hidden inside a constant.** That is
   what `FIC-GONZ-132` proposes.

**But read §8.8 before using this table at all.** There is an instrumental record of **rain days in the actual months**,
from a post just across the Sabine, and it is a far better anchor than a modern normal. It says, among other things, that
**November 1835 had 17 rain days out of 30** — nothing in the table above would have predicted that.

`ceiling:` the Gonzales 2S figures are a once-a-day volunteer observer's and run one to two days a month below the nearby
automated airports, which catch light events a volunteer misses. Gonzales 2S is the real Gonzales record and is given here
for that reason; the `west` row uses the airport-style values instead, and Gonzales 2S is the low bound.

### 8.3 Temperature, and how often a norther comes

Normal daily maximum / minimum, °F, same files:

| Station | Sep | Oct | Nov | Dec | Jan | Feb | Mar | Apr |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| San Antonio | 90/70 | 82/60 | 72/50 | 65/42 | 63/41 | 68/45 | 74/52 | 80/58 |
| Gonzales 2S | 90/69 | 82/59 | 72/49 | 64/42 | 62/40 | 66/44 | 73/51 | 79/57 |
| Houston IAH | 90/71 | 83/61 | 73/52 | 65/46 | 64/44 | 68/48 | 74/54 | 80/60 |
| Nacogdoches | 88/67 | 78/56 | 68/45 | 60/38 | 58/36 | 62/40 | 69/46 | 76/53 |

Set Maverick's Béxar readings beside the San Antonio row and the November of 1835 is plainly abnormal: a **28 °F** morning
against a normal November minimum of 50 °F, and three consecutive mornings at or below freezing. Austin was not
exaggerating — and the next table says how much.

**How many freezing mornings a month are normal.** From the station file the owner put on disk,
`C:\Users\zachw\Downloads\USW00012921.csv` — NOAA NCEI 1991-2020 monthly normals for **SAN ANTONIO INTL AP, TX US**
(29.5442, −98.4839, 240.5 m), read 2026-09-20. Its `MLY-TMAX-NORMAL` and `MLY-TMIN-NORMAL` columns **match the San Antonio
row above exactly**, which is a useful independent check on §8.2's whole table. It also carries something the web files did
not: mean number of days a month with the minimum at or below a threshold.

| Mean days a month with the minimum at or below | Sep | Oct | Nov | Dec | Jan | Feb | Mar | Apr |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 40 °F | 0.0 | 0.6 | 5.8 | 14.1 | 15.8 | 9.3 | 3.8 | 0.7 |
| **32 °F (a freezing morning)** | 0.0 | 0.0 | **1.3** | **4.3** | **4.7** | **2.7** | **1.0** | 0.0 |
| 20 °F | 0.0 | 0.0 | 0.0 | 0.0 | 0.1 | 0.2 | 0.0 | 0.0 |
| 0 °F | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |

And `MLY-TMAX-AVGNDS-LSTH032` — a day that never rises above freezing — is **0.1 in January and 0.1 in February** and zero
in every other month: about **once a decade** at San Antonio.

**What that does to the record.** A normal November at Béxar has **1.3** freezing mornings. **November 1835 had at least
three, consecutively — 28°, 31° and 30° on the 23rd, 24th and 25th** — with 36½° on the 21st. *Inference:* that is roughly
three times a normal November's freezing mornings, all inside one week. It does **not** reach the extraordinary: 28 °F is
above the 20 °F threshold that is itself a once-in-five-or-ten-year morning, and no day in the record failed to rise above
freezing. **So the right reading of November 1835 is "a hard spell, two or three times the normal count, inside one
week" — not "a once-in-a-century freeze".** That is the calibration `FIC-GONZ-132`'s norther share should aim at.

**Frequency of northers.** No NWS or State Climatologist page gives fronts per month for south-central Texas. The one
quantitative source found: Allahdadi, Li and Chaichitehrani (2023), on cold fronts over the northern Gulf of Mexico from
autumn through spring — "On average, they pass the region every **3-7 days**, with a duration ranging between **24 and
74 h**" (NOAA Institutional Repository, `repository.library.noaa.gov/view/noaa/65491`). A front reaching the Texas-Louisiana
shelf has by definition crossed south-central Texas, so this is an upper-bound proxy, not a measurement of Béxar.
**Inference**, and it brackets §4.2's count from the diaries themselves (one every 6 to 11 days, in the days the diarists
cover). TSHA's *Blue Norther* entry gives the shape without a rate: "a rapidly moving autumnal cold front that causes
temperatures to drop quickly and that often brings with it precipitation followed by a period of blue skies and cold
weather" — which is Almonte's late February exactly.

**Deliberately not used:** the widely repeated "10 to 20 blue northers a year", "three a month", and the 20-30 °F-in-minutes
drop. Their citation trail runs to newspaper columns, not to a meteorological source. The game's norther rate should come
from §4.2 and the 3-7 day figure, not from those.

### 8.4 Snow

Same normals files. Every month from September to April is **0.0 inches** except a trace at two stations:

| Station | Feb | Dec | Mean days a year with 0.1 in or more |
| --- | --- | --- | --- |
| San Antonio Intl | 0.1 | 0.1 | 0.3 |
| Austin Bergstrom | 0.1 | 0.1 | 0.2 |
| Houston IAH | 0.0 | 0.0 | 0.1 |

**Inference:** measurable snow falls at San Antonio about once in three years, at Austin about once in five, at Houston about
once in ten. So a snowless winter at Béxar is the ordinary case, and the silence of Maverick's and Almonte's thermometer
diaries (§5.1) is exactly what the climate predicts. **This is why the game builds no snow** — not merely that no source
records it, but that the base rate says it probably did not happen.

### 8.5 The hurricane season

"The Atlantic hurricane season runs from June 1 to November 30", peaking around 10 September (NOAA NHC,
`nhc.noaa.gov/climo/`). TSHA's *Weather*: "Hurricanes strike the Texas coast an average of **one every three years**", with
the danger highest in "August and September". **The class window contains only the last two months of one season and none
of the next**, and the record for that particular autumn has nothing (§6.1). Both the record and the climatology say the
same thing, which is as strong as this question gets.

### 8.6 The spring severe season

TSHA's *Weather*, by George W. Bomar: "Although tornadoes can occur anytime, most of them materialize during **April, May,
and June**. In a normal year, about **130 tornadoes** are sighted in Texas, **30 percent of which occur in May**"; and
"Intense and prolific thunderstorms, often moving in 'squall lines,' roam much of Texas in the late spring." NWS Fort Worth:
"The frequency of thunderstorms and associated severe weather peaks during the spring."

With one caveat that matters for the eastern colonies — NWS Houston/Galveston: "tornadoes can occur in southeast Texas any
time of year… some of the worst tornado outbreaks on record in southeast Texas have actually occurred in the late fall and
winter months."

**Use:** this is the warrant for `storm` existing in March and April and not in the other months (§10.2, step 4). It is
*not* a warrant for a tornado (§7).

### 8.7 Was 1835-36 an unusual year? The tree rings say less than the diarists do

Reconstructed **June Palmer Drought Severity Index** from baldcypress and post-oak chronologies, Cleaveland, Votteler,
Stahle, Casteel and Banner (2011), *Texas Water Journal* 2(1), calibrated 1931-2008 and reconstructed 1500-2008, archived at
NOAA Paleoclimatology. The Division 7 file was read directly and the figures below were copied from it, 2026-09-20:

| Year | Div. 6 Edwards Plateau | **Div. 7 South Central** (Gonzales, Béxar) | **Div. 8 Upper Coast** (Harrisburg, San Jacinto) |
| --- | --- | --- | --- |
| 1833 | 4.60 | 4.31 | 3.43 |
| 1834 | 2.46 | 1.55 | 0.71 |
| **1835** | −0.14 | **−2.75** | **−2.64** |
| **1836** | 0.04 | **−0.21** | **0.39** |
| 1837 | 0.80 | 0.01 | 0.88 |

`https://www.ncei.noaa.gov/pub/data/paleo/treering/reconstructions/northamerica/usa/texas/texas2011pdsi_txcd7-noaa.txt`
(also `_txcd6-` and `_txcd8-`); study landing page `ncei.noaa.gov/access/paleo-search/study/33112`.

**What it means, carefully.** This is *June* PDSI at **annual** resolution, and a tree ring integrates roughly the preceding
autumn through the following June. So:

- The **1835** value (−2.75, moderate-to-severe drought in the South Central division) describes the growing season that
  **ended just before the class opens** — the summer the colonists were arguing about the cannon.
- The **1836** value (−0.21, near normal) is the one that **overlaps the class window**, autumn 1835 through spring 1836.

**Inference, and an honest tension.** A proxy that says "near normal over nine months" and five eyewitnesses who say "the
spring was unusually wet" are not in conflict — a wet March and April sitting on top of a dry autumn averages to normal —
but the proxy does mean **the Revolution year was not a freakish year overall**, and the game should not make it one. The
wetness belongs to the spring, sharply, and not to the whole class. **An annual index cannot speak about a month, and
cannot speak at all about whether it rained on a given day.** It is recorded here so that nobody later mistakes
`RAIN_SHARE = 0.5` for a fact about 1836.

On whether the 1830s were colder than now: the Little Ice Age is conventionally placed about 1450-1850, but **no
Texas-specific temperature reconstruction was found, and no quantified statement from the Texas State Climatologist.**
**Put no number on it.** The game should treat 1836 temperatures as modern ones, and let Maverick's 28 °F and Almonte's
39 °F be the only figures it ever quotes.

### 8.8 The instrumental record near Texas in the 1830s — and it covers the exact months

**This is the best find of the whole research, and it is not a normal: it is an instrument reading, in the year itself.**

The U.S. Army Surgeon-General's post surgeons kept meteorological registers from the 1820s, and the published
*Meteorological Register for Twelve Years, from 1831 to 1842* (Washington: C. Alexander, 1851) prints them month by month.
**Fort Jesup, Louisiana — 31°30′N, 93°47′W, just east of the Sabine and about 100 miles from Nacogdoches — observed without
a break from October 1827 to December 1845**, so **September 1835 through April 1836 is fully covered**. In the January-April
1836 tables Fort Jesup is the **southernmost post still reporting** in the whole country; Baton Rouge, New Orleans, Fort
Wood and Key West all drop out.

**Fort Jesup, Louisiana — monthly, September 1835 to April 1836.** Temperatures °F; Fair, Cloudy, Rain and Snow are counts
of **days**.

| Month | 7 a.m. | 2 p.m. | 9 p.m. | Mean | Highest | Lowest | Fair | Cloudy | **Rain** | Snow |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sep 1835 | 67.43 | 82.30 | 71.25 | 73.66 | 89 | 56 | 25 | 1 | **4** | 0 |
| Oct 1835 | 57.77 | 73.77 | 62.7 | 64.77 | 86 | 46 | 23 | 1 | **7** | 0 |
| Nov 1835 | 48.56 | 60.00 | 53.2 | 53.92 | 79 | 30 | 11 | 2 | **17** | 0 |
| Dec 1835 | 42.25 | 64.16 | 50.7 | 52.37 | 74 | 40 | 25 | 0 | **6** | 0 |
| Jan 1836 | 42.48 | 59.09 | 50.6 | 50.74 | 78 | 32 | 18 | 0 | **13** | 0 |
| Feb 1836 | 42.68 | 64.78 | 55.0 | 54.14 | 80 | **24** | 18 | 0 | **11** | 0 |
| Mar 1836 | 45.41 | 65.06 | 54.8 | 55.08 | 82 | 36 | 20 | 0 | **11** | 0 |
| Apr 1836 | 59.50 | 76.60 | 67.4 | 67.85 | 81 | 50 | 13 | 6 | **11** | 0 |

**Fort Towson (33°53′N, 94°13′W), on the Red River directly opposite Texas:**

| Month | Mean | Highest | Lowest | Fair | Cloudy | **Rain** | Snow |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sep 1835 | 68.14 | 88 | 52 | 19 | 3 | 8 | 0 |
| Oct 1835 | 59.75 | 82 | 48 | 27 | 4 | 0 | 0 |
| Nov 1835 | 43.04 | 74 | **18** | 14 | 14 | 2 | 0 |
| Dec 1835 | 45.09 | 72 | 22 | 26 | 5 | 0 | 0 |
| Jan 1836 | 41.17 | 68 | 26 | 17 | 12 | 2 | 0 |
| Feb 1836 | 44.77 | 70 | 30 | 14 | 11 | 4 | 0 |
| Mar 1836 | 47.94 | 76 | 24 | 13 | 16 | 1 | **1** |
| Apr 1836 | 61.59 | 83 | 55 | 15 | 12 | 3 | 0 |

Also read from the same pages: **Fort Gibson, February 1836** mean 43.06, high 74, low 14, **5 snow days**; January 1836
mean 40.48, high 70, low 14, 2 snow days.

**What it confirms, and it is remarkable how well:**

1. **November 1835 really was extraordinary. 17 rain days out of 30 at Fort Jesup**, against 6 in December and 7 in
   October. Austin's "the most inclement, wet, and cold spell of weather known in this country for many years" and
   Maverick's five freezing mornings at Béxar are **independently confirmed by an instrument 400 miles away**. `HIST-TEX-222`
   is no longer resting on adjectives.
2. **The autumn before it was dry. Four rain days in September, seven in October** — which is exactly what the tree rings
   say (§8.7: 1835 a drought year in South Central Texas). Two completely independent proxies agreeing.
3. **The winter and spring were wet but not freakish**: 13, 11, 11, 11 rain days from January to April. Against Fort
   Jesup's own November that is unremarkable, and it is close to the modern east-Texas normals in §8.2.
4. **No snow at Fort Jesup in any of the eight months**, one snow day at Fort Towson in March 1836, five at Fort Gibson in
   February 1836 — 300 miles north of the colonies. `HIST-TEX-226`'s negative holds and gains a shape: snow in that winter
   belonged to the north, not to the settled country.
5. **The extreme minima**: 24 °F at Fort Jesup in February 1836, 18 °F at Fort Towson in November 1835. Béxar's coldest
   recorded figure, 28 °F, sits between them, in the right order for its latitude.

**The printed register does NOT contain rainfall in inches** (its weather block is four columns of *days* and nothing else,
in the whole 1831-1842 volume) **and has no remarks column**, so no printed mention of northers or sleet beyond the
snow-day counts. The only rainfall depth in print for Fort Jesup is Forry's multi-year figure: "The annual quantity of rain,
on an average of four years, is 47.43 inches."

### 8.8.1 But the manuscript forms have much more, and they start in the right month

The owner put **Gary K. Grice, *History of Weather Observing at Fort Jesup, Louisiana 1827-1845*** (February 2005, prepared
for the Midwestern Regional Climate Center under NOAA's Climate Database Modernization Program) on disk as
`C:\Users\zachw\Downloads\noaa_1236_DS1.pdf`. **It is a station history, not a data set** — 79 pages on where the
instruments stood, who read them and how — and it contains **no 1835-36 observations at all**. What it does establish, and
it is worth a great deal, is verbatim:

- **The record's span, which confirms §8.8's table.** "The National Climate Data Center database contains almost unbroken
  records of weather observations at Fort Jesup from **Oct 1, 1827 through Dec 1845**. Primary exceptions were Oct 1843
  through Mar 1844 and Aug 1845 when observations were missing." **Nothing is missing in the class's window.**
- **Daily written weather descriptions begin on the first day of the game's October.** "Prior to Oct 1835, Army surgeons at
  Fort Jesup provided weather information in the 'Remarks' section of the forms approximately one-third to one-half of the
  time, i.e., when significant weather occurred. **On Oct 1, 1835, the surgeons began logging weather descriptions daily.**
  This continued until Apr 1840."
- **And daily rainfall in hundredths of an inch begins in the same month.** "On Jul 23, 1833 the surgeons began measuring
  24 hour rainfall (accuracy to one hundredth of an inch). The rainfall observations stopped in Jan 1834 and **started
  again in Oct 1835, continuing until the end of observations in Dec 1845**." The instrument was "a conical rain gage of De
  Witt; and observations are ordered to be made immediately after every shower or fall of rain or snow", and the October
  1835 form itself carries a note beginning "The Rain-gage used in ascertaining the fall of rain is constructed after the..."
- **A caveat on §8.8's column headings.** "Also on **Oct 1, 1835**, temperature measurements were listed only as 'AM,'
  'PM,' and 'Evening.' It was not apparent whether temperature observations continued to be taken at 7 AM, 2 PM and 9 PM."
  The printed register still prints them under 7 a.m. / 2 p.m. / 9 p.m.; from October 1835 those headings are the
  publisher's convention rather than a certainty about the hour.
- **The post.** Built 1822 in Sabine Parish, "approximately 20 miles southwest of Natchitoches"; the hospital site, where
  the surgeons most likely observed, is at 31°36′41″N 93°24′9″W, 364 feet. The printed register's 31°30′ / 93°47′ is close
  but is not the surveyed hospital.

**So the single best unread source for this whole subject is now named exactly:** the **NCDC/CDMP manuscript observation
forms for Fort Jesup, October 1835 through April 1836** — a **daily** weather description and a **daily** rainfall figure
to a hundredth of an inch, for every day of the class's window but its first two, taken 100 miles from Nacogdoches. They
are images in the MRCC FORTS collection, which would not open from here (§13). **Nothing else available would improve
§10's shares by as much.**

**How these numbers were read, and what was checked.** The monthly tables are printed sideways and the archive's OCR of
them is worthless — not one station name survives. They were read from the page scans in a browser, rotated and magnified.
That is the weakest link in this document, so it was checked three ways, and the results are given honestly:

- **The day counts check exactly.** Fair + Cloudy + Rain + Snow equals the days in the month for **all eight Fort Jesup
  months, including 29 for February 1836**. Eight exact sums will not survive random misreading.
- **The three observation-hour means reproduce the printed monthly mean** in every row.
- **The year-end summary tables OCR'd cleanly and were re-read independently here**, 2026-09-20, and they match: "Fort
  Jesup 63.81 48.11 63.18 80.26 63.72 ... 94" for 1835 and "Fort Towson Fort Jesup 60.08 63.80 42.43 50.48 59.73 64.50
  77.90 78.53 60.29 61.71 ... 99 94" for 1836 are in the OCR text verbatim.
- **One check is 0.4 °F out.** Autumn 1835 at Fort Jesup is printed as 63.72; the three monthly means above average to
  64.12. Either one monthly mean carries a misread digit or the register's seasonal figures were computed from the daily
  entries. **It does not touch the rain-day counts, which are what the game needs, and which pass the strongest check
  available.**

**Use.** §10's monthly shares should be **anchored on this table and adjusted toward the interior with the modern normals**,
rather than on the normals alone — because this is the actual year, the actual months, and an instrument. The single most
important consequence: **November must be the wettest month of a class's autumn, not an ordinary one.**

**And the other instrumental records, for completeness.** No 1830s observer was found at Natchitoches, Nacogdoches or
Matamoros; Grice puts Fort Jesup about twenty miles south-west of Natchitoches, so Fort Jesup is effectively its record.
The Smithsonian's volunteer network is confirmed as beginning in **1849** — Joseph Henry budgeted for it and had about 150
observers — and a NOAA station history's title puts the first Austin record at **1842** (§2: the title only; the document
was not read). For the 1830s **the Army post surgeons are the only systematic instrumental network in North America**, and
**Maverick's and Almonte's thermometers at Béxar and Gray's in the colonies are the only readings taken inside Texas that
this research found.**

---

## 9. What the game has now, and what is wrong with it

### 9.1 As built

| Piece | Where | What it is |
| --- | --- | --- |
| `RAIN_SHARE = 0.5` | `sim/road.mjs` | the share of days it rains in March and April 1836 (`FIC-GONZ-049`) |
| `RAIN_SHARE_ORDINARY = 0.2` | `sim/road.mjs` | the share for every other month (`FIC-GONZ-094`) |
| `WET_MONTHS = [2, 3]` | `sim/road.mjs` | March and April, and nothing else |
| `rainyDay(world, day)` | `sim/road.mjs` | one hashed coin per day for **the whole class**, the day mixed before hashing so it does not run in streaks |
| `weatherOf(world)` | `sim/road.mjs` | `'rain'` or `'fair'` — the only two kinds there are |
| the bog | `sim/road.mjs` | on a rain day a family moving with its wagon bogs at `BOG_SHARE = 0.5` |
| the wade | `sim/world.mjs` `wadeAt` | on a rain day every ford takes `HIGH_WATER_TIMES = 3` as long, and one crossing in four goes wrong |
| what a class is told | `public/app.js` | `'It is raining.'` — **only on the road east, only while fleeing or refuged** |

### 9.2 The six things wrong with it

1. **One coin for a country 400 miles across.** The map runs 93.5-100.5°W. On the present model it rains at Nacogdoches and
   at Béxar, 280 miles apart, on exactly the same days and never on different ones. The record contradicts this directly:
   on the night of 26-27 February 1836 it rained continuously at San Patricio while Almonte, at Béxar, wrote "day clear".
2. **Two seasons, and the wrong two, with the wrong boundaries.** March and April wet at one day in two, everything else
   one day in five. Three things are wrong with that. The record's *worst* month is **November 1835** — Austin on the 30th
   called it "the most inclement, wet, and cold spell of weather known in this country for many years", and Fort Jesup
   counted **17 rain days in 30** — and the present model treats it as an ordinary dry month. **The first seventeen days
   of March were fine**, by Gray's diary, so the wet season starts a fortnight late. And **one day in two is two to three
   times any measured rain frequency**, modern or 1835-36.
3. **There is no cold.** The most characteristic weather of a Texas winter — the norther — is not modelled at all, although
   it is the best-documented weather in the whole period (§4) and it is what a colonial family actually had to prepare for.
4. **High water is decided by today's rain.** A river is up because of what fell upstream one to three days ago, and it
   stays up after the rain stops. The game's ford is dry the instant the coin says fair. Delgado's artillery "bogged at
   every turn of the wheel" on the night of 14 April across a prairie that was muddy **from earlier rain**, with none
   falling on it.
5. **There is no fog**, although fog is in the record on six dated mornings, five of them mornings the game already
   stages: Gonzales 1-2 October, Concepción 28 October, Béxar 6 November, Béxar 5 and 10 December, Goliad 19 March.
6. **A class is barely told.** The one weather line in the interface appears only on the road east. A family at home never
   hears that it is raining, so the weather cannot teach anything about the year the class is living in.

---

## 10. The model — built 2026-09-20

The design rule under all of it: **model what the record proves, at the coarsest grain that still shows the difference, and
leave the rest out.** Three claims carry it — `FIC-GONZ-130` (the day's kind), `FIC-GONZ-131` (the regions and the water),
`FIC-GONZ-132` (the shares by month).

**What of this section was built, and what was not** (2026-09-20, `sim/weather.mjs`, released in v2026.09.20.3):

| § | State |
| --- | --- |
| 10.1 the five kinds | **Built.** `KINDS`, `weatherOn`. |
| 10.2 three regions, a norther across all three | **Built.** `REGIONS`, `REGION_BOUNDS` (x=55, x=152), `NORTHER_DAYS`. |
| 10.3 the days written in | **Built.** `WRITTEN`, about two dozen dated rows, each carrying its source's claim ID. |
| 10.4 water that remembers | **Built,** with one correction to what is below: the rise **saturates** (`was.water + rise * (1 - was.water)`) and `WATER_SHUT` is **0.85**, not 0.8. Straight addition put 62 days of 210 over the shut line, which the record does not support; saturating it gives a median of **3 days of 210** over 200 classes, none at all in 19% of them and 16 in the worst (measured 2026-09-20, `tests/weather.test.mjs`). One further fault was found by that test file and fixed: a norther could only carry rain where it began, so **no norther ever reached the east wet**; it is the day the front *arrives* in a country that can be wet, which in the east is the day after. |
| 10.5 what a kind costs | **Built for the road and for the hunt.** The road: the wade at a ford reads `water`, a river's ford shuts past `WATER_SHUT`, the bog waits for the ground to dry. The hunt (2026-09-20, same day): the wait downwind takes the sky as well as the ground (`HUNT_WAIT`), and a damp charge costs the certainty that waiting buys (`powderDamp`) — §10.5's own note below. **Still not built from that row:** rain stopping roofing and daubing, and the norther's health cost to somebody camped without shelter. |
| 10.6 a line a day | **Not built, and deliberately.** See the note in that section. |
| 10.7 where it lives, and the save | **Built.** `saveVersion` did not move. |
| 10.8 how it is drawn | **Built.** `public/weather-art.js`. |

One number below moved after measurement and is corrected in place: the **wet spring multiplier is 1.35**, not 1.6. At 1.6
a class ran ten wet days together through the middle of March, which §8.2 and Gray's own fine warm days contradict.

### 10.1 A day has a kind, and there are five

| Kind | What it is | Warrant |
| --- | --- | --- |
| `fair` | nothing to report | the default |
| `rain` | rain fell in the day or the night before | `HIST-TEX-068`; Maverick Nov 20-21; Delgado Apr 17 |
| `norther` | wind hard out of the north, a sharp drop, two to four days; the first day may carry rain | `HIST-TEX-221`, `HIST-TEX-229`; §4 |
| `storm` | a violent thunderstorm, an hour or three, most often at night; a rain day with teeth | `HIST-TEX-231`: Delgado, the night of 17 April |
| `fog` | a dense fog before about nine in the morning, then clear | `HIST-TEX-224`: six dated mornings |

**There is no `snow` kind and no `hurricane` kind.** §5.1 and §6.1 are the reasons, and they are negatives strong enough to
build on: two thermometer-keeping diarists at Béxar through the coldest weeks of the window, neither writing the word snow;
and a hurricane list with nothing for Texas between 18 August 1835 and October 1837.

`fog`, `norther` and `rain` are not exclusive in nature, and the record shows a norther arriving with rain (Nov 20). Keep
them exclusive anyway, with one exception: **a norther carries rain on its first day at a share** (`FIC-GONZ-132`). One kind
a day is what a class can hold in its head, and it is what every `weatherOf` caller can switch on.

### 10.2 Where: three regions, and a norther that crosses all three

This is the part the record actually decides, so it is worth stating why.

> **A norther is shared. Rain is sometimes shared and sometimes not.**
>
> **Shared, four times over.** On 25 February the north wind reaches Béxar at nine at night (Almonte) and San Felipe the
> same night (Gray). On the 26th it is **39 °F at Béxar, 35 °F at San Felipe**, and at **San Patricio** the night is "very
> raw and excessively cold" with continuous rain. On 1 March it is **36 °F at Béxar, 33 °F at Washington-on-the-Brazos**,
> 150 miles east, where the Convention sat in an unfinished house with cotton cloth over the windows. And on **21
> February** a heavy storm of rain fell in the night at Washington on the same day sudden rains made the **Medina**
> unfordable at Béxar. **Four dated crossings of the whole country, in the two weeks the record covers best.**
>
> **Not shared.** Béxar's sky was "day clear" on both nights San Patricio's rain fell. Gray had ten fine warm days at
> Washington from 8 to 17 March. **Cold crosses the map; rain does not have to.**

| Region | Settlements | Character |
| --- | --- | --- |
| `west` | Béxar, Gonzales, Victoria, Goliad, Refugio, Mina/Bastrop | driest; northers arrive first and bite hardest; clear skies behind a front |
| `centre` | San Felipe, Washington, Columbia, Brazoria, Velasco, Matagorda, Harrisburg, Lynchburg | the Brazos and the coast; wetter; the Runaway Scrape's country |
| `east` | Liberty, Anahuac, Nacogdoches | wettest; the norther arrives about a day later and weaker |

A settlement's region is decided once from its map position — `sim/colonies-region.mjs` already gives every site an `x` in
miles on a longitude projection, and two cut lines are enough. A family on the road takes the region of the point it stands
on.

**How a day is decided:**

1. **A written-in day wins** (§10.3). If this date and region has a historical entry, that is the weather.
2. **Is a norther running?** A norther begins on a roll made once for the whole class:
   `share(world, 'weather', 'norther:<day>')` against the month's norther share. If it begins on day *d* it holds the
   `west` and `centre` from *d* and the `east` from *d+1*, and runs two to four days (hashed from *d*). While a norther
   holds a region, no other roll runs there.
3. **Otherwise roll rain, per region**: `share(world, 'weather', 'rain:<region>:<day>')` against that region's share for
   the month — **anchored on Fort Jesup's rain-day counts for the actual months (§8.8) and adjusted toward the interior
   with the modern normals (§8.2), not on the normals alone.** Keep the existing mixing of the day before hashing —
   `sim/road.mjs` already records that FNV-1a over keys differing by one digit runs in streaks, and that bug is worth not
   re-introducing.
4. **A rain day in March or April is a `storm`** at `STORM_SHARE` of rain days; in the other months, never.
5. **Otherwise roll fog**, and only if yesterday was `rain` and today is not: `FOG_SHARE` of such mornings. The fog in the
   record is a still, damp morning after wet — Maverick's Béxar fog of 6 November is explicitly "arising by evaporation
   from the river".

Everything stays deterministic and hashed from the class seed, exactly as `rainyDay` is now: the same class replays the same
weather, and a student who saves and reloads gets the day they had.

### 10.3 The days written in as history

These are the director's, not the coin's. Each is a dated entry that overrides the roll in the region named, and each
carries its claim ID on the event so a later reader can trace it. About two dozen rows — cheap, and the whole pedagogical
point: **the weather a class meets on the day of a battle is the weather that was there.**

| Date | Region | Kind | Claim |
| --- | --- | --- | --- |
| Sep 29, 1835 | west | the water high on the Guadalupe (the class starts wet: §10.4) | `HIST-TEX-225` |
| Oct 1-2, 1835 | west | `fog`, the night into the morning of the fight at Gonzales | `HIST-TEX-224` |
| Oct 28, 1835 | west | `fog` (Concepción) | `HIST-TEX-020`, `HIST-TEX-224` |
| about Oct 30, 1835 | all | `norther`, the first of the autumn | `HIST-TEX-221` |
| Nov 4, 1835 | centre | `storm` at San Felipe, "cold and stormy" | `HIST-TEX-222` |
| Nov 5, 1835 | all | `norther`, 75° to 55° in the day | `HIST-TEX-221` |
| Nov 6, 1835 | west | `fog` | `HIST-TEX-221` |
| Nov 18-19, 1835 | centre | `rain`; the coast road "excessively bad" and "very muddy" through to the 23rd | `HIST-TEX-222` |
| Nov 20-25, 1835 | all | `norther`, the hard one, with rain on the 20th and 21st and 28 °F on the 23rd. **This overrides the `centre` rain above where they overlap** — one kind a day, and the norther is the more specific entry | `HIST-TEX-221`, `HIST-TEX-222` |
| Dec 5, 1835 | west | `fog` at dawn, and a `norther` | `HIST-TEX-223` |
| Dec 7-8, 1835 | west | `rain`, cold | `HIST-TEX-223` |
| Dec 10, 1835 | west | `fog` at dawn | `HIST-TEX-223` |
| Feb 10, 1836 | centre | `storm` — "a storm of thunder, lightning and rain" on the prairie by the Trinity; the river "somewhat up" | `HIST-TEX-237` |
| Feb 16-18, 1836 | centre | `rain`; Mill Creek "still too high to ford"; **`fog` on the morning of the 18th, cleared about 9 o'clock** | `HIST-TEX-237` |
| **Feb 21, 1836** | **all** | `rain` — "a heavy storm of rain came on in the night" at Washington **and** "sudden rains made the Medina unfordable" at Béxar, **the same day, 170 miles apart** | `HIST-TEX-227`, `HIST-TEX-237` |
| Feb 25-28, 1836 | all | `norther`, arriving at nine at night on the 25th after "summer heat"; 35 °F at San Felipe on the 26th and 39 °F at Béxar; clear and cold behind it | `HIST-TEX-229`, `HIST-TEX-237` |
| Feb 29 - Mar 3, 1836 | all | a second `norther` from midnight on the 29th — **arriving in the `centre` as a `storm`**: a gale with lightning, thunder, rain and hail, then 33 °F at Washington and 36 °F at Béxar on the morning of the 1st, then cold and clear | `HIST-TEX-228`, `HIST-TEX-229`, `HIST-TEX-236` |
| Mar 4-5, 1836 | west | `fair`, moderating to 68 °F at mid-day on the 5th | `HIST-TEX-228` |
| Mar 13, 1836 | west | the prairie rain-soaked | `HIST-TEX-230` |
| **Mar 8-17, 1836** | **centre** | **`fair` and warm, ten days of it** — "Fine weather", "Weather warm and fine", "Weather warm and pleasant", "Fine, mild weather". **The wet spring had not started yet** | `HIST-TEX-237` |
| Mar 19, 1836 | west | `fog` (Fannin leaves Goliad) | `HIST-TEX-063`, `HIST-TEX-230` |
| Mar 18, 1836 | centre | "cloudy and drizzly" — the Scrape on the road | `HIST-TEX-237` |
| **Mar 23-24, 1836** | centre | **`storm`** — "a regular **equinoctial storm**" off Galveston Bay, heavy rain, wind hard from the north-east, "cold and cloudy" on the 24th | `HIST-TEX-237` |
| Mar 21 - Apr 14, 1836 | all | the wet spring: rain well above the ordinary share, the rivers up. **Begins about 21-23 March, not 1 March** | `HIST-TEX-068`, `HIST-TEX-230`, `HIST-TEX-237` |
| Mar 28, 1836 | centre | `rain` — "Weather cloudy and rainy" | `HIST-TEX-237` |
| Mar 31 - Apr 3, 1836 | centre | `fair` and "quite summer heat" — **a warm break inside the wet spring**, while Houston's army sat at Groce's in the rain | `HIST-TEX-237`, `HIST-TEX-068` |
| Apr 10-11, 1836 | centre | **`norther`** at Galveston — "it has rained, and a strong norther has sprung up"; "The gale still continued" on the 11th | `HIST-TEX-237` |
| Apr 14, 1836 | centre | the prairie mud, with no rain falling | `HIST-TEX-231` |
| Apr 17, 1836 | centre | `storm` after ten at night | `HIST-TEX-231` |
| Apr 19, 1836 | east | `fog` — "This morning a heavy fog" | `HIST-TEX-237` |
| Apr 21, 1836 | centre | `fair` — **inference**, and marked as such (§3.4) | `FIC-GONZ-134` |
| Apr 22, 1836 | east | the Neches "so full as to overflow its banks" — "the first instance of this kind of overflow I have seen in Texas" | `HIST-TEX-237` |
| Apr 22-25, 1836 | centre | `rain`, showers | `HIST-TEX-231` |
| Apr 23-24, 1836 | east | the Sabine road "the worst road I have encountered in Texas", an ox bogged in the middle of it; the ferry blocked by "the crowd of families" | `HIST-TEX-237` |

San Patricio, on the night of 26-27 February, is the evidence for §10.2 and not a place a class goes; it needs no region.

**Two things this table says that the game's present model gets badly wrong, and they are worth saying plainly.**

1. **The wet spring starts about 21-23 March, not 1 March.** `WET_MONTHS = [2, 3]` makes all of March and April wet at one
   day in two. Gray, in the middle of the colonies, has **ten fine warm days from 8 to 17 March** — "Fine weather",
   "Weather warm and fine", "Weather warm and pleasant", "Fine, mild weather" — and the turn comes with the drizzle of the
   18th and the equinoctial storm of the 23rd. **The first seventeen days of March were not the Runaway Scrape's weather.**
2. **And it is not unrelenting once it starts.** Gray has "Weather very warm -- quite summer heat" on 31 March and "Very
   warm weather" on 2 April, and a clear calm moonlit night on the 3rd — in the same days `HIST-TEX-068` has "unrelenting
   rainy weather" swelling the Brazos at Groce's, forty miles away. **Both can be true**: a river stays up for days after
   the rain that raised it (§10.4), and Groce's is on the Brazos while Gray was on the bay. But a model that makes every
   day of April rain is not what the one daily diary of that April says. **Rain days, a water level that decays slowly,
   and fair days in between — that is the shape.**

### 10.4 Water: the state the game is missing

**One number per region, `water`, from 0 to 1.** It rises when it rains and falls slowly when it does not:

- `rain` adds about 0.35; `storm` adds about 0.6; a `norther`'s first day with rain adds as `rain` does.
- every day subtracts about 0.15, floored at 0.
- it starts each class at the level the record gives: **high on 29 September 1835**, because the Guadalupe was blocking
  Castañeda's path that day (`HIST-TEX-225`).

Then **high water at a ford reads `water`, not today's coin** — the single change here with the best ratio of fidelity to
lines of code:

| `water` | At a ford | At a wagon |
| --- | --- | --- |
| under 0.3 | the ordinary wade, as now | no bog |
| 0.3 to 0.7 | `HIGH_WATER_TIMES` and `WADE_WRONG_SHARE` as now | `BOG_SHARE` scaled by `water` |
| over 0.7 | **a river's ford is impassable**; the family waits, or goes round by a ferry | as above |

The impassable ford is **not invented**: "sudden rains made the Medina unfordable" on 21 February 1836 is the record, and
the Runaway Scrape's five thousand people waiting three days at Lynch's ferry is what a country whose fords have shut looks
like. The threshold and the numbers are the game's own (`FIC-GONZ-133`).

**One river should be special, and the record says which.** The Runaway Scrape's flood was **the Trinity**, not the San
Jacinto (§3.3). Harris: "Our hardships began at the Trinity. The river was rising... the water broke over the banks above
where we were and ran around us... Drift wood covered the water as far as we could see... It took four days to get
everything out of the water." Gray, seven weeks earlier, had already called the Trinity's approach "a boggy, miry, nasty
prairie, or rather marsh, of several miles extent, which is subject to overflow when the river is high." Meanwhile at
**Lynch's ferry on the San Jacinto** neither diarist records weather at all — the delay there was **five thousand people**
waiting three days. **So: flood the Trinity and queue the San Jacinto.** If only one river in the game ever gets a flood
of its own, make it the Trinity; if only one crossing ever gets a queue, make it Lynch's.

`ceiling:` one water level per region, not per river. A real river crests a day or two after the rain and falls over a week,
and the Brazos and the Guadalupe do not rise together. Per-river water wants a catchment for each, and a catchment wants
upstream rain the map does not draw. The way out: if the game ever draws where a river rises, give each barrier river its
own `water` fed by its own region — and give the Trinity a slower fall than the rest, because that is what the record
describes.

### 10.5 What each kind does to what the game already models

| | `fair` | `rain` | `storm` | `norther` | `fog` |
| --- | --- | --- | --- | --- | --- |
| **fords and rivers** | — | `water` rises; wade and wrong crossing as now | `water` rises hard; a river's ford may shut | as `fair`, unless it carries rain | — |
| **the wagon and the mud** | — | bogs at `BOG_SHARE` scaled by `water` | bogs, and the day's going is cut | — | — |
| **the road east** | — | as now | the family stands still an hour or two, in the open | exertion, not delay | the first hours of the morning lost |
| **travel generally** | — | — | an hour or two lost | — | a late start |
| **hunting** | — | **worse**: wet powder (`FIC-GONZ-135`) | none | game lies up; worse | **better**: the approach is hidden |
| **felling and building** | — | no roofing and no daubing; felling unaffected | nothing outdoors | felling fine; nothing needing still hands | a late start |
| **the family's people** | — | — | exertion | **cold**: exertion, and a health cost for anyone on the road or camped without shelter | — |
| **the armies and their dates** | — | — | — | — | — |
| **the Alamo** | the siege is cold and **clear**, per Almonte | — | — | Feb 25-28 and Feb 29-Mar 3 written in | — |

**The armies keep their dates.** `SETTLEMENT_DAYS`, the Alamo's fall, Coleto, San Jacinto and the couriers are untouched by
weather. `docs/MAP_ACCURACY.md` already holds that line, and `VISION.md`'s rule that the director preserves the outcome is
the reason. Weather changes what a *family* meets; it never changes what history did.

**Hunting in the rain — built 2026-09-20.** The warrant is thin but real: Smithwick, crossing swollen streams on foot,
wrote that "our only care being to keep our powder dry". The penalty is the game's own (`FIC-GONZ-135`); the concern is
the period's. As built, in `sim/hunting.mjs`:

- **The wait downwind takes the sky as well as the ground** (`HUNT_WAIT`, read by `stillTicks`): ×1.5 in rain, ×1.8 in a
  storm, ×1.4 in a norther, **×0.6 in a fog** — the one kind of day that is *good* hunting weather, because the approach
  is hidden, which is how the Texians got within musket shot at Concepción. The ground still decides most of it: the
  poorest country in a fog is a longer wait than the best country in rain.
- **A damp charge costs the certainty that waiting buys** (`powderDamp`, which is `rainingAt` — so a norther that carried
  no rain does not count). On a dry day a hunter who lets the quarry come close cannot miss; in the rain that guarantee
  is gone and the shot wants the steady hand the *long* shot wants, or a rifle the gunsmith has put in order. So **the
  knack is what keeps your powder dry**, which is the right shape. The family is told which fault it was: "his powder had
  taken the wet and the rifle would not fire", not "fired and missed".
- **No die in any of it** (`FIC-GONZ-008`), and the control says it before anybody is sent: `skyWords` reads the wait off
  `HUNT_WAIT` and the powder off `rainingAt`, so the words cannot drift from what the hunt actually does, and the shot's
  own question says *"The rain is on the powder"* with the `wait` option's note changed to match.
- **Measured** over six classes of thirty families, three periods: a hunt takes **5.89 ticks a shot against 5.17**, about
  **0.73 charges a class take the wet**, the median family's hungry ticks move **4 → 5** (the four gathering works absorb
  it), and the final number, the glory and the houses do not move. One thing the measuring found: the balance study
  counted misses by the words " fired and missed ", so a damp charge was silently dropping out of the count and the hunt
  looked as though it had got *easier* on the day it got harder. It counts both now, and tells them apart.

`ceiling:` one multiplier a kind, the same everywhere and in every month; a norther's first bitter day is worse than its
third and nothing here knows that. And the sky is read at the place the hunter walked to rather than at the house, which
no test can tell apart: the two are a few hundred yards into one weather region.

### 10.6 What a class sees, and is told — NOT BUILT, superseded 2026-09-20

**Read §10.8 instead.** This section was written before the owner answered the question it asks. They answered it on
2026-09-20: *"Weather should be a visual thing. Update the game via a sub-agent so that we don't need text to explain the
weather to players. Players should see the weather. If implemented correctly, no text should be required."* So **none of
the lines below were built**, and `FIC-GONZ-136` is marked superseded. What replaced them is the weather drawn on the map
(§10.8, `FIC-GONZ-190`, `FIC-GONZ-191`). The one thing this section got right and the drawing keeps: **no forecast, no
almanac, no thermometer, no weather panel.** The lines are left here because they are a useful statement of what each kind
of day is supposed to feel like — which is what the drawing had to convey without them.

One line a day, at the family's own place, in the voice the game already uses. Not a forecast, not a number, not a panel.

- `rain` — *"It rained in the night. The creeks are up and the black ground is heavy."*
- `rain`, several days running — *"It has rained three days. The rivers are up and the fords are bad."*
- `storm` — *"A storm came through after dark: wind, and rain enough to stand still in."*
- `norther`, first day — *"A norther came out of the north in the night. It has gone bitter, and it will hold two or three days."*
- `norther`, holding — *"Still bitter, and the wind out of the north."*
- `norther`, breaking — *"The norther let go in the night. It is fair and mild again."*
- `fog` — *"Fog on the bottoms this morning. It will burn off by nine."*
- a ford shut — *"The water is over the crossing at the Guadalupe. Nobody is fording it today."* The existing wade lines
  stay for high water that can still be crossed.

Two written-in lines, on the two days the record names something a class should hear in the period's own words, each
carrying its claim ID so a teacher can show where it comes from:

- **Nov 23, 1835** — *"Water in the house froze over as thick as a dinner plate."* (Maverick, at Béxar, that morning.)
- **Nov 30, 1835** — *"The oldest hands say it is the most inclement, wet, and cold spell of weather known in this country
  for many years."* (Austin, that day.)

### 10.7 Where it lives, and the save

- `rainyDay` and `weatherOf` keep their present signatures and become thin readers over a new
  `weatherOn(world, day, region)`. Everything that calls them today keeps working.
- **Do not bump `saveVersion`.** A class saved before this has no weather state; the correct empty value is `fair` with
  `water: 0`, and every existing class then opens on a world that is right rather than wrong. `sim/trade.mjs` is the worked
  example and `CLAUDE.md` is explicit. The one thing to watch: a class already past 29 September would start dry where the
  record has the Guadalupe up — a *less* accurate world, not a wrong one. Default it and leave it.

---

### 10.8 How it is drawn, and that it is never written — built 2026-09-20

**§10.6 above proposed one line a day. The owner decided otherwise on 2026-09-20, after this research was merged:**

> "Weather should be a visual thing. Update the game via a sub-agent so that we don't need text to explain the weather to
> players. Players should see the weather. If implemented correctly, no text should be required."

So **there is no weather line, no label, no icon and no panel**, and §10.6's wordings are not built and should not be.
What a class is told about the weather is nothing; what it is shown is `public/weather-art.js`, and the claims are
`FIC-GONZ-190` (how each kind is drawn) and `FIC-GONZ-191` (the regions blended, and a river over its banks).

The family's own journal is untouched: a wade that went wrong or a wagon bogged is still recorded, because that is what
happened to **them**, not a description of the sky.

| Kind | What a student sees, and nothing else |
| --- | --- |
| `fair` | nothing at all. The day the others are read against, and it costs the page nothing to draw |
| `rain` | rain falling in two layers, the light flat and grey, the ground and the roads and the fields darkened together under it, the creeks running fuller and browner |
| `storm` | the same, harder and much darker, and lightning banked in the far sky at the top of the view — **at a distance, never a bolt among the people** |
| `norther` | **a wind, and a clear sky.** The trees and the grass lean with it, dust and the last leaves stream north to south down the screen, the light goes thin and blue and a little brighter. **No rain and no cloud** (§3.3, `HIST-TEX-228`) — except on the day the simulation marks `wet`, which draws its rain too |
| `fog` | a pale veil lying on the bottoms and banked along the water, thinning through the morning and gone by half past nine (§3.2, Gray's "Cleared off about 9 o'clock") |
| `water` | the rivers fuller and brown, the low ground along them dark and soaked; **past the level that shuts a ford, out of their banks altogether, with drift on the water** |

**Two rules in it are not decoration and must survive any later change.**

1. **The fog is drawn under the people, the houses, the markers and the names.** It is scenery, never knowledge: what a
   family may know is decided on the server (`VISION.md`), and a veil on the page that hid a person or a marker would be
   the client deciding. `FOG_CEILING` caps it well below opaque as well, and a test holds both.
2. **A river at or past `WATER_SHUT` must read at a glance**, because that is the level at which a family walks down to a
   crossing and is turned back. A river the page drew as ordinary while the simulation had shut its ford would be the
   worst failure this drawing can have; `tests/weather-art.test.mjs` holds the page's two water levels to
   `sim/weather.mjs`'s so they cannot drift apart.

The cost, measured before and after with `scripts/perf-render-measure.mjs`, is in `docs/PERFORMANCE_RENDER.md`, "The
weather, drawn". The pictures are in `docs/evidence/weather/`, written by `scripts/weather-browser-proof.mjs`, and every
day in them is a real day of a real class taken from `weatherOn`.

---

## 11. What I would not build, and why

1. **Snow.** No source read records snow in the settled colonies or at Béxar in 1835-36, and two men with thermometers at
   Béxar through the coldest weeks did not write the word. The only dated snow of the period fell on the Mexican army on
   13 February, and *where* it fell is disputed between "south of the Rio Grande" and "in Texas". Building snow means
   asserting the disputed side of a dispute the game does not need to enter.
2. **A tornado.** §7. Inventing one would put the most memorable weather event of a class's year on no evidence at all.
3. **A hurricane.** §6. The class window contains none. The temptation is Racer's Storm, and Racer's Storm is 1837.
4. **Temperature as a number shown to a class.** Almonte's 39° and Maverick's 28° are worth quoting on their own days; a
   running thermometer implies a precision the record has for **two windows at one town** and nowhere else.
5. **Per-site weather, or a weather grid.** Three regions is already more than the record can check. A grid would be
   invention dressed as resolution, and every cell of it would be `FIC`.
6. **Wind direction as a mechanic.** It is in the sources — "blowing hard from the west", "changed to the north at
   midnight" — and it is fine prose, and it does nothing to anything the game models.
7. **A forecast, an almanac, or a weather panel.** A family in 1835 knew what the sky looked like this morning. Telling a
   class what tomorrow holds is the one anachronism here that would really change how they play.
8. **Weather that moves the armies or the couriers.** Rain on Santa Anna's road is texture; rain that makes the Alamo fall
   on a different day is a different game.
9. **Per-river water.** §10.4's ceiling. The catchments are not in the map.
10. **Lightning, hail, fire, or crop loss from weather.** Nothing dated supports any of them in this period, and each would
    need a whole economy rule behind it.
11. **A `saveVersion` bump.** §10.7.

---

## 12. The claims this research registers

All of them are **recorded, not built**. `HISTORY.md` carries the full text and the citations.

| ID | What it holds |
| --- | --- |
| `HIST-TEX-220` | The two instrumental weather diaries of the campaign, and what they do not cover |
| `HIST-TEX-221` | The northers of autumn 1835 at Béxar, dated, from Maverick's thermometer |
| `HIST-TEX-222` | That November 1835 was abnormally wet and cold, and that the sources say so themselves |
| `HIST-TEX-223` | The weather of the storming of Béxar, 5-10 December 1835 |
| `HIST-TEX-224` | Six dated fogs, five of them on mornings the game already stages |
| `HIST-TEX-225` | The Guadalupe up at Gonzales on 29 September 1835, the day the class opens |
| `HIST-TEX-226` | The one snowfall, where it fell being DISPUTED, and no snow in the colonies |
| `HIST-TEX-227` | Rain shutting a river's ford: the Medina, 21 February 1836 |
| `HIST-TEX-228` | The Alamo siege day by day from Almonte's thermometer — cold and **clear** |
| `HIST-TEX-229` | A norther is regional: Béxar, San Patricio and Washington-on-the-Brazos |
| `HIST-TEX-230` | The wet March of the Goliad campaign |
| `HIST-TEX-231` | April 1836: mud, the night storm of the 17th, and silence on the 21st |
| `HIST-TEX-232` | No tropical cyclone in the window; Racer's Storm is 1837 |
| `HIST-TEX-233` | Tornadoes: a negative, and when the Texas record actually begins |
| `HIST-TEX-234` | The modern normals and the tree rings, as a **declared basis for inference** |
| `HIST-TEX-235` | The Fort Jesup and Fort Towson registers — **rain days in the actual months** |
| `HIST-TEX-236` | Gray's norther with hail, Washington-on-the-Brazos, 29 February - 1 March 1836 |
| `HIST-TEX-237` | **Gray's near-daily weather series for the colonies, 31 January - 24 April 1836** |
| `HIST-TEX-238` | Dilue Rose Harris: the Trinity was the flood, Lynch's ferry was the queue |
| `FIC-GONZ-130` | That a day has one kind, and that there are five |
| `FIC-GONZ-131` | Three regions, a norther that crosses all three, and the water level |
| `FIC-GONZ-132` | The shares by month, and the wet spring as a named multiplier |
| `FIC-GONZ-133` | What high water does, and when a ford shuts |
| `FIC-GONZ-134` | The written-in days, and the two of them that are inference |
| `FIC-GONZ-135` | What weather costs a family's work and people |
| `FIC-GONZ-136` | What a class is told |

### 12.1 A mis-citation found on the way, and not fixed here

`sim/travel.mjs` (the comment on `HIGH_WATER_TIMES`) cites **`HIST-TEX-071`** for "the spring of 1836 was 'unusually wet and
the rivers swollen'". In `HISTORY.md`, **`HIST-TEX-071` is "What the refugees ate"**; the wet spring is **`HIST-TEX-068`**.
`docs/MAP_ACCURACY.md` §10.7 and the owner's own brief repeat the same slip. **Not corrected here**, because this branch
changes nothing under `sim/`. It is a one-word fix in a comment and should go in with whatever builds §10.

---

## 13. Looked for and not found, or not read

**Gated, and deliberately not forced.** The **Portal to Texas History** (`texashistory.unt.edu`) served an "I'm not a
robot" bot-check to its **search and browse**, and that check was not answered. Its **individual item and `/ocr/` pages are
not gated**, so four 1836 *Telegraph and Texas Register* editorial pages were read directly (below). What stays behind the
gate:

- **A full-text sweep of the *Telegraph and Texas Register* for 1835-36.** This is now the single biggest gap in this
  document. Four issues were read page by page — **San Felipe, 20 and 27 February, 12 and 24 March 1836**
  (`metapth47883`, `metapth47887`, `metapth47889`, `metapth47891`, each at `/m1/2/ocr/`) — and **none carries a weather,
  storm, flood or norther remark**; they are war news, the militia ordinance, the Convention, and Mrs. Dickinson's account
  of the Alamo. **That is a sample, not a sweep**, and it cannot support "the paper carried no weather in 1835-36". Other
  1835-36 ark IDs located but not read: `metapth47871` (9 Jan 1836), `metapth47874` (16 Jan), `metapth47880` (30 Jan).
  `HIST-TEX-020` and `docs/battle-research/bexar-storming.md` record earlier sessions hitting the same wall.
- **The *Southwestern Historical Quarterly* run**, including Almonte's full journal (below).

**Exists, not readable from here:**

- **Almonte's full journal, 1 February - 16 April 1836**, ed. Samuel E. Asbury, *SHQ* 48:1 (July 1944) pp. 10-32 —
  paywalled at JSTOR. **Only 23 February - 6 March was read**, from the *New York Herald*'s 1836 printing as transcribed
  at Sons of DeWitt Colony. **The missing weeks are 1-22 February (the march to Béxar) and 7 March - 16 April (the pursuit
  east, Harrisburg, New Washington, San Jacinto) — a daily weather record covering exactly the part of the campaign this
  document is thinnest on.** Getting it would be the highest-value single action anyone could take on this subject.
- **The 1909 first edition of Gray** — *From Virginia to Texas, 1835*, Gray, Dillaye & Co. **Not reached.** Archive.org
  holds only the lending-restricted 1965 reprint (`fromvirginiatote0000will`) and its search-inside answers "Item not
  available"; a catalogue search found no other copy; HathiTrust (`chi.082928577`) returns "Blocked from HathiTrust";
  Google Books (`c0REAQAAMAAJ`) returns 403 on its plain-text download and 429 on its API; Rice's TEI edition 301s to a
  403. **The diary itself was read** — see §3.2 — but in the **1997 SMU edition**, so **every Gray page number in this
  document is that edition's, not the 1909 printing's.** Anyone citing Gray to a class from a library copy will find
  different page numbers and the same words.
- **Grazulis, *Significant Tornadoes 1680-1991*** — not digitised anywhere reachable.
- **Ludlum, *Early American Hurricanes 1492-1870*** — not quotable online; nothing direct for 1835 or 1836. Roth cites it
  and Roth was read, so this is covered at one remove.
- **NOAA's Climate Database Modernization "FORTS" collection at MRCC** — `mrcc.purdue.edu` **would not connect**, retried
  2026-09-20 after downloading was allowed (`Failed to connect to mrcc.purdue.edu:443`). This is where the **daily** Fort
  Jesup forms for October 1835 - April 1836 live, with a written weather description for every day and rainfall to a
  hundredth of an inch (§8.8.1). **After Gray's diary, this is the second thing worth getting**, and unlike Gray it is
  public-domain government data that should simply be downloadable when the host is up.
- **Texas State Climatologist, *Texas Weather: Pre-1880*** — downloaded 2026-09-20
  (`climatexas.tamu.edu/products/historical-records/Texas Weather Pre1880.pdf`, 3.07 MB, 79 pages) and **it has no text
  layer at all**: it is a pure scan, `pypdf` extracts zero characters from every page, and no PDF rasteriser is available
  here to read the images. **Downloaded and not readable.** Its HTML sibling, *Severe Weather in Texas: Pre-1880s*, was
  read and has nothing for 1835-36 (its entries go 1766, 1818, then 1844). If the 79-page scan were OCR'd it might carry
  dated Texas weather for this period; nothing in this document rests on it.
- **W. T. Block, *Texas Hurricanes of the 19th Century*** — connection reset and 403. Nothing was quoted from it, which
  is just as well: the search snippets from it mixed 1835 and 1837 freely. Roth cites Block and Roth was read.
- **Chenoweth's reanalysis of historical Atlantic cyclones** — not read; Roth supersedes it for Texas.

### 13.1 Files downloaded for this research, and where they are

Downloading was disallowed when this work began and was allowed part-way through. Nothing was committed to the repository;
everything below sits in this session's scratch directory
(`%TEMP%\claude\C--Users-zachw-Texas-Civilization\<session>\scratchpad`) except the two files the owner placed in
`C:\Users\zachw\Downloads`. All of it is public-domain US government or openly published material.

| File | Source URL | Size | Used for |
| --- | --- | --- | --- |
| `txhur.pdf` — David Roth, *Texas Hurricane History*, National Weather Service | `https://www.wpc.ncep.noaa.gov/research/txhur.pdf` | 3.00 MB | §6 entirely. **Read.** |
| `txpre1880.pdf` — Texas State Climatologist, *Texas Weather: Pre-1880* | `https://climatexas.tamu.edu/products/historical-records/Texas%20Weather%20Pre1880.pdf` | 3.07 MB | **Downloaded, not readable** — a 79-page scan with no text layer. Nothing rests on it. |
| `noaa_1236_DS1.pdf` — Grice, *History of Weather Observing at Fort Jesup, Louisiana 1827-1845* (**owner-provided**) | `https://repository.library.noaa.gov/view/noaa/1236` | 1.42 MB | §8.8.1. **Read.** |
| `USW00012921.csv` — NOAA NCEI 1991-2020 monthly normals, San Antonio Intl (**owner-provided**) | `https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00012921.csv` | 41 KB | §8.3's freezing-day table, and an independent check on §8.2. **A modern normal, and nothing more.** |

**Searched for and genuinely absent:**

- **Any dated Texas tornado, whirlwind or waterspout in 1835 or 1836.** §7.1.
- **Any Texas tropical cyclone between 29 September 1835 and 25 April 1836.** §6.1.
- **Any dated weather observation in the colonies between 11 December 1835 and 30 January 1836.** This is the document's
  remaining hole: **seven weeks of the class's winter with nothing dated in it.** Maverick stops on 30 November, the
  storming ends 10 December, Gray does not reach Nacogdoches until 31 January, and Harris dates by month. What covers it:
  Harris's **"The Brazos river was so low the steamboat couldn't go up"** for December, and Fort Jesup's monthly counts
  (§8.8) — 6 rain days in December, 13 in January. **Those two agree**: a dry December, a wetter January.
- **Any weather in Dilue Rose Harris's account of October or November 1835.** Both sections were read in full and contain
  **none**; her Part III (*Quarterly* vol. VII, pp. 214-222) is "Retrospection", jumps to 1838, and has nothing for
  1835-36 either. Her weather is all March and April 1836.
- **Rain at Lynch's ferry.** A modern retelling of the Runaway Scrape has a storm on the night the refugees crossed the
  San Jacinto. **Harris's published text does not say that.** At Lynch's she records the three-day wait, the five thousand
  people and the near-riot, and **no weather at all**; the storm, the flood, the dark and the sickness are at the
  **Trinity**, days later (§3.3). If a rain-at-Lynch's-ferry line is circulating, it is a modern writer's, not hers.
- **Any weather on 21 April 1836.** §3.4.
- **Any 1830s instrumental observer at Natchitoches, Nacogdoches or Matamoros.** Fort Jesup is effectively the
  Natchitoches record.
- **Any Texas-specific temperature reconstruction for the early nineteenth century**, and any quantified statement from
  the Texas State Climatologist about how much cooler the 1830s were. §8.7.
- **Rainfall in inches anywhere in the 1831-1842 army register.** §8.8. It does not exist in that volume.
- The Texas State Climatologist's *Severe Weather in Texas: Pre-1880s* page was read and **has nothing for 1835-36** — its
  entries jump 1766, 1818, then 1844 and 1854.

**A trap for the next reader.** The "Sudden Freeze of 1836" that search engines return is **20 December 1836, in Illinois**,
and the "brutal winter of 1836-37" begins after this game ends. Neither belongs here, and neither is evidence about the
winter the class plays through.

### 13.2 What a subagent got wrong, and how it was caught

Four subagents did breadth work for this document and each was checked.

**One was wrong in the way the project was warned about.** It reported that Almonte's journal contains **no evidence of
thermometer readings** and that it could not verify a single entry. That is false: the journal's daily thermometer
readings were then found and read verbatim by this session, and they are the backbone of §3 and §4. The lesson
`docs/BIOMES.md` §14.2 already recorded holds here too — **a subagent's negative is a lead, not a finding.**

**One found the thing everyone else had failed to reach**, and its Gray series (§3.2) is the largest single contribution
to this document. It was not taken on trust: §3.2 sets out the two verbatim matches with sources this session had already
read independently, and the five consecutive days on which the series agrees with Almonte's thermometer at Béxar.
**Unhappily the Internet Archive went offline before the Wayback pages could be re-read here**, so §3.2 is the one part of
this document whose sources this session did not open with its own hands, and it says so at its head.

Everything else was read at its source by this session, except where §13 says plainly that it was not.

---

## 14. Sources

**Primary, read verbatim:**

- **Samuel Maverick, diary, Béxar, September - December 1835.** Transcribed at
  [sonsofdewittcolony.org/bexarmaverick.htm](http://www.sonsofdewittcolony.org/bexarmaverick.htm), read 2026-09-20. The
  journal covers 16 March 1835 to 1 January 1836 and is in the Maverick Family Papers, Briscoe Center, UT Austin;
  reprinted by Rena Maverick Green, *Samuel Maverick, Texan*, 1952.
- **Juan N. Almonte, private journal, 23 February - 6 March 1836.** Transcribed at
  [sonsofdewittcolony.org/almontejn.htm](http://www.sonsofdewittcolony.org/almontejn.htm), read 2026-09-20; that page
  prints the *New York Herald*'s 1836 installments and **carries only these dates**. The full journal is Asbury's *SHQ*
  edition (§13).
- **Pedro Delgado, *Description of the Battle of San Jacinto* (1878).**
  [sonsofdewittcolony.org/delgadosanj.htm](http://www.sonsofdewittcolony.org/delgadosanj.htm), read 2026-09-20.
- **Sam Houston, official report of the battle of San Jacinto, 25 April 1836.**
  [texasbob.com/txdoc/texdoc15.html](https://texasbob.com/txdoc/texdoc15.html), read 2026-09-20.
- **William Fairfax Gray, diary, 31 January - 24 April 1836**, read page by page (pp. 78-165), 2026-09-20. The text is
  *The Diary of William Fairfax Gray, from Virginia to Texas, 1835-1837*, ed. Paul Lack, William P. Clements Center for
  Southwest Studies, SMU, 1997, which SMU published page by page at `sites.smu.edu/swcenter/FairfaxGray/` — **now a 404**,
  and read through the Wayback Machine (captures of 2022-11-08 and, for the pages that capture is missing, 2007-06-25).
  **Page numbers in §3.2 are the 1997 edition's.** The 1 March entry was separately read at
  [wheretexasbecametexas.org/day-one-of-the-convention-of-1836/](https://wheretexasbecametexas.org/day-one-of-the-convention-of-1836/)
  and matches word for word. **Verification status is set out in §3.2**: the Internet Archive went offline during this
  work, so this session could not re-read the Wayback pages itself, and the series rests on two verbatim matches with
  sources it did read plus five days of agreement with Almonte's independent thermometer.
- **Dilue Rose Harris, "The Reminiscences of Mrs. Dilue Harris", Part II**, *The Quarterly of the Texas State Historical
  Association* vol. IV, pp. 155-189 (Part I, pp. 85-127, and Part III, vol. VII, pp. 214-222, also read), from the
  Internet Archive's scan of the *Quarterly*
  ([archive.org/details/quarterlyoftexas4190texa](https://archive.org/details/quarterlyoftexas4190texa)), cross-checked
  against the Sons of DeWitt Colony transcription, 2026-09-20. Her quotations here agree with those already in
  `HIST-TEX-069` to `-071`, which is an internal check on both.
- **U.S. Army Surgeon-General, *Meteorological Register for Twelve Years, from 1831 to 1842*** (Washington: C. Alexander,
  1851), [archive.org/details/meteorologicalre00unitrich](https://archive.org/details/meteorologicalre00unitrich). Monthly
  tables read from the page scans; year-end summaries re-read in the OCR text, 2026-09-20. §8.8.
- **Samuel Forry, *The Climate of the United States and its Endemic Influences* (1842)**, OCR text at archive.org.
- **Gary K. Grice, *History of Weather Observing at Fort Jesup, Louisiana 1827-1845*** (NOAA Climate Database
  Modernization Program for the Midwestern Regional Climate Center, February 2005),
  [repository.library.noaa.gov/view/noaa/1236](https://repository.library.noaa.gov/view/noaa/1236), read 2026-09-20 from
  the copy the owner placed on disk. §8.8.1.
- **David Roth, *Texas Hurricane History*, National Weather Service**,
  [wpc.ncep.noaa.gov/research/txhur.pdf](https://www.wpc.ncep.noaa.gov/research/txhur.pdf), downloaded and read
  2026-09-20. The standard chronology of Texas storms; §6 rests on it. **Authoritative on storms, careless on everything
  else** (§6.1's ceiling).
- **Noah Smithwick, *The Evolution of a State*** (1900), full text at
  [archive.org/details/evolutionofstate00smit](https://archive.org/details/evolutionofstate00smit), searched 2026-09-20.
  Its weather passages are mostly undated or outside this period; the one used is "our only care being to keep our powder
  dry" (§10.5).

**Already in the repository, and re-used rather than re-researched:**

- `docs/battle-research/grass-fight.md` §3.4 — Borden (4 Nov), Hall (18-23 Nov), Jack (26 Nov), Austin's report (30 Nov).
- `docs/battle-research/bexar-storming.md` — Johnson's report (7-8 Dec), Creed Taylor, Ehrenberg, the fog of 10 December,
  and the warning that Lopez's "as warm as summer" is not usable for weather.
- `docs/battle-research/concepcion.md` and `HIST-TEX-020` — Bowie's "heavy, dense fog", 28 October 1835.
- `docs/battle-research/winter-1835-36.md` and `HIST-TEX-053` — the snow of 13 February 1836.
- `docs/battle-research/goliad-scrape-san-jacinto.md`, `HIST-TEX-063`, `HIST-TEX-068` to `-074`.

**Secondary, read directly and cited as secondary:**

- TSHA *Handbook of Texas*: [*Goliad Campaign of 1836*](https://www.tshaonline.org/handbook/entries/goliad-campaign-of-1836),
  [*Gonzales, Battle of*](https://www.tshaonline.org/handbook/entries/gonzales-battle-of),
  [*Concepción, Battle of*](https://www.tshaonline.org/handbook/entries/concepcion-battle-of),
  [*Convention of 1836*](https://www.tshaonline.org/handbook/entries/convention-of-1836),
  [*San Jacinto, Battle of*](https://www.tshaonline.org/handbook/entries/san-jacinto-battle-of),
  [*Weather*](https://www.tshaonline.org/handbook/entries/weather),
  [*Blue Norther*](https://www.tshaonline.org/handbook/entries/blue-norther),
  [*Tornadoes*](https://www.tshaonline.org/handbook/entries/tornadoes).
- Wikipedia: [*Battle of Gonzales*](https://en.wikipedia.org/wiki/Battle_of_Gonzales),
  [*Siege of the Alamo*](https://en.wikipedia.org/wiki/Siege_of_the_Alamo),
  [*Battle of the Alamo*](https://en.wikipedia.org/wiki/Battle_of_the_Alamo),
  [*Battle of San Jacinto*](https://en.wikipedia.org/wiki/Battle_of_San_Jacinto),
  [*List of Texas hurricanes (pre-1900)*](https://en.wikipedia.org/wiki/List_of_Texas_hurricanes_(pre-1900)),
  [*1830s Atlantic hurricane seasons*](https://en.wikipedia.org/wiki/1830s_Atlantic_hurricane_seasons),
  [*Racer's hurricane*](https://en.wikipedia.org/wiki/Racer%27s_hurricane),
  [*Hannah Elizabeth (ship)*](https://en.wikipedia.org/wiki/Hannah_Elizabeth_(ship)),
  [*List of Texas tornadoes*](https://en.wikipedia.org/wiki/List_of_Texas_tornadoes).
- [The Alamo, *Myths and Legends*](https://www.thealamo.org/remember/myths-and-legends) and
  [The Siege of Béxar Descendants](https://siegeofbexar.org/siege-of-bexar/) — both of which summarise Gray and Almonte on
  the weather, and disagree with Wikipedia about where the February snow fell (§5.1).
- [Tornado Talk](https://www.tornadotalk.com/january-26/), [The Tornado Project](http://www.tornadoproject.com/alltorns/txtorn1.htm),
  [Texas Almanac](https://www.texasalmanac.com/articles/texas-tornados), [NOAA SPC](https://www.spc.noaa.gov/wcm/).

**Modern data, used only as a declared basis for inference (§8):**

- NOAA NCEI **U.S. Climate Normals 1991-2020**, monthly station files
  (`ncei.noaa.gov/data/normals-monthly/1991-2020/access/<STATION>.csv`), stations `USW00012921` San Antonio,
  `USC00413622` Gonzales 2S, `USW00013904` Austin Bergstrom, `USW00012912` Victoria, `USW00012960` Houston IAH,
  `USC00416177` Nacogdoches.
- Cleaveland, Votteler, Stahle, Casteel and Banner (2011), tree-ring June PDSI for Texas climate divisions,
  [NOAA Paleoclimatology study 33112](https://www.ncei.noaa.gov/access/paleo-search/study/33112); the Division 7 data file
  was read directly.
- Allahdadi, Li and Chaichitehrani (2023), cold fronts over the northern Gulf,
  [NOAA Institutional Repository 65491](https://repository.library.noaa.gov/view/noaa/65491).
- [NOAA NHC tropical cyclone climatology](https://www.nhc.noaa.gov/climo/);
  [NWS Houston/Galveston on tornado season](https://www.weather.gov/hgx/severe_weather_awareness_tornadoes);
  [NWS Fort Worth climate narrative](https://www.weather.gov/fwd/dfw_narrative).
- Gary K. Grice, NOAA CDMP station history for Fort Jesup,
  [repository.library.noaa.gov/view/noaa/1236](https://repository.library.noaa.gov/view/noaa/1236).

---
