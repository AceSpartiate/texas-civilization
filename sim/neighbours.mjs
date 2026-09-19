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
import { COTTON_SEED_PER_PLOT, SEED_PER_PLOT } from './improvements.mjs';
import { huntingPlace } from './hunting.mjs';
import { packFlight } from './scrape.mjs';
import { campChoice } from './camp.mjs';
import { fellFacts, logsLying } from './felling.mjs';
import { logsShort } from './houseplot.mjs';
import { countsTrees, treesIn, woodsRule } from './woods.mjs';
import { landAround } from './ground.mjs';

/** Decisions are spread over ticks: each family thinks every third tick, not all of them on the same one. */
export const THINK_EVERY = 3;
/** What a family values a unit of each good at, when weighing a trade. Seed and powder are dear; coin is scarce. */
export const TRADE_VALUE = Object.freeze({ food: 1, cotton: 1, seed: 2, powder: 3, money: 3 });
/** Food per person the family keeps back before it will trade food away or stop hunting. */
export const FOOD_KEPT_PER_PERSON = 3;
/** Work one person does alone; a family never puts two of its people on the same one at once. */
export const ONE_AT_A_TIME = Object.freeze(['hunt-timber', 'hunt-land', 'haul-logs', 'fetch-seed', 'fetch-powder', 'sell-cotton', 'sell-food', 'mend-hoe', 'replace-hoe', 'fence-plot', 'survey-plot', 'dig-well', 'hunt-road', 'tend-sick', 'trade-crossing']);
/** Plots a family nobody plays keeps, its first patch among them: enough to feed it, and a harvest it can carry in. */
export const NEIGHBOUR_PLOTS = 3;
/** The house it chooses, best first, where its tools allow. */
const HOUSE_PREFERENCE = ['hewn-log', 'round-log', 'jacal'];

/**
 * How often a family nobody plays takes each winter choice, per grown hand (owner, 2026-09-16, docs/COLONIES.md §7e: "rarely,
 * as the record shows"; 78 in 100 of those serving that winter were newcomers from the United States, `HIST-TEX-047`). The
 * regular army takes two in five of those who enlist; the numbers are this game's own (`FIC-GONZ-044`).
 */
export const WINTER_SHARES = Object.freeze({ enlist: 0.1, regular: 0.04, garrison: 0.1, matamoros: 0.02, vote: 0.9, relief: 0.1, houston: 0.15 });

/** A share in [0, 1) that is always the same for this class, this person and this question: FNV-1a over the three. */
export function shareOf(world, personId, question) {
  let hash = 0x811c9dc5;
  for (const char of `${world.seed}:${personId}:${question}`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash / 0x100000000;
}

const worth = goods => Object.entries(goods || {}).reduce((sum, [good, amount]) => sum + (TRADE_VALUE[good] ?? 1) * amount, 0);

/** Whether this family is one the director runs. */
/** A family nobody plays, or one whose student has gone (sim/absence.mjs): the director gives its orders. */
export const automatic = (world, household) => Boolean(world.neighbours && household && (!household.played || household.absent));

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

  // Told to leave in the spring (sim/scrape.mjs): a family nobody plays goes at once, taking all the food that fits and then
  // seed, for the nearest refuge east.
  if (view.flight?.status === 'ordered' && view.flight.refuges?.length) {
    const { take, refuge } = packFlight(view.flight);
    attempt({ action: 'flee', entityId: view.household.mainId || view.household.principalId, take, refuge });
  }
  // A man with Houston's army (sim/camp.mjs, docs/HOUSTON_CAMP.md): the camp's work at documented rates, chosen by a hashed
  // share of the day - mostly drill, as the army did at Groce's - so a man whose family does nothing never sits idle.
  for (const person of people) {
    if (person.service?.kind !== 'houston' || person.service.status !== 'serving' || person.chore || person.travel) continue;
    const chore = campChoice(world, world.entities[person.id], view.work?.[person.id] || []);
    if (chore) attempt({ action: 'chore', entityId: person.id, chore });
  }
  // On the road east (sim/road.mjs, docs/ROAD_EAST.md): the road's question is answered as most families answered it - the
  // question's own fallback, the first open (the wagon dug out; the camp broken and the family pressed on); with nobody
  // chasing, a family short of food sends one grown hand out from the camp when there is a shot in the house, nurses
  // whoever is sick, and buys food with a real among the families camped at a crossing or the refuge. A family that has
  // been warned does nothing but go.
  const flight = view.flight;
  if (flight && ['fled', 'refuged'].includes(flight.status)) {
    const mainId = view.household.mainId || view.household.principalId;
    if (flight.ask) {
      const option = (flight.ask.fallback || []).find(id => flight.ask.options.some(choice => choice.id === id && choice.can !== false)) || flight.ask.options.find(choice => choice.can !== false)?.id;
      if (option) attempt({ action: 'road-answer', entityId: mainId, option });
    }
    if (!flight.danger && !flight.bogged) {
      const resources = view.household.resources || {};
      const short = (resources.food || 0) < people.length * FOOD_KEPT_PER_PERSON;
      const free = people.filter(person => !tooYoung(person) && !person.chore && person.health?.condition !== 'dead' && person.health?.condition !== 'captured' && person.health?.condition !== 'sick');
      const busy = id => people.some(person => person.chore?.id === id);
      const offer = (person, chore) => (view.work?.[person.id] || []).find(entry => entry.id === chore && entry.can);
      const send = chore => { const hand = free.find(person => offer(person, chore)); return hand ? attempt({ action: 'chore', entityId: hand.id, chore }) : false; };
      if (short && (resources.powder || 0) >= 1 && !busy('hunt-road')) send('hunt-road');
      if (people.some(person => person.health?.condition === 'sick') && !busy('tend-sick')) send('tend-sick');
      if (short && (resources.money || 0) >= 1 && !busy('trade-crossing')) send('trade-crossing');
    }
    return tried;
  }
  // The winter's choices (sim/winter.mjs, docs/COLONIES.md §7e), at the record's rarity (owner, 2026-09-16): most colonists
  // stayed home that winter, so about one grown hand in ten enlists for land, about one in ten goes to the Béxar garrison,
  // one in fifty goes south to Matamoros, and nearly every man who may vote rides in to vote. Who is decided by a share
  // hashed from the class and the person, not drawn from a random stream, so the family is as deterministic as the rest of
  // this director and a class replays the same.
  for (const person of people) {
    if (person.chore || person.travel || person.service) continue;
    const offer = chore => (view.work?.[person.id] || []).find(entry => entry.id === chore && entry.can);
    if (offer('go-vote') && shareOf(world, person.id, 'vote') < WINTER_SHARES.vote) { ride({ action: 'chore', entityId: person.id, chore: 'go-vote' }); continue; }
    const share = shareOf(world, person.id, 'winter');
    const chore = share < WINTER_SHARES.regular ? 'enlist-regular'
      : share < WINTER_SHARES.enlist ? 'enlist-auxiliary'
      : share < WINTER_SHARES.enlist + WINTER_SHARES.garrison ? 'join-garrison'
      : share < WINTER_SHARES.enlist + WINTER_SHARES.garrison + WINTER_SHARES.matamoros ? 'join-matamoros' : null;
    if (chore && offer(chore)) { ride({ action: 'chore', entityId: person.id, chore }); continue; }
    // Travis's letter (sim/alamo.mjs): about one grown hand in ten of a family that has heard it rides to Gonzales to go in.
    if (offer('join-relief') && shareOf(world, person.id, 'relief') < WINTER_SHARES.relief) { ride({ action: 'chore', entityId: person.id, chore: 'join-relief' }); continue; }
    // Houston's army in the spring (sim/houston.mjs): about one grown man in seven.
    if (offer('join-houston') && person.sex !== 'female' && shareOf(world, person.id, 'houston') < WINTER_SHARES.houston) ride({ action: 'chore', entityId: person.id, chore: 'join-houston' });
  }

  // On the real land, where the house stands comes first (sim/homesite.mjs): looked over as a student would look it over.
  const land = view.land || {};
  if (land.choosingSite?.can) {
    const spot = pickSite(land.grant.bounds, land.choosingSite.mark);
    for (const point of spot) if (attempt({ action: 'choose-site', x: point.x, y: point.y })) break;
  }
  // The house: choose one the tools allow, then put hands to it.
  const homeSite = world.map.sites[view.household.homeSiteId];
  // Looked for once, when the house is first planned: a family without the sound logs for a log cabin standing on its land
  // within a mile builds a jacal, which wants none.
  const treeless = land.plot && land.choices && !land.house && homeSite && !land.choosingSite && soundLogsNear(world, homeSite, land.grant?.bounds) < CABIN_LOGS;
  // Not before the site is chosen: what stands near the house is what stands near where it will be.
  if (land.choices && !land.house && !land.choosingSite) {
    const choice = treeless ? 'jacal' : HOUSE_PREFERENCE.find(id => land.choices.some(c => c.id === id && c.can));
    if (choice && land.house?.plan !== choice) attempt({ action: 'plan-house', layout: choice });
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
  const huntChore = countsTrees(woodsRule(world)) ? 'hunt-land' : 'hunt-timber';
  // Its plots, as its own land line shows them, and the house they are walked to from.
  const plots = land.plots || [];
  const home = world.map.sites[view.household.homeSiteId];
  const nearest = list => list.sort((a, b) => Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y))[0];
  const staked = nearest(plots.filter(plot => plot.state === 'staked'));
  // A house of pieces is built from the family's own logs (sim/houseplot.mjs, sim/felling.mjs): felled until there are enough
  // at the house and lying out for what the plan still wants, and hauled in.
  const lying = land.plot ? logsLying(world, world.households[view.household.id]) : [];
  const got = use => (land.logs?.[use] || 0) + lying.filter(entry => entry.use === use).reduce((sum, entry) => sum + entry.left, 0);
  const moreLogs = Boolean(land.plot && land.planned && logsShort({ wall: got('wall'), sill: got('sill'), poor: got('poor') }, land.planned.logs));
  if (!moreLogs) for (const person of people) if (person.chore?.id === 'fell-trees') attempt({ action: 'stop-chore', entityId: person.id });
  const unfenced = nearest(plots.filter(plot => plot.state === 'cleared' && plot.fence !== 'sound'));
  for (const person of idle) {
    // Somebody away from home with nothing to do there comes home.
    // Somebody who went with the volunteers, or to help at Gonzales, is where the family sent them (task 'help'), and stays;
    // so does somebody serving (sim/winter.mjs), whose day at the camp was chosen above.
    if (person.task === 'help' || person.service) continue;
    if (person.location?.siteId !== view.household.homeSiteId) { ride({ action: 'travel', entityId: person.id, destination: view.household.homeSiteId }); continue; }
    const can = chore => Boolean(available({ person: person.id, chore }));
    const food = view.household.resources.food || 0;
    const resources = view.household.resources;
    const plan = [
      // Food first when the family is short, then the crop, the house, the tools, the fence, and the trips to town
      // a farm needs: seed when there is none to plant, cotton to the store once there is some.
      food < people.length * FOOD_KEPT_PER_PERSON && hunters === 0 && (resources.powder || 0) >= 1 && huntChore,
      'harvest-field', 'plant-field', 'build-house',
      land.logs?.lying > 0 && 'haul-logs',
      moreLogs && 'fell-trees',
      'dig-well', 'mend-hoe', 'cut-lane',
      view.household.field?.state === 'planted' && unfenced && 'fence-plot',
      // Seed enough for the family's own crop: cotton wants more a plot than corn (sim/improvements.mjs). Measured 2026-09-16: with
      // corn's count written here, a cotton family never gathered enough, never planted, and its cotton economy collapsed.
      view.household.field?.state === 'bare' && (resources.seed || 0) < (view.household.field?.crop === 'cotton' ? COTTON_SEED_PER_PLOT : SEED_PER_PLOT) * Math.max(1, land.cleared || 0) && 'fetch-seed',
      (resources.cotton || 0) >= 1 && 'sell-cotton',
      // Then more ground, a plot at a time: clear what is staked, and stake more while it has fewer than it keeps.
      staked && 'clear-plot',
      !staked && plots.length < NEIGHBOUR_PLOTS && 'survey-plot',
    ].filter(Boolean);
    const chore = plan.find(id => !busy.has(id) && can(id));
    if (!chore) continue;
    // Clearing, fencing and survey are sent to a place on the family's own land, as a student sends them.
    const sent = chore === 'fell-trees' ? fellPlaces(world, view.household, home, land.grant?.bounds).some(point => attempt({ action: 'fell-trees', entityId: person.id, ...point }))
      : chore === 'hunt-land' ? huntPlaces(world, home, land.grant?.bounds).some(point => attempt({ action: 'hunt-land', entityId: person.id, ...point }))
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
/**
 * Where a family nobody plays would fell for its house, nearest first: the nearest standing trees on its own land that give
 * sound logs, looked for in growing squares round the house out to a mile. The server still decides.
 */
/** The sound logs a round-log cabin wants, pen and all: a family with fewer standing near builds a jacal. */
const CABIN_LOGS = 50;
/**
 * The standing trees that give sound logs on the family's own land within a mile of the house, nearest the house first.
 * Read a quarter mile at a time, so a square of thick timber is never too many trees to list.
 */
function soundTrees(world, home, bounds) {
  const felled = world.woods?.felled || {};
  const box = {
    minX: Math.max(bounds?.minX ?? -Infinity, home.x - HUNT_LOOK_MILES), maxX: Math.min(bounds?.maxX ?? Infinity, home.x + HUNT_LOOK_MILES),
    minY: Math.max(bounds?.minY ?? -Infinity, home.y - HUNT_LOOK_MILES), maxY: Math.min(bounds?.maxY ?? Infinity, home.y + HUNT_LOOK_MILES),
  };
  const options = { rule: woodsRule(world), nearCreek: landAround().nearCreek };
  const found = [];
  for (let x = box.minX; x < box.maxX; x += 0.25) for (let y = box.minY; y < box.maxY; y += 0.25) {
    for (const tree of treesIn({ minX: x, minY: y, maxX: Math.min(box.maxX, x + 0.25), maxY: Math.min(box.maxY, y + 0.25) }, options) || []) {
      if (['wall', 'sill'].includes(tree.use) && tree.logs > 0 && !felled[tree.id] && Math.hypot(tree.x - home.x, tree.y - home.y) <= HUNT_LOOK_MILES) found.push(tree);
    }
  }
  return found.sort((a, b) => Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y));
}
/** How many sound logs stand on the family's land within a mile of the house. */
export const soundLogsNear = (world, home, bounds) => soundTrees(world, home, bounds).reduce((sum, tree) => sum + tree.logs, 0);
/** Where a family nobody plays would fell for its house: at the nearest standing sound trees on its land. The server still decides. */
export function fellPlaces(world, household, home, bounds) {
  return soundTrees(world, home, bounds).slice(0, 4).map(tree => ({ x: tree.x, y: tree.y })).filter(point => fellFacts(world, world.households[household.id], point).can);
}
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
