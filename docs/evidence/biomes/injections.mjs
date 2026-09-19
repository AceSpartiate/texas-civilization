// Injects each regression the biomes' tests guard (tests/biomes.test.mjs, and the hunting test the biomes changed), runs the
// test file, and restores everything, checking the restore byte for byte. Writes docs/evidence/biomes/injections.json.
//
//   node docs/evidence/biomes/injections.mjs [case]
//
// A new test is not evidence until it has failed (CLAUDE.md): each case must fail exactly the tests it names, and no other.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const TEST = 'tests/biomes.test.mjs';
const cases = [
  { name: 'cypress swamp filed as marsh again, as in the week of 2026-09-15', expect: ['the country of 1836 stands where the research puts it'],
    edits: [['scripts/terrain/biomes.mjs', "  marsh: ['14900', '14950'],\n  'cypress-swamp': ['14800'],", "  marsh: ['14900', '14950', '14800'],\n  'cypress-swamp': [],"]] },
  { name: 'the hill savanna 40 in 100 closed woods again', expect: ['the Hill Country is a savanna'],
    edits: [['sim/woods.mjs', "      klass('open', 0.75, 3, 'large'), klass('motte', 0.2, 25, 'large', { kinds: [['live-oak', 0.6], ['texas-oak', 0.2], ['cedar-elm', 0.2]] }),\n      klass('cedar', 0.05, 30, 'pole', { kinds: [['cedar', 1]] }),",
      "      klass('open', 0.6, 6, 'large'), klass('motte', 0.4, 25, 'log'),"]] },
  { name: 'a town\'s fields grown up in pecan', expect: ['Béxar and the Alamo stand among fields'],
    edits: [['sim/woods.mjs', "    classes: [klass('field', 1, 0, null)], kinds: [],\n  },", "    classes: [klass('field', 0.5, 0, null), klass('grove', 0.5, 30, 'large')], kinds: [['pecan', 1]],\n  },"]] },
  { name: 'a dry prairie creek given its strip of timber again', expect: ['a creek keeps its timber only where it runs all year', 'a family with no timber on its land still raises a house'],
    note: 'the second is that test\'s premise: its Matagorda family\'s land gains the dry creeks\' timber, so it is no longer a family with none',
    edits: [['sim/woods.mjs', "if (PERENNIAL_STRIP.has(stand) && nearCreek(point, CREEK_STRIP_MILES, 'perennial'))", "if (PERENNIAL_STRIP.has(stand) && nearCreek(point, CREEK_STRIP_MILES, ['coastal-prairie', 'tallgrass-prairie'].includes(stand) ? undefined : 'perennial'))"]] },
  { name: 'the outside layer read in another numbering of the stands', expect: ['the country outside the box is filed by the same rules'],
    edits: [['sim/outside-woods.mjs', 'return g.stands[g.cells[row * g.columns + column]] || \'none\';', 'return g.stands[(g.cells[row * g.columns + column] + 1) % g.stands.length] || \'none\';']] },
  { name: 'a class of the week of 2026-09-15 read on the biomes', expect: ['a class made in the week of 2026-09-15 opens on its own grid'],
    edits: [['sim/woods.mjs', "  if (woods === WOODS_SOURCE_2016) return 'landfire';", "  if (woods === WOODS_SOURCE_2016) return 'biomes';"]] },
  { name: 'a jacal wanting logs for its posts', expect: ['a family with no timber on its land still raises a house'],
    edits: [['sim/houseplot.mjs', "      { id: 'posts', doing: 'cutting and setting the posts', work: 3 },", "      { id: 'posts', doing: 'cutting and setting the posts', work: 3, logs: { wall: 12 } },"]] },
  { name: 'the hunting ground placed three steps short of the cover', expect: ['a family hunts the cover nearest its own house', 'a stalk only ever moves somebody about the place they are standing'], test: 'tests/hunting.test.mjs',
    note: 'the second, an older test, also reads where the ground is',
    edits: [['sim/chores.mjs', 'const edge = r > HUNT_STEP ? { x: home.x + toward.x * (r - HUNT_STEP / 2), y: home.y + toward.y * (r - HUNT_STEP / 2) } : point;', 'const edge = r > HUNT_STEP ? { x: home.x + toward.x * (r - HUNT_STEP * 3), y: home.y + toward.y * (r - HUNT_STEP * 3) } : point;']] },
];

const only = process.argv[2];
const results = [];
for (const injection of cases.filter(c => !only || c.name.includes(only))) {
  const kept = new Map();
  try {
    for (const [file, from, to] of injection.edits) {
      const text = kept.get(file) ?? readFileSync(file, 'utf8');
      if (!kept.has(file)) kept.set(file, text);
      const normal = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
      if (!normal.includes(from)) throw new Error(`${injection.name}: not found in ${file}: ${from.slice(0, 60)}`);
      const edited = normal.replace(from, to);
      writeFileSync(file, text.includes('\r\n') ? edited.replace(/\n/g, '\r\n') : edited);
    }
    let output = '';
    try { output = execSync(`node --test ${injection.test || TEST}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64e6 }); } catch (error) { output = `${error.stdout}${error.stderr}`; }
    const failed = [...new Set([...output.matchAll(/^✖ (.+?) \(\d/gm)].map(m => m[1]))];
    const caught = injection.expect.every(name => failed.some(f => f.startsWith(name)));
    const alone = failed.every(f => injection.expect.some(name => f.startsWith(name)));
    results.push({ injection: injection.name, expected: injection.expect, ...(injection.note && { note: injection.note }), failed, caught, onlyThose: alone });
    console.log(`${caught && alone ? 'CAUGHT' : 'NOT AS EXPECTED'} ${injection.name}: ${failed.join(' | ') || 'nothing failed'}`);
  } finally {
    for (const [file, text] of kept) writeFileSync(file, text);
    for (const [file, text] of kept) if (readFileSync(file, 'utf8') !== text) throw new Error(`${file} not restored`);
  }
}
if (!only) writeFileSync('docs/evidence/biomes/injections.json', `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), sameComputerOnly: true, results }, null, 2)}\n`);
