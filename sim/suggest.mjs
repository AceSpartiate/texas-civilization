// Suggested places: a few good spots on the family's own land, offered as buttons, for the house site, a survey, and the plot to
// clear or fence (triage 2.13, classroom audit S8, 2026-09-29).
//
// Choosing a place was a tap on the map and nothing else, so a student who can use only the keyboard could not farm at all, and
// a student on a touch screen or a weak reader had to hunt the map for somewhere the server would accept. The server now offers
// up to three places for each of those choices, found the same way a tap is judged (`siteFactsFor`, `plotFacts`), each with a
// short label a child can read and the full words the tap would have shown. Pressing one does exactly what a tap there does: the
// page looks at the place (`/api/site`, `/api/plot`) and the student still sends it with the panel's own button. Nothing here
// changes the world; the server still decides every order when it is sent.
//
// ceiling: a site is judged at a seven-by-seven grid of spots on the holding and the best three spread apart are offered; a
// survey at a grid half a plot's width apart, at most `SURVEY_LOOKS` of them, nearest the house first. A student who wants a spot the
// grid missed taps it, or moves the map and presses Enter. Finer grids cost the server's one thread for every student asking.
import { holdingOf } from './grants.mjs';
import { siteFacts, SITE_MARGIN } from './ground.mjs';
import { chooseRefusal, siteFactsFor } from './homesite.mjs';
import { PLOT_SIDE, plotFacts, plotsOf, whereFromHouse } from './survey.mjs';
import { woodsRule } from './woods.mjs';

/** How many places are offered at once. */
export const SUGGESTED = 3;
/** Spots on a side of the grid a house site is judged at. */
const SITE_GRID = 7;
/** The most spots a survey suggestion looks at, nearest the house first. */
const SURVEY_LOOKS = 120;
/** How far out from the house a survey is suggested, in miles: a league's far corner is a day's walk there and back. */
const SURVEY_REACH = 1.25;

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const round = value => { const fixed = +value.toFixed(3); return fixed === 0 ? 0 : fixed; };
/** Which way a place lies from another, in one word, north up (y runs south on the map). */
const wayFrom = (from, to) => COMPASS[Math.round(((Math.atan2(to.x - from.x, -(to.y - from.y)) * 180 / Math.PI + 360) % 360) / 45) % 8];
const far = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** The best of `ranked` (best first) that stand at least `apart` from each other, up to SUGGESTED of them. */
function spread(ranked, apart) {
  const chosen = [];
  for (const one of ranked) {
    if (chosen.length >= SUGGESTED) break;
    if (chosen.every(other => far(other, one) >= apart)) chosen.push(one);
  }
  return chosen;
}

/**
 * Where the house might stand: spots on the holding the family can build on, water that runs all year close by first, then out
 * of the river bottom, then open ground, then timber near, then nearest the wagon. Each is checked in full, lane and all, before
 * it is offered, so a suggestion is never refused when it is looked at.
 */
function siteSuggestions(world, household) {
  if (chooseRefusal(world, household)) return [];
  const bounds = holdingOf(world, household).bounds, rule = woodsRule(world);
  const mark = world.map.sites[household.homeSiteId];
  const inset = SITE_MARGIN * 2;
  const spots = [];
  for (let i = 0; i < SITE_GRID; i++) for (let j = 0; j < SITE_GRID; j++) {
    const point = {
      x: round(bounds.minX + inset + (bounds.maxX - bounds.minX - inset * 2) * (i + 0.5) / SITE_GRID),
      y: round(bounds.minY + inset + (bounds.maxY - bounds.minY - inset * 2) * (j + 0.5) / SITE_GRID),
    };
    const facts = siteFacts(point, bounds, rule);
    if (!facts.can) continue;
    const score = (facts.needsWell ? 100 : 0) + (facts.bottom ? 50 : 0) + (facts.ground === 'open' ? 0 : facts.ground === 'brush' ? 10 : 15)
      + Math.min(10, (facts.timberMiles ?? 10) * 4) + far(point, mark);
    spots.push({ ...point, facts, score });
  }
  spots.sort((a, b) => a.score - b.score || a.x - b.x || a.y - b.y);
  const apart = Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) / 4;
  const offered = [];
  // Checked in full, best first, until three pass or the spots run out.
  for (const spot of spots) {
    if (offered.length >= SUGGESTED) break;
    if (!offered.every(other => far(other, spot) >= apart)) continue;
    const facts = siteFactsFor(world, household, spot);
    if (!facts.can) continue;
    const ground = { open: 'open ground', brush: 'brush', timber: 'timber' }[facts.ground] || facts.ground;
    const water = facts.needsWell ? 'needs a well' : 'water close by';
    const way = far(spot, mark) < 0.05 ? 'By the wagon' : `${wayFrom(mark, spot)[0].toUpperCase()}${wayFrom(mark, spot).slice(1)} of the wagon`;
    offered.push({ x: spot.x, y: spot.y, label: `${way}: ${ground}, ${water}`, words: facts.words });
  }
  return offered;
}

/** Ten acres to survey: open ground before brush before timber (the clearing it wants), nearest the house first. */
function surveySuggestions(world, household) {
  const bounds = holdingOf(world, household).bounds, home = world.map.sites[household.homeSiteId];
  const spots = [];
  const half = PLOT_SIDE / 2;
  for (let x = bounds.minX + half; x <= bounds.maxX - half + 1e-9; x += PLOT_SIDE / 2) {
    for (let y = bounds.minY + half; y <= bounds.maxY - half + 1e-9; y += PLOT_SIDE / 2) {
      const point = { x: round(x), y: round(y) };
      if (far(point, home) <= SURVEY_REACH) spots.push(point);
    }
  }
  spots.sort((a, b) => far(a, home) - far(b, home) || a.x - b.x || a.y - b.y);
  const ok = [];
  for (const point of spots.slice(0, SURVEY_LOOKS)) {
    const facts = plotFacts(world, household, point);
    if (facts.can) ok.push({ ...point, facts });
  }
  ok.sort((a, b) => a.facts.spells - b.facts.spells || far(a, home) - far(b, home));
  return spread(ok, PLOT_SIDE * 0.999).map(one => ({ x: one.x, y: one.y, label: `${one.facts.ground[0].toUpperCase()}${one.facts.ground.slice(1)}, ${whereFromHouse(world, household, one)}`, words: one.facts.words }));
}

/** The family's own plots this work can go to now, nearest the house first. */
function plotSuggestions(world, household, job) {
  const home = world.map.sites[household.homeSiteId];
  return plotsOf(world, household)
    .map(plot => ({ plot, facts: plotFacts(world, household, plot, job) }))
    .filter(one => one.facts.can)
    .sort((a, b) => far(a.plot, home) - far(b.plot, home) || String(a.plot.id).localeCompare(String(b.plot.id)))
    .slice(0, SUGGESTED)
    .map(({ plot, facts }) => ({ x: plot.x, y: plot.y, plotId: plot.id, label: `${plot.ground[0].toUpperCase()}${plot.ground.slice(1)}, ${whereFromHouse(world, household, plot)}`, words: facts.words }));
}

/** The jobs a place is suggested for. */
export const SUGGEST_JOBS = Object.freeze(['site', 'survey-plot', 'clear-plot', 'fence-plot', 'plant-field']);

/**
 * Up to three suggested places for this family and this choice, each `{ x, y, label, words }` (and `plotId` for a plot), or an
 * empty list when there is nowhere, or the choice is not open to the family now. Reads the world and changes nothing.
 */
export function suggestPlaces(world, household, job) {
  if (!household) return [];
  if (job === 'site') return siteSuggestions(world, household);
  if (world.status === 'lobby' || household.choosingSite) return [];
  if (job === 'survey-plot') return surveySuggestions(world, household);
  if (job === 'clear-plot' || job === 'fence-plot' || job === 'plant-field') return plotSuggestions(world, household, job);
  return [];
}
