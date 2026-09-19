// The balance study: docs/MONEY_AND_GLORY.md §8, run once the whole war is built (2026-09-16).
//
// Plays whole classes of families nobody plays - every family run by sim/neighbours.mjs - through all three periods, arrival
// to April 25, 1836, and one family in each class by a stay-home policy: it never sends anybody to anything, harvests and
// sells every bale of cotton for coin, and flees when told. Then it reports, per class and over all of them, every family's
// coin, glory, land and final number, who finished first and whether they ever fought, and what the stay-home family reached.
//
// The owner's rule (2026-09-16): staying home and selling should be "a possible, but unlikely way to win".
//
// Run: node scripts/balance-study.mjs [seeds] [families]  → writes docs/evidence/balance-study.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { hostEnding } from '../sim/ending.mjs';
import { thinkFor } from '../sim/neighbours.mjs';

const seeds = Number(process.argv[2] || 6), families = Number(process.argv[3] || 15);
const view = (world, id) => projectWorld(world, id, 'student', { includeMap: false });

/**
 * The stay-home family: run by the neighbours' own director (sim/neighbours.mjs thinkFor), which farms, builds and trades as
 * a family nobody plays does, with two changes a student could make: nobody is ever sent to a call, the army, the garrison, the
 * expedition or Houston, and every bale of cotton at the counter is sold for coin rather than food.
 */
const WAR = new Set(['turn-out', 'go-upriver', 'go-see', 'help', 'detachment-go', 'send-for']);
const WAR_CHORES = new Set(['enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros', 'join-relief', 'join-houston']);
function stayHome(world, household) {
  // What a student keeping the family home would also do: sell the food the family can spare for coin, three weeks kept back.
  const projected = view(world, household.id);
  const kept = 0.35 * household.members.length * 21 + 6;
  if ((household.resources.food ?? 0) > kept + 6) {
    for (const person of projected.entities.filter(e => e.kind === 'person' && e.householdId === household.id && !e.chore && !e.travel)) {
      if (!(projected.work?.[person.id] || []).some(entry => entry.id === 'sell-food' && entry.can)) continue;
      let sent = false;
      for (const mode of ['wagon', 'horse', undefined]) { try { applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'sell-food', ...(mode && { mode }) }); sent = true; break; } catch { /* the next way */ } }
      if (sent) break;
    }
  }
  thinkFor(world, household, {
    project: id => view(world, id),
    act: input => {
      if (WAR.has(input.action) || (input.action === 'chore' && WAR_CHORES.has(input.chore))) throw new Error('stays home');
      if (input.action === 'army-answer') input = { ...input, answer: 'no' };
      if (input.action === 'answer-chore' && input.option === 'food' && world.entities[input.entityId]?.chore?.ask?.id === 'cotton-counter') input = { ...input, option: 'coin' };
      applyAction(world, household.id, input);
    },
  });
}

const classes = [];
for (let s = 0; s < seeds; s++) {
  const seed = `balance-${s}`;
  const world = createGonzalesWorld(seed, families, { map: 'colonies', neighbours: true });
  const home = world.households['hh-1'];
  home.played = true;
  world.status = 'running';
  // The director's town errands are listed only for a family it runs (sim/chores.mjs `directed`). This one is marked played so
  // the class's own director leaves it to this policy, and is let see them while the policy thinks: a student reaches the same
  // counters through the shops at the same prices (sim/shops.mjs). Without it, from 2026-09-17 the family never sold a bale.
  const policy = () => { home.absent = true; try { stayHome(world, home); } finally { delete home.absent; } };
  const run = () => { for (let t = 0; t < 12000 && !world.director.complete && world.status === 'running'; t++) { stepWorld(world); if (world.tick % 3 === 0) policy(); } };
  run();
  beginSecondPeriod(world); world.status = 'running'; run();
  beginThirdPeriod(world); world.status = 'running'; run();
  const ending = hostEnding(world);
  const fought = id => Object.values(world.glory?.[id]?.awards || {}).some(award => award.role === 'fought');
  const rows = ending.families.map(f => ({ id: f.householdId, coin: f.money, glory: f.glory, land: f.land, final: f.final, fought: fought(f.householdId), went: f.went.length, stayHome: f.householdId === home.id, dead: world.households[f.householdId].members.filter(id => world.entities[id].health.condition === 'dead').length }));
  const sorted = [...rows].sort((a, b) => b.final - a.final);
  const stay = rows.find(r => r.stayHome);
  classes.push({ seed, ticks: world.tick, first: sorted[0], stayHome: stay, stayRank: sorted.findIndex(r => r.stayHome) + 1, families: rows, cottonSold: world.events.filter(e => e.householdId === home.id && /sold \d+ cotton.*reales?/.test(e.text)).length });
  console.log(`${seed}: first ${sorted[0].id} at ${sorted[0].final} (fought ${sorted[0].fought}); stay-home ${stay.final} = ${stay.coin} coin, ${stay.glory} glory, ${stay.land} land, rank ${classes.at(-1).stayRank}/${rows.length}, sold ${classes.at(-1).cottonSold} loads`);
}
const all = classes.flatMap(c => c.families);
const summary = {
  classes: classes.length, families: all.length,
  stayHomeWins: classes.filter(c => c.stayRank === 1).length,
  stayHomeFinals: classes.map(c => c.stayHome.final),
  stayHomeRanks: classes.map(c => c.stayRank),
  firstFinals: classes.map(c => c.first.final),
  fought: { count: all.filter(f => f.fought).length, finals: all.filter(f => f.fought).map(f => f.final).sort((a, b) => a - b) },
  stayed: { count: all.filter(f => !f.went).length, finals: all.filter(f => !f.went).map(f => f.final).sort((a, b) => a - b) },
  deaths: all.reduce((sum, f) => sum + f.dead, 0),
};
console.log(JSON.stringify(summary, null, 1));
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/balance-study.json', `${JSON.stringify({ record: 'The balance study over three periods: docs/MONEY_AND_GLORY.md §8', date: new Date().toISOString().slice(0, 10), summary, classes }, null, 2)}\n`);
