// The regressions tests/lesson.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of sim/lesson.mjs or sim/world.mjs with the mistake a test is
// written against, runs the test file, records which tests failed, and puts the file back byte for byte.
//
// Run: node scripts/lesson-injections.mjs  → writes docs/evidence/lesson-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/lesson.test.mjs'];
const FILE = 'sim/lesson.mjs';
const INJECTIONS = [
  // 1. The gate itself: the server holds it, and it is the server that refuses.
  {
    name: 'the gate never refuses anything: the page is trusted to grey the controls out',
    from: '  if (allowed.has(actionId(input))) return null;\n  return `Not yet - first, ${current.first}`;',
    to: '  return null;',
  },
  {
    name: 'a refused order is refused without a word, which this codebase says is worse than no control',
    from: '  return `Not yet - first, ${current.first}`;',
    to: "  return ' ';",
  },
  {
    name: 'the refusal names the wrong thing: whatever step it is, it asks for the first one',
    from: '  return `Not yet - first, ${current.first}`;',
    to: '  return `Not yet - first, ${STEPS[0].first}`;',
  },
  {
    name: 'a chore is read as its bare action name, so no chore is ever on any step’s list',
    from: "export const actionId = input => input?.action === 'chore' ? `chore:${input.chore}` : String(input?.action ?? '');",
    to: "export const actionId = input => String(input?.action ?? '');",
  },
  // 2. What is never refused.
  {
    name: 'the answers the game itself puts to a family can be refused by a lesson',
    from: '  const allowed = new Set([...ALWAYS, ...current.allow(world, household)]);',
    to: '  const allowed = new Set(current.allow(world, household));',
  },
  {
    name: 'a man who has joined the army is gated at home while he is standing in a camp',
    from: "  if (world.entities[input?.entityId]?.service?.status === 'serving') return null;",
    to: '',
  },
  {
    name: 'a family whose student has gone is gated, so the director cannot move it at all',
    from: '  if (!household || household.absent) return null;',
    to: '  if (!household) return null;',
  },
  {
    name: 'a family on the road east is still being taught to dig a well on the land it left',
    from: "const teachable = (world, household) => Boolean(household?.played) && world.status !== 'lobby' && !household.flight;",
    to: "const teachable = (world, household) => Boolean(household?.played) && world.status !== 'lobby';",
  },
  // 3. Who has a lesson at all.
  {
    name: 'every family has a lesson, including the ones nobody plays',
    from: "const teachable = (world, household) => Boolean(household?.played) && world.status !== 'lobby' && !household.flight;",
    to: 'const teachable = (world, household) => Boolean(household) && !household.flight;',
  },
  {
    name: 'the lesson runs in the lobby, where the wagon is not even on the road yet',
    from: "const teachable = (world, household) => Boolean(household?.played) && world.status !== 'lobby' && !household.flight;",
    to: 'const teachable = (world, household) => Boolean(household?.played) && !household.flight;',
  },
  {
    name: 'a family already standing in its own house is marched back to the wagon: every old save is gated',
    from: "const beginsAt = household => (household.arriving || choosing(household)) ? 'arrive' : null;",
    to: "const beginsAt = () => 'arrive';",
  },
  {
    name: 'nobody ever begins a lesson, so the forced beginning is not forced at all',
    from: "const beginsAt = household => (household.arriving || choosing(household)) ? 'arrive' : null;",
    to: 'const beginsAt = () => null;',
  },
  // 4. Each step completes because the world says so.
  {
    name: 'the arrival is over before the wagon is in, or before the house site is chosen',
    from: '    done: (world, household) => !household.arriving && !choosing(household),',
    to: '    done: () => true,',
  },
  {
    name: 'the order step passes without anybody being put to work',
    from: '    done: (world, household) => household.members.some(id => world.entities[id]?.chore),',
    to: '    done: () => true,',
  },
  {
    name: 'the house step passes before there is a roof over the family',
    from: '    done: (world, household) => houseSettled(household),',
    to: '    done: () => true,',
  },
  {
    name: 'the survey step counts the patch of broken ground the family was founded with',
    from: 'const staked = (world, household) => plotsOf(world, household).length > 1;',
    to: 'const staked = (world, household) => plotsOf(world, household).length > 0;',
  },
  {
    name: 'the clearing step counts the founding patch, so nothing has to be broken at all',
    from: 'const broken = household => clearedPlots(household).length > 1;',
    to: 'const broken = household => clearedPlots(household).length > 0;',
  },
  {
    name: 'a new family’s untouched bare field reads as a crop already brought in',
    from: "const harvested = household => (household.field?.state ?? 'bare') === 'bare' && (household.field?.changedTick ?? 0) > 0;",
    to: "const harvested = household => (household.field?.state ?? 'bare') === 'bare';",
  },
  {
    name: 'the crop counts as sold before a real of coin has come into the house',
    from: 'const sold = household => (household.resources?.money ?? 0) > 0 || household.lesson?.sold === true;',
    to: 'const sold = household => (household.resources?.money ?? 0) >= 0 || household.lesson?.sold === true;',
  },
  {
    // This half was added on 2026-09-21 because the store's purse holds two reales and pays the rest in food: a sale
    // that brought back no coin left the class standing at the counter for good. It had no injection of its own, and
    // the one above had gone stale against it - this whole harness had been unable to run since.
    name: 'only coin finishes the sale again, so a crop the store paid for in food strands the class at the counter',
    from: 'const sold = household => (household.resources?.money ?? 0) > 0 || household.lesson?.sold === true;',
    to: 'const sold = household => (household.resources?.money ?? 0) > 0;',
  },
  {
    name: 'a hunt counts the moment somebody sets out, whether or not they ever come home',
    from: '  if (out) state.hunting = true;\n  else if (state.hunting) { delete state.hunting; state.hunted = true; }',
    to: '  if (out) state.hunted = true;',
  },
  {
    name: 'going out after game counts for nothing, so a family that hunted is sent out for ever',
    from: '  if (out) state.hunting = true;\n  else if (state.hunting) { delete state.hunting; state.hunted = true; }',
    to: '',
  },
  {
    name: 'the well is never stood down, so a family with water at the door can never finish',
    from: 'const watered = household => household.well === true || !household.site?.needsWell;',
    to: 'const watered = household => household.well === true;',
  },
  {
    name: 'the well counts itself dug wherever the house stands',
    from: 'const watered = household => household.well === true || !household.site?.needsWell;',
    to: 'const watered = () => true;',
  },
  // 5. Moving on: as far as the world allows, and never backwards.
  {
    name: 'the lesson never moves on at all',
    from: '  while (index < STEPS.length && STEPS[index].done(world, household)) index++;',
    to: '',
  },
  {
    name: 'the lesson moves on one step at a time, so a step already satisfied still has to be pressed through',
    from: '  while (index < STEPS.length && STEPS[index].done(world, household)) index++;',
    to: '  if (index < STEPS.length && STEPS[index].done(world, household)) index++;',
  },
  {
    name: 'the steps are put in a different order: the crop is sold before it is brought in',
    from: "  assert.deepEqual(STEPS.map(step => step.id), ['arrive', 'order', 'house', 'survey', 'clear', 'plant', 'harvest', 'sell', 'hunt', 'well']);",
    to: "  assert.deepEqual(STEPS.map(step => step.id), ['arrive', 'order', 'house', 'survey', 'clear', 'plant', 'sell', 'harvest', 'hunt', 'well']);",
    file: 'tests/lesson.test.mjs',
  },
  {
    name: 'nothing moves the lesson on when an order is sent, so a step waits a whole tick to be noticed',
    file: 'sim/world.mjs',
    from: '  applyOneAction(world, householdId, input);\n  advanceLesson(world, household);',
    to: '  applyOneAction(world, householdId, input);',
  },
  {
    name: 'nothing moves the lesson on when the tick does the work',
    file: 'sim/world.mjs',
    from: '  advanceLessons(world);\n  // Families nobody plays decide last',
    to: '  // Families nobody plays decide last',
  },
  // 6. What the page is sent.
  {
    name: 'the lesson never reaches the page, so no student is ever told what to do next',
    file: 'sim/world.mjs',
    from: '    ...(lesson && { lesson }),',
    to: '',
  },
  {
    name: 'the Host is sent a student’s lesson',
    file: 'sim/world.mjs',
    from: "  const lesson = household && role !== 'host' ? lessonProjection(world, household) : null;",
    to: '  const lesson = household ? lessonProjection(world, household) : null;',
  },
  {
    name: 'the closing card never goes away, so the lesson is never over on the page',
    from: 'export const LESSON_DONE_MINUTES = 180;',
    to: 'export const LESSON_DONE_MINUTES = Infinity;',
  },
  {
    name: 'the closing card is never shown: a student is not told the land is theirs',
    from: "  if (step === 'done') {",
    to: "  if (step === 'done') { return null; } if (false) {",
  },
  {
    name: 'a step is numbered from zero, so a student is told which of ten they are on and it is wrong',
    from: '    step: current.id, index: index + 1, of: STEPS.length,',
    to: '    step: current.id, index, of: STEPS.length,',
  },
  {
    name: 'the page is never told what has just happened',
    from: '    did: index > 0 ? STEPS[index - 1].did(world, household) : null,',
    to: '    did: null,',
  },
  // 7. What a save may hold.
  {
    name: 'a stored lesson is never checked, so a save naming a step that does not exist opens',
    from: "  if (lesson.step !== 'done' && indexOf(lesson.step) < 0) return 'Invalid lesson step';",
    to: '',
  },
  {
    name: 'anything at all may be stored as a lesson',
    from: '  if (typeof lesson !== \'object\' || lesson === null || Array.isArray(lesson)) return \'Invalid lesson\';',
    to: '',
  },
  // The owner's own report, 2026-09-21: the house step asked the family to keep at a house nobody had chosen, so every
  // icon on every person was either shut by the step or refused by the server, and the step's sentence asked for the
  // one thing nobody could be set to.
  {
    name: 'the house step asks the family to keep at a house before one has been chosen, which nobody on the bar can be set to',
    from: "    says: (world, household) => (houseOf(household)\n      ? 'Keep the family at the house until it stands. Set more than one of them to it and it goes faster; until there is a roof they camp by the wagon.'\n      : 'Choose a house first: the \"Choose a house\" button is on the left, above your family. Then set somebody to build it, and more than one of them makes it go faster.'),",
    to: "    says: () => 'Keep the family at the house until it stands. Set more than one of them to it and it goes faster; until there is a roof they camp by the wagon.',",
  },
  {
    name: 'the step tells the family to choose a house and never says where that is done',
    from: "      : 'Choose a house first: the \"Choose a house\" button is on the left, above your family. Then set somebody to build it, and more than one of them makes it go faster.'),",
    to: "      : 'Choose a house first. Then set somebody to build it, and more than one of them makes it go faster.'),",
  },
  // The X on the strip (owner, 2026-09-22: "i should be able to X off the tutorial to stop it and just do what i want";
  // asked who gets it, "Everyone, always").
  {
    name: 'the order to stop the lesson is not on ALWAYS, so the lesson refuses the X on every strict step',
    from: "  'stop-lesson',\n]);",
    to: ']);',
  },
  {
    name: 'the X does nothing: the family is still gated after pressing it',
    from: "  household.lesson = { step: 'done', at: world.minute, stopped: true };",
    to: '',
  },
  {
    name: 'a stopped family is shown the closing card, so the strip stays up after the X',
    from: '    if (household.lesson?.stopped) return null;',
    to: '',
  },
  {
    name: 'anybody may stop a lesson: the Host, and the director on behalf of a family whose student has gone',
    from: "  if (!household || household.absent || !household.played) throw new Error('Only a family’s own student can stop its guided start.');",
    to: '',
  },
  {
    name: 'the X stops whichever family the order names, so one student can stop another family’s lesson',
    file: 'sim/world.mjs',
    from: "  if (input.action === 'stop-lesson') { stopLesson(world, household); return; }",
    to: "  if (input.action === 'stop-lesson') { stopLesson(world, world.households[input.householdId] || household); return; }",
  },
  {
    name: 'a save may carry any value as the stop marker',
    from: "  for (const marker of ['hunting', 'hunted', 'stopped']) {",
    to: "  for (const marker of ['hunting', 'hunted']) {",
  },
  {
    name: 'a save may carry a stopped lesson still standing on a step, with the gate half open',
    from: "  if (lesson.stopped && lesson.step !== 'done') return 'Invalid lesson step';",
    to: '',
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const file = injection.file || FILE;
  const original = readFileSync(file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/lesson-injections.json', `${JSON.stringify({ record: 'lesson-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/lesson-injections.json`);
