// The regressions the owner's answers of 2026-09-29 guard (docs/audits/2026-09-29-triage.md C4, D5, D6, D7, D11, D12;
// tests/owner-rules.test.mjs, tests/camp.test.mjs's fork, tests/mexican-advance.test.mjs's deal), injected one at a time
// (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces exact pieces of files with the mistake a test is
// written against, runs the tests it names, records which failed, checks the test written for it is among them, and puts every
// file back byte for byte.
//
// Run: npm run test:owner-rules-injections  → writes docs/evidence/owner-rules-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const OWN = { files: ['tests/owner-rules.test.mjs'] };
const FORK = { files: ['tests/camp.test.mjs'], pattern: 'fork of the road' };
const DEAL = { files: ['tests/mexican-advance.test.mjs'], pattern: 'burn zone, two by two|burnSides' };
const T = {
  food: 'D7: somebody working about the place', boy: 'D11: a boy of fifteen', baby: 'D11: a baby turns two', old: 'D11: an old save',
  hold: 'C4: a very sick child of a played family cannot die', clock: 'C4: the minute runs on the real clock',
  asked: 'D5: in the last week of October', cost: 'D5: sending is a real cost', queue: 'D5: the ask waits behind a rider',
  fork: 'the fork of the road, April 16', deal: 'exactly half of every class', sides: 'burnSides:',
};
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  // D7
  { name: 'D7 working about the place yields a food a day again', ...OWN, edits: [one('sim/routines.mjs', 'export const WORK_FOOD_A_DAY = 0.3;', 'export const WORK_FOOD_A_DAY = 1;')], expect: T.food },
  { name: 'D7 the yield not used: a worker counted as one food', ...OWN, edits: [one('sim/routines.mjs', '(workers * WORK_FOOD_A_DAY - eaten)', '(workers - eaten)')], expect: T.food },
  // D11
  { name: 'D11 the tick never moves an age', ...OWN, edits: [one('sim/world.mjs', '  advanceAges(world);\n', '')], expect: T.baby },
  { name: 'D11 no birthday ever passes', ...OWN, edits: [one('sim/ages.mjs', '    if (!(passed > 0)) continue;', '    if (true) continue;')], expect: T.boy },
  { name: 'D11 the derived birth date not written down', ...OWN, edits: [one('sim/ages.mjs', "    if (typeof person.born !== 'string') person.born = born;\n", '')], expect: T.old },
  { name: 'D11 an old save counted from the class start, so everybody ages when it is opened', ...OWN, edits: [one('sim/ages.mjs', '  const from = world.agesMinute, to = world.minute;', '  const from = world.agesMinute ?? 0, to = world.minute;')], expect: T.old },
  { name: 'D11 the page shows the family book\'s age before the tick\'s', ...OWN, edits: [one('public/family-panel.js', '    const shownAge = entity?.age ?? person.age;', '    const shownAge = person.age ?? entity?.age;')], expect: T.boy },
  // C4
  { name: 'C4 nothing held: a very sick child can die inside the minute', ...OWN, edits: [one('sim/disease.mjs', '  const held = graveHeld(world, person);', '  const held = false;')], expect: T.hold },
  { name: 'C4 the very sick days do not wait with the minute', ...OWN, edits: [one('sim/disease.mjs', '  if (held) { health.graveDay = day; return; }', '  if (held) return;')], expect: T.hold },
  { name: 'C4 the minute never starts on the real clock', ...OWN, edits: [one('sim/decision-budget.mjs', "    if (graveOnLimit(world, entity)) open.push({ key: graveLimitKey(entity), kind: 'grave', personId: entity.id });\n", '')], expect: T.clock },
  { name: 'C4 a minute held for a family nobody is at the screen for', ...OWN, edits: [one('sim/decision-budget.mjs', '  return watched(world.households?.[entity.householdId]);', '  return Boolean(world.households?.[entity.householdId]);')], expect: T.clock },
  { name: 'C4 the row carries no time left', ...OWN, edits: [one('sim/disease.mjs', "  const minute = health.grave && graveOnLimit(world, person) && !limitOut(world, graveLimitKey(person)) ? { leftMs: limitLeft(world, graveLimitKey(person), 'grave') } : {};", '  const minute = {};')], expect: T.clock },
  { name: 'C4 the "!" does not count it down', ...OWN, edits: [one('public/family-panel.js', "text: `${name}: ${entity.sickness.line || 'very sick.'}`, ...ms(entity.sickness.leftMs) });", "text: `${name}: ${entity.sickness.line || 'very sick.'}` });")], expect: T.clock },
  // D5
  { name: 'D5 the autumn ask put to a family whose man is serving', ...OWN, edits: [one('sim/supplies.mjs', "      if (ask.who === 'sent-nobody' && volunteersOf(world, household.id).length) continue;\n", '')], expect: T.asked },
  { name: 'D5 asked before the committee\'s word of October 26', ...OWN, edits: [one('sim/supplies.mjs', 'opens: world => minuteAt(world, 10, 26, 9)', 'opens: world => minuteAt(world, 10, 13, 9)')], expect: T.asked },
  { name: 'D5 the ask never shown as the family\'s request', ...OWN, edits: [one('sim/directors.mjs', '|| supply || call ||', '|| call ||')], expect: T.asked },
  { name: 'D5 the story card says only "Your family is being asked"', ...OWN, edits: [one('public/military-attention.js', " : world?.request?.kind === 'supply' ? 'The army asks for supplies' : 'Your family is being asked'),", " : 'Your family is being asked'),")], expect: T.asked },
  { name: 'D5 sending earns nothing', ...OWN, edits: [one('sim/supplies.mjs', "  awardGlory(world, { event: askId, claimId: 'HIST-TEX-960', personId: entity.id, householdId: household.id, role: 'supplied', fromSiteId: 'bexar', causes: [choiceId], flat: true });", '')], expect: T.cost },
  { name: 'D5 (2026-09-30) supply glory times the miles from Béxar again, not flat', ...OWN, edits: [one('sim/supplies.mjs', "fromSiteId: 'bexar', causes: [choiceId], flat: true });", "fromSiteId: 'bexar', causes: [choiceId] });")], expect: T.cost },
  { name: 'D5 (2026-09-30) a flat award still multiplied by the miles', ...OWN, edits: [one('sim/glory.mjs', '  const miles = flat ? 0 : findPath(world.map, fromSiteId, household.homeSiteId)?.distance ?? 0;', '  const miles = findPath(world.map, fromSiteId, household.homeSiteId)?.distance ?? 0;')], expect: T.cost },
  { name: 'D5 (2026-09-30) the ending says a flat award as a sum of miles', ...OWN, edits: [one('sim/ending.mjs', "  if (award.flat) return `${PART_NAMES[award.role] || 'Taking part'} counts ${weight}, once: nobody of the family went with it = ${weight} glory.`;\n", '')], expect: T.cost },
  { name: 'D5 the powder sent costs nothing', ...OWN, edits: [one('sim/supplies.mjs', "  if (what === 'powder') household.resources.powder = r4((household.resources.powder ?? 0) - SUPPLY_POWDER);\n", '')], expect: T.cost },
  { name: 'D5 food the family has not got is offered', ...OWN, edits: [one('sim/supplies.mjs', "  if (action === 'supply-food' && !((household.resources.food ?? 0) >= SUPPLY_FOOD)) return { can: false, why: `The family has less than ${SUPPLY_FOOD} food to send.` };\n", '')], expect: T.cost },
  { name: 'D5 the horse sent stays at home', ...OWN, edits: [one('sim/supplies.mjs', '    delete world.entities[horse.id];\n', '')], expect: T.cost },
  { name: 'D5 its minutes run while it waits behind a rider', ...OWN, edits: [one('sim/decision-budget.mjs', "call: true, held: Boolean(heldFor?.(household)) || questionWaits(world, householdId, ask), expire: () => { lapseSupply", "call: true, held: false, expire: () => { lapseSupply")], expect: T.queue },
  { name: 'D5 it never lapses on the real clock', ...OWN, edits: [one('sim/decision-budget.mjs', "    if (!ask || !household?.played || household.absent) continue;\n    const personId", "    if (true) continue;\n    const personId")], expect: T.queue },
  // D6
  { name: 'D6 the fork\'s "yes" earns `forward` again', ...FORK, edits: [
    one('sim/camp.mjs', "  // Calling for the enemy's road at the fork earns nothing (owner, 2026-09-29", "  if (key === 'road' && answer === 'yes') awardGlory(world, { event: 'which-road', claimId: spec.claimId, personId: entity.id, householdId: entity.householdId, role: 'forward', fromSiteId: 'harrisburg', causes: [eventId] });\n  // Calling for the enemy's road at the fork earns nothing (owner, 2026-09-29"),
    one('sim/glory.mjs', 'served: 1, helped: 1', 'served: 1, forward: 2, helped: 1'),
  ], expect: T.fork },
  { name: 'D6 the weight left in, so the ending still teaches it', ...FORK, edits: [one('sim/glory.mjs', 'served: 1, helped: 1', 'served: 1, forward: 2, helped: 1')], expect: T.fork },
  // D12
  { name: 'D12 dealt by join order again', ...DEAL, edits: [one('sim/colonies-region.mjs', '  const inside = index => sides[index];', '  const inside = index => index % 2 === 0;')], expect: T.deal },
  { name: 'D12 the seed never chooses: the first of each two always inside', ...DEAL, edits: [one('sim/colonies-region.mjs', '    const firstInside = next() < 0.5;', '    const firstInside = true;')], expect: T.sides },
  { name: 'D12 the odd one over outside', ...DEAL, edits: [one('sim/colonies-region.mjs', '    if (first + 1 >= count) { sides.push(true); break; }', '    if (first + 1 >= count) { sides.push(false); break; }')], expect: T.sides },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = ({ files, pattern }) => {
  const result = spawnSync(process.execPath, ['--test', ...(pattern ? ['--test-name-pattern', pattern] : []), ...files], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${result.stdout}${result.stderr}`;
  return { failed: failing(out), passed: [...out.matchAll(/^\s*✔ /gm)].length };
};

for (const injection of INJECTIONS) {
  for (const edit of injection.edits) {
    const text = readFileSync(edit.file, 'utf8').replace(/\r\n/g, '\n');
    const at = text.indexOf(edit.from);
    if (at < 0) throw new Error(`Injection pattern not found in ${edit.file}: ${injection.name}`);
    if (text.indexOf(edit.from, at + 1) >= 0) throw new Error(`Injection pattern found twice in ${edit.file}: ${injection.name}`);
  }
}
const only = (process.argv.find(arg => arg.startsWith('--only=')) || '').slice(7);
const chosen = INJECTIONS.filter(injection => !only || injection.name.startsWith(only));
for (const group of [OWN, FORK, DEAL]) {
  if (!chosen.some(injection => injection.files[0] === group.files[0])) continue;
  const clean = run(group);
  if (clean.failed.length || !clean.passed) throw new Error(`The tests fail before anything is injected: ${clean.failed.join('; ') || 'nothing ran'}`);
}
const record = [];
for (const injection of chosen) {
  const originals = new Map(injection.edits.map(edit => [edit.file, readFileSync(edit.file, 'utf8')]));
  let result;
  try {
    for (const edit of injection.edits) {
      const original = readFileSync(edit.file, 'utf8'), crlf = original.includes('\r\n');
      const text = original.replace(/\r\n/g, '\n').replace(edit.from, edit.to);
      writeFileSync(edit.file, crlf ? text.replace(/\n/g, '\r\n') : text);
    }
    result = run(injection);
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
  const caught = result.failed.some(name => name.includes(injection.expect));
  const alone = caught && result.failed.every(name => name.includes(injection.expect));
  record.push({ name: injection.name, files: injection.edits.map(edit => edit.file), tests: injection.files, expected: injection.expect, caught, only: alone, failed: result.failed });
  console.log(`${caught ? 'CAUGHT' : 'MISSED'}${caught && !alone ? ' (with others)' : ''} ${injection.name}${caught && alone ? '' : ` (failed: ${result.failed.join('; ') || 'nothing'})`}`);
}
for (const group of [OWN, FORK, DEAL]) if (chosen.some(injection => injection.files[0] === group.files[0]) && run(group).failed.length) throw new Error('The tests fail after every file was put back');
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/owner-rules-injections.json', `${JSON.stringify({ record: 'owner-rules-injections', date: new Date().toISOString().slice(0, 10), caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 2)}\n`);
}
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone).${only ? '' : ' Wrote docs/evidence/owner-rules-injections.json'}`);
