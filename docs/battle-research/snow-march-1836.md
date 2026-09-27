# The snow on the Mexican army, February 1836, and the other cold marches of that winter

**Status: research, 2026-09-26. Nothing here is built.** Docs only; the owner decides (§9). Read with
[`docs/WEATHER.md`](../WEATHER.md) §5.1 (which this corrects and completes), [winter-1835-36.md](winter-1835-36.md) §6,
[mexican-advance.md](mexican-advance.md), and `HISTORY.md` rows `HIST-TEX-053`, `HIST-TEX-068`, `HIST-TEX-226`,
`HIST-TEX-228`, `HIST-TEX-237`. Proposed rows are §10, numbered `HIST-TEX-600` to `-604` (checked free 2026-09-26 on
`main`, `advance-places`, `weather-research`, `qwen/overnight` and every `.md` under the main checkout).

## What the owner asked

> "i've seen paintings showing mexican troops marching through snow the winter of 35/36. is that accurate? do we have
> snowy weather implemented?" — and then — "research first and ensure it's real and not me misremembering."
>
> — 2026-09-26

**Labels**, as in the other battle documents: **DOCUMENTED** (a contemporary or eyewitness record, or two good sources
agreeing), **STRONGLY SUPPORTED** (one good source, or a primary one reporting what its author did not see), **DISPUTED**
(sources disagree; both given), **NOT FOUND** (looked for in the sources read, and absent).

---

## The one-line answer

**It is real, and the owner is not misremembering.** On the evening of **13 February 1836** a norther that had blown rain
all day turned to snow over the Mexican army strung out across **Coahuila**, and it snowed through the night and most of
the 14th. **Three officers who were there wrote it down independently**: Vicente Filisola (second in command), José
Enrique de la Peña (marching with the cavalry brigade that night), and José Juan Sánchez Navarro (at Monclova). It lay
**about 16 inches deep** (Filisola's "cerca de media vara"), **knee-deep** by dawn in the cavalry's camp (de la Peña),
**over eight inches** at Monclova (Sánchez Navarro). It smothered pack mules under their loads, killed horses and more than
fifty yoke of draught oxen, scattered the cavalry brigade in a mesquite thicket in the dark, let muleteers desert, and cost
"men" in a number nobody gives.

**Where:** the brigades it hit hardest were **south of the Rio Grande**, between Monclova and the Sabinas River. The
leading division under Ramírez y Sesma was already **about two days' march north of the Rio Grande, at La Espantosa** —
Espantosa Lake, in what is now **Dimmit County, Texas**, but in 1836 was **Coahuila**, south of the Nueces, then the
accepted southern limit of Texas. Filisola says that division "passed the same storm", less cruelly. So the Alamo's "did not extend
into Texas" is right in 1836's boundaries and probably wrong in today's. **No snow is recorded in the settled colonies or
at Béxar on those days**; Gray at Washington-on-the-Brazos woke on the 14th to "A clear and cold morning."
`HIST-TEX-226`'s negative for the colonies and Béxar **holds**.

**Two corrections the research turned up.** (1) The famous **Yucatán soldiers who died of cold were not in the snow**:
they were in **Urrea's** column, in a norther on the night of **25 February, south of the Nueces**, and Urrea counts six
(§6.2). The Handbook and the repository merge the two. (2) **De la Peña alone records a second, heavy snowfall on the night
of 1 March, at Arroyo Hondo between the Frio and the Medina — inside 1836 Texas, about fifty miles short of Béxar** — with
ink frozen in the inkwells and a soldier dead of the cold next morning. Sánchez Navarro camped at the same place the same
night and does not mention snow, and Almonte at Béxar had a clear night at 34 °F. **DISPUTED** (§6.4).

**The painting most often reproduced** — Angus McBride's gouache of Santa Anna on a white horse leading ragged conscripts
over snowy ground, from *Look and Learn* — shows a real event with **one clear error: Santa Anna was not in it.** He had
ridden ahead and was at Guerrero, south of the Rio Grande, from the 12th to the 16th (§8).

**Snow in the game: there is none, deliberately** (`sim/weather.mjs` has five kinds and no `snow`, `FIC-GONZ-130`), and
nothing here changes that for the colonies. What the game already has is a **rumour** on about 18 February that Santa Anna
"has crossed the Rio Grande with a great army, through snow" (`sim/directors.mjs`, `santa-anna-rumour`). §9 gives the owner
the choices.

---

## Contents

1. Sources read, and how
2. The storm of 13–14 February: what each witness wrote
3. Where each column was that night
4. How deep, how long, and what it cost
5. The "where" dispute, resolved as far as the sources allow
6. The other cold marches of that winter (none of them snow, but one)
7. What the repository has wrong or too simple
8. The paintings
9. What it means for the game — options for the owner
10. Proposed `HISTORY.md` rows
11. Looked for and not found, or not read
12. Sources

---

## 1. Sources read, and how

**Every primary source below was read directly from its full text on archive.org, downloaded 2026-09-26** to the session
scratchpad, searched for the words for snow and cold (*nieve, nevada, nevando, frío, helar, norte*; *snow, cold, norther*)
and read in sections around each hit. The Spanish OCR is rough in places; every quotation below was read in context, and
where a reading depends on an OCR guess it says so. **Translations from the Spanish are mine.** No summarising tool stood
between these texts and this document. The secondary pages in §1.2 were read through a fetching tool that returns
summaries with quoted sentences, and are marked so.

### 1.1 Primary

| Source | Who, and where he was on 13 February | How read | Trust for this question |
| --- | --- | --- | --- |
| **Vicente Filisola, *Memorias para la historia de la guerra de Tejas*, t. II (México: R. Rafael, 1849)**, cap. XXIV, pp. 346–351; also pp. 344, 363, 167–169 | Second in command, organising the rear at **Monclova**; wrote the book twelve years later from his papers | archive.org item `memorias-para-la-historia-de-la-guerra-de-tejas-volumen-2`, full text, 2026-09-26 | **High for the rear brigades**, which he supplied and heard from; **second-hand for Sesma's division** at La Espantosa |
| **José Enrique de la Peña, "Diario", in *La rebelión de Texas: manuscrito inédito de 1836, por un oficial de Santa Anna*, ed. J. Sánchez Garza (México, 1955)**, cap. III, pp. 37–40; p. 48 | Lieutenant colonel, joining the Zapadores; **left Monclova on the 13th behind the cavalry brigade and spent the night in the snow with the Tampico regiment** | archive.org item `la-rebelion-de-texas.-manuscrito-inedito-de-1836-por-un-oficial-de-santa-anna`, full text, 2026-09-26 | **High for what he saw on 13–15 February** (and corroborated by the other two); the authenticity debate (§1.3) is about other passages |
| **José Juan Sánchez Navarro, *La guerra de Tejas: memorias de un soldado*** (Editorial Jus edition; its year not established from the OCR; first published 1938) | Aide to General Cos, **at Monclova from 9 to 14 February**, then on the road behind the brigades to Béxar | archive.org item `laguerradetejas`, full text, 2026-09-26 | **High**: a dated day-by-day itinerary, published 17 years before de la Peña's and 89 years after the events, and independent of both others |
| **José Urrea, *Diario de las operaciones militares de la división que al mando del general José Urrea hizo la campaña de Tejas* (Victoria de Durango, 1838)**, in Carlos E. Castañeda, tr., ***The Mexican Side of the Texan Revolution*** (Dallas, 1928), pp. 213–215 | At **Matamoros** until 16 February; then marching north toward San Patricio | archive.org item `mexicansideoftex0000anto`, full text, 2026-09-26 | High for his own column; silent on the 13th |
| **Ramón Martínez Caro, *Verdadera idea de la primera campaña de Tejas* (1837)**, in Castañeda, pp. 99–101 | Santa Anna's secretary, **with Santa Anna** | same | High for Santa Anna's movements; **silent on the snow** |
| **Antonio López de Santa Anna, *Manifiesto* (1837)**, in Castañeda, pp. 11–12 | — | same | Silent on the snow; speaks only of "the effects of the climate" |
| **William Fairfax Gray, diary**, 14 February 1836, Washington-on-the-Brazos | the colonies | as already cited in `docs/WEATHER.md` §3.2 | High; the colonies' weather that morning |
| **Juan N. Almonte, journal**, 23 February – 6 March 1836 at Béxar | with Santa Anna | as already cited in `HIST-TEX-228` | High for Béxar on 1–2 March |

### 1.2 Secondary, read through a summarising tool (2026-09-26) and cited as secondary

- The Alamo, [*Myths and Legends*](https://www.thealamo.org/remember/myths-and-legends), by R. Bruce Winders, under the myth
  "The winter of 1836 was one of the coldest in Texas history": a "freak blizzard in route to Texas that began on the
  evening of February 13 and continued throughout the next day", severe enough "to kill horses, mules, men, and camp
  followers"; "The snowstorm, however, did not extend into Texas."
- [Siege of Béxar Descendants](https://siegeofbexar.org/siege-of-bexar/): the army "located south of the Rio Grande"
  recorded "an atypical blizzard, but it lasted only a day".
- Wikipedia, [*Battle of the Alamo*](https://en.wikipedia.org/wiki/Battle_of_the_Alamo): "On February 12, they crossed the
  Rio Grande. Temperatures in Texas reached record lows, and by February 13, an estimated 15–16 inches (38–41 cm) of snow
  had fallen." Its footnotes are **Walter Lord, *A Time to Stand* (1961), p. 73** and **Stephen L. Hardin, *Texian Iliad*
  (1994), p. 105**. **Neither book was read**: both are lending-only on archive.org.
- TSHA, [*Texas Revolution*](https://www.tshaonline.org/handbook/entries/texas-revolution) (Barker and Pohl, rev. Scheer):
  "the weather that spring was unusually cold and wet. Some of Santa Anna's troops, recruited from the Yucatán, died of
  hypothermia"; the army "crossed the Rio Grande" on "February 16, 1836".
- TSHA, [*Espantosa Lake*](https://www.tshaonline.org/handbook/entries/espantosa-lake): "five miles northeast of Carrizo
  Springs in north central Dimmit County (at 28°35' N, 99°49' W)"; "once a campsite on the Old San Antonio Road".
- TSHA, [*Peña, José Enrique de la*](https://www.tshaonline.org/handbook/entries/pena-jose-enrique-de-la) (Grassmuck) and
  Wikipedia, [*José Enrique de la Peña*](https://en.wikipedia.org/wiki/Jos%C3%A9_Enrique_de_la_Pe%C3%B1a), for §1.3.

### 1.3 De la Peña, and why the debate does not touch this

De la Peña's account is famous for its description of Crockett's death, and it is **that** passage the authenticity debate
is about. Bill Groneman and the illustrator Joseph Musso questioned the manuscript, pointing among other things to its
appearance in 1955 at the height of interest in Crockett; James E. Crisp defended it; in October 2001 David B. Gracy II and a
science team reported in the *Southwestern Historical Quarterly* that the paper and ink were of the kind the Mexican army
used in the 1830s and the hand matched de la Peña's in other documents (Wikipedia, read through a summarising tool). The
manuscript is a diary **expanded by its author in 1837–39** into a narrative, so any one sentence may be a later addition.

**For the storm of 13–14 February none of this matters**, because Sánchez Navarro's diary (published 1938) and Filisola's
*Memorias* (1849) say the same thing independently: the date, the snow at nightfall, the cavalry brigade caught on the road
to Las Adjuntas, the mules, and Tolsa's and Gaona's brigades at Hermanas and Soledad. **For the snow of 1 March (§6.4) it
matters a great deal**, because de la Peña is the only witness.

---

## 2. The storm of 13–14 February: what each witness wrote

### 2.1 Filisola — the whole army, from Monclova

Filisola opens cap. XXIV (p. 347) with the season before it: the winter "hasta el día 12 de Febrero había sido de los más
benignos de aquellos climas" — **until 12 February, one of the mildest of those climates.** Then (pp. 347–348):

> "El día 13 amaneció tan nebuloso y estremadamente frío, que al hacerse noche se precipitó del cielo una nevada tan
> abundante que subió cerca de media vara sobre superficie de la tierra."
>
> *The 13th dawned so cloudy and so extremely cold that at nightfall a snowfall came down so heavy that it rose nearly half
> a vara above the ground.*

**Half a vara is about 42 cm, 16½ inches** (the Castilian vara is 83.6 cm). That is almost certainly where the "15–16
inches" of Lord, Hardin and Wikipedia comes from.

He then takes the columns one by one (§3): **Andrade's cavalry brigade**, which had left Monclova that same day, caught
"en un inmenso mezquital, caminando para el rancho llamado las Ajuntas" (*in a vast mesquite thicket, on the way to the
rancho called Las Ajuntas*), its column broken in the dark, men and animals lost from one another and shouting in the
wood, until Andrade halted for the night "con la nieve casi hasta las rodillas de los soldados" (*with the snow almost to
the soldiers' knees*), p. 349; **Tolsa's** 2nd infantry brigade at the **hacienda de Hermanas**, without roofs, "la cual
llegó a verse enterrada debajo de la nieve, lo mismo que las piezas y cargamento" (*which found itself buried under the
snow, and the guns and loads with it*); **Gaona's** 1st brigade on the march from "el Sans" [the Sauz] to the **hacienda de
la Soledad**; and **Sesma's division** "dos jornadas más allá del Río-Bravo, ya en marcha para Béjar, en el paraje llamado
la Espantosa" (p. 350). After that day, "unos días escesivamente frío, y otros demasiado templado y aun caloroso" — *some
days excessively cold, others too mild and even hot*, through March and part of April.

Earlier (p. 344) he mentions **"una fuerte nevada"** that held up the army's carts on the Saltillo road near Baján so that
they reached Monclova only on **19 February**. The next sentence has the carts leaving Monclova for the Rio Grande on "el
día 21 del mes citado de Enero", which cannot be right if they arrived on 19 February; **"Enero" is a misprint or a
mis-scan for "Febrero"** (Sánchez Navarro puts Filisola's own column at the Rio Grande after the 21st). Read that way, the
**same storm reached the Saltillo–Monclova road**, some fifty miles south-west of Monclova.

### 2.2 De la Peña — in it, with the Tampico cavalry

De la Peña left Monclova on the 13th "algunas horas después que la brigada de caballería" (*some hours after the cavalry
brigade*) to join the Zapadores, followed its tracks, and lost his way on a cart road. His account (pp. 37–40) is the
eyewitness core:

> "Habíamos salido con un norte deshecho; y después de haber sufrido todo el día de frente un viento cortante, juntamente
> con la lluvia que le acompañaba, a las siete de la noche eran ya una nevada."
>
> *We had set out in a howling norther, and after suffering all day a cutting wind in our faces, with the rain that came
> with it, by seven at night it was a snowstorm.*

- The Tampico regiment counter-marched in the dark and camped with him; **"oficiales, soldados, mujeres y muchachos"**
  (*officers, soldiers, women and boys*) crowded shivering round a few fires of green, wet wood that the snow kept
  smothering. He had been trying to light one with "los desgarrados vestidos de unas pobres mujeres y muchachos" — *the
  torn clothes of some poor women and boys* who had gathered there. **This is the one place the soldaderas are seen in
  the snow.**
- "**Varios arrieros se aprovecharon del desorden para escapar**" — *several muleteers took advantage of the disorder to
  run away.* That is the desertion the storm caused, and it is the muleteers', not the soldiers'.
- By dawn the snow "daba a los hombres a la rodilla" — *came to the men's knees*. Men who did not shake it off went numb
  under its weight and had to beg others to move them.
- The morning of the 14th: "Todo lo que la vista alcanzaba era de nieve" — *everything as far as the eye could see was
  snow*; trees like cones and pyramids of alabaster; saddled horses buried to the croup; "Muchas mulas amanecieron paradas
  con la carga encima; otras murieron, así como algunos caballos" — *many mules were found at dawn still standing with
  their loads on; others died, and some horses*, breaking their heads as they slipped under the load. Loads taken off in
  the night had to be dug out. **Andrade kept the treasury together.** Andrade and the Guanajuato regiment had spent the
  night **a league behind**.
- "**La nieve continuó cayendo sin interrupción el catorce hasta las cinco de la tarde, aunque en menos abundancia.**" —
  *The snow went on falling without a break on the fourteenth until five in the afternoon, though less heavily.* They
  reached **Las Adjuntas, "ranchería grande que se halla a siete leguas de Monclova"** (*a large rancheria seven leagues
  from Monclova*), having camped two and a half to four leagues short of it.
- He compares it, at length, with the French in Russia in 1812 — and then says the comparison is absurd.
- Of the whole army: "**todos perdieron hombres, caballos, mulas y bueyes**" — *all lost men, horses, mules and oxen* —
  and he blames Filisola for sending the cavalry out on the day of the storm. The cavalry, "con un frío tan extraño para
  ellos y para lo que sus vestidos no eran a propósito" — *in a cold so strange to them, for which their clothes were not
  made* — suffered most.
- On the 15th he left the cavalry at Las Adjuntas, "que no podía pasar adelante sin reponer sus pérdidas" (*which could
  not go on without replacing its losses*), and caught Tolsa's brigade at the Lampazos creek.

### 2.3 Sánchez Navarro — at Monclova

Sánchez Navarro reached Monclova with Cos on 9 February "con un frío horrible" and stayed there 10–14 February. His entry
of the 14th:

> "La Brigada de Caballería mandada por el señor Andrade marchó ayer. [...] todo el día de ayer y parte de hoy está
> nevando, tanto que en lo general pasa la nieve del alto de una cuarta."
>
> *The cavalry brigade under General Andrade marched yesterday. [...] All yesterday and part of today it has been snowing,
> so much that generally the snow is more than a span deep.*

A **cuarta** (a quarter vara, a hand-span) is about **21 cm, 8 inches**. His itinerary for the 15th, riding north: at
**Las Adjuntas** "vi la 3a. Brigada, que ha padecido mucho con la nieve, los hombres y los animales, de éstos murieron
bastantes" — *I saw the 3rd [cavalry] brigade, which has suffered much from the snow, men and animals; of these a good many
died* — and past Hermanas, **Tolsa's** brigade "sufrió también mucho con la nieve" (*also suffered much from the snow*),
its column a league and a quarter long with loads, carts and women: "**Las mujeres interrumpen el orden.**"

**One small disagreement:** Sánchez Navarro has it snowing at Monclova "all yesterday", de la Peña has rain by day turning
to snow at seven. Monclova and the road north are not the same place; both have the snow falling through the night of the
13th and into the 14th.

### 2.4 The ones who say nothing

- **Caro**, Santa Anna's secretary, has Santa Anna leave Monclova "on the 9th ... with his staff and 50 mounted men for Rio
  Grande" (Castañeda, p. 99), and describes the march's misery — "in the middle of the winter, which is very severe in
  those regions, without sufficient clothes, particularly among the wretched recruits" (p. 100), the sick dying in the
  munition wagons (p. 101) — **but not the snow.** He was with Santa Anna, ahead of it.
- **Filisola** puts Santa Anna at the Rio Grande from **the 12th to the 16th**, leaving at two in the afternoon on the 16th
  (p. 363). **Nobody read here says whether it snowed at Guerrero**, the old Presidio de Río Grande, south of the river.
- **Santa Anna's *Manifiesto*** speaks only of "the effects of the climate" on men "accustomed to a more temperate climate"
  (Castañeda, p. 11).
- **Urrea** was at Matamoros until the 16th and records no weather on the 13th (Castañeda, p. 213).
- **Gray**, at Washington-on-the-Brazos on the 14th: "A clear and cold morning." The front reached the colonies as cold and
  clear air, not snow — exactly how the northers of the record behave (`docs/WEATHER.md` §4).

---

## 3. Where each column was that night

The army marched in echelon from Saltillo to Monclova to the Rio Grande at Guerrero, then up the road to Béxar by La
Espantosa, the Nueces, the Frio and the Medina. On 13 February it was spread over **more than 200 miles**: Caro makes Monclova to the Rio Grande "more than 80 leagues"
(Castañeda, p. 100), and the vanguard was 14½ leagues beyond the river. De la Peña: the
first division was "a unas catorce y media leguas más allá de Río Grande" (*some fourteen and a half leagues beyond Río
Grande*), and the next brigade "separada de aquella por cuarenta y nueve leguas" (*forty-nine leagues behind it*).

| Column | Where on the night of 13 February | Which side of the Rio Grande | Modern place (inference) | Snow | Losses named | Sources | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Santa Anna**, staff and escort (about 50 horse) | **Guerrero** (Presidio de Río Grande), 12–16 Feb | south | Guerrero, Coahuila | **NOT FOUND** — no source read says it snowed there | none | Filisola p. 363; Caro p. 99 | whereabouts DOCUMENTED; snow NOT FOUND |
| **1st Division, Ramírez y Sesma** (the vanguard) | **La Espantosa**, "dos jornadas más allá del Río-Bravo" (Filisola); "catorce y media leguas más allá de Río Grande" (de la Peña) | **north** | **Espantosa Lake, Dimmit County, Texas** (28°35′N 99°49′W, TSHA); ~38 miles from Guerrero, which matches 14½ leagues | "pasó el mismo temporal" — the same storm, "si con menos, con iguales penalidades" (*if with fewer, with the same kind of hardships*); Filisola reasons the snow and cold there "no debieron ser tan crueles" because the country is lower | "all lost men, horses, mules and oxen" (de la Peña, of the whole army) | Filisola p. 350; de la Peña p. 40 | **STRONGLY SUPPORTED** (two officers agree on the place; **neither was with that column**, and no one from it was read) |
| **1st Brigade of the 2nd Division, Gaona** | on the march from the **Sauz** creek to the **haciendas de la Soledad and San Juan**, on either side of the **Sabinas River** | south | the Sabinas valley, Coahuila | yes | **more than fifty yoke of oxen** killed by "la nieve, el intenso frío y la fatiga" (Filisola); reserve oxen Filisola had posted saved the brigade | Filisola pp. 349–350; de la Peña p. 40 | DOCUMENTED |
| **2nd Brigade, Tolsa** | **hacienda de (Dos) Hermanas**, where it stayed | south | Hermanas, Coahuila | yes; troops, guns and loads "enterrada debajo de la nieve" in a camp without roofs | "suffered much" (Sánchez Navarro) | Filisola p. 349; de la Peña p. 40; Sánchez Navarro, 15 Feb | DOCUMENTED |
| **3rd (cavalry) Brigade, Andrade** — Tampico, Guanajuato and other regiments, and **the army's treasury, 80,000 pesos** | in the mesquite on the road to **Las Adjuntas**, 2½–4 leagues short of it, having left **Monclova** that day | south | 3–4½ leagues (about 8–12 miles) north of Monclova | the worst of it: knee-deep by dawn | **mules smothered under their loads**, horses dead, muleteers deserted, men lost in the dark and found; halted at Las Adjuntas on the 14th and sent to Filisola for mules; moved on the 15th | Filisola pp. 348–349; de la Peña pp. 37–40; Sánchez Navarro, 14–15 Feb | DOCUMENTED |
| **Filisola, Cos, Woll** and the depots | **Monclova** | south | Monclova, Coahuila | yes, more than a span | — | Sánchez Navarro, 14 Feb | DOCUMENTED |
| **The carts** from Saltillo | a day short of **Baján** on the Saltillo road | south | between Saltillo and Monclova | "una fuerte nevada" | delayed to 19 Feb | Filisola p. 344 (date problem, §2.1) | STRONGLY SUPPORTED |
| **Urrea's division** | **Matamoros** | south | Matamoros, Tamaulipas | NOT FOUND | — | Urrea, in Castañeda p. 213 | snow NOT FOUND |

---

## 4. How deep, how long, and what it cost

**Depth — three measures, all from men who were there, and they differ as they should:**

| Where | Depth | Witness |
| --- | --- | --- |
| Monclova, the morning of the 14th | "pasa la nieve del alto de una cuarta" — more than a span, **8 inches or more** | Sánchez Navarro |
| The army generally | "cerca de media vara" — nearly half a vara, **about 16 inches** | Filisola |
| The cavalry's camp in the mesquite, dawn of the 14th | "a la rodilla" — **knee-deep**; "casi hasta las rodillas" | de la Peña; Filisola |

**How long:** snow from about **7 p.m. on the 13th** (de la Peña; Sánchez Navarro has it earlier at Monclova) until **5 p.m.
on the 14th**, lighter by day. About **22 hours**. The Siege of Béxar Descendants' "lasted only a day" is fair.

**What it cost:**

- **Animals — DOCUMENTED, not counted except once.** Pack mules suffocated lying down under their loads when the snow covered
  their nostrils (Filisola) or broke their heads falling (de la Peña); horses died (de la Peña); "de éstos murieron
  bastantes" (Sánchez Navarro); **more than fifty yoke of oxen** in Gaona's brigade (Filisola) — the one number.
- **Men — DOCUMENTED that some were lost; NOT FOUND how many.** De la Peña: "todos perdieron hombres". Sánchez Navarro: the
  cavalry "ha padecido mucho ... los hombres y los animales". No witness read gives a figure for deaths in the storm itself,
  and none names one.
- **Women and children — present, DOCUMENTED; deaths NOT FOUND in the primaries read.** De la Peña's "mujeres y muchachos"
  at the fires; Sánchez Navarro's women in Tolsa's column. The Alamo page's "camp followers" among the dead is secondary and
  may be right; the primaries read do not say it.
- **Desertion — DOCUMENTED for muleteers**, not for soldiers: "Varios arrieros se aprovecharon del desorden para escapar"
  (de la Peña). Filisola separately describes muleteers and carters deserting throughout the march (p. 344 and the
  chapter heading "Fuga de arrieros y carreteros").
- **Time:** the cavalry lost a day at Las Adjuntas and had to be remounted; the carts reached Monclova on the 19th.
- **Morale — DOCUMENTED:** "trajo con sus nieves el desaliento y la tristeza al ejército" — *brought with its snows
  discouragement and sadness to the army*; even the keenest "hacían presagios funestos sobre nuestra expedición" (*made dark
  predictions about our expedition*), de la Peña p. 40.

**Was it a hard winter? No — that is the myth the Alamo page names.** Filisola says the winter had been one of the mildest
until the 12th, and after the storm it alternated between very cold and hot. It was one storm, not a season.

---

## 5. The "where" dispute, resolved as far as the sources allow

`docs/WEATHER.md` §5.1 recorded three positions: "south of the Rio Grande" (Siege of Béxar Descendants), "did not extend
into Texas" (the Alamo), and "Temperatures in Texas reached record lows" (Wikipedia). With the three officers read:

1. **The storm struck the army south of the Rio Grande — DOCUMENTED**, by three independent witnesses. The heaviest snow,
   and the losses that are described, were on the road from Monclova through Las Adjuntas and Hermanas to the Sabinas, and
   at Monclova itself.
2. **It also reached the vanguard north of the Rio Grande, at La Espantosa — STRONGLY SUPPORTED.** Filisola says Sesma's
   division "pasó el mismo temporal" there, lighter; de la Peña puts that division 14½ leagues beyond the river that day and
   counts it among those that "lost men, horses, mules and oxen". Neither was with it.
3. **La Espantosa was in Coahuila in 1836, not in Texas.** The Nueces was then the accepted southern limit of Texas; the
   country south of it belonged to Coahuila and Tamaulipas until the Republic of Texas claimed the Rio Grande by its
   boundary act of December 1836 (general knowledge, not re-read for this document). So **"did not
   extend into Texas" is correct in 1836 terms**, and "south of the Rio Grande" is correct for where it did its damage;
   **but by today's map the storm probably reached Texas**, in Dimmit County, some 10–15 miles south of the Nueces (read off a modern map, not measured)
   and **outside the game's simulated land** (which stops at 99°W and 27.6°N; the outside display layer reaches the Rio Grande).
4. **"Temperatures in Texas reached record lows" has no support in anything read.** There were no records to reach. The
   sentence appears to fold the Coahuila storm, Urrea's norther of 25 February (§6.2) and the northers at Béxar into one.
5. **Not in the settled colonies, not at Béxar — the negative holds.** Gray at Washington on the 14th: "A clear and cold
   morning." Nobody at Béxar in mid-February recorded weather that was read here, but no source read puts snow there, and
   the base rate (`HIST-TEX-234`c) and the two thermometer diaries either side of it (`HIST-TEX-221`, `HIST-TEX-228`) say it
   would have been remarkable.

**What `HIST-TEX-226` should now say:** the one snowfall of the period **is located and dated** — Coahuila, the night of 13
February to the afternoon of the 14th, reaching the vanguard lightly at La Espantosa (in modern Texas, then Coahuila); it
**did not** reach the colonies or Béxar; and a second snow on 1 March west of Béxar rests on one witness and is disputed
(§6.4). Its "no snow anywhere in the settled colonies, or at Béxar" stands unchanged.

---

## 6. The other cold marches of that winter (none of them snow, but one)

The owner's picture is of "the winter of 35/36". The sources read record four other hard marches in cold, three of them
inside what is now Texas.

### 6.1 Ugartechea's reinforcement, Laredo to Béxar, 26 November – 9 December 1835 — cold rain, no snow

Filisola (t. II, pp. 167–169): Ugartechea's column of recruits for the Morelos battalion, from Laredo on 26 November, "fué
penosísima por las continuas lluvias y fríos" (*was most painful for the continual rains and cold*), sleeping in the open
"cansados, mojados y mal comidos" (*tired, wet and badly fed*); from La Espantosa on it had to bridge the Leona, the Nueces
and the Frio "bajo la lluvia al rigor del frío cruelísimo que hizo todos aquellos días" (*in the rain, in the rigour of the
most cruel cold of all those days*); the worst day was the 8th, marching all night into Béxar at 8 a.m. on the 9th. **No
snow.** It agrees with `HIST-TEX-222` (the wet cold November) and `HIST-TEX-223`. *(The OCR reads "El día 19 de Diciembre
llegó ... á la Espantosa"; the next sentences are "El día 2 descansaron" and "Esta se continuó el día 3", so it is "1º", the
first of December.)*

### 6.2 Urrea's division, the norther of 25–26 February 1836, south of the Nueces — the Yucatán dead

Urrea's *Diario* (Castañeda, pp. 214–215). On the 25th, marching from Santa Rosa toward the Nueces: "At seven o'clock that
night a cold and penetrating norther began to blow ... **Six soldiers of the battalion of Yucatan died from exposure to the
cold.**" On the 26th, in a wood two leagues short of Santa Gertrudis: "**It began to rain at three in the morning and it
looked like snow.**" That night on the Nueces "The night was very raw and excessively cold. The rain continued and the
dragoons ... were so numbed by the cold that they could hardly speak." Castañeda's note: the Yucatán troops were "practically
all Maya Indians", used to the tropical climate of their peninsula.

**This is the source of "troops recruited from the Yucatán died of hypothermia"** (TSHA *Texas Revolution*;
`HIST-TEX-068`), and it is **not the snowstorm**: different column (Urrea's, not Santa Anna's), different date (25
February, not 13), different place (the Nueces Strip between Santa Rosa and Santa Gertrudis, south of San Patricio and
just south of the game's map edge), and **rain, not snow** — "it looked like snow" is Urrea's own phrase. **DOCUMENTED**, and
it is the same norther Almonte recorded at Béxar at 9 p.m. that night (`HIST-TEX-229`).

### 6.3 Sánchez Navarro, the Rio Grande to the Nueces, 26–27 February — a norther, no snow

"De Río Grande, habiendo pasado el Río a San Ambrosio, **hace un frío terrible**" (26 Feb), and the road behind the brigades
"una completa derrota": stragglers, dead mules and oxen, broken boxes, carts abandoned with the yokes still on them. The 27th:
"**Continúa el Norte.**" The same norther as §6.2. No snow.

### 6.4 De la Peña: snow at Arroyo Hondo, the night of 1 March 1836 — DISPUTED

De la Peña (p. 48), marching with Colonel Duque's column (the Zapadores, Aldama and Toluca battalions, sent ahead by forced
marches to Béxar): on 1 March they crossed the Frio and went 25 to 27 miles to "la Tinaja de Arroyo Hondo". The men slept in
a creek bed that sheltered them a little "del viento norte, pero no de la nevada que fué muy fuerte e impidió al infeliz
soldado gozar del reposo" — *from the north wind, but not from the snowfall, which was very heavy and kept the wretched
soldier from resting.* "No se pudieron dar otro día los partes por escrito porque la tinta se había cuajado en los tinteros"
— *the next day the reports could not be written because the ink had frozen in the inkwells.* On the 2nd they buried "un
soldado del batallón de Toluca, contra quien el excesivo frío y un dolor se conjuraron" (*a soldier of the Toluca battalion,
against whom excessive cold and a pain conspired*), crossed the Medina between five and six, and reached Béxar on the 3rd.

**This would be snow inside 1836 Texas, about fifty miles from the Alamo, during the siege.** It is **DISPUTED**:

- **Sánchez Navarro camped at the same place the same night** — "se hizo de noche en Río Hondo" (1 March), having overtaken
  the three battalions on 28 February — and his entry says nothing of snow. On the 2nd he reached Béxar at eleven at night:
  "El frío es horrible." Silence in a terse itinerary is not strong evidence, but he did write down the Monclova snow.
- **Almonte at Béxar**, 1 March: "the weather continued cold---thermometer at 36 in the morning---day clear"; "Night cold
  thermometer 34"; 2 March "Commenced clear and pleasant thermometer 34---no wind" (`HIST-TEX-228`).
- **Gray at Washington**, the night of 29 February – 1 March: a norther with rain and hail, 33 °F (`HIST-TEX-236`). A strong
  front did cross Texas that night; heavy snow fifty miles west of Béxar a day later under a clear sky at Béxar is possible
  but would be unusual.
- **De la Peña is the only witness**, and this is the expanded narrative, not a dated daily line.

Place: the Arroyo Hondo crossing of the road from the Rio Grande to Béxar, between the Frio and the Medina, **about 19
leagues (some 50 miles) short of Béxar by Sánchez Navarro's own count for 2 March**; by inference near Hondo Creek in
Medina County (the town of Hondo is at about 99.14°W), **just west of the game's simulated land**. The exact spot is not
established.

---

## 7. What the repository has wrong or too simple

Recorded, not fixed (docs-only task):

1. **`HIST-TEX-053`** (and [winter-1835-36.md](winter-1835-36.md) §6, and the one-line answer there): "Santa Anna's army ...
   marched north through snow (15–16 inches by February 13)". Right in substance; **the date is the 13th–14th, not "by" the
   13th; the place is Coahuila; and Santa Anna himself was not in it.** "Recruits from the tropics died of exposure" belongs
   to Urrea on 25 February (§6.2), not to the snow.
2. **`HIST-TEX-068`** quotes TSHA's "Some of Santa Anna's troops, recruited from the Yucatán, died of hypothermia" under *the
   wet spring*. The primary behind it is Urrea's six dead of 25 February, in a norther, south of the Nueces (§6.2).
3. **`HIST-TEX-226`** (and `docs/WEATHER.md` §5.1, §11 item 1) called *where* it fell "DISPUTED, and not to be asserted
   either way". It can now be asserted (§5); `docs/WEATHER.md` is updated with this research. `HISTORY.md` is not edited here.
4. **The rumour in `sim/directors.mjs`** (`santa-anna-rumour`, about 18 February): "It is said Santa Anna himself has crossed
   the Rio Grande with a great army, through snow, and is marching on Béxar." As a rumour it is allowed to be wrong, and the
   army did come through snow — but **Santa Anna himself did not**, and no source read says the garrison or the colonies
   heard of the snow at all. See §9, question 2.
5. **Filisola's winter "de los más benignos" until 12 February** agrees with the Alamo's myth-busting and with Gray's warm
   early February (`docs/WEATHER.md` §3.2). Anything in the game that calls 1835–36 an exceptionally cold winter should not.

---

## 8. The paintings

**What was found.** Searching for published images of Mexican troops marching in snow in 1836 found **one that is widely
reproduced online**, and no museum piece:

| Image | Artist | Made / published | What it shows | Against the record |
| --- | --- | --- | --- | --- |
| *"Santa Anna led his ill-equipped, ill-clad army on a killing march across the frozen plains of Coahuila"* — reproduced online as "Santa Anna's Army marching into Texas" | **Angus McBride** (1931–2007) | Painted for the British children's magazine ***Look and Learn*** (published 1962–1982), apparently for a series titled "The Unfinished Revolution: Trouble in Texas"; now in the Look and Learn picture library as image **A012518**. **The issue and year were not established** — the library's pages sit behind a bot check and were not read. The reproduction examined was the one on Ron Current's *Still Current* blog ([Chapter I: The Road to the Alamo](https://stillcurrent.blog/2023/11/19/chapter-i-the-road-to-the-alamo/), 2023), viewed 2026-09-26. | Santa Anna in a plumed bicorne and blue cloak on a **white horse**, a saddle blanket over its quarters, leading grenadiers in tall shakos with a green-white-red colour, and **conscripts in straw sombreros, white trousers and striped blankets**; one man down in the snow being lifted by another; vultures overhead; **thin, patchy snow on bare ground under a bright blue sky**. | **The event is real and the place in the caption is right: Coahuila.** Four things are not: (1) **Santa Anna was not there** — he left Monclova on the 9th and was at Guerrero, some 80 leagues ahead, from the 12th to the 16th (Caro; Filisola); (2) the snow was **knee-deep, falling, at night and under cloud**, not a dusting in sunshine; (3) the worst of it fell on **cavalry and baggage** in a mesquite thicket, with mules down under their loads — the infantry brigades sat it out at Hermanas and Soledad; (4) the caption's "killing march" is fair for the whole winter march, but no source read gives deaths of men *in the storm* in more than the words "all lost men". The conscripts' dress is consistent with Caro's "practically naked" recruits. |
| *The Alamo* (2004), dir. John Lee Hancock | film | 2004 | **Not verified.** A snow march is sometimes remembered from it; no scene list or review read confirms one. | — |

**What was looked for and not found:** a Gary Zaboly snow scene (Zaboly is the illustrator usually credited for Hardin's *Texian Iliad*, which was
not readable here); an Angus McBride plate in Osprey Campaign 89, *The Alamo 1836* (Hardin, 2001) — the Look and Learn painting is
sometimes attributed to that book online, and **whether the Osprey book reproduces it was not established**; any painting in
the Alamo Collection or the Texas State Capitol showing snow. **Copies of Osprey titles on archive.org that appear to be
unauthorised uploads were deliberately not opened.**

**Verdict for the owner:** the paintings you remember are depicting something that happened — **on 13–14 February 1836,
in Coahuila, south of the Rio Grande**, with the edge of it reaching the vanguard at La Espantosa. A picture that puts Santa
Anna at the head of the column in the snow, or the snow in sunshine, or the snow at the Alamo, is wrong in that detail.

---

## 9. What it means for the game — options for the owner

**What the game is:** the class's world is the settled colonies and Béxar; the simulated land stops at **99°W** and
**27.6°N**, a little south of the Nueces; a **display-only** outside layer reaches the Rio Grande and the Sabine
(`sim/province.mjs`, `docs/MAP_ACCURACY.md` §8). The Mexican columns (`sim/advance.mjs`, `docs/SCRAPE.md`) **start at Béxar
and Refugio in March**, after the snow. Weather is five kinds and **no snow** (`sim/weather.mjs`, `FIC-GONZ-130`), and the
second class period ends at dawn on 23 February. The snow fell **outside the map, ten days before the period ends, on an
army the class never sees** — and **no source read says anyone in Texas heard of it in 1836.**

My recommendation is **1A + 2A + 3B + 4A + 5A**: keep snow out of the world, keep the rumour but make it true of the army
rather than of Santa Anna, put the real story where a teacher can use it, and record the rest.

**Question 1 — Does the snow appear in the game at all?**

- **A. Only as word, never as weather.** The existing rumour on ~18 February carries it (Question 2). No snow is drawn and
  no weather kind is added. *(Recommended: it is the only place the class meets the Mexican army before the 23rd, and it
  asserts nothing the colonies saw.)*
- **B. As a dated news item at Béxar and the colonies**, e.g. with Blas Herrera's report (~18–20 February), labelled
  DOCUMENTED. *Not recommended:* the snow is documented, but **that anyone in Texas heard of it is not** (`FIC` at best).
- **C. As a scene on the outside display layer** — a white wash over La Espantosa for 13–14 February. *Not recommended:* the
  layer draws no Mexican columns there, the evidence for snow at La Espantosa is second-hand, and the heavy snow fell south of
  the Rio Grande, off the map entirely.
- **D. Not at all.** Remove "through snow" from the rumour.

**Question 2 — The rumour's words** (`sim/directors.mjs`, `santa-anna-rumour`).

- **A. Correct it to the army:** e.g. "It is said Santa Anna has crossed the Rio Grande with a great army that came through
  snow in Coahuila, and is marching on Béxar." *(Recommended.)*
- **B. Leave it**: rumours may be wrong, and "Santa Anna himself" in the snow is the kind of thing a rumour would say.
- **C. Drop the snow from it.**

**Question 3 — Should the teacher get the true story?**

- **A. Yes, on the Host's page on 13–14 February** ("What the other side went through tonight"), from §2–§4, with the paintings
  as a discussion prompt ("what did the painter get wrong?").
- **B. Yes, but only at the period's end or the ending**, when the class learns what the Mexican army did; the snow, Urrea's
  six Yucatecos (§6.2) and the Monclova–Rio Grande march as one paragraph. *(Recommended: it keeps the Host's page to what is
  happening in the class's world and matches how Texians actually learned the Mexican side — after the war.)*
- **C. No.**

**Question 4 — De la Peña's snow of 1 March at Arroyo Hondo.**

- **A. Record only** (proposed `HIST-TEX-604`, DISPUTED). *(Recommended.)*
- **B. Mention it in the Alamo period's teacher notes as disputed.**
- **C. Build a snow day west of Béxar.** *Not recommended:* one witness, contradicted by a diarist at the same camp and by
  Almonte's clear night at Béxar; and it would need the `snow` kind this research says not to build.

**Question 5 — The Yucatán correction.**

- **A. Register `HIST-TEX-603` and correct the wording of `HIST-TEX-053` and `-068` when those rows are next touched.**
  *(Recommended.)*
- **B. Correct them now**, in a separate docs change.
- **C. Leave them.**

**Snow in the colonies is not an option offered**: nothing read supports it, and `HIST-TEX-226`'s negative for the colonies
and Béxar stands.

---

## 10. Proposed `HISTORY.md` rows

Not registered — **proposed**, in its format, for the owner. Checked free 2026-09-26.

| ID | Status | Claim | Source |
| --- | --- | --- | --- |
| **HIST-TEX-600** | DOCUMENTED | **The snowstorm of 13–14 February 1836, on the Mexican army in Coahuila.** After a winter "de los más benignos" until the 12th, the 13th dawned cloudy and extremely cold; a norther with rain turned to snow about 7 p.m. and it snowed through the night and until about 5 p.m. on the 14th. Depth: "cerca de media vara" (~16 in, Filisola); knee-deep in the cavalry's camp at dawn (de la Peña); more than "una cuarta" (~8 in) at Monclova (Sánchez Navarro). Three independent officers' accounts. After it, the weather alternated between very cold and hot days through March. | Filisola, *Memorias* II (1849), cap. XXIV, pp. 347–350; de la Peña, *La rebelión de Texas* (1955), pp. 37–40; Sánchez Navarro, *La guerra de Tejas*, entry of 14 Feb 1836; all read in full text on archive.org 2026-09-26 |
| **HIST-TEX-601** | DOCUMENTED (positions and kinds of loss); NOT FOUND (numbers of men) | **Where the columns were, and what it cost.** Santa Anna at Guerrero (12–16 Feb), ahead of the storm; Andrade's cavalry brigade with the army's treasury caught in the mesquite on the road from Monclova to Las Adjuntas (7 leagues), knee-deep, pack mules smothered under their loads, horses dead, muleteers deserting in the dark, the brigade unable to go on without remounts; Tolsa's brigade buried in snow at the hacienda de Hermanas; Gaona's between the Sauz and the haciendas de la Soledad and San Juan on the Sabinas, **more than fifty yoke of oxen** dead; the carts from Saltillo stopped near Baján. "Todos perdieron hombres, caballos, mulas y bueyes" — **no count of men dead in the storm is given by any witness read.** Women and boys were at the cavalry's fires (de la Peña) and in Tolsa's column (Sánchez Navarro); deaths among them are not recorded in the primaries read. | as `-600`; Filisola p. 344 (the carts; its "Enero" read as "Febrero", see the research doc §2.1), p. 363 (Santa Anna at Río Grande); Caro, in Castañeda, *The Mexican Side* (1928), p. 99 |
| **HIST-TEX-602** | STRONGLY SUPPORTED | **The storm reached the vanguard north of the Rio Grande, at La Espantosa — Coahuila in 1836, Dimmit County, Texas, today — and did not reach the colonies or Béxar.** Filisola: Sesma's division "pasó el mismo temporal, dos jornadas más allá del Río-Bravo ... en el paraje llamado la Espantosa", less severely because the country is lower; de la Peña puts it "catorce y media leguas más allá de Río Grande" (~38 miles; Espantosa Lake is ~38 miles from Guerrero) and counts it among those that lost men and animals. Neither was with that column. **Resolves `HIST-TEX-226`'s dispute:** the Alamo's "did not extend into Texas" is right in 1836 boundaries (the Nueces), "south of the Rio Grande" is right for where the damage was done, and "Temperatures in Texas reached record lows" has no support. Gray at Washington on the 14th: "A clear and cold morning." **`HIST-TEX-226`'s negative for the settled colonies and Béxar holds.** | Filisola p. 350; de la Peña p. 40; TSHA *Espantosa Lake*; Gray (as `HIST-TEX-237`); https://www.thealamo.org/remember/myths-and-legends ; https://siegeofbexar.org/siege-of-bexar/ |
| **HIST-TEX-603** | DOCUMENTED | **The Yucatán soldiers who died of cold died in Urrea's norther, not in the snow.** Urrea, 25 February 1836, marching from Santa Rosa toward the Nueces: "a cold and penetrating norther began to blow ... Six soldiers of the battalion of Yucatan died from exposure to the cold"; 26 February, two leagues short of Santa Gertrudis: "It began to rain at three in the morning and it looked like snow"; that night on the Nueces "very raw and excessively cold. The rain continued." **Corrects** `HIST-TEX-053` ("recruits from the tropics died of exposure", attached to the snow) and the Yucatán sentence in `HIST-TEX-068`. The same norther is Almonte's 9 p.m. wind at Béxar (`HIST-TEX-228`, `-229`). | Urrea, *Diario* (1838), in Castañeda, *The Mexican Side* (1928), pp. 214–215, read 2026-09-26 |
| **HIST-TEX-604** | DISPUTED | **De la Peña's snow at Arroyo Hondo, the night of 1 March 1836.** Duque's column (Zapadores, Aldama, Toluca) camped at "la Tinaja de Arroyo Hondo", between the Frio and the Medina and about 19 leagues short of Béxar; de la Peña: the creek bed sheltered them from the north wind "pero no de la nevada que fué muy fuerte"; the next day's reports could not be written because the ink had frozen; a Toluca soldier died of "el excesivo frío y un dolor". **Only witness.** Sánchez Navarro camped there the same night ("se hizo de noche en Río Hondo") and records no snow; Almonte at Béxar recorded a clear day and a 34 °F night. If true, it is the only snow in 1836 Texas in the record, about 50 miles west of the Alamo during the siege; it is **not** in the colonies and **not** at Béxar. **Do not build it.** | de la Peña (1955), p. 48; Sánchez Navarro, entries of 1–2 March; `HIST-TEX-228`, `HIST-TEX-236` |

---

## 11. Looked for and not found, or not read

- **Almonte's journal for 1–22 February 1836** (*SWHQ* 48, July 1944, pp. 10–32, ed. Asbury; also in Jack Jackson, ed.,
  *Almonte's Texas*, 2003). **Not read.** The Portal to Texas History put a proof-of-work bot check in front of it and it was
  not bypassed; JSTOR needs a login; sonsofdewittcolony.org prints only 23 February on. **This is the one primary most likely
  to add something**: Almonte kept a thermometer and travelled with Santa Anna, so was probably at Guerrero on 13–14 February.
- **Hardin, *Texian Iliad* (1994), p. 105; Lord, *A Time to Stand* (1961), p. 73** — the footnotes behind Wikipedia's
  sentence. Lending-only on archive.org; not read.
- **Filisola, English translation by Wallace Woolsey (*Memoirs for the History of the War in Texas*, 1985–87)** — lending-only;
  the 1849 Spanish was read instead.
- **Any Texian source of February 1836 that mentions the Mexican army's snow** — none found in the Handbook entries, Gray, or
  the letters already in the repository. How and when Texians learned of it is not established.
- **Any account from inside Sesma's division** of the storm at La Espantosa — not found.
- **A count of men, women or children who died in the storm** — not found in any primary read.
- **Santa Anna's letters from Guerrero, 13–16 February** — not read.
- **The painting's first publication** (Look and Learn issue and date), and **whether Osprey's *The Alamo 1836* reproduces a
  snow scene** — not established (§8).
- **Whether it snowed at Guerrero** — not found.

---

## 12. Sources

**Primary, read in full text on archive.org, 2026-09-26:**

- Vicente Filisola, *Memorias para la historia de la guerra de Tejas*, t. II (México: Imprenta de R. Rafael, 1849) —
  [archive.org/details/memorias-para-la-historia-de-la-guerra-de-tejas-volumen-2](https://archive.org/details/memorias-para-la-historia-de-la-guerra-de-tejas-volumen-2).
  Cap. XXIV, pp. 346–351 (the storm); p. 344 (the carts near Baján); p. 363 (Santa Anna at Río Grande 12–16 Feb);
  pp. 167–169 (Ugartechea, Nov–Dec 1835). Volume I (`memoriasparalah00almogoog`) downloaded, not needed.
- José Enrique de la Peña, *La rebelión de Texas: manuscrito inédito de 1836, por un oficial de Santa Anna*, ed. Jesús
  Sánchez Garza (México, 1955) —
  [archive.org/details/la-rebelion-de-texas.-manuscrito-inedito-de-1836-por-un-oficial-de-santa-anna](https://archive.org/details/la-rebelion-de-texas.-manuscrito-inedito-de-1836-por-un-oficial-de-santa-anna).
  "Diario", cap. III, pp. 37–40 (13–15 Feb); p. 48 (1–2 March). Page numbers as read from the OCR's page footers.
- José Juan Sánchez Navarro, *La guerra de Tejas: memorias de un soldado* (México: Editorial Jus) —
  [archive.org/details/laguerradetejas](https://archive.org/details/laguerradetejas). Itinerary entries of 6–15 Feb, 21 Feb,
  26 Feb – 4 March 1836. The OCR is poor; the passages used were read in context and are cited by date, not page.
- Carlos E. Castañeda, tr., *The Mexican Side of the Texan Revolution* (Dallas: P. L. Turner, 1928) —
  [archive.org/details/mexicansideoftex0000anto](https://archive.org/details/mexicansideoftex0000anto). Santa Anna's
  *Manifiesto*, pp. 11–12; Caro's *Verdadera idea*, pp. 99–101; Urrea's *Diario*, pp. 213–215.
- William Fairfax Gray, diary, and Juan N. Almonte, journal (23 Feb – 6 Mar) — as cited in `docs/WEATHER.md` §3 and §14.

**Secondary, read through a summarising tool, 2026-09-26:** the Alamo, *Myths and Legends* (Winders); Siege of Béxar
Descendants; Wikipedia, *Battle of the Alamo* and *José Enrique de la Peña*; TSHA *Texas Revolution*, *Espantosa Lake*,
*Peña, José Enrique de la*; *Still Current*, "Chapter I: The Road to the Alamo" (for the McBride image, which was also viewed
directly); Look and Learn image A012518 (title and credit from search-result text only; the page itself was behind a bot
check). URLs in §1.2 and §8.
