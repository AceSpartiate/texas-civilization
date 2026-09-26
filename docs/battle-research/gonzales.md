# The night march and the fight at Williams's place, Gonzales, 1–2 October 1835

**Built 2026-09-25** as `sim/battles/gonzales.mjs` on the engine (`sim/battle-stage.mjs`, `public/battle-view.js`;
`docs/BATTLES.md` §6), and §14's rows are in `HISTORY.md` as proposed. Where the build departs from §13 it says so in
`FIC-GONZ-415`: the phases start at the director's `crossing` (22:00, the men over the river
at Mrs. DeWitt's) rather than at the muster, which is the town's (`sim/town-scenes.mjs`), and the dawn charge moves the
whole sample.

Written as research for `docs/BATTLES.md` §5 step 1 (the engine rebuilt first on Gonzales's fight); §14 proposed rows inside the block `docs/BATTLES.md` §4 reserves
(`HIST-TEX-470`–`-479`, `FIC-GONZ-415`–`-419`; the lower halves belong to the town before the fight). Read with
`HIST-GONZ-002`–`-008`, `-020`, `HIST-TEX-006`, `-007`, `-141`, `-224`, `FIC-GONZ-005`, `-006`, `-011` and the
exclusions in `HISTORY.md` ("Do not add exact troop totals, casualty counts ... or a verbatim parley until each has its
own checked claim"), which §14 is meant to satisfy for the fight itself.

Researched 2026-09-25. Every source in §1 was opened and read on that date; quotations are copied from the page and
kept short. Where a figure is computed here rather than printed in a source, it says so.

---

## The one-line answer

**About 150–170 Texians crossed at the Gonzales ferry at 7–8 p.m. on Thursday, October 1, heard a sermon on the west
bank near midnight, and marched about seven miles upriver in a fog that came down after midnight. At about 3 a.m. a
dog barked, a Mexican outpost fired, and one Texian was slightly hurt in the nose. Castañeda mounted his hundred
dragoons and moved to a rise. At first light (about 6) the Texians came out of the timber and fired; Lt. Gregorio
Pérez charged them with 40 dragoons; the Texians fell back to the trees and fired a cannon; both sides stopped. When
the fog lifted (about 8–9), Castañeda asked for a parley; he and Moore met halfway between lines some 350 yards apart
and neither gave way. The Texians fired the cannon and advanced at the double; the dragoons rode off toward Béxar
without closing.** No Texian was killed. Castañeda reported **one soldier hit by a carbine ball** (killed or wounded
is disputed; TSHA says he "lost two men"). The Texians were back in Gonzales about 2 p.m. with the cannon.

---

## Contents

1. Sources · 3. Crossing, march and ground · 4. First shots and casualties · 5. Parley · 6. Cannon and flag ·
7. Counts and formations · 8. Withdrawal · 9. Could Gonzales hear it? · 10. Weather and light · 11. Words of command
and organisation · 12. The clock · 13. Staging sheet · 14. Proposed rows · 15. What the repository has wrong ·
16. What must be invented · 17. Art · 18. Questions for the owner

(§2, a summary, is folded into the one-line answer and §12.)

---

## 1. Sources read, and how far to trust each

| Short name | Source | Weight |
| --- | --- | --- |
| **Castañeda 2 Oct** | Castañeda to Ugartechea, "Campo del Carrizo", Oct 2, 1835, "a la una de la tarde"; Spanish text and Roger Borroel's translation (*Field Reports of the Mexican Army*, vol. III, 2001), at [sonsofdewittcolony.org/batgoneye.htm](https://www.sonsofdewittcolony.org/batgoneye.htm) | **Primary, same day.** Best for his loss and the Texian guns. |
| **Castañeda 4 Oct** | His report to Ugartechea, Béxar, Oct 4 (Borroel's translation), same page. **The Spanish original was not found.** | **Primary.** The only full account by a commander; precise on hours; self-justifying on why he left. |
| **Ugartechea** | To Castañeda Oct 1; to Cos Sept 30, Oct 1, Oct 3; to S. F. Austin Oct 4; same page | Primary. The orders to withdraw "without compromising the honor of Mexican arms". |
| **Macomb** | David B. Macomb to Austin, Gonzales, dated Oct 5, same page | Fullest Texian account, but he "arrived after the battle"; second-hand within days. Its "about two o'clock P.M. yesterday" suggests it was written on the 3rd. |
| **Fisher** | W. S. Fisher for the committee, Oct 3, same page (`HIST-TEX-007`) | Primary, next day; short. |
| **Rusk** | "Genl Rusk's Statement–War", Dec 1835, [sonsofdewittcolony.org/batgoneye2.htm](https://www.sonsofdewittcolony.org/batgoneye2.htm) | Near-contemporary; Rusk was **not there**. Rough transcription. |
| **Dewees** | W. B. Dewees (the page prints "W.D."), letter dated Columbus, Dec 25, 1835, same page as Rusk; published 1852 as *Letters from an Early Settler of Texas* | Eyewitness, edited for print. |
| **W. T. Austin** | His account of 1844, same page | Follows Macomb closely; not independent. |
| **Smith** | "An Old Soldier" (Rev. William P. Smith), *Texas Almanac* 1861, [sonsofdewittcolony.org/drsmith.htm](https://www.sonsofdewittcolony.org/drsmith.htm) | The chaplain's own memory of his address, 26 years on. |
| **Mason** | Charles Mason to F. W. Johnson, Feb 4, 1874, same page as Rusk | Lieutenant of the Gonzales company, **at the parley**, writing from "a journal or memorandum". Good on the parley. |
| **Smithwick** | *The Evolution of a State* (1900), pp. 101–104, [archive.org/details/evolutionofstate00smit](https://archive.org/details/evolutionofstate00smit) | **Arrived the day after.** First-hand on refitting the gun and on the flag. |
| **Creed Taylor** | Recollections ed. DeShields (1935), [sonsofdewittcolony.org/batgontaylor.htm](https://www.sonsofdewittcolony.org/batgontaylor.htm) | Present, aged about 15; dictated near 1900, edited. Puts the picket fire "about sundown" Oct 1 and the flag on Oct 10. |
| **Highsmith** | Ben Highsmith to A. J. Sowell (interviewed 1897; *Early Settlers and Indian Fighters*, 1900), [sonsofdewittcolony.org/highsmithben.htm](https://www.sonsofdewittcolony.org/highsmithben.htm) | Very late; low. Has the Mexicans retreating "across the river", which nobody else does. |
| **TSHA Battle** | Hardin, [Gonzales, Battle of](https://www.tshaonline.org/handbook/entries/gonzales-battle-of), rev. 2020 | Secondary, strong. No fog, no casualties. |
| **TSHA Cannon** | Lindley rev. Woodrick, [Gonzales Come and Take It Cannon](https://www.tshaonline.org/handbook/entries/gonzales-come-and-take-it-cannon), rev. Aug 5, 2025 | Secondary, strong. Two guns; shots by "skirmish"; the flag "raised above the Gonzales cannon during the battle" (its sources are not shown). |
| **TSHA people** | [Castañeda, Francisco de](https://www.tshaonline.org/handbook/entries/castaneda-francisco-de) (de la Teja, rev. 2024); [Moore, John Henry](https://www.tshaonline.org/handbook/entries/moore-john-henry) (rev. 2019) | Secondary. |
| **McKeehan** | Compiler's narrative, [sonsofdewittcolony.org/batgon.htm](https://www.sonsofdewittcolony.org/batgon.htm) | Pointer only. Its chains, horseshoes and "16 inches of powder" carry no source. |
| **Wikipedia** | [Battle of Gonzales](https://en.wikipedia.org/wiki/Battle_of_Gonzales) | Tertiary; used to see Hardin, *Texian Iliad* (1994) pp. 6–13, and Davis, *Lone Star Rising*, p. 142. **Neither book read.** |
| **Reglamento 1822** | *Reglamento provisional de la milicia cívica*, Aug 3, 1822, art. 80, in UNAM, [*Movilización de la guardia nacional*](https://archivos.juridicas.unam.mx/www/bjv/libros/7/3028/7.pdf) | Primary Mexican regulation; ceremonial militia volley, not dragoon drill. |

**Not found:** the Spanish of Castañeda's Oct 4 report; any muster of the detachment; any 1835 account of the fight
that mentions a flag; any account of the firing heard in town.

---

## 3. The crossing, the march and the ground (question 1)

- **Crossing:** "About seven o'clock on Thursday evening" (Macomb); 8 p.m. (Mason; Rusk). "the horses to the amount of
  fifty, and the infantry at the ferry, together with the cannon" (Macomb). Where the horses crossed is not stated.
- **West bank halt:** at Mrs. DeWitt's (Mason; Rusk), across from the town. A "hollow square" about eleven for Smith's
  address from his mule (Smith); council of war and address "about 12 or one oclock" (Rusk; Mason).
- **March:** about seven miles upriver (Fisher; TSHA), "with the greatest order and silence": horsemen ahead of the
  gun, "two companies of flankers, and two open columns", a rear company (Macomb; W. T. Austin).
- **Fog:** "a dense fog" on the march (Mason); "a very thick fog" at about four (Macomb); "gloomy, dark and foggy" at
  daybreak (Castañeda). Taylor: clear and still in the evening, "gulf clouds" a little after midnight, fog by morning.
  This now rests on primary sources, not only `HIST-TEX-224`'s Wikipedia.
- **First contact:** about 3 a.m. (Castañeda: "till three in the morning, nothing of note"; Hardin via Wikipedia).
  Taylor's "about sundown" on Oct 1 is not used.
- **The Mexican camp:** reached at noon on Oct 1 (Castañeda; Fisher "about 12 o'clock"; TSHA says "around sundown":
  a minor dispute) at "the habitations of the Perra", Castañeda's name for the place, so the cavalry could rest and
  graze. Fisher: "a very strong position". His men pulled down fences and killed Williams's hogs and cattle (Rusk).
  Their first ground was a fenced **cornfield** beside "Williams' plantation, houses", where they left "some few horses
  and some baggage" (Macomb). Watermelons, eaten by waiting Texians, are secondary (Hardin via Wikipedia; McKeehan).
- **The rise:** after the alarm Castañeda "had the troop mounted and went to occupy a raised ground" (Castañeda); "a
  high mound" (Macomb); "a low rise behind their camp" (TSHA); "the brow of a hill" (Mason). **The Mexicans were on a
  rise: DOCUMENTED.**
- **Texian cover:** "the woodland by the river" (Castañeda), "a skirt of timber" (Macomb), "the edge of the timbered
  bottom" (Mason), then "the open prairie" (Macomb).
- **Distance between the lines:** "about three hundred and fifty yards" (Macomb; W. T. Austin); "about four hundred"
  (Mason).
- Both forces were on the **west bank** all morning (`HIST-GONZ-007`).

---

## 4. First shots and casualties (question 2)

**The dog:** "a little Dog that followed the little army", barking "at the Howling of the Wolfes" (Rusk); "the
continued barking of a dog that had followed" (Mason). DOCUMENTED; unnamed, owner unknown.

**The outpost:** Castañeda had posted one where three Texian riders were seen that afternoon. At three it fired, and
its corporal reported the Americans passing "through the woodland by the river with a piece". Borroel translates the
fire as "grenade fire"; no grenades are documented and the Spanish was not seen. **Read it as scattered musketry**
(reasoning).

**The Texian hurt:** one of the advance guard "slightly wounded in the nose" by the picket (Macomb); "one man was only
slightly wounded" (W. T. Austin); a man "took a header from his horse" and bled from the nose, the fight otherwise
"bloodless" (Smithwick, not present); a panicked horse threw its rider, "who suffered a bloody nose" (Hardin via
Wikipedia). Against: "without the loss of a single man" (Fisher), "nor was one wounded" (Taylor). **DOCUMENTED: one
Texian slightly hurt in the nose; DISPUTED: ball or fall. No Texian killed (every source).** It is a minor hurt of the
kind `FIC-GONZ-005` allows, and it is the record's own.

**Mexican casualties:**

| Source | Figure |
| --- | --- |
| **Castañeda 2 Oct (Spanish)** | "No ha habido mas desgracia que un Soldado de la 1a. permte. de Tamaulipas de bala de carabina": no misfortune but one soldier, by a carbine ball. Borroel renders it "We have lost a Soldier"; **the Spanish does not say killed.** |
| **Castañeda 4 Oct** | after Pérez's charge, "one wounded soldier by a carbine" |
| Macomb; W. T. Austin | "It is believed that one or two" hit at first, "a very considerable number" by the cannon; Austin calls the latter "merely conjecture" |
| Smith | they "took their killed and wounded with them" |
| Taylor | saw "two of the soldiers lying dead"; later a grave with three crosses on the line of retreat |
| Austin at San Felipe, Oct 5 | rumour: "forty killed besides wounded" |
| TSHA Castañeda | "lost two men" |
| Davis p. 142, via Wikipedia | two killed |

**DISPUTED: 0, 1 or 2 Mexican dead.** Safe to stage: one Mexican soldier hit in the dawn skirmish; no number of dead.

---

## 5. The parley (question 3)

**How it came about.** Castañeda held Smither under guard "until the fog blew off", then sent him to ask for a
meeting (Smither's petition, Nov 23, 1835). He rode in calling "Don't shoot, don't shoot!" (Mason; Rusk). Moore sent
him back with "surrender at discretion or fight" (Mason) and kept him prisoner (Smither). "A parley was then sounded by
the Mexican commander" (Macomb), a bugle or trumpet call. Castañeda: "a foreigner with a white flag was calling for a
parley".

**Who met.** Moore and Wallace (Macomb, Rusk, Dewees); Mason says Wallace went with Mason; Taylor has Moore with
Coleman. Castañeda with "one of his officers" (Macomb). An interpreter (Castañeda; Dewees). Midway, "in view of both
camps" (Castañeda). "a few moments conversation" (Rusk); surrender demanded "two or three times" (Castañeda). **About
10–15 minutes** (reasoning).

| Speaker | Content (paraphrase except the quoted phrases) | Source |
| --- | --- | --- |
| Castañeda | asked "by what reason they had in attacking me" | Castañeda 4 Oct; Macomb; TSHA |
| Texians | "because I was a Centralist, and they were Federalists" | Castañeda 4 Oct |
| Wallace / Moore | the cannon was for "the defence of the Constitution"; Santa Anna had broken the constitutions; they would fight "until the last gasp" | Macomb; W. T. Austin |
| Castañeda | "he was himself a republican"; did not want to fight the colonists; his orders were to demand the cannon and wait | Macomb; TSHA ("a Federalist") |
| Castañeda | the national government still existed, the attack was unjust, the consequences theirs | Castañeda 4 Oct |
| Moore | surrender, or join and keep his rank and pay, or fight "instantly" | Macomb; Dewees; TSHA |
| Castañeda | "he was obliged to obey his orders" | Macomb; TSHA |
| Wallace | having refused, he would be fired on once both reached their lines | Mason |
| Moore and Wallace | "there is the cannon", pointing, "Come and Take it" | **Rusk only**, not present |
| Castañeda | "I will not surrender at discretion nor fight" | Rusk only |

**"Come and take it" as spoken** is in Rusk alone, given jointly to Moore and Wallace; Mason makes it the town's
unattributed answer at the ford on Sept 29; no other account of the parley, Castañeda's or Macomb's, has it.
**DISPUTED, and `HISTORY.md` forbids attributing it to a person.** Moore's "Charge 'em, boys, and give 'em hell" is
Creed Taylor's alone. Neither should be voiced by a named person (§18).

---

## 6. The cannon and the flag (question 4)

- **Two Texian guns?** Castañeda was attacked "con una piesa mediana y un esmeril" (2 Oct): a middling piece and a
  small swivel gun; TSHA Cannon reads the esmeril as iron, "of one-pounder caliber or less". Every Texian account has
  one gun. **DISPUTED** (already `HISTORY.md`'s artillery exclusion).
- **The main gun:** a brass six-pounder (Macomb; Rusk; Mason; TSHA "bronze"; Smithwick "an iron six-pounder"),
  spiked once, the spike driven out, "leaving a touch-hole the size of a man's thumb" (Smithwick).
- **Mounted on:** "a pr of cart wheels" (Rusk); "a pair of cart wheels procured for the occasion by Valentine Bennett"
  (Mason); "tolerably well mounted" (Macomb); "the fore-wheels of Albert Martin's cotton wagon" (TSHA). The solid
  tree-section wheels (Smithwick; Taylor's four cottonwood wheels) are the carriage made **after** the fight for the
  march on Béxar. What drew it is not documented.
- **Loaded with:** "Slugs were forged for the gun" (Mason); "slugs and scrap iron" (Taylor); an apron "full of slugs"
  (Highsmith); "a volley of grape" (Smith). McKeehan's chains, horseshoes and "16 inches of powder" are unsourced.
  **DOCUMENTED: iron slugs and scrap.**
- **Who served it:** Neill "had charge of the cannon" (Highsmith); Lt. Almaron Dickinson's small company (Taylor); a
  wave of Wallace's hand "caused a match to be applied" (Mason). Memoir only; name no gunner on screen.
- **Shots:** Castañeda: during Pérez's charge "they shot at us with a small cannon"; after the parley "they once again
  commenced to fire the cannon". Macomb: opened on the small troop at dawn, "still playing away" in the final advance.
  Rusk: once near sunrise, then "the first round" after the parley. Mason: "the first shot" after the parley and "A
  second round". Taylor: one at dawn, one at the end. TSHA: the esmeril first in the "second skirmish", the six-pounder
  "twice in the third skirmish". Highsmith: "five times". Taylor: "I don't think a man or a horse was hit" by it.
  **Stage one shot at dawn and two after the parley; claim no count.**

**The flag.** The design is well attested: white cloth, the cannon painted in black, a star above, "Come and take it"
below (Smithwick: "about six feet long"; Taylor: "a white field without border", "a five pointed star"). Designed by a
committee of five officers with material offered by the women of Gonzales (Taylor; TSHA Cannon); Moore "is said to
have designed" it (TSHA Moore). Names given for the sewers in popular accounts (Sarah Seely DeWitt, Evaline DeWitt,
Caroline Zumwalt) have no source read here, and TSHA calls the DeWitt-family and wedding-dress stories "Apocryphal".
**No woman's name is documented.**

**On the field on October 2?** For: TSHA Cannon (2025), "raised above the Gonzales cannon during the battle"; Hardin
p. 12 via Wikipedia. Against: **no 1835 account mentions it** (Castañeda, Macomb, Fisher, Rusk, Dewees, Smith,
Ugartechea; Dewees's "set out a flag" is the flag of truce); Taylor has it designed after the fight and hoisted "at
Gonzales on October 10, 1835"; Smithwick has it made "for Austin's army". **DISPUTED**; the staging must choose (§18).

---

## 7. Counts and formations (question 5)

**Texians:** "to day 150" (Martin, Coleman and Moore, Sept 30); "about 150 men" (Moore, Oct 1); "about one hundred
and sixty men" (Fisher); **"one hundred and sixty-eight men"** (Macomb); 150 (W. T. Austin); "about one hundred and
eighty men and boys" (Mason); "at least 140" (TSHA, from the Coushatta). Castañeda saw "200 to 220" and wrote
"doscientos... mas que menos". **About 150–170.** Mounted: fifty (Macomb; W. T. Austin; Taylor); the rest on foot.
Fisher's "the whole force, on foot" conflicts; the three who give a number agree on fifty.

**Mexicans:** "a section of 100 men" (Ugartechea to Cos); "a party of 100 men" (to Austin); "100 dragoons" (TSHA). The
Texians guessed 150–200 ("two hundred, all mounted", Macomb; "180 to 200 cavalry", Rusk, Mason). **About 100, all
mounted.** Mason's "Lieutenant-Colonel Arcineago" is unsupported.

**Style:**

- **Mexican: mounted throughout.** "had the troop mounted" (Castañeda); "posted in a triangle on the brow of a hill...
  with their bright arms glittering in the sun" (Mason). One charge, Pérez's 40, at dawn, with Castañeda and "the rest
  of the troops" behind in support; Taylor's "about twenty-five or thirty". No dismounting in any account. At the end
  they "wheeled" (Taylor), "about-faced" (Mason) and rode off. **They fired** at 3 a.m. (the outpost) and at dawn ("The
  fire died down, first by one side, then the other", Castañeda). After the parley only Taylor: "The Mexicans fired
  one volley".
- **Texian: loose, not a mob.** Two open columns with flankers, deployed "into line... the cannon in the centre, and
  the cavalry occupying the extreme right", advancing "in double quick time, and perfect order" (Macomb); Taylor, in
  the ranks, adds "a yell" and a rush. **Stage a gapped line in open order, each man on his own reload.**

---

## 8. The withdrawal and the next days (question 6)

The dragoons rode "until entirely out of sight, on the road to San Antonio" (Macomb), obeying orders to withdraw
"without compromising the honor of Mexican arms" (Ugartechea; Castañeda). **West and southwest along the Béxar road; no
pursuit** (W. T. Austin), the Texians being mostly on foot. At 1 p.m. Castañeda wrote from "Campo del Carrizo", his
camp of Sept 28 on the way in; he spent the night near "Clao" (unidentified), left at 3 a.m. for Rosillo, and reached
Béxar on the morning of the 4th. The Texians took "a few escopetas", blankets and "two or three swords" (Taylor) and
the baggage, and were in Gonzales "about two o'clock P.M." (Macomb; Taylor), seven miles on foot with the gun and the
river to cross. The town fed them and danced "nearly all night" (Taylor). Expresses went out (`HIST-TEX-006`),
volunteers gathered (`HIST-TEX-007`, `-018`), Ugartechea promised on Oct 4 to march "tomorrow" (he did not), and the
army left for Béxar on Oct 13.

---

## 9. Could Gonzales hear it? (question 7)

**No source read says the town heard it.** Taylor's cannon "awoke the echoes for miles around" is a figure of speech.

**Reasoning, not a source.** Seven miles is about 11 km. A six-pounder's report is loud and low, and low sound loses
little in air; a still, foggy morning after a clear night is the classic ground inversion, which bends sound back down
and carries it further. Cannon heard well beyond ten miles in such weather is common in nineteenth-century accounts
generally. Rifle fire is fainter and sharper and would most likely not carry seven miles through river timber.
**Offered:** the town hears the cannon as distant thuds (once about 6 a.m., once or twice about 9) and not the rifles
(`FIC-GONZ-417`).

---

## 10. Weather and light (question 8)

- Evening of Oct 1 "a clear, still evening", stars bright (Taylor). Fog from about midnight (Taylor; Mason).
- Daybreak "gloomy, dark and foggy" (Castañeda). After sunrise a person could not be told at "one hundred yards"
  (Mason). "the strangest fog", lying a little off the ground so that men's and horses' legs showed 150 yards away
  (Highsmith; low weight).
- Lifting: Castañeda waited "an hour and a half" after the dawn skirmish until "the morning was clear"; "the sun did
  not appear untill near 9" (Rusk); "entirely dissipated" at the parley (Macomb); arms "glittering in the sun" (Mason).
  **About 8–9 a.m.**
- **Wind: none recorded.** A still night and a fog that lay till nine mean calm or very light air; "gulf clouds"
  suggest a light southeasterly (reasoning). **Stage calm: smoke hangs and mixes with the fog.**
- **Light, computed here:** local mean time at Gonzales, Oct 2, 1835: nautical dawn ~5:00, civil dawn ~5:28, **sunrise
  ~5:52**; sunset Oct 1 ~5:46 p.m. A moon about nine days old set about 1–2 a.m.: moonlight for the crossing and the
  sermon, dark and fog for the march.

---

## 11. Mexican words of command and the detachment's organisation (question 9)

**Organisation.** Castañeda was a lieutenant of the **Álamo de Parras company**, at Béxar since 1823 (TSHA). His
"section of 100 men" were presidial cavalry called dragoons, drawn from more than one company: his casualty was of
"the 1st Permanent [company] of Tamaulipas", and Isabel de la Garza "a soldier from the Alamo [company]" (Castañeda).
Named officer: **Lt. Gregorio Pérez**. Arms: "escopetas" and "two or three swords" were picked up (Taylor). Lances are
not documented at Gonzales.

**Words.** The 1822 *Reglamento de la milicia cívica*, art. 80, prints the words for a volley: **"preparen las
armas... apunten... fuego"**. That fixes the period form. No dragoon drill book was read; everything else is
reconstructed.

| Use | Spanish | English gloss | Status |
| --- | --- | --- | --- |
| Fire | ¡Preparen armas! ¡Apunten! ¡Fuego! | Make ready! Aim! Fire! | Form **documented** (1822); use by these dragoons reconstructed |
| Mount / form | ¡A caballo! ¡Formen! | To horse! Form up! | Reconstructed |
| Charge | ¡Sable en mano! ¡A la carga! | Swords out! Charge! | Reconstructed |
| Retire | ¡Media vuelta! ¡Retirada! | About! Fall back! | Reconstructed |
| Challenge | ¿Quién vive? | Who goes there? | Reconstructed |
| Parley | a bugle call | | That one sounded: documented (Macomb) |

The only Texian command recorded is "Fire!" passed along the line (Smith).

---

## 12. The clock (question 10)

Game minutes as in `sim/directors.mjs` `FROM_MIDNIGHT_SEPT_29` (Oct 1 00:00 = 2880; Oct 2 00:00 = 4320), before
`ARRIVAL_MINUTES`.

| Clock | Minute | Event | Source |
| --- | --- | --- | --- |
| Oct 1, 10:00–12:00 | 3480–3600 | Castañeda moves to Williams's | Castañeda; Fisher (TSHA "sundown": disputed) |
| Oct 1, 19:00–20:00 | 4020–4080 | Crossing at the ferry | Macomb; Mason; Rusk |
| ~23:00–01:00 | 4260–4380 | Hollow square, council, Smith's address; march begins; fog comes down | Smith; Rusk; Mason; Taylor |
| **~03:00** | **4500** | Dog, outpost fire, the nose; Mexicans mount and take the rise | Castañeda; Rusk; Mason; Macomb ("about four") |
| 03:00–05:45 | 4500–4665 | Texians wait in the timber | Mason; Macomb |
| **~06:00** | **4680** | Texians fire; Pérez's charge; cannon; fire dies | Castañeda ("about six"; his 2 Oct note says five) |
| 06:30–08:00 | 4710–4800 | Lull; Texians take the house and cornfield | Castañeda ("an hour and a half"); Macomb |
| **~08:00–08:45** | **4800–4845** | Fog lifts; Smither; parley | Castañeda; Rusk ("near 9"); Mason; Macomb |
| **~08:45–09:00** | **4845–4860** | Cannon; advance at the double; dragoons withdraw | Macomb; Mason; Castañeda |
| ~09:15 | 4875 | Dragoons out of sight | Macomb |
| ~10:30 | 4950 | March home begins | reasoning from 14:00 |
| 13:00 | 5100 | Castañeda writes from Carrizo | Castañeda 2 Oct |
| **~14:00** | **5160** | Texians in Gonzales | Macomb; Taylor |

Times after 3 a.m. are good to about half an hour; the sequence is firm.

---

## 13. Staging sheet

For `sim/battles/gonzales.mjs`. **Styles:** Mexican `mounted` (horsemen massed on the rise, never dismounted);
Texian `loose` (gapped line, gun in the centre, about fifty horsemen on the right). **Counts:** Mexican 100 and Texian
160 (middle of 150–168), both drawn as samples, every family's own people drawn in the Texian force (`FIC-GONZ-006`).
**Guns:** one six-pounder on a pair of cart wheels; the esmeril not drawn unless §18 says so.

| # | Phase | Clock | Min | What happens | Fire |
| --- | --- | --- | --- | --- | --- |
| 1 | `muster` | 18:00–19:00 Oct 1 | 60 | Men gather at the ferry; the gun brought down | none |
| 2 | `crossing` | 19:00–21:00 | 120 | Foot and gun over on the flat; ~50 horses cross | none |
| 3 | `rendezvous` | 21:00–00:45 | 225 | Mrs. DeWitt's; hollow square ~23:30; Smith on his mule; council | none |
| 4 | `approach` | 00:45–03:00 | 135 | Column upriver in silence: horsemen, gun, two open files, rear guard; fog thickens | none |
| 5 | `contact` | 03:00–03:15 | 15 | Dog barks; outpost fires; one Texian hurt in the nose (stays up); Mexicans mount and take the rise | outpost 3–6 scattered shots |
| 6 | `wait` | 03:15–05:45 | 150 | Texians in the edge of the timber; Mexicans unseen on the rise | none |
| 7 | `dawn-skirmish` | 05:45–06:30 | 45 | Texians out into the open, firing at ~350 yds; ~40 dragoons charge; Texians back to the trees; the gun fires; dragoons return to the rise; one Mexican hit | rifles scattered (~40–80 shots); carbines scattered; **cannon 1** |
| 8 | `lull` | 06:30–08:00 | 90 | Texians take the house and cornfield, horses and baggage, pull down the fence before the gun; dragoons wait mounted | none |
| 9 | `parley` | 08:00–08:45 | 45 | Fog lifts; Smither rides in, is sent back; bugle; white flag; commanders meet midway ~10–15 min, ride back | none |
| 10 | `fight` | 08:45–09:00 | 15 | Gun fires; Texians advance at the double with a yell; dragoons wheel and go; gun again | **cannon 2**; ragged rifle volley then scattered; Mexican: none by default (one volley only if Taylor is accepted) |
| 11 | `withdrawal` | 09:00–09:30 | 30 | Dragoons out of sight on the Béxar road; no pursuit | none |
| 12 | `field` | 09:30–10:30 | 60 | Baggage, escopetas, blankets, swords collected | none |
| 13 | `home` | 10:30–14:00 | 210 | March back with the gun; recross; town feeds them | none |

**Smoke:** calm; it hangs, mixes with the fog, drifts very slowly.

**Lines.** DOCUMENTED lines carry a claim ID and are the only words named people speak; RECONSTRUCTED lines go to
unnamed figures only.

| Phase | DOCUMENTED (speaker, source) | RECONSTRUCTED (unnamed only) |
| --- | --- | --- |
| 3 | Smith: "let us march silently, obey the commands of our superior officers"; "WE MUST FIGHT AND WE WILL FIGHT"; "fall with our face toward the enemy" (Smith 1861) | "Keep your powder dry." "No talking in the ranks." |
| 4 | — | "Close up." "Quiet!" |
| 5 | — | "¿Quién vive?" (Who goes there?) · "Hold your fire!" · "¡A caballo!" (To horse!) |
| 6 | — | "Can't see a thing." "How far are they?" |
| 7 | — | "¡Sable en mano! ¡A la carga!" (Swords out! Charge!) · "Back to the trees!" · "Here they come!" |
| 8 | — | "Pull that fence down." "Whose horses are these?" |
| 9 | Smither: "Don't shoot, don't shoot!" (Mason; Rusk). Castañeda: why "attacking me"? (Castañeda); he is "a republican", "obliged to obey his orders" (Macomb). Moore: join, or fight "instantly" (Macomb). Texians: the gun is for "the defence of the Constitution" (Macomb) | "¿Qué dicen?" (What are they saying?) · "What's he want?" |
| 10 | "Fire!" along the line (Smith; nobody named) | a yell · "Come on, boys!" · "¡Media vuelta! ¡Retirada!" (About! Fall back!) |
| 11–12 | — | "They're gone." "Look here, a sword." |

**Never spoken:** "Come and take it" (Rusk alone; `HISTORY.md` forbids attribution) and "Charge 'em, boys, and give
'em hell" (Taylor alone). They may appear as labelled tradition in the aftermath text (§18). If the flag is shown, it
carries the words.

**Casualty moments:** phase 5, one Texian hurt in the nose, standing, hand to face, never a family's person; phase 7,
one Mexican soldier hit, slumping and led back (whether he dies is §18). Nothing else. `docs/BATTLES.md` §2.3's "nobody
falls" holds for the Texians and is **disputed** for the Mexicans.

**Aftermath:** home by 2 p.m. with the gun; no Texian killed; one man hurt in the nose; the dragoons gone to Béxar under
orders not to force a fight (`HIST-GONZ-004`); their loss not known (one or two; more by rumour); the feast and dance
(Taylor); then the gathering (`HIST-TEX-007`).

---

## 14. Proposed `HISTORY.md` rows

In the registry's current format (ID | classification | claim with sources | use and links).

```
| **HIST-TEX-470** | DOCUMENTED | **The night crossing and the march upriver, October 1–2, 1835** (2026-09-25, docs/battle-research/gonzales.md §3). The Texians began crossing "About seven o'clock on Thursday evening" (Macomb, Oct 1835), "the horses to the amount of fifty, and the infantry at the ferry, together with the cannon"; about 8 p.m. per Mason (1874) and Rusk (Dec 1835). They formed at Mrs. DeWitt's on the west bank, where between about 11 p.m. and 1 a.m. a council of war was held and Rev. W. P. Smith addressed them from his mule in a hollow square (Smith, *Texas Almanac* 1861; Mason; Rusk). They marched about seven miles upriver (Fisher, Oct 3; TSHA) "with the greatest order and silence", horsemen ahead of the cannon, two open columns with flankers, a rear guard (Macomb). Fog came down after midnight (Taylor; Mason; Hardin via Wikipedia). **Not used:** Creed Taylor's picket fire "about sundown" on Oct 1. | Phases `crossing`, `rendezvous`, `approach`. https://www.sonsofdewittcolony.org/batgoneye.htm ; https://www.sonsofdewittcolony.org/batgoneye2.htm ; https://www.sonsofdewittcolony.org/drsmith.htm |
| **HIST-TEX-471** | DOCUMENTED | **The ground at Williams's place** (2026-09-25, gonzales.md §3). Castañeda camped at noon on Oct 1 at "the habitations of the Perra" to rest and graze his cavalry (Castañeda to Ugartechea, Oct 4, 1835, Borroel trans.); his men pulled down fences and killed Williams's hogs and cattle (Rusk). The Texians came through "the woodland by the river" (Castañeda), "a skirt of timber", into "the open prairie" (Macomb). The Mexicans' first ground was a fenced cornfield by "Williams' plantation, houses" (Macomb). After the alarm Castañeda "went to occupy a raised ground" (Castañeda), "a high mound" (Macomb), "a low rise behind their camp" (TSHA); the lines were about 350 yards apart when the fog cleared (Macomb; Mason "about four hundred"). Watermelons in the field are secondary (Hardin via Wikipedia). | The battle map: river timber, open ground, a fenced cornfield with a house, the Mexicans on a rise 350–400 yards off. https://www.sonsofdewittcolony.org/batgoneye.htm |
| **HIST-TEX-472** | DOCUMENTED, **with a dispute** | **First contact about 3 a.m.: a dog, an outpost, a hurt nose** (2026-09-25, gonzales.md §4). A dog that followed the Texians barked (Rusk; Mason); Castañeda's outpost fired at about three and reported the Americans passing "through the woodland by the river with a piece"; he mounted his troop and took the rise (Castañeda, Oct 4). One Texian was slightly hurt in the nose: "slightly wounded in the nose" by the picket (Macomb), or thrown by a startled horse (Smithwick, not present; Hardin via Wikipedia). **DISPUTED: ball or fall.** No Texian was killed (all sources). | Phase `contact`; the man stays standing; within `FIC-GONZ-005`. https://www.sonsofdewittcolony.org/batgoneye.htm ; https://archive.org/details/evolutionofstate00smit |
| **HIST-TEX-473** | DOCUMENTED | **The dawn skirmish and the lull** (2026-09-25, gonzales.md §7, §12). "At about six in the morning" the Texians left the thicket and fired; Lt. Gregorio Pérez charged "with 40 dragoons" while Castañeda held the rest behind; the Texians fell back to the trees and fired a small cannon; "The fire died down, first by one side, then the other"; one soldier was hit by a carbine ball; Castañeda waited on the rise "an hour and a half" for the fog to clear (Castañeda, Oct 4; his note of Oct 2 says "a las cinco"). The Texians then took the Mexicans' cornfield, "some few horses and some baggage", and Williams's houses, and levelled the fence "opposite our cannon" (Macomb). | Phases `dawn-skirmish`, `lull`. https://www.sonsofdewittcolony.org/batgoneye.htm |
| **HIST-TEX-474** | DOCUMENTED, **in paraphrase and short phrases only** | **The parley** (2026-09-25, gonzales.md §5). Launcelot Smither rode in calling "Don't shoot, don't shoot!" (Mason; Rusk); a parley was "sounded" (Macomb). The commanders met midway in view of both lines with an interpreter: Moore with Wallace (Macomb; Rusk; Dewees), Castañeda with one officer. Castañeda asked why he was attacked and was told because he was a Centralist and they Federalists (Castañeda, Oct 4); the Texians said the cannon was for "the defence of the Constitution" (Macomb); Castañeda said he was "a republican", did not want to fight, and was "obliged to obey his orders" (Macomb; TSHA "a Federalist"); Moore offered him his rank if he joined, or a fight "instantly" (Macomb), pressing surrender "two or three times" (Castañeda). **DISPUTED:** "Come and Take it", pointing at the gun, given jointly to Moore and Wallace (Rusk only, not present); "Charge 'em, boys, and give 'em hell" (Creed Taylor only). Neither is voiced by a named person. | Phase `parley`; named people speak only these words. https://www.sonsofdewittcolony.org/batgoneye.htm ; https://www.sonsofdewittcolony.org/batgoneye2.htm ; https://www.tshaonline.org/handbook/entries/gonzales-battle-of |
| **HIST-TEX-475** | DOCUMENTED, **with disputes** | **The cannon on the field, and the flag** (2026-09-25, gonzales.md §6). A brass six-pounder (Macomb; Rusk; Mason; TSHA "bronze"; Smithwick "iron") on "a pr of cart wheels" (Rusk; Mason, "procured... by Valentine Bennett"; TSHA "the fore-wheels of Albert Martin's cotton wagon"), loaded with forged "Slugs" and scrap iron (Mason; Taylor; Highsmith); fired at least once at dawn and once or twice after the parley (Castañeda; Macomb; Mason "A second round"; TSHA "fired twice in the third skirmish"); probably hit nobody (Taylor). Castañeda also reports "un esmeril" (TSHA: iron, one-pounder or less). **DISPUTED:** how many guns and shots (1–5); who served it (Neill per Highsmith, Dickinson per Taylor). The flag (white, the cannon in black, a star, "Come and take it") is documented; **whether it flew on October 2 is DISPUTED**: TSHA Cannon (2025) and Hardin put it over the gun; no 1835 account mentions it; Creed Taylor dates its raising to Oct 10 and Smithwick says it was made "for Austin's army". No sewer is named in any source read; the DeWitt-family story is "Apocryphal" (TSHA). | One gun on two wheels; smoke once, then twice; the flag per `FIC-GONZ-419`. https://www.tshaonline.org/handbook/entries/gonzales-come-and-take-it-cannon ; https://www.sonsofdewittcolony.org/batgontaylor.htm |
| **HIST-TEX-476** | DOCUMENTED, **counts as ranges** | **Who was there and how they stood** (2026-09-25, gonzales.md §7). Texians about 150–170: "about 150" (Moore, Oct 1), "about one hundred and sixty" (Fisher), "one hundred and sixty-eight" (Macomb); fifty mounted (Macomb; W. T. Austin), the rest on foot; Castañeda saw "200 to 220". Mexicans about 100, all mounted: "a section of 100 men" (Ugartechea), "100 dragoons" (TSHA); the Texians guessed 150–200. The dragoons stood mounted on the rise "in a triangle" (Mason), never dismounted in any account, charged once with 40 at dawn, and at the end wheeled and rode off ("one volley" only in Creed Taylor). The Texians marched in open columns and deployed "into line... the cannon in the centre, and the cavalry occupying the extreme right", advancing "in double quick time" (Macomb). Castañeda: lieutenant of the Álamo de Parras company (TSHA); his men came from more than one presidial company (Castañeda); Lt. Gregorio Pérez led the 40. | Styles `mounted` and `loose` (a gapped line, not ranks). https://www.sonsofdewittcolony.org/batgoneye.htm ; https://www.tshaonline.org/handbook/entries/castaneda-francisco-de |
| **HIST-TEX-477** | DOCUMENTED, **the Mexican loss DISPUTED** | **What the fight cost** (2026-09-25, gonzales.md §4). No Texian was killed ("without the loss of a single man", Fisher); one was slightly hurt in the nose (`HIST-TEX-472`). Castañeda's note of 1 p.m. Oct 2: no misfortune but one soldier of the 1st Permanent company of Tamaulipas, "de bala de carabina"; his Oct 4 report calls him wounded. TSHA (de la Teja): Castañeda "lost two men"; Davis (via Wikipedia): two killed; Creed Taylor saw two dead and later a grave with three crosses. Macomb's "very considerable number" and Austin's rumoured "forty killed" are belief and rumour. **DISPUTED: 0, 1 or 2 Mexican dead.** | Show one Mexican soldier hit at dawn; assert no number of dead. https://www.sonsofdewittcolony.org/batgoneye.htm ; https://www.tshaonline.org/handbook/entries/castaneda-francisco-de |
| **HIST-TEX-478** | DOCUMENTED | **The withdrawal and the way home** (2026-09-25, gonzales.md §8). After the parley the dragoons rode off "until entirely out of sight, on the road to San Antonio" (Macomb), under orders to withdraw "without compromising the honor of Mexican arms" (Ugartechea, Oct 1; Castañeda), unpursued (W. T. Austin). Castañeda wrote at "la una de la tarde" from "Campo del Carrizo", camped near "Clao", and reached Béxar on the morning of the 4th. The Texians gathered the baggage, "a few escopetas", blankets and swords (Taylor) and were back in Gonzales "about two o'clock P.M." (Macomb; Taylor). | Phases `withdrawal`, `field`, `home`; the aftermath. https://www.sonsofdewittcolony.org/batgoneye.htm |
| **HIST-TEX-479** | DOCUMENTED, **the drill words from a militia regulation** | **The fog, the light and the Mexican words of command** (2026-09-25, gonzales.md §10–11). A "clear, still evening" (Taylor); fog from about midnight; "gloomy, dark and foggy" at daybreak (Castañeda); a person indistinguishable at 100 yards after sunrise (Mason); the sun seen only "near 9" (Rusk); clear at the parley (Macomb). No wind is recorded. The Mexican *Reglamento provisional de la milicia cívica* (Aug 3, 1822, art. 80) gives a volley's words as "preparen las armas... apunten... fuego". **Computed, not sourced:** sunrise about 5:52 local mean time; a nine-day moon setting about 1–2 a.m. | Calm air, smoke that hangs, fog lifting 8–9 a.m.; the three Spanish words documented, every other command reconstructed. https://archivos.juridicas.unam.mx/www/bjv/libros/7/3028/7.pdf |
| **FIC-GONZ-415** | **FICTIONAL FOR GAMEPLAY** | **The Gonzales fight on the clock** (2026-09-25, gonzales.md §13). Thirteen phases from the muster at the ferry (18:00 Oct 1) to the return (14:00 Oct 2), each a length in game minutes, fixed at single times inside the ranges of `HIST-TEX-470`–`-478`: contact 03:00, dawn skirmish 05:45–06:30, lull to 08:00, parley 08:00–08:45, the last cannon and advance 08:45–09:00. The exact minutes are the game's. | `HIST-TEX-470`–`-479` |
| **FIC-GONZ-416** | **FICTIONAL FOR GAMEPLAY** | **What the unnamed say at Gonzales** (2026-09-25, gonzales.md §13). Every Spanish command but "preparen... apunten... fuego", its English gloss, and every Texian and Mexican shout or worried word are invented and spoken only by unnamed figures. Named people speak only the words in `HIST-TEX-474` and Smith's address (`HIST-TEX-470`). "Come and take it" and "give 'em hell" are never spoken. | `HIST-TEX-474`, `-479` |
| **FIC-GONZ-417** | **FICTIONAL FOR GAMEPLAY** | **The cannon heard in Gonzales** (2026-09-25, gonzales.md §9). No source says the town heard the fight. On reasoning about a heavy gun's low report over seven miles on a still, foggy morning, a household in town hears the cannon as distant thuds (once about 6 a.m., once or twice about 9) and does not hear the rifles. | — |
| **FIC-GONZ-418** | **FICTIONAL FOR GAMEPLAY** | **Who is hurt on screen at Gonzales** (2026-09-25, gonzales.md §13). No Texian falls. The Texian hurt in the nose (`HIST-TEX-472`) is an unnamed figure who stays on his feet, never a family's person. One Mexican soldier is hit in the dawn skirmish and led back on his horse; whether he is shown dying is the owner's decision, the record being disputed (`HIST-TEX-477`). | `HIST-TEX-472`, `-477` |
| **FIC-GONZ-419** | **FICTIONAL FOR GAMEPLAY** | **The flag at Gonzales** (2026-09-25, gonzales.md §6). Whether the Come and Take It flag is drawn over the gun on October 2 or first raised in the town before the march is a staging choice between disputed sources (`HIST-TEX-475`). Whoever sews it in the game is invented; no woman's name is documented. | `HIST-TEX-475` |
```

---

## 15. What the repository has wrong or too simple

Checked against `sim/directors.mjs` and `docs/BATTLES.md` at commit `a9dbc36`.

1. **`crossing` (4200, 22:00 Oct 1) is late**: the crossing began at 7–8 p.m. (4020–4080); 22:00 falls in the halt at
   Mrs. DeWitt's.
2. **`approach` (4680, 06:00) is right; `exchange` (4760, 07:20) falls in the lull.** There were two fights, at dawn
   and after the parley (08:45–09:00). `withdrawal` (4840, 08:40) is about right; `resolved` (4920, 10:00) fits the
   field, not the town (14:00).
3. **The parley is missing**, and it is the best-documented part of the day.
4. **`docs/BATTLES.md` §2.3 "Gonzales had no deaths"** is right for the Texians, disputed for the Mexicans.
5. **The `HISTORY.md` exclusions** can narrow, once §14 is in, to what stays unchecked: the verbatim parley, an exact
   number of shots, the Mexican dead.
6. **The Texians were not "unorganized chaos" here**: columns, a deployed line, the gun in the centre. Loose, not a mob.

---

## 16. What would have to be invented

The minutes inside each range (§12); the ground's layout beyond the documented distances and order (house, cornfield,
rise, timber); where the horses crossed; every Spanish command beyond the three 1822 words and every unnamed voice;
which figure is the hurt Texian and which the hit Mexican; what the town heard (§9); the flag's makers, if shown.

---

## 17. Art the battle would need

In the library already (`docs/BATTLES.md` §1): volunteer and regular poses, `dragoon-march-*`, `cannon-bronze-e/w` with
recoil, `musket-smoke`, `cannon-smoke`, `muzzle-flash-e/w`, `dust-*`, `horse-*`, trees.

| Need | Why | Stand-in |
| --- | --- | --- |
| A six-pounder on a pair of cart wheels, man- or horse-drawn | Rusk; Mason; TSHA | `cannon-bronze-*` on `limber` wheels |
| Dragoons massed mounted, and charging | Mason's "triangle"; Pérez's 40 | `dragoon-march-*`; no charge or mounted-fire pose exists |
| Fog that thickens after midnight and thins about 8 | §10 | `smoke-dense` / `smoke-dispersing`, low opacity |
| A rail fence and cornfield, one section pulled down | Macomb; Taylor | fence pieces from `land-clearing` |
| A dog with the column | Rusk; Mason | none; the bark as a word bubble |
| A preacher on a mule; a rider with a white flag | Smith; Castañeda | `horse-*` recoloured |
| The Come and Take It flag, only if §18 puts it on the field | Smithwick; Taylor | none |

---

## 18. Questions for the owner

1. **The flag on the field.** Over the gun on October 2 (TSHA 2025, Hardin), or first raised in town before the march
   on Béxar (Taylor, Smithwick; no 1835 account of the fight mentions it)?
2. **The Mexican dead.** Show Castañeda's one soldier hit as wounded only, or two dead (TSHA, Davis, Taylor)? This
   decides whether any figure lies still at Gonzales.
3. **The Texian nose.** Show it (one unnamed man, standing), leave it to the aftermath text, or omit it?
4. **"Come and take it" and "give 'em hell."** Unspoken, as `HISTORY.md` requires, and named only as labelled tradition
   in the aftermath? Or not at all?
5. **The second gun.** Only the six-pounder (every Texian account), or Castañeda's esmeril too?
6. **The town hearing the cannon** (`FIC-GONZ-417`): acceptable as reasoning, or should the town learn only by rider?
