# Mexican troops and fleeing families: speeds, cavalry, musketry, and what the record has of them meeting

Research for the owner's request of 2026-09-27 (docs/SCRAPE.md §11): families choosing their own way east, Mexican troops who
can see them, the order to halt, and a chase with modelled shots. Read 2026-09-27. Claims `HIST-TEX-660` to `-668`; what the
game invents from them `FIC-GONZ-660` to `-667` (HISTORY.md).

Grades: **DOCUMENTED** (a primary source or a trial states it), **STRONGLY SUPPORTED** (scholarship agrees, or several sources
converge), **RECONSTRUCTED** (our inference, said how). "Castañeda" is C. E. Castañeda, tr., *The Mexican Side of the Texan
Revolution* (1928), read in full on archive.org (`mexicansideoftex0000anto`); page numbers are the book's. A Mexican league
(*legua*) is 5,000 varas of 33⅓ inches, about 2.63 miles (TSHA, "Vara").

## 1. The headline, said plainly

**No source read has Mexican troops firing on fleeing refugees in the Runaway Scrape.** The record has the opposite where it
has anything: at New Washington on April 16 Burnet's boat was still within range and **Almonte ordered his men to hold their
fire so as not to endanger Burnet's family** (Hardin, *Texian Iliad*, 1994, p. 191, through Wikipedia; STRONGLY SUPPORTED);
at Fort Bend the Kuykendall families, hearing the ferryman call "Mexicans!", "ran for the bottom" and spent the night in a
cane-brake, with no shot recorded (Dilue Rose Harris, secondhand in her memoir; DOCUMENTED as her account); at Refugio Urrea
executed the "adventurers" and set free "those who were colonists or Mexicans", and at Columbia and Brazoria he told the
families found hiding or waiting that they could go home "without the least fear" (Urrea, *Diary*, Castañeda pp. 221-222,
240-242; DOCUMENTED). Commanders were told "to drive out of the country all those not actively engaged in the war" (Filisola,
p. 171; DOCUMENTED). **That soldiers fire on a family that will not halt is the owner's rule and this game's** (`FIC-GONZ-665`),
and the game never presents it as history. The captures it does have are documented: the ferryman at Thompson's, the printers at
Harrisburg, and Emily West with the servants, residents and workmen at New Washington (`HIST-TEX-073`, `-665`).

## 2. Speeds (`HIST-TEX-660`, `-661`, `-668`)

| Mover | Evidence | Pace used | Grade |
| --- | --- | --- | --- |
| Mexican infantry | Santa Anna from Thompson's (afternoon of Apr 14) into Harrisburg the night of the 15th, "twelve leagues distant" (report, Castañeda pp. 74-75; "we traveled all night", *Manifesto* p. 22): about 31 miles in 30 hours. Sesma Béxar to Gonzales Mar 11-14, about 20-23 a day; Gonzales to the Colorado in rain, about 10. Filisola about 15 a day with the train. The Spanish *paso redoblado*, two feet at 120 a minute, about 2.5 mph (fixed by royal order only in 1857; the Mexican army's 1836 cadence not found). | **2.5 mph** | anchors DOCUMENTED; the hourly pace RECONSTRUCTED |
| Cavalry | Cooke, *Cavalry Tactics* art. VII: "walk... three and three-fourths miles an hour, the trot seven and a half... the gallop ten". Poinsett (1841, as summarised): walk 100 yd a minute, trot 240, gallop 300. Nolan, *Cavalry* (1853) pp. 201-202: trot "eight miles an hour", gallop "fourteen"; pp. 286-288: "at a trot to within one hundred and fifty yards, then sound the gallop". | **walk 3.75, trot 8, gallop 11 within 150 yd** | DOCUMENTED; the 11 is inside the documented 10-14 |
| Pursuit length | Nolan's pursuits run "three miles" (p. 329); a gallop held one to two miles before the horse is blown. | infantry give up after 2 miles or 30 minutes, cavalry after 3 miles or 30 minutes | DOCUMENTED (Nolan) / RECONSTRUCTED |
| Ox wagon | Marcy, *The Prairie Traveler*: "sixteen or eighteen miles a day"; the NPS 12-15; Harris: 15-20 on a good day pushed into the night, 6-8 or nothing on a boggy one. | **2 mph** (the game's `WAGON_SPEED`, `HIST-TEX-093`) | STRONGLY SUPPORTED |
| Family on foot | A man walks about three miles an hour (`HIST-TEX-093`); a family with small children about two (RECONSTRUCTED). | 3 mph grown, a child's pace where a child walks (sim/company.mjs) | STRONGLY SUPPORTED / RECONSTRUCTED |
| Family mounted | 3.75 at a walk, 5 with spells of trot (`HIST-TEX-093`). Running, its own farm horses with children up behind: **7** (RECONSTRUCTED), slower than a dragoon's trot. | 5 mph going, 7 running | STRONGLY SUPPORTED / RECONSTRUCTED |
| The Mexican baggage train | Filisola's twelve wagons held at Gonzales Apr 2-9 at the flooded Guadalupe (pp. 172-173); on Apr 28 "all the wagons and smithing equipment of the army stuck in the mud" (Urrea, *Diary* pp. 252-253). | not modelled (the columns keep their dated stops) | DOCUMENTED |

The order the owner chose ("Historical"): **ox wagon (2) < infantry (2.5) < a family on foot (3) < a family on horseback
(5 going, 7 running) < cavalry (8 at the trot, 11 at the gallop)**.

## 3. Mexican cavalry in the spring of 1836 (`HIST-TEX-662`)

- **How many.** Sesma had 50 of the mounted regiment of Dolores, Tolsa 40 from Tampico, Gaona 20 presidials (Filisola,
  Castañeda pp. 169-170). Urrea marched with "230 dragoons from Cuautla, Tampico, Durango, and Guanajuato". Santa Anna left Béxar
  with 30 dragoons and had 50 mounted from April 9. **Filisola's return of April 24 (p. 196) gives about 400 horsemen among 4,078
  men in all of Texas.** DOCUMENTED.
- **How used.** Out ahead of a column on its own line, at most a day's ride:
  - Refugio, March 15: "I ordered all the available cavalry to pursue the enemy" (Urrea, p. 221).
  - Coleto, March 19: Fannin's retreat "cut off... with our cavalry, just as they were going to enter a heavy woods".
  - Victoria, March 21: cavalry "detailed to keep them from getting into the woods"; about a hundred hid in the woods and got away (p. 231).
  - March 18-19: Sesma's scouts met Deaf Smith and Karnes on the Navidad.
  - Cox's Point, April 1: eight dragoons, foraging.
  - April 16: Almonte took the fifty dragoons of the escort "as far as the crossings at Lynchburg and New Washington" (Santa Anna, p. 75).
  - April 19: Captain Marcos Barragán's dragoons to Lynchburg, "three leagues distant" (p. 76).
- **Lancers**: the lance was in use (Sesma's lancers rode down the men who went over the Alamo's walls, `HIST-TEX-436`), not yet
  standard (Hefter: the first company of every cavalry regiment lancers from April 1837). **Presidials** carried an escopeta, two
  pistols, a lance and a broad sword (Cutrer, TSHA "Escopeta", for the 18th century); regular dragoons a short carbine.
- **How rare a patrol is** (RECONSTRUCTED): four hundred horsemen over a hundred-mile front go out only on a column's line and a
  day's ride ahead. The game's patrols are the documented episodes above, on their days (`FIC-GONZ-662`).

## 4. The musket and how often it hit (`HIST-TEX-663`, `-664`)

- **Hanger**, *To All Sportsmen* (1814), p. 205: a soldier's musket "will strike the figure of a man at 80 yards; it may even at
  a hundred; but a soldier must be very unfortunate indeed who shall be wounded by a common musket at 150 yards, PROVIDED HIS
  ANTAGONIST AIMS AT HIM"; at 200, "you may just as well fire at the moon". DOCUMENTED.
- **British trial of 1846**, a target 11 ft 6 in by 6 ft: 5 in 10 at 150 yards, none in 10 at 250; at 200 yards the board had to
  aim five and a half feet high. STRONGLY SUPPORTED (read secondhand).
- **Royal Engineers, 1841**: 3 in 4 at 150 yards on a target twice a man's height and width; beyond, none, "even when the musket
  was fixed in a rest". STRONGLY SUPPORTED.
- **Scharnhorst (1813)**, target 100 ft by 6 ft: the British musket 116 hits at 160 yards and 55 at 320 (Nafziger, *Imperial
  Bayonets*); **Winterfeldt (1755)**: 46% at 150 paces, 16.6% at 200 on a platoon's screen (Duffy). STRONGLY SUPPORTED. The
  often-quoted "60/40/25/20%" was **not** verified.
- **In battle**: volleys under 200 yards hit with 0.5-5.5% of rounds (Hughes, *Firepower*, as cited by Dubravsky). STRONGLY SUPPORTED.
- **Reloading**: three rounds a minute trained, about 20 seconds; the Baker rifle two aimed shots a minute (Wikipedia, "Baker
  rifle"); a recruit 30-40 seconds (RECONSTRUCTED). **From horseback**: "the skirmishing of cavalry... is notoriously
  ineffective", though "a man in pursuit of another... riding at speed, may fire with some chance of hitting his mark" (Nolan,
  pp. 277-278; DOCUMENTED): one carbine shot a man in a chase (RECONSTRUCTED).
- **Mexican powder and the hip**: about 165 grains a cartridge, and Texians thought the powder near useless (Dubravsky; STRONGLY
  SUPPORTED); recruits "refused to fire from the shoulder because of the strong recoil" (Hardin, p. 103; STRONGLY SUPPORTED, one
  scholar, no primary witness found). **That Mexican soldiers fired high was not found**, and the 1846 trial's physics has an
  unadjusted shot beyond a hundred yards falling low; the game builds no "fired high" rule.

**The table the game uses** (`HIT_TABLE`, sim/pursuit.mjs; RECONSTRUCTED): each shot's scatter normal and growing with range,
calibrated to the 1846 trial (σ 2.5 ft per 100 yd reproduces its 50% at 150 yd and gives 58% on Scharnhorst's screen at 165 yd),
the unadjusted drop added (0.5 ft at 100 yd, 2 at 150, 5.5 at 200); a man 1.5 by 5.5 ft, an ox or a horse broadside 7 by 3, a
wagon and team 20 by 5. A recruit from the hip or a halted horseman twice the scatter; a horseman moving four times. **A target on
the move, times 0.6** (a design choice; the model's own lead error barely changed it).

| One aimed shot hits | 25 yd | 50 | 100 | 150 | 200 |
| --- | --- | --- | --- | --- | --- |
| trained, on foot → a man | 0.75 | 0.45 | 0.17 | 0.08 | 0.03 |
| trained, on foot → an ox or a horse | 0.95 | 0.75 | 0.37 | 0.18 | 0.07 |
| trained, on foot → the wagon and team | 1.0 | 0.95 | 0.67 | 0.43 | 0.21 |
| a recruit from the hip, or a horseman halted → a man | 0.44 | 0.17 | 0.05 | 0.02 | 0.01 |
| a horseman moving → a man | 0.17 | 0.05 | 0.01 | 0 | 0 |

Past 200 yards, nothing. A running man at 100 yards, a trained soldier's shot: 0.17 × 0.6 = **about one in ten**.

## 5. Seeing and giving up (`HIST-TEX-666`, `-667`)

- **The halt**: the 1768 *Ordenanzas* of Carlos III (Tratado II, Título V) have the sentry give "Quién vive" from retreat until
  dawn and *mandar hacer alto* at forty to fifty paces at night (DOCUMENTED for the Spanish army; that Mexico's army still used them
  in 1836 is RECONSTRUCTED). The game says **"¡Alto!"** (Halt!) by day and **"¿Quién vive?"** (Who goes there?) by night, and
  "¡Ríndanse!" (Give yourselves up!) taking a family; "¡Alto, o hacemos fuego!", "¡Fuego!", "¡A ellos!" and "¡Déjenlos!" are
  RECONSTRUCTED drill words, drawn with a dashed edge (docs/BATTLES.md §2.5), never a named person's.
- **Timber is the escape** (STRONGLY SUPPORTED): cavalry catches people in the open and loses them in the woods - Coleto, Victoria,
  the Kuykendalls' cane-brake, and the Mexican cavalry "unable to fight effectively in the wooded, riverbottom terrain" (Barr).
- **Sight** (RECONSTRUCTED): a horseman's eye sees a horizon about 3.5 miles off; a wagon's white top on open prairie about three
  miles, a mounted party two, a man on foot one; in rain or fog about 200 yards; in timber 50-100 yards; a cane-brake 10-25. The
  spring of 1836 was wet, so no dust. Santa Anna chose a camp with "open plains to the left, and a clear front" (p. 113).
- **They give up** (RECONSTRUCTED from Nolan and the episodes): at the tree line, a cane-brake or the river bottom; after two or
  three miles or about half an hour; at dusk; and never beyond a day's ride from the column.

## 6. What the game takes, and what it invents

Taken: the paces; the documented patrols on their days; the hit table; the reloads; the halt calls; the timber; giving up at the
miles, the half hour and the dark. Invented (`FIC-GONZ-660` to `-667`): the family's route and its costs; that off the road a
family is seen from half as far (the owner's rule, "staying on a road is faster, but more visible"); the size of the party that
comes after a family (eight of a column's advance guard, six to ten of a patrol); that half a column's infantry are recruits
firing from the hip; that every second man of a file stops to fire while the rest run on; that a family which runs is fired on at
all (`FIC-GONZ-665`); a hit on a grown person killing one time in five and on a beast one in four; the held scene's pacing; and that
a family nobody answers for halts.

## 7. Sources

Castañeda, *The Mexican Side of the Texan Revolution* (1928): Santa Anna's report, Filisola, Urrea's *Diary*. Harris, "Reminiscences
of Mrs. Dilue Harris", *Quarterly of the TSHA* 4 (1900-01), http://www.sonsofdewittcolony.org/roseharris.htm. Hanger, *To All
Sportsmen* (1814). Nolan, *Cavalry: its History and Tactics* (1853), https://archive.org/details/cavalryitshistor00nola. Cooke,
*Cavalry Tactics*, http://www.drillnet.net/Cooke.htm. Marcy, *The Prairie Traveler* (1859). *Ordenanzas de S.M. para el régimen,
disciplina, subordinación y servicio de sus exércitos* (1768). Hardin, *Texian Iliad* (1994), through Wikipedia. Nafziger,
*Imperial Bayonets*, mirror at https://www.napolun.com/mirror/napoleonistyka.atspace.com/infantry_tactics_2.htm. Duffy via
http://kabinettskriege.blogspot.com/2016/02/how-accurate-were-regular-soldiers-in.html. Dubravsky,
http://sonsofdewittcolony.org/adp/history/1836/the_battle/the_weapons/mexweapons.html. TSHA Handbook: "Escopeta" (Cutrer), "West,
Emily D." (Henson), "Thompson's Ferry", "Telegraph and Texas Register", "Vara". NPS, "Dragoon Expedition". Wikipedia: "Brown Bess",
"Baker rifle", "Battle of Coleto", "Battle of the Alamo", "Texas Revolution", "Runaway Scrape".
