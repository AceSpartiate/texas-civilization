// Families nobody is playing, living their own lives: docs/COLONIES.md §5.9, build step 3.
//
// Every family without a student is run by this director, so a class of thirty with twelve students and a student
// playing alone are the same game: neighbours build, farm, hunt and trade, and a student can help raise their walls.
//
// The rules that keep it honest, each enforced by how it is written rather than by promise:
//   - It acts only through `applyAction`, as a student does, and a refusal is simply a thing it could not do.
//   - It decides only from that family's own student projection (`projectWorld(..., 'student')`): its own stores,
//     its own work and why it can or cannot do it, its own offers. Never the truth, another family's stores, or glory.
//   - It is deterministic: no draw from any random stream; every choice follows from what the family can see.
//   - It yields: a family a student has joined (`household.played`) is never touched again.
//   - It runs only in a class that asked for it (`world.neighbours`), so every class and save made before is unchanged.
//
// Every threshold and valuation below is invented (`FIC-GONZ-028`).
import { tooYoung } from './family.mjs';
import { siteFacts } from './ground.mjs';
import { overlaps, squareOf } from './fields.mjs';
import { CHORES } from './chores.mjs';
import { huntingPlace } from './hunting.mjs';
import { woodsRule } from './woods.mjs';

/** Decisions are spread over ticks: each family thinks every third tick, not all of them on the same one. */
export const THINK_EVERY = 3;
/** What a family values a unit of each good at, when weighing a trade. Seed and powder are dear; coin is scarce. */
export const TRADE_VALUE = Object.freeze({ food: 1, cotton: 1, seed: 2, powder: 3, money: 3 });
/** Food per person the family keeps back before it will trade food away or stop hunting. */
export const FOOD_KEPT_PER_PERSON = 3;
/** Work one person does alone; a family never puts two of its people on the same one at once. */
export const ONE_AT_A_TIME = Object.freeze(['hunt-timber', 'hunt-land', 'fetch-seed', 'fetch-powder', 'sell-cotton', 'sell-food', 'mend-hoe', 'replace-hoe', 'fence-plot', 'survey-plot', 'dig-well']);
/** Plots a family nobody plays keeps, its first patch among them: enough to feed it, and a harvest it can carry in. */
export const NEIGHBOUR_PLOTS = 3;
/** The house it chooses, best first, where its tools allow. */
const HOUSE_PREFERENCE = ['hewn-log', 'round-log', 'jacal'];

const worth = goods => Object.entries(goods || {}).reduce((sum, [good, amount]) => sum + (TRADE_VALUE[good] ?? 1) * amount, 0);

/** Whether this family is one the director runs. */
export const automatic = (world, household) => Boolean(world.neighbours && household && !household.played);

/** Mark a family as a student's, for good. Called by the server when a student joins it. */
export function markPlayed(world, householdId) {
  if (world.households[householdId]) world.households[householdId].played = true;
}

/**
 * Whether to take a trade, and if not, why - in the family's own words. Weighs what it gets against what it gives,
 * and never gives away what it needs: its food below what its people need, its seed before planting, its last shot.
 */
export function judgeOffer(view, offer) {
  const resources = view.household.resources;
  const people = view.household.members.length;
  const after = good => (resources[good] || 0) - (offer.weGive[good] || 0) + (offer.weGet[good] || 0);
  if (offer.weGive.food && after('food') < people * FOOD_KEPT_PER_PERSON) return { take: false, why: "We can't spare the food; there are too many of us to feed." };
  if (offer.weGive.seed && view.household.field?.state === 'bare' && after('seed') < 2) return { take: false, why: "We can't spare seed before the field is in." };
  if (offer.weGive.powder && after('powder') < 1) return { take: false, why: "That's the last powder in the house." };
  if (worth(offer.weGet) < worth(offer.weGive)) return { take: false, why: "That's not a fair trade for us." };
  return { take: true };
}

/**
 * One family's turn to think. Returns the actions it tried, for tests and for nothing else in the simulation.
 * `act(input)` is `applyAction` bound to this household; `view` is its student projection.
 */
export function thinkFor(world, household, { project, act }) {
  const view = project(household.id);
  const tried = [];
  const attempt = input => { try { act(input); tried.push(input); return true; } catch { return false; } };
  // A journey is ridden when the horse is at hand, and walked when it is not: a family with a horse in the yard did not
  // walk nine miles to the store (found in play 2026-09-14). The server refuses the horse when somebody else has it.
  const ride = input => attempt({ ...input, mode: 'horse' }) || attempt(input);
  // Its own people, as its own projection shows them.
  const people = (view.entities || []).filter(entity => entity.kind === 'person' && entity.householdId === household.id);
  const available = work => (view.work?.[work.person] || []).find(entry => entry.id === work.chore && entry.can);

  // Offers made to this family: answered by the person they were made to.
  for (const offer of view.offers || []) {
    if (offer.direction !== 'received') continue;
    const verdict = judgeOffer(view, offer);
    attempt(verdict.take
      ? { action: 'accept-offer', entityId: offer.ourEntityId, offerId: offer.id }
      : { action: 'decline-offer', entityId: offer.ourEntityId, offerId: offer.id, reason: verdict.why });
  }

  // A hunt waiting on the family's word: take the first thing it can do.
  for (const person of people) {
    const ask = person.chore?.ask;
    if (!ask) continue;
    const option = (ask.options || []).find(choice => choice.can !== false) || ask.options?.[0];
    if (option) attempt({ action: 'answer-chore', entityId: person.id, option: option.id });
  }

  // Its settlement's call, when the word reaches it (sim/calls.mjs), answered as the letters say the settlements answered
  // (`HIST-TEX-014`): away from the coast a family with a second grown hand sends one of its men, and keeps the rest home;
  // on the coast, where the committees asked whether any more men should leave, and in a family with only one grown hand to
  // spare, it stays. No die: the family and its settlement decide.
  const call = view.request?.kind === 'call' && view.request.status === 'open' ? view.request : null;
  if (call) {
    const answerers = Object.entries(call.answerers || {}).map(([id, options]) => ({ person: people.find(p => p.id === id), options }));
    const goes = answer => answer.options.find(option => option.id === 'turn-out')?.can;
    const coast = ['matagorda', 'columbia'].includes(view.household.settlementId);
    const volunteer = !coast && answerers.length >= 2 && (answerers.find(a => goes(a) && a.person?.sex === 'male' && !a.person.principal) || answerers.find(a => goes(a) && a.person?.principal && a.person.sex !== 'female'));
    if (volunteer) ride({ action: 'turn-out', entityId: volunteer.person.id });
    else if (answerers[0]) attempt({ action: 'stay-put', entityId: answerers[0].person.id });
  }

  // On the real land, where the house stands comes first (sim/homesite.mjs): looked over as a student would look it over.
  const land = view.land || {};
  if (land.choosingSite?.can) {
    const spot = pickSite(land.grant.bounds, land.choosingSite.mark);
    for (const point of spot) if (attempt({ action: 'choose-site', x: point.x, y: point.y })) break;
  }
  // The house: choose one the tools allow, then put hands to it.
  if (land.choices && !land.house) {
    const choice = HOUSE_PREFERENCE.find(id => land.choices.some(c => c.id === id && c.can));
    if (choice) attempt({ action: 'plan-house', layout: choice });
  }

  const idle = people.filter(person => !tooYoung(person) && !person.chore && !person.travel
    && person.health?.condition !== 'dead' && person.health?.condition !== 'captured');
  // One person at a time on a one-person errand, and a hunt only with a shot in the house: a family short of food sent
  // everybody to the timber with no powder and never built or planted, and a live class sent a whole family to town
  // for seed (both found 2026-09-14). The house, the planting and the harvest are the work many hands help with.
  const doing = id => people.filter(person => person.chore?.id === id).length;
  const busy = new Set(ONE_AT_A_TIME.filter(id => doing(id) > 0));
  const hunters = doing('hunt-timber') + doing('hunt-land');
  // A class whose woods come from the land hunts its own land (sim/hunting.mjs); every other class goes to the timber as it did.
  const huntChore = woodsRule(world) === 'landfire' ? 'hunt-land' : 'hunt-timber';
  // Its plots, as its own land line shows them, and the house they are walked to from.
  const plots = land.plots || [];
  const home = world.map.sites[view.household.homeSiteId];
  const nearest = list => list.sort((a, b) => Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y))[0];
  const staked = nearest(plots.filter(plot => plot.state === 'staked'));
  const unfenced = nearest(plots.filter(plot => plot.state === 'cleared' && plot.fence !== 'sound'));
  for (const person of idle) {
    // Somebody away from home with nothing to do there comes home.
    // Somebody who went with the volunteers, or to help at Gonzales, is where the family sent them (task 'help'), and stays.
    if (person.task === 'help') continue;
    if (person.location?.siteId !== view.household.homeSiteId) { ride({ action: 'travel', entityId: person.id, destination: view.household.homeSiteId }); continue; }
    const can = chore => Boolean(available({ person: person.id, chore }));
    const food = view.household.resources.food || 0;
    const resources = view.household.resources;
    const plan = [
      // Food first when the family is short, then the crop, the house, the tools, the fence, and the trips to town
      // a farm needs: seed when there is none to plant, cotton to the store once there is some.
      food < people.length * FOOD_KEPT_PER_PERSON && hunters === 0 && (resources.powder || 0) >= 1 && huntChore,
      'harvest-field', 'plant-field', 'build-house', 'dig-well', 'mend-hoe', 'cut-lane',
      view.household.field?.state === 'planted' && unfenced && 'fence-plot',
      view.household.field?.state === 'bare' && (resources.seed || 0) < 2 * Math.max(1, land.cleared || 0) && 'fetch-seed',
      (resources.cotton || 0) >= 1 && 'sell-cotton',
      // Then more ground, a plot at a time: clear what is staked, and stake more while it has fewer than it keeps.
      staked && 'clear-plot',
      !staked && plots.length < NEIGHBOUR_PLOTS && 'survey-plot',
    ].filter(Boolean);
    const chore = plan.find(id => !busy.has(id) && can(id));
    if (!chore) continue;
    // Clearing, fencing and survey are sent to a place on the family's own land, as a student sends them.
    const sent = chore === 'hunt-land' ? huntPlaces(world, home, land.grant?.bounds).some(point => attempt({ action: 'hunt-land', entityId: person.id, ...point }))
      : chore === 'survey-plot' ? surveyPlaces(home, land.grant?.bounds, plots).some(point => attempt({ action: 'survey-plot', entityId: person.id, ...point }))
      : chore === 'clear-plot' ? attempt({ action: 'clear-plot', entityId: person.id, x: staked.x, y: staked.y })
      : chore === 'fence-plot' ? attempt({ action: 'fence-plot', entityId: person.id, x: unfenced.x, y: unfenced.y })
      : CHORES[chore]?.steps.some(step => step.travel) ? ride({ action: 'chore', entityId: person.id, chore })
      : attempt({ action: 'chore', entityId: person.id, chore });
    if (sent && ONE_AT_A_TIME.includes(chore)) busy.add(chore);
  }
  return tried;
}

/**
 * Where a family nobody plays would stake its next ten acres, best first: close round the house, a quarter mile out and
 * then further, clear of its own plots and inside its land. The server still decides; the first it accepts is taken.
 */
export function surveyPlaces(home, bounds, plots) {
  const places = [];
  for (const miles of [0.2, 0.3, 0.45]) for (let turn = 0; turn < 8; turn++) {
    const angle = turn * Math.PI / 4;
    const point = { x: +(home.x + Math.cos(angle) * miles).toFixed(3), y: +(home.y + Math.sin(angle) * miles).toFixed(3) };
    const square = squareOf(point);
    if (bounds && (square.minX < bounds.minX || square.maxX > bounds.maxX || square.minY < bounds.minY || square.maxY > bounds.maxY)) continue;
    if (plots.some(plot => overlaps(squareOf(plot), square))) continue;
    places.push(point);
  }
  return places.slice(0, 8);
}

/**
 * Where a family nobody plays would hunt its own land, best first: the best ground for game within a mile of the house, the
 * nearer of two as good. Read as a student reads it, from what the ground is; the server still decides.
 */
export const HUNT_LOOK_MILES = 1;
export function huntPlaces(world, home, bounds) {
  const places = [];
  for (const miles of [0.25, 0.5, 0.75, HUNT_LOOK_MILES]) for (let turn = 0; turn < 8; turn++) {
    const angle = turn * Math.PI / 4;
    const point = { x: +(home.x + Math.cos(angle) * miles).toFixed(3), y: +(home.y + Math.sin(angle) * miles).toFixed(3) };
    if (bounds && (point.x < bounds.minX || point.x > bounds.maxX || point.y < bounds.minY || point.y > bounds.maxY)) continue;
    places.push({ point, miles, game: huntingPlace(world, point).game });
  }
  return places.sort((a, b) => b.game - a.game || a.miles - b.miles).slice(0, 6).map(entry => entry.point);
}

/** How finely a family looks over its holding for a house site: this many places a side. */
export const SITE_LOOKS = 5;
/**
 * Where a family nobody plays would set its house, best first: out of the river bottom, close enough to running water
 * to carry it if it can, and then as near that water as it can be; the surveyor's mark when nothing better is found.
 */
export function pickSite(bounds, mark) {
  const looked = [];
  for (let i = 0; i < SITE_LOOKS; i++) for (let j = 0; j < SITE_LOOKS; j++) {
    const point = { x: bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / SITE_LOOKS, y: bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / SITE_LOOKS };
    const facts = siteFacts(point, bounds);
    if (facts.can) looked.push({ point, facts });
  }
  const score = ({ facts }) => (facts.bottom ? 10 : 0) + (facts.needsWell ? 5 : 0) + (facts.waterMiles ?? 3);
  return [...looked.sort((a, b) => score(a) - score(b)).map(entry => entry.point), mark];
}

/** Every automatic family whose turn it is. Called once a tick, after the directors. */
export function advanceNeighbours(world, { project, apply }) {
  if (!world.neighbours || world.status !== 'running') return;
  Object.values(world.households).forEach((household, index) => {
    if (!automatic(world, household) || household.arriving) return;
    if ((world.tick + index) % THINK_EVERY !== 0) return;
    thinkFor(world, household, { project, act: input => apply(household.id, input) });
  });
}
