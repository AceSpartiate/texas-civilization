// The weather of 1835-36 itself: sim/weather.mjs, docs/WEATHER.md §10, `HIST-TEX-220` to `-238`, `FIC-GONZ-130` to `-134`.
//
// The model was built on 2026-09-20 and read by the road, the wade at a ford and the drawing, each of which has tests of its
// own. What it did not have was a test of its own behaviour: that the record's own days survive the coin, that cold is shared
// across the map and rain is not, that the shares are the month's and the country's, that a river remembers the rain that
// raised it and that the rise saturates, that the wet spring begins where the record puts it, and that a class replays.
// Each test here was proven by injecting the regression it guards into sim/weather.mjs and watching it fail
// (scripts/weather-model-injections.mjs, 27 of 27 caught; the record is docs/evidence/weather-model-injections.json).
// One of those injections is not a hypothetical: writing this file found that a norther could only carry its rain where it
// began, so no norther ever reached the east wet. Fixed in the model the same day, and the injection is the old behaviour.
//
// The weather reads three things off a world - its seed, its arrival and its minute - so most of this runs on a plain object
// rather than a built class, which is what makes two hundred classes of weather cheap enough to count. The last test runs on
// a real class to prove the wiring through `weatherAt`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FOG_SHARE, NORTHER_SHARE, RAIN_SHARE, REGIONS, REGION_BOUNDS, WATER_AT_OPENING, WATER_FALL, WATER_HIGH, WATER_SHUT,
  WET_SPRING, WRITTEN, fordShut, rainingAt, regionAt, waterAt, weatherAt, weatherOn,
} from '../sim/weather.mjs';
import { dateOf } from '../sim/clock.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

/** A class, for the weather's purposes: its seed and its calendar. Day 0 is 29 September 1835. */
const classOf = seed => ({ seed, minute: 0 });
const DAYS = 210; // A little over the class's own length, opening to San Jacinto and past it.
const dateOn = (world, day) => dateOf(world, day * 1440 + 720);
/** Every day of a class, region by region. */
const runOf = (world, days = DAYS) => Array.from({ length: days }, (_, day) => weatherOn(world, day));
const seeds = (count, prefix = 'w') => Array.from({ length: count }, (_, i) => classOf(`${prefix}-${i}`));
/** The day of a class on which a month and date falls, or -1. `month` is January-first, as sim/weather.mjs writes it. */
const dayOfDate = (world, month, date, days = DAYS) => {
  for (let day = 0; day < days; day++) {
    const at = dateOn(world, day);
    if (at.getUTCMonth() === month && at.getUTCDate() === date) return day;
  }
  return -1;
};

test('the record\'s own days are the days a class meets, in the country the record names', () => {
  // Every written day, checked on three classes whose coins differ: the record decides it and the coin never does.
  for (const world of seeds(3, 'written')) {
    for (const [month, date, regions, kind, claimId] of WRITTEN) {
      const day = dayOfDate(world, month, date);
      if (day < 0) continue; // A written day outside this class's own two hundred.
      const here = weatherOn(world, day).regions;
      const where = regions === 'all' ? REGIONS : [regions];
      for (const region of where) {
        assert.equal(here[region].kind, kind,
          `${date}/${month + 1} in the ${region} was ${here[region].kind}, and the record says ${kind}`);
        assert.equal(here[region].claimId, claimId, `${date}/${month + 1} lost the claim it carries`);
      }
    }
  }
  // The four the class is most likely to meet, named so a failure says which one broke.
  const world = classOf('written-named');
  const kindOn = (month, date, region) => weatherOn(world, dayOfDate(world, month, date)).regions[region].kind;
  // 20-25 November 1835: the norther that held six days, and 28 degrees on the morning of the 23rd. All three countries.
  for (const region of REGIONS) assert.equal(kindOn(10, 23, region), 'norther', `the cold of 23 November missed the ${region}`);
  // 8-17 March 1836: Gray's ten fine warm days, which a wet spring beginning on 1 March would have rained through.
  assert.equal(kindOn(2, 12, 'centre'), 'fair', 'the middle of March was not fine');
  // 25 February 1836, the siege: "a strong north wind commenced at nine at night", and Almonte's sky stayed clear.
  assert.equal(kindOn(1, 26, 'west'), 'norther', 'the siege was not cold');
  assert.notEqual(kindOn(1, 26, 'west'), 'rain', 'the siege was drawn wet, and Almonte wrote "day clear"');
  // 21 April 1836, San Jacinto: fair, and marked in the model as the inference it is.
  assert.equal(kindOn(3, 21, 'centre'), 'fair', 'San Jacinto was not fair');
});

test('cold is shared across the map and rain is not', () => {
  // The whole point of three countries (docs/WEATHER.md §10.2): on 26 February 1836 it was 39 degrees at Bexar and 35 at San
  // Felipe on the same morning, while Bexar's sky stayed "day clear" on the nights San Patricio's rain fell.
  let northers = 0, rainDiffers = 0, rainDays = 0;
  for (const world of seeds(20, 'shared')) {
    const run = runOf(world);
    for (let day = 1; day < run.length; day++) {
      const regions = run[day].regions, written = REGIONS.some(region => regions[region].claimId);
      if (written) continue; // A written day is the record's, not the coin's.
      if (regions.west.kind === 'norther') {
        northers++;
        // The cold that is in the west is in the centre the same day, and in the east that day or the next.
        assert.equal(regions.centre.kind, 'norther', `a norther held the west and not the centre on day ${day}`);
        // Unless the record writes the east's own day, in which case the record has it and the cold does not (19 March 1836
        // is a fog in the east on a day a norther was crossing).
        const next = run[day + 1]?.regions.east;
        assert.ok(regions.east.kind === 'norther' || !next || next.kind === 'norther' || next.claimId,
          `a norther reached the west and never the east, day ${day}`);
      }
      const wet = region => ['rain', 'storm'].includes(regions[region].kind);
      if (wet('west') || wet('east')) { rainDays++; if (wet('west') !== wet('east')) rainDiffers++; }
    }
  }
  assert.ok(northers > 100, `only ${northers} norther days in twenty classes`);
  assert.ok(rainDays > 400, `only ${rainDays} wet days in twenty classes`);
  // One coin for the whole map would make this zero. The two countries are 400 miles apart; they should differ oftener than
  // they agree.
  assert.ok(rainDiffers / rainDays > 0.5,
    `the west and the east rained together on ${Math.round((1 - rainDiffers / rainDays) * 100)}% of wet days`);
});

test('how often it rains is the month\'s share and the country\'s', () => {
  // January: the one month the class lives through that the record writes nothing into, so every day of it is the share's.
  // On a day no norther holds, the chance of rain is exactly `RAIN_SHARE[region][month]`, so the count can be checked
  // against it rather than against itself.
  const counted = Object.fromEntries(REGIONS.map(region => [region, { days: 0, wet: 0 }]));
  for (const world of seeds(60, 'share')) {
    for (const day of runOf(world)) {
      if (dateOn(world, day.day).getUTCMonth() !== 0) continue;
      for (const region of REGIONS) {
        const here = day.regions[region];
        if (here.kind === 'norther' || here.claimId) continue;
        counted[region].days++;
        if (['rain', 'storm'].includes(here.kind)) counted[region].wet++;
      }
    }
  }
  for (const region of REGIONS) {
    const { days, wet } = counted[region], want = RAIN_SHARE[region][0];
    assert.ok(days > 1000, `only ${days} January days in the ${region}`);
    assert.ok(Math.abs(wet / days - want) < 0.04,
      `the ${region} rained on ${(wet / days).toFixed(3)} of its January days, and its share is ${want}`);
  }
  // And the east is wetter than the west, which is the whole of why there are three tables (Fort Jesup against Bexar).
  assert.ok(counted.east.wet / counted.east.days > counted.west.wet / counted.west.days + 0.08,
    'the east was not wetter than the west');
});

test('a river remembers the rain that raised it, and falls back over days', () => {
  let fell = 0, upUnderAFineSky = 0;
  for (const world of seeds(12, 'water')) {
    const run = runOf(world);
    for (let day = 1; day < run.length; day++) {
      const was = run[day - 1].regions.centre, now = run[day].regions.centre;
      const dry = !['rain', 'storm'].includes(now.kind) && !(now.kind === 'norther' && now.wet);
      if (dry && was.water > WATER_FALL) {
        fell++;
        assert.equal(now.water, Math.round((was.water - WATER_FALL) * 1000) / 1000,
          `a dry day took the river from ${was.water} to ${now.water}, and the fall is ${WATER_FALL}`);
      }
      // What the correction in `HIST-TEX-231` is for: Delgado's artillery bogged "at every turn of the wheel" on a night
      // with no rain falling, across a prairie wet from earlier. A river up under a fine sky must be possible.
      if (now.kind === 'fair' && now.water >= WATER_HIGH) upUnderAFineSky++;
      assert.ok(now.water >= 0 && now.water <= 1, `the river stood at ${now.water}`);
    }
  }
  assert.ok(fell > 500, `only ${fell} days of falling water in twelve classes`);
  assert.ok(upUnderAFineSky > 50, `the rivers were only up under a fine sky on ${upUnderAFineSky} days of twelve classes`);
});

test('the rise saturates, so a flood wants days of rain and a ford is shut a few days a class', () => {
  // The first build added the rise straight on and shut a ford on 62 days of 210, which no diarist describes. The rise is on
  // the room left in the river instead. Measured over 200 classes (2026-09-20): a class has some country's river over its
  // crossings on a **median of 3 days of 210**, 19% of classes on none at all, and the worst of the 200 on 16. Country by
  // country it is rarer still - a day in 110 in the centre, a day in 550 in the west - which is the shape the record has:
  // the Medina unfordable on 21 February, Mill Creek too high for three days, and otherwise rivers that are merely up.
  const shut = [];
  for (const world of seeds(12, 'flood')) {
    const run = runOf(world);
    let days = 0, rises = [];
    for (let day = 1; day < run.length; day++) {
      if (REGIONS.some(region => run[day].regions[region].water >= WATER_SHUT)) days++;
      const was = run[day - 1].regions.centre, now = run[day].regions.centre;
      if (now.water > was.water) rises.push({ from: was.water, by: now.water - was.water });
    }
    shut.push(days);
    // The same rain on a fuller river raises it less: no rise from a high river is as large as the largest from a low one.
    const low = rises.filter(rise => rise.from < 0.2), high = rises.filter(rise => rise.from > 0.7);
    if (low.length && high.length) {
      assert.ok(Math.max(...high.map(rise => rise.by)) < Math.max(...low.map(rise => rise.by)),
        'a full river rose as far in a day as an empty one');
    }
  }
  const worst = Math.max(...shut), all = shut.reduce((sum, days) => sum + days, 0);
  assert.ok(worst <= 20, `a class had its rivers over the crossings on ${worst} days of ${DAYS}`);
  assert.ok(all / shut.length < 8, `twelve classes averaged ${(all / shut.length).toFixed(1)} shut days of ${DAYS}`);
  assert.ok(shut.some(days => days > 0), 'no class in twelve ever had a river over its crossing');
});

test('the wet spring begins on 21 March, and the middle of March stays fine', () => {
  // `HIST-TEX-068` read closely (and the citation corrected from `-071`): the spring of 1836 was unusually wet, but it began
  // about 21-23 March. Gray has ten fine warm days from the 8th to the 17th. The west is used because the record writes
  // nothing into it in either stretch, so both counts are the share's own.
  const count = (world, from, to) => {
    let days = 0, wet = 0;
    for (const day of runOf(world)) {
      const at = dateOn(world, day.day), key = (at.getUTCMonth() + 1) * 100 + at.getUTCDate();
      if (key < from || key > to) continue;
      const here = day.regions.west;
      if (here.kind === 'norther' || here.claimId) continue;
      days++;
      if (['rain', 'storm'].includes(here.kind)) wet++;
    }
    return { days, wet };
  };
  let before = { days: 0, wet: 0 }, after = { days: 0, wet: 0 };
  for (const world of seeds(60, 'spring')) {
    const early = count(world, 301, 317), late = count(world, 321, 414);
    before = { days: before.days + early.days, wet: before.wet + early.wet };
    after = { days: after.days + late.days, wet: after.wet + late.wet };
  }
  assert.ok(before.days > 600 && after.days > 1000, `${before.days} and ${after.days} days counted`);
  const dry = before.wet / before.days, soaked = after.wet / after.days;
  assert.ok(Math.abs(dry - RAIN_SHARE.west[2]) < 0.05,
    `the first half of March rained on ${dry.toFixed(3)} of its days, and the ordinary share is ${RAIN_SHARE.west[2]}`);
  assert.ok(soaked > dry * 1.15,
    `the wet spring rained on ${soaked.toFixed(3)} of its days against ${dry.toFixed(3)} before it, which is no spring at all`);
  assert.ok(soaked < RAIN_SHARE.west[2] * WET_SPRING.times + 0.05, `the wet spring rained on ${soaked.toFixed(3)} of its days`);
});

test('a class replays its own weather, two classes differ, and neither runs in streaks', () => {
  const kinds = world => runOf(world).map(day => REGIONS.map(region => `${day.regions[region].kind}${day.regions[region].water}`).join());
  assert.deepEqual(kinds(classOf('replay')), kinds(classOf('replay')), 'the same class did not get the same weather twice');
  assert.notDeepEqual(kinds(classOf('replay')), kinds(classOf('replay-other')), 'two classes got the same weather');

  // FNV-1a over keys differing by one digit runs in streaks - one class had twenty rainy days together and another none in
  // its first twenty (found 2026-09-19) - which is why the day is mixed before it is hashed. A class should have many short
  // runs of rain, not one long one.
  for (const world of seeds(20, 'streak')) {
    const wet = runOf(world).map(day => ['rain', 'storm'].includes(day.regions.centre.kind));
    let runs = 0, longest = 0, run = 0;
    for (const day of wet) { if (day) { run++; longest = Math.max(longest, run); if (run === 1) runs++; } else run = 0; }
    assert.ok(longest < 12, `one class rained ${longest} days together`);
    assert.ok(runs > 15, `one class had its rain in ${runs} spells over ${DAYS} days`);
  }
});

test('where a place stands decides whose weather it gets, and a class reads it through the map', () => {
  assert.equal(regionAt({ x: REGION_BOUNDS.westOf - 1, y: 0 }), 'west');
  assert.equal(regionAt({ x: REGION_BOUNDS.westOf, y: 0 }), 'centre');
  assert.equal(regionAt({ x: REGION_BOUNDS.eastOf, y: 0 }), 'centre');
  assert.equal(regionAt({ x: REGION_BOUNDS.eastOf + 1, y: 0 }), 'east');

  // On a real class: Bexar is the west, San Felipe the centre, Nacogdoches the east, and each reads its own country's day.
  const world = createGonzalesWorld('weather-map', 5, { map: 'colonies' });
  const sites = world.map.sites;
  for (const [id, region] of [['bexar', 'west'], ['san-felipe', 'centre'], ['nacogdoches', 'east']]) {
    const site = sites[id];
    assert.ok(site, `${id} is not on the map`);
    assert.equal(regionAt(site), region, `${id} is not in the ${region}`);
    // Every day of the class, not a handful: a norther that brought its rain with it happens a few times in two hundred
    // days, and the clause in `rainingAt` that knows it is only exercised on those days.
    let wetNorthers = 0;
    for (let day = 0; day < DAYS; day++) {
      const here = weatherOn(world, day).regions[region];
      assert.equal(weatherAt(world, site, day), here, `${id} read the wrong country on day ${day}`);
      assert.equal(waterAt(world, site, day), here.water);
      assert.equal(fordShut(world, site, day), here.water >= WATER_SHUT);
      if (here.kind === 'norther' && here.wet) wetNorthers++;
      assert.equal(rainingAt(world, site, day), here.kind === 'rain' || here.kind === 'storm' || (here.kind === 'norther' && here.wet),
        `${id} was drawn ${rainingAt(world, site, day) ? 'wet' : 'dry'} on a ${here.kind}${here.wet ? ' that brought its rain' : ''} day`);
    }
    assert.ok(wetNorthers > 0, `no norther brought its rain to ${id} in ${DAYS} days, so nothing tested the day of 20 November`);
  }
  // The class opens on the water the record gives it: the Guadalupe up on 29 September 1835, which is why Castañeda was
  // still on the far bank of it (`HIST-TEX-225`).
  for (const region of REGIONS) assert.equal(weatherOn(world, 0).regions[region].water, WATER_AT_OPENING[region]);
  assert.ok(WATER_AT_OPENING.west > WATER_HIGH, 'the Guadalupe was not up on the day the class opens');
});

test('a fog is the morning after a wet day, and a norther is not rolled out of season', () => {
  // A whole year, not the class's own two hundred days: a class opening on 29 September never reaches May, so a seasonal
  // rule checked over `DAYS` alone would be checking nothing at all, which is what the first draft of this test did.
  const YEAR = 365;
  let fogs = 0, summerNorthers = 0, summerDays = 0, winterNorthers = 0, winterDays = 0;
  for (const world of seeds(16, 'fog')) {
    const run = runOf(world, YEAR);
    for (let day = 1; day < run.length; day++) {
      for (const region of REGIONS) {
        const was = run[day - 1].regions[region], now = run[day].regions[region];
        if (now.kind === 'fog' && !now.claimId) {
          fogs++;
          assert.ok(['rain', 'storm'].includes(was.kind), `a fog rose on the morning after a ${was.kind} day`);
        }
        if (now.claimId) continue;
        const month = dateOn(world, day).getUTCMonth();
        const summer = month >= 4 && month <= 8;
        if (summer) { summerDays++; if (now.kind === 'norther') summerNorthers++; }
        else { winterDays++; if (now.kind === 'norther') winterNorthers++; }
      }
    }
  }
  assert.ok(fogs > 30, `only ${fogs} fogs in sixteen classes`);
  assert.ok(winterNorthers > 200, `only ${winterNorthers} cold-season norther days in sixteen classes`);
  assert.ok(summerDays > 3000 && winterDays > 3000, `${summerDays} summer and ${winterDays} winter days counted`);
  // A class left running reaches the summer; the share there is one day in a hundred, not one in ten
  // (`HIST-TEX-235`: cold fronts cross the northern Gulf from autumn through spring, and not in July).
  const summerShare = summerNorthers / summerDays, winterShare = winterNorthers / winterDays;
  assert.ok(summerShare * 5 < winterShare,
    `northers held ${(summerShare * 100).toFixed(1)}% of summer days against ${(winterShare * 100).toFixed(1)}% of the cold ones`);
  assert.ok(NORTHER_SHARE[6] < NORTHER_SHARE[0] / 5 && FOG_SHARE > 0, 'the tables themselves were changed');
});
