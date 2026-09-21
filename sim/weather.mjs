// The weather of 1835-36: docs/WEATHER.md, and `HIST-TEX-220` to `-238`, `FIC-GONZ-130` to `-136`.
//
// What a class meets on a given day, in the country it is standing in. Until 2026-09-20 the game tossed one coin a day for
// the whole map - rain or fair - and read it in two places, the wagon bogging on the road east and the wade at a ford. The
// record does not support one coin: **a norther crosses the whole country in a day and rain does not** (docs/WEATHER.md
// §10.2 - on 26 February 1836 it is 39 degrees at Bexar and 35 at San Felipe on the same morning, while Bexar's sky stays
// "day clear" on the nights San Patricio's rain falls). So the country is three regions, a day has a kind, and the rivers
// carry a `water` level that remembers the last few days rather than today's toss.
//
// Everything here is hashed from the class's seed and the day, never drawn from a random stream: a class replays the same
// weather, and a student who saves and reloads gets the day they had. Nothing is stored in the world, so no save version
// moves and a class saved before this opens on the weather its seed always implied.
import { dateOf } from './clock.mjs';
import { share } from './shares.mjs';

/** The three countries the weather is told in (docs/WEATHER.md §10.2). */
export const REGIONS = Object.freeze(['west', 'centre', 'east']);
/**
 * Where one region ends and the next begins, in miles east of the confluence. The west holds Bexar, Gonzales, Goliad, Mina,
 * Refugio and Victoria (x from -62 to 28); the centre Washington, San Felipe, Matagorda, Columbia, Brazoria, Velasco,
 * Harrisburg and Lynchburg (79 to 144); the east Liberty, Anahuac and Nacogdoches (161 to 170). The lines are drawn halfway
 * through the two gaps, which are wide: nothing a class does happens within twenty miles of either.
 */
export const REGION_BOUNDS = Object.freeze({ westOf: 55, eastOf: 152 });
/** Which country a place stands in. */
export const regionAt = point => (point.x < REGION_BOUNDS.westOf ? 'west' : point.x > REGION_BOUNDS.eastOf ? 'east' : 'centre');

/**
 * The share of days it rains, by month (January first) and region (`FIC-GONZ-132`, docs/WEATHER.md §8.2 and §8.8).
 *
 * Anchored on what was actually counted: the U.S. Army post surgeons at Fort Jesup, just across the Sabine, wrote down the
 * rain days of every month the class runs in - September 1835 to April 1836: 4, 7, **17**, 6, 13, 11, 11, 11 (`HIST-TEX-236`).
 * That is the east. The centre and the west are those counts scaled by how the three countries stand to each other in the
 * modern normals (NOAA 1991-2020: Houston against Nacogdoches, San Antonio and Gonzales and Victoria against Nacogdoches),
 * because no instrument was kept in the colonies themselves.
 *
 * ceiling: eight months of one station's counts, shaped by modern normals. November's .57 in the east is not climate - it is
 * the November the record has, the one Austin called "the most inclement, wet, and cold spell of weather known in this
 * country for many years" - and it is kept because the class lives through that November, not an average one.
 */
export const RAIN_SHARE = Object.freeze({
  //            Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
  west: Object.freeze([0.28, 0.28, 0.30, 0.29, 0.25, 0.25, 0.25, 0.25, 0.12, 0.22, 0.40, 0.13]),
  centre: Object.freeze([0.41, 0.34, 0.32, 0.33, 0.28, 0.28, 0.28, 0.28, 0.15, 0.26, 0.47, 0.17]),
  east: Object.freeze([0.42, 0.38, 0.35, 0.37, 0.30, 0.30, 0.30, 0.30, 0.13, 0.23, 0.57, 0.19]),
});
/**
 * The wet spring (`HIST-TEX-068`, `FIC-GONZ-132`): rain above the ordinary share, and the rivers up with it. **It begins
 * about 21-23 March, not 1 March** - William Fairfax Gray, in the middle of the colonies, has ten fine warm days from the
 * 8th to the 17th, and the turn comes with the drizzle of the 18th and the equinoctial storm of the 23rd (`HIST-TEX-237`).
 * The multiplier is the game's own; it stands in for a spring the record calls unusual, and it is named here rather than
 * hidden inside a rain share, which is what `FIC-GONZ-049`'s one-day-in-two did.
 */
export const WET_SPRING = Object.freeze({ from: { month: 2, day: 21 }, to: { month: 3, day: 14 }, times: 1.35 });
/**
 * A norther begins at this share of days, by month (`FIC-GONZ-132`). Cold fronts cross the northern Gulf every three to
 * seven days from autumn through spring (Allahdadi, Li and Chaichitehrani 2023, `HIST-TEX-235`); the diaries of this winter
 * give one every six to eleven days in the stretches they cover (§4.2). One in ten days through the cold months sits inside
 * both, and Maverick's own November - northers about the 30th of October, the 5th and the 20th - is exactly that.
 */
export const NORTHER_SHARE = Object.freeze([0.10, 0.10, 0.06, 0.03, 0.01, 0.01, 0.01, 0.01, 0.01, 0.06, 0.10, 0.10]);
/** How long a norther holds: two to four days (`HIST-TEX-221`, "generally lasts for two or three days"). */
export const NORTHER_DAYS = Object.freeze([2, 3, 4]);
/** A rain day in March or April is a storm at this share; in the other months the game has none (`FIC-GONZ-132`). */
export const STORM_SHARE = 0.2;
/** A still, damp morning after a wet day is a fog at this share (`HIST-TEX-224`: six dated mornings). */
export const FOG_SHARE = 0.25;
/** What a day of each kind does to the rivers, and what a day without rain takes back off them (`FIC-GONZ-133`). */
export const WATER_RISE = Object.freeze({ rain: 0.25, storm: 0.45, norther: 0, fair: 0, fog: 0 });
export const WATER_FALL = 0.18;
/** Over this, a river's ford is not to be crossed at all; under the lower line the wade is the ordinary one. */
export const WATER_HIGH = 0.3, WATER_SHUT = 0.85;
/**
 * The water the class opens on (`HIST-TEX-225`): the Guadalupe was up on 29 September 1835, which is why Castaneda was
 * still on the far bank of it. Not a starting condition invented for drama - the river is why there was time for anything.
 */
export const WATER_AT_OPENING = Object.freeze({ west: 0.55, centre: 0.3, east: 0.3 });

/**
 * The days the record gives, which the coin never decides (docs/WEATHER.md §10.3). `[month, day, regions, kind, claim]`,
 * month January-first; `regions` is `all` or one of the three. A run of days is one row an end.
 *
 * ceiling: about two dozen days of two hundred. The rest is the shares above, and a class is told which is which only by
 * the claim the day carries.
 */
export const WRITTEN = Object.freeze([
  [9, 1, 'west', 'fog', 'HIST-TEX-224'], [9, 2, 'west', 'fog', 'HIST-TEX-224'],
  [9, 28, 'west', 'fog', 'HIST-TEX-020'],
  [9, 30, 'all', 'norther', 'HIST-TEX-221'],
  [10, 4, 'centre', 'storm', 'HIST-TEX-222'],
  [10, 5, 'all', 'norther', 'HIST-TEX-221'],
  [10, 6, 'west', 'fog', 'HIST-TEX-221'],
  [10, 18, 'centre', 'rain', 'HIST-TEX-222'], [10, 19, 'centre', 'rain', 'HIST-TEX-222'],
  // The hard one: rain on the 20th and 21st, and 28 degrees on the morning of the 23rd, the coldest figure in the record.
  [10, 20, 'all', 'norther', 'HIST-TEX-221'], [10, 21, 'all', 'norther', 'HIST-TEX-221'],
  [10, 22, 'all', 'norther', 'HIST-TEX-221'], [10, 23, 'all', 'norther', 'HIST-TEX-221'],
  [10, 24, 'all', 'norther', 'HIST-TEX-221'], [10, 25, 'all', 'norther', 'HIST-TEX-221'],
  [11, 5, 'west', 'norther', 'HIST-TEX-223'],
  [11, 7, 'west', 'rain', 'HIST-TEX-223'], [11, 8, 'west', 'rain', 'HIST-TEX-223'],
  [11, 10, 'west', 'fog', 'HIST-TEX-223'],
  [1, 10, 'centre', 'storm', 'HIST-TEX-237'],
  [1, 16, 'centre', 'rain', 'HIST-TEX-237'], [1, 17, 'centre', 'rain', 'HIST-TEX-237'],
  [1, 18, 'centre', 'fog', 'HIST-TEX-237'],
  // The day the whole country is wet at once: a heavy storm of rain in the night at Washington, and sudden rains making the
  // Medina unfordable at Bexar, 150 miles apart.
  [1, 21, 'all', 'rain', 'HIST-TEX-237'],
  [1, 25, 'all', 'norther', 'HIST-TEX-227'], [1, 26, 'all', 'norther', 'HIST-TEX-227'],
  [1, 27, 'all', 'norther', 'HIST-TEX-227'], [1, 28, 'all', 'norther', 'HIST-TEX-227'],
  [1, 29, 'all', 'norther', 'HIST-TEX-228'], [2, 1, 'all', 'norther', 'HIST-TEX-228'],
  [2, 2, 'all', 'norther', 'HIST-TEX-228'], [2, 3, 'all', 'norther', 'HIST-TEX-228'],
  // Ten fine warm days in the middle of the colonies, which is what the wet spring beginning on 1 March denied.
  ...Array.from({ length: 10 }, (_, i) => [2, 8 + i, 'centre', 'fair', 'HIST-TEX-237']),
  [2, 18, 'centre', 'rain', 'HIST-TEX-237'],
  [2, 19, 'west', 'fog', 'HIST-TEX-063'],
  [2, 23, 'centre', 'storm', 'HIST-TEX-237'], [2, 24, 'centre', 'storm', 'HIST-TEX-237'],
  [2, 28, 'centre', 'rain', 'HIST-TEX-237'],
  [3, 10, 'centre', 'norther', 'HIST-TEX-237'], [3, 11, 'centre', 'norther', 'HIST-TEX-237'],
  [3, 17, 'centre', 'storm', 'HIST-TEX-231'],
  [3, 19, 'east', 'fog', 'HIST-TEX-237'],
  // San Jacinto. Inference, and marked as such: no source read says what the sky did that afternoon (`FIC-GONZ-134`).
  [3, 21, 'centre', 'fair', 'FIC-GONZ-134'],
  [3, 22, 'centre', 'rain', 'HIST-TEX-231'], [3, 23, 'centre', 'rain', 'HIST-TEX-231'],
  [3, 24, 'centre', 'rain', 'HIST-TEX-231'], [3, 25, 'centre', 'rain', 'HIST-TEX-231'],
]);

const DAY = 1440;
/** The day of the class's calendar a minute falls in, counted from the world's own opening. */
export const dayOf = minute => Math.floor(minute / DAY);
const monthDayOf = (world, day) => { const at = dateOf(world, day * DAY + 12 * 60); return { month: at.getUTCMonth(), day: at.getUTCDate() }; };
const inWetSpring = ({ month, day }) => {
  const { from, to } = WET_SPRING;
  if (month < from.month || month > to.month) return false;
  if (month === from.month && day < from.day) return false;
  if (month === to.month && day > to.day) return false;
  return true;
};
/**
 * A share in [0, 1) for this class, this question and this day, with the day mixed before it is hashed. `share` is FNV-1a,
 * which over keys differing by one digit runs in streaks - one class had twenty rainy days together and another none in its
 * first twenty (found 2026-09-19) - and mixing the day is what stops it.
 */
const dayShare = (world, question, day) => share(world, 'weather', `${question}:${Math.imul(day + 1, 2654435761) >>> 0}`);

/** The written-in weather for a day, by region, or null where the record says nothing. */
function writtenOn(world, day) {
  const { month, day: date } = monthDayOf(world, day);
  const found = {};
  for (const [m, d, regions, kind, claimId] of WRITTEN) {
    if (m !== month || d !== date) continue;
    for (const region of regions === 'all' ? REGIONS : [regions]) found[region] = { kind, claimId };
  }
  return Object.keys(found).length ? found : null;
}

/**
 * Whether a norther is holding on this day, and where. A norther is rolled once for the whole class, holds the west and the
 * centre from the day it begins and the east from the day after, and runs two to four days: the cold crosses the country
 * (docs/WEATHER.md §10.2) and reaches the far side of it a little later and a little weaker.
 */
function northerOn(world, day) {
  const holding = {};
  for (let began = day - 5; began <= day; began++) {
    if (began < 0) continue;
    const { month } = monthDayOf(world, began);
    if (dayShare(world, 'norther', began) >= NORTHER_SHARE[month]) continue;
    const days = NORTHER_DAYS[Math.floor(dayShare(world, 'norther-days', began) * NORTHER_DAYS.length)];
    for (const region of REGIONS) {
      // `arrived` is the day the cold reached this country, which in the east is the day after it began: the rain a norther
      // carries comes with the front, so it is the day it arrives here - not the day it set out - that can be wet.
      const arrived = region === 'east' ? began + 1 : began;
      if (day >= arrived && day < arrived + days) holding[region] = { began, arrived, force: region === 'east' ? 0.7 : 1 };
    }
  }
  return holding;
}

/** One region's kind of day, before the water is worked out. */
function kindOn(world, day, region, written, norther, yesterday) {
  if (written?.[region]) return { kind: written[region].kind, claimId: written[region].claimId };
  if (norther[region]) return { kind: 'norther', arrived: norther[region].arrived, force: norther[region].force };
  const { month } = monthDayOf(world, day);
  const wet = inWetSpring(monthDayOf(world, day)) ? WET_SPRING.times : 1;
  if (dayShare(world, `rain:${region}`, day) < RAIN_SHARE[region][month] * wet) {
    const storms = month === 2 || month === 3;
    return { kind: storms && dayShare(world, `storm:${region}`, day) < STORM_SHARE ? 'storm' : 'rain' };
  }
  // A fog is the morning after a wet day, still and damp: Maverick's Bexar fog of 6 November is "arising by evaporation
  // from the river".
  if (['rain', 'storm'].includes(yesterday) && dayShare(world, `fog:${region}`, day) < FOG_SHARE) return { kind: 'fog' };
  return { kind: 'fair' };
}

const byWorld = new WeakMap();
/**
 * The weather of a day, region by region: its kind, how high the rivers are running, and the wind. Worked out from the
 * opening of the class forward, because the water remembers the days before it, and kept so a tick costs nothing.
 */
export function weatherOn(world, day = dayOf(world.minute)) {
  if (!byWorld.has(world)) byWorld.set(world, []);
  const days = byWorld.get(world);
  for (let d = days.length; d <= day; d++) {
    const written = writtenOn(world, d), norther = northerOn(world, d), before = days[d - 1];
    const regions = {};
    for (const region of REGIONS) {
      const was = before?.regions[region];
      const { kind, claimId, arrived, force } = kindOn(world, d, region, written, norther, was?.kind);
      // The day a norther reaches a country it may carry its rain with it, as the norther of 20 November did
      // (`FIC-GONZ-132`). In the east that is the day after it began, which is the day the front gets there.
      const wet = kind === 'norther' && arrived === d && dayShare(world, `norther-rain:${region}`, d) < 0.35;
      const rise = WATER_RISE[wet ? 'rain' : kind] ?? 0;
      // A river already up rises less for the same rain: the rise is on the room left in it, so a flood wants days of rain
      // rather than one. The fall is plain, and about three fair days take a river off a wet one.
      const water = was === undefined ? WATER_AT_OPENING[region]
        : Math.max(0, Math.min(1, Math.round((was.water + (rise ? rise * (1 - was.water) : -WATER_FALL)) * 1000) / 1000));
      const since = was && was.kind === kind ? was.since : d * DAY;
      regions[region] = {
        kind, water, since, wet,
        // Where the wind comes from, in radians clockwise from north: a norther is hard out of the north, a storm strong
        // from wherever it is blowing, and an ordinary day has whatever light air the class never notices.
        wind: {
          from: kind === 'norther' ? 0 : Math.round(dayShare(world, `wind:${region}`, d) * 628) / 100,
          force: kind === 'norther' ? (force ?? 1) : kind === 'storm' ? 0.7 : kind === 'rain' ? 0.3 : 0.15,
        },
        ...(claimId && { claimId }),
      };
    }
    days[d] = { day: d, bounds: REGION_BOUNDS, regions };
  }
  return days[day];
}

/** The weather where this point stands, today or on a day given. */
export const weatherAt = (world, point, day = dayOf(world.minute)) => weatherOn(world, day).regions[regionAt(point)];
/**
 * Whether rain is falling on a day of this kind: a rain day, a storm, or a norther that brought its rain with it. Taken
 * off a day's own record so the rule can be asked of a day nobody is standing in - which is how it is tested.
 */
export const rainingOn = here => Boolean(here) && (here.kind === 'rain' || here.kind === 'storm' || (here.kind === 'norther' && Boolean(here.wet)));
/** Whether rain is falling where this point stands: a rain day, a storm, or a norther that brought its rain with it. */
export const rainingAt = (world, point, day = dayOf(world.minute)) => rainingOn(weatherAt(world, point, day));

/**
 * The work a wet sky holds up, and the reason in the family's own words (`FIC-GONZ-290`, docs/WEATHER.md §10.5).
 *
 * Two pieces of house work want the sky off them and the rest do not. **Mud laid up wet washes out of the wall before it
 * sets** - the chinking "stopped and plastered" between the logs of a Texas log house (`HIST-GONZ-025`), the cat-and-clay
 * of a stick-and-mud chimney (`HIST-GONZ-029`), the daub of a jacal's woven wall (`HIST-GONZ-026`). And **a roof goes on
 * wet** - riven clapboards weighted with poles (`HIST-GONZ-030`), or thatch, laid over rafters in the rain.
 *
 * Everything else a family does to a house is as good wet as dry, and the model already says so: felling is unaffected
 * (§10.5). Sills, courses, framing, a puncheon floor, a loft under a roof already on, a stone chimney - none of them is
 * held. `ceiling:` the daub already laid never washes out on the next wet day; only the laying of it waits. `ceiling:` a
 * dry norther does not hold the roof, though a hard north wind at a gable would; §10.5's "nothing needing still hands" is
 * a row of its own and is not built.
 */
export const RAIN_HOLDS = Object.freeze({
  daub: 'the mud would wash out of it before it set',
  roof: 'the roof would go on wet',
});
/** The kinds of work `RAIN_HOLDS` knows, for anything that wants to check a tag is one of them. */
export const WET_WORK = Object.freeze(Object.keys(RAIN_HOLDS));
/**
 * Why a wet sky holds up work of this kind today, or null. `here` is a day's weather in one country (`weatherAt`), and
 * `work` is what the hands are at - `daub`, `roof`, or anything else at all, which the rain does not stop.
 *
 * This is the whole rule, in one function, on purpose: the cold work went from 4 of 12 injections caught to 11 of 12 by
 * naming its rule and testing that rather than testing whether somebody happened to fall ill (docs/WEATHER.md §10.5).
 */
export const rainHold = (here, work) => (work && RAIN_HOLDS[work] && rainingOn(here) ? RAIN_HOLDS[work] : null);
/** How high the rivers are running where this point stands, 0 to 1. */
export const waterAt = (world, point, day = dayOf(world.minute)) => weatherAt(world, point, day).water;
/** Whether a river's ford is over: the water is up past `WATER_SHUT` and nobody is crossing today. */
export const fordShut = (world, point, day = dayOf(world.minute)) => waterAt(world, point, day) >= WATER_SHUT;
