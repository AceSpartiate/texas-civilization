// The Mexican army's advance through the Runaway Scrape (owner, 2026-09-25: "we need to fully model the Mexican army as it
// pushes towards the Texian army during the runaway scrape. we'll need to ensure that 50% of player farms are in the zone that
// will see their farms burned."; the design is docs/SCRAPE.md, the record docs/battle-research/mexican-advance.md).
//
// Each column is a body of men with a commander (sim/people.mjs) marching between the places and dates the record gives
// (`COLUMNS`, `HIST-TEX-580` to `-589`), along the map's roads where the map has them and across country where it does not,
// at whatever pace on each stretch brings it in on the record's date: never faster than an army walked (`MAX_MILES_A_DAY`),
// never a jump. Between two dated stops at one place it is in camp. Foragers range out from its line of march
// (`FORAGE_MILES`, `FIC-GONZ-460`), and the country they reach while the column is advancing is the burn zone: a family's
// farm inside it is burned when they reach it (`farmFate`), and a farm outside it is never reached at all (`FIC-GONZ-465`).
// The towns burn on their own documented dates by their own documented hand (`BURNINGS`: Gonzales and San Felipe by the
// Texians, Harrisburg and New Washington by Santa Anna).
//
// **Read from the clock, never stored.** Where a column is, where its foragers are and what is burning are all worked out
// from the minute; what the world keeps is only what happened to the families (`household.flight.burned` and what the family
// has learned of it, sim/scrape.mjs). An old save opens with every column where its minute puts it.
//
// Timeline minutes (from midnight on September 29, 1835, sim/people.mjs `on`) are read against the class's own clock
// (`clockOf`, the same eighteen hours sim/houston.mjs `campClock` reads), so a column arrives on its date in every class.
//
// This module imports only the map's geometry and the roster's calendar, so sim/road.mjs, sim/armies.mjs, sim/scrape.mjs
// and sim/colonies-region.mjs can all read it without a cycle.
import { on } from './people.mjs';
import { findPath, pointAlong, polylineLength } from './geography.mjs';

const DAY = 1440;
const round = value => Math.round(value * 100) / 100;

/** The class's clock against the timeline's: eighteen hours for a class that arrives at dawn on September 28 (sim/houston.mjs `campClock`). */
export const clockOf = world => world?.director?.arrival ? 1080 : 0;
/** This class's minute on the timeline the record's dates are written in. */
export const timelineOf = world => world.minute - clockOf(world);

/**
 * How far a column's foragers ranged either side of its line of march, in miles (`FIC-GONZ-460`): five for a main column
 * and three for a single detachment's road (`range` on a stop). No source gives a distance; the documented detachments ran
 * from two leagues up and down the Brazos at San Felipe to Almonte's sixteen miles to New Washington
 * (docs/battle-research/mexican-advance.md §7). Five is what makes the burn zone the country the roads ran through.
 */
export const FORAGE_MILES = 5;
export const DETACHMENT_MILES = 3;
/**
 * Foragers reach the country near the line of march half a day after the column comes within reach, and ride out at
 * `FORAGER_MPH` (`FIC-GONZ-460`): a column marches in, and the parties go out from its camp.
 */
export const FORAGE_AFTER_HOURS = 12, FORAGER_MPH = 5;
/**
 * No farm is reached until a day after its family was told to leave (`FIC-GONZ-465`): the day the order gives. Until
 * 2026-09-29 it was also the day a family by hand was waited for before it was packed off; that wait is three real minutes now
 * (sim/decision-budget.mjs `QUESTION_BUDGETS.flight`), and this day stands on its own. The record's families near
 * Gonzales left with Houston the night before the game's order comes; this is the game's allowance, not the record's.
 */
export const ORDER_GRACE_MINUTES = 1440;
/**
 * An army of 1836 on foot at its hardest: forty miles in a day, and two and a half miles an hour on a forced march of picked
 * men for part of one (Urrea's companies from Mrs. Powell's to Columbia, Santa Anna's from Stafford's to Harrisburg). A
 * stretch that would need more is a data error (tests/mexican-advance.test.mjs).
 */
export const MAX_MILES_A_DAY = 40, MAX_MARCH_MPH = 2.5;
/** How long smoke stands over a burning, in hours: a farm's house and rails, and a town (`FIC-GONZ-463`). */
export const SMOKE_HOURS = Object.freeze({ farm: 6, town: 18 });
/** How far off smoke over the prairie is seen, in miles (`FIC-GONZ-463`). */
export const SMOKE_SIGHT_MILES = 10;
/**
 * How fast word of a burning or of a column goes out from where it happened, in miles a day (`FIC-GONZ-463`): riders,
 * refugees and the army's own people carrying it along the roads east. The 1835 expresses averaged much the same with their
 * waits at each settlement (sim/expresses.mjs, calibrated on the dated letters).
 */
export const WORD_MILES_A_DAY = 40;
/** A family sees a column where its own people are within this many miles of it, or of its foragers (sim/armies.mjs). */
export const COLUMN_SIGHT_MILES = 12;
/** From the victory at San Jacinto no farm is burned: the columns fall back (`HIST-TEX-596`, `FIC-GONZ-468`). */
export const FORAGING_ENDS = on(1836, 4, 21, 16, 30);

// ------------------------------------------------------------------------------------------------ the record

const at = (siteId, minute, extra = {}) => ({ siteId, minute, ...extra });
/** A place the map does not have, by its position (docs/battle-research/mexican-advance.md §2, from latitude and longitude). */
const pt = (key, minute, extra = {}) => ({ point: POINTS[key].at, name: POINTS[key].name, minute, ...extra });
/**
 * Places off the map the columns stopped at (§2: x = (longitude + 97.45) × 60.1, y = (29.50 − latitude) × 69). Thompson's,
 * the Old Fort, Stafford's, New Washington and Mrs. Powell's were points here until the owner made them places a family can go
 * (2026-09-26, docs/SCRAPE.md §10 (c)); they are the map's own now (scripts/build-colonies-map.mjs, docs/MAP_ACCURACY.md §14),
 * and a class saved before is given them at the save's door (sim/advance-places.mjs `openAdvancePlaces`).
 */
export const POINTS = Object.freeze({
  sanMarcos: { at: { x: -28, y: -21 }, name: 'the San Marcos crossing' },
  navidad: { at: { x: 45, y: -15 }, name: 'the Navidad' },
  sesmaCamp: { at: { x: 53, y: -17 }, name: 'the west bank of the Colorado, opposite Beeson’s' },
  industry: { at: { x: 57, y: -32 }, name: 'Industry' },
  catSpring: { at: { x: 67, y: -24 }, name: 'Cat Spring' },
  sanJacinto: { at: { x: 142, y: -17 }, name: 'the prairie by Lynch’s ferry' },
  lasJuntas: { at: { x: 51, y: 54 }, name: 'Las Juntas' },
  arenoso: { at: { x: 37, y: 46 }, name: 'Arenoso Creek' },
  texana: { at: { x: 53, y: 38 }, name: 'Texana' },
  coxs: { at: { x: 54, y: 60 }, name: 'Cox’s Point' },
  tresPalacios: { at: { x: 72, y: 45 }, name: 'the Tres Palacios' },
  cayces: { at: { x: 87, y: 43 }, name: 'Cayce’s crossing of the Colorado' },
  sanBernard: { at: { x: 95, y: 20 }, name: 'the houses on the San Bernard' },
  mud: { at: { x: 75, y: 10 }, name: 'the mud between the San Bernard and the West Bernard' },
});
const ATASCOSITO = 'the Atascosito crossing of the Colorado';

/**
 * The columns (docs/battle-research/mexican-advance.md §3, `HIST-TEX-580` to `-597`). Each stop is where the record puts the
 * column and when (timeline minutes; an hour the record does not give is noon, `FIC-GONZ-461`; where the sources disagree one
 * day is chosen and the other kept in the claim, `FIC-GONZ-469`). Two stops at one place are a camp. `strength` is the
 * record's for the stretch that begins at that stop; `range` a detachment's narrower reach; `word` what a family hears when the
 * word of that stop reaches it (sim/advance-word.mjs); `retreat` the march back after San Jacinto, which burns nothing and
 * hunts nobody. `burns` marks a column whose foragers burn the farms they reach, until `FORAGING_ENDS`. `until` is when the
 * column stops being a column of its own: joined to another, or fighting on a field the battle draws (`battle`).
 */
export const COLUMNS = Object.freeze([
  {
    // Sesma's division to the Colorado, until Santa Anna comes up to it at the Atascosito crossing on the 5th and marches it
    // on to San Felipe himself (`joins`): columns that marched as one are one column, never two markers on one road.
    id: 'sesma', name: 'Sesma’s column', commander: 'sesma', claimId: 'HIST-TEX-580', burns: true, joins: 'santa-anna',
    path: [
      at('bexar', on(1836, 3, 11, 8), { strength: 750, claimId: 'HIST-TEX-580' }),
      at('gonzales', on(1836, 3, 14, 8), { claimId: 'HIST-TEX-580', topic: 'sesma-gonzales', word: 'Mexican soldiers under General Ramírez y Sesma have come into Gonzales, what is left of it. They are coming east.' }),
      // A day at the burned town (`FIC-GONZ-461`): his scouts were at the Navidad by the 18th.
      at('gonzales', on(1836, 3, 15, 12)),
      pt('sesmaCamp', on(1836, 3, 20, 12), { via: 'columbus-crossing', claimId: 'HIST-TEX-581', topic: 'sesma-colorado', word: 'A Mexican column under Sesma is camped on the west bank of the Colorado, two miles from General Houston’s army at Beeson’s.' }),
      // Tolsa's brigade comes in about the 25th (`HIST-TEX-582`): the division is about 1,400 from then.
      pt('sesmaCamp', on(1836, 3, 25, 12), { strength: 1400, claimId: 'HIST-TEX-582' }),
      pt('sesmaCamp', on(1836, 3, 27, 6)),
      at('lower-colorado-crossing', on(1836, 3, 27, 18), { name: ATASCOSITO, claimId: 'HIST-TEX-582', topic: 'sesma-atascosito', word: 'The Mexicans are over the Colorado at the Atascosito crossing, below Beeson’s, ferrying on rafts.' }),
      at('lower-colorado-crossing', on(1836, 4, 5, 6), { name: ATASCOSITO }),
    ],
    until: on(1836, 4, 5, 6),
  },
  {
    // Tolsa's brigade, sent to reinforce Sesma about mid-March (`FIC-GONZ-462`: the day it left Béxar is not found); at the
    // Navidad on the 24th and with Sesma on the Colorado from about the 25th, when it ends as a column of its own.
    id: 'tolsa', name: 'Tolsa’s brigade', commander: 'tolsa', claimId: 'HIST-TEX-582', burns: true, joins: 'sesma',
    path: [
      at('bexar', on(1836, 3, 17, 8), { strength: 600 }),
      pt('navidad', on(1836, 3, 24, 12), { via: 'columbus-crossing', claimId: 'HIST-TEX-582' }),
      pt('sesmaCamp', on(1836, 3, 25, 12), { claimId: 'HIST-TEX-582' }),
    ],
    until: on(1836, 3, 25, 12),
  },
  {
    id: 'santa-anna', name: 'Santa Anna’s column', commander: 'santa-anna', claimId: 'HIST-TEX-585', burns: true, battle: 'san-jacinto',
    path: [
      at('bexar', on(1836, 3, 31, 8), { strength: 30, claimId: 'HIST-TEX-585' }),
      at('gonzales', on(1836, 4, 2, 12), { claimId: 'HIST-TEX-585', topic: 'santa-anna-gonzales', word: 'Santa Anna himself has left Béxar. He was at Gonzales on the 2nd, going east.' }),
      at('gonzales', on(1836, 4, 3, 8)),
      // At the Atascosito crossing with Sesma's division, which he takes on to San Felipe (Santa Anna's figure: 1,400).
      at('lower-colorado-crossing', on(1836, 4, 5, 6), { name: ATASCOSITO, strength: 1400, claimId: 'HIST-TEX-585' }),
      at('lower-colorado-crossing', on(1836, 4, 6, 8), { name: ATASCOSITO }),
      at('san-felipe', on(1836, 4, 7, 5), { claimId: 'HIST-TEX-585', topic: 'mexicans-san-felipe', word: 'The Mexican army has come to San Felipe and found it in ashes. Captain Baker’s men hold the crossing of the Brazos against it.' }),
      // Down the right bank with the picked companies on the 9th; Sesma's division stays (`sesma-brazos`).
      at('san-felipe', on(1836, 4, 9, 8), { strength: 550, claimId: 'HIST-TEX-586' }),
      at('thompsons', on(1836, 4, 12, 8), { claimId: 'HIST-TEX-586' }),
      at('thompsons', on(1836, 4, 14, 15), { strength: 750, claimId: 'HIST-TEX-587' }),
      at('staffords', on(1836, 4, 15, 6), { claimId: 'HIST-TEX-587' }),
      at('staffords', on(1836, 4, 15, 8)),
      at('harrisburg', on(1836, 4, 15, 22), { claimId: 'HIST-TEX-587', topic: 'santa-anna-harrisburg', word: 'Santa Anna came into Harrisburg in the night with about seven hundred men. The government had gone at noon.' }),
      at('harrisburg', on(1836, 4, 18, 14)),
      // Arrived the 18th or the 19th (disputed): the 19th, early (`FIC-GONZ-469`, `HIST-TEX-588`).
      at('new-washington', on(1836, 4, 19, 6), { claimId: 'HIST-TEX-588', topic: 'santa-anna-new-washington', word: 'Santa Anna is at New Washington, on the bay. Morgan’s warehouses have been emptied.' }),
      at('new-washington', on(1836, 4, 20, 8)),
      pt('sanJacinto', on(1836, 4, 20, 13), { claimId: 'HIST-TEX-588' }),
    ],
    until: on(1836, 4, 21, 16),
  },
  {
    // Sesma's division again, left at San Felipe when Santa Anna goes down the river (about 1,000, Kemp for April 11): over the
    // Brazos at Thompson's on the 13th and camped at Old Fort, where Filisola comes up on the 18th and takes it in.
    id: 'sesma-brazos', name: 'Sesma’s column', commander: 'sesma', claimId: 'HIST-TEX-586', burns: true, joins: 'filisola',
    path: [
      at('san-felipe', on(1836, 4, 9, 8), { strength: 1000, claimId: 'HIST-TEX-586' }),
      at('san-felipe', on(1836, 4, 12, 8)),
      at('thompsons', on(1836, 4, 13, 12), { claimId: 'HIST-TEX-586' }),
      at('old-fort', on(1836, 4, 14, 12), { claimId: 'HIST-TEX-590' }),
      at('old-fort', on(1836, 4, 18, 6)),
    ],
    until: on(1836, 4, 18, 6),
  },
  {
    // Cos with 500 from Old Fort on April 18, by Stafford's and Harrisburg, into the camp at 9 on the morning of the 21st.
    id: 'cos', name: 'Cos’s column', commander: 'cos', claimId: 'HIST-TEX-589', burns: true, battle: 'san-jacinto',
    path: [
      at('old-fort', on(1836, 4, 18, 12), { strength: 500, range: DETACHMENT_MILES, claimId: 'HIST-TEX-589' }),
      at('staffords', on(1836, 4, 19, 12), { range: DETACHMENT_MILES }),
      at('harrisburg', on(1836, 4, 20, 8), { range: DETACHMENT_MILES }),
      at('vinces-bridge', on(1836, 4, 21, 4), { range: DETACHMENT_MILES }),
      pt('sanJacinto', on(1836, 4, 21, 9), { claimId: 'HIST-TEX-589' }),
    ],
    until: on(1836, 4, 21, 9),
  },
  {
    // Gaona for Nacogdoches by Bastrop (`HIST-TEX-583`); his undated days are the game's (`FIC-GONZ-462`): Bastrop about the
    // 2nd, eight days there, lost by Industry and Cat Spring, by San Felipe to the Brazos on the 20th (`HIST-TEX-584`).
    id: 'gaona', name: 'Gaona’s column', commander: 'gaona', claimId: 'HIST-TEX-583', burns: true, joins: 'filisola',
    path: [
      at('bexar', on(1836, 3, 24, 8), { strength: 725, claimId: 'HIST-TEX-583' }),
      pt('sanMarcos', on(1836, 3, 26, 12)),
      at('mina', on(1836, 4, 2, 12), { claimId: 'HIST-TEX-584', topic: 'gaona-bastrop', word: 'A Mexican column under Gaona is at Bastrop, on the Colorado.' }),
      at('mina', on(1836, 4, 10, 8)),
      pt('industry', on(1836, 4, 13, 12), { claimId: 'HIST-TEX-584' }),
      pt('catSpring', on(1836, 4, 15, 12), { claimId: 'HIST-TEX-584' }),
      at('san-felipe', on(1836, 4, 18, 12)),
      // At Old Fort he is taken into Filisola's camp.
      at('old-fort', on(1836, 4, 20, 12), { claimId: 'HIST-TEX-584' }),
    ],
    until: on(1836, 4, 20, 12),
  },
  {
    // Urrea's own diary (`HIST-TEX-591` to `-593`), from Refugio on the morning of March 14.
    id: 'urrea', name: 'Urrea’s column', commander: 'urrea', claimId: 'HIST-TEX-591', burns: true, battle: 'coleto', joins: 'filisola',
    path: [
      at('refugio', on(1836, 3, 14, 6), { strength: 280, claimId: 'HIST-TEX-591' }),
      at('refugio', on(1836, 3, 16, 8)),
      at('goliad', on(1836, 3, 17, 12), { claimId: 'HIST-TEX-591' }),
      at('goliad', on(1836, 3, 19, 11), { strength: 440 }),
      at('coleto', on(1836, 3, 19, 17), { claimId: 'HIST-TEX-063' }),
      at('coleto', on(1836, 3, 20, 18)),
      at('victoria', on(1836, 3, 21, 7, 30), { strength: 1300, claimId: 'HIST-TEX-591', topic: 'urrea-victoria', word: 'General Urrea has taken Victoria.' }),
      at('victoria', on(1836, 3, 31, 8)),
      pt('arenoso', on(1836, 3, 31, 18)),
      pt('texana', on(1836, 4, 1, 18), { claimId: 'HIST-TEX-592', topic: 'urrea-texana', word: 'Urrea’s column is at Texana, on the Navidad.' }),
      pt('texana', on(1836, 4, 3, 8)),
      pt('tresPalacios', on(1836, 4, 5, 18), { claimId: 'HIST-TEX-592' }),
      pt('cayces', on(1836, 4, 6, 18), { claimId: 'HIST-TEX-592' }),
      pt('cayces', on(1836, 4, 12, 6)),
      at('matagorda', on(1836, 4, 13, 10), { claimId: 'HIST-TEX-592', topic: 'urrea-matagorda', word: 'Urrea’s column has taken Matagorda and the goods in its warehouses.' }),
      // 230 left to hold Matagorda (`HIST-TEX-592`).
      at('matagorda', on(1836, 4, 14, 12), { strength: 1000 }),
      pt('cayces', on(1836, 4, 15, 18)),
      pt('sanBernard', on(1836, 4, 18, 12), { claimId: 'HIST-TEX-593' }),
      pt('sanBernard', on(1836, 4, 19, 18)),
      at('powells', on(1836, 4, 20, 12), { claimId: 'HIST-TEX-593' }),
      at('powells', on(1836, 4, 21, 4)),
      at('columbia', on(1836, 4, 21, 16), { claimId: 'HIST-TEX-593', topic: 'urrea-columbia', word: 'Urrea has taken Columbia.' }),
      at('brazoria', on(1836, 4, 22, 10), { strength: 400, claimId: 'HIST-TEX-593', topic: 'urrea-brazoria', word: 'Urrea is at Brazoria. The families who stayed there were let be.' }),
      at('brazoria', on(1836, 4, 23, 11), { retreat: true }),
      at('columbia', on(1836, 4, 23, 17), { retreat: true }),
      // At Mrs. Powell's from midnight, where Filisola's army comes up in the afternoon of the 25th and takes him in.
      at('powells', on(1836, 4, 24, 23), { retreat: true }),
      at('powells', on(1836, 4, 25, 15), { retreat: true }),
    ],
    until: on(1836, 4, 25, 15),
  },
  // Urrea's detachments (`HIST-TEX-591`, `-592`), each on its own narrower road.
  {
    id: 'urrea-juntas', name: 'Urrea’s detachment', commander: null, claimId: 'HIST-TEX-591', burns: true,
    path: [at('victoria', on(1836, 3, 21, 20), { strength: 250, range: DETACHMENT_MILES }), pt('lasJuntas', on(1836, 3, 22, 14), { range: DETACHMENT_MILES }), at('victoria', on(1836, 3, 23, 16))],
    until: on(1836, 3, 23, 16),
  },
  {
    id: 'urrea-coxs', name: 'Urrea’s dragoons', commander: null, claimId: 'HIST-TEX-592', burns: true,
    path: [pt('texana', on(1836, 4, 1, 20), { strength: 8, range: DETACHMENT_MILES }), pt('coxs', on(1836, 4, 2, 18), { range: DETACHMENT_MILES }), pt('texana', on(1836, 4, 4, 12))],
    until: on(1836, 4, 4, 12),
  },
  {
    // Filisola with the rear: Amat's battalions, the guns and the train (`HIST-TEX-590`), and after San Jacinto the whole
    // army's retreat from Mrs. Powell's (`HIST-TEX-596`, `-597`).
    id: 'filisola', name: 'Filisola’s column', commander: 'filisola', claimId: 'HIST-TEX-590', burns: true,
    path: [
      at('bexar', on(1836, 3, 29, 8), { claimId: 'HIST-TEX-590' }),
      at('gonzales', on(1836, 4, 2, 18), { claimId: 'HIST-TEX-590' }),
      // Filisola has the train over the Guadalupe "April 2-9" and at the Atascosito crossing on the 10th, sixty miles on: it
      // cannot be both, and the march leaves on the evening of the 7th (`FIC-GONZ-469`).
      at('gonzales', on(1836, 4, 7, 18)),
      at('lower-colorado-crossing', on(1836, 4, 10, 18), { name: ATASCOSITO, strength: 1800, claimId: 'HIST-TEX-590' }),
      at('lower-colorado-crossing', on(1836, 4, 14, 6), { name: ATASCOSITO }),
      at('san-felipe', on(1836, 4, 15, 12), { claimId: 'HIST-TEX-590' }),
      at('san-felipe', on(1836, 4, 16, 8)),
      // At Old Fort by about the 18th (`HIST-TEX-590`; the day of arrival is not given) he takes in Sesma's division and, on
      // the 20th, Gaona's column; the record gives no count for the
      // camp between, and Cos goes on the 18th with 500.
      at('old-fort', on(1836, 4, 18, 6), { strength: null, claimId: 'HIST-TEX-590' }),
      at('old-fort', on(1836, 4, 18, 12)),
      at('old-fort', on(1836, 4, 24, 6), { retreat: true }),
      at('powells', on(1836, 4, 25, 15), { retreat: true, strength: 2563, claimId: 'HIST-TEX-596', topic: 'army-powells', word: 'The Mexican army is gathered at Mrs. Powell’s on the San Bernard, going back toward the Colorado.' }),
      // The march back begins in the rain of the 26th (Urrea; Filisola says the 27th, `FIC-GONZ-469`).
      at('powells', on(1836, 4, 26, 11), { retreat: true }),
      pt('mud', on(1836, 4, 28, 12), { retreat: true, claimId: 'HIST-TEX-597' }),
      at('lower-colorado-crossing', on(1836, 4, 29, 18), { retreat: true, name: ATASCOSITO, claimId: 'HIST-TEX-597' }),
      at('lower-colorado-crossing', on(1836, 5, 8, 12), { retreat: true, name: ATASCOSITO }),
      at('victoria', on(1836, 5, 13, 12), { retreat: true, claimId: 'HIST-TEX-597' }),
      at('goliad', on(1836, 5, 17, 12), { retreat: true }),
    ],
  },
]);

/**
 * The towns and houses burned, when and by whose hand (docs/battle-research/mexican-advance.md §4). The Texians burned
 * Gonzales, the houses at Refugio, Goliad, Beeson's and San Felipe (`HIST-TEX-594`); Santa Anna's column burned Stafford's,
 * Harrisburg and New Washington (`HIST-TEX-595`); Bastrop was plundered by Gaona and found destroyed (`HIST-TEX-598`);
 * the retreat's rear guard burned Mrs. Powell's (`HIST-TEX-596`). No record found says Victoria, Matagorda, Columbia or
 * Brazoria burned, and none of them does. `minute` is when the smoke goes up; where the day is disputed one is chosen
 * (`FIC-GONZ-469`). `words` is what a family hears.
 */
export const BURNINGS = Object.freeze([
  { id: 'gonzales', siteId: 'gonzales', name: 'Gonzales', minute: on(1836, 3, 13, 23), hand: 'texian', label: 'DOCUMENTED', claimId: 'HIST-TEX-594',
    words: 'Gonzales is burned. General Houston had the town fired as the army left it on the night of the 13th, so the Mexican army would find nothing there.' },
  { id: 'refugio', siteId: 'refugio', name: 'the houses at Refugio', minute: on(1836, 3, 14, 8), hand: 'texian', label: 'DOCUMENTED', claimId: 'HIST-TEX-594',
    words: 'At Refugio, Captain King’s men in the mission church set fire to the houses round it as Urrea came on.' },
  { id: 'goliad', siteId: 'goliad', name: 'Goliad', minute: on(1836, 3, 18, 20), hand: 'texian', label: 'DOCUMENTED', claimId: 'HIST-TEX-594',
    words: 'Colonel Fannin has burned Goliad and left it. Only the church is standing.' },
  { id: 'beesons', siteId: 'columbus-crossing', name: 'Beeson’s house', minute: on(1836, 3, 21, 6), hand: 'texian', label: 'DOCUMENTED', claimId: 'HIST-TEX-594',
    words: 'Texian scouts burned Beeson’s house and outbuildings on the Colorado the morning after the Mexicans came up on the other bank.' },
  { id: 'san-felipe', siteId: 'san-felipe', name: 'San Felipe', minute: on(1836, 3, 30, 10), hand: 'texian', label: 'DOCUMENTED', claimId: 'HIST-TEX-594',
    words: 'San Felipe is burned. Captain Moseley Baker’s men fired the town before crossing the Brazos. Baker says it was on orders; General Houston says he gave none.' },
  { id: 'bastrop', siteId: 'mina', name: 'Bastrop', minute: on(1836, 4, 10, 6), hand: 'mexican', label: 'STRONGLY SUPPORTED', claimId: 'HIST-TEX-598',
    words: 'Gaona’s column has plundered Bastrop and left it wrecked.' },
  { id: 'staffords', siteId: 'staffords', name: 'Stafford’s plantation', minute: on(1836, 4, 15, 12), hand: 'mexican', label: 'DOCUMENTED', claimId: 'HIST-TEX-595',
    words: 'Santa Anna’s column burned Stafford’s plantation on the Brazos: the house, the sugar mill, the gin and the quarters.' },
  { id: 'harrisburg', siteId: 'harrisburg', name: 'Harrisburg', minute: on(1836, 4, 16, 12), hand: 'mexican', label: 'STRONGLY SUPPORTED', claimId: 'HIST-TEX-595',
    words: 'Harrisburg is burned, all but one house. Santa Anna’s army was there.' },
  { id: 'new-washington', siteId: 'new-washington', name: 'New Washington', minute: on(1836, 4, 20, 8), hand: 'mexican', label: 'DOCUMENTED', claimId: 'HIST-TEX-595',
    words: 'Santa Anna’s men burned New Washington and Morgan’s warehouses as they left it.' },
  { id: 'powells', siteId: 'powells', name: 'Mrs. Powell’s', minute: on(1836, 4, 26, 12), hand: 'mexican', label: 'DOCUMENTED', claimId: 'HIST-TEX-596',
    words: 'The Mexican army’s rear guard burned Mrs. Powell’s house on the San Bernard as the army went back.' },
]);

// ------------------------------------------------------------------------------------------------ the march

const placeOf = (map, stop) => stop.point || map.sites[stop.siteId];
/**
 * A road that goes further than this many times the straight line is not the column's road: the map has no road between
 * the two places, and the column goes across country (sim/road.mjs had this rule first; it lives here now).
 */
export const ROAD_DETOUR = 1.6;

/**
 * The line a column's head follows from one dated stop to the next: the roads where the map has them. A stop off the map's
 * places (Thompson's ferry, Old Fort) names the place whose road it takes (`via`) and leaves that road where it comes nearest;
 * from a stop off the map's places the column goes across country.
 */
export function columnLeg(map, a, b) {
  const from = placeOf(map, a), to = placeOf(map, b);
  if (!from || !to) return null;
  const straight = [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
  if (a.point) return straight;
  const roadTo = b.point ? b.via : b.siteId;
  const road = roadTo && roadTo !== a.siteId ? findPath(map, a.siteId, roadTo) : null;
  if (!road) return straight;
  let points = road.points;
  if (b.point) {
    let nearest = 0;
    road.points.forEach((point, index) => { if (Math.hypot(point.x - to.x, point.y - to.y) < Math.hypot(road.points[nearest].x - to.x, road.points[nearest].y - to.y)) nearest = index; });
    points = [...road.points.slice(0, nearest + 1), { x: to.x, y: to.y }];
  }
  return polylineLength(points) > ROAD_DETOUR * Math.hypot(to.x - from.x, to.y - from.y) ? straight : points;
}

const legsMemo = new WeakMap();
/** Each leg of a column's march on this map, memoised on the map (a map's roads do not change while a class runs). */
export function legsOf(map, column) {
  if (!legsMemo.has(map)) legsMemo.set(map, new Map());
  const memo = legsMemo.get(map);
  if (!memo.has(column.id)) memo.set(column.id, column.path.slice(1).map((b, i) => { const points = columnLeg(map, column.path[i], b); return points && { points, length: polylineLength(points) }; }));
  return memo.get(column.id);
}

const nameOf = (map, stop) => stop?.name || map.sites[stop?.siteId]?.name;
/** The record's strength for the stretch a column is on: the last stop at or before this one that says (`HIST-TEX-580` to `-596`). */
export function strengthAt(column, index) {
  for (let i = index; i >= 0; i--) if ('strength' in column.path[i]) return column.path[i].strength;
  return null;
}
/** The crossings of the big rivers a leg passes over, if it is at one now: the head within a quarter mile of the place. */
const crossingAt = (map, point) => Object.values(map.sites).find(site => ['ferry', 'ford', 'crossing'].includes(site.kind) && site.waterKind !== 'creek' && Math.hypot(site.x - point.x, site.y - point.y) < 0.25) || null;
/**
 * Where a column's head stands at this timeline minute and what it is doing: null before it is in the country and after
 * `until`. Between two stops at one place it is in camp there; otherwise it is on the road making for the next stop, and
 * at a ferry or ford of a river on its way it is crossing.
 */
export function headAt(map, column, t) {
  const path = column.path;
  if (!map?.sites || !path.length || t < path[0].minute || (column.until && t >= column.until)) return null;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    if (t <= b.minute) {
      const leg = legsOf(map, column)[i - 1];
      if (!leg) return null;
      const f = b.minute === a.minute ? 1 : (t - a.minute) / (b.minute - a.minute);
      const point = f >= 1 ? leg.points.at(-1) : pointAlong(leg.points, leg.length * f);
      const camp = leg.length < 0.05;
      const ahead = f >= 1 ? leg.points.at(-1) : pointAlong(leg.points, Math.min(leg.length, leg.length * f + 0.5));
      const crossing = !camp && crossingAt(map, point);
      return {
        x: point.x, y: point.y, leg: i - 1, camp, moving: !camp && f > 0 && f < 1,
        toward: b.siteId || null, towardName: nameOf(map, b), place: camp ? nameOf(map, a) : null,
        ...(crossing && { crossing: crossing.name }),
        right: ahead.x >= point.x, retreat: Boolean(a.retreat), strength: strengthAt(column, i - 1),
        range: a.range ?? FORAGE_MILES,
      };
    }
  }
  const last = path.at(-1), place = placeOf(map, last);
  return place ? { x: place.x, y: place.y, leg: path.length - 1, camp: true, moving: false, toward: last.siteId || null, towardName: nameOf(map, last), place: nameOf(map, last), right: true, retreat: Boolean(last.retreat), strength: strengthAt(column, path.length - 1), range: last.range ?? FORAGE_MILES } : null;
}

/** Every column in the country at this class's minute, with its head. */
export function columnsNow(world) {
  if (!world?.map?.sites) return [];
  const t = timelineOf(world);
  return COLUMNS.map(column => ({ column, head: headAt(world.map, column, t) })).filter(one => one.head);
}

// ------------------------------------------------------------------------------------------------ the burn zone

/**
 * The minutes in which a column's coming within reach of a farm means it burns: from its first stop until it stops being a
 * column, and early enough that its parties (half a day behind it, and at most an hour's ride) are at the farm by the
 * victory (`FORAGING_ENDS`). Urrea took Columbia and Brazoria after San Jacinto was fought and let the families there be.
 */
const burnWindow = column => column.burns ? { from: column.path[0].minute, until: Math.min(column.until ?? Infinity, column.path.at(-1).minute, FORAGING_ENDS - (FORAGE_AFTER_HOURS + FORAGE_MILES / FORAGER_MPH) * 60) } : null;
/** How finely the head is sampled for the zone, in timeline minutes. At forty miles a day that is a half mile between samples. */
const SAMPLE_MINUTES = 20;
const samplesMemo = new WeakMap();
/**
 * The burning columns' heads, sampled through their burning windows, bucketed on a two-mile grid: what `farmFate` and the
 * land's dealing ask "who came within reach of this point, and when". Memoised on the map.
 */
export function burnSamples(map) {
  if (samplesMemo.has(map)) return samplesMemo.get(map);
  const buckets = new Map(), all = [];
  for (const column of COLUMNS) {
    const window = burnWindow(column);
    if (!window) continue;
    for (let t = window.from; t <= window.until; t += SAMPLE_MINUTES) {
      const head = headAt(map, column, t);
      if (!head || head.retreat) continue;
      const sample = { x: head.x, y: head.y, t, range: head.range, columnId: column.id };
      all.push(sample);
      const key = `${Math.floor(head.x / 2)},${Math.floor(head.y / 2)}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(sample);
    }
  }
  const found = { buckets, all };
  samplesMemo.set(map, found);
  return found;
}

/**
 * When, if ever, a column's foragers reach this point, on this map: the first minute a burning column's head comes within
 * its forager range of it (`FORAGE_MILES`, a detachment's `DETACHMENT_MILES`), then half a day for the parties to go out
 * (`FORAGE_AFTER_HOURS`) and the ride from wherever the column then is. Null for a point outside the burn zone, which nobody
 * ever reaches. `minute` is on the timeline; `left` is when the party set out and `from` where the column stood then.
 */
export function reachOf(map, point) {
  if (!point || !map?.sites) return null;
  const { buckets } = burnSamples(map);
  const reach = Math.ceil(FORAGE_MILES / 2) + 1, cx = Math.floor(point.x / 2), cy = Math.floor(point.y / 2);
  let first = null;
  for (let dx = -reach; dx <= reach; dx++) for (let dy = -reach; dy <= reach; dy++) {
    for (const sample of buckets.get(`${cx + dx},${cy + dy}`) || []) {
      if (Math.hypot(sample.x - point.x, sample.y - point.y) > sample.range) continue;
      if (!first || sample.t < first.t) first = sample;
    }
  }
  if (!first) return null;
  const column = COLUMNS.find(one => one.id === first.columnId);
  const left = first.t + FORAGE_AFTER_HOURS * 60;
  const from = headAt(map, column, left) || headAt(map, column, first.t) || first;
  const miles = Math.hypot(from.x - point.x, from.y - point.y);
  return { minute: left + Math.round(miles / FORAGER_MPH * 60), left, columnId: first.columnId, from: { x: round(from.x), y: round(from.y) }, miles: round(Math.hypot(first.x - point.x, first.y - point.y)) };
}
/** Whether a point lies in the burn zone: country a column's foragers reached while it advanced. */
export const inBurnZone = (map, point) => Boolean(reachOf(map, point));

const fateMemo = new WeakMap();
/** A family's farm's fate on its own map, memoised: `reachOf` its home site. Null on a map the advance is not modelled on. */
export function farmFate(world, household) {
  const map = world.map, home = map?.sites?.[household.homeSiteId];
  if (!home || !advanceModelled(world)) return null;
  if (!fateMemo.has(map)) fateMemo.set(map, new Map());
  const memo = fateMemo.get(map);
  if (!memo.has(home.id)) memo.set(home.id, reachOf(map, home));
  return memo.get(home.id);
}
/**
 * The class minute the foragers come to this family's farm, or null: the timeline's minute on this class's clock, and not
 * before a day after the family was told to leave (`ORDER_GRACE_MINUTES`). A family not yet told is not reached yet.
 */
export function burnMinute(world, household) {
  const fate = farmFate(world, household);
  if (!fate || !household.flight || !Number.isFinite(household.flight.orderedMinute)) return null;
  return Math.max(fate.minute + clockOf(world), household.flight.orderedMinute + ORDER_GRACE_MINUTES);
}
/** Whether this world is one the advance is modelled on: the real land of the colonies, with the columns' places on it. */
export const advanceModelled = world => Boolean(world?.map?.source && world.map.sites?.['san-felipe'] && world.map.sites?.gonzales);

// ------------------------------------------------------------------------------------------------ the foragers

/**
 * Where a column's foragers are at this minute: a party riding out from the column to each farm it is about to burn and back
 * after, and two parties either side of the line while it marches (`FIC-GONZ-460`). Drawn, never stored.
 */
export function foragersOf(world, column, head, t = timelineOf(world)) {
  const parties = [];
  const window = burnWindow(column);
  if (!head || head.retreat || !window || t < window.from || t > window.until + FORAGE_AFTER_HOURS * 60 + 24 * 60) return parties;
  for (const household of Object.values(world.households || {})) {
    const fate = farmFate(world, household);
    if (!fate || fate.columnId !== column.id) continue;
    const at = burnMinute(world, household);
    if (at === null) continue;
    const reached = at - clockOf(world), out = Math.max(60, fate.minute - fate.left), set = reached - out;
    if (t < set || t > reached + out) continue;
    const home = world.map.sites[household.homeSiteId];
    const f = t <= reached ? (t - set) / out : 1 - (t - reached) / out;
    parties.push({ x: round(fate.from.x + (home.x - fate.from.x) * f), y: round(fate.from.y + (home.y - fate.from.y) * f), to: household.homeSiteId, right: t <= reached ? home.x >= fate.from.x : home.x < fate.from.x });
  }
  if (head.moving) {
    const leg = legsOf(world.map, column)[head.leg], a = column.path[head.leg], b = column.path[head.leg + 1];
    const ahead = leg && pointAlong(leg.points, Math.min(leg.length, leg.length * ((t - a.minute) / Math.max(1, b.minute - a.minute)) + 0.5));
    if (ahead) {
      const dx = ahead.x - head.x, dy = ahead.y - head.y, len = Math.hypot(dx, dy) || 1;
      for (const side of [-1, 1]) parties.push({ x: round(head.x - dy / len * side * head.range / 2), y: round(head.y + dx / len * side * head.range / 2), right: head.right });
    }
  }
  return parties;
}

// ------------------------------------------------------------------------------------------------ the fires

const burningPlace = (map, burning) => burning.point || (map.sites[burning.siteId] && { x: map.sites[burning.siteId].x, y: map.sites[burning.siteId].y });
/** The towns on this map that have burned by this minute: the documented burnings, each at its place. */
export function townBurnings(world, t = timelineOf(world)) {
  if (!world?.map?.sites) return [];
  return BURNINGS.filter(burning => t >= burning.minute).map(burning => ({ ...burning, at: burningPlace(world.map, burning) })).filter(one => one.at);
}

/**
 * Smoke standing over the country now: a town burning within `SMOKE_HOURS.town` of its date, a family's farm within
 * `SMOKE_HOURS.farm` of when it was fired. What the page draws (`fires` in the projection); a family is sent only those its
 * people are within `SMOKE_SIGHT_MILES` of.
 */
export function firesNow(world) {
  const t = timelineOf(world), fires = [];
  for (const burning of townBurnings(world, t)) {
    if (t - burning.minute < SMOKE_HOURS.town * 60) fires.push({ id: burning.id, kind: 'town', x: burning.at.x, y: burning.at.y, name: burning.name, hand: burning.hand });
  }
  for (const household of Object.values(world.households || {})) {
    const burned = household.flight?.burned;
    if (!Number.isFinite(burned) || world.minute - burned >= SMOKE_HOURS.farm * 60) continue;
    const home = world.map.sites[household.homeSiteId];
    if (home) fires.push({ id: `farm:${household.id}`, kind: 'farm', x: home.x, y: home.y, hand: household.flight.burnedBy?.hand || 'texian' });
  }
  return fires;
}

const livingEyes = (world, household) => household.members.map(id => world.entities[id]).filter(person => person?.location && !['dead', 'captured'].includes(person.health?.condition)).map(person => person.location);
/** The smoke this page may be shown: the Host all of it; a family what its own people are near enough to see. */
export function firesSeen(world, householdId, role) {
  const fires = firesNow(world);
  if (role === 'host') return fires;
  const household = householdId && world.households?.[householdId];
  if (!household) return [];
  const eyes = livingEyes(world, household);
  return fires.filter(fire => eyes.some(point => Math.hypot(point.x - fire.x, point.y - fire.y) <= SMOKE_SIGHT_MILES)).map(({ hand, ...seen }) => seen);
}

/**
 * Whether word of a thing that happened at this place and minute has reached a point now: the word goes out at
 * `WORD_MILES_A_DAY` in every direction (`FIC-GONZ-463`), so a family forty miles off hears it a day after.
 * ceiling: the word goes as the crow flies and over every river, not along the roads and the ferries; the roads and the
 * express relays of sim/expresses.mjs are the way out, and were not worth their weight for a thing everybody fleeing east
 * was carrying.
 */
export const wordReached = (world, happened, where, minuteHappened) => world.minute - minuteHappened >= Math.hypot(where.x - happened.x, where.y - happened.y) / WORD_MILES_A_DAY * DAY;

export { on, DAY };
