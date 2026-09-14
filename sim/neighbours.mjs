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

/** Decisions are spread over ticks: each family thinks every third tick, not all of them on the same one. */
export const THINK_EVERY = 3;
/** What a family values a unit of each good at, when weighing a trade. Seed and powder are dear; coin is scarce. */
export const TRADE_VALUE = Object.freeze({ food: 1, cotton: 1, seed: 2, powder: 3, money: 3 });
/** Food per person the family keeps back before it will trade food away or stop hunting. */
export const FOOD_KEPT_PER_PERSON = 3;
/** Work one person does alone; a family never puts two of its people on the same one at once. */
export const ONE_AT_A_TIME = Object.freeze(['hunt-timber', 'fetch-seed', 'fetch-powder', 'sell-cotton', 'sell-food', 'mend-hoe', 'replace-hoe', 'build-fence', 'dig-well']);
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
  const hunters = doing('hunt-timber');
  for (const person of idle) {
    // Somebody away from home with nothing to do there comes home.
    if (person.location?.siteId !== view.household.homeSiteId) { attempt({ action: 'travel', entityId: person.id, destination: view.household.homeSiteId }); continue; }
    const can = chore => Boolean(available({ person: person.id, chore }));
    const food = view.household.resources.food || 0;
    const resources = view.household.resources;
    const plan = [
      // Food first when the family is short, then the crop, the house, the tools, the fence, and the trips to town
      // a farm needs: seed when there is none to plant, cotton to the store once there is some.
      food < people.length * FOOD_KEPT_PER_PERSON && hunters === 0 && (resources.powder || 0) >= 1 && 'hunt-timber',
      'harvest-field', 'plant-field', 'build-house', 'dig-well', 'mend-hoe', 'cut-lane',
      view.household.field?.state === 'planted' && 'build-fence',
      view.household.field?.state === 'bare' && (resources.seed || 0) < 2 && 'fetch-seed',
      (resources.cotton || 0) >= 1 && 'sell-cotton',
    ].filter(Boolean);
    const chore = plan.find(id => !busy.has(id) && can(id));
    if (chore && attempt({ action: 'chore', entityId: person.id, chore }) && ONE_AT_A_TIME.includes(chore)) busy.add(chore);
  }
  return tried;
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
