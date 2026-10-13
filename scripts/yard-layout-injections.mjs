// Injections for what stands round a family's house (sim/yard-layout.mjs; owner, 2026-10-13: "a lot of assets get put in the same
// place and overlap. garden and logs for example conflict with roads and the tent", and "fix the giant bedroll too"). CLAUDE.md: "a
// new test is not evidence until it has failed". Each injection puts back one exact mistake, tests/yard-layout.test.mjs and
// tests/yard-art.test.mjs are run, and the file is restored. An
// injection is caught when every test it names fails, and caught alone when nothing else does.
// Run: node scripts/yard-layout-injections.mjs [part of a name]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/yard-layout.test.mjs', 'tests/yard-art.test.mjs'];
const T = {
  place: 'everything round the house has a place of its own: clear of each other, the houses, the field, the lane, the water, the line and the rails',
  bank: 'a thing round the house stays on the house\'s side of a creek',
  read: 'the tent, the garden, the woodpile and the camp are read where the layout puts them, by the family, the shelter and the Host',
  ways: 'the family\'s ways go round the woodpile, the garden, the tent and the wagons, and the way to the logs ends before the pile',
  stand: 'the beasts and the wagons stand at their stands: in from a journey, and in a class saved before',
  plot: 'no plot is staked over the woodpile, the garden or a beast\'s stand',
  bed: 'the bedroll and the goods at the camp are drawn the size they are beside a person and the wagon, not a house\'s',
};
const INJECTIONS = [
  { name: 'each thing is set down looking at nothing else round the house (the bug)', expect: [T.place],
    file: 'sim/yard-layout.mjs', from: '    if (placed.some(one => meets(room, one.box))) return false;\n', to: '' },
  { name: 'the houses as drawn are not looked at: a thing stands under the roof', expect: [T.place],
    file: 'sim/yard-layout.mjs', from: '  const walls = [...(houses.length ? houses : [home]).filter(Boolean).map(house => house.claim)];', to: '  const walls = [];' },
  { name: 'the yard\'s rails are not looked at: a thing stands across the fence', expect: [T.place],
    file: 'sim/yard-layout.mjs', from: '      if (!inside && meets(room, rails)) return false;', to: '' },
  { name: 'the field is not looked at', expect: [T.place],
    file: 'sim/yard-layout.mjs', from: '  for (const plot of plotsOf(world, household)) if (Number.isFinite(plot.x)) walls.push(squareOf(plot));', to: '' },
  { name: 'the lane is not looked at', expect: [T.place],
    file: 'sim/yard-layout.mjs', from: '    if (lane.length > 1 && lineNear(box, lane, LANE_HALF + YARD_GAP)) return false;', to: '' },
  { name: 'the nearest clear ground is taken across the creek (found on yard-layout-7)', expect: [T.bank],
    file: 'sim/yard-layout.mjs', from: '    if (!sameBank(at)) return false;\n', to: '' },
  { name: 'the tent stands where it always did, a fixed way west of the mark', expect: [T.read],
    file: 'sim/settling.mjs', from: '  if (laid?.tent) return laid.tent;', to: '' },
  { name: 'a garden laid out before is worked and drawn where it was recorded', expect: [T.read],
    file: 'sim/housework.mjs', from: 'export const gardenPoint = (world, household) => gardenPlace(world, household) || (household.garden ?', to: 'export const gardenPoint = (world, household) => (household.garden ? { x: household.garden.x, y: household.garden.y } : null) || (household.garden ?' },
  { name: 'the ways are laid through the woodpile, the garden and the wagon (the bug)', expect: [T.ways],
    file: 'sim/yard-layout.mjs', from: "  return layout ? layout.boxes.filter(one => ['woodpile', 'garden', 'tent', 'wagon'].includes(one.what)).map(one => one.box) : [];", to: '  return [];' },
  { name: 'the way to the logs ends under the pile', expect: [T.ways],
    file: 'sim/land-paths.mjs', from: '  if (countsTrees(woodsRule(world))) { const pile = woodpileFront(world, household) ||', to: '  if (countsTrees(woodsRule(world))) { const pile =' },
  { name: 'a beast standing at its old spot is left there, on the house\'s ground', expect: [T.stand],
    file: 'sim/yard-layout.mjs', from: '      const left = changed && [', to: '      const left = false && [' },
  { name: 'a beast left over another, or over the woodpile, is left there', expect: [T.stand],
    file: 'sim/yard-layout.mjs', from: '      if (left || over) {', to: '      if (left) {' },
  { name: 'a beast home from a journey is set down at the old rail', expect: [T.stand],
    file: 'sim/world.mjs', from: '    const spot = stand || (Number.isFinite', to: '    const spot = (Number.isFinite' },
  { name: 'ten acres may be staked over the woodpile', expect: [T.plot],
    file: 'sim/survey.mjs', from: "  if ((yardLayout(world, household)?.boxes || []).some(one => overlaps(one.box, square))) return 'That would take in the house yard.';", to: '' },
  { name: 'the bedroll a share of a house\'s height again (owner: "fix the giant bedroll too")', expect: [T.bed],
    file: 'public/yard-art.js', from: "sprite: 'bedroll', dx: -0.62, dy: 0.28, height: 0.3 }", to: "sprite: 'bedroll', dx: -0.62, dy: 0.28, height: 1.12 }" },
  { name: 'the camp at the site drawn at the house\'s size it is handed', expect: [T.bed],
    file: 'public/app.js', from: 'homesteadCamp(ctx, x, y, size / CABIN_PEOPLE, id);', to: 'homesteadCamp(ctx, x, y, size, id);' },
];
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, index, all) => all.indexOf(name) === index);
const run = () => { try { execFileSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 }); return []; } catch (error) { return failing(`${error.stdout}`); } };

const only = process.argv[2] ? INJECTIONS.filter(injection => injection.name.includes(process.argv[2])) : INJECTIONS;
const baseline = run();
if (baseline.length) throw new Error(`the tests fail before any injection: ${baseline.join('; ')}`);
const results = [];
for (const injection of only) {
  const text = readFileSync(injection.file, 'utf8'), crlf = text.includes('\r\n'), plain = text.replace(/\r\n/g, '\n');
  if (!plain.includes(injection.from)) throw new Error(`${injection.name}: not found`);
  const changed = plain.replace(injection.from, injection.to);
  try {
    writeFileSync(injection.file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
    const failed = run();
    const caught = injection.expect.every(name => failed.includes(name));
    const alone = caught && failed.every(name => injection.expect.includes(name));
    results.push({ injection: injection.name, caught, only: alone, failed });
    console.log(`${caught ? (alone ? 'CAUGHT' : 'CAUGHT (and more)') : 'MISSED'}: ${injection.name} -> ${failed.join(' | ')}`);
  } finally { writeFileSync(injection.file, text); }
}
if (!process.argv[2]) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/yard-layout-injections.json', `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), files: FILES, caught: results.filter(r => r.caught).length, of: results.length, results }, null, 2)}\n`);
}
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught`);
