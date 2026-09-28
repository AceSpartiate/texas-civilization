// The famous people of 1835-36 (owner, 2026-09-26: "famous npc's: have we taken the time to ensure they do what they're
// supposed to? they should be labelled, saying and doing the things that they likely would have, dying the way they should
// (Travis, Bowie, Crocett come to mind as an example)"; docs/BATTLES.md §2c; docs/battle-research/famous-people.md).
//
// One roster. Each person has a stable id, the name drawn under them, the side they stood on, the art they are drawn with,
// the claim that says who they were, and - where they died, were hurt or taken in the window - their fate: the engagement,
// the phase, the minute and the claim. Where they stand inside a battle, and what they do there, is written in that battle's
// own phases (`people: [{ id, at | keys | with, pose }]`, sim/battles/*.mjs), beside the lines they speak, so a phase reads as
// one scene; between battles, where the record puts them on the campaign map is `map` here, dated by the director's own
// timeline or by the calendar (sim/famous.mjs reads it).
//
// **Read from the clock, never stored** (`FIC-GONZ-450`). Nothing here is written into `world`; a famous person is not an
// entity (they do no work, eat nothing, and no family can give them an order), and an old save opens with every famous person
// where its minute puts them - the correct empty value, and no `saveVersion` moves (CLAUDE.md).
//
// The rules (checked by sim/battle-stage.mjs `checkEngagement` and tests/famous-people.test.mjs):
//   - a named person speaks only `documented` or `tradition` words, never `reconstructed` ones (`FIC-GONZ-447`), and every
//     named line comes out of that person's own figure, drawn in that phase (`FIC-GONZ-457`);
//   - their fate falls at its minute and place and is never projected before it; no gore (`VISION.md` §16, `FIC-GONZ-454`);
//   - a man killed after he was taken is told, not drawn (`told: true`: Grant, Fannin) - except Crockett, whom the owner chose
//     to show as de la Peña tells it, labelled as one account and disputed (docs/BATTLES.md §2c.1, `FIC-GONZ-451`);
//   - a family's person never takes a famous person's place, and no famous fate depends on a family.
//
// This file imports nothing, so the battle engine can read it without a cycle.

/** Minutes of the timeline (from midnight on September 29, 1835, as sim/directors.mjs counts) at a date and hour. */
export function on(year, month, day, hour = 12, minute = 0) {
  return Math.round((Date.UTC(year, month - 1, day, hour, minute) - Date.UTC(1835, 8, 29)) / 60000);
}

const TX = 'texian', MX = 'mexican';
/**
 * `art`: the key of the person's own sheet (scripts/art-deliveries/famous-*.mjs) where one exists, or a stand-in figure
 * (`officer` / `frontiersman` / `general` / `woman` / `girl` / `boy` / `small-child` / `townsman` / `rider` / `gun`) drawn from
 * the library (public/battle-view.js
 * `PERSON_ART`; docs/ART_REQUESTS.md, request 2026-09-26 "the famous people").
 * `tier`: 1 carried across events (a map itinerary and several engagements), 2 named inside one engagement or two
 * (docs/battle-research/famous-people.md §3.1).
 */
const person = (id, name, side, art, tier, claimId, extra = {}) => Object.freeze({ id, name, side, art, tier, claimId, ...extra });

export const PEOPLE = Object.freeze({
  // ---------------------------------------------------------------- the Alamo
  travis: person('travis', 'Travis', TX, 'travis', 1, 'HIST-TEX-540', {
    fullName: 'William Barret Travis',
    // Shot at the north battery among the first (Joe, as Gray wrote it down on March 20, 1836); Ruiz found him there on the
    // gun carriage (`HIST-TEX-541`). He lies where he fell until the dead are carried out to the pyres.
    fate: { kind: 'killed', battle: 'alamo', phase: 'repulse', at: 4, claimId: 'HIST-TEX-541', liesUntil: 'after' },
    map: [{ from: on(1836, 2, 3, 16), until: 'alamo-siege', site: 'bexar', doing: 'command', claimId: 'HIST-TEX-540' }],
  }),
  bowie: person('bowie', 'Bowie', TX, 'bowie', 1, 'HIST-TEX-542', {
    fullName: 'James Bowie',
    // On his cot in a room on the south side (the Handbook; Ruiz), lying still when that barrack is carried; how he died is
    // disputed and nothing of it is drawn (`HIST-TEX-543`, owner's recommended P7 (a)).
    fate: { kind: 'killed', battle: 'alamo', phase: 'fallback', at: 8, claimId: 'HIST-TEX-543', pose: 'still-bed', liesUntil: 'after' },
    map: [{ from: on(1836, 1, 19, 14), until: 'alamo-siege', site: 'bexar', doing: 'command', claimId: 'HIST-TEX-542' }],
  }),
  crockett: person('crockett', 'Crockett', TX, 'crockett', 1, 'HIST-TEX-544', {
    fullName: 'David Crockett',
    // As de la Peña tells it (owner, docs/BATTLES.md §2c.1): among the handful found alive after the fighting, brought before
    // Santa Anna and killed by officers with swords - drawn without gore, labelled as one account and disputed, with the
    // killed-fighting account named on screen too (`HIST-TEX-545`, `FIC-GONZ-451`).
    fate: { kind: 'killed', battle: 'alamo', phase: 'end', at: 20, claimId: 'HIST-TEX-545', account: 'de la Peña', disputed: true, liesUntil: 'after' },
    map: [{ from: on(1836, 2, 8, 14), until: 'alamo-siege', site: 'bexar', doing: 'stand', claimId: 'HIST-TEX-544' }],
  }),
  bonham: person('bonham', 'Bonham', TX, 'bonham', 2, 'HIST-TEX-546', {
    fullName: 'James Butler Bonham',
    // "Believed to have died manning one of the cannons in the interior of the Alamo chapel" - a tradition for the place.
    fate: { kind: 'killed', battle: 'alamo', phase: 'rooms', at: 12, claimId: 'HIST-TEX-546', liesUntil: 'after' },
  }),
  'almeron-dickinson': person('almeron-dickinson', 'Dickinson', TX, 'almeron-dickinson', 1, 'HIST-TEX-547', {
    fullName: 'Almeron Dickinson',
    fate: { kind: 'killed', battle: 'alamo', phase: 'rooms', at: 12, claimId: 'HIST-TEX-547', liesUntil: 'after' },
  }),
  esparza: person('esparza', 'Esparza', TX, 'esparza', 2, 'HIST-TEX-550', {
    fullName: 'José María (Gregorio) Esparza',
    fate: { kind: 'killed', battle: 'alamo', phase: 'rooms', at: 12, claimId: 'HIST-TEX-550', liesUntil: 'after' },
  }),
  // His family (owner, 2026-09-26: "yes, add enrique and his family"; docs/battle-research/famous-people.md, the Esparza
  // family; `HIST-TEX-605`): in with him through a window of the church on the evening of February 23, in the sacristy through
  // the siege and the assault, spared, taken to Músquiz's house, and in Béxar after - at a cousin's on North Flores Street
  // "several months" (`HIST-TEX-609`; ceiling: the map keeps them there to the window's end, `FIC-GONZ-472`). None has a fate:
  // every one of them lived (`HIST-TEX-432`). Drawn as the library's woman, girl, boy and small child - stand-in: docs/
  // ART_REQUESTS.md, request 2026-09-26 "the Esparza family".
  'ana-esparza': person('ana-esparza', 'Ana Esparza', 'civilian', 'woman', 2, 'HIST-TEX-605', {
    fullName: 'Ana Salazar de Esparza, Gregorio’s wife',
    map: [{ from: on(1836, 3, 6, 18), until: on(1836, 5, 17, 12), site: 'bexar', doing: 'stand', claimId: 'HIST-TEX-609' }],
  }),
  'maria-de-jesus': person('maria-de-jesus', 'María de Jesús', 'civilian', 'girl', 2, 'HIST-TEX-605', {
    fullName: 'María de Jesús Castro Esparza, about ten, Ana’s daughter by her first husband', child: true,
    map: [{ from: on(1836, 3, 6, 18), until: on(1836, 5, 17, 12), site: 'bexar', doing: 'stand', claimId: 'HIST-TEX-609' }],
  }),
  'enrique-esparza': person('enrique-esparza', 'Enrique', 'civilian', 'boy', 2, 'HIST-TEX-605', {
    // Born about 1828 ("probably born in September 1828, although he claimed to have been born in 1824"); his interviews of
    // 1902, 1904 and 1907 are late testimony, and his words here are tradition (`HIST-TEX-607`). He died in 1917.
    fullName: 'Enrique Esparza, about eight', child: true,
    map: [{ from: on(1836, 3, 6, 18), until: on(1836, 5, 17, 12), site: 'bexar', doing: 'stand', claimId: 'HIST-TEX-609' }],
  }),
  'manuel-esparza': person('manuel-esparza', 'Manuel', 'civilian', 'small-child', 2, 'HIST-TEX-605', {
    fullName: 'Manuel Esparza, five', child: true,
    map: [{ from: on(1836, 3, 6, 18), until: on(1836, 5, 17, 12), site: 'bexar', doing: 'stand', claimId: 'HIST-TEX-609' }],
  }),
  'francisco-child': person('francisco-child', 'Francisco', 'civilian', 'small-child', 2, 'HIST-TEX-605', {
    fullName: 'Francisco Esparza, two or three, the youngest (John W. Smith was his godfather)', child: true,
    map: [{ from: on(1836, 3, 6, 18), until: on(1836, 5, 17, 12), site: 'bexar', doing: 'stand', claimId: 'HIST-TEX-609' }],
  }),
  // Gregorio's brother, who had served in the Béxar presidial company until Cos gave up the town, got leave to take the body
  // and, with his two brothers, buried it in the Campo Santo: the one defender given a Christian burial (`HIST-TEX-608`). Who
  // gave the leave (Cos or Santa Anna) and whether he was serving in 1836 are disputed; the caption says so.
  'francisco-esparza': person('francisco-esparza', 'Francisco Esparza', 'civilian', 'townsman', 2, 'HIST-TEX-608', {
    fullName: 'Francisco Esparza, Gregorio’s brother',
  }),
  'susanna-dickinson': person('susanna-dickinson', 'Mrs. Dickinson', TX, 'susanna-dickinson', 1, 'HIST-TEX-548', {
    fullName: 'Susanna Dickinson',
    // Spared; questioned by Santa Anna at Músquiz's house; sent east with Angelina, Joe and Ben, and brought in to Gonzales
    // (`HIST-TEX-432`, `-548`). The walk is drawn along a straight line and arrives when the word is confirmed there.
    map: [
      { from: on(1836, 3, 6, 18), until: 'survivors-leave', site: 'bexar', doing: 'stand', claimId: 'HIST-TEX-548' },
      { from: 'survivors-leave', until: 'fall-confirmed', road: ['bexar', 'gonzales'], doing: 'walk', claimId: 'HIST-TEX-548' },
      { from: 'fall-confirmed', until: 'alamo-end', site: 'gonzales', doing: 'stand', claimId: 'HIST-TEX-548' },
    ],
  }),
  angelina: person('angelina', 'Angelina', TX, 'angelina-dickinson', 1, 'HIST-TEX-548', { fullName: 'Angelina Dickinson', child: true, carriedBy: 'susanna-dickinson' }),
  joe: person('joe', 'Joe', TX, 'joe', 1, 'HIST-TEX-549', {
    fullName: 'Joe, a man enslaved by William B. Travis',
    // He fought beside Travis, took cover in a house after Travis fell and fired from it, came out when the officers called,
    // was attacked and saved by a captain, was brought before Santa Anna and was sent east with Mrs. Dickinson (`HIST-TEX-502`,
    // `-434`, `-549`). He lived: no text may say every man was killed without him (docs/BATTLES.md §2c.3).
    fate: { kind: 'wounded', battle: 'alamo', phase: 'end', at: 11, claimId: 'HIST-TEX-549' },
    // Held in Béxar several days; "on the way" Mrs. Dickinson and Ben "met Joe" (the Handbook's Dickinson): he sets out after
    // them and has caught them up by Gonzales.
    map: [
      { from: on(1836, 3, 6, 18), until: { key: 'survivors-leave', plus: 480 }, site: 'bexar', doing: 'stand', claimId: 'HIST-TEX-549' },
      { from: { key: 'survivors-leave', plus: 480 }, until: 'fall-confirmed', road: ['bexar', 'gonzales'], doing: 'walk', claimId: 'HIST-TEX-549' },
      { from: 'fall-confirmed', until: 'alamo-end', site: 'gonzales', doing: 'stand', claimId: 'HIST-TEX-549' },
    ],
  }),
  ben: person('ben', 'Ben', MX, 'ben', 2, 'HIST-TEX-548', {
    fullName: 'Ben, a cook with the Mexican army (Almonte’s servant in the Handbook’s Dickinson entry, Santa Anna’s cook in its Joe entry)',
    map: [{ from: 'survivors-leave', until: 'fall-confirmed', road: ['bexar', 'gonzales'], doing: 'walk', claimId: 'HIST-TEX-548' }],
  }),
  barragan: person('barragan', 'Barragán', MX, 'general', 2, 'HIST-TEX-502', { fullName: 'Captain Barragán, who saved Joe' }),
  seguin: person('seguin', 'Seguín', TX, 'seguin', 1, 'HIST-TEX-551', { fullName: 'Juan Nepomuceno Seguín' }),
  // Killed on March 6 with every man of the relief; where in the fort is not recorded, so his death is told, not drawn.
  kimbell: person('kimbell', 'Kimbell', TX, 'rider', 2, 'HIST-TEX-057', { fullName: 'George C. Kimbell' }),
  martin: person('martin', 'Martin', TX, 'rider', 2, 'HIST-TEX-057', { fullName: 'Albert Martin' }),
  'jw-smith': person('jw-smith', 'J. W. Smith', TX, 'rider', 2, 'HIST-TEX-552', { fullName: 'John W. Smith' }),
  // One of the two who rode out on the Laredo road when the bell rang on February 23, 1836, and whose horse fell with him in the mud
  // (his own narrative, `HIST-TEX-613`); sent to Gonzales that afternoon to rally the settlers (`HIST-TEX-616`).
  sutherland: person('sutherland', 'Sutherland', TX, 'rider', 2, 'HIST-TEX-613', { fullName: 'Dr. John Sutherland' }),
  castrillon: person('castrillon', 'Castrillón', MX, 'castrillon', 2, 'HIST-TEX-561', {
    fullName: 'Manuel Fernández Castrillón',
    // At San Jacinto he stood on an ammunition crate trying to rally his men, then turned and walked away from the Texians and
    // was shot (Rusk's report, as the Handbook gives it).
    fate: { kind: 'killed', battle: 'san-jacinto', phase: 'charge', at: 5, claimId: 'HIST-TEX-561', liesUntil: 'search' },
  }),
  'santa-anna': person('santa-anna', 'Santa Anna', MX, 'santa-anna', 1, 'HIST-TEX-559', {
    fullName: 'Antonio López de Santa Anna',
    // Taken the day after San Jacinto, in a private's clothes (`HIST-TEX-523`, `-559`).
    fate: { kind: 'captured', battle: 'san-jacinto', phase: 'taken', at: 0, claimId: 'HIST-TEX-559' },
    // At Béxar until March 31, then with his column (sim/advance.mjs `COLUMNS`, `HIST-TEX-585`).
    map: [
      { from: on(1836, 3, 6, 18), until: on(1836, 3, 31, 8), site: 'bexar', doing: 'command', claimId: 'HIST-TEX-585' },
      { from: on(1836, 3, 31, 8), until: 'san-jacinto-field', with: 'column:santa-anna', doing: 'ride', claimId: 'HIST-TEX-585' },
    ],
  }),
  // With the 500 he brought from Old Fort to San Jacinto (`HIST-TEX-589`), until the battle draws him.
  cos: person('cos', 'Cos', MX, 'cos', 1, 'HIST-TEX-557', { fullName: 'Martín Perfecto de Cos',
    map: [{ from: on(1836, 4, 18, 12), until: 'san-jacinto-field', with: 'column:cos', doing: 'ride', claimId: 'HIST-TEX-589' }] }),
  // The generals of the other columns of the advance (docs/battle-research/mexican-advance.md §3), each with his column.
  // Sesma with his division: on the Colorado, with Santa Anna from the Atascosito crossing to San Felipe, at Old Fort and then
  // in Filisola's camp (sim/advance.mjs: columns that marched as one are one column).
  sesma: person('sesma', 'Sesma', MX, 'general', 1, 'HIST-TEX-580', { fullName: 'Joaquín Ramírez y Sesma',
    map: [
      { from: on(1836, 3, 11, 8), until: on(1836, 4, 5, 6), with: 'column:sesma', doing: 'ride', claimId: 'HIST-TEX-580' },
      { from: on(1836, 4, 5, 6), until: on(1836, 4, 9, 8), with: 'column:santa-anna', doing: 'ride', claimId: 'HIST-TEX-585' },
      { from: on(1836, 4, 9, 8), until: on(1836, 4, 18, 6), with: 'column:sesma-brazos', doing: 'ride', claimId: 'HIST-TEX-586' },
      { from: on(1836, 4, 18, 6), until: on(1836, 5, 17, 12), with: 'column:filisola', doing: 'ride', claimId: 'HIST-TEX-596' },
    ] }),
  tolsa: person('tolsa', 'Tolsa', MX, 'general', 2, 'HIST-TEX-582', { fullName: 'Eugenio Tolsa',
    map: [
      { from: on(1836, 3, 17, 8), until: on(1836, 3, 25, 12), with: 'column:tolsa', doing: 'ride', claimId: 'HIST-TEX-582' },
      { from: on(1836, 3, 25, 12), until: on(1836, 4, 5, 6), with: 'column:sesma', doing: 'ride', claimId: 'HIST-TEX-582' },
      { from: on(1836, 4, 5, 6), until: on(1836, 4, 9, 8), with: 'column:santa-anna', doing: 'ride', claimId: 'HIST-TEX-585' },
      { from: on(1836, 4, 9, 8), until: on(1836, 4, 18, 6), with: 'column:sesma-brazos', doing: 'ride', claimId: 'HIST-TEX-586' },
      { from: on(1836, 4, 18, 6), until: on(1836, 5, 17, 12), with: 'column:filisola', doing: 'ride', claimId: 'HIST-TEX-596' },
    ] }),
  gaona: person('gaona', 'Gaona', MX, 'general', 1, 'HIST-TEX-583', { fullName: 'Antonio Gaona',
    map: [
      { from: on(1836, 3, 24, 8), until: on(1836, 4, 20, 12), with: 'column:gaona', doing: 'ride', claimId: 'HIST-TEX-583' },
      { from: on(1836, 4, 20, 12), until: on(1836, 5, 17, 12), with: 'column:filisola', doing: 'ride', claimId: 'HIST-TEX-596' },
    ] }),
  filisola: person('filisola', 'Filisola', MX, 'general', 1, 'HIST-TEX-590', { fullName: 'Vicente Filisola',
    map: [{ from: on(1836, 3, 31, 8), until: on(1836, 5, 17, 12), with: 'column:filisola', doing: 'ride', claimId: 'HIST-TEX-590' }] }),
  // ---------------------------------------------------------------- 1835
  moore: person('moore', 'Moore', TX, 'moore', 1, 'HIST-TEX-474', { fullName: 'John Henry Moore' }),
  castaneda: person('castaneda', 'Castañeda', MX, 'castaneda', 1, 'HIST-TEX-474', { fullName: 'Francisco de Castañeda' }),
  'wp-smith': person('wp-smith', 'W. P. Smith', TX, 'officer', 2, 'HIST-TEX-470', { fullName: 'the Reverend W. P. Smith' }),
  smither: person('smither', 'Smither', TX, 'rider', 2, 'HIST-TEX-474', { fullName: 'Launcelot Smither' }),
  austin: person('austin', 'Austin', TX, 'officer', 1, 'HIST-TEX-553', {
    fullName: 'Stephen F. Austin',
    // Commander of the volunteer army from October 11 to November 25, 1835: with the army wherever it marches (sim/army.mjs).
    map: [{ from: 'organised', until: 'austin-leaves', with: 'army:force', doing: 'command', claimId: 'HIST-TEX-553' }],
  }),
  burleson: person('burleson', 'Burleson', TX, 'burleson', 1, 'HIST-TEX-554', {
    fullName: 'Edward Burleson',
    // With the army from Austin's leaving, except while the Grass Fight (its 215 minutes from Deaf Smith's ride in) and the
    // storming of Béxar draw him on their own fields.
    map: [
      { from: 'austin-leaves', until: 'grass-alarm', with: 'army:force', doing: 'command', claimId: 'HIST-TEX-554' },
      { from: { key: 'grass-alarm', plus: 215 }, until: 'milam', with: 'army:force', doing: 'command', claimId: 'HIST-TEX-554' },
    ],
  }),
  fannin: person('fannin', 'Fannin', TX, 'fannin', 1, 'HIST-TEX-562', {
    fullName: 'James Walker Fannin Jr.',
    // Wounded at Coleto; executed inside the presidio at Goliad on March 27 - told, never drawn (`HIST-TEX-562`, `-517`).
    fate: { kind: 'executed', told: true, battle: 'goliad-massacre', phase: 'inside', at: 0, claimId: 'HIST-TEX-562' },
  }),
  milam: person('milam', 'Milam', TX, 'milam', 1, 'HIST-TEX-039', {
    fullName: 'Benjamin Rush Milam',
    // Killed passing into the Veramendi yard (`HIST-TEX-039`): the phase's own named fall draws him down there.
    fate: { kind: 'killed', battle: 'bexar-storming', phase: 'milam', at: 0, claimId: 'HIST-TEX-039', byFall: true },
  }),
  johnson: person('johnson', 'Johnson', TX, 'officer', 2, 'HIST-TEX-039', { fullName: 'Francis W. Johnson' }),
  karnes: person('karnes', 'Karnes', TX, 'frontiersman', 2, 'HIST-TEX-038', { fullName: 'Henry Wax Karnes' }),
  'deaf-smith': person('deaf-smith', 'Deaf Smith', TX, 'rider', 2, 'HIST-TEX-555', { fullName: 'Erastus (Deaf) Smith' }),
  neill: person('neill', 'Neill', TX, 'officer', 2, 'HIST-TEX-565', {
    fullName: 'James C. Neill',
    fate: { kind: 'wounded', battle: 'san-jacinto', phase: 'skirmish', at: 13, claimId: 'HIST-TEX-565' },
  }),
  condelle: person('condelle', 'Condelle', MX, 'general', 2, 'HIST-TEX-491', { fullName: 'Colonel Nicolás Condelle' }),
  'sanchez-navarro': person('sanchez-navarro', 'Sánchez Navarro', MX, 'general', 2, 'HIST-TEX-491', { fullName: 'José Juan Sánchez Navarro' }),
  // ---------------------------------------------------------------- the south and Goliad
  grant: person('grant', 'Grant', TX, 'rider', 2, 'HIST-TEX-556', {
    fullName: 'James Grant',
    // Killed after he had surrendered and dismounted: told, not drawn; last seen riding with the lancers after him.
    fate: { kind: 'killed', told: true, battle: 'agua-dulce', phase: 'ambush', at: 16, claimId: 'HIST-TEX-556' },
  }),
  // With his column from Refugio (`HIST-TEX-591` to `-593`), except while Coleto draws him on its field.
  urrea: person('urrea', 'Urrea', MX, 'general', 1, 'HIST-TEX-063', { fullName: 'José de Urrea',
    map: [
      { from: on(1836, 3, 14, 6), until: 'fannin-marches', with: 'column:urrea', doing: 'ride', claimId: 'HIST-TEX-591' },
      { from: on(1836, 3, 21, 7, 30), until: on(1836, 4, 25, 15), with: 'column:urrea', doing: 'ride', claimId: 'HIST-TEX-591' },
      { from: on(1836, 4, 25, 15), until: on(1836, 5, 17, 12), with: 'column:filisola', doing: 'ride', claimId: 'HIST-TEX-596' },
    ] }),
  horton: person('horton', 'Horton', TX, 'rider', 2, 'HIST-TEX-563', { fullName: 'Albert Clinton Horton' }),
  // ---------------------------------------------------------------- San Jacinto
  houston: person('houston', 'Houston', TX, 'houston', 1, 'HIST-TEX-564', {
    fullName: 'Sam Houston',
    // His horse shot under him and his ankle shattered by a musket ball in the charge (`HIST-TEX-564`).
    fate: { kind: 'wounded', battle: 'san-jacinto', phase: 'charge', at: 3, claimId: 'HIST-TEX-564' },
    map: [{ from: on(1836, 3, 11, 16), until: 'san-jacinto-field', with: 'houston', doing: 'command', claimId: 'HIST-TEX-564' }],
  }),
  rusk: person('rusk', 'Rusk', TX, 'officer', 2, 'HIST-TEX-524', { fullName: 'Thomas J. Rusk' }),
  sherman: person('sherman', 'Sherman', TX, 'rider', 2, 'HIST-TEX-565', { fullName: 'Sidney Sherman' }),
  lamar: person('lamar', 'Lamar', TX, 'rider', 2, 'HIST-TEX-565', { fullName: 'Mirabeau B. Lamar' }),
  hockley: person('hockley', 'Hockley', TX, 'officer', 2, 'HIST-TEX-558', { fullName: 'George W. Hockley' }),
  mcculloch: person('mcculloch', 'McCulloch', TX, 'officer', 2, 'HIST-TEX-558', { fullName: 'Ben McCulloch' }),
  almonte: person('almonte', 'Almonte', MX, 'almonte', 2, 'HIST-TEX-568', { fullName: 'Juan Nepomuceno Almonte' }),
  'emily-west': person('emily-west', 'Emily West', TX, 'emily-west', 1, 'HIST-TEX-569', {
    fullName: 'Emily D. West',
    // A free woman of color from New York, under contract to James Morgan at New Washington; taken there by Santa Anna's army
    // on April 16, 1836, and in the Mexican camp at San Jacinto (`HIST-TEX-569`). The picnic of April 21 is a later story,
    // staged as the owner chose and labelled tradition (`HIST-TEX-560`, `FIC-GONZ-560`, `FIC-GONZ-458`).
    side: 'civilian',
    map: [
      // At New Washington itself, the map's place since 2026-09-26 (docs/SCRAPE.md §10 (c)); until then a point near Lynchburg.
      { from: on(1835, 12, 31, 12), until: on(1836, 4, 16, 12), site: 'new-washington', place: 'New Washington', doing: 'stand', claimId: 'HIST-TEX-569' },
      { from: on(1836, 4, 16, 12), until: 'san-jacinto-field', with: 'column:santa-anna', doing: 'walk', claimId: 'HIST-TEX-569' },
    ],
  }),
  // A famous thing followed the same way (owner, 2026-09-26: "Treat the Twin Sisters in a similar fashion"): the two
  // six-pounders sent by the people of Cincinnati, with Houston's army from April 11, 1836 (`HIST-TEX-558`).
  'twin-sisters': person('twin-sisters', 'Twin Sisters', TX, 'gun', 1, 'HIST-TEX-558', {
    fullName: 'the Twin Sisters, two six-pounders from Cincinnati', thing: true,
    map: [{ from: on(1836, 4, 11, 16), until: 'san-jacinto-field', with: 'houston', doing: 'gun', claimId: 'HIST-TEX-558' }],
  }),
});

/** The poses a person may be given in a phase (public/battle-view.js draws each; a stand-in where the art has none). */
export const PERSON_POSES = Object.freeze(['stand', 'command', 'fire', 'fire-hidden', 'hide', 'emerge', 'walk', 'ride', 'sick', 'captive', 'wounded', 'write', 'seated', 'point', 'surrender', 'offer-sword', 'receive-sword', 'sword-down', 'prisoner', 'interpret', 'carry', 'gun']);
/** What may befall a famous person in the window. `told` fates are never drawn. */
export const FATE_KINDS = Object.freeze(['killed', 'executed', 'wounded', 'captured']);
/** A person by id, or throw: every name the engine draws is one of these. */
export function personOf(id) {
  const one = PEOPLE[id];
  if (!one) throw new Error(`No famous person ${id}`);
  return one;
}
