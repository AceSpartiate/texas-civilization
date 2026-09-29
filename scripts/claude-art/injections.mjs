// Prove the Claude stand-in tests by injection (CLAUDE.md: "A new test is not evidence until it has failed"). Each injection
// makes the one regression a test guards, runs the test file, records which tests failed, and puts the file back exactly as
// it was (from memory, never from git, so uncommitted work is safe). Writes docs/evidence/claude-art/injections.json.
//
// Run: node scripts/claude-art/injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const at = path => ROOT + path;

function failing(testFile) {
  const run = spawnSync(process.execPath, ['--test', testFile], { cwd: ROOT, encoding: 'utf8' });
  const out = run.stdout + run.stderr;
  return [...out.matchAll(/^✖ (.+?) \(\d/gm)].map(m => m[1]).filter((name, i, all) => all.indexOf(name) === i);
}
function inject(files, change, testFile) {
  const saved = Object.fromEntries(files.map(file => [file, readFileSync(at(file), 'utf8')]));
  try {
    for (const file of files) writeFileSync(at(file), change(file, saved[file]));
    return failing(testFile);
  } finally { for (const file of files) writeFileSync(at(file), saved[file]); }
}
const json = (text, edit) => { const value = JSON.parse(text); edit(value); return JSON.stringify(value, null, 2) + '\n'; };
const STANDINS = 'tests/claude-standins.test.mjs', WORK = 'tests/work-art.test.mjs';

const cases = [
  { guards: 'every Claude frame and clip has its provenance', what: 'rust-chop-3 loses its written intent (the prompt) in the provenance record',
    run: () => inject(['docs/claude-art-provenance.json', 'public/assets/claude-standins/areas/chop.json'], (file, text) => json(text, v => { (v.entries || v.provenance)['rust-chop-3'].prompt = ''; }), STANDINS) },
  { guards: 'every stand-in is marked as Claude-drawn', what: 'rust-chop-2 is marked madeBy "astra" in its area JSON and the merged manifest',
    run: () => inject(['public/assets/claude-standins/atlas.json', 'public/assets/claude-standins/areas/chop.json'], (file, text) => json(text, v => { v.frames['rust-chop-2'].madeBy = 'astra'; }), STANDINS) },
  { guards: 'every Claude frame is named in the "Claude-drawn stand-ins" table', what: 'the area A row no longer names the chop clips or frames',
    run: () => inject(['docs/ART_REQUESTS.md'], (file, text) => text.replace(/`claude-chop\.png`: `\*-chop`[^|]*/, '`claude-chop.png`: felling, for all eight '), STANDINS) },
  { guards: 'every `stand-in:` in the code names an item', what: 'a stand-in comment naming a request that is not on the list',
    run: () => inject(['public/work-art.js'], (file, text) => text.replace('export const WORK_REQUEST', '// stand-in: docs/ART_REQUESTS.md, request 2099-01-01 - a thing nobody asked for.\nexport const WORK_REQUEST'), STANDINS) },
  { guards: 'the "What Astra still needs to make" section', what: 'the generated list is hand-edited (an item dropped) without rerunning the writer',
    run: () => inject(['docs/ART_REQUESTS.md'], (file, text) => text.replace(/- \[ \] \*\*A6\*\*[^\n]*\n/, ''), STANDINS) },
  { guards: 'every Claude frame is an item on Astra\'s list', what: 'no item names the wood pile any more (the plan and the docs regenerated to match)',
    run: () => {
      const plan = 'scripts/claude-art/plan.mjs';
      return inject([plan], (file, text) => text.replace("names: ['wood-pile-*'],", 'names: [],'), STANDINS).filter(name => !/stale|what the plan writes/.test(name));
    } },
  { guards: 'every swing: hands on a rigid handle, feet planted, an even arc', what: 'the chop\'s front foot slides forward on the pull-free frame',
    run: () => inject(['scripts/claude-art/kit/poses.mjs'], (file, text) => text.replace("{ view: 'e', pelvis: P(F, 0, -6), lean: 30, tilt: -10, twist: 0, feet: stance,", "{ view: 'e', pelvis: P(F, 0, -6), lean: 30, tilt: -10, twist: 0, feet: { ...stance, near: foot(F, 17) },"), 'tests/claude-rig.test.mjs') },
  { guards: 'every swing: hands on a rigid handle ...', what: 'the chop\'s wind-up grip is put out of the arms\' reach, so the bottom hand leaves the handle',
    run: () => inject(['scripts/claude-art/kit/poses.mjs'], (file, text) => text.replace('tool: axe([-8, 16], [-38, 38], 0.45)', 'tool: axe([-30, 16], [-60, 38], 0.45)'), 'tests/claude-rig.test.mjs') },
  { guards: 'each swing holds its wind-up and its strike', what: 'the chop is timed evenly, every frame 200 ms',
    run: () => inject(['scripts/claude-art/kit/poses.mjs'], (file, text) => text.replace('chop: { durations: [380, 110, 90, 300, 150, 170], beat: 3 }', 'chop: { durations: [200, 200, 200, 200, 200, 200], beat: 3 }'), 'tests/claude-rig.test.mjs').filter(name => !/chop clips are/.test(name)) },
  { guards: 'a stroke with a drawn cycle ... the stand-in tool goes', what: 'drawnStroke keeps the stand-in axe over the drawn cycle',
    run: () => inject(['public/work-art.js'], (file, text) => text.replace('const { tool, motion, drawn, ...rest } = stroke;', 'const { motion, drawn, ...rest } = stroke;'), WORK) },
];

const results = cases.map(c => ({ ...c, failed: c.run() }));
for (const r of results) console.log(`${r.failed.length ? 'FAILED as it should' : 'DID NOT FAIL'}: ${r.what}\n    -> ${r.failed.join(' | ') || '(nothing)'}`);
const clean = { standins: failing(STANDINS), work: failing(WORK), rig: failing('tests/claude-rig.test.mjs') };
console.log(`clean runs: ${clean.standins.length + clean.work.length + clean.rig.length} failing`);
mkdirSync(at('docs/evidence/claude-art'), { recursive: true });
writeFileSync(at('docs/evidence/claude-art/injections.json'), JSON.stringify({
  record: 'The Claude stand-in tests proved by injection (scripts/claude-art/injections.mjs)', date: new Date().toISOString().slice(0, 10),
  results: results.map(({ guards, what, failed }) => ({ guards, injected: what, failed })), cleanRunFailures: clean,
}, null, 2) + '\n');
if (results.some(r => !r.failed.length) || clean.standins.length || clean.work.length || clean.rig.length) process.exitCode = 1;
