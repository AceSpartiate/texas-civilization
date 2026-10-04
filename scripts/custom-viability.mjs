// Is the game still playable when a family is short of one sex? (owner, 2026-10-04: "once gendered work is in, check for
// viability of game play. is it too hard to play if your family doesn't have enough of a certain gender? propose fixes for each
// issue you may come accross."; docs/CUSTOMARY_WORK.md, docs/BALANCE.md §23). Measures only; nothing here changes a rule.
//
// Whole classes of fifteen, every family played, all three periods, on the real land - the hunger harness's way of running a class
// (scripts/hunger-balance.mjs) - with eleven of the fifteen families **built to a shape** the roll allows (the rest rolled as dealt):
//
//   manyDaughters    father, mother and five girls (14, 12, 9, 6, 3)
//   fatherGirls      a lone father and four girls (13, 11, 8, 5)
//   fatherBoys       a lone father and four boys (17, 14, 11, 7)
//   motherSmall      a lone mother and four children all under ten (8, 6, 4, 1)
//   motherSon16      a lone mother, a son of 16 and three younger (12, 8, 5)
//   warHome          father, mother, a son of 17 and three girls (14, 11, 7); father and son sent to enlist in the winter
//   son16Home        father, mother, a son of 16, a girl of 13, a boy of 9 and a girl of 4; only the father sent to enlist
//   fatherBaby       a lone father and three infants (4, 2, 0)
//   oneManManyWomen  father, mother and five girls (21, 19, 17, 14, 11): one grown man, four grown women
//   oneWomanManyMen  father, mother and five boys (21, 19, 17, 14, 11): one grown woman, four grown men
//   twoParentMixed   father, mother, a boy of 13, a girl of 11, a boy of 8, a girl of 4: the baseline
//
// Built as the tests build families: the family is rolled (its means, wagons and arrival as dealt), then its people are put in place
// of the rolled ones, each with the hidden stats `dealTraits` deals for their sex and age. Which household gets which shape turns with
// the seed, so no shape always has the same land.
//
// Two kinds of student (`--mode`):
//   playing   plays as the director plays a family nobody plays (sim/neighbours.mjs `thinkFor`), the hunger harness's *playing*.
//   nohouse   the same, but never finds Keep house, the wash or the garden: those three are taken off what the student sees.
//
// For each family: the day the house was roofed; plots cleared, sown and harvested; food at each period's end; hunger and deaths by
// cause; coin, the final number and rank; arrivals in town with clothes that want washing and the remarks; and the **stuck moments**,
// read after every turn the family takes: a person of ten or more at home, able and given nothing, while some work the custom alone
// keeps from them is there to do (asked of `choreAvailability` as it is, and again with the work's keepers counted away); the time
// each sex and age spends at men's, women's, shared or no work. `--root` runs the same against another tree (main before the custom).
//
// Run one class:   node scripts/custom-viability.mjs --seed viab-1 --mode playing [--root <dir>] [--out file.json]
// Run the study:   node scripts/custom-viability.mjs --study --seeds viab-1,...,viab-6 --before <dir> --jobs 9 --out docs/evidence/custom-viability.json
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const arg = (name, fallback) => { const at = process.argv.indexOf(`--${name}`); return at > 0 ? process.argv[at + 1] : fallback; };
const flag = name => process.argv.includes(`--${name}`);
const DAY = 1440;

// The works by custom, as sim/custom.mjs has them (written here so the tree before the custom is tallied the same way).
const MENS = ['survey-plot', 'cut-lane', 'fence-yard', 'fence-plot', 'dig-well', 'clear-plot', 'build-house', 'help-raise', 'fell-trees', 'haul-logs', 'fetch-logs', 'make-carreta', 'make-furniture', 'hunt-timber', 'hunt-land', 'take-small-game', 'practise-shooting', 'cut-bee-tree', 'butcher-beef'];
const WOMENS = ['keep-house', 'work-garden', 'wash-clothes', 'nurse-home'];
// The works a family needs done, by kind, for the stuck count (practice at the mark, furniture and the carreta are not needs).
const NEED = {
  build: ['build-house', 'fell-trees', 'fetch-logs'],
  ground: ['clear-plot', 'fence-plot', 'survey-plot', 'cut-lane', 'dig-well', 'fence-yard'],
  hunt: ['hunt-land', 'hunt-timber', 'take-small-game', 'cut-bee-tree', 'butcher-beef'],
  house: ['keep-house', 'work-garden', 'wash-clothes', 'nurse-home'],
};
const NEEDED = Object.values(NEED).flat();
const needKind = id => Object.keys(NEED).find(kind => NEED[kind].includes(id));
const customKind = id => (!id ? 'none' : MENS.includes(id) ? 'mens' : WOMENS.includes(id) ? 'womens' : 'shared');

// [role, sex, age]: parents have ages too, so the custom reads them by age like everybody else.
const SHAPES = {
  manyDaughters: [['father', 38], ['mother', 35], ['daughter', 14], ['daughter', 12], ['daughter', 9], ['daughter', 6], ['daughter', 3]],
  fatherGirls: [['father', 36], ['daughter', 13], ['daughter', 11], ['daughter', 8], ['daughter', 5]],
  fatherBoys: [['father', 40], ['son', 17], ['son', 14], ['son', 11], ['son', 7]],
  motherSmall: [['mother', 30], ['son', 8], ['daughter', 6], ['son', 4], ['daughter', 1]],
  motherSon16: [['mother', 38], ['son', 16], ['daughter', 12], ['son', 8], ['daughter', 5]],
  warHome: [['father', 42], ['mother', 39], ['son', 17], ['daughter', 14], ['daughter', 11], ['daughter', 7]],
  son16Home: [['father', 40], ['mother', 37], ['son', 16], ['daughter', 13], ['son', 9], ['daughter', 4]],
  fatherBaby: [['father', 28], ['son', 4], ['daughter', 2], ['son', 0]],
  oneManManyWomen: [['father', 45], ['mother', 42], ['daughter', 21], ['daughter', 19], ['daughter', 17], ['daughter', 14], ['daughter', 11]],
  oneWomanManyMen: [['father', 45], ['mother', 42], ['son', 21], ['son', 19], ['son', 17], ['son', 14], ['son', 11]],
  twoParentMixed: [['father', 36], ['mother', 33], ['son', 13], ['daughter', 11], ['son', 8], ['daughter', 4]],
};
// Who is sent to enlist in the winter, by shape: the father, and in warHome every son of sixteen or more too.
const ENLIST = { warHome: person => ['father', 'son'].includes(person.kin?.role) && (person.age ?? 30) >= 16, son16Home: person => person.kin?.role === 'father' };
const SEX = { father: 'male', son: 'male', mother: 'female', daughter: 'female' };
const ORDER = [...Object.keys(SHAPES), 'rolled', 'rolled', 'rolled', 'rolled'];

if (flag('study')) await study(); else await one();

async function one() {
  const root = resolve(arg('root', '.'));
  const seed = arg('seed', 'viab-1');
  const seedIndex = Number(arg('index', '0'));
  const mode = arg('mode', 'playing');
  const families = Number(arg('families', '15'));
  const out = arg('out', null);
  const row = await runClass({ root, seed, seedIndex, mode, families });
  const text = JSON.stringify(row);
  if (out) { mkdirSync(dirname(resolve(out)), { recursive: true }); writeFileSync(out, `${text}\n`); } else console.log(text);
}

async function runClass({ root, seed, seedIndex, mode, families }) {
  const started = Date.now();
  const load = async path => (existsSync(resolve(root, path)) ? import(pathToFileURL(resolve(root, path)).href) : {});
  const { createGonzalesWorld } = await load('sim/gonzales.mjs');
  const { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } = await load('sim/world.mjs');
  const { beginSecondPeriod, beginThirdPeriod } = await load('sim/periods.mjs');
  const { THINK_EVERY, thinkFor } = await load('sim/neighbours.mjs');
  const { houseSettled } = await load('sim/houses.mjs');
  const { sownPlots } = await load('sim/fields.mjs');
  const { dealTraits, obedienceRoll } = await load('sim/family.mjs');
  const { hostEnding } = await load('sim/ending.mjs');
  const { seatTheCompany } = await load('sim/settling.mjs');
  const { choreAvailability, homeWork } = await load('sim/chores.mjs');
  // Only on a tree with the custom: the rule, and the wash.
  const custom = await load('sim/custom.mjs');
  const housework = await load('sim/housework.mjs');
  const hasCustom = Boolean(custom.keepers);

  const world = createGonzalesWorld(seed, families, { map: 'colonies', neighbours: true });
  const households = Object.values(world.households);
  const shapeOf = new Map();
  households.forEach((household, k) => {
    rollFamily(world, household); household.played = true;
    const shape = ORDER[(k + 3 * seedIndex) % ORDER.length];
    if (shape !== 'rolled') reshape(world, household, SHAPES[shape]);
    shapeOf.set(household.id, shape === 'rolled' ? rolledShape(world, household) : shape);
  });
  try { validateWorld(world); } catch (error) { throw new Error(`reshaped world invalid: ${error.message}`); }
  world.status = 'running';

  function reshape(world, household, spec) {
    const template = world.entities[household.members[0]];
    for (const id of household.members) delete world.entities[id];
    household.members = [];
    const day = new Date(Date.UTC(1835, 8, 28));
    const counts = { parent: 0, child: 0 };
    const ids = spec.map(([role]) => (['father', 'mother'].includes(role) ? `${household.id}-parent-${++counts.parent}` : `${household.id}-child-${++counts.child}`));
    const parentIds = ids.filter((id, j) => ['father', 'mother'].includes(spec[j][0]));
    const childIds = ids.filter((id, j) => !['father', 'mother'].includes(spec[j][0]));
    spec.forEach(([role, age], j) => {
      const id = ids[j], sex = SEX[role], parent = ['father', 'mother'].includes(role);
      const person = structuredClone(template);
      const born = new Date(day.getTime() - Math.round((age + 0.4) * 365.2425) * 86400000).toISOString().slice(0, 10);
      Object.assign(person, {
        id, sex, age, born, principal: j === 0, depth: j === 0 ? 'detailed' : 'moderate', name: `${role[0].toUpperCase()}${role.slice(1)} ${j + 1} ${household.id}`,
        given: `${role[0].toUpperCase()}${role.slice(1)}${j + 1}`,
        traits: { ...dealTraits(seed, id, sex, age), ...(!parent && obedienceRoll && { obedience: obedienceRoll(seed, id) }) },
        kin: parent ? { role, spouse: parentIds.find(other => other !== id) || null, parents: [], children: childIds } : { role, spouse: null, parents: parentIds, children: [] },
        task: person.travel ? 'travel' : age >= 16 ? 'work' : 'rest', relationships: {}, commitments: [], chore: null,
      });
      if (person.travel?.settle) person.travel.settle.task = age >= 16 ? 'work' : 'rest';
      person.location = { ...template.location, x: (template.location.x ?? 0) + j * 0.004 };
      world.entities[id] = person;
      household.members.push(id);
    });
    household.principalId = household.members[0];
    delete household.mainId;
    // The roll read on a table that makes this family (the size table makes no lone parent of more than two children; the faces
    // table of 2026-09-14 makes one of up to four), so the world still validates.
    if (parentIds.length === 1) { delete household.rollTable; household.roll = 1 + childIds.length; } else household.roll = spec.length;
    try { seatTheCompany?.(world, household); } catch { /* the seats as they were */ }
  }
  function rolledShape(world, household) {
    const people = household.members.map(id => world.entities[id]);
    const has = role => people.some(person => person.kin?.role === role);
    return has('father') && has('mother') ? 'rolledBoth' : has('mother') ? 'rolledMother' : 'rolledFather';
  }

  // The student's view: `nohouse` never sees keeping house, the wash or the garden.
  const HIDDEN = new Set(['keep-house', 'wash-clothes', 'work-garden']);
  const project = id => {
    const view = projectWorld(world, id, 'student', { includeMap: false });
    if (mode === 'nohouse' && view.work) for (const key of Object.keys(view.work)) view.work[key] = view.work[key].filter(entry => !HIDDEN.has(entry.id));
    return view;
  };

  const alive = person => person && !['dead', 'captured'].includes(person.health?.condition);
  const atHomeFree = (household, person) => alive(person) && !person.travel && !person.service && !person.visiting && person.task !== 'help'
    && person.location?.siteId === household.homeSiteId && !person.health?.grave && person.health?.condition !== 'sick' && person.health?.condition !== 'wounded';
  const groupOf = person => {
    const age = person.age ?? 30, male = (person.sex || SEX[person.kin?.role]) === 'male';
    if (age >= 16) return male ? 'men' : 'women';
    if (age >= 10) return male ? 'boys' : 'girls';
    return null;
  };

  const start = world.minute;
  const fam = new Map(households.map(household => [household.id, {
    shape: shapeOf.get(household.id), people: household.members.length, roofedDay: null, food: {}, plots: {}, sown: {}, harvests: 0, harvestFood: 0, harvestCotton: 0,
    worst: 0, hungryDays: 0, deaths: [], enlisted: [], enlistDay: null, sonAtHomeWhileFatherAway: 0,
    // Person-minutes at each kind of work, by group, sampled after each of the family's turns.
    time: Object.fromEntries(['men', 'women', 'boys', 'girls'].map(group => [group, { mens: 0, womens: 0, shared: 0, none: 0 }])),
    // Stuck: person-minutes given nothing while a custom-only-refused need was there; family-minutes with any such person;
    // family-minutes where a need was refused by custom to every free person and nobody could begin it; by need.
    stuckPerson: { men: 0, women: 0, boys: 0, girls: 0 }, stuckFamily: 0, hiddenAll: 0, stuckBy: { build: 0, ground: 0, hunt: 0, house: 0 }, hiddenBy: { build: 0, ground: 0, hunt: 0, house: 0 },
    // Time a single man did men's work while somebody was stuck behind him.
    queuedBehindOne: 0, homeMinutes: 0,
    // The wash: arrivals in a town, with clothes that wanted washing; remarks; coin a dirty person spent or took (markup that a
    // student's errand would add); the share of the time the family's people at home were dirty.
    townArrivals: 0, dirtyArrivals: 0, remarks: 0, dirtyCoinOut: 0, dirtyCoinIn: 0, dirtyMinutes: 0, personMinutes: 0, washes: 0, keptDays: 0, gardenDays: 0,
    // The same by period (the war shapes are read for the winter and the spring, the father away).
    per: {},
    lastSample: null,
  }]));
  const perOf = (tally, period) => (tally.per[period] ??= { home: 0, stuckFamily: 0, hiddenAll: 0, queuedBehindOne: 0, stuckPerson: { men: 0, women: 0, boys: 0, girls: 0 },
    time: Object.fromEntries(['men', 'women', 'boys', 'girls'].map(group => [group, { mens: 0, womens: 0, shared: 0, none: 0 }])) });
  const RANK = { hungry: 1, weak: 2, starving: 3 };
  const seen = new Set();
  const inTown = new Map();
  let currentPeriod = 1;

  function sample(household) {
    const tally = fam.get(household.id);
    const minutes = tally.lastSample === null ? THINK_EVERY * 20 : world.minute - tally.lastSample;
    tally.lastSample = world.minute;
    if (!(minutes > 0) || household.arriving || (household.flight && household.flight.status !== 'home')) return;
    tally.homeMinutes += minutes;
    const per = perOf(tally, currentPeriod);
    per.home += minutes;
    const people = household.members.map(id => world.entities[id]).filter(alive);
    const home = people.filter(person => atHomeFree(household, person) || (person.chore && homeWork?.(person.chore.id) && alive(person) && !person.service));
    for (const person of home) {
      const group = groupOf(person);
      if (group) { tally.time[group][customKind(person.chore?.id)] += minutes; per.time[group][customKind(person.chore?.id)] += minutes; }
    }
    if (!hasCustom) return;
    const free = home.filter(person => !person.chore && groupOf(person) && atHomeFree(household, person));
    const stuckWorks = new Set(), stuckPeople = [];
    for (const person of free) {
      let stuck = false;
      for (const id of NEEDED) {
        if (mode === 'nohouse' && HIDDEN.has(id)) continue;
        const said = choreAvailability(world, household, person, id);
        if (said.can || !said.custom) continue;
        // Asked again with the work's keepers counted away: refused by the custom alone?
        const keepers = custom.keepers(world, household, said.custom === 'men' ? 'male' : 'female', homeWork);
        for (const keeper of keepers) keeper.visiting = true;
        let again;
        try { again = choreAvailability(world, household, person, id); } finally { for (const keeper of keepers) delete keeper.visiting; }
        if (again.can) { stuck = true; stuckWorks.add(id); }
      }
      if (stuck) { stuckPeople.push(person); tally.stuckPerson[groupOf(person)] += minutes; per.stuckPerson[groupOf(person)] += minutes; }
    }
    if (stuckPeople.length) {
      tally.stuckFamily += minutes; per.stuckFamily += minutes;
      const kinds = new Set([...stuckWorks].map(needKind));
      for (const kind of kinds) tally.stuckBy[kind] += minutes;
      // Nobody free may begin it at all: refused by custom to every free person, its keepers all at other work.
      const hidden = [...stuckWorks].filter(id => !free.some(person => choreAvailability(world, household, person, id).can));
      if (hidden.length) { tally.hiddenAll += minutes; per.hiddenAll += minutes; for (const kind of new Set(hidden.map(needKind))) tally.hiddenBy[kind] += minutes; }
      const menOnMens = home.filter(person => groupOf(person) === 'men' && MENS.includes(person.chore?.id));
      if (menOnMens.length === 1 && [...stuckWorks].some(id => MENS.includes(id))) { tally.queuedBehindOne += minutes; per.queuedBehindOne += minutes; }
    }
  }

  function watch(was) {
    const minutes = world.minute - was;
    for (const household of households) {
      const tally = fam.get(household.id);
      if (tally.roofedDay === null && houseSettled(household)) tally.roofedDay = Math.round((world.minute - start) / DAY * 10) / 10;
      const people = household.members.map(id => world.entities[id]);
      let worst = 0;
      for (const person of people) {
        if (!person) continue;
        worst = Math.max(worst, RANK[person.hunger?.stage] || 0);
        if (person.health?.condition === 'dead' && !tally.deaths.some(death => death.id === person.id)) {
          const cause = person.health.starved ? 'hunger' : person.health.disease ? 'disease' : person.service ? 'war' : 'other';
          tally.deaths.push({ id: person.id, age: person.age ?? null, sex: person.sex, cause, period: currentPeriod, day: Math.round((world.minute - start) / DAY) });
        }
        if (!alive(person)) continue;
        // The wash, on a tree that has it.
        if (housework.dirty) {
          if (!person.travel && !person.service && person.location?.siteId === household.homeSiteId) { tally.personMinutes += minutes; if (housework.dirty(world, person)) tally.dirtyMinutes += minutes; }
          const site = !person.travel && world.map.sites[person.location?.siteId];
          const town = site?.kind === 'town' ? site.id : null;
          if (town && inTown.get(person.id) !== town) { tally.townArrivals++; if (housework.dirty(world, person)) tally.dirtyArrivals++; }
          inTown.set(person.id, town);
        }
      }
      tally.worst = Math.max(tally.worst, worst);
      if (worst >= 1) tally.hungryDays += minutes / DAY;
      // The son of sixteen at home while the father is away at the war.
      if (tally.shape === 'son16Home') {
        const father = people.find(person => person?.kin?.role === 'father'), son = people.find(person => person?.kin?.role === 'son' && (person.age ?? 0) >= 16);
        if (father?.service && son && alive(son) && !son.service && !son.travel) tally.sonAtHomeWhileFatherAway += minutes / DAY;
      }
    }
    for (const event of world.events.slice(-300)) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      const tally = fam.get(event.householdId);
      if (!tally) continue;
      const text = event.text || '';
      const brought = /brought in (?:([\d.]+) food)?(?: and )?(?:([\d.]+) cotton)?/.exec(text);
      if (brought && (brought[1] || brought[2])) { tally.harvests++; tally.harvestFood += Number(brought[1] || 0); tally.harvestCotton += Number(brought[2] || 0); }
      if (event.claimId === 'FIC-GONZ-1155') tally.remarks++;
      if (event.claimId === 'FIC-GONZ-1157') tally.washes++;
      if (event.claimId === 'FIC-GONZ-1153') tally.keptDays++;
      if (event.claimId === 'FIC-GONZ-1154' && /garden/i.test(text) && event.type === 'consequence') tally.gardenDays++;
      const actor = world.entities[event.actorId];
      if (Number.isFinite(event.coin) && event.coin !== 0 && actor && housework.dirty?.(world, actor)) {
        if (event.coin < 0) tally.dirtyCoinOut += -event.coin; else tally.dirtyCoinIn += event.coin;
      }
    }
  }

  function enlist(household, view) {
    const shape = shapeOf.get(household.id);
    if (!ENLIST[shape] || currentPeriod !== 2) return;
    const tally = fam.get(household.id);
    for (const id of household.members) {
      const person = world.entities[id];
      if (!alive(person) || !ENLIST[shape](person) || person.service || person.chore?.id?.startsWith('enlist') || tally.enlisted.includes(id)) continue;
      if (!(view.work?.[id] || []).some(entry => entry.id === 'enlist-regular' && entry.can)) continue;
      try {
        if (person.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: id });
        applyAction(world, household.id, { action: 'chore', entityId: id, chore: 'enlist-regular' });
        tally.enlisted.push(id);
        tally.enlistDay ??= Math.round((world.minute - start) / DAY);
      } catch { /* refused: tried again next turn */ }
    }
  }

  const turn = () => {
    households.forEach((household, index) => {
      if (household.arriving || (world.tick + index) % THINK_EVERY !== 0) return;
      household.absent = true;
      try {
        enlist(household, projectWorld(world, household.id, 'student', { includeMap: false }));
        thinkFor(world, household, { project, act: input => applyAction(world, household.id, input) });
      } catch { /* a refused order is the family's own business */ }
      delete household.absent;
      sample(household);
    });
  };

  const endPeriod = period => {
    for (const household of households) {
      const tally = fam.get(household.id);
      tally.food[period] = Math.round((household.resources?.food || 0) * 10) / 10;
      tally.plots[period] = (household.plots || []).filter(plot => plot.state !== 'staked').length;
      tally.sown[period] = sownPlots ? sownPlots(household).length : null;
    }
  };
  const runPeriod = period => {
    for (let i = 0; i < Number(arg('ticks', '12000')) && !world.director.complete && world.status === 'running'; i++) {
      const was = world.minute;
      stepWorld(world);
      watch(was);
      turn();
    }
    endPeriod(period);
  };
  runPeriod(1);
  // A smoke run (`--ticks`) that stops short of the period's end stops there.
  if (world.director.complete) { beginSecondPeriod(world); world.status = 'running'; currentPeriod = 2; runPeriod(2); }
  if (world.director.complete) { beginThirdPeriod(world); world.status = 'running'; currentPeriod = 3; runPeriod(3); }

  let ending = null;
  try { ending = hostEnding(world); } catch { /* no ending */ }
  const finals = ending ? Object.fromEntries(ending.families.map(family => [family.householdId, family])) : {};
  const ranked = ending ? [...ending.families].filter(family => !family.wiped).sort((a, b) => b.final - a.final).map(family => family.householdId) : [];
  return {
    seed, mode, root, hasCustom, days: Math.round((world.minute - start) / DAY), seconds: Math.round((Date.now() - started) / 1000),
    families: households.map(household => {
      const tally = fam.get(household.id);
      delete tally.lastSample;
      const round = value => Math.round(value);
      const toDays = record => Object.fromEntries(Object.entries(record).map(([key, value]) => [key, Math.round(value / DAY * 100) / 100]));
      return {
        id: household.id, ...tally,
        time: Object.fromEntries(Object.entries(tally.time).map(([group, kinds]) => [group, toDays(kinds)])),
        per: Object.fromEntries(Object.entries(tally.per).map(([period, one]) => [period, { home: Math.round(one.home / DAY * 100) / 100, stuckFamily: Math.round(one.stuckFamily / DAY * 100) / 100,
          hiddenAll: Math.round(one.hiddenAll / DAY * 100) / 100, queuedBehindOne: Math.round(one.queuedBehindOne / DAY * 100) / 100, stuckPerson: toDays(one.stuckPerson),
          time: Object.fromEntries(Object.entries(one.time).map(([group, kinds]) => [group, toDays(kinds)])) }])),
        stuckPerson: toDays(tally.stuckPerson), stuckBy: toDays(tally.stuckBy), hiddenBy: toDays(tally.hiddenBy),
        stuckFamily: Math.round(tally.stuckFamily / DAY * 100) / 100, hiddenAll: Math.round(tally.hiddenAll / DAY * 100) / 100, queuedBehindOne: Math.round(tally.queuedBehindOne / DAY * 100) / 100,
        homeDays: Math.round(tally.homeMinutes / DAY * 10) / 10, dirtyShare: tally.personMinutes ? Math.round(tally.dirtyMinutes / tally.personMinutes * 100) : null,
        dirtyMinutes: undefined, personMinutes: undefined, homeMinutes: undefined,
        hungryDays: Math.round(tally.hungryDays * 10) / 10, harvestFood: round(tally.harvestFood), harvestCotton: Math.round(tally.harvestCotton * 10) / 10,
        coin: Math.round((household.resources?.money || 0) * 100) / 100, final: finals[household.id]?.final ?? null, glory: finals[household.id]?.glory ?? null,
        rank: ranked.indexOf(household.id) >= 0 ? ranked.indexOf(household.id) + 1 : null, wiped: Boolean(finals[household.id]?.wiped), winner: Boolean(ending?.winners?.includes(household.id)),
        living: household.members.filter(id => alive(world.entities[id])).length,
      };
    }),
  };
}

// The whole study: every seed, the tree before the custom (playing) and now (playing and nohouse), run as separate processes.
async function study() {
  const seeds = arg('seeds', 'viab-1,viab-2,viab-3,viab-4,viab-5,viab-6').split(',');
  const before = arg('before', null);
  const jobs = Number(arg('jobs', '9'));
  const out = arg('out', 'docs/evidence/custom-viability.json');
  const tmp = resolve(arg('tmp', dirname(resolve(out))), 'custom-viability-runs');
  mkdirSync(tmp, { recursive: true });
  const runs = [];
  seeds.forEach((seed, index) => {
    if (before) runs.push({ tree: 'before', root: before, seed, index, mode: 'playing' });
    runs.push({ tree: 'now', root: '.', seed, index, mode: 'playing' });
    runs.push({ tree: 'now', root: '.', seed, index, mode: 'nohouse' });
  });
  const self = fileURLToPath(import.meta.url);
  const pending = [...runs];
  const results = [];
  await Promise.all(Array.from({ length: jobs }, async () => {
    while (pending.length) {
      const run = pending.shift();
      const file = resolve(tmp, `${run.tree}-${run.mode}-${run.seed}.json`);
      if (!existsSync(file)) {
        await new Promise((done, fail) => {
          const child = spawn(process.execPath, ['--max-old-space-size=4096', self, '--root', run.root, '--seed', run.seed, '--index', String(run.index), '--mode', run.mode, '--out', file], { stdio: ['ignore', 'inherit', 'inherit'] });
          child.on('exit', code => (code === 0 ? done() : fail(new Error(`${run.tree} ${run.mode} ${run.seed} exited ${code}`))));
        });
      }
      const row = JSON.parse(readFileSync(file, 'utf8'));
      results.push({ tree: run.tree, ...row });
      console.error(`${run.tree} ${run.mode} ${run.seed}: ${row.seconds} s`);
    }
  }));
  const record = { record: 'custom-viability', measured: new Date().toISOString().slice(0, 10), seeds, before, shapes: SHAPES, runs: results };
  writeFileSync(out, `${JSON.stringify(record)}\n`);
  console.error(`wrote ${out}`);
}
