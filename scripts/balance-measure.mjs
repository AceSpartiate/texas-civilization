// The balance measure: docs/MONEY_AND_GLORY.md §8 (the gate *Winning without fighting is hard, not impossible*), measured over
// many whole classes (owner, 2026-09-27, by multiple choice: "Yes, measure it now" - run many automatic classes and report who
// wins and why, with no change to the rules until the owner has seen the numbers). Reported in docs/BALANCE.md.
//
// **Measures only. Nothing here changes a rule.** Every family of every class is played by a policy that sends only the actions
// a student could send (`applyAction`), chosen among what the family's own student projection offers; the policy is the
// neighbours' own director (sim/neighbours.mjs `thinkFor`) with a strategy laid over it:
//
//   war     none       nobody is ever sent to a call, the army, the garrison, the expedition, the relief or Houston (voting is kept)
//           neighbour  the director as it is: the settlement's call as the letters say, the winter's choices at the record's shares
//           one        one man in the war whenever the family has none there: the call, the gathering, enlisting for land, the
//                      relief of the Alamo, Houston's army - whichever is offered first
//           all        every man who may be sent is sent to every one of those that is offered
//   sell    no | yes   yes: every bale of cotton at the counter for coin, and food beyond three weeks' eating sold for coin
//   farm    plain|hard hard: the family keeps six plots under the plough, not the director's three
//   crop    own|cotton cotton: cotton at the field whenever the seed allows, and the seed fetched for it
//   scrape  flee|stay|late  told to leave in the spring: go at once (the director), stay and take what comes, or stay three days and then go
//
// Each family's strategy is hashed from the class and the family (FNV-1a, as sim/neighbours.mjs `shareOf`), so a class replays
// exactly and the five factors are independent of one another and of the family's two dice (the family roll and the means die).
//
// How a played family is run here, and why (the harness, not a rule): during each tick every family is marked `absent` and the
// class's own director is switched off (`world.neighbours` false), so every question the war asks a man in the ranks, every
// counter nobody answers in time and the road east's questions are answered at once at the shares the game gives a family whose
// student has gone (sim/absence.mjs) - and the director never gives an order this policy did not choose. Between ticks the
// director is switched back on for the policy's own turn (the town errands are listed only for a family the director runs,
// sim/chores.mjs `directed`, as in scripts/balance-study.mjs). Every family is `played`, so every family is a contender at the
// ending (sim/ending.mjs `hostEnding`) and the winner is the game's own; and every family is rolled at the start as the teacher's
// Start rolls a joined family (sim/world.mjs `rollFamily`), so the family die varies and the women's rule holds. Two things
// follow from `played` that a neighbours' class does not have: the guided start, which each family stops with the student's own
// X at the first tick, and the winter-clothing furlough of November 3, which the game gives only to families nobody plays
// (sim/army.mjs `goForClothing`). The Scrape's flight is sent by whichever of the family is at home and free, as the page sends
// it by the person the student has selected.
//
// ceiling: neighbour-to-neighbour trade is not measured - the director only answers offers and never makes them, and making them
// wants a family to ride to another's door; "sell" is the store, which is where the coin is. ceiling: a strategy is fixed for the
// whole class; a student who changes course half way is not modelled.
//
// Run: node scripts/balance-measure.mjs [--sizes 5,15,30] [--classes 70,70,70] [--workers N] [--out docs/evidence/balance-measure.json]
//   Deterministic: the same arguments give the same classes and the same numbers (runtime aside). Classes run in parallel
//   worker threads; results are gathered in class order before anything is summarised.
import { writeFileSync, mkdirSync } from 'node:fs';
import { cpus } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { distanceMultiplier } from '../sim/glory.mjs';

// ------------------------------------------------------------------------------------------------ the strategies

export const FACTORS = Object.freeze({
  war: ['none', 'neighbour', 'one', 'all'],
  sell: ['no', 'yes'],
  farm: ['plain', 'hard'],
  crop: ['own', 'cotton'],
  scrape: ['flee', 'stay', 'late'],
});
// FNV-1a, then murmur3's finaliser. Without the finaliser the low bits of FNV-1a over strings that differ only in their last
// characters move together, and the first run of this measure (2026-09-27) dealt every family `sell`, `farm` and `crop` alike
// and tied `war` to `sell`: a crossed design with no crossing in it. `independence` below checks every pair before a class runs.
const hashOf = text => {
  let hash = 0x811c9dc5;
  for (const char of text) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 0x01000193) >>> 0; }
  hash ^= hash >>> 16; hash = Math.imul(hash, 0x85ebca6b); hash ^= hash >>> 13; hash = Math.imul(hash, 0xc2b2ae35); hash ^= hash >>> 16;
  return hash >>> 0;
};
export const strategyFor = (seed, householdId) => Object.fromEntries(Object.entries(FACTORS).map(([factor, levels]) => [factor, levels[hashOf(`${seed}:${householdId}:measure-${factor}`) % levels.length]]));
/** Every pair of factors crossed over the families these jobs will deal: each cell's count against what independence expects. */
export function independence(jobs) {
  const plans = jobs.flatMap(job => Array.from({ length: job.size }, (_, i) => strategyFor(job.seed, `hh-${i + 1}`)));
  const names = Object.keys(FACTORS), out = {};
  for (let a = 0; a < names.length; a++) for (let b = a + 1; b < names.length; b++) {
    const [x, y] = [names[a], names[b]];
    let worst = 0;
    for (const lx of FACTORS[x]) for (const ly of FACTORS[y]) {
      const nx = plans.filter(p => p[x] === lx).length, ny = plans.filter(p => p[y] === ly).length;
      const expected = (nx * ny) / plans.length, seen = plans.filter(p => p[x] === lx && p[y] === ly).length;
      worst = Math.max(worst, Math.abs(seen - expected) / Math.max(1, expected));
    }
    out[`${x} x ${y}`] = Math.round(worst * 1000) / 1000;
  }
  return { families: plans.length, worstCellDeviation: out };
}
export const HARD_PLOTS = 6, LATE_DAYS = 3, SELL_KEEP_DAYS = 21;

export async function runClass({ seed, size }, { keepWorld = false } = {}) {
  const { createGonzalesWorld } = await import('../sim/gonzales.mjs');
  const { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } = await import('../sim/world.mjs');
  const { beginSecondPeriod, beginThirdPeriod } = await import('../sim/periods.mjs');
  const { hostEnding } = await import('../sim/ending.mjs');
  const { thinkFor, surveyPlaces, THINK_EVERY } = await import('../sim/neighbours.mjs');
  const { eatenADay, tooYoung, canFight, mainPersonId } = await import('../sim/family.mjs');
  const { CHORES } = await import('../sim/chores.mjs');
  const { COTTON_SEED_PER_PLOT } = await import('../sim/improvements.mjs');
  const { farmFate } = await import('../sim/advance.mjs');
  const { flightProjection, packFlight } = await import('../sim/scrape.mjs');
  const { findPath } = await import('../sim/geography.mjs');
  const { herdOf } = await import('../sim/stock.mjs');
  const { GLORY_WEIGHT, distanceMultiplier } = await import('../sim/glory.mjs');

  const started = Date.now();
  const world = createGonzalesWorld(seed, size, { map: 'colonies', neighbours: true });
  const households = Object.values(world.households);
  const plans = Object.fromEntries(households.map(household => [household.id, strategyFor(seed, household.id)]));
  for (const household of households) household.played = true;
  // The family die, as the teacher's Start throws it for every joined family that never rolled (server/app.mjs): the founding
  // four a family nobody plays keeps have no sex and no age, so without this the family roll never varied and a mother could be
  // sent to fight (sim/family.mjs `canFight` reads `sex`). Found by the measure's second run, 2026-09-27.
  for (const household of households) rollFamily(world, household);
  world.status = 'running';
  const view = id => projectWorld(world, id, 'student', { includeMap: false });
  const tryAct = (household, input) => { try { applyAction(world, household.id, input); return true; } catch { return false; } };
  const tryActOuter = tryAct;
  // The guided start: stopped with the student's own X (sim/lesson.mjs `stopLesson`), once, before anybody moves. Then every
  // family is `absent` for the rest of the class (above: the harness, not a rule), and the crop it was rolled with is noted.
  for (const household of households) tryAct(household, { action: 'stop-lesson' });
  for (const household of households) household.absent = true;
  const rolledCrop = Object.fromEntries(households.map(household => [household.id, household.field?.crop || 'corn']));
  const WAR = new Set(['turn-out', 'go-upriver', 'go-see', 'help', 'detachment-go', 'send-for']);
  const WAR_CHORES = new Set(['enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros', 'join-relief', 'join-houston']);
  // What the family is offered to send a man to, first first: the settlement's call, the Gonzales questions, then the chores.
  const SEND_CHORES = ['enlist-auxiliary', 'join-relief', 'join-houston'];
  const engaged = person => Boolean(person.service || person.task === 'help' || (person.chore && CHORES[person.chore.id]?.war)
    || world.army?.members?.includes(person.id) || ['go-upriver', 'turn-out', 'help'].includes(person.travel?.purpose));
  const alive = person => !['dead', 'captured'].includes(person?.health?.condition);

  /** Every tick: the questions that are settled at the next tick if nobody answers (the counter, the field) and the Scrape. */
  function quick(household) {
    const plan = plans[household.id];
    for (const id of household.members) {
      const person = world.entities[id];
      const ask = person?.chore?.ask;
      if (!ask) continue;
      if (plan.sell === 'yes' && ask.id === 'cotton-counter') tryAct(household, { action: 'answer-chore', entityId: id, option: 'coin' });
      if (plan.crop === 'cotton' && ask.id === 'crop-choice') tryAct(household, { action: 'answer-chore', entityId: id, option: 'cotton' });
    }
    // The Scrape. The family goes by whichever of its people is at home and free to be given the order - the page sends the
    // person the student has chosen (public/app.js) - and not by the director's rule of its main person, which is refused while
    // he is serving (found by this measure, 2026-09-27: docs/BALANCE.md §5).
    const flight = household.flight;
    if (flight?.status === 'ordered' && plan.scrape !== 'flee') tryAct(household, { action: 'flight-stay' });
    const go = flight?.status === 'ordered' ? plan.scrape === 'flee'
      : flight?.status === 'stayed' && plan.scrape === 'late' && world.minute - (flight.stayedMinute ?? flight.orderedMinute) >= LATE_DAYS * 1440;
    if (go) {
      const shown = flightProjection(world, household);
      if (shown?.refuges?.length) {
        const { take, refuge } = packFlight(shown);
        const main = mainPersonId(world, household);
        const hands = household.members.map(id => world.entities[id])
          .filter(person => person && alive(person) && !person.service && !person.travel && person.location?.siteId === household.homeSiteId)
          .sort((a, b) => ((b.id === main) - (a.id === main)) || (tooYoung(a) - tooYoung(b)));
        hands.some(person => tryAct(household, { action: 'flee', entityId: person.id, take, refuge }));
      }
    }
  }

  /** The family's turn to think (every `THINK_EVERY` ticks, as the director's): the war, the store, then the director, then more ground. */
  function think(household) {
    const plan = plans[household.id];
    let projected = view(household.id);
    let acted = false;
    const tryAct = (household, input) => { const ok = tryActOuter(household, input); acted ||= ok; return ok; };
    const people = (projected.entities || []).filter(entity => entity.kind === 'person' && entity.householdId === household.id);
    const offered = (id, chore) => (projected.work?.[id] || []).some(entry => entry.id === chore && entry.can);
    // The war.
    if (plan.war === 'one' || plan.war === 'all') {
      const men = people.map(one => world.entities[one.id]).filter(person => person && alive(person) && !tooYoung(person) && canFight(person));
      const principal = world.entities[household.principalId];
      men.sort((a, b) => (a.id === principal?.id) - (b.id === principal?.id));
      const request = projected.request?.status === 'open' ? projected.request : null;
      const send = person => {
        const options = request?.answerers?.[person.id] || [];
        const can = id => options.some(option => option.id === id && option.can !== false);
        if (request?.kind === 'call' && can('turn-out')) return tryAct(household, { action: 'turn-out', entityId: person.id });
        if (request?.kind === 'march' && can('go-upriver')) return tryAct(household, { action: 'go-upriver', entityId: person.id });
        if (request?.kind === 'supplies' && can('help')) return tryAct(household, { action: 'help', entityId: person.id });
        if (request?.kind === 'rumor' && can('go-see')) return tryAct(household, { action: 'go-see', entityId: person.id });
        return SEND_CHORES.some(chore => offered(person.id, chore) && tryAct(household, { action: 'chore', entityId: person.id, chore }));
      };
      const free = men.filter(person => !engaged(person) && !person.travel);
      if (plan.war === 'all') for (const person of free) send(person);
      else if (!men.some(engaged)) for (const person of free) if (send(person)) break;
    }
    if (plan.war === 'none') {
      const request = projected.request?.status === 'open' ? projected.request : null;
      const say = { supplies: 'stay', rumor: 'stay-home', march: 'stay-in-town', call: 'stay-put' }[request?.kind];
      const who = request && (request.actorId || Object.keys(request.answerers || {})[0]);
      if (say && who) tryAct(household, { action: say, entityId: who });
    }
    // The store: food beyond three weeks' eating sold for coin (scripts/balance-study.mjs, the stay-home family's rule).
    if (plan.sell === 'yes') {
      const kept = eatenADay(world, household.members.map(id => world.entities[id])) * SELL_KEEP_DAYS + 6;
      if ((household.resources.food ?? 0) > kept + 6) {
        for (const person of people) {
          if (person.chore || person.travel || !offered(person.id, 'sell-food')) continue;
          if (tryAct(household, { action: 'chore', entityId: person.id, chore: 'sell-food' })) break;
        }
      }
    }
    // Cotton wants half again the seed a plot: fetched before the director would plant corn for want of it.
    if (plan.crop === 'cotton' && projected.household.field?.state === 'bare'
      && (household.resources.seed ?? 0) < COTTON_SEED_PER_PLOT * Math.max(1, projected.land?.cleared || 0)
      && !people.some(person => person.chore?.id === 'fetch-seed')) {
      for (const person of people) if (!person.chore && !person.travel && offered(person.id, 'fetch-seed') && tryAct(household, { action: 'chore', entityId: person.id, chore: 'fetch-seed' })) break;
    }
    // The director, with the strategy's word on what it may do, seeing the family as the orders above have left it.
    if (acted) projected = view(household.id);
    thinkFor(world, household, {
      project: () => projected,
      act: input => {
        const war = WAR.has(input.action) || (input.action === 'chore' && WAR_CHORES.has(input.chore));
        if (war && plan.war !== 'neighbour') throw new Error('the strategy decides the war');
        if (input.action === 'stay-put' && plan.war === 'all') throw new Error('the strategy decides the war');
        if (input.action === 'flee') throw new Error('the strategy decides the Scrape');
        if (input.action === 'answer-chore') {
          const ask = world.entities[input.entityId]?.chore?.ask?.id;
          if (ask === 'cotton-counter' && plan.sell === 'yes') input = { ...input, option: 'coin' };
          if (ask === 'crop-choice' && plan.crop === 'cotton') input = { ...input, option: 'cotton' };
        }
        applyAction(world, household.id, input);
      },
    });
    // More ground: past the director's three plots to six, a plot at a time, by the same survey a student sends.
    const land = projected.land || {};
    const plots = land.plots || [];
    if (plan.farm === 'hard' && land.grant && plots.length < HARD_PLOTS && !plots.some(plot => plot.state === 'staked')
      && !household.members.some(id => world.entities[id]?.chore?.id === 'survey-plot')) {
      const home = world.map.sites[household.homeSiteId];
      const hand = household.members.map(id => world.entities[id]).find(person => person && alive(person) && !tooYoung(person) && !person.chore && !person.travel && !person.service && person.task !== 'help' && person.location?.siteId === household.homeSiteId);
      if (hand && home && offered(hand.id, 'survey-plot')) surveyPlaces(home, land.grant?.bounds, plots).some(point => tryAct(household, { action: 'survey-plot', entityId: hand.id, ...point }));
    }
  }

  const run = period => {
    const from = world.tick;
    for (let t = 0; t < 20000 && !world.director.complete && world.status === 'running'; t++) {
      world.neighbours = false;
      try { stepWorld(world); } finally { world.neighbours = true; }
      households.forEach((household, index) => {
        if (household.arriving) return;
        quick(household);
        if ((world.tick + index) % THINK_EVERY === 0) think(household);
      });
      if (world.tick % 500 === 0) validateWorld(world);
    }
    return { period, ticks: world.tick - from, complete: Boolean(world.director.complete) };
  };
  const periods = [run(1)];
  beginSecondPeriod(world); world.status = 'running'; periods.push(run(2));
  beginThirdPeriod(world); world.status = 'running'; periods.push(run(3));
  for (const household of households) delete household.absent;
  validateWorld(world);
  const ending = hostEnding(world);

  // ---------------------------------------------------------------------------------------------- what each family finished with
  const byFinal = [...ending.families].sort((a, b) => b.final - a.final);
  const rankOf = final => 1 + byFinal.filter(family => family.final > final).length;
  const deathsAll = [];
  const families = ending.families.map(row => {
    const household = world.households[row.householdId];
    const members = household.members.map(id => world.entities[id]).filter(Boolean);
    const ledger = world.glory?.[household.id];
    const awards = Object.values(ledger?.awards || {});
    const byRole = {};
    for (const award of awards) byRole[award.role] = (byRole[award.role] || 0) + award.points;
    const dead = members.filter(person => person.health?.condition === 'dead');
    const captured = members.filter(person => person.health?.condition === 'captured');
    for (const person of dead) {
      const own = awards.filter(award => award.personId === person.id);
      deathsAll.push({ householdId: household.id, personId: person.id, sex: person.sex, points: own.reduce((sum, award) => sum + award.points, 0), roles: own.map(award => `${award.event}:${award.role}:${award.points}`) });
    }
    // Every award checked against the weight and the distance it was earned at: a death never adds to it.
    const overWeight = awards.filter(award => award.points > (GLORY_WEIGHT[award.role] || 0) * distanceMultiplier((award.miles ?? 0) + 0.05)).map(award => `${award.event}:${award.role}:${award.points}`);
    const coinEvents = world.events.filter(event => event.householdId === household.id && Number.isInteger(event.coin) && event.coin !== 0);
    const flight = household.flight;
    const means = household.means || {};
    const menAtStart = members.filter(person => canFight(person) && !tooYoung(person)).length; // ceiling: read at the end; a boy who came of age counts
    const miles = findPath(world.map, 'gonzales', household.homeSiteId)?.distance;
    const herd = herdOf(household);
    return {
      id: household.id, ...plans[household.id],
      means: { roll: means.roll ?? null, band: means.band ?? null, coin: means.coin ?? 0 },
      people: members.length, adults: members.filter(person => !tooYoung(person)).length, men: menAtStart,
      settlement: household.settlementId || null, miles: Number.isFinite(miles) ? Math.round(miles) : null,
      burnZone: Boolean(farmFate(world, household)), rolledCrop: rolledCrop[household.id],
      coin: row.money, glory: row.glory, land: row.land, final: row.final,
      rank: rankOf(row.final), winner: ending.winners.includes(household.id), winners: ending.winners.length,
      went: row.went.length, fought: awards.some(award => award.role === 'fought'), tookPart: awards.length > 0,
      warPart: awards.some(award => !['voted'].includes(award.role)),
      gloryByRole: byRole, negativeGlory: awards.filter(award => award.points < 0).reduce((sum, award) => sum + award.points, 0),
      negatives: awards.filter(award => award.points < 0).map(award => `${award.event}:${award.role}:${award.points}`),
      coinIn: coinEvents.filter(event => event.coin > 0).reduce((sum, event) => sum + event.coin, 0),
      coinOut: coinEvents.filter(event => event.coin < 0).reduce((sum, event) => sum - event.coin, 0),
      dead: dead.length, deadMen: dead.filter(person => person.sex !== 'female' && !tooYoung(person)).length, captured: captured.length,
      flight: flight?.status ?? null, burned: Boolean(flight?.burned), burnedBy: flight?.burnedBy?.hand || (flight?.burned ? 'texian' : null),
      stockLeftDriven: Boolean(household.herdLeft?.driven), herd: { cattle: herd.cattle || 0, hogs: herd.hogs || 0 },
      overWeight,
      // The owner's rule of 2026-09-16 (sim/family.mjs `canFight`): no woman is offered the fighting. Counted, never assumed.
      womenFought: awards.filter(award => award.role === 'fought' && world.entities[award.personId]?.sex === 'female').length,
      // The ground: how many plots the family had, and how many were cleared, at the end (burned or not).
      plots: (household.plots || []).length, cleared: (household.plots || []).filter(plot => plot.state !== 'staked').length,
      // Every award, compact - [part, miles from home, points] - so docs/BALANCE.md can show what other scorings would have
      // done with the same classes, without changing the rule.
      awards: awards.map(award => [award.role, award.miles ?? 0, award.points]),
    };
  });
  return {
    ...(keepWorld && { world }),
    seed, size, ticks: world.tick, periods, reachedEnding: periods.every(p => p.complete),
    winners: ending.winners, best: ending.best, families, deaths: deathsAll, seconds: (Date.now() - started) / 1000,
  };
}

// ------------------------------------------------------------------------------------------------ the analysis

const mean = list => (list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : null);
const round = (value, places = 3) => (value === null || !Number.isFinite(value) ? null : Math.round(value * 10 ** places) / 10 ** places);
const pct = (a, b) => (b ? round((100 * a) / b, 1) : null);

/** Wins counted fairly: a tie of k families gives each 1/k of the class. Expected: 1/size for every family. */
function groupStats(rows) {
  const n = rows.length;
  const wins = rows.reduce((sum, row) => sum + (row.winner ? 1 / row.winners : 0), 0);
  const expected = rows.reduce((sum, row) => sum + 1 / row.size, 0);
  return {
    families: n, wins: round(wins, 2), winPct: pct(wins, n), fairSharePct: pct(expected, n), winIndex: round(expected ? wins / expected : null, 2),
    top3Pct: pct(rows.filter(row => row.rank <= 3).length, n),
    meanPercentile: round(mean(rows.map(row => row.percentile)), 3),
    medianFinal: rows.length ? [...rows].map(row => row.final).sort((a, b) => a - b)[Math.floor(n / 2)] : null,
    meanCoin: round(mean(rows.map(row => row.coin)), 1), meanGlory: round(mean(rows.map(row => row.glory)), 1), meanLand: round(mean(rows.map(row => row.land)), 1),
    deathsPerFamily: round(mean(rows.map(row => row.dead)), 3),
    meanPlots: round(mean(rows.map(row => row.plots ?? 0)), 2), meanCleared: round(mean(rows.map(row => row.cleared ?? 0)), 2),
    meanCoinIn: round(mean(rows.map(row => row.coinIn)), 1),
  };
}
const by = (rows, key) => {
  const groups = {};
  for (const row of rows) (groups[key(row)] ??= []).push(row);
  return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, list]) => [k, groupStats(list)]));
};

/** Ordinary least squares, R² only: normal equations with a ridge of 1e-9 so a column that never varies does no harm. */
function rSquared(y, X) {
  const n = y.length, k = X[0]?.length ?? 0;
  const ybar = mean(y);
  const tss = y.reduce((sum, v) => sum + (v - ybar) ** 2, 0);
  if (!k) return 0;
  const cols = k + 1;
  const A = Array.from({ length: cols }, () => new Float64Array(cols)), b = new Float64Array(cols);
  for (let i = 0; i < n; i++) {
    const row = [1, ...X[i]];
    for (let p = 0; p < cols; p++) { b[p] += row[p] * y[i]; for (let q = 0; q < cols; q++) A[p][q] += row[p] * row[q]; }
  }
  for (let p = 0; p < cols; p++) A[p][p] += 1e-9;
  // Gaussian elimination with partial pivoting.
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < cols; c++) {
    let pivot = c;
    for (let r = c + 1; r < cols; r++) if (Math.abs(M[r][c]) > Math.abs(M[pivot][c])) pivot = r;
    [M[c], M[pivot]] = [M[pivot], M[c]];
    if (Math.abs(M[c][c]) < 1e-12) continue;
    for (let r = 0; r < cols; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      if (f) for (let q = c; q <= cols; q++) M[r][q] -= f * M[c][q];
    }
  }
  const beta = M.map((r, i) => (Math.abs(r[i]) < 1e-12 ? 0 : r[cols] / r[i]));
  let rss = 0;
  for (let i = 0; i < n; i++) { const row = [1, ...X[i]]; const fit = row.reduce((sum, v, p) => sum + v * beta[p], 0); rss += (y[i] - fit) ** 2; }
  return tss ? Math.max(0, 1 - rss / tss) : 0;
}

/** Each group's fair share of the variance explained (Shapley over the groups), and what no group explains. */
function shapley(y, groups) {
  const names = Object.keys(groups);
  const cache = new Map();
  const r2 = mask => {
    if (cache.has(mask)) return cache.get(mask);
    const chosen = names.filter((_, i) => mask & (1 << i));
    const X = y.map((_, row) => chosen.flatMap(name => groups[name][row]));
    const value = chosen.length ? rSquared(y, X) : 0;
    cache.set(mask, value);
    return value;
  };
  const m = names.length, fact = n => (n <= 1 ? 1 : n * fact(n - 1));
  const out = {};
  names.forEach((name, i) => {
    let total = 0;
    for (let mask = 0; mask < 1 << m; mask++) {
      if (mask & (1 << i)) continue;
      const s = [...Array(m).keys()].filter(j => mask & (1 << j)).length;
      total += (fact(s) * fact(m - s - 1) / fact(m)) * (r2(mask | (1 << i)) - r2(mask));
    }
    out[name] = round(total, 3);
  });
  const all = r2((1 << m) - 1);
  return { shares: out, explained: round(all, 3), unexplained: round(1 - all, 3) };
}

function analyse(classes) {
  const rows = classes.flatMap(one => one.families.map(family => ({
    ...family, size: one.size, seed: one.seed,
    percentile: one.size > 1 ? (family.rank - 1) / (one.size - 1) : 0,
  })));
  const nobody = rows.filter(row => row.war === 'none');
  const sentNobody = rows.filter(row => !row.warPart);
  const summary = {
    classes: classes.length, families: rows.length, bySize: Object.fromEntries([...new Set(classes.map(one => one.size))].map(size => [size, classes.filter(one => one.size === size).length])),
    allReachedEnding: classes.every(one => one.reachedEnding),
    winnersFought: pct(classes.filter(one => one.winners.some(id => one.families.find(f => f.id === id)?.fought)).length, classes.length),
    winnersSentNobody: pct(classes.filter(one => one.winners.some(id => !one.families.find(f => f.id === id)?.warPart)).length, classes.length),
  };
  const tables = {
    war: by(rows, row => row.war), sell: by(rows, row => row.sell), farm: by(rows, row => row.farm), crop: by(rows, row => row.crop), scrape: by(rows, row => row.scrape),
    warBySell: by(rows, row => `${row.war} / sell ${row.sell}`),
    warBySize: by(rows, row => `${String(row.size).padStart(2, '0')} families / ${row.war}`),
    outcome: by(rows, row => (row.fought ? 'fought in a battle' : row.warPart ? 'went to the war, never fought' : row.tookPart ? 'only voted' : 'took no part at all')),
    outcomeBySize: by(rows, row => `${String(row.size).padStart(2, '0')} families / ${row.warPart ? 'sent somebody' : 'sent nobody'}`),
    meansBand: by(rows, row => row.means.band || 'none'), meansCoin: by(rows, row => String(row.means.coin).padStart(2, '0')),
    burnZone: by(rows, row => (row.burnZone ? 'inside the burn zone' : 'outside the burn zone')),
    burnZoneByScrape: by(rows, row => `${row.burnZone ? 'inside' : 'outside'} / ${row.scrape}`),
    burned: by(rows, row => (row.burned ? `burned (${row.burnedBy})` : 'not burned')),
    deaths: by(rows, row => (row.dead ? 'a death in the family' : 'no death')),
    fightersByDeath: by(rows.filter(row => row.fought), row => (row.deadMen ? 'fought, and a man died' : 'fought, every man came home')),
    nobodySellers: by(nobody, row => `none / sell ${row.sell} / ${row.crop} / ${row.farm}`),
  };
  // Head to head: of every two families in one class with different war strategies, how often each finished above the other.
  const headToHead = {};
  for (const one of classes) {
    const fam = one.families;
    for (const a of fam) for (const b of fam) {
      if (a === b || a.war === b.war) continue;
      const key = `${a.war} vs ${b.war}`;
      const cell = headToHead[key] ??= { pairs: 0, above: 0 };
      cell.pairs++; if (a.final > b.final) cell.above++; else if (a.final === b.final) cell.above += 0.5;
    }
  }
  for (const cell of Object.values(headToHead)) cell.abovePct = pct(cell.above, cell.pairs);
  // Every combination of the five factors that ran at least ten times, best win index first: does any one dominate?
  const combos = Object.entries(by(rows, row => `${row.war} / sell ${row.sell} / ${row.farm} / ${row.crop} / ${row.scrape}`))
    .filter(([, stats]) => stats.families >= 10).sort((a, b) => b[1].winIndex - a[1].winIndex);

  // How much of where a family finished each thing explains (Shapley over groups of columns), on two measures: the place in the
  // class (0 first, 1 last) and log of the final number less the class's mean of it.
  const levels = (row, factor) => FACTORS[factor].slice(1).map(level => (row[factor] === level ? 1 : 0));
  const bands = ['hard-up', 'poor', 'modest', 'comfortable', 'well-to-do'];
  const settlements = [...new Set(rows.map(row => row.settlement))].sort();
  const groups = {
    'means die': rows.map(row => [row.means.coin, ...bands.slice(1).map(band => (row.means.band === band ? 1 : 0))]),
    'family die': rows.map(row => [row.people, row.adults, row.men]),
    choices: rows.map(row => Object.keys(FACTORS).flatMap(factor => levels(row, factor))),
    'where the land fell': rows.map(row => [row.miles ?? 0, row.burnZone ? 1 : 0, ...settlements.slice(1).map(s => (row.settlement === s ? 1 : 0))]),
    fates: rows.map(row => [row.dead, row.deadMen, row.captured, row.burned ? 1 : 0, row.stockLeftDriven ? 1 : 0, row.negativeGlory]),
  };
  const classMeanLog = {};
  for (const one of classes) classMeanLog[one.seed] = mean(one.families.map(f => Math.log(f.final)));
  const variance = {
    percentile: shapley(rows.map(row => row.percentile), groups),
    logFinalWithinClass: shapley(rows.map(row => Math.log(row.final) - classMeanLog[row.seed]), groups),
  };
  // The means die with every choice held level: families of one strategy on the war and the store, by the coin they came with.
  const meansWithinStrategy = by(rows, row => `${row.war} / sell ${row.sell} / ${row.means.coin <= 4 ? 'came with 3-4' : row.means.coin <= 6 ? 'came with 5-6' : 'came with 7-10'}`);
  // Glory and death: every award against its weight, and the glory of the dead against the living who took the same part.
  const deaths = classes.flatMap(one => one.deaths);
  const overWeight = rows.flatMap(row => row.overWeight.map(award => `${row.seed}/${row.id}: ${award}`));
  const glory = {
    awardsOverTheirWeight: overWeight.length, examples: overWeight.slice(0, 10),
    womenWhoFought: rows.reduce((sum, row) => sum + (row.womenFought || 0), 0),
    deathsBySex: deaths.reduce((count, d) => ({ ...count, [d.sex || 'unknown']: (count[d.sex || 'unknown'] || 0) + 1 }), {}),
    deaths: deaths.length, deadWithAnyGlory: deaths.filter(d => d.points > 0).length,
    meanGloryOfTheDead: round(mean(deaths.map(d => d.points)), 2),
  };
  // How far a family that sends nobody finished from first: its final number as a share of the winner's, over every such family
  // and over the best of them in each class.
  const quantiles = list => { const s = [...list].sort((a, b) => a - b); const q = p => (s.length ? round(s[Math.min(s.length - 1, Math.floor(p * s.length))], 4) : null); return { n: s.length, min: q(0), p25: q(0.25), median: q(0.5), p75: q(0.75), p90: q(0.9), max: s.length ? round(s.at(-1), 4) : null }; };
  const bestOf = seed => classes.find(one => one.seed === seed).best;
  const bestNobody = classes.map(one => one.families.filter(f => f.war === 'none')).filter(list => list.length).map(list => list.reduce((a, b) => (b.final > a.final ? b : a)));
  const nobodyGap = {
    everyFamily: quantiles(nobody.map(row => row.final / bestOf(row.seed))),
    bestInEachClass: quantiles(bestNobody.map(f => f.final / bestOf(classes.find(one => one.families.includes(f)).seed))),
    bestInEachClassRank: quantiles(bestNobody.map(f => f.rank)),
    sellersBestFinal: Math.max(0, ...nobody.filter(row => row.sell === 'yes').map(row => row.final)),
    // What a family that sends nobody would need to multiply its coin by, at no glory, to draw level with its class's winner.
    coinNeededMedian: quantiles(nobody.map(row => bestOf(row.seed) / Math.max(1, row.coin))).median,
  };
  // What other scorings would have made of the very same classes: **a reading for the owner, never a rule** (nothing in the game
  // changes). Families are held to what they did; a class that knew the scoring was different might play differently, which
  // this cannot show. The distance rescorings take each award's points back through its own multiplier (`distanceMultiplier`
  // on the award's recorded miles, kept to a tenth of a mile, so an award within 0.05 miles of a fifteen-mile step may be read
  // one step out).
  const floorCoin = row => Math.max(1, row.coin);
  const reglory = (row, cap) => row.awards.reduce((sum, [, miles, points]) => { const mult = distanceMultiplier(miles); return sum + (points * Math.min(mult, cap)) / mult; }, 0);
  const SCORINGS = {
    'as built: coin x (1 + glory) + land': row => row.final,
    'distance multiplier capped at x3': row => floorCoin(row) * (1 + Math.max(0, reglory(row, 3))) + row.land,
    'no distance multiplier': row => floorCoin(row) * (1 + Math.max(0, reglory(row, 1))) + row.land,
    'glory divided by 10': row => floorCoin(row) * (1 + Math.max(0, row.glory) / 10) + row.land,
    'square root of glory': row => floorCoin(row) * (1 + Math.sqrt(Math.max(0, row.glory))) + row.land,
    'coin + glory + land, added': row => floorCoin(row) + Math.max(0, row.glory) + row.land,
  };
  const rescored = {};
  for (const [name, score] of Object.entries(SCORINGS)) {
    const wins = {}, count = {}, top3 = {};
    let classesNobodyWon = 0;
    for (const one of classes) {
      const scored = one.families.map(f => ({ f, s: score(f) }));
      const best = Math.max(...scored.map(x => x.s));
      const winners = scored.filter(x => x.s === best);
      if (winners.some(x => x.f.war === 'none')) classesNobodyWon++;
      for (const { f, s } of scored) {
        count[f.war] = (count[f.war] || 0) + 1;
        if (s === best) wins[f.war] = (wins[f.war] || 0) + 1 / winners.length;
        if (1 + scored.filter(x => x.s > s).length <= 3) top3[f.war] = (top3[f.war] || 0) + 1;
      }
    }
    rescored[name] = {
      classesWonBySendsNobody: pct(classesNobodyWon, classes.length),
      winPctByWar: Object.fromEntries(FACTORS.war.map(w => [w, pct(wins[w] || 0, count[w] || 0)])),
      top3PctByWar: Object.fromEntries(FACTORS.war.map(w => [w, pct(top3[w] || 0, count[w] || 0)])),
    };
  }
  // Where glory was taken away, by the event and part it was taken for.
  const negatives = {};
  for (const row of rows) for (const n of row.negatives) { const [event, role] = n.split(':'); const key = `${event}:${role} (${row.war})`; negatives[key] = (negatives[key] || 0) + 1; }
  return { summary, tables, headToHead, combos: combos.slice(0, 15), worstCombos: combos.slice(-8), variance, meansWithinStrategy, glory, nobodyGap, rescored, negatives, nobodyCount: nobody.length, sentNobodyCount: sentNobody.length };
}

/** The record as written: the analysis indented to be read, and each class on one line of its own (4 MB indented, far less so). */
export function recordText(record) {
  const { classes, ...head } = record;
  const lines = classes.map(one => `  ${JSON.stringify(one)}`).join(',\n');
  return `${JSON.stringify({ ...head, classes: '@@classes@@' }, null, 1).replace('"@@classes@@"', `[\n${lines}\n ]`)}\n`;
}

// ------------------------------------------------------------------------------------------------ running it

if (!isMainThread) {
  parentPort.on('message', async job => {
    if (job === 'stop') { process.exit(0); }
    try { parentPort.postMessage({ index: job.index, result: await runClass(job) }); }
    catch (error) { parentPort.postMessage({ index: job.index, error: `${error.stack || error}` }); }
  });
} else if (process.argv[1] && fileURLToPath(import.meta.url) === (await import('node:path')).resolve(process.argv[1])) {
  const arg = (name, fallback) => { const at = process.argv.indexOf(`--${name}`); return at >= 0 ? process.argv[at + 1] : fallback; };
  const sizes = arg('sizes', '5,15,30').split(',').map(Number);
  const counts = arg('classes', '100,70,40').split(',').map(Number);
  const workers = Number(arg('workers', Math.max(1, Math.min(20, cpus().length - 2))));
  const out = arg('out', 'docs/evidence/balance-measure.json');
  const jobs = sizes.flatMap((size, s) => Array.from({ length: counts[s] ?? counts[0] }, (_, i) => ({ seed: `measure-${size}-${i}`, size })))
    // The big classes first, so the pool is not left waiting on one at the end.
    .sort((a, b) => b.size - a.size).map((job, index) => ({ ...job, index }));
  // The design is crossed or the measure means nothing: refuse to run if any two factors travel together.
  const crossed = independence(jobs);
  console.log('factors crossed, worst cell off its expected count by:', JSON.stringify(crossed.worstCellDeviation));
  // Only a run big enough to judge by: fifteen families cannot fill ninety-six cells.
  if (crossed.families >= 500 && Object.values(crossed.worstCellDeviation).some(off => off > 0.3)) throw new Error('The strategies are not dealt independently; refusing to run.');
  const results = new Array(jobs.length);
  const began = Date.now();
  let next = 0, done = 0;
  await new Promise((resolve, reject) => {
    const pool = Array.from({ length: Math.min(workers, jobs.length) }, () => new Worker(fileURLToPath(import.meta.url)));
    const feed = worker => { if (next < jobs.length) worker.postMessage(jobs[next++]); else worker.postMessage('stop'); };
    for (const worker of pool) {
      worker.on('message', ({ index, result, error }) => {
        if (error) { reject(new Error(`${jobs[index].seed}: ${error}`)); return; }
        results[index] = result; done++;
        const r = result;
        console.log(`[${done}/${jobs.length}] ${r.seed}: ${r.ticks} ticks, ${r.seconds.toFixed(0)} s, winner ${r.winners.join('+')} at ${r.best} (${r.families.filter(f => r.winners.includes(f.id)).map(f => `${f.war}/${f.sell}/${f.scrape}`).join(', ')})${r.reachedEnding ? '' : ' ENDING NOT REACHED'}`);
        if (done === jobs.length) resolve();
        feed(worker);
      });
      worker.on('error', reject);
      feed(worker);
    }
  });
  const classes = results.sort((a, b) => (a.size - b.size) || (Number(a.seed.split('-').at(-1)) - Number(b.seed.split('-').at(-1))));
  const analysis = analyse(classes);
  const runtime = {
    wallSeconds: Math.round((Date.now() - began) / 1000), workers,
    cpuSecondsBySize: Object.fromEntries(sizes.map(size => [size, Math.round(classes.filter(c => c.size === size).reduce((sum, c) => sum + c.seconds, 0))])),
    meanSecondsPerClassBySize: Object.fromEntries(sizes.map(size => [size, round(mean(classes.filter(c => c.size === size).map(c => c.seconds)), 1)])),
  };
  console.log(JSON.stringify({ summary: analysis.summary, war: analysis.tables.war, variance: analysis.variance, glory: analysis.glory, runtime }, null, 1));
  mkdirSync('docs/evidence', { recursive: true });
  // Runtime is the one thing that differs between two runs of the same arguments, so it sits apart at the end.
  writeFileSync(out, recordText({
    record: 'The balance measure: docs/MONEY_AND_GLORY.md §8, docs/BALANCE.md', date: new Date().toISOString().slice(0, 10),
    command: `node scripts/balance-measure.mjs --sizes ${sizes.join(',')} --classes ${counts.join(',')}`,
    factors: FACTORS, hardPlots: HARD_PLOTS, lateDays: LATE_DAYS, sellKeepDays: SELL_KEEP_DAYS, crossed,
    ...analysis,
    classes: classes.map(({ seconds, ...one }) => one),
    runtime,
  }));
  console.log(`wrote ${out}`);
}
