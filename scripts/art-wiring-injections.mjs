// The regressions the tests of Astra's delivery of 2026-09-21 guard, injected one at a time (CLAUDE.md: "A new test is
// not evidence until it has failed"). Each injection replaces one exact piece of one file with the mistake a test is
// written against, runs that test's own file, records which tests failed, and puts the file back byte for byte. It stops
// if a replacement does not match exactly once, so a stale injection is never passed off as a proof.
//
// The norther's own injections live beside the rest of the weather's, in scripts/weather-injections.mjs.
//
// Run: node scripts/art-wiring-injections.mjs  → writes docs/evidence/art-wiring-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const HUNT = ['tests/biome-game.test.mjs'];
const CAST = ['tests/motion-binding.test.mjs'];
const TALK = ['tests/encounters.test.mjs'];
const LIBRARY = ['tests/art-library.test.mjs', 'tests/woods-view.test.mjs'];
const BOAT = ['tests/armies.test.mjs'];

const INJECTIONS = [
  // ---- the turkey in the hunt (wildlife-turkey) --------------------------------------------------------------------
  {
    name: 'a quarry with no art of its own is given a place anyway, so a bear is drawn as whatever loads',
    file: 'sim/hunting.mjs', tests: HUNT,
    from: "export const DRAWN_GAME = Object.freeze(['deer', 'turkey']);",
    to: "export const DRAWN_GAME = Object.freeze(['deer', 'turkey', 'bear']);",
  },
  {
    name: 'the turkey is delivered and still not drawn, as it was the day the sheet landed',
    file: 'sim/hunting.mjs', tests: HUNT,
    from: "export const DRAWN_GAME = Object.freeze(['deer', 'turkey']);",
    to: "export const DRAWN_GAME = Object.freeze(['deer']);",
  },
  {
    name: 'every quarry is drawn as a deer, whatever the words say it is',
    file: 'sim/chores.mjs', tests: HUNT,
    from: "  return { kind, x: round(entity.location.x + toward.x * miles), y: round(entity.location.y + toward.y * miles) };",
    to: "  return { kind: 'deer', x: round(entity.location.x + toward.x * miles), y: round(entity.location.y + toward.y * miles) };",
  },
  {
    name: 'the drawn list is not consulted at all, so every quarry gets a place',
    file: 'sim/chores.mjs', tests: HUNT,
    from: "    if (step.quarry && gameDrawn(state.ground?.quarry)) state.quarry = quarryPoint(world, entity, step.quarry, state.ground?.quarry || 'deer');",
    to: "    if (step.quarry) state.quarry = quarryPoint(world, entity, step.quarry, state.ground?.quarry || 'deer');",
  },

  // ---- the second cast (people-cast2-vertical) ---------------------------------------------------------------------
  {
    name: 'a mother who is the principal is drawn as a man in a rust coat, as she was before the second cast',
    file: 'public/motion.js', tests: CAST,
    from: "  if (entity.principal && !observed) return entity.sex === 'female' ? 'rust-woman' : PRINCIPAL_VARIANT;",
    to: '  if (entity.principal && !observed) return PRINCIPAL_VARIANT;',
  },
  {
    name: 'the principal\'s own figure is dealt to neighbours, so the mark stops meaning "this is you"',
    file: 'public/motion.js', tests: CAST,
    from: "export const WOMEN = ['teal', 'indigo'], MEN = ['elder', 'ochre'];",
    to: "export const WOMEN = ['teal', 'indigo', 'rust-woman'], MEN = ['elder', 'ochre'];",
  },
  {
    name: 'the second cast is registered and never dealt: a family is four copies of two figures again',
    file: 'public/motion.js', tests: CAST,
    from: "export const WOMEN = ['teal', 'indigo'], MEN = ['elder', 'ochre'];",
    to: "export const WOMEN = ['teal'], MEN = ['elder'];",
  },
  {
    name: 'an adolescent girl is drawn as a grown woman, as she was before blue-girl',
    file: 'public/motion.js', tests: CAST,
    from: "  if (entity.sex === 'female') return grown ? fromPool(WOMEN, entity.id) : 'blue-girl';",
    to: "  if (entity.sex === 'female') return fromPool(WOMEN, entity.id);",
  },

  // ---- the conversation (people-cast2-dialogue) --------------------------------------------------------------------
  {
    name: 'the delivered speaking cycle is never drawn: a person talking stands in their idle pose',
    file: 'public/motion.js', tests: CAST,
    from: '  if (!observed && entity.speaking) return { id: `${variant}-speak` };\n',
    to: '',
  },
  {
    name: 'front and back listening are swapped, so somebody listening to a rider above them turns away',
    file: 'public/motion.js', tests: CAST,
    from: "  if (!observed && entity.facing) return { id: `${variant}-listen-${entity.facing === 'n' ? 'n' : 's'}`, upright: true };",
    to: "  if (!observed && entity.facing) return { id: `${variant}-listen-${entity.facing === 'n' ? 's' : 'n'}`, upright: true };",
  },
  {
    name: 'a back view is mirrored like an east-facing one',
    file: 'public/motion.js', tests: CAST,
    from: "  if (!observed && entity.facing) return { id: `${variant}-listen-${entity.facing === 'n' ? 'n' : 's'}`, upright: true };",
    to: "  if (!observed && entity.facing) return { id: `${variant}-listen-${entity.facing === 'n' ? 'n' : 's'}` };",
  },
  {
    name: 'somebody else\'s family is drawn out of a meeting this student is not in',
    file: 'public/motion.js', tests: CAST,
    from: '  if (!observed && entity.speaking) return { id: `${variant}-speak` };',
    to: '  if (entity.speaking) return { id: `${variant}-speak` };',
  },
  {
    name: 'the listener reads the last line of all, so the rider always speaks last and they never do',
    file: 'sim/encounters.mjs', tests: TALK,
    from: '  const said = [...encounter.said].reverse().find(line => line.speaker === speaker);',
    to: '  const said = encounter.said.at(-1);',
  },
  {
    name: 'the listener is given the rider\'s own speaking, so both mouth his lines',
    file: 'sim/encounters.mjs', tests: TALK,
    from: "  return turnedToward(world, encounter, person, carrier, 'listener');",
    to: "  return turnedToward(world, encounter, person, carrier, 'rider');",
  },
  {
    name: 'the two of them are turned away from each other',
    file: 'sim/encounters.mjs', tests: TALK,
    from: "      : other.location.x < person.location.x ? 'w' : 'e',",
    to: "      : other.location.x < person.location.x ? 'e' : 'w',",
  },
  {
    name: 'nothing of the meeting reaches the family\'s own page, as it did not before',
    file: 'sim/world.mjs', tests: TALK,
    from: "    ...(e.kind === 'person' ? listeningOf(world, e) || {} : {}) }));",
    to: '    ...{} }));',
  },

  // ---- the trees and the towns (trees-colonies-2, town-buildings-researched, biome-ground-bexar) --------------------
  {
    name: 'the post oak goes back to the generic broad oak, and its delivered sizes are drawn by nothing',
    file: 'sim/woods.mjs', tests: LIBRARY,
    from: "  'post-oak': kind('post oak', [1, 2, 2], 'sill', 1, 'post-oak', SIZED),",
    to: "  'post-oak': kind('post oak', [1, 2, 2], 'sill', 1, 'oak-broad'),",
  },
  {
    name: 'a tree is bound to a picture the library does not have',
    file: 'sim/woods.mjs', tests: LIBRARY,
    from: "  sweetgum: kind('sweetgum', [1, 2, 3], 'poor', 0.9, 'sweetgum', SIZED),",
    to: "  sweetgum: kind('sweetgum', [1, 2, 3], 'poor', 0.9, 'sweet-gum', SIZED),",
  },
  {
    name: 'the tall grass is delivered and the prairie keeps standing in for it',
    file: 'public/ground-classes.js', tests: LIBRARY,
    from: "    { upTo: 1, sprite: 'grass-tall', size: .8, fallback: 'tuft' },",
    to: "    { upTo: 1, sprite: 'grass-tuft', size: .85, fallback: 'tuft' },",
  },
  {
    name: 'a town building is bound to a sprite the library does not have',
    file: 'sim/town-layouts.mjs', tests: LIBRARY,
    from: "  { id: 'sf-whiteside-hotel', sprite: 'whiteside-hotel', x: 1560, y: 1790, height: 28, label: 'Whiteside Hotel' },",
    to: "  { id: 'sf-whiteside-hotel', sprite: 'whiteside-hotel-log', x: 1560, y: 1790, height: 28, label: 'Whiteside Hotel' },",
  },
  {
    name: 'the Round Top House goes back to a storehouse drawn tall, and its own painted building is drawn by nothing',
    file: 'sim/town-layouts.mjs', tests: LIBRARY,
    from: "  { id: 'vic-round-top', sprite: 'round-top-house', x: 4900, y: 2190, height: 26, label: 'Round Top House' },",
    to: "  { id: 'vic-round-top', sprite: 'storehouse', x: 4900, y: 2190, height: 30, label: 'Round Top House' },",
  },

  // ---- the Yellow Stone (steamboat-moored) -------------------------------------------------------------------------
  {
    name: 'the Yellow Stone stays on the river all spring instead of her own fortnight',
    file: 'sim/houston.mjs', tests: BOAT,
    from: '  if (world.minute < GROCES_FROM + clock || world.minute >= YELLOW_STONE_GONE + clock) return null;',
    to: '  if (world.minute < GROCES_FROM + clock) return null;',
  },
  {
    name: 'she is carrying the army before Houston has taken her',
    file: 'sim/houston.mjs', tests: BOAT,
    from: "    state: world.minute >= YELLOW_STONE_TAKEN + clock ? 'crossing' : 'cotton',",
    to: "    state: 'crossing',",
  },
  {
    name: 'she is moored at a camp rather than in the water between the two banks',
    file: 'sim/houston.mjs', tests: BOAT,
    from: '    x: round((west.x + east.x) / 2), y: round((west.y + east.y) / 2),',
    to: '    x: round(east.x), y: round(east.y),',
  },
  {
    name: 'a class whose map has only one bank is given a crossing anyway',
    file: 'sim/houston.mjs', tests: BOAT,
    from: '  if (!west || !east) return null;',
    to: '  if (!west && !east) return null;',
  },
  {
    name: 'the boat is not put on the army, so no page is ever told she is there',
    file: 'sim/armies.mjs', tests: BOAT,
    from: "    if (!existing && service.kind === 'houston') { const boat = yellowStone(world); if (boat) entry.boat = boat; }",
    to: '',
  },
  {
    name: 'the ferry goes back to the round-log raft, and the plank flatboat is drawn by nothing',
    file: 'public/landscape-art.js', tests: LIBRARY,
    from: "  if(!drawSprite(ctx,'ferry-flatboat',bx,by+height*.35,height))drawSprite(ctx,'ferry-raft',bx,by+height*.35,height);",
    to: "  drawSprite(ctx,'ferry-raft',bx,by+height*.35,height);",
  },
];

const asFileEndings = (text, eol) => (eol === '\r\n' ? text.replace(/\r?\n/g, '\r\n') : text.replace(/\r\n/g, '\n'));
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = files => { const result = spawnSync(process.execPath, ['--test', ...files], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const everyFile = [...new Set(INJECTIONS.flatMap(injection => injection.tests))];
const clean = run(everyFile);
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const from = asFileEndings(injection.from, eol), to = asFileEndings(injection.to, eol);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(from, to));
  let failed;
  try { failed = run(injection.tests); } finally { writeFileSync(injection.file, original); }
  record.push({ name: injection.name, file: injection.file, tests: injection.tests, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run(everyFile).length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/art-wiring-injections.json', `${JSON.stringify({ record: 'art-wiring-injections', date: new Date().toISOString().slice(0, 10), delivery: '2026-09-21', injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(entry => entry.failed.length).length} of ${record.length} caught; wrote docs/evidence/art-wiring-injections.json`);
